# Conexión a base de datos y API

> **Estado actual:** el frontend habla con la **API real** en `checkinout-backend` mediante Axios (`checkinout-frontend/src/api/axios.js`). La descripción de un *store en memoria* (`dataStore.js`) **ya no aplica** como arquitectura principal.

Para el inventario oficial de rutas HTTP y variables de entorno del servidor, usa **[checkinout-backend/README.md](checkinout-backend/README.md)** y **[checkinout-frontend/README.md](checkinout-frontend/README.md)**.

Este archivo conserva **tablas de referencia** (nombres de endpoints “sugeridos” o históricos) y el formato de respuesta típico del backend.

---

## Resumen por módulo (implementación real)

| Módulo (pantalla) | Código principal | Origen de datos |
|-------------------|------------------|-----------------|
| Personal | `pages/admin/Personal.jsx` | `GET/POST/PUT/PATCH` sobre `/trabajadores`, `/obras`, `/subcargos` |
| Roles y usuarios | `pages/admin/Roles.jsx` | `/usuarios`, `/obras` |
| Dispositivos | `pages/admin/Dispositivos.jsx`, `services/dispositivosService.js` | `/dispositivos` (incluye `PATCH …/estado`) |
| Asistencias | `pages/admin/Asistencias.jsx` | `/asistencia/...`, `/obras` |
| Reportes | `pages/admin/Reportes.jsx`, `services/reportesService.js` | `GET /reportes/resumen` (+ otros en backend) |
| Documentos | `pages/admin/Documentos.jsx`, `services/documentosService.js` | `/documentos`, `/trabajadores` |
| Mis obras | `pages/admin/Obras.jsx` | `/obras`, `/obras/stats`, `/usuarios` |
| Novedades | `pages/admin/Novedades.jsx` | `/novedades`, `PATCH /novedades/:id/resolver` (y `PATCH …/estado` en API) |
| Traspasos (API) | — | `/traspasos` (ver backend; UI encargado según evolución del front) |

---

## Personal / trabajadores

En la API desplegada el recurso es **`/api/trabajadores`**, no `/api/personal`.

| Operación | Ruta típica |
|-----------|-------------|
| Listar | `GET /api/trabajadores` |
| Detalle | `GET /api/trabajadores/:id` |
| Crear / actualizar | `POST /api/trabajadores`, `PUT /api/trabajadores/:id` |
| Estado | `PATCH /api/trabajadores/:id/estado` |
| Descriptor facial | `PATCH /api/trabajadores/:id/descriptor` |

---

## Usuarios y roles

| Operación | Ruta típica |
|-----------|-------------|
| CRUD | `GET/POST/PUT/DELETE /api/usuarios` |

---

## Dispositivos

| Operación | Ruta típica |
|-----------|-------------|
| CRUD + estado | `GET/POST/PUT/DELETE /api/dispositivos`, `PATCH /api/dispositivos/:id/estado` |

---

## Asistencia (prefijo singular `/api/asistencia`)

Ejemplos reales del backend: jornadas (`POST /jornada/abrir`, `PATCH /jornada/:id/cerrar`), `POST /registrar`, `GET /registros`, `GET /resumen-trabajadores`, etc. Las rutas en plural tipo `/api/asistencias` de diseños antiguos no coinciden con el montaje actual.

---

## Reportes

El resumen usado por el front admin es **`GET /api/reportes/resumen`** con query `fecha_inicio`, `fecha_fin`, `obra_id` (ver `reportesService.js`). Otros endpoints: `/api/reportes/asistencia`, `/ausencias`, `/horas`, `POST /exportar`.

---

## Documentos

| Operación | Ruta típica |
|-----------|-------------|
| Listar / crear / actualizar | `GET/POST/PUT /api/documentos` |

---

## Obras

| Operación | Ruta típica |
|-----------|-------------|
| Listar, stats, CRUD, estado | `GET/POST/PUT/PATCH /api/obras`, `GET /api/obras/stats`, etc. |

---

## Formato de respuesta (API)

Convención en `checkinout-backend/src/utils/response.js`:

- Éxito: `{ ok: true, data: ... }`
- Error: `{ ok: false, message: "..." }`

El cliente Axios suele leer `data` del cuerpo JSON de la respuesta HTTP.
