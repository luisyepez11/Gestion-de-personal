const mysql= require('mysql2')

const db = mysql.createConnection(
    {
        host:'localhost',
        user:'root',
        password:'Perla15052015*',
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