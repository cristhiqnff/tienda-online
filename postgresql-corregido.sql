-- Script corregido para PostgreSQL - Sin ON CONFLICT problemáticos
-- Compatible con tu base de datos de Render

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
    nombre VARCHAR(100) UNIQUE NOT NULL,
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

-- Crear tabla de departamentos
CREATE TABLE IF NOT EXISTS departamento (
    id_departamento SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_dane VARCHAR(10) UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de ciudades
CREATE TABLE IF NOT EXISTS ciudad (
    id_ciudad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_departamento INTEGER,
    codigo_dane VARCHAR(10) UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);

-- Crear tabla de direcciones
CREATE TABLE IF NOT EXISTS direccion (
    id_direccion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    id_ciudad INTEGER,
    id_departamento INTEGER,
    codigo_postal VARCHAR(20),
    telefono VARCHAR(20),
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_ciudad) REFERENCES ciudad(id_ciudad),
    FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_direccion INTEGER,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP,
    metodo_pago VARCHAR(50),
    indicaciones_entrega TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_direccion) REFERENCES direccion(id_direccion)
);

-- Crear tabla de detalle_pedido
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Crear tabla de estado_pedido
CREATE TABLE IF NOT EXISTS estado_pedido (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    color VARCHAR(10) DEFAULT '#007bff'
);

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS pago (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia VARCHAR(255),
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
);

-- Crear tabla de kardex
CREATE TABLE IF NOT EXISTS kardex (
    id_kardex SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    tipo_movimiento VARCHAR(10) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) DEFAULT 0.00,
    referencia VARCHAR(255),
    id_usuario INTEGER,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Crear tabla de tipos_movimiento
CREATE TABLE IF NOT EXISTS tipos_movimiento (
    id_tipo SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    afecta_stock BOOLEAN DEFAULT TRUE
);

-- Crear tabla de configuracion_kardex
CREATE TABLE IF NOT EXISTS configuracion_kardex (
    id_config SERIAL PRIMARY KEY,
    parametro VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT
);

-- Crear tabla de empleado
CREATE TABLE IF NOT EXISTS empleado (
    id_empleado SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE,
    codigo_empleado VARCHAR(20) UNIQUE,
    salario DECIMAL(10,2),
    fecha_contratacion DATE,
    estado VARCHAR(20) DEFAULT 'activo',
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Crear tabla de empleado_perfil
CREATE TABLE IF NOT EXISTS empleado_perfil (
    id_perfil SERIAL PRIMARY KEY,
    id_empleado INTEGER NOT NULL,
    departamento VARCHAR(100),
    posicion VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

-- Crear tabla de perfil
CREATE TABLE IF NOT EXISTS perfil (
    id_perfil SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

-- Crear tabla de menu_navegacion
CREATE TABLE IF NOT EXISTS menu_navegacion (
    id_menu SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(50),
    ruta VARCHAR(255),
    orden INTEGER DEFAULT 0,
    padre_id INTEGER,
    estado VARCHAR(20) DEFAULT 'activo',
    FOREIGN KEY (padre_id) REFERENCES menu_navegacion(id_menu)
);

-- Crear tabla de permiso_perfil_menu
CREATE TABLE IF NOT EXISTS permiso_perfil_menu (
    id_perfil_menu SERIAL PRIMARY KEY,
    id_perfil INTEGER NOT NULL,
    id_menu INTEGER NOT NULL,
    puede_ver BOOLEAN DEFAULT TRUE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_eliminar BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_perfil) REFERENCES perfil(id_perfil),
    FOREIGN KEY (id_menu) REFERENCES menu_navegacion(id_menu)
);

-- Crear tabla de rol_empleado
CREATE TABLE IF NOT EXISTS rol_empleado (
    id_rol_empleado SERIAL PRIMARY KEY,
    id_empleado INTEGER NOT NULL,
    id_rol INTEGER NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado),
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);

-- Crear tabla de producto_atributo
CREATE TABLE IF NOT EXISTS producto_atributo (
    id_atributo SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    nombre_atributo VARCHAR(100) NOT NULL,
    valor_atributo TEXT,
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
);

-- Crear tabla de resena
CREATE TABLE IF NOT EXISTS resena (
    id_resena SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'pendiente',
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Crear tabla de vendedor_solicitud
CREATE TABLE IF NOT EXISTS vendedor_solicitud (
    id_solicitud SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    nombre_negocio VARCHAR(200),
    descripcion_negocio TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP,
    motivo_rechazo TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Crear tabla de auditoria_permisos
CREATE TABLE IF NOT EXISTS auditoria_permisos (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    id_registro_afectado INTEGER,
    fecha_auditoria TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    detalles TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Insertar datos básicos de roles (usando INSERT IGNORE con NOT EXISTS)
INSERT INTO rol (nombre, descripcion) 
SELECT 'SUPER_ADMIN', 'Acceso completo al sistema'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'SUPER_ADMIN');

INSERT INTO rol (nombre, descripcion) 
SELECT 'ADMIN', 'Acceso administrativo general'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'ADMIN');

INSERT INTO rol (nombre, descripcion) 
SELECT 'VENDEDOR', 'Gestión de productos y ventas'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'VENDEDOR');

INSERT INTO rol (nombre, descripcion) 
SELECT 'CLIENTE', 'Acceso básico de cliente'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'CLIENTE');

