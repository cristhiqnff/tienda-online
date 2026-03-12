// Endpoint para crear tablas automáticamente
// Agregar a server.js después de las rutas

app.get("/setup-database", async (req, res) => {
  try {
    const pool = require('./db.js');
    
    // Crear tablas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id_usuario SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        estado VARCHAR(20) DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rol (
        id_rol SERIAL PRIMARY KEY,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categoria (
        id_categoria SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        imagen_url VARCHAR(255),
        estado VARCHAR(20) DEFAULT 'activo',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar datos básicos
    await pool.query(`
      INSERT INTO rol (nombre, descripcion) VALUES
      ('SUPER_ADMIN', 'Acceso completo al sistema'),
      ('ADMIN', 'Acceso administrativo general'),
      ('VENDEDOR', 'Gestión de productos y ventas'),
      ('CLIENTE', 'Acceso básico de cliente')
      ON CONFLICT (nombre) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO categoria (nombre, descripcion) VALUES
      ('Electrónica', 'Productos electrónicos y gadgets'),
      ('Ropa', 'Prendas de vestir y accesorios'),
      ('Hogar', 'Artículos para el hogar'),
      ('Libros', 'Libros y material de lectura'),
      ('Deportes', 'Artículos deportivos y fitness')
      ON CONFLICT (nombre) DO NOTHING
    `);

    res.json({
      success: true,
      message: "Base de datos configurada exitosamente"
    });

  } catch (error) {
    console.error("Error configurando BD:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
