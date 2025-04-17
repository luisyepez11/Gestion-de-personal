const express= require("express");
const rout= express.Router();
const rolControll = require("../controllers/rolesControll.js");
rout.get("/",rolControll.cargar);
rout.post('/', rolControll.agregar);
module.exports = rout;