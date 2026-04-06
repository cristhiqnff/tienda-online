const db = require("../db.js");

async function crearSolicitud(payload) {
  const {
    id_usuario,
    tipo = 'VENDEDOR',
    nombre_tienda,
    telefono,
    ciudad,
    descripcion,
    nit_rut,
    direccion_fiscal,
    nombre_legal,
    doc_representante
  } = payload;

  // Para REPARTIDOR, campos de tienda son opcionales
  const esRepartidor = tipo === 'REPARTIDOR';

  const [rows] = await db.execute(
    `INSERT INTO vendedor_solicitud
      (id_usuario, tipo, nombre_tienda, telefono, ciudad, descripcion, nit_rut, direccion_fiscal, nombre_legal, doc_representante, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
    [
      id_usuario,
      tipo,
      nombre_tienda || (esRepartidor ? 'N/A' : null),
      telefono,
      ciudad,
      descripcion || null,
      nit_rut || (esRepartidor ? 'N/A' : null),
      direccion_fiscal || (esRepartidor ? 'N/A' : null),
      nombre_legal || (esRepartidor ? 'N/A' : null),
      doc_representante || (esRepartidor ? 'N/A' : null)
    ]
  );

  return rows.insertId;
}

async function obtenerSolicitudPorUsuario(idUsuario) {
  const [rows] = await db.execute(
    `SELECT * FROM vendedor_solicitud WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 1`,
    [idUsuario]
  );
  return rows[0];
}

async function obtenerSolicitudesPorUsuario(idUsuario) {
  const [rows] = await db.execute(
    `SELECT * FROM vendedor_solicitud WHERE id_usuario = ? ORDER BY fecha_creacion DESC`,
    [idUsuario]
  );
  return rows;
}

async function listarSolicitudes(estado = null) {
  const params = [];
  let where = '';
  if (estado) {
    where = 'WHERE vs.estado = ?';
    params.push(estado);
  }

  const [rows] = await db.execute(
    `SELECT vs.*, u.nombre AS usuario_nombre, u.email AS usuario_email
     FROM vendedor_solicitud vs
     JOIN usuario u ON u.id_usuario = vs.id_usuario
     ${where}
     ORDER BY vs.fecha_creacion DESC`,
    params
  );
  return rows;
}

async function actualizarEstado(idSolicitud, estado, comentario_admin = null) {
  const [rows] = await db.execute(
    `UPDATE vendedor_solicitud
     SET estado = ?, comentario_admin = ?, fecha_resolucion = NOW()
     WHERE id_solicitud = ?`,
    [estado, comentario_admin, idSolicitud]
  );
  return rows.affectedRows;
}

async function obtenerPorId(idSolicitud) {
  const [rows] = await db.execute('SELECT * FROM vendedor_solicitud WHERE id_solicitud = ?', [idSolicitud]);
  return rows[0];
}

module.exports = {
  crearSolicitud,
  obtenerSolicitudPorUsuario,
  obtenerSolicitudesPorUsuario,
  listarSolicitudes,
  actualizarEstado,
  obtenerPorId
};
