-- Script para crear tablas básicas en PostgreSQL
-- Ejecuta este script en tu base de datos PostgreSQL de Render

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de usuario_rol
CREATE TABLE IF NOT EXISTS usuario_rol (
    id_usuario INTEGER NOT NULL,
    id_rol INTEGER NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE CASCADE
);

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de productos
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
);

-- Insertar datos básicos
INSERT INTO rol (nombre, descripcion) VALUES
('SUPER_ADMIN', 'Acceso completo al sistema'),
('ADMIN', 'Acceso administrativo general'),
('VENDEDOR', 'Gestión de productos y ventas'),
('CLIENTE', 'Acceso básico de cliente')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categoria (nombre, descripcion) VALUES
('Electrónica', 'Productos electrónicos y gadgets'),
('Ropa', 'Prendas de vestir y accesorios'),
('Hogar', 'Artículos para el hogar'),
('Libros', 'Libros y material de lectura'),
('Deportes', 'Artículos deportivos y fitness')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar usuario administrador
INSERT INTO usuario (nombre, email, contrasena, telefono) VALUES
('Administrador', 'admin@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3001234567')
ON CONFLICT (email) DO NOTHING;

-- Asignar rol de administrador
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'admin@tienda.com' AND r.nombre = 'SUPER_ADMIN'
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

-- Mostrar resumen
SELECT 'Base de datos creada exitosamente' AS mensaje;
SELECT COUNT(*) as total_roles FROM rol;
SELECT COUNT(*) as total_categorias FROM categoria;
SELECT COUNT(*) as total_usuarios FROM usuario;
