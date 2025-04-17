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
                success: false,
                error: 'ID no válido',
                details: `El ID proporcionado (${id}) no es un número válido`
            });
        }
    
        console.log(`Iniciando proceso de eliminación para empleado ID: ${id}`);
    
        db.beginTransaction(async (beginErr) => {
            if (beginErr) {
                console.error('Error al iniciar transacción:', beginErr);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al iniciar transacción', 
                    details: beginErr.message 
                });
            }
    
            try {
                // 1. Eliminar registros relacionados
                const queries = [
                    { query: 'DELETE FROM nominas WHERE empleado_id = ?', params: [id], name: 'nominas' },
                    { query: 'DELETE FROM pagos_empleados WHERE empleado_id = ?', params: [id], name: 'pagos_empleados' },
                    { query: 'DELETE FROM horarios WHERE empleado_id = ?', params: [id], name: 'horarios' }
                ];
    
                // Ejecutar todas las consultas de eliminación
                const results = {};
                for (const queryObj of queries) {
                    const [result] = await db.promise().query(queryObj.query, queryObj.params);
                    results[queryObj.name] = result.affectedRows;
                }
    
                // 2. Eliminar el empleado
                const [deleteResult] = await db.promise().query(
                    'DELETE FROM empleados WHERE empleado_id = ?', 
                    [id]
                );
    
                if (deleteResult.affectedRows === 0) {
                    await db.promise().rollback();
                    console.error('No se encontró empleado con ID:', id);
                    return res.status(404).json({ 
                        success: false,
                        error: 'Empleado no encontrado',
                        details: `No existe un empleado con ID ${id}`
                    });
                }
    
                // 3. Verificar y ajustar AUTO_INCREMENT si es necesario
                try {
                    const [maxId] = await db.promise().query(
                        'SELECT MAX(empleado_id) as maxId FROM empleados'
                    );
                    
                    if (maxId[0].maxId === null) {
                        // Si la tabla está vacía, resetear el AUTO_INCREMENT
                        await db.promise().query(
                            'ALTER TABLE empleados AUTO_INCREMENT = 1'
                        );
                        console.log('AUTO_INCREMENT resetado a 1');
                    }
                } catch (autoIncrError) {
                    console.warn('No se pudo ajustar AUTO_INCREMENT:', autoIncrError);
                    // No hacemos rollback por este error menor
                }
    
                // Confirmar transacción
                await db.promise().commit();
    
                console.log(`Empleado ID ${id} eliminado exitosamente`);
                return res.json({ 
                    success: true, 
                    message: 'Empleado eliminado con todos sus registros asociados',
                    details: {
                        empleadoEliminado: deleteResult.affectedRows,
                        registrosRelacionados: results
                    }
                });
    
            } catch (error) {
                await db.promise().rollback();
                console.error('Error en la transacción:', error);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al eliminar empleado',
                    details: error.message
                });
            }
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
                cuenta,
                turno,
                dia
            } = req.body;
    
            // Validación mejorada
            const camposRequeridos = {
                id: 'ID del empleado',
                nombre: 'Nombre',
                cedula: 'Cédula',
                sueldo: 'Sueldo',
                cuenta: 'Número de cuenta',
                turno: 'Turno',
                dia: 'Día'
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
    
                    // 3. Actualizar o insertar horario
                    // Primero verificamos si existe un horario para este empleado
                    const [existingHorario] = await db.promise().query(
                        `SELECT * FROM horarios WHERE empleado_id = ?`,
                        [id]
                    );
    
                    let horarioResults;
                    if (existingHorario.length > 0) {
                        // Si existe, actualizamos
                        [horarioResults] = await db.promise().query(
                            `UPDATE horarios SET 
                                turno = ?,
                                dia = ?
                            WHERE empleado_id = ?`,
                            [turno, dia, id]
                        );
                    } else {
                        // Si no existe, insertamos nuevo registro
                        [horarioResults] = await db.promise().query(
                            `INSERT INTO horarios 
                            (turno, dia, empleado_id) 
                            VALUES (?, ?, ?)`,
                            [turno, dia, id]
                        );
                    }
    
                    await db.promise().commit();
    
                    res.status(200).json({
                        success: true,
                        message: "Actualización completada",
                        detalles: {
                            empleado: empResults.affectedRows,
                            nomina: nomResults.affectedRows,
                            horario: horarioResults.affectedRows || 1 // Si fue insert, affectedRows puede ser 0
                        }
                    });
    
                } catch (error) {
                    await db.promise().rollback();
                    console.error('Error en transacción:', error);
                    throw error;
                }
            });
    
        } catch (error) {
            console.error('Error en actualización:', error);
            res.status(500).json({ 
                success: false,
                error: error.message || "Error interno del servidor",
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
                sueldo, numero_cuenta, turno, dia } = req.body;
    
        // Validación de campos requeridos
        if (!nombre || !cedula || !sueldo || !numero_cuenta || !turno || !dia) {
            return res.status(400).json({ 
                success: false,
                error: "Nombre, cédula, sueldo, número de cuenta, turno y día son campos obligatorios" 
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
    
                            // 3. Insertar horario
                            db.query(
                                `INSERT INTO horarios 
                                (turno, dia, empleado_id) 
                                VALUES (?, ?, ?)`,
                                [turno, dia, empleadoId],
                                (horarioErr, horarioResult) => {
                                    if (horarioErr) {
                                        return db.rollback(() => {
                                            res.status(500).json({
                                                success: false,
                                                error: "Error al crear registro de horario",
                                                details: horarioErr.message
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
                                            message: "Empleado, nómina y horario registrados exitosamente",
                                            nominaId: nominaResult.insertId,
                                            horarioId: horarioResult.insertId
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }
    consultar_uno(req, res) {
        const { id } = req.params;
        console.log(`Consultando empleado con ID: ${id}`); // Log para diagnóstico
        
        if (!id || isNaN(id)) {
            console.error('ID inválido recibido:', id);
            return res.status(400).json({
                success: false,
                message: "ID de empleado inválido",
                error: "El ID debe ser un número válido"
            });
        }
    
        try {
            console.log('Ejecutando consulta SQL...');
            db.query(`
                SELECT 
                    e.*, 
                    r.nombre AS nombre_rol, 
                    d.nombre AS nombre_departamento,
                    n.numero_cuenta AS numero_cuenta,
                    h.turno,
                    h.dia
                FROM 
                    empleados e
                LEFT JOIN 
                    roles r ON e.rol_id = r.rol_id
                LEFT JOIN 
                    departamentos d ON e.departamento_id = d.departamento_id
                LEFT JOIN 
                    nominas n ON e.empleado_id = n.empleado_id
                LEFT JOIN
                    horarios h ON e.empleado_id = h.empleado_id
                WHERE 
                    e.empleado_id = ?`, [id], (err, results) => {
                    
                if (err) {
                    console.error('Error en consulta SQL:', err);
                    return res.status(500).json({
                        success: false,
                        message: "Error en la base de datos",
                        error: err.message,
                        sqlError: err
                    });
                }
    
                console.log('Resultados de consulta:', results); // Ver qué devuelve la consulta
                
                if (!results || results.length === 0) {
                    console.log('No se encontró empleado con ID:', id);
                    return res.status(404).json({
                        success: false,
                        message: "Empleado no encontrado",
                        details: `No existe empleado con ID ${id}`
                    });
                }
    
                try {
                    // Formatear la respuesta
                    const empleado = {
                        ...results[0],
                        horario: {
                            turno: results[0].turno || null,
                            dia: results[0].dia || null
                        }
                    };
    
                    // Eliminar campos duplicados
                    delete empleado.turno;
                    delete empleado.dia;
    
                    console.log('Datos formateados para respuesta:', empleado);
                    
                    res.status(200).json({
                        success: true,
                        data: empleado
                    });
    
                } catch (formatError) {
                    console.error('Error al formatear respuesta:', formatError);
                    res.status(500).json({
                        success: false,
                        message: "Error al procesar datos",
                        error: formatError.message
                    });
                }
            });
        } catch (err) {
            console.error('Error general en consultar_uno:', err);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    }
    
}
module.exports = new empleados(); 