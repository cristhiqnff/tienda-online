const db = require("../db.js");

async function listar() {
  const {rows} = await pool.query(`
    SELECT 
      p.id_pedido,
      p.id_usuario,
      p.id_estado,
      p.fecha_pedido,
      p.total,
      u.nombre AS usuario,
      e.nombre_estado AS estado
    FROM pedido p
    JOIN usuario u ON p.id_usuario = u.id_usuario
    JOIN estado_pedido e ON p.id_estado = e.id_estado
  `);
  return rows;
}


async function listarPorUsuario(idUsuario) {
  const {rows} = await pool.query(
    `
    SELECT 
      p.id_pedido,
      p.id_usuario,
      p.id_estado,
      p.fecha_pedido,
      p.total,
      e.nombre_estado AS estado
    FROM pedido p
    JOIN estado_pedido e ON p.id_estado = e.id_estado
    WHERE p.id_usuario = $1
    `,
    [idUsuario]
  );
  return rows;
}


async function insertar(pedido) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {rows} = await connection.execute(
      `INSERT INTO pedido (id_usuario, id_estado, fecha_pedido, total)
       VALUES ($2, $3, $4, $5)`,
      [
        pedido.id_usuario,
        pedido.id_estado,
        pedido.fecha_pedido || new Date(),
        pedido.total || 0
      ]
    );

    const id_pedido = result.insertId;

    if (pedido.detalles && pedido.detalles.length > 0) {
      for (const detalle of pedido.detalles) {
        const cantidad = Number(detalle.cantidad) || 0;
        const precioUnitario = Number(detalle.precio_unitario) || 0;

        if (!detalle.id_producto || cantidad <= 0 || precioUnitario <= 0) {
          const invalidDetailError = new Error('Detalle de pedido invalido');
          invalidDetailError.status = 400;
          throw invalidDetailError;
        }

        await connection.execute(
          `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
           VALUES ($6, $7, $8, $9)`,
          [
            id_pedido,
            detalle.id_producto,
            cantidad,
            precioUnitario
          ]
        );

        const [stockUpdate] = await connection.execute(
          `UPDATE producto SET stock = stock - $10 WHERE id_producto = $11 AND stock >= $12`,
          [cantidad, detalle.id_producto, cantidad]
        );

        if (!stockUpdate.affectedRows) {
          const stockError = new Error(`Stock insuficiente para el producto ${detalle.id_producto}`);
          stockError.status = 400;
          throw stockError;
        }
      }
    }

    let id_pago = null;
    if (pedido.metodo_pago) {
      const [pagoResult] = await connection.execute(
        `INSERT INTO pago (id_pedido, metodo_pago, monto, fecha_pago)
         VALUES ($13, $14, $15, $16)`,
        [id_pedido, pedido.metodo_pago, pedido.total || 0, new Date()]
      );
      id_pago = pagoResult.insertId;
    }

    await connection.commit();

    return {
      message: "Pedido registrado correctamente",
      insertId: id_pedido,
      id_pago
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function buscarPorId(id) {
  const {rows} = await pool.query(`
    SELECT 
      p.id_pedido,
      p.id_usuario,
      p.id_estado,
      p.fecha_pedido,
      p.total,
      u.nombre AS usuario,
      e.nombre_estado AS estado
    FROM pedido p
    JOIN usuario u ON p.id_usuario = u.id_usuario
    JOIN estado_pedido e ON p.id_estado = e.id_estado
    WHERE p.id_pedido = $17
  `, [id]);

  return rows[0];
}


async function actualizar(id, pedido) {
  const idPedido = Number(id);
  if (!Number.isFinite(idPedido) || idPedido <= 0) {
    const err = new Error('ID de pedido invalido');
    err.status = 400;
    throw err;
  }

  const updates = [];
  const values = [];

  if (pedido.id_usuario !== undefined && pedido.id_usuario !== null && pedido.id_usuario !== '') {
    const idUsuario = Number(pedido.id_usuario);
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      const err = new Error('Usuario invalido');
      err.status = 400;
      throw err;
    }
    updates.push('id_usuario = $18');
    values.push(idUsuario);
  }

  if (pedido.id_estado !== undefined && pedido.id_estado !== null && pedido.id_estado !== '') {
    const idEstado = Number(pedido.id_estado);
    if (!Number.isFinite(idEstado) || idEstado <= 0) {
      const err = new Error('Estado de pedido invalido');
      err.status = 400;
      throw err;
    }
    updates.push('id_estado = $19');
    values.push(idEstado);
  }

  if (pedido.total !== undefined && pedido.total !== null && pedido.total !== '') {
    const total = Number(pedido.total);
    if (!Number.isFinite(total) || total < 0) {
      const err = new Error('Total invalido');
      err.status = 400;
      throw err;
    }
    updates.push('total = $20');
    values.push(total);
  }

  if (pedido.fecha_pedido !== undefined && pedido.fecha_pedido !== null && pedido.fecha_pedido !== '') {
    const fecha = new Date(pedido.fecha_pedido);
    if (Number.isNaN(fecha.getTime())) {
      const err = new Error('Fecha de pedido invalida');
      err.status = 400;
      throw err;
    }
    updates.push('fecha_pedido = $21');
    values.push(fecha);
  }

  if (!updates.length) {
    return 0;
  }

  values.push(idPedido);
  const {rows} = await pool.query(
    `UPDATE pedido SET ${updates.join(', ')} WHERE id_pedido = $22`,
    values
  );
  return result.affectedRows;
}