INSERT INTO rol (nombre, descripcion) 
SELECT 'GERENTE', 'Gestión de reportes y analytics'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'GERENTE');

-- Insertar departamentos (Colombia)
INSERT INTO departamento (nombre, codigo_dane) 
SELECT 'Antioquia', '05'
WHERE NOT EXISTS (SELECT 1 FROM departamento WHERE codigo_dane = '05');

INSERT INTO departamento (nombre, codigo_dane) 
SELECT 'Bogotá D.C.', '11'
WHERE NOT EXISTS (SELECT 1 FROM departamento WHERE codigo_dane = '11');

INSERT INTO departamento (nombre, codigo_dane) 
SELECT 'Valle del Cauca', '76'
WHERE NOT EXISTS (SELECT 1 FROM departamento WHERE codigo_dane = '76');

INSERT INTO departamento (nombre, codigo_dane) 
SELECT 'Atlántico', '08'
WHERE NOT EXISTS (SELECT 1 FROM departamento WHERE codigo_dane = '08');

INSERT INTO departamento (nombre, codigo_dane) 
SELECT 'Santander', '68'
WHERE NOT EXISTS (SELECT 1 FROM departamento WHERE codigo_dane = '68');

-- Insertar ciudades principales
INSERT INTO ciudad (nombre, id_departamento, codigo_dane) 
SELECT 'Medellín', 1, '05001'
WHERE NOT EXISTS (SELECT 1 FROM ciudad WHERE codigo_dane = '05001');

INSERT INTO ciudad (nombre, id_departamento, codigo_dane) 
SELECT 'Bogotá', 2, '11001'
WHERE NOT EXISTS (SELECT 1 FROM ciudad WHERE codigo_dane = '11001');

INSERT INTO ciudad (nombre, id_departamento, codigo_dane) 
SELECT 'Cali', 3, '76001'
WHERE NOT EXISTS (SELECT 1 FROM ciudad WHERE codigo_dane = '76001');

INSERT INTO ciudad (nombre, id_departamento, codigo_dane) 
SELECT 'Barranquilla', 4, '08001'
WHERE NOT EXISTS (SELECT 1 FROM ciudad WHERE codigo_dane = '08001');

INSERT INTO ciudad (nombre, id_departamento, codigo_dane) 
SELECT 'Bucaramanga', 5, '68001'
WHERE NOT EXISTS (SELECT 1 FROM ciudad WHERE codigo_dane = '68001');

