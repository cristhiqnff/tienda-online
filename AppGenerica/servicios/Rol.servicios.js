const pool = require('../db.js');

async function obtenerRolesPorUsuario(idUsuario) {
  const {rows} = await pool.query(
    `SELECT r.id_rol, r.nombre
     FROM rol r
     JOIN usuario_rol ur ON r.id_rol = ur.id_rol
     WHERE ur.id_usuario = $1`,
    [idUsuario]
  );

  return rows.map(r => ({ id_rol: r.id_rol, nombre: r.nombre }));
}

async function listar() {
  const {rows} = await pool.query('SELECT id_rol, nombre FROM rol ORDER BY nombre');
  return rows;
}

async function buscarPorId(idRol) {
  const {rows} = await pool.query('SELECT id_rol, nombre FROM rol WHERE id_rol = $2', [idRol]);
  return rows[0];
}

async function asignarRolAUsuario(idUsuario, idRol) {
  const {rows} = await pool.query(
    'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES ($3, $4)',
    [idUsuario, idRol]
  );
  return rows[0].id_rol;
}

async function quitarRolAUsuario(idUsuario, idRol) {
  const {rows} = await pool.query(
    'DELETE FROM usuario_rol WHERE id_usuario = $5 AND id_rol = $6',
    [idUsuario, idRol]
  );
  return rows.length;
}

module.exports = {
  obtenerRolesPorUsuario,
  listar,
  buscarPorId,
  asignarRolAUsuario,
  quitarRolAUsuario
};
