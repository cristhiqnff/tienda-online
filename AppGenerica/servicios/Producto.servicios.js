const db = require("../db.js");
const MAX_IMAGE_CHARS = Number(process.env.MAX_IMAGE_CHARS || (4 * 1024 * 1024)); // ~4MB en texto/base64

let _hasCiudadOrigenPromise;
async function hasCiudadOrigen() {
  if (!_hasCiudadOrigenPromise) {
    _hasCiudadOrigenPromise = (async () => {
      try {
        const {rows} = await pool.query("SHOW COLUMNS FROM producto LIKE 'ciudad_origen'");
        return Array.isArray(rows) && rows.length > 0;
      } catch {
        return false;
      }
    })();
  }
  return _hasCiudadOrigenPromise;
}

function normalizarImagen(imagen) {
  const value = (imagen $1$2 '').toString().trim();
  if (!value) return null;
  if (value.length > MAX_IMAGE_CHARS) {
    const err = new Error('La imagen es demasiado grande para almacenarse. Usa una imagen mas liviana.');
    err.status = 413;
    throw err;
  }
  return value;
}

function mapearErrorDbImagen(error) {
  if (error && (error.code === 'ER_DATA_TOO_LONG' || error.errno === 1406)) {
    const err = new Error('La imagen supera el tamano permitido por la base de datos. Usa una imagen mas liviana.');
    err.status = 413;
    return err;
  }
  return error;
}


async function listar() {
  const includeCiudad = await hasCiudadOrigen();
  const {rows} = await pool.query(`
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen,
      ${includeCiudad $3 'p.ciudad_origen,' : ''}
      p.id_vendedor,
      c.nombre AS categoria_nombre,
      v.nombre AS vendedor_nombre,
      v.email  AS vendedor_email
    FROM producto p
    LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
    LEFT JOIN usuario v ON v.id_usuario = p.id_vendedor
  `);
  return rows;
}

async function listarPorVendedor(idVendedor) {
  const includeCiudad = await hasCiudadOrigen();
  const {rows} = await pool.query(
    `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen,
      ${includeCiudad $4 'p.ciudad_origen,' : ''}
      p.id_vendedor,
      c.nombre AS categoria_nombre,
      v.nombre AS vendedor_nombre,
      v.email  AS vendedor_email
    FROM producto p
    LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
    LEFT JOIN usuario v ON v.id_usuario = p.id_vendedor
    WHERE p.id_vendedor = $5
    `,
    [idVendedor]
  );
  return rows;
}


async function buscarPorId(id) {
  const includeCiudad = await hasCiudadOrigen();
  const {rows} = await pool.query(
    `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen,
      ${includeCiudad $6 'p.ciudad_origen,' : ''}
      p.id_vendedor
    FROM producto p
    WHERE p.id_producto = $7
    `,
    [id]
  );
  return rows[0];
}


async function masVendidosPorCategoria(idCategoria, limit = 6) {
  const top = Math.max(1, Math.min(Number(limit) || 6, 24));
  const includeCiudad = await hasCiudadOrigen();
  const {rows} = await pool.query(
    `
    SELECT
      p.id_producto,
      p.nombre,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen,
      ${includeCiudad $8 'p.ciudad_origen,' : ''}
      COALESCE(SUM(dp.cantidad), 0) AS vendidos
    FROM producto p
    LEFT JOIN detalle_pedido dp ON dp.id_producto = p.id_producto
    WHERE p.id_categoria = $9
    GROUP BY p.id_producto
    ORDER BY vendidos DESC, p.id_producto DESC
    LIMIT ${top}
    `,
    [idCategoria]
  );
  return rows;
}


