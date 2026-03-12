// Script para convertir MySQL a PostgreSQL en todos los servicios
const fs = require('fs');
const path = require('path');

// Directorio de servicios
const serviciosDir = path.join(__dirname, 'servicios');
const rutasDir = path.join(__dirname, 'rutas');

// Función para convertir archivo
function convertirArchivo(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Reemplazar db.execute por pool.query
  if (content.includes('db.execute')) {
    content = content.replace(/db\.execute\(/g, 'pool.query(');
    console.log(`✅ Convertido db.execute → pool.query en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Reemplazar [rows] por {rows}
  if (content.includes('[rows]')) {
    content = content.replace(/\[rows\]/g, '{rows}');
    console.log(`✅ Convertido [rows] → {rows} en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Reemplazar [result] por {rows}
  if (content.includes('[result]')) {
    content = content.replace(/\[result\]/g, '{rows}');
    console.log(`✅ Convertido [result] → {rows} en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Reemplazar ? por $1, $2, $3...
  let paramCount = 0;
  content = content.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
  
  if (paramCount > 0) {
    console.log(`✅ Convertido ${paramCount} placeholders ? → $1, $2... en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Reemplazar GROUP_CONCAT por STRING_AGG
  if (content.includes('GROUP_CONCAT')) {
    content = content.replace(/GROUP_CONCAT\(([^,]+),\s*'([^']+)'\s*\)/g, 'STRING_AGG($1, $2)');
    console.log(`✅ Convertido GROUP_CONCAT → STRING_AGG en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Reemplazar funciones MySQL específicas
  if (content.includes('NOW()')) {
    content = content.replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP');
    console.log(`✅ Convertido NOW() → CURRENT_TIMESTAMP en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('LIMIT ?,?')) {
    content = content.replace(/LIMIT \?,\?/g, 'LIMIT $1 OFFSET $2');
    console.log(`✅ Convertido LIMIT ?,? → LIMIT $1 OFFSET $2 en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Guardar archivo si hubo cambios
  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Procesar todos los archivos en servicios
if (fs.existsSync(serviciosDir)) {
  const archivos = fs.readdirSync(serviciosDir);
  archivos.forEach(archivo => {
    if (archivo.endsWith('.js')) {
      const filePath = path.join(serviciosDir, archivo);
      convertirArchivo(filePath);
    }
  });
}

// Procesar todos los archivos en rutas
if (fs.existsSync(rutasDir)) {
  const archivos = fs.readdirSync(rutasDir);
  archivos.forEach(archivo => {
    if (archivo.endsWith('.js')) {
      const filePath = path.join(rutasDir, archivo);
      convertirArchivo(filePath);
    }
  });
}

console.log('\n🎉 Conversión completada!');
