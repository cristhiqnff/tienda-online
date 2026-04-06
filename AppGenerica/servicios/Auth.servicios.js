const db = require('../db.js');
const { Cache } = require('../redis.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Helpers ---
function getPermissionsByRoles(roles) {
  if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
    return ['read:*', 'write:*', 'delete:*', 'create:*', 'update:*'];
  }
  if (roles.includes('VENDEDOR')) {
    return ['read:productos', 'write:productos', 'read:pedidos', 'create:pedido'];
  }
  return ['read:productos', 'read:categorias', 'create:pedido', 'read:pedidos'];
}

async function getRolesFromDB(idUsuario) {
  const [rows] = await db.execute(
    `SELECT r.nombre FROM rol r
     JOIN usuario_rol ur ON r.id_rol = ur.id_rol
     WHERE ur.id_usuario = ?`,
    [idUsuario]
  );
  return rows.map(r => r.nombre);
}

// --- Registro ---
async function registrarUsuario({ nombre, email, telefono, password }) {
  const hashed = await bcrypt.hash(password, 10);

  // Obtener conexión dedicada para usar transacción explícita
  const connection = await db.getConnection();
  let idUsuario;

  try {
    await connection.beginTransaction();
    console.log('🔄 MySQL TRANSACTION BEGIN — registro de usuario');

    // 1. Insertar usuario
    const [result] = await connection.execute(
      'INSERT INTO usuario (nombre, email, telefono, contrasena, fecha_registro) VALUES (?, ?, ?, ?, NOW())',
      [nombre, email, telefono || null, hashed]
    );
    idUsuario = result.insertId;
    console.log(`   ✅ INSERT usuario id=${idUsuario}`);

    // 2. Asignar rol CLIENTE
    const [rolRows] = await connection.execute("SELECT id_rol FROM rol WHERE nombre = 'CLIENTE' LIMIT 1");
    if (rolRows.length > 0) {
      await connection.execute('INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)', [idUsuario, rolRows[0].id_rol]);
      console.log(`   ✅ INSERT usuario_rol id_rol=${rolRows[0].id_rol}`);
    }

    await connection.commit();
    console.log('✅ MySQL TRANSACTION COMMIT — registro exitoso');
  } catch (err) {
    await connection.rollback();
    console.log('❌ MySQL TRANSACTION ROLLBACK — error:', err.message);
    throw err;
  } finally {
    connection.release();
  }

  // Obtener usuario completo
  const [userRows] = await db.execute('SELECT id_usuario, nombre, email, telefono FROM usuario WHERE id_usuario = ?', [idUsuario]);
  const user = userRows[0];
  const roles = await getRolesFromDB(idUsuario);

  // Guardar en Redis (persistente, sin TTL)
  const redisUserData = { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email, telefono: user.telefono, roles };
  await Cache.setUser(email, redisUserData);
  console.log(`💾 Redis SET user:${email}`);

  // Guardar permisos en Redis (con TTL)
  const permisos = { roles, permissions: getPermissionsByRoles(roles) };
  await Cache.setPermissions(email, permisos);
  console.log(`💾 Redis SET permisos:${email}`);

  return {
    message: 'Usuario registrado exitosamente',
    user: { ...user, roles },
    redis: {
      clave_usuario: `user:${email}`,
      clave_permisos: `permisos:${email}`,
      datos_guardados: redisUserData
    }
  };
}

