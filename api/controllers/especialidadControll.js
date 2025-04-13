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
}
module.exports = new especialida();