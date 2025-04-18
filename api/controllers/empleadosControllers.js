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
                // 1. Primero verificar si el empleado existe
                const [empleadoExistente] = await db.promise().query(
                    'SELECT * FROM empleados WHERE empleado_id = ?', 
                    [id]
                );
    
                if (empleadoExistente.length === 0) {
                    await db.promise().rollback();
                    console.error('No se encontró empleado con ID:', id);
                    return res.status(404).json({ 
                        success: false,
                        error: 'Empleado no encontrado',
                        details: `No existe un empleado con ID ${id}`
                    });
                }
    
                // 2. Eliminar todos los registros dependientes (orden correcto para evitar restricciones)
                const tablasRelacionadas = [
                    'usuarios',    // Primero eliminar usuarios
                    'pagos_empleados',
                    'nominas',
                    'horarios'
                ];
    
                const resultadosEliminacion = {};
                
                for (const tabla of tablasRelacionadas) {
                    try {
                        const [resultado] = await db.promise().query(
                            `DELETE FROM ${tabla} WHERE empleado_id = ?`,
                            [id]
                        );
                        resultadosEliminacion[tabla] = resultado.affectedRows;
                    } catch (error) {
                        console.error(`Error al eliminar de ${tabla}:`, error);
                        resultadosEliminacion[tabla] = `Error: ${error.code || error.message}`;
                    }
                }
    
                const [deleteResult] = await db.promise().query(
                    'DELETE FROM empleados WHERE empleado_id = ?', 
                    [id]
                );
    
                if (deleteResult.affectedRows === 0) {
                    await db.promise().rollback();
                    return res.status(500).json({ 
                        success: false,
                        error: 'Error inesperado',
                        details: 'No se pudo eliminar el empleado después de eliminar registros relacionados'
                    });
                }
    
                // 4. Opcional: Resetear AUTO_INCREMENT si la tabla queda vacía
                try {
                    const [maxId] = await db.promise().query(
                        'SELECT MAX(empleado_id) as maxId FROM empleados'
                    );
                    
                    if (maxId[0].maxId === null) {
                        await db.promise().query(
                            'ALTER TABLE empleados AUTO_INCREMENT = 1'
                        );
                        console.log('AUTO_INCREMENT resetado a 1');
                    }
                } catch (autoIncrError) {
                    console.warn('No se pudo ajustar AUTO_INCREMENT:', autoIncrError);
                }
    
                await db.promise().commit();
    
                console.log(`Empleado ID ${id} eliminado exitosamente`);
                return res.json({ 
                    success: true, 
                    message: 'Empleado eliminado con todos sus registros asociados',
                    details: {
                        empleadoEliminado: deleteResult.affectedRows,
                        registrosRelacionados: resultadosEliminacion
                    }
                });
    
            } catch (error) {
                await db.promise().rollback();
                console.error('Error en la transacción:', error);
                
                if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ 
                        success: false,
                        error: 'No se puede eliminar el empleado',
                        details: 'Existen registros asociados en otras tablas que no pudieron ser eliminados',
                        sqlMessage: error.sqlMessage
                    });
                }
                
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al eliminar empleado',
                    details: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        });
    }
    actualizar(req, res) {
        try {
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
                dia,
                usuario,  
                clave    
            } = req.body;
    
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
    
            db.beginTransaction(async (beginErr) => {
                if (beginErr) {
                    return res.status(500).json({
                        success: false,
                        error: "Error al iniciar transacción",
                        details: beginErr.message
                    });
                }
    
                try {
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
    
                    const [nomResults] = await db.promise().query(
                        `UPDATE nominas SET 
                            salario_base = ?,
                            salario_neto = ?,
                            numero_cuenta = ?
                        WHERE empleado_id = ?`,
                        [sueldo, sueldo, cuenta, id]
                    );

                    const [existingHorario] = await db.promise().query(
                        `SELECT * FROM horarios WHERE empleado_id = ?`,
                        [id]
                    );
    
                    let horarioResults;
                    if (existingHorario.length > 0) {
                        [horarioResults] = await db.promise().query(
                            `UPDATE horarios SET 
                                turno = ?,
                                dia = ?
                            WHERE empleado_id = ?`,
                            [turno, dia, id]
                        );
                    } else {
                        [horarioResults] = await db.promise().query(
                            `INSERT INTO horarios 
                            (turno, dia, empleado_id) 
                            VALUES (?, ?, ?)`,
                            [turno, dia, id]
                        );
                    }
    
                    let usuarioResults = null;
                    if (usuario || clave) {
          
                        const [existingUsuario] = await db.promise().query(
                            `SELECT * FROM usuarios WHERE empleado_id = ?`,
                            [id]
                        );
    
                        if (existingUsuario.length > 0) {
  
                            let updateQuery = 'UPDATE usuarios SET ';
                            const updateParams = [];
                            
                            if (usuario) {
                                updateQuery += 'usuario = ?, ';
                                updateParams.push(usuario);
                            }
                            
                            if (clave) {
                                updateQuery += 'clave = ?, ';
                                updateParams.push(clave); 
                            }
               
                            updateQuery = updateQuery.slice(0, -2);
                            updateQuery += ' WHERE empleado_id = ?';
                            updateParams.push(id);
                            
                            [usuarioResults] = await db.promise().query(updateQuery, updateParams);
                        } else if (usuario && clave) {
                            [usuarioResults] = await db.promise().query(
                                `INSERT INTO usuarios 
                                (usuario, clave, empleado_id) 
                                VALUES (?, ?, ?)`,
                                [usuario, clave, id] 
                            );
                        }
                    }
    
                    await db.promise().commit();
    
                    res.status(200).json({
                        success: true,
                        message: "Actualización completada",
                        detalles: {
                            empleado: empResults.affectedRows,
                            nomina: nomResults.affectedRows,
                            horario: horarioResults.affectedRows || (existingHorario.length > 0 ? 0 : 1),
                            usuario: usuarioResults ? usuarioResults.affectedRows || 1 : 'No modificado'
                        }
                    });
    
                } catch (error) {
                    await db.promise().rollback();
                    console.error('Error en transacción:', error);
                    res.status(500).json({ 
                        success: false,
                        error: error.message || "Error interno del servidor",
                        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                    });
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
        const { 
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
            numero_cuenta, 
            turno, 
            dia,
            usuario,  
            clave     
        } = req.body;
    
  
        const camposRequeridos = {
            nombre: 'Nombre',
            cedula: 'Cédula',
            sueldo: 'Sueldo',
            numero_cuenta: 'Número de cuenta',
            turno: 'Turno',
            dia: 'Día',
            usuario: 'Nombre de usuario', 
            clave: 'Contraseña'          
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
    

        db.beginTransaction((beginErr) => {
            if (beginErr) {
                return res.status(500).json({
                    success: false,
                    error: "Error al iniciar transacción",
                    details: beginErr.message
                });
            }
    

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
    
                                   
                                    // const claveEncriptada = encriptarClave(clave)
                                    
                                    db.query(
                                        `INSERT INTO usuarios 
                                        (usuario, clave, empleado_id) 
                                        VALUES (?, ?, ?)`,
                                        [usuario, clave, empleadoId],
                                        (usuarioErr, usuarioResult) => {
                                            if (usuarioErr) {
                                                return db.rollback(() => {
                                                    res.status(500).json({
                                                        success: false,
                                                        error: "Error al crear usuario",
                                                        details: usuarioErr.message
                                                    });
                                                });
                                            }
    
                              
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
                                                    message: "Empleado, nómina, horario y usuario registrados exitosamente",
                                                    detalles: {
                                                        nominaId: nominaResult.insertId,
                                                        horarioId: horarioResult.insertId,
                                                        usuarioId: usuarioResult.insertId
                                                    }
                                                });
                                            });
                                        }
                                    );
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
                    h.dia,
                    u.usuario,
                    u.clave
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
                LEFT JOIN
                    usuarios u ON e.empleado_id = u.empleado_id
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
    
                console.log('Resultados de consulta:', results);
                
                if (!results || results.length === 0) {
                    console.log('No se encontró empleado con ID:', id);
                    return res.status(404).json({
                        success: false,
                        message: "Empleado no encontrado",
                        details: `No existe empleado con ID ${id}`
                    });
                }
    
                try {
                    const empleado = {
                        ...results[0],
                        horario: {
                            turno: results[0].turno || null,
                            dia: results[0].dia || null
                        },
                        credenciales: results[0].usuario ? {
                            usuario: results[0].usuario,
                            clave: results[0].clave 
                        } : null
                    };
    
       
                    delete empleado.turno;
                    delete empleado.dia;
                    delete empleado.clave;
                    delete empleado.usuario;
    
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