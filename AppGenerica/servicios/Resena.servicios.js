const db = require("../db.js");

async function listarPorProducto(idProducto) {
  const {rows} = await pool.query(
    `
    SELECT
      r.id_resena,
      r.id_producto,
      r.id_usuario,
      r.rating,
      r.comentario,
      r.fecha,
      u.nombre AS usuario
    FROM resena r
    JOIN usuario u ON u.id_usuario = r.id_usuario
    WHERE r.id_producto = $1
    ORDER BY r.fecha DESC, r.id_resena DESC
    `,
    [idProducto]
  );
  return rows;
}

async function insertar({ id_producto, id_usuario, rating, comentario }) {
  const calificacion = Math.max(1, Math.min(Number(rating) || 0, 5));
  if (!calificacion) {
    throw new Error("Rating inválido");
  }

  const texto = (comentario || "").toString().trim();
  if (!texto) {
    throw new Error("El comentario es obligatorio");
  }

  const {rows} = await pool.query(
    `INSERT INTO resena (id_producto, id_usuario, calificacion, comentario)
     VALUES ($1, $2, $3, $4) RETURNING id_resena`,
    [id_producto, id_usuario, calificacion, texto]
  );

  return {
    message: "Reseña registrada correctamente",
    insertId: rows[0].id_resena
  };
}

async function ratingPorVendedor() {
  const {rows} = await pool.query(`
    SELECT
      v.id_usuario AS id_vendedor,
      v.nombre AS vendedor_nombre,
      v.email AS vendedor_email,
      COUNT(DISTINCT r.id_resena) AS total_resenas,
      ROUND(AVG(r.rating), 1) AS rating_promedio,
      COUNT(DISTINCT p.id_producto) AS total_productos
    FROM usuario v
    JOIN usuario_rol ur ON ur.id_usuario = v.id_usuario
    JOIN rol ro ON ro.id_rol = ur.id_rol AND ro.nombre = 'VENDEDOR'
    LEFT JOIN producto p ON p.id_vendedor = v.id_usuario
    LEFT JOIN resena r ON r.id_producto = p.id_producto
    GROUP BY v.id_usuario
    ORDER BY rating_promedio DESC
  `);
  return rows;
}

async function resenasPorVendedor(idVendedor) {
  const {rows} = await pool.query(`
    SELECT
      r.id_resena, r.rating, r.comentario, r.fecha,
      u.nombre AS usuario,
      p.nombre AS producto_nombre
    FROM resena r
    JOIN usuario u ON u.id_usuario = r.id_usuario
    JOIN producto p ON p.id_producto = r.id_producto
    WHERE p.id_vendedor = $8
    ORDER BY r.fecha DESC
    LIMIT 20
  `, [idVendedor]);
  return rows;
}

module.exports = {
  listarPorProducto,
  insertar,
  ratingPorVendedor,
  resenasPorVendedor
};
