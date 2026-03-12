const db = require("../db.js");


async function listar() {
  const {rows} = await pool.query(`
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
  const {rows} = await pool.query(
    `INSERT INTO pago (id_pedido, metodo_pago, monto, fecha_pago)
     VALUES ($1, $2, $3, $4)`,
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
  const {rows} = await pool.query(
    `UPDATE pago
     SET metodo_pago = $5, monto = $6
     WHERE id_pago = $7`,
    [
      pago.metodo_pago,
      pago.monto,
      id
    ]
  );
  return result.affectedRows;
}


async function eliminar(id) {
  const {rows} = await pool.query(
    "DELETE FROM pago WHERE id_pago = $8",
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
