const db = require("../db.js");


async function listar() {
  const {rows} = await pool.query(`
    SELECT id_direccion, id_usuario, ciudad, codigo_postal
    FROM direccion
  `);
  return rows;
}


async function insertar(direccion) {
  const {rows} = await pool.query(
    `INSERT INTO direccion (id_usuario, ciudad, codigo_postal)
     VALUES ($1, $2, $3)`,
    [
      direccion.id_usuario,
      direccion.ciudad || null,
      direccion.codigo_postal || null
    ]
  );

  return {
    message: "Dirección registrada correctamente",
    insertId: result.insertId
  };
}


async function actualizar(id, direccion) {
  const {rows} = await pool.query(
    `UPDATE direccion
     SET ciudad = $4, codigo_postal = $5
     WHERE id_direccion = $6`,
    [
      direccion.ciudad || null,
      direccion.codigo_postal || null,
      id
    ]
  );

  return result.affectedRows;
}


async function eliminar(id) {
  const {rows} = await pool.query(
    "DELETE FROM direccion WHERE id_direccion = $7",
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
