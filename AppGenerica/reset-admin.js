// Endpoint para resetear usuario admin con contraseña simple
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
