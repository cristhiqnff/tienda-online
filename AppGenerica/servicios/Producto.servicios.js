const db = require("../db.js");
const MAX_IMAGE_CHARS = Number(process.env.MAX_IMAGE_CHARS || (4 * 1024 * 1024)); // ~4MB en texto/base64

// Función para normalizar imagen
function normalizarImagen(imagen) {
  const value = (imagen ?? '').toString().trim();
  if (!value) return null;
  if (value.length > MAX_IMAGE_CHARS) {
    const err = new Error('La imagen es demasiado grande para almacenarse. Usa una imagen más liviana.');
    err.status = 413;
    throw err;
  }
  return value;
}

function mapearErrorDbImagen(error) {
  // Código genérico de overflow de longitud en MySQL
  if (error && (error.code === '22001' || error.code === 'ER_DATA_TOO_LONG')) {
    const err = new Error('La imagen supera el tamaño permitido por la base de datos. Usa una imagen más liviana.');
    err.status = 413;
    return err;
  }
  return error;
}

// Consultas de productos
async function listar() {
  const [rows] = await db.execute(`
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria
    FROM producto p
    ORDER BY p.id_producto DESC
  `);
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.execute(`
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria
    FROM producto p
    WHERE p.id_producto = ?
  `, [id]);
  return rows[0];
}

async function masVendidosPorCategoria(idCategoria, limit = 6) {
  const top = Math.max(1, Math.min(Number(limit) || 6, 24));
  const [rows] = await db.execute(`
    SELECT
      p.id_producto,
      p.nombre,
      p.precio,
      p.stock,
      p.id_categoria,
      COALESCE(SUM(dp.cantidad), 0) AS vendidos
    FROM producto p
    LEFT JOIN detalle_pedido dp ON dp.id_producto = p.id_producto
    WHERE p.id_categoria = ?
    GROUP BY p.id_producto
    ORDER BY vendidos DESC, p.id_producto DESC
    LIMIT ?
  `, [idCategoria, top]);
  return rows;
}

// Mutaciones de productos
async function crearProducto(datos, idVendedor) {
  const { id_categoria, nombre, descripcion, precio, stock, imagen } = datos;
  const imagenNormalizada = normalizarImagen(imagen);

  try {
    const [rows] = await db.execute(`
      INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, estado)
      VALUES (?, ?, ?, ?, ?, 'activo')
    `, [
      id_categoria || null,
      nombre,
      descripcion || null,
      precio,
      stock || 0,
      imagenNormalizada
    ]);
    return rows.insertId;
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}

async function insertar(producto) {
  try {
    const imagenNormalizada = normalizarImagen(producto.imagen);
    const [rows] = await db.execute(`
      INSERT INTO producto (nombre, precio, stock, id_categoria, estado)
      VALUES (?, ?, ?, ?, 'activo')
    `, [
      producto.nombre,
      producto.precio,
      producto.stock ?? 0,
      producto.id_categoria || null,
      imagenNormalizada
    ]);

    return {
      message: "Producto creado correctamente",
      insertId: rows.insertId
    };
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}

async function actualizar(id, producto) {
  try {
    const imagenNormalizada = normalizarImagen(producto.imagen);
    const [result] = await db.execute(`
      UPDATE producto SET
        nombre = ?,
        precio = ?,
        stock = ?,
        id_categoria = ?,
        fecha_actualizacion = NOW()
      WHERE id_producto = ?
    `, [
      producto.nombre,
      producto.precio,
      producto.stock || 0,
      producto.id_categoria || null,
      imagenNormalizada,
      id
    ]);
    return result.affectedRows;
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}

async function eliminar(id) {
  const [result] = await db.execute('DELETE FROM producto WHERE id_producto = ?', [id]);
  return result.affectedRows;
}

// Funciones auxiliares
function componerNombreAtributo(seccion, atributo) {
  const s = String(seccion || 'General').trim();
  const a = String(atributo || '').trim();
  return `${s}:${a}`;
}

async function obtenerAtributosPorProducto(idProducto) {
  const [rows] = await db.execute(`
    SELECT id_atributo, nombre_atributo, valor_atributo
    FROM producto_atributo
    WHERE id_producto = ?
    ORDER BY nombre_atributo
  `, [idProducto]);

  return rows.map(r => {
    const [seccion, atributo] = (r.nombre_atributo || '').split(':');
    return {
      id_atributo: r.id_atributo,
      seccion,
      atributo,
      valor: r.valor_atributo
    };
  });
}

async function crearAtributo(idProducto, seccion, atributo, valor) {
  const nombre = componerNombreAtributo(seccion, atributo);
  const [rows] = await db.execute(`
    INSERT INTO producto_atributo (id_producto, nombre_atributo, valor_atributo)
    VALUES (?, ?, ?)
  `, [idProducto, nombre, valor]);
  return rows.insertId;
}

async function eliminarAtributo(idAtributo) {
  const [result] = await db.execute('DELETE FROM producto_atributo WHERE id_atributo = ?', [idAtributo]);
  return result.affectedRows;
}

module.exports = {
  listar,
  buscarPorId,
  masVendidosPorCategoria,
  crearProducto,
  insertar,
  actualizar,
  eliminar,
  obtenerAtributosPorProducto,
  crearAtributo,
  eliminarAtributo
};
