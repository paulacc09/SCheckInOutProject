# SCheckInOut — CheckInOut

Monorepo con **API Node/Express + MySQL** (`checkinout-backend`) y **SPA React/Vite** (`checkinout-frontend`) para control de asistencia y personal en obras.

---

## Documentación por carpeta

| Documento | Contenido |
|-------------|-----------|
| [checkinout-backend/README.md](checkinout-backend/README.md) | API, variables de entorno, rutas, JWT, OAuth, integraciones (MySQL, Brevo, Cloudinary). |
| [checkinout-frontend/README.md](checkinout-frontend/README.md) | React, `VITE_API_URL`, roles, rutas, pantallas y servicios. |
| [README-DB.md](README-DB.md) | Referencia de contratos y equivalencias módulo ↔ API (histórico de nombres sugeridos). |

---

## Arquitectura rápida

```
[Navegador] → React (Vite) → Axios (Bearer JWT) → Express /api → MySQL
```

- El frontend usa `VITE_API_URL` apuntando a la base de la API **incluyendo** el sufijo `/api` (p. ej. `http://localhost:3000/api`).
- Tras el login, el token se guarda en `localStorage` y se envía en `Authorization: Bearer …`.

---

## Requisitos

- Node.js y npm  
- Git  
- MySQL accesible y esquema acorde a los controladores del backend  

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

Crea `checkinout-backend/.env`. Lista detallada en [checkinout-backend/README.md](checkinout-backend/README.md). Mínimo habitual: `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`; opcional según funciones: Google OAuth, Brevo, Cloudinary.

```bash
npm run dev
```

Servidor por defecto: `http://localhost:3000` — comprobar `GET http://localhost:3000/api/ping`.

### Frontend

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

App por defecto: `http://localhost:5173`.

---

## Despliegue

- **Frontend:** Vercel (build `vite build`; rewrites SPA en `checkinout-frontend/vercel.json`). Definir `VITE_API_URL` con la URL pública del backend + `/api`.
- **Base de datos:** suele usarse **Railway** (MySQL).
- **Backend:** Railway, Render, VPS, etc.; configurar CORS al dominio del front y URLs de OAuth/correo coherentes con `FRONTEND_URL`.

---

## Tecnologías (resumen)

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, face-api.js, jsPDF, jspdf-autotable, lucide-react.

**Backend:** Node.js, Express, Passport (Google OAuth 2.0), JWT, bcrypt, MySQL2, Multer, Cloudinary, Nodemailer/Brevo.

**Servicios externos:** Railway, Vercel (según despliegue).
