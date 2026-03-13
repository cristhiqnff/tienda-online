const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Forzar IPv4 para evitar errores ENETUNREACH
  keepAlive: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

module.exports = pool;
