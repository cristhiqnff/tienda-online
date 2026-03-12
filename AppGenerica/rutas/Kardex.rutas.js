const express = require('express');
const router = express.Router();
const { verificarToken, requiereRol } = require('../middlewares/auth');

// Middleware para verificar si es admin
const esAdmin = (req) => {
  const user = req.usuario;
  const roles = Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : []);
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
};

// Obtener kardex con filtros
router.get('/', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const pool = require('../db');
    const { 
      id_producto, 
      id_tipo, 
      fecha_inicio, 
      fecha_fin, 
      pagina = 1, 
      limite = 50 
    } = req.query;

    let query = `
      SELECT 
        k.id_kardex,
        k.id_producto,
        p.nombre as producto_nombre,
        k.id_tipo,
        tm.nombre as tipo_movimiento,
        k.fecha,
        k.hora,
        k.cantidad,
        k.costo_unitario,
        k.saldo_anterior,
        k.saldo_actual,
        k.valor_total,
        k.valor_inventario,
        k.referencia,
        k.observaciones,
        u.nombre as usuario_registro
      FROM kardex k
      INNER JOIN producto p ON k.id_producto = p.id_producto
      INNER JOIN tipos_movimiento tm ON k.id_tipo = tm.id_tipo
      LEFT JOIN usuario u ON k.usuario_registro = u.id_usuario
      WHERE 1=1
    `;

    const params = [];

    if (id_producto) {
      query += ' AND k.id_producto = $1';
      params.push(id_producto);
    }

    if (id_tipo) {
      query += ' AND k.id_tipo = $2';
      params.push(id_tipo);
    }

    if (fecha_inicio && fecha_fin) {
      query += ' AND DATE(k.fecha) BETWEEN $3 AND $4';
      params.push(fecha_inicio, fecha_fin);
    }

    query += ' ORDER BY k.fecha DESC, k.hora DESC LIMIT $5 OFFSET $6';
    params.push(limite, (pagina - 1) * limite);

    const { rows } = await pool.query(query, params);
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        pagina: Number(pagina),
        limite: Number(limite)
      }
    });
  } catch (error) {
    console.error('Error obteniendo kardex:', error);
    res.status(500).json({ error: 'Error al obtener kardex' });
  }
});

// Crear movimiento de kardex
router.post('/', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const pool = require('../db');
    const {
      id_producto,
      id_tipo,
      cantidad,
      costo_unitario,
      referencia,
      observaciones
    } = req.body;

    // Validar datos
    if (!id_producto || !id_tipo || !cantidad) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Obtener stock actual
    const [stockResult] = await pool.query(
      'SELECT stock_actual, costo_promedio FROM producto WHERE id_producto = $1',
      [id_producto]
    );

    const stock_actual = stockResult[0].stock_actual || 0;
    const costo_promedio_actual = stockResult[0].costo_promedio || 0;

    // Determinar tipo de movimiento
    const [tipoResult] = await pool.query(
      'SELECT afecta_stock FROM tipos_movimiento WHERE id_tipo = $1',
      [id_tipo]
    );

    const afecta_stock = tipoResult[0].afecta_stock;
    let nuevo_stock = stock_actual;
    let valor_total = cantidad * (costo_unitario || costo_promedio_actual);

    if (afecta_stock) {
      if (stock_actual < cantidad) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }
      nuevo_stock = stock_actual - cantidad;
    }

    // Insertar movimiento
    const { rows } = await pool.query(`
      INSERT INTO kardex (
        id_producto, id_tipo, fecha, hora, cantidad, costo_unitario,
        saldo_anterior, saldo_actual, valor_total, valor_inventario,
        referencia, observaciones, usuario_registro
      ) VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id_kardex
    `, [
      id_producto, id_tipo, cantidad, costo_unitario || costo_promedio_actual,
      stock_actual, nuevo_stock, valor_total, nuevo_stock * (costo_unitario || costo_promedio_actual),
      referencia, observaciones, req.usuario.id_usuario
    ]);

    // Actualizar stock del producto
    await pool.query(
      'UPDATE producto SET stock_actual = $1, valor_inventario = $2 WHERE id_producto = $3',
      [nuevo_stock, nuevo_stock * (costo_unitario || costo_promedio_actual), id_producto]
    );

    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      id_kardex: rows[0].id_kardex
    });
  } catch (error) {
    console.error('Error creando movimiento kardex:', error);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
});

// Obtener tipos de movimiento
router.get('/tipos', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const pool = require('../db');
    const { rows } = await pool.query(
      'SELECT * FROM tipos_movimiento ORDER BY id_tipo'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error obteniendo tipos de movimiento:', error);
    res.status(500).json({ error: 'Error al obtener tipos' });
  }
});

module.exports = router;