-- Insertar categorías
INSERT INTO categoria (nombre, descripcion) 
SELECT 'Electrónica', 'Productos electrónicos y gadgets'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Electrónica');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Ropa y Accesorios', 'Prendas de vestir y accesorios'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Ropa y Accesorios');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Hogar y Cocina', 'Artículos para el hogar y cocina'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Hogar y Cocina');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Libros y Papelería', 'Libros y material de oficina'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Libros y Papelería');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Deportes y Fitness', 'Artículos deportivos y fitness'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Deportes y Fitness');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Salud y Belleza', 'Productos de salud y cuidado personal'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Salud y Belleza');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Juguetes y Juegos', 'Juguetes y juegos para todas las edades'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Juguetes y Juegos');

INSERT INTO categoria (nombre, descripcion) 
SELECT 'Automotriz', 'Accesorios y productos para vehículos'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre = 'Automotriz');

-- Insertar estados de pedido
INSERT INTO estado_pedido (nombre, descripcion, color) 
SELECT 'pendiente', 'Pedido pendiente de confirmación', '#ffc107'
WHERE NOT EXISTS (SELECT 1 FROM estado_pedido WHERE nombre = 'pendiente');

INSERT INTO estado_pedido (nombre, descripcion, color) 
SELECT 'confirmado', 'Pedido confirmado y en preparación', '#17a2b8'
WHERE NOT EXISTS (SELECT 1 FROM estado_pedido WHERE nombre = 'confirmado');

INSERT INTO estado_pedido (nombre, descripcion, color) 
SELECT 'enviado', 'Pedido enviado al cliente', '#007bff'
WHERE NOT EXISTS (SELECT 1 FROM estado_pedido WHERE nombre = 'enviado');

INSERT INTO estado_pedido (nombre, descripcion, color) 
SELECT 'entregado', 'Pedido entregado exitosamente', '#28a745'
WHERE NOT EXISTS (SELECT 1 FROM estado_pedido WHERE nombre = 'entregado');

INSERT INTO estado_pedido (nombre, descripcion, color) 
SELECT 'cancelado', 'Pedido cancelado', '#dc3545'
WHERE NOT EXISTS (SELECT 1 FROM estado_pedido WHERE nombre = 'cancelado');

-- Insertar tipos de movimiento
INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) 
SELECT 'Compra', 'Entrada de productos por compra', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tipos_movimiento WHERE nombre = 'Compra');

INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) 
SELECT 'Venta', 'Salida de productos por venta', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tipos_movimiento WHERE nombre = 'Venta');

INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) 
SELECT 'Ajuste', 'Ajuste manual de inventario', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tipos_movimiento WHERE nombre = 'Ajuste');

INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) 
SELECT 'Devolución', 'Entrada por devolución de cliente', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tipos_movimiento WHERE nombre = 'Devolución');

INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) 
SELECT 'Pérdida', 'Salida por pérdida o daño', TRUE
WHERE NOT EXISTS (SELECT 1 FROM tipos_movimiento WHERE nombre = 'Pérdida');

INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) 
SELECT 'Transferencia', 'Movimiento entre bodegas', FALSE
WHERE NOT EXISTS (SELECT 1 FROM tipos_movimiento WHERE nombre = 'Transferencia');

-- Insertar configuración kardex
INSERT INTO configuracion_kardex (parametro, valor, descripcion) 
SELECT 'control_stock_negativo', 'false', 'Permitir stock negativo'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_kardex WHERE parametro = 'control_stock_negativo');

INSERT INTO configuracion_kardex (parametro, valor, descripcion) 
SELECT 'alerta_stock_minimo', '10', 'Alerta cuando stock sea menor a'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_kardex WHERE parametro = 'alerta_stock_minimo');

INSERT INTO configuracion_kardex (parametro, valor, descripcion) 
SELECT 'auto_ajuste_venta', 'true', 'Ajustar stock automáticamente en ventas'
WHERE NOT EXISTS (SELECT 1 FROM configuracion_kardex WHERE parametro = 'auto_ajuste_venta');

