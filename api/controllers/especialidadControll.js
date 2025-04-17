const db = require('../database/conexin.js')

class especialida{
    constructor(){

    };
    cargar(req,res){
        db.query("SELECT departamento_id,nombre FROM departamentos;",(error,rows)=>{
            if (error){
                res.status(400).send(error)
            }
                res.status(200).json(rows)
        });
    }
    agregar(req, res) {
        const {nombre, descripcion} = req.body;
        db.query(
            `INSERT INTO departamentos 
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
module.exports = new especialida();