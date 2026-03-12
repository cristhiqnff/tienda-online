# Dockerfile para Render - Tienda Online
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY AppGenerica/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código del backend
COPY AppGenerica/ .

# Exponer el puerto
EXPOSE 5000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# Iniciar la aplicación
CMD ["node", "server.js"]
