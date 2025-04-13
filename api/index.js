const express= require('express');
const app = express();
const empleadosRout = require('./routers/empleadosRouts.js')
const especialidadesRout= require("./routers/especialidadesRouts.js")
const rolRout=require("./routers/rolesRouts.js")

const cors = require('cors');
app.use(express.json());
app.use(cors());
app.get('/', (req, res)=>{
    console.log('funcionando')
})

app.use('/empleados', empleadosRout);
app.use("/especialidades",especialidadesRout);
app.use("/roles",rolRout);

app.listen(6500,() =>{
    console.log("escuchando ando ")
})