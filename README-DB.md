# Conexión a base de datos y API

> **Estado (2026):** el frontend **ya consume la API real** (`checkinout-backend`) vía Axios (`checkinout-frontend/src/api/axios.js`) y **no** usa un store en memoria global como arquitectura principal. Los apartados siguientes conservan **referencia de contratos** útiles al diseñar o ampliar endpoints; para el mapa actual de rutas HTTP, usa [checkinout-backend/README.md](checkinout-backend/README.md) y [checkinout-frontend/README.md](checkinout-frontend/README.md).

El frontend usa **servicios y páginas** que llaman a la API con el formato habitual del backend `{ ok: true, data }` / `{ ok: false, message }` (ver `checkinout-backend/src/utils/response.js`).

---

## Resumen por módulo (referencia; implementación actual)

La implementación viva está en **`src/pages/admin/*`** y en **`src/services/*`** (ver [checkinout-frontend/README.md](checkinout-frontend/README.md)). La tabla siguiente conserva nombres de módulos lógicos y endpoints de ejemplo; ignora las rutas de archivos antiguas si ya no existen en el repo.

| Módulo (pantalla) | Dónde está hoy (orientativo) | Origen de datos |
|-------------------|------------------------------|-----------------|
| Personal | `pages/admin/Personal.jsx` | API `/trabajadores`, `/obras`, `/subcargos` |
| Roles y usuarios | `pages/admin/Roles.jsx` | API `/usuarios`, `/obras` |
| Dispositivos | `pages/admin/Dispositivos.jsx`, `services/dispositivosService.js` | API `/dispositivos`, `/obras` |
| Asistencias | `pages/admin/Asistencias.jsx` | API `/asistencia/...`, `/obras` |
| Reportes | `pages/admin/Reportes.jsx`, `services/reportesService.js` | API `/reportes/...`, `/obras` |
| Documentos (admin) | `pages/admin/Documentos.jsx`, `services/documentosService.js` | API `/documentos`, `/trabajadores` |
| Mis obras | `pages/admin/Obras.jsx` | API `/obras`, `/obras/stats`, `/usuarios` |

---

## Personal (trabajadores en la API real)

En el backend actual el recurso es **`/api/trabajadores`** (no `/personal`). La tabla siguiente conserva el naming antiguo “personal” solo como equivalencia conceptual.

| Operación | En la API CheckInOut | Notas |
|-----------|----------------------|--------|
| Listar | `GET /api/trabajadores` | Con JWT; filtros según implementación del controlador |
| Detalle | `GET /api/trabajadores/:id` | |
| Crear / actualizar | `POST /api/trabajadores`, `PUT /api/trabajadores/:id` | Ver `trabajadores.controller.js` |
| Estado | `PATCH /api/trabajadores/:id/estado` | |
| Descriptor facial | `PATCH /api/trabajadores/:id/descriptor` | Usado desde `Personal.jsx` |
| Catálogo subcargos | `GET /api/subcargos` | |

---

## Usuarios y roles (`pages/admin/Roles.jsx` → `/api/usuarios`)

| Función | Endpoint sugerido | Notas |
|---------|------------------|--------|
| `getAll(filtros)` | `GET /api/usuarios?search=&rol=&estado=` | |
| `getById(id)` | `GET /api/usuarios/:id` | |
| `create(datos)` | `POST /api/usuarios` | Body: `{ nombre, correo, password, rol, obra, estado }`. **El backend debe hashear la contraseña.** |
| `update(id, datos)` | `PUT /api/usuarios/:id` | Si `password` viene vacío al editar, no actualizar contraseña. |
| `updateRol(id, rol)` | `PUT /api/usuarios/:id/rol` | Body: `{ rol }` |
| `remove(id)` | `DELETE /api/usuarios/:id` | |

---

## Dispositivos (`services/dispositivosService.js`)

