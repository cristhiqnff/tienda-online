const pool = require("../db.js");
const MAX_IMAGE_CHARS = Number(process.env.MAX_IMAGE_CHARS || (4 * 1024 * 1024)); // ~4MB en texto/base64

// En PostgreSQL actual no tenemos columna ciudad_origen en producto,
// así que por simplicidad omitimos esa lógica y solo trabajamos con los campos existentes.

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
  // Código genérico de overflow de longitud en PostgreSQL
  if (error && (error.code === '22001')) {
    const err = new Error('La imagen supera el tamaño permitido por la base de datos. Usa una imagen más liviana.');
    err.status = 413;
    return err;
  }
  return error;
}

// ─────────────────────────────────────────────────────────────
// Consultas de productos
// ─────────────────────────────────────────────────────────────

async function listar() {
  const { rows } = await pool.query(
    `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen_url AS imagen
    FROM producto p
    ORDER BY p.id_producto DESC
    `
  );
  return rows;
}

// En el modelo actual no tenemos columna id_vendedor en producto,
// así que por ahora devolvemos el mismo listado completo.
async function listarPorVendedor(idVendedor) {
  return listar();
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen_url AS imagen
    FROM producto p
    WHERE p.id_producto = $1
    `,
    [id]
  );
  return rows[0];
}

async function masVendidosPorCategoria(idCategoria, limit = 6) {
  const top = Math.max(1, Math.min(Number(limit) || 6, 24));
  const { rows } = await pool.query(
    `
    SELECT
      p.id_producto,
      p.nombre,
      p.precio,
      p.stock,
      p.id_categoria,
      p.imagen_url AS imagen,
      COALESCE(SUM(dp.cantidad), 0) AS vendidos
    FROM producto p
    LEFT JOIN detalle_pedido dp ON dp.id_producto = p.id_producto
    WHERE p.id_categoria = $1
    GROUP BY p.id_producto
    ORDER BY vendidos DESC, p.id_producto DESC
    LIMIT $2
    `,
    [idCategoria, top]
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────
// Mutaciones de productos
// ─────────────────────────────────────────────────────────────

async function crearProducto(datos, idVendedor) {
  const { id_categoria, nombre, descripcion, precio, stock, imagen } = datos;
  const imagenNormalizada = normalizarImagen(imagen);

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, imagen_url, estado)
      VALUES ($1, $2, $3, $4, $5, $6, 'activo')
      RETURNING id_producto
      `,
      [
        id_categoria || null,
        nombre,
        descripcion || null,
        precio,
        stock ?? 0,
        imagenNormalizada
      ]
    );
    return rows[0]?.id_producto;
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}

// Función genérica de inserción (usada en algunas partes del frontend)
async function insertar(producto) {
  try {
    const imagenNormalizada = normalizarImagen(producto.imagen);
    const { rows } = await pool.query(
      `
      INSERT INTO producto (nombre, precio, stock, id_categoria, imagen_url, estado)
      VALUES ($1, $2, $3, $4, $5, 'activo')
      RETURNING id_producto
      `,
      [
        producto.nombre,
        producto.precio,
        producto.stock ?? 0,
        producto.id_categoria || null,
        imagenNormalizada
      ]
    );

    return {
      message: "Producto creado correctamente",
      insertId: rows[0]?.id_producto
    };
  } catch (error) {
    throw mapearErrorDbImagen(error);
  }
}

async function actualizar(id, producto) {
  try {
    const imagenNormalizada = normalizarImagen(producto.imagen);
    const { rowCount } = await pool.query(
      `
      UPDATE producto
      SET nombre = $1,
          precio = $2,
          stock = $3,
          id_categoria = $4,
          imagen_url = $5,
          fecha_actualizacion = NOW()
      WHERE id_producto = $6
      `,
      [
        producto.nombre,
        producto.precio,
        producto.stock ?? 0,
        producto.id_categoria || null,
        imagenNormalizada,
        id
      ]
    );
    return rowCount;
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Eliminar atributos asociados (si existen)
    await client.query('DELETE FROM producto_atributo WHERE id_producto = $1', [idProducto]);

    // Eliminar producto
    const { rowCount } = await client.query(
      'DELETE FROM producto WHERE id_producto = $1',
      [idProducto]
    );

    await client.query('COMMIT');
    return rowCount;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────
// Atributos por producto
// Tabla actual: producto_atributo(id_atributo, id_producto, nombre_atributo, valor_atributo)
// El frontend maneja seccion/atributo/valor; por simplicidad
// guardamos "seccion:atributo" en nombre_atributo.
// ─────────────────────────────────────────────────────────────

function descomponerNombreAtributo(nombre) {
  const txt = String(nombre || '');
  const idx = txt.indexOf(':');
  if (idx === -1) {
    return { seccion: 'General', atributo: txt };
  }
  return {
    seccion: txt.slice(0, idx) || 'General',
    atributo: txt.slice(idx + 1) || ''
  };
}

function componerNombreAtributo(seccion, atributo) {
  const s = String(seccion || 'General').trim();
  const a = String(atributo || '').trim();
  return `${s}:${a}`;
}

async function obtenerAtributosPorProducto(idProducto) {
  const { rows } = await pool.query(
    `
    SELECT id_atributo, nombre_atributo, valor_atributo
    FROM producto_atributo
    WHERE id_producto = $1
    ORDER BY nombre_atributo
    `,
    [idProducto]
  );

  return rows.map(r => {
    const { seccion, atributo } = descomponerNombreAtributo(r.nombre_atributo);
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
  const { rows } = await pool.query(
    `
    INSERT INTO producto_atributo (id_producto, nombre_atributo, valor_atributo)
    VALUES ($1, $2, $3)
    RETURNING id_atributo
    `,
    [idProducto, nombre, valor]
  );
  return rows[0]?.id_atributo;
}

async function eliminarAtributo(idAtributo) {
  const { rowCount } = await pool.query(
    `DELETE FROM producto_atributo WHERE id_atributo = $1`,
    [idAtributo]
  );
  return rowCount;
}

async function reemplazarAtributos(idProducto, atributos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM producto_atributo WHERE id_producto = $1', [idProducto]);

    if (Array.isArray(atributos) && atributos.length) {
      for (const a of atributos) {
        const nombre = componerNombreAtributo(a.seccion, a.atributo);
        await client.query(
          `
          INSERT INTO producto_atributo (id_producto, nombre_atributo, valor_atributo)
          VALUES ($1, $2, $3)
          `,
          [idProducto, nombre, a.valor]
        );
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
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
