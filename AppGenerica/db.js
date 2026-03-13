const { Pool } = require("pg");
require("dotenv").config();

// Forzar IPv4 reemplazando el hostname si es IPv6
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('[')) {
  // Si contiene IPv6 [::], reemplazar con IPv4
  connectionString = connectionString.replace(/\[.*?\]/, 'db.hpbhoaozldazdktcazgk.supabase.co');
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración explícita para IPv4
  family: 4, // Forzar IPv4
  keepAlive: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

module.exports = pool;