| Función | Endpoint sugerido | Body / notas |
|---------|------------------|--------------|
| `getAll(filtros)` | `GET /api/dispositivos?search=&obra=&estado=` | Respuesta puede incluir `rows` y `stats` o calcular stats en front. |
| `getById(id)` | `GET /api/dispositivos/:id` | |
| `create(datos)` | `POST /api/dispositivos` | `{ nombre, tipo, obra, pin?, id? }` — si no hay `id`, generar `DEV-XXX` en servidor. |
| `update(id, datos)` | `PUT /api/dispositivos/:id` | |
| `updateEstado(id, estado)` | `PATCH /api/dispositivos/:id/estado` | En el backend real es **PATCH**, no PUT. |
| `remove(id)` | `DELETE /api/dispositivos/:id` | |

---

## Asistencias (en la API real: prefijo `/api/asistencia`)

| Concepto | Endpoints reales (ver backend) |
|----------|--------------------------------|
| Jornadas | `POST /api/asistencia/jornada/abrir`, `PATCH /api/asistencia/jornada/:id/cerrar` |
| Registro | `POST /api/asistencia/registrar` |
| Consultas | `GET /api/asistencia/jornadas`, `GET /api/asistencia/resumen`, `GET /api/asistencia/registros`, `GET /api/asistencia/resumen-trabajadores` |

Las rutas tipo `/api/asistencias` de la tabla antigua **no** coinciden con el montaje actual (`/asistencia` en singular).

---

## Reportes (`services/reportesService.js`)

| Función | Endpoint sugerido | Respuesta esperada |
|---------|------------------|-------------------|
| `generar(filtros)` | `GET /api/reportes/resumen` (y otros bajo `/api/reportes/`) | Ver `reportes.controller.js` |

El front usa la API; no hay cálculo de reportes solo en un store local.

---

## Documentos (`services/documentosService.js`)

| Función | Endpoint sugerido | Notas |
|---------|------------------|--------|
| `getAll(filtros)` | `GET /api/documentos?tab=&tipo=&search=&estadoFiltro=` | `tab`: `Todos` \| `Vigentes` \| `Por vencer` \| `Vencidos`. |
| `getById(id)` | `GET /api/documentos/:id` | |
| `create(datos)` | `POST /api/documentos` | `multipart/form-data`: archivo + metadatos (`trabajadorId`, `tipo`, `emision`, `vencimiento`). |
| `update(id, datos)` | `PUT /api/documentos/:id` | Metadatos; opcional nuevo archivo. |
| `remove(id)` | `DELETE /api/documentos/:id` | |
| `getAlertaPorVencer()` | p.ej. `GET /api/documentos/alertas/por-vencer` | Opcional; puede derivarse del listado. |
| `calcularEstado(vencimiento)` | — | **En producción el estado debería calcularse en backend** con la fecha actual (Vigente / Por vencer ≤30 días / Vencido). |

---

## Obras (`pages/admin/Obras.jsx`)

| Función | Endpoint sugerido | Body / notas |
|---------|------------------|--------------|
| `getAll(filtros)` | `GET /api/obras?search=&estado=` | |
| `getById(id)` | `GET /api/obras/:id` | |
| `getEstadisticas(id)` | `GET /api/obras/:id/estadisticas` | `{ trabajadoresActivos, porcentajeAsistencia }` |
| `create(datos)` | `POST /api/obras` | `{ nombre, ubicacion, encargado, fechaInicio, estado }` |
| `update(id, datos)` | `PUT /api/obras/:id` | |
| `remove(id)` | `DELETE /api/obras/:id` | Validar en servidor que no haya trabajadores activos en esa obra. |
| `getEncargadosOpciones()` | `GET /api/usuarios?rol=Encargado` o inclusión en `GET /api/obras/meta` | |
| `getNombresObras()` | `GET /api/obras?fields=nombre` | Lista para dropdowns. |

---

## Formato de respuesta (API y front)

Convención usada en el backend (`src/utils/response.js`) y asumida por el cliente:

- Éxito: `{ ok: true, data: ... }`
- Error: `{ ok: false, message: "texto" }`

El proyecto ya usa **Axios** con este criterio de cuerpos de respuesta.
