const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const esAdmin = (req) => {
  const user = req.usuario;
  const roles = Array.isArray(user.roles) ? user.roles : (user.rol ? [user.rol] : []);
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
};

// Obtener kardex con filtros
router.get('/', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ error: 'No autorizado' });

    const { id_producto, id_tipo, fecha_inicio, fecha_fin, pagina = 1, limite = 50 } = req.query;

    let query = `
      SELECT k.id_kardex, k.id_producto, p.nombre as producto_nombre,
        k.id_tipo, tm.nombre as tipo_movimiento, k.fecha, k.hora,
        k.cantidad, k.costo_unitario, k.saldo_anterior, k.saldo_actual,
        k.valor_total, k.valor_inventario, k.referencia, k.observaciones,
        u.nombre as usuario_registro
      FROM kardex k
      INNER JOIN producto p ON k.id_producto = p.id_producto
      INNER JOIN tipos_movimiento tm ON k.id_tipo = tm.id_tipo
      LEFT JOIN usuario u ON k.usuario_registro = u.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (id_producto) { query += ' AND k.id_producto = ?'; params.push(id_producto); }
    if (id_tipo) { query += ' AND k.id_tipo = ?'; params.push(id_tipo); }
    if (fecha_inicio && fecha_fin) { query += ' AND DATE(k.fecha) BETWEEN ? AND ?'; params.push(fecha_inicio, fecha_fin); }

    query += ' ORDER BY k.fecha DESC, k.hora DESC LIMIT ? OFFSET ?';
    params.push(Number(limite), (Number(pagina) - 1) * Number(limite));

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows, pagination: { pagina: Number(pagina), limite: Number(limite) } });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener kardex' });
  }
});

// Crear movimiento de kardex
router.post('/', verificarToken, requiereRol(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id_producto, id_tipo, cantidad, costo_unitario, referencia, observaciones } = req.body;
    if (!id_producto || !id_tipo || !cantidad) return res.status(400).json({ error: 'Datos incompletos' });

    const [stockRows] = await db.execute('SELECT stock, precio FROM producto WHERE id_producto = ?', [id_producto]);
    if (stockRows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const stock_actual = stockRows[0].stock || 0;
    const costo_promedio_actual = stockRows[0].precio || 0;

    const [tipoRows] = await db.execute('SELECT afecta_stock FROM tipos_movimiento WHERE id_tipo = ?', [id_tipo]);
    if (tipoRows.length === 0) return res.status(404).json({ error: 'Tipo de movimiento no encontrado' });

    const afecta_stock = tipoRows[0].afecta_stock;
    let nuevo_stock = stock_actual;
    const valor_total = cantidad * (costo_unitario || costo_promedio_actual);

    if (afecta_stock) {
      if (stock_actual < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });
      nuevo_stock = stock_actual - cantidad;
    }

    const [result] = await db.execute(`
      INSERT INTO kardex (id_producto, id_tipo, fecha, hora, cantidad, costo_unitario,
        saldo_anterior, saldo_actual, valor_total, valor_inventario,
        referencia, observaciones, usuario_registro)
      VALUES (?, ?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_producto, id_tipo, cantidad, costo_unitario || costo_promedio_actual,
      stock_actual, nuevo_stock, valor_total, nuevo_stock * (costo_unitario || costo_promedio_actual),
      referencia, observaciones, req.usuario.id_usuario
    ]);

    await db.execute('UPDATE producto SET stock = ? WHERE id_producto = ?', [nuevo_stock, id_producto]);

    res.json({ success: true, message: 'Movimiento registrado', id_kardex: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
});

// Obtener tipos de movimiento
router.get('/tipos', verificarToken, async (req, res) => {
  try {
    if (!esAdmin(req)) return res.status(403).json({ error: 'No autorizado' });
    const [rows] = await db.execute('SELECT * FROM tipos_movimiento ORDER BY id_tipo');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tipos' });
  }
});

module.exports = router;
