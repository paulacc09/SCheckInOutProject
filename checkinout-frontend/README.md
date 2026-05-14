# CheckInOut — Frontend (SPA)

Aplicación web **React 18** generada con **Vite**, estilos con **Tailwind CSS**, rutas con **React Router v6** y llamadas HTTP con **Axios**. Está pensada para trabajar contra la API del repositorio hermano **`checkinout-backend`**, que expone todo bajo el prefijo **`/api`**.

---

## Cómo encaja en el monorepo

| Pieza | Función |
|--------|---------|
| Este proyecto (`checkinout-frontend/`) | Interfaz por rol: administrador, inspector SST y encargado de obra. |
| `checkinout-backend/` | API REST + MySQL + JWT + OAuth Google + correo y medios. |
| `README.md` (raíz) | Guía rápida de clonado, instalación y despliegue. |
| `checkinout-backend/README.md` | Contrato de API, variables de entorno del servidor y mapa de rutas. |

Flujo de datos: **componentes y páginas** → **Axios** (`src/api/axios.js`, `baseURL` = API) → **backend** → **MySQL**. No hay store en memoria para datos de negocio; lo que antes podía documentarse como mock ha sido sustituido por integración real con la API.

---

## Stack técnico

- **React 18** + **Vite 5**
- **Tailwind CSS 3**, **PostCSS**, **Autoprefixer**
- **react-router-dom** — rutas públicas y layouts protegidos por rol
- **axios** — cliente HTTP único con interceptores
- **lucide-react** — iconografía
- **face-api.js** — reconocimiento / registro de descriptor facial en flujos de personal (coordina con el backend en endpoints de trabajadores)
- **jspdf** + **jspdf-autotable** — exportes tipo informe en pantallas de reportes

---

## Configuración: variable de entorno

En la raíz del frontend, crea **`.env`** o **`.env.local`** (Vite solo expone variables que empiezan por `VITE_`):

```env
# Debe apuntar al prefijo /api del backend (incluye /api al final)
VITE_API_URL=http://localhost:3000/api
```

En producción (por ejemplo Vercel), define `VITE_API_URL` con la URL pública de tu API, por ejemplo `https://tu-api.railway.app/api`.

El cliente Axios está en `src/api/axios.js`:

- **`baseURL`**: `import.meta.env.VITE_API_URL || "http://localhost:3000/api"`.
- **Request**: si existe `localStorage.checkinout_token`, se envía `Authorization: Bearer <token>`.
- **Response**: ante **401**, limpia token y usuario y redirige a `/login` (salvo peticiones relacionadas con cambio de contraseña en perfil).

---

## Arranque en desarrollo

```bash
cd checkinout-frontend
npm install
npm run dev
```

Por defecto Vite sirve en **http://localhost:5173**. El backend debe estar en marcha (típicamente **http://localhost:3000**) y la base de datos accesible para que las pantallas con datos reales funcionen.

Otros scripts:

- `npm run build` — bundle de producción en `dist/`
- `npm run preview` — sirve el build localmente
- `npm run lint` — ESLint

---

## Autenticación y sesión

1. **`AuthContext`** (`src/context/AuthContext.jsx`): guarda `usuario` y `token` en estado y en `localStorage` (`checkinout_token`, `checkinout_user`).
2. **Login**: `POST /auth/login` con `{ email, password }`. La respuesta debe traer `data.token` y `data.usuario`. La pantalla de login exige que el **rol seleccionado en la UI** coincida con `usuario.rol` del servidor.
3. **Google**: tras OAuth, el backend redirige a `/auth/google?token=...`. La página **`AuthGoogle.jsx`** guarda el token, llama **`GET /auth/perfil`** para hidratar el usuario y navega al home según rol.
4. **`ProtectedRoute`**: si no hay usuario, redirige a `/login`; si el rol no coincide con la ruta, redirige al home de ese rol.

Roles usados en rutas (deben coincidir con los valores en BD):

- `administrador` — prefijo `/admin/...`
- `inspector_sst` — prefijo `/sst/...`
- `encargado` — prefijo `/encargado/...`

---

## Mapa de rutas de la SPA (`App.jsx`)

| Ruta | Quién accede | Vista |
|------|----------------|--------|
| `/login` | Público | Login |
| `/registro` | Público | Registro de empresa → `POST /empresas` |
| `/auth/google` | Callback OAuth | Intercambia token por perfil |
| `/recuperar-password`, `/nueva-clave` | Público | Flujo Brevo / token en enlace |
| `/admin/*` | `administrador` | Obras, personal, roles, dispositivos, asistencias, reportes, documentos, novedades, configuración, perfil, notificaciones |
| `/sst/*` | `inspector_sst` | Asistencia, personal, novedades, reportes, documentos |
| `/encargado/*` | `encargado` | Asistencia, personal, novedades, traspasos |

**Notificaciones**: `NotificacionesProvider` hace polling cada 30 s a `/notificaciones/badge` y expone lista y acciones a la UI administrativa.

---

## Estructura de carpetas (`src/`)