-- Insertar perfiles de empleado
INSERT INTO perfil (nombre, descripcion) 
SELECT 'Gerente', 'Gerente de tienda con acceso completo'
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE nombre = 'Gerente');

INSERT INTO perfil (nombre, descripcion) 
SELECT 'Vendedor', 'Vendedor con acceso a ventas y productos'
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE nombre = 'Vendedor');

INSERT INTO perfil (nombre, descripcion) 
SELECT 'Almacenista', 'Encargado de inventario y bodega'
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE nombre = 'Almacenista');

INSERT INTO perfil (nombre, descripcion) 
SELECT 'Cajero', 'Responsable de caja y pagos'
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE nombre = 'Cajero');

-- Insertar menú de navegación
INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Dashboard', 'fas fa-tachometer-alt', '/dashboard', 1
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/dashboard');

INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Ventas', 'fas fa-shopping-cart', '/ventas', 2
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/ventas');

INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Productos', 'fas fa-box', '/productos', 3
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/productos');

INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Inventario', 'fas fa-warehouse', '/inventario', 4
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/inventario');

INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Clientes', 'fas fa-users', '/clientes', 5
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/clientes');

INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Reportes', 'fas fa-chart-bar', '/reportes', 6
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/reportes');

INSERT INTO menu_navegacion (nombre, icono, ruta, orden) 
SELECT 'Configuración', 'fas fa-cog', '/configuracion', 7
WHERE NOT EXISTS (SELECT 1 FROM menu_navegacion WHERE ruta = '/configuracion');

-- Insertar usuario administrador principal
INSERT INTO usuario (nombre, email, contrasena, telefono) 
SELECT 'Administrador Principal', 'admin@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3001234567'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'admin@tienda.com');

-- Insertar usuarios de ejemplo
INSERT INTO usuario (nombre, email, contrasena, telefono) 
SELECT 'Juan Pérez', 'juan.perez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3002345678'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'juan.perez@tienda.com');

INSERT INTO usuario (nombre, email, contrasena, telefono) 
SELECT 'María Rodríguez', 'maria.rodriguez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3003456789'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'maria.rodriguez@tienda.com');

INSERT INTO usuario (nombre, email, contrasena, telefono) 
SELECT 'Carlos López', 'carlos.lopez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3004567890'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'carlos.lopez@tienda.com');

INSERT INTO usuario (nombre, email, contrasena, telefono) 
SELECT 'Ana Martínez', 'ana.martinez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3005678901'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE email = 'ana.martinez@tienda.com');

-- Asignar roles a usuarios
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'admin@tienda.com' AND r.nombre = 'SUPER_ADMIN'
AND NOT EXISTS (SELECT 1 FROM usuario_rol WHERE id_usuario = u.id_usuario AND id_rol = r.id_rol);

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'juan.perez@tienda.com' AND r.nombre = 'VENDEDOR'
AND NOT EXISTS (SELECT 1 FROM usuario_rol WHERE id_usuario = u.id_usuario AND id_rol = r.id_rol);

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'maria.rodriguez@tienda.com' AND r.nombre = 'VENDEDOR'
AND NOT EXISTS (SELECT 1 FROM usuario_rol WHERE id_usuario = u.id_usuario AND id_rol = r.id_rol);

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'carlos.lopez@tienda.com' AND r.nombre = 'CLIENTE'
AND NOT EXISTS (SELECT 1 FROM usuario_rol WHERE id_usuario = u.id_usuario AND id_rol = r.id_rol);

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'ana.martinez@tienda.com' AND r.nombre = 'CLIENTE'
AND NOT EXISTS (SELECT 1 FROM usuario_rol WHERE id_usuario = u.id_usuario AND id_rol = r.id_rol);

