# CheckInOut — Backend (API)

API REST en **Node.js** y **Express** para el sistema **CheckInOut**: registro de empresas, usuarios por rol, obras, trabajadores (incluye descriptor facial), asistencia por jornadas y registros, documentos, novedades, notificaciones, dispositivos, configuración y reportes. Los datos viven en **MySQL** (pool `mysql2/promise`). El frontend (React) consume esta API con **JWT** en el header `Authorization`.

---

## Cómo encaja en el monorepo

| Carpeta | Rol |
|--------|-----|
| `checkinout-backend/` | Este proyecto: servidor HTTP, lógica de negocio, acceso a BD y servicios externos. |
| `checkinout-frontend/` | SPA React (Vite) que llama a `VITE_API_URL` (por defecto `http://localhost:3000/api`). |
| Raíz `README.md` | Instalación rápida de ambos y despliegue. |

Arranque típico en desarrollo: backend en el puerto `3000` y frontend en `5173`, con CORS abierto en el backend para permitir el origen del front.

---

## Stack técnico

- **Express 5**, `cors`, `express.json()`
- **MySQL** vía `mysql2` (pool de conexiones)
- **Autenticación**: `jsonwebtoken` (Bearer), contraseñas con `bcryptjs`
- **OAuth Google**: `passport` + `passport-google-oauth20` (opcional si faltan credenciales)
- **Archivos**: `multer` (memoria) para fotos de perfil; **Cloudinary** para almacenamiento en la nube donde aplique
- **Correo**: **Brevo** (API key) para recuperación de contraseña y avisos vía `nodemailer`

---

## Estructura del código

```
checkinout-backend/
├── server.js              # Entrada: listen + carga de db
├── app.js                 # Express: middlewares y montaje de rutas bajo /api/...
├── hash.js                # Utilidad suelta (si aplica en tu flujo de datos)
└── src/
    ├── config/
    │   └── db.js          # Pool MySQL; falla al iniciar si no conecta
    ├── controllers/     # Lógica por dominio (auth, empresas, trabajadores, …)
    ├── routes/            # Routers Express → controladores
    └── utils/
        ├── passport.js           # Estrategia Google (solo si hay CLIENT_ID/SECRET)
        ├── middlewares/
        │   ├── auth.middleware.js   # verificarToken (JWT)
        │   └── roles.middleware.js  # permitirRoles (definido; usable en rutas)
        ├── response.js        # success() / error() → { ok, data } | { ok: false, message }
        ├── audit.js           # auditoría en BD
        ├── notificaciones.js  # creación de notificaciones
        ├── mailer.js          # Brevo
        ├── emails.js          # plantillas / envío
        ├── cloudinary.js      # SDK Cloudinary
        └── multerMemory.js    # upload en memoria
```

---

## Variables de entorno (`.env`)

Crea `checkinout-backend/.env` (no lo subas al repositorio). Referencia mínima:

