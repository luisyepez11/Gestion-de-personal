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
}
module.exports = new roles();