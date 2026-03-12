const db = require("../db.js");

async function listar() {
  const {rows} = await pool.query(
    "SELECT * FROM estado_pedido"
  );
  return rows;
}

async function insertar(estado) {
  const {rows} = await pool.query(
    "INSERT INTO estado_pedido (nombre_estado) VALUES ($1)",
    [estado.nombre_estado]
  );

  return {
    message: "Estado de pedido creado",
    insertId: result.insertId
  };
}

async function actualizar(id, estado) {
  const {rows} = await pool.query(
    "UPDATE estado_pedido SET nombre_estado = || WHERE id_estado = $3",
    [estado.nombre_estado, id]
  );
  return result.affectedRows;
}

async function eliminar(id) {
  const {rows} = await pool.query(
    "DELETE FROM estado_pedido WHERE id_estado = $4",
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
