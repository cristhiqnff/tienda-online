// Script para corregir errores específicos de la conversión
const fs = require('fs');
const path = require('path');

// Función para corregir archivo
function corregirArchivo(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Corregir operadores lógicos mal reemplazados
  if (content.includes('$1 new Date(')) {
    content = content.replace(/\$1 new Date\(/g, '|| new Date(');
    console.log(`✅ Corregido $1 → || en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('$7 usuario.roles')) {
    content = content.replace(/\$7 usuario.roles/g, '|| usuario.roles');
    console.log(`✅ Corregido $7 → || en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('$8 LIMIT 1')) {
    content = content.replace(/\$8 LIMIT 1/g, '$1 LIMIT 1');
    console.log(`✅ Corregido $8 → $1 en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('$9, $10')) {
    content = content.replace(/\$9, \$10/g, '$1, $2');
    console.log(`✅ Corregido $9, $10 → $1, $2 en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('($2, $3, $4, $5, $6)')) {
    content = content.replace(/\(\$2, \$3, \$4, \$5, \$6\)/g, '($1, $2, $3, $4, $5)');
    console.log(`✅ Corregido parámetros en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Corregir conn.execute que quedó sin convertir
  if (content.includes('conn.execute')) {
    content = content.replace(/conn\.execute\(/g, 'pool.query(');
    console.log(`✅ Corregido conn.execute → pool.query en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Corregir [rowsRol] que quedó sin convertir
  if (content.includes('[rowsRol]')) {
    content = content.replace(/\[rowsRol\]/g, '{rowsRol}');
    console.log(`✅ Corregido [rowsRol] → {rowsRol} en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Corregir result.insertId
  if (content.includes('result.insertId')) {
    content = content.replace(/result\.insertId/g, 'rows[0].id_usuario');
    console.log(`✅ Corregido result.insertId → rows[0].id_usuario en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Corregir conn.beginTransaction y conn.commit
  if (content.includes('conn.beginTransaction')) {
    content = content.replace(/conn\.beginTransaction\(\)/g, '// conn.beginTransaction() - PostgreSQL no necesita esto');
    console.log(`✅ Comentado beginTransaction en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('conn.commit')) {
    content = content.replace(/conn\.commit\(\)/g, '// conn.commit() - PostgreSQL no necesita esto');
    console.log(`✅ Comentado commit en ${path.basename(filePath)}`);
    changed = true;
  }
  
  if (content.includes('conn.rollback')) {
    content = content.replace(/conn\.rollback\(\)/g, '// conn.rollback() - PostgreSQL no necesita esto');
    console.log(`✅ Comentado rollback en ${path.basename(filePath)}`);
    changed = true;
  }
  
  // Guardar archivo si hubo cambios
  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Procesar Usuario.servicios.js específicamente
const filePath = path.join(__dirname, 'servicios', 'Usuario.servicios.js');
corregirArchivo(filePath);

console.log('\n🎉 Corrección completada!');
