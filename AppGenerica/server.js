const express = require("express");
const cors = require("cors");
const path = require("path");
const { securityHeaders, createRateLimiter } = require("./middlewares/security");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors(
  (isProduction && allowedOrigins.length)
    ? {
        origin: (origin, callback) => {
          // Allow non-browser requests (no Origin header) and configured origins.
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error('Origen no permitido por CORS'));
        }
      }
    : {}
)); // En desarrollo se permiten orígenes sin restricción.

app.use(securityHeaders);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '3mb' }));

const apiRateLimiter = createRateLimiter({
  id: 'api-global',
  windowMs: Number(process.env.API_RATE_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.API_RATE_MAX || 400),
  message: 'Has enviado demasiadas solicitudes. Intenta nuevamente en unos minutos.'
});
app.use(apiRateLimiter);


const frontendDir = path.join(__dirname, "..", "frontend-html");
app.use("/frontend-html", express.static(frontendDir));


const usuarioRutas = require("./rutas/Usuario.rutas.js");
const direccionRutas = require("./rutas/Direccion.rutas.js");
const productoRutas = require("./rutas/Producto.rutas.js");
const categoriaRutas = require("./rutas/Categoria.rutas.js");
const pedidoRutas = require("./rutas/Pedido.rutas.js");
const estadoPedidoRutas = require("./rutas/Estado_pedido.rutas.js");
const detallePedidoRutas = require("./rutas/Detalle_pedido.rutas.js");
const pagoRutas = require("./rutas/Pago.rutas.js");
const resenaRutas = require("./rutas/Resena.rutas.js");
const usuarioRolRutas = require("./rutas/UsuarioRol.rutas.js");
const vendedorSolicitudRutas = require("./rutas/VendedorSolicitud.rutas.js");
const empleadoRutas = require("./rutas/Empleado.rutas.js");
const paymentRutas = require("./rutas/Payment.rutas.js");
const emailRutas = require("./rutas/Email.rutas.js");
const analyticsRutas = require("./rutas/Analytics.rutas.js");
const kardexRutas = require("./rutas/Kardex.rutas.js");
const ubicacionRutas = require("./rutas/Ubicacion.rutas.js");

// Asignar rutas
app.use("/usuario", usuarioRutas);
app.use("/direccion", direccionRutas);
app.use("/categoria", categoriaRutas);
app.use("/producto", productoRutas);
app.use("/pedido", pedidoRutas);
app.use("/estado-pedido", estadoPedidoRutas);
app.use("/detalle-pedido", detallePedidoRutas);
app.use("/pago", pagoRutas);
app.use("/resena", resenaRutas);
app.use("/usuario-rol", usuarioRolRutas);
app.use("/vendedor-solicitud", vendedorSolicitudRutas);
app.use("/empleado", empleadoRutas);
app.use("/payment", paymentRutas);
app.use("/email", emailRutas);
app.use("/analytics", analyticsRutas);
app.use("/kardex", kardexRutas);
app.use("/ubicacion", ubicacionRutas);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "API funcionando correctamente ",
    endpoints: [
      "/frontend-html/index.html",
      "/usuario",
      "/direccion",
      "/categoria",
      "/producto",
      "/pedido",
      "/estado-pedido",
      "/detalle-pedido",
      "/pago",
      "/resena",
      "/usuario-rol",
      "/vendedor-solicitud",
      "/empleado",
      "/payment",
      "/email",
      "/analytics",
      "/kardex",
      "/ubicacion"
    ]
  });
});

// ⚠️ ENDPOINTS DE CONFIGURACIÓN COMENTADOS PARA PRODUCCIÓN
// Descomentar solo para desarrollo inicial

