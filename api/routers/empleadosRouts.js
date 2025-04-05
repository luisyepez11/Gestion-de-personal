const express= require('express');
const router = express.Router(); 
const empleadosController = require('../controllers/empleadosControllers.js')
router.get('/', empleadosController.consular);
router.post('/', empleadosController.agregar);
router.route('/:id')
    .get(empleadosController.consular_uno)
    .put(empleadosController.actualizar)
    .delete(empleadosController.eliminar)
module.exports=router;