```env
# Servidor
PORT=3000

# MySQL (p. ej. Railway)
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

# JWT (obligatorio para login y rutas protegidas)
JWT_SECRET=
JWT_EXPIRES_IN=7d

# URL del frontend (recuperación de contraseña, OAuth redirect)
FRONTEND_URL=http://localhost:5173

# Google OAuth (opcional; si falta, GET /api/auth/google responde 503 explicando el motivo)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Debe coincidir con la URI autorizada en la consola de Google
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Brevo (correo transaccional)
BREVO_API_KEY=

# Cloudinary (subida de medios, p. ej. fotos)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- **`JWT_SECRET`**: clave para firmar y verificar tokens; debe ser la misma en todo el entorno.
- **`FRONTEND_URL`**: base del SPA sin barra final inconsistente; se usa en enlaces de correo y en el redirect de Google tras el callback.
- La base de datos debe contener las tablas que esperan los controladores (`usuarios`, `empresas`, `obras`, `trabajadores`, `asistencia`, etc.). El esquema no se genera automáticamente desde este repositorio en el arranque del servidor.

---

## Scripts y arranque

```bash
cd checkinout-backend
npm install
npm run dev    # nodemon server.js
# o producción:
npm start      # node server.js
```

Comprueba que la API responde:

```http
GET http://localhost:3000/api/ping
```

Respuesta esperada: JSON con mensaje de estado.

---

## Contrato HTTP común

- Respuestas de éxito habituales: `{ "ok": true, "data": ... }` (helper `success` en `src/utils/response.js`).
- Errores: `{ "ok": false, "message": "..." }` con código HTTP adecuado (`error`).
- Rutas bajo **`/api`** (el prefijo no se repite en los archivos de rutas internos; `app.js` hace `app.use('/api/auth', ...)` etc.).

---

## Autenticación

1. **Login email/contraseña**: `POST /api/auth/login` → devuelve `token` + objeto `usuario` (incluye `rol`, `empresa_id`, etc.). El token incluye claims `id`, `email`, `rol`, `empresa_id`.
2. **Rutas protegidas**: header `Authorization: Bearer <token>`. Middleware `verificarToken` valida con `JWT_SECRET`.
3. **Perfil tras login**: el front puede usar `GET /api/auth/perfil` con el mismo Bearer (también existe módulo `/api/perfil` para datos y actualización del perfil logueado).
4. **Google**: `GET /api/auth/google` → callback `GET /api/auth/google/callback` → redirect a `FRONTEND_URL/auth/google?token=...`. El usuario debe existir en BD con ese email; si no, flujo de error hacia registro.

El middleware **`permitirRoles`** existe para restringir por `req.usuario.rol`; hoy la mayoría de las rutas solo exigen JWT. Refuerza permisos en rutas sensibles si lo necesitas.

---

## Mapa de rutas (montaje en `app.js`)

Todas las URLs siguientes llevan prefijo **`/api`** en el servidor.

| Prefijo montado | Archivo | Autenticación |
|-----------------|---------|----------------|
| `/auth` | `auth.routes.js` | Mixto: login/registro/recuperación públicos; `GET /perfil` y OAuth según caso |
| `/empresas` | `empresas.routes.js` | Público: `POST /` registro empresa |
| `/trabajadores` | `trabajadores.routes.js` | JWT en todas |
| `/obras` | `obras.routes.js` | JWT |
| `/subcargos` | `subcargos.routes.js` | JWT |
| `/asistencia` | `asistencia.routes.js` | JWT |
| `/reportes` | `reportes.routes.js` | JWT |
| `/usuarios` | `usuarios.routes.js` | JWT |
| `/novedades` | `novedades.routes.js` | JWT |
| `/documentos` | `documentos.routes.js` | JWT |
| `/notificaciones` | `notificaciones.routes.js` | JWT |
| `/dispositivos` | `dispositivos.routes.js` | JWT |
| `/configuracion` | `configuracion.routes.js` | JWT |
| `/perfil` | `perfil.routes.js` | JWT |

### Detalle por router

**`/api/auth`**

- `POST /login`, `POST /registro`, `POST /recuperar-password`, `POST /reset-password`
- `GET /perfil` (JWT)
- `GET /google`, `GET /google/callback` (si Google está configurado)

**`/api/empresas`**

- `POST /` — alta de empresa (flujo desde pantalla de registro del front)

**`/api/trabajadores`**

- `GET /`, `GET /cedula/:cedula`, `GET /:id`
- `POST /`, `PUT /:id`
- `PATCH /:id/estado`, `PATCH /:id/descriptor`
- `POST /identificar-rostro`

**`/api/obras`**

- `GET /`, `GET /stats`, `GET /pendientes`, `GET /:id`
- `POST /`, `PUT /:id`, `PATCH /:id/estado`

**`/api/subcargos`**

- `GET /` — catálogo para formularios de personal

**`/api/asistencia`**

- `POST /jornada/abrir`, `PATCH /jornada/:id/cerrar`
- `POST /registrar`
- `GET /jornadas`, `GET /resumen`, `GET /registros`, `GET /resumen-trabajadores`

**`/api/reportes`**

- `GET /resumen`, `GET /asistencia`, `GET /ausencias`, `GET /horas`
- `POST /exportar`

**`/api/usuarios`**

- `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`

**`/api/novedades`**

- `GET /`, `POST /`, `PATCH /:id/resolver`

**`/api/documentos`**

- `GET /`, `POST /`, `PUT /:id`

**`/api/notificaciones`**

- `GET /`, `GET /badge`, `PATCH /:id/leer`

> El frontend puede invocar `PATCH /notificaciones/todas/leer`; esa ruta **no** está registrada en el backend hasta que se implemente.

**`/api/dispositivos`**

- `GET /`, `POST /`, `PUT /:id`, `PATCH /:id/estado`, `DELETE /:id`

**`/api/configuracion`**

- `GET /`, `PUT /`

**`/api/perfil`**

- `GET /`, `PUT /`, `PUT /password`, `PUT /foto` (multipart, campo `foto`)

---

## CORS y seguridad

En `app.js` se usa `cors()` sin opciones restrictivas, adecuado para desarrollo. En producción conviene restringir `origin` a la URL del frontend (Vercel) y revisar cabeceras permitidas.

---

## Integración con el frontend

1. El front envía peticiones a `VITE_API_URL` (debe terminar en **`/api`**, igual que el default local).
2. Tras login, guarda el JWT; el cliente Axios adjunta `Authorization: Bearer ...` en cada request.
3. Un **401** global (excepto ciertos casos de cambio de contraseña) limpia sesión y redirige a `/login`.

Para una tabla pantalla ↔ endpoint desde el punto de vista del front, consulta `checkinout-frontend/README.md`.

---

## Despliegue

El README de la raíz del monorepo indica uso de **Railway** para MySQL y **Vercel** para el frontend. El backend puede alojarse en Railway, Render, VPS, etc.: define `PORT`, variables de BD, JWT, `FRONTEND_URL` y URLs de callback de Google acordes al dominio público.

---

## Notas de mantenimiento

- **`roles.middleware.js`**: exporta `permitirRoles` para endurecer permisos por rol cuando lo necesites.
- Si el front llama a un endpoint que no existe en el backend, habrá que añadir la ruta o ajustar el cliente (por ejemplo, acciones masivas sobre notificaciones).