/*
// Endpoint para configurar base de datos (solo desarrollo)
app.get("/setup-database", async (req, res) => {
  try {
    const pool = require('./db.js');
    
    // Crear tablas una por una con manejo de errores
    try {
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
      console.log("✅ Tabla categoria creada");
    } catch (err) {
      console.log("⚠️ Error tabla categoria:", err.message);
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS producto (
          id_producto SERIAL PRIMARY KEY,
          nombre VARCHAR(200) NOT NULL,
          descripcion TEXT,
          precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          stock INTEGER NOT NULL DEFAULT 0,
          id_categoria INTEGER,
          imagen_url VARCHAR(255),
          estado VARCHAR(20) DEFAULT 'activo',
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
        )
      `);
      console.log("✅ Tabla producto creada");
    } catch (err) {
      console.log("⚠️ Error tabla producto:", err.message);
    }

    try {
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
      console.log("✅ Tabla usuario creada");
    } catch (err) {
      console.log("⚠️ Error tabla usuario:", err.message);
    }

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rol (
          id_rol SERIAL PRIMARY KEY,
          nombre VARCHAR(50) UNIQUE NOT NULL,
          descripcion TEXT,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Tabla rol creada");
    } catch (err) {
      console.log("⚠️ Error tabla rol:", err.message);
    }

    // Insertar datos básicos
    try {
      await pool.query("INSERT INTO rol (nombre, descripcion) VALUES ('SUPER_ADMIN', 'Acceso completo al sistema') ON CONFLICT (nombre) DO NOTHING");
      await pool.query("INSERT INTO rol (nombre, descripcion) VALUES ('ADMIN', 'Acceso administrativo general') ON CONFLICT (nombre) DO NOTHING");
      await pool.query("INSERT INTO rol (nombre, descripcion) VALUES ('VENDEDOR', 'Gestión de productos y ventas') ON CONFLICT (nombre) DO NOTHING");
      await pool.query("INSERT INTO rol (nombre, descripcion) VALUES ('CLIENTE', 'Acceso básico de cliente') ON CONFLICT (nombre) DO NOTHING");
      console.log("✅ Roles básicos insertados");
    } catch (err) {
      console.log("⚠️ Error insertando roles:", err.message);
    }

    try {
      await pool.query(`
        INSERT INTO categoria (nombre, descripcion) VALUES 
        ('Electrónica', 'Productos electrónicos y gadgets'),
        ('Ropa y Accesorios', 'Prendas de vestir y accesorios'),
        ('Hogar y Cocina', 'Artículos para el hogar y cocina')
        ON CONFLICT (nombre) DO NOTHING
      `);
      console.log("✅ Categorías básicas insertadas");
    } catch (err) {
      console.log("⚠️ Error insertando categorías:", err.message);
    }

    try {
      await pool.query(`
        INSERT INTO usuario (nombre, email, contrasena, telefono) VALUES 
        ('Administrador', 'admin@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3001234567')
        ON CONFLICT (email) DO NOTHING
      `);
      console.log("✅ Usuario admin insertado");
    } catch (err) {
      console.log("⚠️ Error insertando usuario:", err.message);
    }

    res.json({
      success: true,
      message: "Base de datos configurada exitosamente",
      details: "Tablas y datos básicos creados"
    });

  } catch (error) {
    console.error("Error general configurando BD:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/*
// Endpoint para resetear usuario admin (solo desarrollo)
app.get("/reset-admin", async (req, res) => {
  try {
    const pool = require('./db.js');
    
    // Eliminar admin existente
    await pool.query("DELETE FROM usuario_rol WHERE id_usuario IN (SELECT id_usuario FROM usuario WHERE email = 'admin@tienda.com')");
    await pool.query("DELETE FROM usuario WHERE email = 'admin@tienda.com'");
    
    // Crear nuevo admin con contraseña simple
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const { rows } = await pool.query(
      "INSERT INTO usuario (nombre, email, contrasena, telefono) VALUES ($1, $2, $3, $4) RETURNING id_usuario",
      ['Administrador', 'admin@tienda.com', hashedPassword, '3001234567']
    );
    
    // Asignar rol SUPER_ADMIN
    await pool.query(
      "INSERT INTO usuario_rol (id_usuario, id_rol) SELECT $1, id_rol FROM rol WHERE nombre = 'SUPER_ADMIN'",
      [rows[0].id_usuario]
    );
    
    res.json({
      success: true,
      message: "Admin reseteado exitosamente",
      credentials: {
        email: "admin@tienda.com",
        password: "admin123"
      }
    });
    
  } catch (error) {
    console.error("Error reseteando admin:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/

// Endpoint de login directo sin dependencias de servicios
app.post("/usuario/login-directo", async (req, res) => {
  try {
    const pool = require('./db.js');
    const { email, password } = req.body;
    
    // Buscar usuario en PostgreSQL
    const { rows } = await pool.query(
      "SELECT u.*, r.nombre as rol FROM usuario u LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario LEFT JOIN rol r ON ur.id_rol = r.id_rol WHERE u.email = $1",
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no registrado" });
    }
    
    const usuario = rows[0];
    
    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(password, usuario.contrasena);
    
    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    
    // Generar token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id_usuario: usuario.id_usuario, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: "Login exitoso",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
    
  } catch (error) {
    console.error("Error en login directo:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Ruta no encontrada",
    method: req.method,
    path: req.path
  });
});


app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════╗");
  console.log(`║  ✅ API corriendo en puerto ${PORT}   ║`);
  console.log("╚══════════════════════════════════════╝");
  console.log(`📡 http://localhost:${PORT}`);
});
