const mysql= require('mysql2')

const db = mysql.createConnection(
    {
        host:'localhost',
        user:'root',
        password:'',
        database:'hosp'
    }
);
db.connect((err)=>{
    if(err){
        throw err;
    }
    console.log('se logroooo')
})
module.exports=db;