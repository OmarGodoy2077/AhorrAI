# 🚀 n8n Chat Integration - AhorrAI

## 📌 Resumen de Implementación

El widget de chat n8n ha sido **completamente integrado** en tu aplicación AhorrAI. Es un chat flotante que aparece en todas las páginas y se comunica con un flujo de n8n mediante webhooks.

## ✅ Que se ha instalado y configurado

### 1. **Paquete NPM**
```bash
✅ @n8n/chat v0.63.0
```

### 2. **Archivos Creados**
```
Frontend/
├── src/
│   └── components/
│       └── N8nChatWidget.tsx          ← Componente del chat
├── .env.local                         ← Variables de entorno
└── docs/
    ├── N8N_CHAT_SETUP.md             ← Guía completa (⭐ LEER PRIMERO)
    ├── N8N_CHAT_QUICK_START.md       ← Guía rápida (5 minutos)
    ├── N8N_CHAT_WORKFLOW_EXAMPLES.md ← Ejemplos de flujos
    └── N8N_CHAT_IMPLEMENTATION.md    ← Este archivo
```

### 3. **Modificaciones en App.tsx**
- ✅ Importación del componente `N8nChatWidget`
- ✅ Renderizado en el nivel superior (disponible en todas las páginas)

## 🎯 Cómo usar (3 pasos)

### Paso 1: Crear un Webhook en n8n

1. Ve a https://app.n8n.cloud
2. Crea un nuevo flujo con un nodo **"Chat Trigger"**
3. Copia la URL del webhook (ejemplo: `https://yourname.app.n8n.cloud/webhook/abc123`)

### Paso 2: Configurar la URL en Frontend

Edita el archivo `Frontend/.env.local`:

```bash
VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/abc123
```

### Paso 3: Activar el Flujo

En n8n, haz clic en el botón **"Activated"** para activar tu flujo.

## 🔑 Variables de Entorno

### `.env.local` (Desarrollo)

```bash
# URL del webhook de n8n
VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID
```

**Ejemplo real:**
```bash
VITE_N8N_WEBHOOK_URL=https://mycompany.app.n8n.cloud/webhook/513107b3-6f3a-4a1e-af21-659f0ed14183
```

### `.env.production` (Producción)

Debes agregar la misma variable en tu ambiente de producción:

```bash
VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID
```

## 📍 Ubicación del Chat

- **Ubicación**: Esquina inferior derecha de la pantalla
- **Tipo**: Botón flotante que expande un chat
- **Disponibilidad**: Todas las páginas de la aplicación
- **Persistencia**: El chat se mantiene al navegar entre páginas

## 🎨 Personalización

### Cambiar Mensajes de Bienvenida

Abre `src/components/N8nChatWidget.tsx` y edita:

```typescript
initialMessages: [
  'Tu primer mensaje',
  'Tu segundo mensaje'
],
i18n: {
  en: {
    title: 'Tu Título',
    subtitle: 'Tu Subtítulo',
    // ... otros campos
  }
}
```

### Cambiar Colores y Estilos

Agrega CSS global o edita el archivo `src/index.css`:

```css
:root {
  --chat--color--primary: #e74266;      /* Color botón */
  --chat--color--secondary: #20b69e;    /* Color mensajes usuario */
  --chat--window--width: 400px;         /* Ancho del chat */
  --chat--window--height: 600px;        /* Alto del chat */
  --chat--toggle--size: 64px;           /* Tamaño botón flotante */
}
```

## 🛠️ Configuración en n8n

### Chat Trigger Settings

```
Authentication Method: None o API Key
Allow Origins (CORS):
  ✅ http://localhost:5173 (desarrollo)
  ✅ https://tudominio.com (producción)
  
Response Mode: 
  ○ Awaiting response (espera respuesta)
  ○ Streaming response (respuesta progresiva)
```

### Agregar Lógica AI

En tu flujo n8n, después del Chat Trigger:

1. **AI Agent Node** - Para respuestas inteligentes
   - Usa GPT-4, Claude, etc.
   - Configura el system prompt

2. **HTTP Request Node** - Para consultar tu backend
   - Obtén datos del usuario
   - Consulta la base de datos

3. **Function Node** - Lógica personalizada
   - Procesa datos
   - Genera respuestas

4. **Response Node** - Envía respuesta al usuario

## 📚 Documentación Disponible

### 1. **N8N_CHAT_SETUP.md** (Recomendado)
- Documentación completa y detallada
- Arquitectura de implementación
- Configuración paso a paso
- Troubleshooting
- Seguridad y CORS

👉 **Lee este archivo primero**

### 2. **N8N_CHAT_QUICK_START.md**
- Guía rápida (5 minutos)
- Pasos esenciales
- Ejemplo simple

