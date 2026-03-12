const db = require("../db.js");

async function listarUsuarios() {
  const {rows} = await pool.query(`
    SELECT u.id_usuario, u.nombre, u.email, u.telefono, u.fecha_registro,
           STRING_AGG(r.nombre, ', ') AS roles_texto
    FROM usuario u
    LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
    LEFT JOIN rol r ON r.id_rol = ur.id_rol
    GROUP BY u.id_usuario
    ORDER BY u.id_usuario
  `);
  return rows;
}

async function crearUsuario(usuario) {
  try {
    const fechaRegistro = usuario.fecha_registro ? new Date(usuario.fecha_registro) : new Date();
    const {rows} = await pool.query(
      "INSERT INTO usuario (nombre, email, telefono, contrasena, fecha_registro) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario",
      [usuario.nombre, usuario.email, usuario.telefono || null, usuario.password || null, fechaRegistro]
    );
    const idUsuario = rows[0].id_usuario;

    let roles = Array.isArray(usuario.roles) ? usuario.roles : [];
    if (roles.length === 0) {
      const {rowsRol} = await pool.query(
        "SELECT id_rol FROM rol WHERE nombre = || LIMIT 1",
        ["CLIENTE"]
      );
      if (rowsRol && rowsRol[0] && rowsRol[0].id_rol != null) {
        roles = [rowsRol[0].id_rol];
      }
    }

    if (roles.length > 0) {
      for (const idRol of roles) {
        await pool.query(
          "INSERT INTO usuario_rol (id_usuario, id_rol) VALUES ($1, $2)",
          [idUsuario, idRol]
        );
      }
    }

    return {
      message: "Usuario creado exitosamente",
      id_usuario: idUsuario
    };
  } catch (error) {
    console.error("Error creando usuario:", error);
    throw error;
  }
}

async function buscarUsuarioPorEmail(email) {
  const {rows} = await pool.query(
    "SELECT * FROM usuario WHERE email = $1",
    [email]
  );
  return rows[0];
}

async function buscarUsuarioPorId(id) {
  const {rows} = await pool.query(
    "SELECT * FROM usuario WHERE id_usuario = $1",
    [id]
  );
  return rows[0];
}

async function actualizarUsuario(id, usuario) {
  const {rows} = await pool.query(
    "UPDATE usuario SET nombre = $1, email = $2, telefono = || WHERE id_usuario = $4",
    [usuario.nombre, usuario.email, usuario.telefono, id]
  );
  return rows.length;
}

async function eliminarUsuario(id) {
  const {rows} = await pool.query(
    "DELETE FROM usuario WHERE id_usuario = $1",
    [id]
  );
  return rows.length;
}

module.exports = {
  listarUsuarios,
  crearUsuario,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
};
