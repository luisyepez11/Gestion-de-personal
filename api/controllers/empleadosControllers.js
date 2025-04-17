const db = require('../database/conexin.js')

class empleados{
    constructor(){

    };
    eliminar(req, res) {
        const { id } = req.params;
    
        // Validación del ID
        if (!id || isNaN(id)) {
            console.error('ID no válido recibido:', id);
            return res.status(400).json({ 
                error: 'ID no válido',
                details: `El ID proporcionado (${id}) no es un número válido`
            });
        }
    
        console.log(`Iniciando proceso de eliminación para empleado ID: ${id}`);
    
        db.beginTransaction((beginErr) => {
            if (beginErr) {
                console.error('Error al iniciar transacción:', beginErr);
                return res.status(500).json({ 
                    error: 'Error al iniciar transacción', 
                    details: beginErr.message 
                });
            }
    
            // 1. Eliminar registros relacionados primero
            const queries = [
                { query: 'DELETE FROM nominas WHERE empleado_id = ?', params: [id], name: 'nominas' },
                { query: 'DELETE FROM pagos_empleados WHERE empleado_id = ?', params: [id], name: 'pagos_empleados' }
            ];
    
            const executeQueries = (index, results = {}) => {
                if (index >= queries.length) {
                    // Todas las eliminaciones secundarias completadas, ahora eliminar el empleado
                    db.query('DELETE FROM empleados WHERE empleado_id = ?', [id], (deleteErr, deleteResult) => {
                        if (deleteErr) {
                            return db.rollback(() => {
                                console.error('Error al eliminar empleado:', deleteErr);
                                res.status(400).json({ 
                                    error: 'Error al eliminar empleado', 
                                    details: deleteErr.message 
                                });
                            });
                        }
    
                        if (deleteResult.affectedRows === 0) {
                            return db.rollback(() => {
                                console.error('No se encontró empleado con ID:', id);
                                res.status(404).json({ 
                                    error: 'Empleado no encontrado',
                                    details: `No existe un empleado con ID ${id}`
                                });
                            });
                        }
    
                        // Éxito - confirmar transacción
                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => {
                                    console.error('Error al confirmar transacción:', commitErr);
                                    res.status(500).json({ 
                                        error: 'Error al confirmar cambios', 
                                        details: commitErr.message 
                                    });
                                });
                            }
    
                            console.log(`Empleado ID ${id} eliminado exitosamente`);
                            res.json({ 
                                success: true, 
                                message: 'Empleado eliminado con todos sus registros asociados',
                                details: {
                                    empleadoEliminado: deleteResult.affectedRows,
                                    registrosRelacionados: results
                                }
                            });
                        });
                    });
                    return;
                }
    
