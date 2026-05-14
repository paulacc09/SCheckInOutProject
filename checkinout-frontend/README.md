# CheckInOut — Frontend

SPA **React 18** con **Vite 5**, **Tailwind CSS**, **React Router v6** y **Axios**. Consume la API del proyecto `checkinout-backend` bajo el prefijo configurado en **`VITE_API_URL`** (debe incluir `/api` al final).

---

## Enlace con el backend

| Concepto | Detalle |
|----------|---------|
| Cliente HTTP | `src/api/axios.js` — `baseURL` desde `import.meta.env.VITE_API_URL` o valor por defecto `http://localhost:3000/api` |
| Token | `localStorage.checkinout_token`; interceptor añade `Authorization: Bearer …` |
| 401 | Limpia sesión y redirige a `/login` (salvo casos de cambio de contraseña en perfil) |
| Sesión | `AuthContext` — `checkinout_user` + token; login vía `POST /auth/login` |

Variable local típica (`.env.local`):

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Scripts

```bash
npm install
npm run dev      # Vite dev server (puerto 5173 por defecto)
npm run build
npm run preview
npm run lint
```

---

## Roles y rutas (`App.jsx`)

| Rol (valor en BD) | Prefijo rutas |
|-------------------|----------------|
| `administrador` | `/admin/...` |
| `inspector_sst` | `/sst/...` |
| `encargado` | `/encargado/...` |

El login exige que el rol seleccionado en la UI coincida con `usuario.rol` devuelto por el servidor.

---

## Layout y navegación

- **`Layout.jsx`:** sidebar en contenedor **sticky** + `main` con scroll (`overflow-y-auto`) y tarjeta blanca con `<Outlet />`.
- **`Sidebar.jsx`:** menú por rol; enlaces de perfil según rol (revisar que existan las mismas rutas en `App.jsx`).

---

## Estructura de `src/`

```
src/
├── api/axios.js
├── components/     # Layout, Sidebar, TopBar, Modal, FlashBanner, PaginationBar, EmptyState, CamaraFacial, …
├── context/        # AuthContext, NotificacionesContext
├── hooks/
├── pages/          # Login, registro, admin/, inspector/, encargado/
├── services/       # reportesService, documentosService, dispositivosService, perfilService, configService, pagination.js
├── App.jsx
└── main.jsx
```

---

## Datos: servicios y páginas

No hay `dataStore` en memoria como fuente principal: las pantallas administrativas llaman a la API con **Axios** o con helpers en **`src/services/`** (por ejemplo `reportesService.generar` → `GET /reportes/resumen`).

| Área | Ubicación principal | API (relativo a `baseURL`) |
|------|----------------------|----------------------------|
| Login / registro / clave | `Login.jsx`, `RegistroEmpresa.jsx`, `RecuperarPassword.jsx`, `NuevaClave.jsx`, `AuthGoogle.jsx` | `/auth/...`, `/empresas` |
| Obras | `admin/Obras.jsx` | `/obras`, `/usuarios?rol=inspector_sst` |
| Personal | `admin/Personal.jsx` | `/trabajadores`, `/obras`, `/subcargos` |
| Roles | `admin/Roles.jsx` | `/usuarios`, `/obras` |
| Dispositivos | `admin/Dispositivos.jsx`, `services/dispositivosService.js` | `/dispositivos`, `/obras` |
| Asistencias | `admin/Asistencias.jsx` | `/asistencia/resumen-trabajadores`, `/obras` |
| Reportes | `admin/Reportes.jsx`, `services/reportesService.js` | `/reportes/resumen`; exportación CSV/PDF en cliente |
| Documentos | `admin/Documentos.jsx`, `services/documentosService.js` | `/documentos`, `/trabajadores` |
| Novedades | `admin/Novedades.jsx` | `/novedades`, `PATCH /novedades/:id/resolver` |
| Configuración / perfil | `admin/Configuracion.jsx`, `admin/Perfil.jsx`, servicios | `/configuracion`, `/perfil` |
| Notificaciones | `NotificacionesContext.jsx` | `/notificaciones`, `/notificaciones/badge` |

Algunas vistas de **inspector** y **encargado** pueden seguir como placeholder (`EmptyState`) hasta conectar todos los endpoints.

---

## Reportes (admin)

- Filtros: obra, estado, fechas; **Generar** llama a `reportesService.generar` → resumen y filas por trabajador.
- **CSV / PDF** en cliente (jspdf + jspdf-autotable).
- Mezcla reciente en UI: `EmptyState` cuando no hay datos, helper **`formatearValor`** para celdas, `max` en inputs de fecha a la fecha actual.

---

## Despliegue (Vercel)

Definir `VITE_API_URL` en el panel de variables. `vercel.json` reescribe rutas al `index.html` para SPA.

---

## Documentación de la API

Rutas y `.env` del servidor: [checkinout-backend/README.md](../checkinout-backend/README.md).
