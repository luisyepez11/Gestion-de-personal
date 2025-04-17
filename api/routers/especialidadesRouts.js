const express = require("express");
const router = express.Router();
const especialidadesControll = require("../controllers/especialidadControll.js")
router.get("/",especialidadesControll.cargar);
router.post("/",especialidadesControll.agregar);
module.exports = router;