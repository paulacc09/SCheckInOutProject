# SCheckInOut — CheckInOut (monorepo)

Sistema de **control de asistencia y personal en obras de construcción**: una API en Node/Express + MySQL y una SPA en React/Vite. Este repositorio une **frontend** y **backend** en carpetas hermanas.

---

## Documentación detallada

| Documento | Contenido |
|-----------|-----------|
| [checkinout-backend/README.md](checkinout-backend/README.md) | API REST, variables de entorno, mapa de rutas, JWT, Google OAuth, integración con MySQL, Brevo, Cloudinary. |
| [checkinout-frontend/README.md](checkinout-frontend/README.md) | React/Vite, `VITE_API_URL`, roles y rutas de la SPA, tabla de pantallas ↔ endpoints, despliegue Vercel. |

La guía histórica [README-DB.md](README-DB.md) describía un mock en memoria; el proyecto **usa hoy la API real** — conserva el archivo solo como referencia de formas de respuesta sugeridas, no como arquitectura actual.

---

## Cómo está unido todo (visión rápida)

1. El **frontend** crea un cliente Axios con `baseURL = VITE_API_URL` (por defecto `http://localhost:3000/api`).
2. Tras el **login**, el JWT se guarda en `localStorage` y Axios lo envía en `Authorization: Bearer …`.
3. El **backend** monta las rutas bajo `/api` (por ejemplo `/api/auth/login`, `/api/trabajadores`).
4. La **base de datos** es MySQL; la conexión se configura con `DB_*` en el `.env` del backend.

```
[Usuario] → navegador (React SPA)
    → HTTPS/HTTP + JSON
        → Express (/api/...)
            → mysql2 pool
                → MySQL (p. ej. Railway)
```

Servicios opcionales del backend: **Google OAuth**, **Brevo** (correo), **Cloudinary** (archivos).

---

## Requisitos previos

- Node.js y npm  
- Git  
- Instancia MySQL accesible y esquema acorde a lo que esperan los controladores del backend  

---

## Clonar e instalar

```bash
git clone https://github.com/paulacc09/SCheckInOutProject.git
cd SCheckInOutProject
```

### Backend

```bash
cd checkinout-backend
npm install
```

Crea `checkinout-backend/.env` (lista completa en [checkinout-backend/README.md](checkinout-backend/README.md)). Mínimo imprescindible para arrancar con datos reales: variables `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN` y, para enlaces de correo/OAuth, `FRONTEND_URL`.

```bash
npm run dev
```

API local por defecto: `http://localhost:3000` — comprobar con `GET http://localhost:3000/api/ping`.

### Frontend

En otra terminal, desde la raíz del monorepo:

```bash
cd checkinout-frontend
npm install
```

Crea `checkinout-frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev
```

SPA por defecto: `http://localhost:5173`.

---

## Despliegue

- **Frontend**: Vercel (build `vite build`, rewrites SPA en `checkinout-frontend/vercel.json`). Definir `VITE_API_URL` apuntando al backend público + `/api`.
- **Base de datos**: habitualmente **Railway** (MySQL).
- **Backend**: mismo u otro proveedor; debe exponer CORS adecuado al dominio del front y usar URLs de OAuth/correo coherentes con `FRONTEND_URL`.

Los cambios en la rama principal del repositorio pueden disparar despliegues automáticos según la configuración de GitHub ↔ Vercel / hosting del API.

---

## Tecnologías (resumen)

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, face-api.js, jsPDF.  
**Backend:** Node.js, Express, Passport (Google), JWT, bcrypt, MySQL2, Multer, Cloudinary, Nodemailer/Brevo.