### 3. **N8N_CHAT_WORKFLOW_EXAMPLES.md**
- Ejemplos de flujos n8n
- Flujo básico
- Flujo con contexto
- Flujo con base de datos
- Flujo con memoria
- Flujo con notificaciones

## 🔄 Cómo Funciona

### Flujo de Comunicación

```
[Usuario escribe en chat]
           ↓
[Browser envía POST a n8n]
           ↓
[n8n procesa: AI Agent, Logic, etc.]
           ↓
[n8n retorna respuesta JSON]
           ↓
[Chat muestra respuesta]
```

### Parámetros del Webhook

**Solicitud (Client → n8n):**
```json
{
  "action": "sendMessage",
  "chatInput": "Hola, ¿cuál es mi saldo?",
  "sessionId": "session-id-123"
}
```

**Respuesta (n8n → Client):**
```json
{
  "output": "Tu saldo actual es $5,000"
}
```

## 🧪 Pruebas

### Checklist

- [ ] El archivo `.env.local` está configurado
- [ ] El flujo n8n está **Activated**
- [ ] Los "Allowed Origins" incluyen `http://localhost:5173`
- [ ] El chat aparece en la esquina inferior derecha
- [ ] Al hacer clic, el chat se abre
- [ ] Es posible escribir mensajes
- [ ] Las respuestas llegan desde n8n
- [ ] Funciona en todas las páginas

### Verificar en DevTools (F12)

**Console:**
- No debería haber errores sobre el webhook

**Network:**
- POST requests a tu webhook de n8n
- Respuestas con status 200 OK

## 🔐 Seguridad

### CORS

En n8n, configura los orígenes permitidos:
```
http://localhost:5173      (desarrollo)
https://tudominio.com      (producción)
https://www.tudominio.com  (con www)
```

### Headers Personalizados

Si necesitas autenticación:

```typescript
// En N8nChatWidget.tsx
webhookConfig: {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}
```

## 📦 Información Técnica

| Propiedad | Valor |
|-----------|-------|
| Paquete | @n8n/chat |
| Versión | 0.63.0 |
| Tipo de Componente | React Hook (useEffect) |
| Modo | Window (chat flotante) |
| Archivo Principal | src/components/N8nChatWidget.tsx |
| Ruta de Integración | src/App.tsx |
| Variable de Entorno | VITE_N8N_WEBHOOK_URL |
| Estado | ✅ Implementado y funcionando |

## 🚀 Deployment

### Desarrollo Local

```bash
# 1. Asegúrate de que .env.local existe
# 2. Ejecuta:
npm run dev

# 3. Abre http://localhost:5173
```

### Build para Producción

```bash
# 1. Actualiza .env.production
# 2. Ejecuta:
npm run build

# 3. Despliega la carpeta dist/
```

## ❓ Preguntas Frecuentes

**P: ¿El chat está disponible en todas las páginas?**
R: Sí, está configurado a nivel de `App.tsx` así que aparece en todos lados.

**P: ¿Puedo cambiar el color y el tamaño?**
R: Sí, usa variables CSS. Ver sección "Personalización".

**P: ¿Cómo agrego IA al chat?**
R: En n8n, agrega un nodo "AI Agent" después del Chat Trigger. Ver ejemplos en `N8N_CHAT_WORKFLOW_EXAMPLES.md`.

**P: ¿Funciona sin conexión?**
R: No, necesita conexión al webhook de n8n.

**P: ¿Es seguro enviar datos del usuario?**
R: Sí, usa HTTPS y configura CORS correctamente en n8n.

## 🎓 Próximos Pasos

1. **Leer** `N8N_CHAT_SETUP.md`
2. **Crear** un flujo en n8n con Chat Trigger
3. **Copiar** la URL del webhook
4. **Configurar** `.env.local`
5. **Activar** el flujo en n8n
6. **Probar** el chat en `http://localhost:5173`
7. **Personalizar** según necesites
8. **Desplegar** en producción

## 📞 Soporte

- **Documentación oficial n8n Chat**: https://www.npmjs.com/package/@n8n/chat
- **n8n Docs**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io

---

## 📋 Resumen Técnico

```typescript
// Componente: src/components/N8nChatWidget.tsx
// Importa: @n8n/chat
// Usa: useEffect + createChat()
// Variable de env: VITE_N8N_WEBHOOK_URL
// Modo: window (flotante)
// Sesiones: Activadas (cargar historial anterior)
// Streaming: Desactivado (puede habilitarse)
```

---

**Estado**: ✅ **Implementado y Listo para Usar**

**Última actualización**: Octubre 2025

**Versión de n8n Chat**: 0.63.0
