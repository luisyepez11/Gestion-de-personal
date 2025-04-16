const db = require('../database/conexin.js')

class empleados{
    constructor(){

    };
    eliminar(req,res){
        const {id} =req.params
        db.query('DELETE FROM empleados WHERE empleado_id = ?', [id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                return db.rollback(() => {
                    res.status(400).json({ error: 'Error al eliminar empleado', details: deleteErr });
                });
            }
        });

        db.query('UPDATE empleados SET empleado_id = empleado_id - 1 WHERE empleado_id > ?', [id], (updateErr, updateResult) => {
            if (updateErr) {
                return db.rollback(() => {
                    res.status(400).json({ error: 'Error al actualizar IDs', details: updateErr });
                });
            }
        });

        db.query('ALTER TABLE empleados AUTO_INCREMENT = AUTO_INCREMENT - 1', (alterErr, alterResult) => {
            if (alterErr) {
                return db.rollback(() => {
                    res.status(400).json({ error: 'Error al ajustar auto_increment', details: alterErr });
                });
            }
    });
        
    };
    actualizar(req,res){
        try {
            const { nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, direccion, email, telefono, rol_id, cargo, departamento_id, sueldo} = req.body;
            db.query(
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
                WHERE cedula = ?`,
                [nombre, apellido, cedula, fecha_nacimiento, fecha_contratacion, direccion, email, telefono, rol_id, cargo, departamento_id, sueldo, cedula],
                (error, results) => {
                    if (error) {
                        console.error('Error al actualizar empleado:', error);
                        return res.status(500).json({ error: 'Error interno del servidor' });
                    }
                    
                    if (results.affectedRows === 0) {
                        return res.status(404).json({ error: 'Empleado no encontrado' });
                    }
                    
                    res.status(200).json({ message: 'Empleado actualizado correctamente' });
                }
            );
        } catch (error) {
            console.error('Error inesperado:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
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
                    e.cedula = ?`,[id],(err,rows)=>{
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