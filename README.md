# SCheckInOut — CheckInOut

Monorepo para control de asistencia, personal y operaciones en obras de construcción.

| Carpeta | Descripción |
|---------|-------------|
| `checkinout-backend/` | API REST Node.js + Express + MySQL |
| `checkinout-frontend/` | SPA React + Vite + Tailwind CSS |

---

## Tabla de contenidos

1. [¿Qué hace el sistema?](#qué-hace-el-sistema)
2. [Arquitectura](#arquitectura)
3. [Tecnologías](#tecnologías)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Requisitos e instalación](#requisitos-e-instalación)
6. [Variables de entorno](#variables-de-entorno)
7. [Roles y módulos](#roles-y-módulos)
8. [Frontend](#frontend)
9. [Backend (API)](#backend-api)
10. [Referencia de endpoints](#referencia-de-endpoints)
11. [Despliegue](#despliegue)

---

## ¿Qué hace el sistema?

- Registro de empresas y usuarios con roles: `administrador`, `inspector_sst`, `encargado`.
- Gestión de obras, trabajadores, subcargos y dispositivos de registro.
- **Asistencia en obra:** apertura/cierre de jornada, registro de ingreso/salida y reconocimiento facial (`face-api.js`).
- Novedades, traspasos de personal, documentos, reportes y notificaciones.
- Autenticación JWT, recuperación de contraseña y login con Google OAuth (opcional).

---

## Arquitectura

```
[Navegador] → React (Vite) → Axios (Bearer JWT) → Express /api → MySQL
```

- El frontend usa `VITE_API_URL` apuntando a la base de la API **incluyendo** el sufijo `/api` (p. ej. `http://localhost:3000/api`).
- Tras el login, el token se guarda en `localStorage` y se envía en `Authorization: Bearer …`.
- Respuestas de la API:
  - Éxito: `{ ok: true, data: ... }`
  - Error: `{ ok: false, message: "..." }`

---

## Tecnologías

**Frontend:** React 18, Vite 5, Tailwind CSS, React Router v6, Axios, face-api.js, jsPDF, jspdf-autotable, lucide-react.

**Backend:** Node.js, Express 5, Passport (Google OAuth 2.0), JWT, bcryptjs, MySQL2, Multer, Cloudinary, Nodemailer/Brevo.

**Servicios externos (despliegue):** Railway (MySQL + backend), Vercel (frontend).

---

## Estructura del proyecto

```
SCheckInOutProject/
├── checkinout-backend/
│   ├── server.js
│   ├── app.js
│   └── src/
│       ├── config/db.js
│       ├── controllers/
│       ├── routes/
│       └── utils/          # passport, auth/roles middleware, response, audit, mailer…
│
└── checkinout-frontend/
    ├── vercel.json
    └── src/
        ├── api/axios.js
        ├── components/     # Layout, Sidebar, TopBar, Modal, CamaraFacial…
        ├── context/          # AuthContext, NotificacionesContext
        ├── hooks/
        ├── pages/
        │   ├── admin/
        │   ├── inspector/
        │   └── encargado/
        ├── services/
        ├── App.jsx
        └── main.jsx
```

---

## Requisitos e instalación

**Requisitos:** Node.js, npm, Git, MySQL accesible con esquema acorde a los controladores del backend.

```bash
git clone https://github.com/paulacc09/SCheckInOutProject.git
cd SCheckInOutProject
```

### Backend

```bash
cd checkinout-backend
npm install
# Crear .env (ver sección Variables de entorno)
npm run dev    # nodemon — http://localhost:3000
npm start      # producción
```

Comprobar: `GET http://localhost:3000/api/ping`

### Frontend

```bash
cd checkinout-frontend
npm install
# Crear .env.local (ver sección Variables de entorno)
npm run dev      # http://localhost:5173
npm run build
npm run preview
npm run lint
```

---

## Variables de entorno

### Backend — `checkinout-backend/.env`

```env
PORT=3000

DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

BREVO_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Sin `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, las rutas de Google responden 503.

### Frontend — `checkinout-frontend/.env.local`

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Roles y módulos

| Rol (BD) | Prefijo | Ruta inicial | Módulos |
|----------|---------|--------------|---------|
| `administrador` | `/admin/...` | `/admin/obras` | Obras, personal, roles, dispositivos, asistencias, reportes, documentos, novedades, configuración, perfil, notificaciones |
| `inspector_sst` | `/sst/...` | `/sst/asistencia` | Asistencia, personal en obra, novedades, reportes; documentos pendiente |
| `encargado` | `/encargado/...` | `/encargado/asistencia` | Asistencia, personal en obra, novedades, traspasos, perfil, notificaciones |

El login exige que el rol seleccionado en la UI coincida con `usuario.rol` devuelto por el servidor.

---

## Frontend

### Conexión con la API

| Concepto | Detalle |
|----------|---------|
| Cliente HTTP | `src/api/axios.js` — `baseURL` desde `VITE_API_URL` (default `http://localhost:3000/api`) |
| Token | `localStorage.checkinout_token`; interceptor añade `Authorization: Bearer …` |
| Sesión | `AuthContext` — `checkinout_user` + token; login vía `POST /auth/login` |
| 401 | Limpia sesión y redirige a `/login` |
| Notificaciones | `NotificacionesContext` — `/notificaciones`, `/notificaciones/badge` |

### Rutas públicas

`/login`, `/registro`, `/auth/google`, `/recuperar-password`, `/nueva-clave`

### Layout

- **`Layout.jsx`:** sidebar sticky + área principal con scroll.
- **`Sidebar.jsx`:** menú por rol; perfil y notificaciones según rol.

### Módulos por rol

#### Administrador (`/admin/...`)

| Área | Archivo | API |
|------|---------|-----|
| Obras | `admin/Obras.jsx` | `/obras`, `/usuarios?rol=inspector_sst` |
| Personal | `admin/Personal.jsx` | `/trabajadores`, `/obras`, `/subcargos` |
| Roles | `admin/Roles.jsx` | `/usuarios`, `/obras` |
| Dispositivos | `admin/Dispositivos.jsx` | `/dispositivos`, `/obras` |
| Asistencias | `admin/Asistencias.jsx` | `/asistencia/resumen-trabajadores`, `/obras` |
| Reportes | `admin/Reportes.jsx` | `/reportes/resumen`; exportación CSV/PDF en cliente |
| Documentos | `admin/Documentos.jsx` | `/documentos`, `/trabajadores` |
| Novedades | `admin/Novedades.jsx` | `/novedades`, `PATCH /novedades/:id/resolver` |
| Configuración / perfil | `admin/Configuracion.jsx`, `admin/Perfil.jsx` | `/configuracion`, `/perfil` |
| Notificaciones | `admin/Notificaciones.jsx` | `/notificaciones` |

#### Inspector SST (`/sst/...`)

| Área | Archivo | API |
|------|---------|-----|
| Asistencia | `inspector/Asistencia.jsx` | `/asistencia/jornada/abrir`, `/jornada/:id/cerrar`, `/registrar`, `/resumen-trabajadores`, `/jornadas`; `/trabajadores/cedula/:doc`, `PATCH …/descriptor` |
| Personal en obra | `inspector/Personal.jsx` | `/obras`, `/trabajadores`, `/subcargos`, `/asistencia/...` |
| Novedades | `inspector/Novedades.jsx` | `/novedades`, `POST /novedades`, `PATCH /novedades/:id/estado` |
| Reportes | `inspector/Reportes.jsx` | `/reportes/asistencia`, `/ausencias`, `/horas` |
| Documentos | `inspector/Documentos.jsx` | *Pendiente* |
| Perfil / notificaciones | Reutiliza `admin/Perfil.jsx`, `admin/Notificaciones.jsx` | `/perfil`, `/notificaciones` |

#### Encargado (`/encargado/...`)

| Área | Archivo | API |
|------|---------|-----|
| Asistencia | `encargado/Asistencia.jsx` | Misma integración que inspector SST |
| Personal en obra | `encargado/Personal.jsx` | `/obras`, `/trabajadores`, `/subcargos`, `/asistencia/...` |
| Novedades | `encargado/Novedades.jsx` | `/novedades`, `POST /novedades`, `PATCH /novedades/:id/estado` |
| Traspasos | `encargado/Traspasos.jsx` | `/traspasos`, `POST /traspasos` |
| Perfil / notificaciones | Reutiliza `admin/Perfil.jsx`, `admin/Notificaciones.jsx` | `/perfil`, `/notificaciones` |

### Flujo de asistencia en obra (inspector y encargado)

1. Selección de obra asignada al usuario.
2. **Abrir jornada** → `POST /asistencia/jornada/abrir`.
3. Registro de ingreso/salida por cédula o cámara facial (`CamaraFacial` + `face-api.js`).
4. **Cerrar jornada** → `PATCH /asistencia/jornada/:id/cerrar`.
5. Tabla de resumen del día con paginación.

### Reportes

- **Admin:** filtros por obra, estado y fechas → `GET /reportes/resumen`; exportación CSV/PDF (jspdf).
- **Inspector:** `/reportes/asistencia`, `/ausencias`, `/horas` por obra y rango de fechas.

---

## Backend (API)

### Autenticación

- `POST /api/auth/login` → JWT con claims `id`, `email`, `rol`, `empresa_id`.
- Rutas protegidas: header `Authorization: Bearer <token>`, middleware `verificarToken`.
- Registro público de empresa: `POST /api/empresas`.

### Mapa de rutas

Todas bajo el prefijo `/api`. Ping: `GET /api/ping`.

| Prefijo | Auth | Descripción |
|---------|------|-------------|
| `/auth` | Mixto | Login, Google OAuth, recuperación de contraseña |
| `/empresas` | Público `POST /` | Registro de empresa |
| `/trabajadores` | JWT | CRUD, estado, descriptor facial |
| `/obras` | JWT | CRUD, stats, estado |
| `/subcargos` | JWT | Catálogo de subcargos |
| `/asistencia` | JWT | Jornadas, registros, resumen |
| `/novedades` | JWT | `GET/POST /`, `PATCH /:id/resolver`, `PATCH /:id/estado` |
| `/traspasos` | JWT | `GET/POST /`, `PATCH /:id/estado` |
| `/reportes` | JWT | Resumen, asistencia, ausencias, horas, exportar |
| `/usuarios` | JWT | CRUD de usuarios |
| `/documentos` | JWT | Gestión de documentos |
| `/notificaciones` | JWT | Listado y badge |
| `/dispositivos` | JWT | CRUD + `PATCH /:id/estado` |
| `/configuracion` | JWT | Configuración de empresa |
| `/perfil` | JWT | Perfil del usuario autenticado |

### Novedades

- `PATCH /:id/resolver` — aprobada / rechazada (notificaciones y correo).
- `PATCH /:id/estado` — gestión: `abierta`, `en_gestion`, `cerrada`.

### Reportes

- `GET /resumen` — query `fecha_inicio`, `fecha_fin`, `obra_id`.
- `GET /asistencia`, `GET /ausencias`, `GET /horas`, `POST /exportar`.
- `GET /ausencias`: con `fecha_inicio`/`fecha_fin` agrega por rango; sin ellos usa el parámetro `fecha` (día).

### CORS

`cors()` abierto en código; en producción conviene restringir `origin` al dominio del frontend.

---

## Referencia de endpoints

> El recurso de personal es **`/api/trabajadores`**, no `/api/personal`.  
> El prefijo de asistencia es **`/api/asistencia`** (singular), no `/api/asistencias`.

### Trabajadores

| Operación | Ruta |
|-----------|------|
| Listar | `GET /api/trabajadores` |
| Detalle | `GET /api/trabajadores/:id` |
| Por cédula | `GET /api/trabajadores/cedula/:doc` |
| Crear / actualizar | `POST /api/trabajadores`, `PUT /api/trabajadores/:id` |
| Estado | `PATCH /api/trabajadores/:id/estado` |
| Descriptor facial | `PATCH /api/trabajadores/:id/descriptor` |

### Usuarios

| Operación | Ruta |
|-----------|------|
| CRUD | `GET/POST/PUT/DELETE /api/usuarios` |

### Obras

| Operación | Ruta |
|-----------|------|
| Listar, stats, CRUD, estado | `GET/POST/PUT/PATCH /api/obras`, `GET /api/obras/stats` |

### Asistencia

| Operación | Ruta |
|-----------|------|
| Abrir jornada | `POST /api/asistencia/jornada/abrir` |
| Cerrar jornada | `PATCH /api/asistencia/jornada/:id/cerrar` |
| Registrar ingreso/salida | `POST /api/asistencia/registrar` |
| Resumen del día | `GET /api/asistencia/resumen-trabajadores` |
| Jornadas | `GET /api/asistencia/jornadas` |
| Registros | `GET /api/asistencia/registros` |

### Dispositivos

| Operación | Ruta |
|-----------|------|
| CRUD + estado | `GET/POST/PUT/DELETE /api/dispositivos`, `PATCH /api/dispositivos/:id/estado` |

### Documentos

| Operación | Ruta |
|-----------|------|
| Listar / crear / actualizar | `GET/POST/PUT /api/documentos` |

### Novedades y traspasos

| Operación | Ruta |
|-----------|------|
| Novedades | `GET/POST /api/novedades`, `PATCH /api/novedades/:id/resolver`, `PATCH /api/novedades/:id/estado` |
| Traspasos | `GET/POST /api/traspasos`, `PATCH /api/traspasos/:id/estado` |

---

## Despliegue

| Componente | Plataforma | Notas |
|------------|------------|-------|
| Frontend | Vercel | `vite build`; rewrites SPA en `vercel.json`; definir `VITE_API_URL` = URL pública del backend + `/api` |
| Base de datos | Railway | MySQL |
| Backend | Railway, Render, VPS | CORS al dominio del front; `FRONTEND_URL` y OAuth/correo coherentes con producción |
