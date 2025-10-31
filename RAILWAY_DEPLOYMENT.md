# Railway Deployment Guide - AhorrAI

## Overview
Esta guía describe cómo desplegar AhorrAI (Backend y Frontend) en Railway y configurar correctamente la conexión entre ellos.

---

## Backend Deployment (Railway)

### Environment Variables
Configura estas variables en Railway:

```
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=3000
NODE_ENV=production

# Frontend URL (IMPORTANTE - Configurar con la URL del frontend en Railway)
FRONTEND_URL=https://your-frontend-railway-url.railway.app

# Timezone
TZ=America/Guatemala
```

### Build & Start Commands (Railway)
- **Build**: `npm install`
- **Start**: `npm start`

### CORS Configuration
El CORS se configura en `Backend/src/index.js`:
- **Archivo**: `Backend/src/index.js` (líneas 14-46)
- **Variable usada**: `config.frontendUrl` (que viene de `process.env.FRONTEND_URL`)
- El backend automáticamente permite requests desde la URL especificada en `FRONTEND_URL`

---

## Frontend Deployment (Railway)

### Environment Variables
Configura en Railway:

```
VITE_API_URL=https://your-backend-railway-url.railway.app/api
VITE_N8N_WEBHOOK_URL=https://primary-production-f465.up.railway.app/webhook/547531b3-5c5a-4b5e-82d5-8170253a01a4/chat
```

### Build & Start Commands (Railway)
- **Build**: `npm run build`
- **Start**: Sirve desde el directorio `dist/` (configurar como static site en Railway)

---

## Connection Flow

1. **Frontend (Railway)** → solicita a → **Backend (Railway)**
2. Backend valida CORS usando `FRONTEND_URL`
3. Backend conecta a **Supabase** usando `SUPABASE_URL` y claves
4. Backend sube archivos a **Cloudinary** si es necesario

---

## Checklist Pre-Deployment

✅ Backend:
- [ ] `npm install` ejecuta sin errores
- [ ] `npm start` inicia correctamente en puerto 3000
- [ ] Variables de entorno configuradas en Railway
- [ ] `FRONTEND_URL` apunta a la URL del frontend en Railway

✅ Frontend:
- [ ] `npm install` ejecuta sin errores
- [ ] `npm run build` genera carpeta `dist/` correctamente
- [ ] `VITE_API_URL` apunta al backend en Railway
- [ ] Archivos estáticos se sirven correctamente

---

## URLs Example (después del deploy)
```
Backend:  https://ahorrai-backend.railway.app
Frontend: https://ahorrai-frontend.railway.app
API:      https://ahorrai-backend.railway.app/api
```

**Nota**: En `Backend/src/index.js` línea 15, el `CORS` se configura automáticamente con la variable `FRONTEND_URL`. Asegúrate de establecer correctamente en Railway.
