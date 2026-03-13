const { Pool } = require("pg");
require("dotenv").config();

// Solución drástica: Forzar completamente IPv4
let connectionString = process.env.DATABASE_URL;

// Reemplazar cualquier forma del hostname por IPv4 explícito
connectionString = connectionString.replace(/db\.hpbhoaozldazdktcazgk\.supabase\.co/g, 'db.hpbhoaozldazdktcazgk.supabase.co');
connectionString = connectionString.replace(/\[.*?\]/g, 'db.hpbhoaozldazdktcazgk.supabase.co');

// Forzar family 4 y configuración agresiva
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4, // IPv4 explícito
  keepAlive: true,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  // Deshabilitar IPv6 completamente
  client_encoding: 'UTF8'
});

module.exports = pool;