```
src/
├── api/
│   └── axios.js           # Instancia Axios + interceptores
├── components/            # Layout, Sidebar, TopBar, Modal, tabla, cámara facial, etc.
├── context/
│   ├── AuthContext.jsx
│   └── NotificacionesContext.jsx
├── hooks/
│   └── useSortable.js
├── pages/
│   ├── Login.jsx, RegistroEmpresa.jsx, AuthGoogle.jsx, RecuperarPassword.jsx, NuevaClave.jsx
│   ├── admin/             # Pantallas administrativas (mayor integración API)
│   ├── inspector/         # Inspector SST
│   └── encargado/         # Encargado de obra
├── services/              # Lógica reutilizable que llama a la API (reportes, documentos, dispositivos, perfil, config, paginación)
├── App.jsx                # Router y providers
├── main.jsx
├── App.css, index.css
```

---

## Qué está conectado a la API y cómo

Las rutas en la tabla siguiente son **relativas a `baseURL`** (ya incluyen el prefijo `/api` del servidor solo en el sentido de que `baseURL` termina en `/api`, por lo que en código aparecen como `/auth/...`, `/obras`, etc.).

| Área | Archivos principales | Endpoints usados (ejemplos) |
|------|----------------------|-----------------------------|
| Auth | `AuthContext.jsx`, `Login.jsx`, `RecuperarPassword.jsx`, `NuevaClave.jsx`, `AuthGoogle.jsx` | `POST /auth/login`, `GET /auth/perfil`, `POST /auth/recuperar-password`, `POST /auth/reset-password` |
| Registro empresa | `RegistroEmpresa.jsx` | `POST /empresas` |
| Obras | `admin/Obras.jsx` | `GET/POST /obras`, `GET /obras/stats`, `PUT /obras/:id`, `PATCH /obras/:id/estado`, `GET /usuarios?rol=inspector_sst` |
| Personal | `admin/Personal.jsx` | `GET /subcargos`, `GET /obras`, `GET /trabajadores`, `POST/PUT /trabajadores`, `PATCH /trabajadores/:id/descriptor` |
| Roles / usuarios | `admin/Roles.jsx` | `GET/POST/PUT/DELETE /usuarios`, `GET /obras` |
| Dispositivos | `admin/Dispositivos.jsx`, `services/dispositivosService.js` | `GET /obras`, `GET/POST/PUT/PATCH/DELETE /dispositivos` |
| Asistencias (admin) | `admin/Asistencias.jsx` | `GET /asistencia/resumen-trabajadores`, `GET /obras` |
| Reportes | `admin/Reportes.jsx`, `services/reportesService.js` | `GET /obras`, `GET /reportes/resumen` (+ otros en servicio según filtros) |
| Documentos | `admin/Documentos.jsx`, `services/documentosService.js` | `GET /trabajadores`, `GET/POST/PUT /documentos` |
| Novedades (admin) | `admin/Novedades.jsx` | `GET /novedades`, `PATCH /novedades/:id/resolver` |
| Configuración | `admin/Configuracion.jsx`, `services/configService.js` | `GET/PUT /configuracion` |
| Perfil | `admin/Perfil.jsx`, `services/perfilService.js` | `GET/PUT /perfil`, `PUT /perfil/password`, `PUT /perfil/foto` |
| Notificaciones | `NotificacionesContext.jsx`, página admin | `GET /notificaciones/badge`, `GET /notificaciones`, `PATCH /notificaciones/:id/leer` |

### Vistas aún placeholder (sin llamadas API en el código actual)

Algunas páginas bajo **`/sst/...`** y **`/encargado/...`** muestran un `EmptyState` indicando que falta conectar el endpoint; el backend ya expone asistencia, reportes, etc., pero el front de esos roles puede estar pendiente de implementación.

### Navegación lateral y perfil

`Sidebar.jsx` enlaza a rutas de perfil según rol (`/admin/perfil`, `/sst/perfil`, `/encargado/perfil`). Asegúrate de que **`App.jsx`** declare las rutas que realmente quieras soportar para SST y encargado (hoy el perfil detallado está registrado para administrador).

---

## Despliegue (Vercel)

`vercel.json` contiene rewrites SPA: cualquier ruta sirve `index.html` para que React Router funcione con URLs profundas.

Define en Vercel:

- `VITE_API_URL` — URL pública del backend + `/api`.

---

## Coherencia con el backend

- Respuestas esperadas del estilo `{ ok: true, data: ... }` o errores con `message` / `mensaje` (el login muestra `message` o `mensaje` del cuerpo de error).
- Los roles en el token deben coincidir exactamente con los strings usados en `ProtectedRoute` y en el `Sidebar`.

Para el inventario completo de rutas HTTP del servidor, consulta **`../checkinout-backend/README.md`**.

---

## Alineación pendiente (revisar al evolucionar el proyecto)

- **`marcarTodasLeidas`** en `NotificacionesContext.jsx` llama a `PATCH /notificaciones/todas/leer`; el backend actual solo expone `PATCH /notificaciones/:id/leer`. O se añade la ruta en el servidor, o se ajusta el front.
- El **`Sidebar`** enlaza a `/sst/perfil` y `/encargado/perfil`, pero en `App.jsx` solo está definida la ruta de perfil bajo el layout de **administrador**. Si quieres perfil para SST o encargado, registra esas rutas o apunta el menú a una vista existente.
