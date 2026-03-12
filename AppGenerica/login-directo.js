// Endpoint de login directo sin dependencias de servicios
app.post("/usuario/login-directo", async (req, res) => {
  try {
    const pool = require('./db.js');
    const { email, password } = req.body;
    
    // Buscar usuario en PostgreSQL
    const { rows } = await pool.query(
      "SELECT u.*, r.nombre as rol FROM usuario u LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario LEFT JOIN rol r ON ur.id_rol = r.id_rol WHERE u.email = $1",
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no registrado" });
    }
    
    const usuario = rows[0];
    
    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(password, usuario.contrasena);
    
    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    
    // Generar token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id_usuario: usuario.id_usuario, 
        email: usuario.email, 
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: "Login exitoso",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
    
  } catch (error) {
    console.error("Error en login directo:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