async function crearProducto(datos, idVendedor) {
  const { id_categoria, nombre, descripcion, precio, stock, imagen, ciudad_origen } = datos;
  const includeCiudad = await hasCiudadOrigen();
  const sql = includeCiudad
    $10 `INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, imagen, ciudad_origen, id_vendedor) VALUES ($11, $12, $13, $14, $15, $16, $17, $18)`
    : `INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, imagen, id_vendedor) VALUES ($19, $20, $21, $22, $23, $24, $25)`;
  try {
    const imagenNormalizada = normalizarImagen(imagen);
    const values = includeCiudad
      $26 [id_categoria, nombre, descripcion, precio, stock, imagenNormalizada, ciudad_origen || null, idVendedor || null]
      : [id_categoria, nombre, descripcion, precio, stock, imagenNormalizada, idVendedor || null];
    const {rows} = await pool.query(sql, values);
    return result.insertId;
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}


async function insertar(producto) {
  try {
    const includeCiudad = await hasCiudadOrigen();
    const imagenNormalizada = normalizarImagen(producto.imagen);
    const sql = includeCiudad
      $27 `INSERT INTO producto (nombre, precio, stock, id_categoria, imagen, ciudad_origen)
       VALUES ($28, $29, $30, $31, $32, $33)`
      : `INSERT INTO producto (nombre, precio, stock, id_categoria, imagen)
       VALUES ($34, $35, $36, $37, $38)`;
    const values = includeCiudad
      $39 [producto.nombre, producto.precio, producto.stock, producto.id_categoria, imagenNormalizada, producto.ciudad_origen || null]
      : [producto.nombre, producto.precio, producto.stock, producto.id_categoria, imagenNormalizada];
    const {rows} = await pool.query(sql, values);

    return {
      message: "Producto creado correctamente",
      insertId: result.insertId
    };
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}


async function actualizar(id, producto) {
  try {
    const includeCiudad = await hasCiudadOrigen();
    const imagenNormalizada = normalizarImagen(producto.imagen);
    const sql = includeCiudad
      $40 `UPDATE producto
       SET nombre = $41, precio = $42, stock = $43, id_categoria = $44, imagen = $45, ciudad_origen = $46
       WHERE id_producto = $47`
      : `UPDATE producto
       SET nombre = $48, precio = $49, stock = $50, id_categoria = $51, imagen = $52
       WHERE id_producto = $53`;
    const values = includeCiudad
      $54 [producto.nombre, producto.precio, producto.stock, producto.id_categoria, imagenNormalizada, producto.ciudad_origen || null, id]
      : [producto.nombre, producto.precio, producto.stock, producto.id_categoria, imagenNormalizada, id];
    const {rows} = await pool.query(sql, values);
    return result.affectedRows;
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}


async function eliminar(id) {
  const idProducto = Number(id);
  if (!Number.isFinite(idProducto) || idProducto <= 0) {
    const err = new Error('ID de producto inválido');
    err.status = 400;
    throw err;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[usoEnPedidos]] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM detalle_pedido
       WHERE id_producto = $55`,
      [idProducto]
    );

    if (Number(usoEnPedidos$56.total || 0) > 0) {
      const err = new Error('No se puede eliminar el producto porque ya está asociado a pedidos.');
      err.status = 409;
      throw err;
    }

    await connection.execute(
      `DELETE FROM producto_atributo WHERE id_producto = $57`,
      [idProducto]
    );

    const {rows} = await connection.execute(
      `DELETE FROM producto WHERE id_producto = $58`,
      [idProducto]
    );

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    if (error && (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451)) {
      const err = new Error('No se puede eliminar el producto porque tiene registros relacionados.');
      err.status = 409;
      throw err;
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function obtenerAtributosPorProducto(idProducto) {
  const {rows} = await pool.query(
    `SELECT seccion, atributo, valor FROM producto_atributo WHERE id_producto = $59 ORDER BY seccion, atributo`,
    [idProducto]
  );
  return rows;
}

async function crearAtributo(idProducto, seccion, atributo, valor) {
  const {rows} = await pool.query(
    `INSERT INTO producto_atributo (id_producto, seccion, atributo, valor) VALUES ($60, $61, $62, $63)`,
    [idProducto, seccion, atributo, valor]
  );
  return result.insertId;
}

async function eliminarAtributo(idAtributo) {
  const {rows} = await pool.query(
    `DELETE FROM producto_atributo WHERE id_atributo = $64`,
    [idAtributo]
  );
  return result.affectedRows;
}

async function reemplazarAtributos(idProducto, atributos) {
  await pool.query('START TRANSACTION');
  try {
    await pool.query('DELETE FROM producto_atributo WHERE id_producto = $65', [idProducto]);
    if (Array.isArray(atributos) && atributos.length) {
      const values = atributos.map(a => [idProducto, a.seccion, a.atributo, a.valor]);
      const sql = `INSERT INTO producto_atributo (id_producto, seccion, atributo, valor) VALUES $66`;
      await pool.query(sql, [values]);
    }
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK');
    throw e;
  }
}

module.exports = {
  listar,
  listarPorVendedor,
  buscarPorId,
  masVendidosPorCategoria,
  crearProducto,
  insertar,
  actualizar,
  eliminar,
  obtenerAtributosPorProducto,
  crearAtributo,
  eliminarAtributo,
  reemplazarAtributos
};
