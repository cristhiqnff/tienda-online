const db = require("../db.js");

async function listarUsuarios() {
  const [rows] = await db.execute(`
    SELECT u.id_usuario, u.nombre, u.email, u.telefono, u.fecha_registro,
           GROUP_CONCAT(r.nombre SEPARATOR ', ') AS roles_texto
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
    const [rows] = await db.execute(
      "INSERT INTO usuario (nombre, email, telefono, contrasena, fecha_registro) VALUES (?, ?, ?, ?, ?)",
      [usuario.nombre, usuario.email, usuario.telefono || null, usuario.password || null, fechaRegistro]
    );
    const idUsuario = rows.insertId;

    let roles = Array.isArray(usuario.roles) ? usuario.roles : [];
    if (roles.length === 0) {
      const [rowsRol] = await db.execute(
        "SELECT id_rol FROM rol WHERE nombre = ? LIMIT 1",
        ["CLIENTE"]
      );
      if (rowsRol && rowsRol[0] && rowsRol[0].id_rol != null) {
        const idRol = rowsRol[0].id_rol;
        roles = [idRol];
      }
    }

    if (roles.length > 0) {
      for (const idRol of roles) {
        await db.execute(
          "INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)",
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
  const [rows] = await db.execute(
    "SELECT * FROM usuario WHERE email = ?",
    [email]
  );
  return rows[0];
}

async function buscarUsuarioPorId(id) {
  const [rows] = await db.execute(
    "SELECT * FROM usuario WHERE id_usuario = ?",
    [id]
  );
  return rows[0];
}

async function actualizarUsuario(id, usuario) {
  const [rows] = await db.execute(
    "UPDATE usuario SET nombre = ?, email = ?, telefono = ? WHERE id_usuario = ?",
    [usuario.nombre, usuario.email, usuario.telefono, id]
  );
  return rows.affectedRows;
}

async function eliminarUsuario(id) {
  const [rows] = await db.execute(
    "DELETE FROM usuario WHERE id_usuario = ?",
    [id]
  );
  return rows.affectedRows;
}

module.exports = {
  listarUsuarios,
  crearUsuario,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
};
