const express= require('express');
const app = express();
const empleadosRout = require('./routers/empleadosRouts.js')
const cors = require('cors');
app.use(express.json());
app.use(cors());
app.get('/', (req, res)=>{
    console.log('funcionando')
})

app.use('/empleados', empleadosRout);

app.listen(6500,() =>{
    console.log("escuchando ando ")
})