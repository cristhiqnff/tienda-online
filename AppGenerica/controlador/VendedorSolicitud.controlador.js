const vendedorSolicitudServicio = require('../servicios/VendedorSolicitud.servicios');
const rolServicio = require('../servicios/Rol.servicios');

async function crearSolicitud(req, res) {
  try {
    const idUsuario = req.usuario?.id_usuario;
    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const tipo = (req.body.tipo || 'VENDEDOR').toUpperCase();
    if (!['VENDEDOR', 'REPARTIDOR'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo debe ser VENDEDOR o REPARTIDOR' });
    }

    // Verificar si ya tiene una solicitud pendiente del mismo tipo
    const solicitudes = await vendedorSolicitudServicio.obtenerSolicitudesPorUsuario(idUsuario);
    const pendienteMismoTipo = solicitudes.find(s => s.tipo === tipo && s.estado === 'PENDIENTE');
    if (pendienteMismoTipo) {
      return res.status(400).json({ error: `Ya tienes una solicitud de ${tipo} pendiente` });
    }

    const { telefono, ciudad, descripcion } = req.body;

    if (!telefono || !ciudad) {
      return res.status(400).json({ error: 'Teléfono y ciudad son obligatorios' });
    }

    const payload = { id_usuario: idUsuario, tipo, telefono, ciudad, descripcion };

    if (tipo === 'VENDEDOR') {
      const { nombre_tienda, nit_rut, direccion_fiscal, nombre_legal, doc_representante } = req.body;
      if (!nombre_tienda || !nit_rut || !direccion_fiscal || !nombre_legal || !doc_representante) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para solicitud de vendedor' });
      }
      Object.assign(payload, { nombre_tienda, nit_rut, direccion_fiscal, nombre_legal, doc_representante });
    }

    const id = await vendedorSolicitudServicio.crearSolicitud(payload);
    res.status(201).json({ mensaje: `Solicitud de ${tipo} enviada`, id_solicitud: id });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear solicitud', details: err.message });
  }
}

async function miSolicitud(req, res) {
  try {
    const idUsuario = req.usuario?.id_usuario;
    if (!idUsuario) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const solicitudes = await vendedorSolicitudServicio.obtenerSolicitudesPorUsuario(idUsuario);
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar solicitud', details: err.message });
  }
}

async function listar(req, res) {
  try {
    const { estado } = req.query;
    const rows = await vendedorSolicitudServicio.listarSolicitudes(estado || null);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar solicitudes', details: err.message });
  }
}

async function aprobar(req, res) {
  try {
    const idSolicitud = req.params.id;
    const { comentario_admin } = req.body;

    const solicitud = await vendedorSolicitudServicio.obtenerPorId(idSolicitud);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden aprobar solicitudes pendientes' });
    }

    // Determinar qué rol asignar según tipo de solicitud
    const tipoRol = solicitud.tipo === 'REPARTIDOR' ? 'REPARTIDOR' : 'VENDEDOR';
    const roles = await rolServicio.listar();
    const rolTarget = roles.find(r => r.nombre === tipoRol);
    if (!rolTarget) return res.status(500).json({ error: `Rol ${tipoRol} no existe en la base de datos` });

    await rolServicio.asignarRolAUsuario(solicitud.id_usuario, rolTarget.id_rol);
    await vendedorSolicitudServicio.actualizarEstado(idSolicitud, 'APROBADA', comentario_admin || null);

    res.json({ mensaje: `Solicitud aprobada y rol ${tipoRol} asignado` });
  } catch (err) {
    res.status(500).json({ error: 'Error al aprobar solicitud', details: err.message });
  }
}

async function rechazar(req, res) {
  try {
    const idSolicitud = req.params.id;
    const { comentario_admin } = req.body;

    const solicitud = await vendedorSolicitudServicio.obtenerPorId(idSolicitud);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden rechazar solicitudes pendientes' });
    }

    await vendedorSolicitudServicio.actualizarEstado(idSolicitud, 'RECHAZADA', comentario_admin || null);
    res.json({ mensaje: 'Solicitud rechazada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al rechazar solicitud', details: err.message });
  }
}

module.exports = {
  crearSolicitud,
  miSolicitud,
  listar,
  aprobar,
  rechazar
};