-- Insertar productos de ejemplo
INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Laptop Pro 15"', 'Laptop de alto rendimiento con Intel i7, 16GB RAM, 512GB SSD', 1299999.99, 10, 1, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Laptop Pro 15"');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Smartphone Ultra X', 'Último modelo con cámara de 108MP, 5G, 256GB', 899999.99, 25, 1, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Smartphone Ultra X');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Tablet Pro 12"', 'Tablet profesional con stylus y teclado detachable', 599999.99, 15, 1, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Tablet Pro 12"');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Auriculares Bluetooth', 'Auriculares inalámbricos con cancelación de ruido', 199999.99, 50, 1, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Auriculares Bluetooth');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Smartwatch Sport', 'Reloj inteligente con GPS y monitor cardíaco', 299999.99, 30, 1, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Smartwatch Sport');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Camiseta Premium Algodón', 'Camiseta de algodón orgánico de alta calidad', 49999.99, 100, 2, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Camiseta Premium Algodón');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Jeans Classic Fit', 'Pantalones vaqueros clásicos de buen ajuste', 89999.99, 80, 2, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Jeans Classic Fit');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Chaqueta Impermeable', 'Chaqueta resistente al agua con capucha', 149999.99, 40, 2, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Chaqueta Impermeable');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Zapatillas Deportivas', 'Zapatillas cómodas para correr y caminar', 119999.99, 60, 2, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Zapatillas Deportivas');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Set de Ollas Antiadherentes', 'Juego de 5 piezas con tapas de vidrio', 249999.99, 20, 3, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Set de Ollas Antiadherentes');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Licuadora de Alta Potencia', 'Licuadora profesional con 1500W de potencia', 179999.99, 25, 3, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Licuadora de Alta Potencia');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Cafetera Espresso', 'Cafetera automática con molinillo integrado', 399999.99, 15, 3, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Cafetera Espresso');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Novela Bestseller 2024', 'Libro de ficción más vendido del año', 49999.99, 200, 4, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Novela Bestseller 2024');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Cuaderno Premium', 'Cuaderno de tapa dura con 200 hojas', 19999.99, 300, 4, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Cuaderno Premium');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Set de Marcadores', 'Juego de 36 marcadores de colores permanentes', 29999.99, 150, 4, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Set de Marcadores');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Mat de Yoga Profesional', 'Mat antideslizante de 6mm de grosor', 69999.99, 80, 5, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Mat de Yoga Profesional');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Botella Térmica 1L', 'Botella de acero inoxidable que mantiene temperatura 24h', 49999.99, 120, 5, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Botella Térmica 1L');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Banda de Resistencia', 'Set de 5 bandas con diferentes resistencias', 39999.99, 100, 5, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Banda de Resistencia');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Crema Hidratante Día', 'Crema facial con factor de protección solar', 79999.99, 90, 6, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Crema Hidratante Día');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Jabón Orgánico', 'Jabón artesanal con ingredientes naturales', 29999.99, 150, 6, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Jabón Orgánico');

INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) 
SELECT 'Shampoo Profesional', 'Shampoo para todo tipo de cabello', 59999.99, 110, 6, 'activo'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre = 'Shampoo Profesional');

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto(id_categoria);
CREATE INDEX IF NOT EXISTS idx_producto_estado ON producto(estado);
CREATE INDEX IF NOT EXISTS idx_pedido_usuario ON pedido(id_usuario);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido ON detalle_pedido(id_pedido);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_producto ON detalle_pedido(id_producto);
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON kardex(id_producto);
CREATE INDEX IF NOT EXISTS idx_kardex_fecha ON kardex(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_direccion_usuario ON direccion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ciudad_departamento ON ciudad(id_departamento);
CREATE INDEX IF NOT EXISTS idx_resena_producto ON resena(id_producto);
CREATE INDEX IF NOT EXISTS idx_resena_usuario ON resena(id_usuario);

-- Mostrar resumen final
SELECT 'Base de datos Tienda Online creada exitosamente' AS mensaje;
SELECT COUNT(*) as total_categorias FROM categoria;
SELECT COUNT(*) as total_productos FROM producto;
SELECT COUNT(*) as total_usuarios FROM usuario;
SELECT COUNT(*) as total_pedidos FROM pedido;
SELECT COUNT(*) as total_movimientos_kardex FROM kardex;
