
const servicioUsuario = require("../servicios/Usuario.servicios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rolServicio = require("../servicios/Rol.servicios");
const { Cache } = require("../redis");
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeString(value) {
  return (value ?? "").toString().trim();
}

async function registrar(req, res) {
  try {
    const { roles } = req.body;
    const nombre = sanitizeString(req.body.nombre);
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = (req.body.password ?? "").toString();

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y password son requeridos" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (nombre.length < 2 || nombre.length > 120) {
      return res.status(400).json({ error: "Nombre inválido (2-120 caracteres)" });
    }
    if (password.length < 6 || password.length > 200) {
      return res.status(400).json({ error: "Password inválido (6-200 caracteres)" });
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = { nombre, email, password: hash, roles };
    try {
      const result = await servicioUsuario.crearUsuario(usuario);
      const idUsuario = result.id_usuario;

      // Obtener roles asignados
      const rolesAsignados = await rolServicio.obtenerRolesPorUsuario(idUsuario);

      // Guardar en Redis (persistente, sin TTL)
      await Cache.setUser(email, {
        id_usuario: idUsuario,
        nombre,
        email,
        roles: rolesAsignados
      });

      // Guardar permisos en Redis (con TTL 30min)
      await Cache.setPermissions(email, {
        roles: rolesAsignados.map(r => r.nombre),
        permissions: getPermissionsByRoles(rolesAsignados.map(r => r.nombre))
      });

      res.status(201).json({ message: "Usuario registrado", id: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  } catch (err) {
    res.status(500).json({ error: "Error interno: " + err.message });
  }
}


async function login(req, res) {
  try {
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = (req.body.password ?? "").toString();

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password requeridos" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (password.length > 200) {
      return res.status(400).json({ error: "Password inválido" });
    }

    // 1. Buscar en Redis primero (datos de perfil)
    let cached = await Cache.getUser(email);

    // 2. Siempre obtener contrasena de MySQL (no se guarda en Redis por seguridad)
    const usuarioDB = await servicioUsuario.buscarUsuarioPorEmail(email);
    if (!usuarioDB) {
      return res.status(401).json({ error: "Usuario no registrado" });
    }

    // 3. Verificar contraseña contra MySQL
    const match = await bcrypt.compare(password, usuarioDB.contrasena);
    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 4. Usar datos de cache si existen, sino de MySQL
    const usuario = cached || usuarioDB;

    // 5. Obtener roles
    const roles = await rolServicio.obtenerRolesPorUsuario(usuarioDB.id_usuario);
    const roleNames = Array.isArray(roles)
      ? roles
          .map(r => (r && typeof r === 'object') ? r.nombre : r)
          .map(r => String(r || '').trim().toUpperCase())
          .filter(Boolean)
      : [];

    // 6. Si no estaba en cache, guardarlo ahora (persistente, sin TTL, SIN contraseña)
    if (!cached) {
      await Cache.setUser(email, {
        id_usuario: usuarioDB.id_usuario,
        nombre: usuarioDB.nombre,
        email: usuarioDB.email,
        roles
      });
    }

    // 6. Generar token
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, email: usuario.email, roles: roleNames },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 7. Crear sesión en Redis (con TTL 1h)
    await Cache.setSession(token, {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      roles: roleNames,
      login_time: new Date().toISOString()
    });

    // 8. Guardar permisos en Redis (con TTL 30min)
    await Cache.setPermissions(email, {
      roles: roleNames,
      permissions: getPermissionsByRoles(roleNames)
    });

    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        roles
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Error en login: " + err.message });
  }
}

function getPermissionsByRoles(roles) {
  if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
    return ['read:*', 'write:*', 'delete:*', 'create:*', 'update:*'];
  }
  if (roles.includes('VENDEDOR')) {
    return ['read:productos', 'write:productos', 'read:pedidos', 'create:pedido'];
  }
  if (roles.includes('REPARTIDOR')) {
    return ['read:pedidos', 'update:pedidos'];
  }
  return ['read:productos', 'read:categorias', 'create:pedido', 'read:pedidos'];
}

function getMenuByRoles(roleNames) {
  const esAdmin = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');
  const esVendedor = roleNames.includes('VENDEDOR');
  const esRepartidor = roleNames.includes('REPARTIDOR');
  const esCliente = roleNames.includes('CLIENTE');

  if (esAdmin) {
    return [
      { seccion: 'TIENDA', items: [
        { label: 'Página principal', url: 'index.html', icon: 'fas fa-home' }
      ]},
      { seccion: 'ADMINISTRACIÓN', items: [
        { label: 'Panel Admin', url: 'admin.html', icon: 'fas fa-tachometer-alt' },
        { label: 'Gestión de Pedidos', url: 'gestion-pedidos.html', icon: 'fas fa-clipboard-list' },
        { label: 'Administrar productos', url: 'admin.html#productos', icon: 'fas fa-box' },
        { label: 'Administrar categorías', url: 'admin.html#categorias', icon: 'fas fa-tags' },
        { label: 'Usuarios y Roles', url: 'admin.html#usuarios', icon: 'fas fa-users' },
        { label: 'Estadísticas', url: 'admin.html#estadisticas', icon: 'fas fa-chart-bar' }
      ]}
    ];
  }

  if (esVendedor) {
    return [
      { seccion: 'TIENDA', items: [
        { label: 'Página principal', url: 'index.html', icon: 'fas fa-home' }
      ]},
      { seccion: 'PANEL VENDEDOR', items: [
        { label: 'Mi panel', url: 'vendedor.html', icon: 'fas fa-tachometer-alt' },
        { label: 'Mis productos', url: 'vendedor.html', icon: 'fas fa-box-open' },
        { label: 'Mis pedidos', url: 'vendedor.html', icon: 'fas fa-clipboard-list' },
        { label: 'Estadísticas', url: 'vendedor.html', icon: 'fas fa-chart-bar' }
      ]}
    ];
  }

  if (esRepartidor) {
    return [
      { seccion: 'ENTREGAS', items: [
        { label: 'Panel Repartidor', url: 'repartidor.html', icon: 'fas fa-truck' },
        { label: 'Pedidos asignados', url: 'repartidor.html', icon: 'fas fa-box-open' },
        { label: 'En camino', url: 'repartidor.html', icon: 'fas fa-shipping-fast' }
      ]}
    ];
  }

  // CLIENTE u otros roles
  return [
    { seccion: 'TIENDA', items: [
      { label: 'Página principal', url: 'index.html', icon: 'fas fa-home' },
      { label: 'Lista de productos', url: 'index.html', icon: 'fas fa-box' }
    ]},
    { seccion: 'MI CUENTA', items: [
      { label: 'Mi panel', url: 'panel-cliente.html', icon: 'fas fa-user-circle' },
      { label: 'Mis pedidos', url: 'panel-cliente.html', icon: 'fas fa-shopping-bag' },
      { label: 'Mi carrito', url: 'carrito.html', icon: 'fas fa-shopping-cart' }
    ]}
  ];
}

async function obtenerMenu(req, res) {
  try {
    const email = req.usuario.email;

    // 1. Buscar menú en Redis
    const cachedMenu = await Cache.getMenu();
    const cachedPermisos = await Cache.getPermissions(email);

    if (cachedPermisos) {
      const roleNames = Array.isArray(cachedPermisos.roles)
        ? cachedPermisos.roles
            .map(r => (r && typeof r === 'object') ? r.nombre : r)
            .map(r => String(r || '').trim().toUpperCase())
            .filter(Boolean)
        : [];
      const menu = getMenuByRoles(roleNames);
      console.log(`⚡ Menu construido desde Redis para ${email}`);
      return res.json({ source: 'redis', menu });
    }

    // 2. Fallback: obtener roles de MySQL y construir menú
    const roles = await rolServicio.obtenerRolesPorUsuario(req.usuario.id_usuario);
    const roleNames = Array.isArray(roles)
      ? roles
          .map(r => (r && typeof r === 'object') ? r.nombre : r)
          .map(r => String(r || '').trim().toUpperCase())
          .filter(Boolean)
      : [];
    const menu = getMenuByRoles(roleNames);

    // Guardar permisos en Redis para próxima vez
    await Cache.setPermissions(email, {
      roles: roleNames,
      permissions: getPermissionsByRoles(roleNames)
    });

    console.log(`💾 Menu construido desde MySQL y cacheado para ${email}`);
    res.json({ source: 'mysql', menu });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener menú: " + err.message });
  }
}

async function listarUsuarios(req, res) {
  try {
    const lista = await servicioUsuario.listarUsuarios();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: "Error al listar usuarios: " + err.message });
  }
}

