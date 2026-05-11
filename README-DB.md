# Conexión a base de datos y API

El frontend usa **servicios en JavaScript** que hoy leen y escriben en un **store en memoria** (`checkinout-frontend/src/services/dataStore.js`). Los datos iniciales viven ahí para que **obras, personal, asistencias y documentos** sigan alineados entre pantallas.

Cuando exista backend con base de datos, la persona encargada puede **sustituir solo el cuerpo de cada función** en los archivos indicados (manteniendo la misma firma y formato `{ ok, data }` / `{ ok: false, message }` que usa `serviceUtils.js`).

---

## Resumen por módulo

| Módulo (pantalla) | Servicio | Store / origen de datos |
|-------------------|----------|-------------------------|
| Personal | `src/services/personalService.js` | `store.personal`, `store.obras` |
| Roles y usuarios | `src/services/usuariosService.js` | `store.usuarios` |
| Dispositivos | `src/services/dispositivosService.js` | `store.dispositivos` |
| Asistencias | `src/services/asistenciasService.js` | `store.asistencias`, `store.personal`, `store.obras` |
| Reportes | `src/services/reportesService.js` | Lee `store.asistencias` (mismo origen que asistencias) |
| Documentos (admin) | `src/services/documentosService.js` | `store.documentos`, `store.personal` |
| Mis obras | `src/services/obrasService.js` | `store.obras`, agrega stats con `personalService` y `store.asistencias` |

---

## Personal — `personalService.js`

| Función | Endpoint sugerido | Cuerpo / query |
|---------|---------------------|----------------|
| `getAll(filtros)` | `GET /api/personal?obra=&cargo=&estado=&search=` | Query: `obra`, `cargo`, `estado`, `search`. Respuesta: array de trabajadores. |
| `getById(id)` | `GET /api/personal/:id` | — |
| `create(datos)` | `POST /api/personal` | Body JSON: `{ nombre, documento, cargo, obra, correo, telefono, estado }` (`estado`: `activo` \| `inactivo`). |
| `update(id, datos)` | `PUT /api/personal/:id` | Mismo shape parcial o completo. |
| `remove(id)` | `DELETE /api/personal/:id` | — |

Helpers locales (sin HTTP hoy): `getCargosOpciones()`, `listTrabajadoresParaSelect()` → en API serían `GET /api/personal?fields=minimal` o similar.

---

## Usuarios y roles — `usuariosService.js`

| Función | Endpoint sugerido | Notas |
|---------|------------------|--------|
| `getAll(filtros)` | `GET /api/usuarios?search=&rol=&estado=` | |
| `getById(id)` | `GET /api/usuarios/:id` | |
| `create(datos)` | `POST /api/usuarios` | Body: `{ nombre, correo, password, rol, obra, estado }`. **El backend debe hashear la contraseña.** |
| `update(id, datos)` | `PUT /api/usuarios/:id` | Si `password` viene vacío al editar, no actualizar contraseña. |
| `updateRol(id, rol)` | `PUT /api/usuarios/:id/rol` | Body: `{ rol }` |
| `remove(id)` | `DELETE /api/usuarios/:id` | |

---

## Dispositivos — `dispositivosService.js`

| Función | Endpoint sugerido | Body / notas |
|---------|------------------|--------------|
| `getAll(filtros)` | `GET /api/dispositivos?search=&obra=&estado=` | Respuesta puede incluir `rows` y `stats` o calcular stats en front. |
| `getById(id)` | `GET /api/dispositivos/:id` | |
| `create(datos)` | `POST /api/dispositivos` | `{ nombre, tipo, obra, pin?, id? }` — si no hay `id`, generar `DEV-XXX` en servidor. |
| `update(id, datos)` | `PUT /api/dispositivos/:id` | |
| `updateEstado(id, estado)` | `PUT /api/dispositivos/:id/estado` | `{ estado: "Activo" \| "Inactivo" }` |
| `remove(id)` | `DELETE /api/dispositivos/:id` | |

---

## Asistencias — `asistenciasService.js`

| Función | Endpoint sugerido | Body / query |
|---------|------------------|--------------|
| `getAll(filtros)` | `GET /api/asistencias?obra=&fecha=&estado=&search=` | |
| `getById(id)` | `GET /api/asistencias/:id` | |
| `create(datos)` | `POST /api/asistencias` | `{ trabajadorId, obra, fecha, ingreso?, salida?, estado? }` |
| `update(id, datos)` | `PUT /api/asistencias/:id` | |
| `remove(id)` | `DELETE /api/asistencias/:id` | |
| `getAllRaw()` (uso interno / reportes) | `GET /api/asistencias` sin filtros o endpoint dedicado | |

---

## Reportes — `reportesService.js`

| Función | Endpoint sugerido | Respuesta esperada |
|---------|------------------|-------------------|
| `generar(filtros)` | `GET /api/reportes?obra=&estado=&fechaInicio=&fechaFin=` | `{ resumen: { totalRegistros, diasConAsistencia, ausenciasTotales, promedioDiario }, trabajadores: [{ id, nombre, obra, diasAsistidos, ausencias, horasTotales }], vacio?: boolean }` |

Hoy el cálculo se hace en memoria leyendo `store.asistencias`.

---

## Documentos — `documentosService.js`

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

## Obras — `obrasService.js`

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

## Formato de respuesta sugerido (front)

Los servicios actuales usan:

- Éxito: `{ ok: true, data: ... }`
- Error: `{ ok: false, message: "texto" }`

Mantener algo equivalente al migrar a `fetch`/`axios` facilita no tocar los componentes.
