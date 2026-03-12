-- Script completo para crear todas las tablas de la Tienda Online en PostgreSQL
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
    codigo_dane VARCHAR(10),
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
    nombre VARCHAR(50) NOT NULL,
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
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    afecta_stock BOOLEAN DEFAULT TRUE
);

-- Crear tabla de configuracion_kardex
CREATE TABLE IF NOT EXISTS configuracion_kardex (
    id_config SERIAL PRIMARY KEY,
    parametro VARCHAR(100) NOT NULL,
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
    nombre VARCHAR(100) NOT NULL,
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

-- Insertar datos básicos de roles
INSERT INTO rol (nombre, descripcion) VALUES
('SUPER_ADMIN', 'Acceso completo al sistema'),
('ADMIN', 'Acceso administrativo general'),
('VENDEDOR', 'Gestión de productos y ventas'),
('CLIENTE', 'Acceso básico de cliente'),
('GERENTE', 'Gestión de reportes y analytics')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar departamentos (Colombia)
INSERT INTO departamento (nombre, codigo_dane) VALUES
('Antioquia', '05'),
('Bogotá D.C.', '11'),
('Valle del Cauca', '76'),
('Atlántico', '08'),
('Santander', '68'),
('Cundinamarca', '25'),
('Caldas', '17'),
('Risaralda', '66'),
('Quindío', '63'),
('Tolima', '73')
ON CONFLICT (codigo_dane) DO NOTHING;

-- Insertar ciudades principales
INSERT INTO ciudad (nombre, id_departamento, codigo_dane) VALUES
('Medellín', 1, '05001'),
('Bogotá', 2, '11001'),
('Cali', 3, '76001'),
('Barranquilla', 4, '08001'),
('Bucaramanga', 5, '68001'),
('Manizales', 7, '17001'),
('Pereira', 8, '66001'),
('Armenia', 9, '63001'),
('Ibagué', 10, '73001')
ON CONFLICT (codigo_dane) DO NOTHING;

-- Insertar categorías
INSERT INTO categoria (nombre, descripcion) VALUES
('Electrónica', 'Productos electrónicos y gadgets'),
('Ropa y Accesorios', 'Prendas de vestir y accesorios'),
('Hogar y Cocina', 'Artículos para el hogar y cocina'),
('Libros y Papelería', 'Libros y material de oficina'),
('Deportes y Fitness', 'Artículos deportivos y fitness'),
('Salud y Belleza', 'Productos de salud y cuidado personal'),
('Juguetes y Juegos', 'Juguetes y juegos para todas las edades'),
('Automotriz', 'Accesorios y productos para vehículos')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar estados de pedido
INSERT INTO estado_pedido (nombre, descripcion, color) VALUES
('pendiente', 'Pedido pendiente de confirmación', '#ffc107'),
('confirmado', 'Pedido confirmado y en preparación', '#17a2b8'),
('enviado', 'Pedido enviado al cliente', '#007bff'),
('entregado', 'Pedido entregado exitosamente', '#28a745'),
('cancelado', 'Pedido cancelado', '#dc3545')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de movimiento
INSERT INTO tipos_movimiento (nombre, descripcion, afecta_stock) VALUES
('Compra', 'Entrada de productos por compra', TRUE),
('Venta', 'Salida de productos por venta', TRUE),
('Ajuste', 'Ajuste manual de inventario', TRUE),
('Devolución', 'Entrada por devolución de cliente', TRUE),
('Pérdida', 'Salida por pérdida o daño', TRUE),
('Transferencia', 'Movimiento entre bodegas', FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar configuración kardex
INSERT INTO configuracion_kardex (parametro, valor, descripcion) VALUES
('control_stock_negativo', 'false', 'Permitir stock negativo'),
('alerta_stock_minimo', '10', 'Alerta cuando stock sea menor a'),
('auto_ajuste_venta', 'true', 'Ajustar stock automáticamente en ventas')
ON CONFLICT (parametro) DO NOTHING;

-- Insertar perfiles de empleado
INSERT INTO perfil (nombre, descripcion) VALUES
('Gerente', 'Gerente de tienda con acceso completo'),
('Vendedor', 'Vendedor con acceso a ventas y productos'),
('Almacenista', 'Encargado de inventario y bodega'),
('Cajero', 'Responsable de caja y pagos')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar menú de navegación
INSERT INTO menu_navegacion (nombre, icono, ruta, orden, padre_id) VALUES
('Dashboard', 'fas fa-tachometer-alt', '/dashboard', 1, NULL),
('Ventas', 'fas fa-shopping-cart', '/ventas', 2, NULL),
('Productos', 'fas fa-box', '/productos', 3, NULL),
('Inventario', 'fas fa-warehouse', '/inventario', 4, NULL),
('Clientes', 'fas fa-users', '/clientes', 5, NULL),
('Reportes', 'fas fa-chart-bar', '/reportes', 6, NULL),
('Configuración', 'fas fa-cog', '/configuracion', 7, NULL)
ON CONFLICT (nombre, ruta) DO NOTHING;

-- Insertar permisos de perfil menú
INSERT INTO permiso_perfil_menu (id_perfil, id_menu, puede_ver, puede_editar, puede_eliminar)
SELECT p.id_perfil, m.id_menu, TRUE, TRUE, TRUE
FROM perfil p, menu_navegacion m 
WHERE p.nombre = 'Gerente'
ON CONFLICT (id_perfil, id_menu) DO NOTHING;

-- Insertar usuario administrador principal
INSERT INTO usuario (nombre, email, contrasena, telefono) VALUES
('Administrador Principal', 'admin@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3001234567')
ON CONFLICT (email) DO NOTHING;

-- Insertar usuarios de ejemplo
INSERT INTO usuario (nombre, email, contrasena, telefono) VALUES
('Juan Pérez', 'juan.perez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3002345678'),
('María Rodríguez', 'maria.rodriguez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3003456789'),
('Carlos López', 'carlos.lopez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3004567890'),
('Ana Martínez', 'ana.martinez@tienda.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '3005678901')
ON CONFLICT (email) DO NOTHING;

-- Asignar roles a usuarios
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'admin@tienda.com' AND r.nombre = 'SUPER_ADMIN'
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'juan.perez@tienda.com' AND r.nombre = 'VENDEDOR'
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'maria.rodriguez@tienda.com' AND r.nombre = 'VENDEDOR'
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'carlos.lopez@tienda.com' AND r.nombre = 'CLIENTE'
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol 
FROM usuario u, rol r 
WHERE u.email = 'ana.martinez@tienda.com' AND r.nombre = 'CLIENTE'
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO producto (nombre, descripcion, precio, stock, id_categoria, estado) VALUES
('Laptop Pro 15"', 'Laptop de alto rendimiento con Intel i7, 16GB RAM, 512GB SSD', 1299999.99, 10, 1, 'activo'),
('Smartphone Ultra X', 'Último modelo con cámara de 108MP, 5G, 256GB', 899999.99, 25, 1, 'activo'),
('Tablet Pro 12"', 'Tablet profesional con stylus y teclado detachable', 599999.99, 15, 1, 'activo'),
('Auriculares Bluetooth', 'Auriculares inalámbricos con cancelación de ruido', 199999.99, 50, 1, 'activo'),
('Smartwatch Sport', 'Reloj inteligente con GPS y monitor cardíaco', 299999.99, 30, 1, 'activo'),
('Camiseta Premium Algodón', 'Camiseta de algodón orgánico de alta calidad', 49999.99, 100, 2, 'activo'),
('Jeans Classic Fit', 'Pantalones vaqueros clásicos de buen ajuste', 89999.99, 80, 2, 'activo'),
('Chaqueta Impermeable', 'Chaqueta resistente al agua con capucha', 149999.99, 40, 2, 'activo'),
('Zapatillas Deportivas', 'Zapatillas cómodas para correr y caminar', 119999.99, 60, 2, 'activo'),
('Set de Ollas Antiadherentes', 'Juego de 5 piezas con tapas de vidrio', 249999.99, 20, 3, 'activo'),
('Licuadora de Alta Potencia', 'Licuadora profesional con 1500W de potencia', 179999.99, 25, 3, 'activo'),
('Cafetera Espresso', 'Cafetera automática con molinillo integrado', 399999.99, 15, 3, 'activo'),
('Novela Bestseller 2024', 'Libro de ficción más vendido del año', 49999.99, 200, 4, 'activo'),
('Cuaderno Premium', 'Cuaderno de tapa dura con 200 hojas', 19999.99, 300, 4, 'activo'),
('Set de Marcadores', 'Juego de 36 marcadores de colores permanentes', 29999.99, 150, 4, 'activo'),
('Mat de Yoga Profesional', 'Mat antideslizante de 6mm de grosor', 69999.99, 80, 5, 'activo'),
('Botella Térmica 1L', 'Botella de acero inoxidable que mantiene temperatura 24h', 49999.99, 120, 5, 'activo'),
('Banda de Resistencia', 'Set de 5 bandas con diferentes resistencias', 39999.99, 100, 5, 'activo'),
('Crema Hidratante Día', 'Crema facial con factor de protección solar', 79999.99, 90, 6, 'activo'),
('Jabón Orgánico', 'Jabón artesanal con ingredientes naturales', 29999.99, 150, 6, 'activo'),
('Shampoo Profesional', 'Shampoo para todo tipo de cabello', 59999.99, 110, 6, 'activo')
ON CONFLICT (nombre, id_categoria) DO NOTHING;

-- Insertar direcciones de ejemplo
INSERT INTO direccion (id_usuario, direccion, id_ciudad, telefono, es_principal) VALUES
(2, 'Calle 45 #23-67, Apartamento 302', 1, '3002345678', TRUE),
(3, 'Carrera 15 #89-45, Casa 23', 2, '3003456789', TRUE),
(4, 'Avenida 6 #12-34, Edificio Plaza', 3, '3004567890', TRUE),
(5, 'Diagonal 7 #45-23, Apartamento 501', 4, '3005678901', TRUE)
ON CONFLICT (id_usuario, id_direccion) DO NOTHING;

-- Insertar pedidos de ejemplo
INSERT INTO pedido (id_usuario, id_direccion, total, estado, metodo_pago) VALUES
(4, 4, 299999.99, 'entregado', 'tarjeta'),
(5, 3, 449999.99, 'confirmado', 'transferencia'),
(4, 4, 199999.99, 'pendiente', 'efecto')
ON CONFLICT (id_pedido) DO NOTHING;

-- Insertar detalles de pedidos
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES
(1, 17, 1, 299999.99), -- Botella térmica
(2, 18, 1, 299999.99), -- Shampoo profesional
(2, 19, 1, 149999.99), -- Crema hidratante
(3, 20, 1, 199999.99)  -- Set de marcadores
ON CONFLICT (id_detalle) DO NOTHING;

-- Insertar movimientos de kardex iniciales
INSERT INTO kardex (id_producto, tipo_movimiento, cantidad, precio_unitario, referencia, id_usuario) VALUES
(1, 'entrada', 15, 1299999.99, 'Compra inicial', 1),
(2, 'entrada', 30, 899999.99, 'Compra inicial', 1),
(3, 'entrada', 20, 599999.99, 'Compra inicial', 1),
(4, 'entrada', 60, 199999.99, 'Compra inicial', 1),
(5, 'entrada', 40, 299999.99, 'Compra inicial', 1),
(6, 'entrada', 120, 49999.99, 'Compra inicial', 1),
(7, 'entrada', 100, 89999.99, 'Compra inicial', 1),
(8, 'entrada', 60, 149999.99, 'Compra inicial', 1),
(9, 'entrada', 80, 119999.99, 'Compra inicial', 1),
(10, 'entrada', 30, 249999.99, 'Compra inicial', 1),
(11, 'entrada', 35, 179999.99, 'Compra inicial', 1),
(12, 'entrada', 25, 399999.99, 'Compra inicial', 1),
(13, 'entrada', 250, 49999.99, 'Compra inicial', 1),
(14, 'entrada', 350, 19999.99, 'Compra inicial', 1),
(15, 'entrada', 200, 29999.99, 'Compra inicial', 1),
(16, 'entrada', 140, 49999.99, 'Compra inicial', 1),
(17, 'entrada', 100, 69999.99, 'Compra inicial', 1),
(18, 'entrada', 150, 49999.99, 'Compra inicial', 1),
(19, 'entrada', 180, 59999.99, 'Compra inicial', 1),
(20, 'entrada', 120, 49999.99, 'Compra inicial', 1)
ON CONFLICT (id_kardex) DO NOTHING;

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
