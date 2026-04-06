const db = require("../db.js");


async function listar() {
  const [rows] = await db.execute(`
    SELECT 
      p.id_pago,
      p.id_pedido,
      p.metodo_pago,
      p.monto,
      p.fecha_pago
    FROM pago p
  `);
  return rows;
}


async function insertar(pago) {
  const [rows] = await db.execute(
    `INSERT INTO pago (id_pedido, metodo_pago, monto, fecha_pago)
     VALUES (?, ?, ?, ?)`,
    [
      pago.id_pedido,
      pago.metodo_pago,
      pago.monto,
      pago.fecha_pago || new Date()
    ]
  );

  return {
    message: "Pago registrado correctamente",
    insertId: result.insertId
  };
}


async function actualizar(id, pago) {
  const [rows] = await db.execute(
    `UPDATE pago
     SET metodo_pago = ?, monto = ?
     WHERE id_pago = ?`,
    [
      pago.metodo_pago,
      pago.monto,
      id
    ]
  );
  return rows.affectedRows;
}


async function eliminar(id) {
  const [rows] = await db.execute(
    "DELETE FROM pago WHERE id_pago = ?",
    [id]
  );
  return rows.affectedRows;
}

module.exports = {
  listar,
  insertar,
  actualizar,
  eliminar
};
