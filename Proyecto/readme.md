# Proyecto GRUPO06-2025-PROYINF

Este proyecto implementa un sistema de evaluación de riesgos para solicitudes de préstamos de consumo. Está diseñado como una aplicación Full Stack. Está dividido en dos partes principales:  
* **Backend (API REST):** Construido con **Node.js** y **Express**, responsable de la lógica de negocio (scoring, cálculo) y la persistencia de datos en una base de datos **PostgreSQL**.
* **Frontend (Aplicación Web):** Desarrollado con **React** y **Vite**, proporcionando la interfaz de usuario para que los clientes simulen y formalicen sus solicitudes.

Ambos servicios se orquestan mediante **Docker Compose** para facilitar la ejecución y el despliegue.

---
## Tecnologías Principales (Stack)

Hemos utilizado las siguientes tecnologías, con la Base de Datos y el Backend configurados para comunicarse mediante las variables de entorno definidas en el `docker-compose.yml`.

| Componente | Tecnología | Propósito | Archivos Clave |
| :--- | :--- | :--- | :--- |
| **Backend** | Node.js, Express, **Zod** | Servidor API y validación de esquemas. | `package.json`, `index.js` |
| **Database** | **PostgreSQL** (Docker) | Persistencia de solicitudes de préstamo. | `db.js`, `docker-compose.yml` |
| **Frontend** | React, Vite, **Tailwind** | Interfaz de Usuario. | `LoanRequestView.jsx`, `vite.config.js` |
| **Validación** | Lógica Chilena | Validación de RUT y números de teléfono. | `validaciones.js` |

---
## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instaladas las siguientes herramientas:

- **Git** ≥ 2.30  
- **Docker** ≥ 24  
- **Docker Compose** ≥ 2.20  

Puedes verificar las versiones con:

```bash
git --version
docker --version
docker compose version

```
# Ejecución del proyecto
Para ejecutar el código base, utiliza los siguientes comandos:
```bash
# 1. Clonar el repositorio (rama dev)
git clone --branch dev --single-branch [https://github.com/Joaquinn0101/GRUPO06-2025-PROYINF.git](https://github.com/Joaquinn0101/GRUPO06-2025-PROYINF.git)

# 2. Acceder a la carpeta del proyecto
cd Proyecto/

# 3. Construir las imágenes y levantar los contenedores
docker compose up --build -d
```
Esto descargará la rama dev del repositorio, accederá al directorio del proyecto y levantará el entorno completo mediante Docker Compose.

# Acceso a la Aplicación
Una vez levantados los contenedores, puedes acceder a los servicios en las siguientes URLs:
* Frontend (Aplicación Web): http://localhost:5173
* Backend (API Base): http://localhost:3000
# Avances del Hito 4
Esta sección aborda el incremento de código y la gestión del repositorio para el Hito 4, conforme a los requisitos de la pauta.
1. Nueva Historia de Usuario (HU)
2. El estado de las tareas (identificadas y nuevas) se encuentra actualizado
3. Avances Clave

# Documentación de Servicios (API REST)
La API del Backend (backend/loans.routes.js) implementa la siguiente funcionalidad. Esta sección documenta la forma en que se utiliza la API en el contexto del escenario relevante.

| Endpoint | Verbo HTTP | Propósito | Módulos de Lógica Involucrados |
| :--- | :--- | :--- | :--- |
| `/loans/v1/apply` | `POST` | **Procesa la solicitud de préstamo.** Recibe datos del cliente, calcula el *Scoring* (elegibilidad) y registra la solicitud en la base de datos con un estado inicial. | `scoring.js`, `calculadora.js`, `db.js` |
| `/loans/:id/status` | `GET` | **Consulta el estado de una solicitud.** Permite obtener el estado actual y el *Scoring* final de un préstamo por su ID. | `db.js` |
| `/health` | `GET` | **Chequeo de salud del servidor.** Un diagnóstico simple para confirmar que el servidor está activo. | `index.js` |

> **Detalles para la Revisión:** Se recuerda que la **documentación detallada** (esquemas de Body, ejemplos JSON y códigos de respuesta) se encuentra en la **Wiki** del repositorio, bajo la sección **"Servicios"**.
---

# Estructura del proyecto
El proyecto está organizado en dos módulos principales: backend y frontend, además de archivos de configuración en la raíz del repositorio.

Proyecto/
├── backend/                 # ⚙️ Lógica del servidor (API REST, conexión a la BD, rutas)
│   ├── Dockerfile           # 🐳 Imagen Docker del backend
│   ├── db.js                # 💾 Configuración de la base de datos
│   ├── index.js             # 🚀 Punto de entrada del servidor
│   ├── loans.routes.js      # 🛣️ Rutas de la API
│   ├── package.json         # 📦 Dependencias del backend
│   └── ...
│
├── frontend/                # 🎨 Interfaz de usuario (cliente web)
│   ├── public/              # 🖼️ Archivos estáticos (favicon, imágenes, etc.)
│   ├── src/                 # 🧩 Código fuente del frontend (componentes, vistas, etc.)
│   ├── Dockerfile           # 🐳 Imagen Docker del frontend
│   ├── index.html           # 🌐 Página principal
│   ├── package.json         # 📦 Dependencias del frontend
│   └── ...
│
├── docker-compose.yml       # 🔧 Orquestador de contenedores (backend + frontend)
└── readme.md                # 📝 Documentación del proyecto
```
