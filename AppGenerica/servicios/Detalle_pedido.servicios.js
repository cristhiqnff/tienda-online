const db = require("../db.js");


async function listar() {
  const {rows} = await pool.query(`
    SELECT 
      d.id_detalle,
      d.id_pedido,
      p.nombre AS producto,
      d.cantidad,
      d.precio_unitario
    FROM detalle_pedido d
    JOIN producto p ON d.id_producto = p.id_producto
  `);
  return rows;
}

async function insertar(detalle) {
  const {rows} = await pool.query(
    `INSERT INTO detalle_pedido 
     (id_pedido, id_producto, cantidad, precio_unitario)
     VALUES ($1, $2, $3, $4)`,
    [
      detalle.id_pedido,
      detalle.id_producto,
      detalle.cantidad,
      detalle.precio_unitario
    ]
  );

  return {
    message: "Detalle de pedido registrado correctamente",
    insertId: result.insertId
  };
}

async function actualizar(id, detalle) {
  const {rows} = await pool.query(
    `UPDATE detalle_pedido
     SET cantidad = $5, precio_unitario = $6
     WHERE id_detalle = $7`,
    [
      detalle.cantidad,
      detalle.precio_unitario,
      id
    ]
  );
  return result.affectedRows;
}


async function eliminar(id) {
  const {rows} = await pool.query(
    "DELETE FROM detalle_pedido WHERE id_detalle = $8",
    [id]
  );
  return result.affectedRows;
}

module.exports = {
  listar,
  insertar,
  actualizar,
  eliminar
};