async function eliminar(id) {
  const idPedido = Number(id);
  if (!Number.isFinite(idPedido) || idPedido <= 0) {
    const err = new Error('ID de pedido invalido');
    err.status = 400;
    throw err;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [detalles] = await connection.execute(
      `SELECT id_producto, cantidad FROM detalle_pedido WHERE id_pedido = $23`,
      [idPedido]
    );

    if (Array.isArray(detalles) && detalles.length) {
      for (const d of detalles) {
        const cantidad = Number(d.cantidad) || 0;
        const idProducto = Number(d.id_producto) || 0;
        if (cantidad > 0 && idProducto > 0) {
          await connection.execute(
            `UPDATE producto SET stock = stock + $24 WHERE id_producto = $25`,
            [cantidad, idProducto]
          );
        }
      }
    }

    await connection.execute(`DELETE FROM pago WHERE id_pedido = $26`, [idPedido]);
    await connection.execute(`DELETE FROM detalle_pedido WHERE id_pedido = $27`, [idPedido]);
    const {rows} = await connection.execute(`DELETE FROM pedido WHERE id_pedido = $28`, [idPedido]);

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function obtenerResumenReportes(top = 5) {
  const topLimit = Math.max(1, Math.min(Number(top) || 5, 20));

  const [[totales]] = await pool.query(
    `
    SELECT
      COUNT(*) AS total_pedidos,
      COALESCE(SUM(total), 0) AS ventas_totales,
      COALESCE(AVG(total), 0) AS ticket_promedio
    FROM pedido
    `
  );

  const [porEstado] = await pool.query(
    `
    SELECT
      e.id_estado,
      e.nombre_estado AS estado,
      COUNT(p.id_pedido) AS cantidad,
      COALESCE(SUM(p.total), 0) AS total
    FROM estado_pedido e
    LEFT JOIN pedido p ON p.id_estado = e.id_estado
    GROUP BY e.id_estado, e.nombre_estado
    ORDER BY e.id_estado ASC
    `
  );

  const [topProductos] = await pool.query(
    `
    SELECT
      pr.id_producto,
      pr.nombre,
      COALESCE(SUM(dp.cantidad), 0) AS unidades,
      COALESCE(SUM(dp.cantidad * dp.precio_unitario), 0) AS ingresos
    FROM producto pr
    LEFT JOIN detalle_pedido dp ON dp.id_producto = pr.id_producto
    GROUP BY pr.id_producto, pr.nombre
    ORDER BY unidades DESC, ingresos DESC
    LIMIT ${topLimit}
    `
  );

  const [ventasMensualesRaw] = await pool.query(
    `
    SELECT
      DATE_FORMAT(p.fecha_pedido, '%Y-%m') AS periodo,
      COUNT(*) AS pedidos,
      COALESCE(SUM(p.total), 0) AS ventas
    FROM pedido p
    GROUP BY DATE_FORMAT(p.fecha_pedido, '%Y-%m')
    ORDER BY periodo DESC
    LIMIT 6
    `
  );

  const ventasMensuales = [...ventasMensualesRaw].reverse();

  return {
    totales,
    por_estado: porEstado,
    top_productos: topProductos,
    ventas_mensuales: ventasMensuales
  };
}

module.exports = {
  listar,
  listarPorUsuario,
  insertar,
  buscarPorId,
  actualizar,
  eliminar,
  obtenerResumenReportes
};
