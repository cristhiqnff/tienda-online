const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken } = require('../middlewares/auth');

const esAdmin = (req) => {
  const user = req.usuario;
  const roles = Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : []);
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
};

router.get('/overview', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ error: 'No autorizado' });

    const [rows] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM usuario) as total_usuarios,
        (SELECT COUNT(*) FROM producto) as total_productos,
        (SELECT COUNT(*) FROM pedido) as total_pedidos,
        (SELECT COALESCE(SUM(total), 0) FROM pedido) as total_ventas
    `);

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/ventas-mensuales', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ error: 'No autorizado' });

    const [rows] = await db.execute(`
      SELECT 
        DATE_FORMAT(fecha_pedido, '%Y-%m') as mes,
        COUNT(*) as cantidad_pedidos,
        COALESCE(SUM(total), 0) as total_ventas
      FROM pedido
      WHERE fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_pedido, '%Y-%m')
      ORDER BY mes DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas mensuales' });
  }
});

router.get('/productos-top', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ error: 'No autorizado' });

    const [rows] = await db.execute(`
      SELECT 
        p.nombre,
        COUNT(dp.id_producto) as ventas_count,
        COALESCE(SUM(dp.cantidad), 0) as total_vendido
      FROM producto p
      LEFT JOIN detalle_pedido dp ON p.id_producto = dp.id_producto
      GROUP BY p.id_producto, p.nombre
      ORDER BY ventas_count DESC
      LIMIT 10
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos top' });
  }
});

module.exports = router;
