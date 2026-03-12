// Endpoint temporal para probar categorías sin dependencias
app.get("/categorias-test", async (req, res) => {
  try {
    const pool = require('./db.js');
    
    // Consulta directa a PostgreSQL
    const { rows } = await pool.query(
      "SELECT id_categoria, nombre, descripcion FROM categoria"
    );
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
    
  } catch (error) {
    console.error("Error en /categorias-test:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint temporal para probar productos
app.get("/productos-test", async (req, res) => {
  try {
    const pool = require('./db.js');
    
    const { rows } = await pool.query(
      "SELECT id_producto, nombre, precio, stock FROM producto"
    );
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
    
  } catch (error) {
    console.error("Error en /productos-test:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
