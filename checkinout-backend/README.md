# CheckInOut — Backend (API)

API REST en **Node.js** y **Express** para registro de empresas, usuarios por rol, obras, trabajadores (incluye descriptor facial), asistencia (jornadas y registros), **traspasos**, novedades (resolución y estados de gestión), documentos, notificaciones, dispositivos, configuración, perfil y reportes. Persistencia en **MySQL** (`mysql2/promise`). El cliente SPA envía **JWT** en `Authorization: Bearer`.

---

## Monorepo

| Carpeta | Rol |
|---------|-----|
| `checkinout-backend/` | Este servidor. |
| `checkinout-frontend/` | SPA que consume `VITE_API_URL` (termina en `/api`). |
| [README.md](../README.md) | Instalación rápida y visión general. |

---

## Stack

Express, `cors`, `express.json()`, **JWT** (`jsonwebtoken`), **bcryptjs**, **Passport** + Google OAuth 20 (opcional), **Multer** (memoria), **Cloudinary**, **Nodemailer** + **Brevo**.

---

## Estructura

```
checkinout-backend/
├── server.js
├── app.js                 # Middlewares y app.use('/api/...', ...)
└── src/
    ├── config/db.js
    ├── controllers/
    ├── routes/
    └── utils/             # passport, auth/roles middleware, response, audit, mailer, etc.
```

---

## Variables de entorno (`.env`)

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

Sin `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, las rutas de Google responden 503 con mensaje explicativo.

---

## Scripts

```bash
npm install
npm run dev    # nodemon server.js
npm start      # node server.js
```

---

## Contrato HTTP

- Éxito: `{ "ok": true, "data": ... }` (`src/utils/response.js`).
- Error: `{ "ok": false, "message": "..." }`.

Rutas bajo **`/api`**.

---

## Autenticación

- `POST /api/auth/login` → token con claims `id`, `email`, `rol`, `empresa_id`.
- Rutas protegidas: `Authorization: Bearer <token>`, middleware `verificarToken`.

---

## Mapa de rutas (según `app.js`)

> **Nota:** en `app.js` aparece dos veces `app.use('/api/novedades', ...)`. Conviene dejar una sola línea para evitar registro duplicado.

| Prefijo | Archivo típico | Auth |
|---------|------------------|------|
| `/auth` | `auth.routes.js` | Mixto |
| `/empresas` | `empresas.routes.js` | Registro público `POST /` |
| `/trabajadores` | `trabajadores.routes.js` | JWT |
| `/obras` | `obras.routes.js` | JWT |
| `/subcargos` | `subcargos.routes.js` | JWT |
| `/asistencia` | `asistencia.routes.js` | JWT |
| `/novedades` | `novedades.routes.js` | JWT — `GET/POST /`, `PATCH /:id/resolver`, `PATCH /:id/estado` |
| `/traspasos` | `traspasos.routes.js` | JWT — `GET/POST /`, `PATCH /:id/estado` |
| `/reportes` | `reportes.routes.js` | JWT |
| `/usuarios` | `usuarios.routes.js` | JWT |
| `/documentos` | `documentos.routes.js` | JWT |
| `/notificaciones` | `notificaciones.routes.js` | JWT |
| `/dispositivos` | `dispositivos.routes.js` | JWT |
| `/configuracion` | `configuracion.routes.js` | JWT |
| `/perfil` | `perfil.routes.js` | JWT |

**Ping:** `GET /api/ping`.

### Reportes (`/api/reportes`)

Incluye entre otros: `GET /resumen`, `GET /asistencia`, `GET /ausencias`, `GET /horas`, `POST /exportar`.

**Ausencias (`GET /ausencias`):** si se envían `fecha_inicio` o `fecha_fin` en query, se usa agregación por rango (ausencias con conteo); si no, se mantiene el comportamiento por día con el parámetro `fecha`.

### Novedades

- **`PATCH /:id/resolver`:** estados tipo aprobada / rechazada (flujo HEAD con notificaciones y correo según controlador).
- **`PATCH /:id/estado`:** estados de gestión `abierta`, `en_gestion`, `cerrada` (rama añadida desde integración con otra rama).

---

## CORS

`cors()` abierto en código; en producción conviene restringir `origin` al dominio del frontend.

---

## Integración frontend

El cliente Axios usa `baseURL` terminada en `/api` y adjunta el Bearer. Detalle de pantallas ↔ endpoints: [checkinout-frontend/README.md](../checkinout-frontend/README.md).
