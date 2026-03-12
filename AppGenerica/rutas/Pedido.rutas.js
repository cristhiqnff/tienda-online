const express = require('express');
const router = express.Router();
const pedidoCtrl = require('../controlador/Pedido.controlador');
const { verificarToken, requiereRol } = require('../middlewares/auth');

router.post('/', verificarToken, pedidoCtrl.crearPedido);
router.post('/admin', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN']), pedidoCtrl.crearPedidoAdmin);
router.get('/', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN', 'VENDEDOR']), pedidoCtrl.obtenerPedidos);
router.get('/reportes/resumen', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN', 'VENDEDOR']), pedidoCtrl.obtenerResumenReportes);
router.get('/reportes/resumen/csv', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN', 'VENDEDOR']), pedidoCtrl.exportarResumenReportesCsv);
router.get('/mis-pedidos', verificarToken, requiereRol(['CLIENTE']), pedidoCtrl.obtenerMisPedidos);
router.put('/:id', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN']), pedidoCtrl.actualizarPedido);
router.delete('/:id', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN']), pedidoCtrl.eliminarPedido);
router.get('/:id', verificarToken, requiereRol(['CLIENTE', 'ADMIN', 'SUPER_ADMIN']), pedidoCtrl.obtenerPedidoPorId);

module.exports = router;
