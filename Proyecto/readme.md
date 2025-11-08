# Proyecto GRUPO06-2025-PROYINF

Este proyecto está dividido en dos partes principales: un **backend** (API REST con Node.js) y un **frontend** (interfaz web con Vite + React).  
Ambos servicios se orquestan mediante **Docker Compose** para facilitar la ejecución y el despliegue.

---

## Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instaladas las siguientes herramientas:

- **Git** ≥ 2.30  
- **Docker** ≥ 24  
- **Docker Compose** ≥ 2.20  

Puedes verificar las versiones con:

```bash
git --version
docker --version
docker compose version
💻 Ejecución del proyecto
Para ejecutar el código base, basta con escribir los siguientes comandos en una terminal:

Copiar código
# Clonar el repositorio (rama dev)
git clone --branch dev --single-branch https://github.com/Joaquinn0101/GRUPO06-2025-PROYINF.git

# Acceder a la carpeta del proyecto
cd Proyecto/

# Construir y levantar los contenedores
docker compose up --build -d
Esto descargará la rama dev del repositorio, accederá al directorio del proyecto y levantará el entorno completo mediante Docker Compose.

#Otra opcion 
Se puede descargar directamente el .zip del proyecto en el github y ejecutar el comando para levantar los contenedores desde ahi
docker compose up --build -d
```

## Servicios
Una vez levantado, el proyecto expone los siguientes servicios:

* Frontend (Cliente): http://localhost:5173

* Backend (API): http://localhost:3000

El frontend está configurado (vía vite.config.js) para usar un proxy. Todas las peticiones fetch('/api/...') desde React son redirigidas automáticamente al servicio http://backend:3000 dentro de la red de Docker.
 

## Estructura del proyecto
El proyecto está organizado en dos módulos principales: backend y frontend, además de archivos de configuración en la raíz del repositorio.
```bash 
Proyecto/
├── backend/                 # ⚙️ Lógica del servidor (API REST)
│   ├── Dockerfile           # 🐳 Imagen Docker del backend
│   ├── db.js                # 💾 Configuración de la base de datos (pool de PG)
│   ├── index.js             # 🚀 Punto de entrada del servidor (Express)
│   ├── loans.routes.js      # 🛣️ Rutas de la API (/apply, /register, /login, /dashboard)
│   ├── auth.js              # 🔑 Lógica de autenticación (JWT, bcrypt, middleware)
│   ├── scoring.js           # 📊 Lógica de negocio (cálculo de puntaje)
│   ├── validaciones.js      # ✅ Funciones de validación (RUT, teléfono)
│   └── package.json
│
├── frontend/                # 🎨 Interfaz de usuario (Vite + React)
│   ├── src/                 # 🧩 Código fuente del frontend
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx # 🛡️ Guardia de rutas (protege /dashboard)
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # 🧠 Estado global (manejo de token/usuario)
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # 🏠 Página de inicio (portada)
│   │   │   ├── LoginPage.jsx      # 🚪 Página de inicio de sesión
│   │   │   ├── RegisterPage.jsx   # 📝 Página de registro
│   │   │   └── DashboardPage.jsx  # 📈 Dashboard (ruta protegida)
│   │   ├── App.jsx            # 🗺️ Router principal (React Router DOM)
│   │   └── main.jsx           # 🏁 Punto de entrada (Renderiza App y Providers)
│   ├── Dockerfile           # 🐳 Imagen Docker del frontend
│   ├── vite.config.js       # 🔄 Configuración de Vite (incluye proxy /api)
│   └── package.json
│
├── docker-compose.yml       # 🔧 Orquestador (backend + frontend + db)
└── readme.md                # 📝 Esta documentación
```

## Servicios (API Endpoints)

La API expone varios endpoints bajo el prefijo /loans.

Autenticación:
* POST /loans/register: Crea un nuevo usuario. Requiere rut, full_name, email, password. Devuelve un token JWT y datos del usuario.
* POST /loans/login: Autentica un usuario (rut, password) y devuelve un token JWT y datos del usuario.

Préstamos
* POST /loans/apply: Envía una nueva solicitud de préstamo (público).
* GET /loans/:id/status: Consulta el estado de una solicitud (público).
* GET /loans/dashboard: (Protegido) Devuelve los datos del dashboard del usuario autenticado (requiere token Bearer).
* GET /loans/health: Verifica que la API esté funcionando.
