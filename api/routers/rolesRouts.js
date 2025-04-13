const express= require("express");
const rout= express.Router();
const rolControll = require("../controllers/rolesControll.js");
rout.get("/",rolControll.cargar);
module.exports = rout;