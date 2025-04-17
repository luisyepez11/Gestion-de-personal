const { raw } = require('mysql2')
const db = require('../database/conexin.js')
class pago_empleado{
    constructor(){

    };
    agregar(req,res){
        const {fecha_pago, empleado_id,concepto,monto} = req.body;
        db.query(
            `INSERT INTO pagos_empleados 
            (fecha_pago, empleado_id,concepto,monto) 
            VALUES (?,?,?,?)`,
            [fecha_pago, empleado_id,concepto,monto],
            (err, result) => {
                if (err) {
                    console.error('Error en la consulta SQL:', err);
                    return res.status(500).json({
                        success: false,
                        error: "Error al insertar en la base de datos",
                        details: err.message
                    });
                }
            })
    }
    eliminarYReorganizarEmpleado(req, res) {
        const { empleado_id } = req.body;
    
        // Primero eliminamos los registros del empleado específico
        db.query(
            `DELETE FROM pagos_empleados WHERE empleado_id = ?`,
            [empleado_id],
            (errDelete, resultDelete) => {
                if (errDelete) {
                    console.error('Error al eliminar registros:', errDelete);
                    return res.status(500).json({
                        success: false,
                        error: "Error al eliminar registros del empleado",
                        details: errDelete.message
                    });
                }
    
                // Luego actualizamos los empleado_id mayores al eliminado
                db.query(
                    `UPDATE pagos_empleados SET empleado_id = empleado_id - 1 WHERE empleado_id > ?`,
                    [empleado_id],
                    (errUpdate, resultUpdate) => {
                        if (errUpdate) {
                            console.error('Error al actualizar registros:', errUpdate);
                            return res.status(500).json({
                                success: false,
                                error: "Error al reorganizar IDs de empleados",
                                details: errUpdate.message
                            });
                        }
    
                        // Respuesta exitosa
                        return res.status(200).json({
                            success: true,
                            message: `Se eliminaron ${resultDelete.affectedRows} registros del empleado ${empleado_id} y se actualizaron ${resultUpdate.affectedRows} registros`,
                            deleted: resultDelete.affectedRows,
                            updated: resultUpdate.affectedRows
                        });
                    }
                );
            }
        );
    }
    
}
module.exports = new pago_empleado();