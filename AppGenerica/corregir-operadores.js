// Script para corregir todos los $1, $2 que deberían ser ||
const fs = require('fs');
const path = require('path');

// Función para corregir operadores
function corregirOperadores(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Corregir $1 → ||
  if (content.includes(' $1 ')) {
    content = content.replace(/ \$1 /g, ' || ');
    console.log(`✅ Corregido $1 → || en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Corregir $2 → ||
  if (content.includes(' $2 ')) {
    content = content.replace(/ \$2 /g, ' || ');
    console.log(`✅ Corregido $2 → || en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Corregir $3 → ||
  if (content.includes(' $3 ')) {
    content = content.replace(/ \$3 /g, ' || ');
    console.log(`✅ Corregido $3 → || en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Guardar archivo si hubo cambios
  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Procesar todos los archivos en rutas
const rutasDir = path.join(__dirname, 'rutas');
if (fs.existsSync(rutasDir)) {
  const archivos = fs.readdirSync(rutasDir);
  archivos.forEach(archivo => {
    if (archivo.endsWith('.js')) {
      const filePath = path.join(rutasDir, archivo);
      corregirOperadores(filePath);
    }
  });
}

// Procesar todos los archivos en servicios
const serviciosDir = path.join(__dirname, 'servicios');
if (fs.existsSync(serviciosDir)) {
  const archivos = fs.readdirSync(serviciosDir);
  archivos.forEach(archivo => {
    if (archivo.endsWith('.js')) {
      const filePath = path.join(serviciosDir, archivo);
      corregirOperadores(filePath);
    }
  });
}

console.log('\n🎉 Corrección de operadores completada!');
