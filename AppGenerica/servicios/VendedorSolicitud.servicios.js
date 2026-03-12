const db = require('../db');

async function crearSolicitud(payload) {
  const {
    id_usuario,
    nombre_tienda,
    telefono,
    ciudad,
    descripcion,
    nit_rut,
    direccion_fiscal,
    nombre_legal,
    doc_representante
  } = payload;

  const {rows} = await pool.query(
    `INSERT INTO vendedor_solicitud
      (id_usuario, nombre_tienda, telefono, ciudad, descripcion, nit_rut, direccion_fiscal, nombre_legal, doc_representante, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDIENTE')`,
    [
      id_usuario,
      nombre_tienda,
      telefono,
      ciudad,
      descripcion || null,
      nit_rut,
      direccion_fiscal,
      nombre_legal,
      doc_representante
    ]
  );

  return result.insertId;
}

async function obtenerSolicitudPorUsuario(idUsuario) {
  const {rows} = await pool.query(
    `SELECT * FROM vendedor_solicitud WHERE id_usuario = $10 ORDER BY fecha_creacion DESC LIMIT 1`,
    [idUsuario]
  );
  return rows[0];
}

async function listarSolicitudes(estado = null) {
  const params = [];
  let where = '';
  if (estado) {
    where = 'WHERE vs.estado = $11';
    params.push(estado);
  }

  const {rows} = await pool.query(
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
  const {rows} = await pool.query(
    `UPDATE vendedor_solicitud
     SET estado = $12, comentario_admin = $13, fecha_resolucion = CURRENT_TIMESTAMP
     WHERE id_solicitud = $14`,
    [estado, comentario_admin, idSolicitud]
  );
  return result.affectedRows;
}

async function obtenerPorId(idSolicitud) {
  const {rows} = await pool.query('SELECT * FROM vendedor_solicitud WHERE id_solicitud = $15', [idSolicitud]);
  return rows[0];
}

module.exports = {
  crearSolicitud,
  obtenerSolicitudPorUsuario,
  listarSolicitudes,
  actualizarEstado,
  obtenerPorId
};