// --- Login ---
async function loginUsuario(email, password) {
  // 1. Buscar en Redis (datos de perfil)
  let cached = await Cache.getUser(email);

  // 2. Siempre verificar contraseña contra MySQL (no se guarda en Redis)
  const [rows] = await db.execute('SELECT * FROM usuario WHERE email = ?', [email]);
  if (rows.length === 0) throw new Error('Credenciales inválidas');
  const userDB = rows[0];

  const valid = await bcrypt.compare(password, userDB.contrasena);
  if (!valid) throw new Error('Credenciales inválidas');

  // 3. Obtener roles
  const roles = await getRolesFromDB(userDB.id_usuario);
  const user = cached || userDB;

  // 4. Si no estaba en caché, guardarlo ahora (SIN contraseña)
  const source = cached ? 'redis' : 'mysql';
  if (!cached) {
    await Cache.setUser(email, { id_usuario: userDB.id_usuario, nombre: userDB.nombre, email: userDB.email, telefono: userDB.telefono, roles });
    console.log(`💾 Redis SET user:${email} (datos cargados desde MySQL)`);
  } else {
    console.log(`⚡ Redis HIT user:${email} (datos leídos desde Redis)`);
  }

  // 6. Generar JWT
  const token = jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, roles },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // 7. Crear sesión en Redis (con TTL 1h)
  await Cache.setSession(token, { id_usuario: user.id_usuario, email: user.email, roles, login_time: new Date().toISOString() });
  console.log(`💾 Redis SET session:<token>`);

  // 8. Guardar permisos
  await Cache.setPermissions(email, { roles, permissions: getPermissionsByRoles(roles) });
  console.log(`💾 Redis SET permisos:${email}`);

  return {
    message: 'Login exitoso',
    source,
    token,
    user: { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email, roles },
    redis_keys: {
      usuario: `user:${email}`,
      permisos: `permisos:${email}`,
      sesion: 'session:<token>'
    }
  };
}

// --- Logout ---
async function logoutUsuario(token) {
  await Cache.deleteSession(token);
  return { message: 'Sesión cerrada exitosamente' };
}

// --- Cambiar email ---
async function cambiarEmail(idUsuario, emailActual, nuevoEmail) {
  await db.execute('UPDATE usuario SET email = ? WHERE id_usuario = ?', [nuevoEmail, idUsuario]);

  // Mover caché del viejo email al nuevo
  const userData = await Cache.getUser(emailActual);
  if (userData) {
    await Cache.deleteUser(emailActual);
    userData.email = nuevoEmail;
    await Cache.setUser(nuevoEmail, userData);
  }

  return { message: 'Email actualizado', email: nuevoEmail };
}

// --- Cambiar password ---
async function cambiarPassword(idUsuario, email, passwordActual, nuevoPassword) {
  const [rows] = await db.execute('SELECT contrasena FROM usuario WHERE id_usuario = ?', [idUsuario]);
  if (rows.length === 0) throw new Error('Usuario no encontrado');

  const valid = await bcrypt.compare(passwordActual, rows[0].contrasena);
  if (!valid) throw new Error('Contraseña actual incorrecta');

  const hashed = await bcrypt.hash(nuevoPassword, 10);
  await db.execute('UPDATE usuario SET contrasena = ? WHERE id_usuario = ?', [hashed, idUsuario]);

  return { message: 'Contraseña actualizada exitosamente' };
}

// --- Redis keys (debugging/evaluación) ---
async function getRedisKeys() {
  const allKeys = await Cache.keys('*');
  const usuarios  = allKeys.filter(k => k.startsWith('user:'));
  const sesiones  = allKeys.filter(k => k.startsWith('session:'));
  const permisos  = allKeys.filter(k => k.startsWith('permisos:'));
  const menus     = allKeys.filter(k => k.startsWith('menu:'));

  // Obtener valores de cada clave para mostrar contenido completo
  async function getValues(keys) {
    const entries = [];
    for (const key of keys) {
      try {
        const raw = await Cache.getRaw(key);
        let value = raw;
        try { value = JSON.parse(raw); } catch {}
        entries.push({ clave: key, valor: value });
      } catch {
        entries.push({ clave: key, valor: '[error leyendo]' });
      }
    }
    return entries;
  }

  const [datosUsuarios, datosPermisos, datosMenus] = await Promise.all([
    getValues(usuarios),
    getValues(permisos),
    getValues(menus)
  ]);

  return {
    total_claves: allKeys.length,
    todas_las_claves: allKeys,
    usuarios: {
      count: usuarios.length,
      datos: datosUsuarios
    },
    sesiones: {
      count: sesiones.length,
      claves: sesiones
    },
    permisos: {
      count: permisos.length,
      datos: datosPermisos
    },
    menus: {
      count: menus.length,
      datos: datosMenus
    }
  };
}

module.exports = {
  registrarUsuario,
  loginUsuario,
  logoutUsuario,
  cambiarEmail,
  cambiarPassword,
  getRedisKeys
};
