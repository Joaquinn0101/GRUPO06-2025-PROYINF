# 📦 Proyecto GRUPO06-2025-PROYINF

Este proyecto está dividido en dos partes principales: un **backend** (API REST con Node.js) y un **frontend** (interfaz web con Vite + React).  
Ambos servicios se orquestan mediante **Docker Compose** para facilitar la ejecución y despliegue.

---

## 🚀 Ejecución del proyecto

Para ejecutar el código base, basta con escribir los siguientes comandos en una terminal:

```bash
# Clonar el repositorio (rama dev)
git clone --branch dev --single-branch https://github.com/Joaquinn0101/GRUPO06-2025-PROYINF.git

# Acceder a la carpeta del proyecto
cd Proyecto/

# Construir y levantar los contenedores
docker compose up --build



El proyecto está organizado en dos módulos principales: backend y frontend, además de archivos de configuración raíz.

Proyecto/
├── backend/                 # Lógica del servidor (API REST, conexión a la BD, rutas)
│   ├── Dockerfile           # Imagen Docker del backend
│   ├── db.js                # Configuración de la base de datos
│   ├── index.js             # Punto de entrada del servidor
│   ├── loans.routes.js      # Rutas de la API
│   ├── package.json         # Dependencias del backend
│   └── ...
│
├── frontend/                # Interfaz de usuario (cliente web)
│   ├── public/              # Archivos estáticos (favicon, imágenes, etc.)
│   ├── src/                 # Código fuente del frontend (componentes, vistas, etc.)
│   ├── Dockerfile           # Imagen Docker del frontend
│   ├── index.html           # Página principal
│   ├── package.json         # Dependencias del frontend
│   └── ...
│
├── docker-compose.yml       # Orquestador de contenedores (backend + frontend)
└── readme.md                # Documentación del proyecto
