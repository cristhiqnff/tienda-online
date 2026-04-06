const express = require('express');
const router = express.Router();
const authService = require('../servicios/Auth.servicios.js');
const { verificarToken } = require('../middlewares/auth');
const { Cache } = require('../redis.js');

// POST /auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
    }

    const result = await authService.registrarUsuario({ nombre, email, telefono, password });
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error en el registro', details: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    const result = await authService.loginUsuario(email, password);
    res.json(result);
  } catch (error) {
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    res.status(500).json({ error: 'Error en el login', details: error.message });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const result = await authService.logoutUsuario(token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error en el logout', details: error.message });
  }
});

// PUT /auth/cambiar-email
router.put('/cambiar-email', verificarToken, async (req, res) => {
  try {
    const { nuevoEmail } = req.body;
    if (!nuevoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoEmail)) {
      return res.status(400).json({ error: 'Email nuevo inválido' });
    }

    const result = await authService.cambiarEmail(req.user.id_usuario, req.user.email, nuevoEmail);
    res.json(result);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está en uso' });
    }
    res.status(500).json({ error: 'Error al cambiar email', details: error.message });
  }
});

// PUT /auth/cambiar-password
router.put('/cambiar-password', verificarToken, async (req, res) => {
  try {
    const { passwordActual, nuevoPassword } = req.body;
    if (!passwordActual || !nuevoPassword) {
      return res.status(400).json({ error: 'Password actual y nuevo son obligatorios' });
    }
    if (nuevoPassword.length < 6) {
      return res.status(400).json({ error: 'El nuevo password debe tener al menos 6 caracteres' });
    }

    const result = await authService.cambiarPassword(req.user.id_usuario, req.user.email, passwordActual, nuevoPassword);
    res.json(result);
  } catch (error) {
    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al cambiar password', details: error.message });
  }
});

// GET /auth/redis/keys
router.get('/redis/keys', async (req, res) => {
  try {
    const result = await authService.getRedisKeys();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo claves de Redis', details: error.message });
  }
});

// GET /auth/redis/test
router.get('/redis/test', async (req, res) => {
  try {
    const pong = await Cache.ping();
    res.json({ redis: pong === 'PONG' ? 'conectado' : 'error', response: pong });
  } catch (error) {
    res.status(500).json({ redis: 'desconectado', error: error.message });
  }
});

module.exports = router;
