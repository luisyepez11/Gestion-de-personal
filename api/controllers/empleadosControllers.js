const db = require('../database/conexin.js')

class empleados{
    constructor(){

    };
    eliminar(req,res){
        const {id} =req.params
        db.query('DELETE FROM empleados WHERE empleado_id = ? ; ',[id],(err,raws)=>{
            if (err){
                res.status(400).send(err)
            }
            res.status(200).json({raws})
        })
        db.query('UPDATE empleados SET empleado_id = empleado_id - 1 WHERE empleado_id > ?', [id]);
    };
    actualizar(req,res){
        const {nombre, apellido, cedula, fecha_nacimiento,fecha_contratacion,direccion,email,telefon,rol_id,cargo,departamento_id,sueldo,id}=req.body;
        db.query(`UPDATE empleados SET nombre = ?,apellido = ?,cedula = ?,fecha_nacimiento = ?,fecha_contratacion = ?,direccion = ?,email = ?,telefon = ?,rol_id = ?,cargo = ?,departamento_id = ?,sueldo = ? WHERE empleado_id = ?`,[nombre, apellido, cedula, fecha_nacimiento,fecha_contratacion,direccion,email,telefon,rol_id,cargo,departamento_id,sueldo,id])
    };
    
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
        const {nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, direccion, email, telefono, rol_id, cargo, departamento_id, sueldo} = req.body;
    
        // Validación básica de campos requeridos
        if (!nombre || !cedula) {
            return res.status(400).json({ 
                success: false,
                error: "Nombre y cédula son campos obligatorios" 
            });
        }
    
        db.query(
            `INSERT INTO empleados 
            (nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, direccion, email, telefono, rol_id, cargo, departamento_id, sueldo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, direccion, email, telefono, rol_id, cargo, departamento_id, sueldo],
            (err, result) => {
                if (err) {
                    console.error('Error en la consulta SQL:', err);
                    return res.status(500).json({
                        success: false,
                        error: "Error al insertar en la base de datos",
                        details: err.message
                    });
                }
                
                // Verificación robusta del resultado
                const insertedId = result?.insertId || 
                                 (result[0] && result[0].insertId) || 
                                 null;
    
                if (insertedId === null) {
                    console.error('No se pudo obtener insertId:', result);
                    return res.status(500).json({
                        success: false,
                        error: "No se pudo obtener el ID del nuevo registro",
                        details: result
                    });
                }
    
                res.status(201).json({
                    success: true,
                    id: insertedId,
                    message: "Empleado registrado exitosamente"
                });
            }
        );
    }
    consular_uno(req,res){
        const {id}=req.params
        try{
            db.query(`
                SELECT 
                    e.*, 
                    r.nombre AS nombre_rol, 
                    d.nombre AS nombre_departamento
                FROM 
                    empleados e
                LEFT JOIN 
                    roles r ON e.rol_id = r.rol_id
                LEFT JOIN 
                    departamentos d ON e.departamento_id = d.departamento_id
                WHERE 
                    e.empleado_id = ?`,[id],(err,rows)=>{
                if(err){
                    res.status(400).send(err)
                }
                res.status(200).json({rows})
            });

        }catch(err){
            res.status(500).send(err.mesagge);
        }
    };
}
module.exports = new empleados(); 