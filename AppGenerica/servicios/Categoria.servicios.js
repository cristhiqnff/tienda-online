const db = require("../db.js");

async function listar() {
  const { rows } = await db.query(
    "SELECT id_categoria, nombre, descripcion FROM categoria"
  );
  return rows;
}

async function insertar(categoria) {
  const { rows } = await db.query(
    "INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING *",
    [
      categoria.nombre,
      categoria.descripcion || null
    ]
  );

  return {
    message: "Categoría registrada correctamente",
    insertId: rows[0].id_categoria
  };
}

async function actualizar(id, categoria) {
  const { rows } = await db.query(
    `UPDATE categoria
     SET nombre = $1, descripcion = $2
     WHERE id_categoria = $3`,
    [
      categoria.nombre,
      categoria.descripcion || null,
      id
    ]
  );
  return rows.length;
}

async function eliminar(id) {
  const { rows } = await db.query(
    "DELETE FROM categoria WHERE id_categoria = $1",
    [id]
  );
  return rows.length;
}

module.exports = {
  listar,
  insertar,
  actualizar,
  eliminar
};
