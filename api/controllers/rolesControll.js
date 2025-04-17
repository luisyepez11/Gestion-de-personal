const { raw } = require('mysql2')
const db = require('../database/conexin.js')
class roles{
    constructor(){

    };
    cargar(req,res){
        db.query("SELECT rol_id,nombre FROM roles;",(error,rows)=>{
            try{
                if(error){
                    res.status(400).send(err)
                }
                res.status(200).json(rows);
            }catch(error){
                res.status(500).send(error.mesagge);
            }
        })
    }
    agregar(req,res){
        const {nombre, descripcion} = req.body;
        db.query(
            `INSERT INTO roles 
            (nombre, descripcion) 
            VALUES (?, ?)`,
            [nombre, descripcion],
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
}
module.exports = new roles();