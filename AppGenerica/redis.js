const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

let isConnected = false;

redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));
redisClient.on('connect', () => { isConnected = true; console.log('✅ Redis conectado'); });
redisClient.on('end', () => { isConnected = false; });

async function ensureConnection() {
  if (!isConnected) {
    await redisClient.connect();
  }
}

const Cache = {
  // --- Usuario (persistente, sin TTL) ---
  async setUser(email, userData) {
    await ensureConnection();
    await redisClient.set(`user:${email}`, JSON.stringify(userData));
    console.log(`💾 Cache SET user:${email}`);
  },

  async getUser(email) {
    await ensureConnection();
    const val = await redisClient.get(`user:${email}`);
    if (val) { console.log(`⚡ Cache HIT user:${email}`); return JSON.parse(val); }
    return null;
  },

  async deleteUser(email) {
    await ensureConnection();
    await redisClient.del(`user:${email}`);
  },

  // --- Sesión (con TTL, default 1h) ---
  async setSession(token, sessionData, ttl = 3600) {
    await ensureConnection();
    await redisClient.setEx(`session:${token}`, ttl, JSON.stringify(sessionData));
    console.log(`🔐 Session created session:${token} (TTL ${ttl}s)`);
  },

  async getSession(token) {
    await ensureConnection();
    const val = await redisClient.get(`session:${token}`);
    if (val) return JSON.parse(val);
    return null;
  },

  async deleteSession(token) {
    await ensureConnection();
    await redisClient.del(`session:${token}`);
    console.log(`🗑️ Session deleted session:${token}`);
  },

  // --- Permisos (con TTL, default 30min) ---
  async setPermissions(email, perms, ttl = 1800) {
    await ensureConnection();
    await redisClient.setEx(`permisos:${email}`, ttl, JSON.stringify(perms));
    console.log(`💾 Cache SET permisos:${email}`);
  },

  async getPermissions(email) {
    await ensureConnection();
    const val = await redisClient.get(`permisos:${email}`);
    if (val) { console.log(`⚡ Cache HIT permisos:${email}`); return JSON.parse(val); }
    return null;
  },

  // --- Menu (con TTL, default 1h) ---
  async setMenu(menuData, ttl = 3600) {
    await ensureConnection();
    await redisClient.setEx('menu:main', ttl, JSON.stringify(menuData));
  },

  async getMenu() {
    await ensureConnection();
    const val = await redisClient.get('menu:main');
    return val ? JSON.parse(val) : null;
  },

  // --- Utilidades ---
  async ping() {
    await ensureConnection();
    return await redisClient.ping();
  },

  async keys(pattern = '*') {
    await ensureConnection();
    return await redisClient.keys(pattern);
  },

  async getRaw(key) {
    await ensureConnection();
    return await redisClient.get(key);
  },

  async quit() {
    if (isConnected) { await redisClient.quit(); console.log('👋 Redis desconectado'); }
  }
};

module.exports = { redisClient, Cache };
