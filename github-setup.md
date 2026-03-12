# Pasos para subir tu proyecto a GitHub

## 1. Crear repositorio en GitHub
1. Ve a github.com
2. Haz clic en "New repository"
3. Nombre: "tienda-online"
4. Descripción: "Proyecto de tienda online e-commerce"
5. Marca "Public" o "Private"
6. Haz clic en "Create repository"

## 2. Subir tu proyecto local
Abre tu terminal en la carpeta del proyecto:
cd "C:\Users\camil\OneDrive\Escritorio\Base de Datos 2\Tienda Online"

## 3. Inicializar Git
git init
git add .
git commit -m "Primer commit - Proyecto Tienda Online"

## 4. Conectar con GitHub
git remote add origin https://github.com/tu-usuario/tienda-online.git
git branch -M main
git push -u origin main

## 5. ¡Listo!
Tu proyecto estará en GitHub y Render podrá acceder a él