                const currentQuery = queries[index];
                db.query(currentQuery.query, currentQuery.params, (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error(`Error al eliminar de ${currentQuery.name}:`, err);
                            res.status(400).json({ 
                                error: `Error al eliminar registros de ${currentQuery.name}`, 
                                details: err.message 
                            });
                        });
                    }
    
                    results[currentQuery.name] = result.affectedRows;
                    executeQueries(index + 1, results);
                });
            };
    
            // Iniciar la cadena de eliminaciones
            executeQueries(0);
        });
    }
    actualizar(req, res) {
        try {
            // Asegurar consistencia en los nombres de campos
            const { 
                id, 
                nombre, 
                apellido, 
                cedula, 
                fecha_nacimiento, 
                fecha_contratacion, 
                direccion, 
                email, 
                telefono, 
                rol_id, 
                cargo, 
                departamento_id, 
                sueldo, 
                cuenta  // Mantener consistencia con el frontend
            } = req.body;
    
            // Validación mejorada
            const camposRequeridos = {
                id: 'ID del empleado',
                nombre: 'Nombre',
                cedula: 'Cédula',
                sueldo: 'Sueldo',
                cuenta: 'Número de cuenta'
            };
    
            const faltantes = Object.entries(camposRequeridos)
                .filter(([key]) => !req.body[key])
                .map(([_, name]) => name);
    
            if (faltantes.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Campos requeridos faltantes: ${faltantes.join(', ')}`,
                    camposFaltantes: faltantes
                });
            }
    
            // Iniciar transacción
            db.beginTransaction(async (beginErr) => {
                if (beginErr) {
                    return res.status(500).json({
                        success: false,
                        error: "Error al iniciar transacción",
                        details: beginErr.message
                    });
                }
    
                try {
                    // 1. Actualizar empleado
                    const [empResults] = await db.promise().query(
                        `UPDATE empleados SET 
                            nombre = ?,
                            apellido = ?,
                            cedula = ?,
                            fecha_nacimiento = ?,
                            fecha_contratacion = ?,
                            direccion = ?,
                            email = ?,
                            telefono = ?,
                            rol_id = ?,
                            cargo = ?,
                            departamento_id = ?,
                            sueldo = ? 
                        WHERE empleado_id = ?`,
                        [nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, 
                         direccion, email, telefono, rol_id, cargo, departamento_id, sueldo, id]
                    );
    
                    if (empResults.affectedRows === 0) {
                        await db.promise().rollback();
                        return res.status(404).json({
                            success: false,
                            error: "Empleado no encontrado"
                        });
                    }
    
                    // 2. Actualizar nómina
                    const [nomResults] = await db.promise().query(
                        `UPDATE nominas SET 
                            salario_base = ?,
                            salario_neto = ?,
                            numero_cuenta = ?
                        WHERE empleado_id = ?`,
                        [sueldo, sueldo, cuenta, id]
                    );
    
                    await db.promise().commit();
    
                    res.status(200).json({
                        success: true,
                        message: "Actualización completada",
                        detalles: {
                            empleado: empResults.affectedRows,
                            nomina: nomResults.affectedRows
                        }
                    });
    
                } catch (error) {
                    await db.promise().rollback();
                    throw error;
                }
            });
    
        } catch (error) {
            console.error('Error en actualización:', error);
            res.status(500).json({ 
                success: false,
                error: error.message || "Error interno del servidor",
                details: error.stack // Solo para desarrollo
            });
        }
    }
    consular(req,res){
        try{
            db.query(`SELECT 
                e.*, 
                r.nombre AS nombre_rol, 
                d.nombre AS nombre_departamento
            FROM 
                empleados e
            LEFT JOIN 
                roles r ON e.rol_id = r.rol_id
            LEFT JOIN 
                departamentos d ON e.departamento_id = d.departamento_id`,(err,rows)=>{
                if(err){
                    res.status(400).send(err)
                }
                res.status(200).json({rows})
            });

        }catch(err){
            res.status(500).send(err.mesagge);
        }
    }
    agregar(req, res) {
        const { nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, 
                direccion, email, telefono, rol_id, cargo, departamento_id, 
                sueldo, numero_cuenta } = req.body;
    
        // Validación de campos requeridos
        if (!nombre || !cedula || !sueldo || !numero_cuenta) {
            return res.status(400).json({ 
                success: false,
                error: "Nombre, cédula, sueldo y número de cuenta son campos obligatorios" 
            });
        }
    
        // Iniciar transacción
        db.beginTransaction((beginErr) => {
            if (beginErr) {
                return res.status(500).json({
                    success: false,
                    error: "Error al iniciar transacción",
                    details: beginErr.message
                });
            }
    
            // 1. Insertar empleado
            db.query(
                `INSERT INTO empleados 
                (nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, 
                 direccion, email, telefono, rol_id, cargo, departamento_id, sueldo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, 
                 direccion, email, telefono, rol_id, cargo, departamento_id, sueldo],
                (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                error: "Error al insertar empleado",
                                details: err.message
                            });
                        });
                    }
    
                    const empleadoId = result.insertId;
    
                    // 2. Insertar nómina
                    db.query(
                        `INSERT INTO nominas 
                        (salario_base, salario_neto, empleado_id, numero_cuenta) 
                        VALUES (?, ?, ?, ?)`,
                        [sueldo, sueldo, empleadoId, numero_cuenta],
                        (nominaErr, nominaResult) => {
                            if (nominaErr) {
                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        error: "Error al crear registro de nómina",
                                        details: nominaErr.message
                                    });
                                });
                            }
    
                            // Confirmar transacción
                            db.commit((commitErr) => {
                                if (commitErr) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            success: false,
                                            error: "Error al confirmar transacción",
                                            details: commitErr.message
                                        });
                                    });
                                }
    
                                res.status(201).json({
                                    success: true,
                                    id: empleadoId,
                                    message: "Empleado y nómina registrados exitosamente",
                                    nominaId: nominaResult.insertId
                                });
                            });
                        }
                    );
                }
            );
        });
    }
    consular_uno(req,res){
        const {id}=req.params
        try{
            db.query(`
                SELECT 
            e.*, 
            r.nombre AS nombre_rol, 
            d.nombre AS nombre_departamento,
            n.numero_cuenta AS numero_cuenta_empleado
        FROM 
            empleados e
        LEFT JOIN 
            roles r ON e.rol_id = r.rol_id
        LEFT JOIN 
            departamentos d ON e.departamento_id = d.departamento_id
        LEFT JOIN 
            nominas n ON e.empleado_id = n.empleado_id  -- Asumo que debería ser esta relación
        WHERE 
        e.empleado_id = ?`,[id],(err,rows)=>{
                if(err){
                    res.status(400).send(err)
                }
                res.status(200).json(rows)
            });

        }catch(err){
            res.status(500).send(err.mesagge);
        }
    };
}
module.exports = new empleados(); 