async function crearUsuario(req, res) {
  try {
    const nombre = sanitizeString(req.body.nombre);
    const email = sanitizeString(req.body.email).toLowerCase();
    const telefono = sanitizeString(req.body.telefono);
    const passwordRaw = (req.body.password ?? "").toString();
    const roles = Array.isArray(req.body.roles) ? req.body.roles : [];

    if (!nombre || !email) {
      return res.status(400).json({ error: "Datos incompletos. Se requieren nombre y email." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (nombre.length < 2 || nombre.length > 120) {
      return res.status(400).json({ error: "Nombre inválido (2-120 caracteres)" });
    }
    if (passwordRaw && (passwordRaw.length < 6 || passwordRaw.length > 200)) {
      return res.status(400).json({ error: "Password inválido (6-200 caracteres)" });
    }

    const password = passwordRaw ? await bcrypt.hash(passwordRaw, 10) : null;
    const result = await servicioUsuario.crearUsuario({
      nombre,
      email,
      telefono: telefono || null,
      password,
      roles
    });

    // Guardar en Redis (persistente, sin TTL)
    const idUsuario = result.id_usuario;
    const rolesAsignados = await rolServicio.obtenerRolesPorUsuario(idUsuario);
    await Cache.setUser(email, { id_usuario: idUsuario, nombre, email, roles: rolesAsignados });

    res.json({
      message: "Usuario creado correctamente.",
      id: result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}


async function buscarUsuarioPorId(req, res) {
  try {
    const usuario = await servicioUsuario.buscarUsuarioPorId(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al buscar usuario: " + err.message });
  }
}

async function actualizarUsuario(req, res) {
  try {
    // Obtener usuario actual para saber el email viejo
    const usuarioActual = await servicioUsuario.buscarUsuarioPorId(req.params.id);
    if (!usuarioActual) {
      return res.status(404).json({ error: "Usuario no encontrado para actualizar." });
    }

    const payload = {};
    if (req.body.nombre !== undefined) {
      const nombre = sanitizeString(req.body.nombre);
      if (!nombre || nombre.length < 2 || nombre.length > 120) {
        return res.status(400).json({ error: "Nombre inválido (2-120 caracteres)" });
      }
      payload.nombre = nombre;
    }
    if (req.body.email !== undefined) {
      const email = sanitizeString(req.body.email).toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }
      payload.email = email;
    }
    if (req.body.telefono !== undefined) {
      payload.telefono = sanitizeString(req.body.telefono) || null;
    }
    if (req.body.fecha_registro !== undefined) {
      const fecha = new Date(req.body.fecha_registro);
      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({ error: "Fecha de registro inválida" });
      }
      payload.fecha_registro = fecha;
    }

    const filas = await servicioUsuario.actualizarUsuario(req.params.id, payload);
    if (filas === 0) {
      return res.status(404).json({ error: "Usuario no encontrado para actualizar." });
    }

    // Sincronizar Redis
    const emailViejo = usuarioActual.email;
    const emailNuevo = payload.email || emailViejo;

    if (payload.email && payload.email !== emailViejo) {
      // Si cambió el email, migrar la clave en Redis
      const cached = await Cache.getUser(emailViejo);
      if (cached) {
        await Cache.deleteUser(emailViejo);
        Object.assign(cached, payload);
        await Cache.setUser(emailNuevo, cached);
      }
    } else {
      // Solo actualizar datos en la clave existente
      const cached = await Cache.getUser(emailViejo);
      if (cached) {
        Object.assign(cached, payload);
        await Cache.setUser(emailViejo, cached);
      }
    }

    res.json({ message: "Usuario actualizado correctamente." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function eliminarUsuario(req, res) {
  try {
    // Obtener email antes de eliminar para limpiar Redis
    const usuario = await servicioUsuario.buscarUsuarioPorId(req.params.id);

    const filas = await servicioUsuario.eliminarUsuario(req.params.id);
    if (filas === 0) {
      return res.status(404).json({ error: "Usuario no encontrado para eliminar." });
    }

    // Limpiar Redis
    if (usuario && usuario.email) {
      await Cache.deleteUser(usuario.email);
    }

    res.json({ message: "Usuario eliminado correctamente." });
  } catch (err) {
    if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451)) {
      return res.status(409).json({ error: "No se puede eliminar el usuario porque tiene registros asociados." });
    }
    res.status(err.status || 500).json({ error: "Error al eliminar usuario: " + err.message });
  }
}

async function obtenerPerfil(req, res) {
  try {
    const usuario = await servicioUsuario.buscarUsuarioPorId(req.usuario.id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const roles = await rolServicio.obtenerRolesPorUsuario(usuario.id_usuario);
    res.json({
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      roles
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener perfil: " + err.message });
  }
}

module.exports = {
  listarUsuarios,
  crearUsuario,
  buscarUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario,
  registrar,
  login,
  obtenerPerfil,
  obtenerMenu
};
