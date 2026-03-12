const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');

// Dashboard Analytics Routes
router.get('/overview', verificarToken, async (req, res) => {
  try {
    const user = req.usuario;
    const roles = Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : []);
    const esAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    
    if (!esAdmin) {
      return res.status(403).json({ error: 'No autorizado para ver analytics' });
    }

    const pool = require('../db');
    
    // Métricas generales
    const [totalStats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuario) as total_usuarios,
        (SELECT COUNT(*) FROM producto) as total_productos,
        (SELECT COUNT(*) FROM pedido) as total_pedidos,
        (SELECT COALESCE(SUM(total), 0) FROM pedido) as total_ventas
    `);
    
    res.json({
      success: true,
      data: {
        total_usuarios: totalStats[0].total_usuarios,
        total_productos: totalStats[0].total_productos,
        total_pedidos: totalStats[0].total_pedidos,
        total_ventas: totalStats[0].total_ventas
      }
    });
  } catch (error) {
    console.error('Error en analytics overview:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/ventas-mensuales', verificarToken, async (req, res) => {
  try {
    const user = req.usuario;
    const roles = Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : []);
    const esAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    
    if (!esAdmin) {
      return res.status(403).json({ error: 'No autorizado para ver analytics' });
    }

    const pool = require('../db');
    
    // Ventas mensuales
    const [ventasMensuales] = await pool.query(`
      SELECT 
        DATE_TRUNC('month', fecha_pedido) as mes,
        COUNT(*) as cantidad_pedidos,
        COALESCE(SUM(total), 0) as total_ventas
      FROM pedido
      WHERE fecha_pedido >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', fecha_pedido)
      ORDER BY mes DESC
    `);
    
    res.json({
      success: true,
      data: ventasMensuales
    });
  } catch (error) {
    console.error('Error en ventas mensuales:', error);
    res.status(500).json({ error: 'Error al obtener ventas mensuales' });
  }
});

router.get('/productos-top', verificarToken, async (req, res) => {
  try {
    const user = req.usuario;
    const roles = Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : []);
    const esAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    
    if (!esAdmin) {
      return res.status(403).json({ error: 'No autorizado para ver analytics' });
    }

    const pool = require('../db');
    
    // Productos más vendidos
    const [productosTop] = await pool.query(`
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
    
    res.json({
      success: true,
      data: productosTop
    });
  } catch (error) {
    console.error('Error en productos top:', error);
    res.status(500).json({ error: 'Error al obtener productos top' });
  }
});

module.exports = router;
