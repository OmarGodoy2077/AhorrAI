# ✨ n8n Chat Widget - AhorrAI

## 📍 ¿Qué es esto?

Es un **asistente de chat inteligente** integrado en tu aplicación AhorrAI que aparece como un botón flotante en todas las páginas. Se comunica con un flujo de n8n para procesar preguntas y proporcionar respuestas automáticas.

## 🎯 Estado: ✅ Implementado y Listo

Todo está configurado. Solo necesitas:

1. ✅ Instalar dependencias (ya hecho)
2. ✅ Crear un flujo en n8n (necesitas hacer)
3. ✅ Configurar webhook URL (necesitas hacer)
4. ✅ Activar en n8n (necesitas hacer)

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Crear Webhook en n8n

```
1. Ve a https://app.n8n.cloud
2. Nuevo flujo + agregar nodo "Chat Trigger"
3. Copia la URL completa
```

### 2️⃣ Configurar URL

Edita `Frontend/.env.local`:
```bash
VITE_N8N_WEBHOOK_URL=https://tu-instancia.app.n8n.cloud/webhook/ID
```

### 3️⃣ Activar y Probar

```bash
cd Frontend
npm run dev
# Abre http://localhost:5173
# Haz clic en el chat (esquina inferior derecha)
```

## 📚 Documentación

| Archivo | Contenido | Lectura |
|---------|-----------|---------|
| **N8N_CHAT_SETUP.md** | Guía completa y detallada | ⭐⭐⭐ **Leer primero** |
| **N8N_CHAT_QUICK_START.md** | Inicio rápido en 5 minutos | ⭐⭐ Rápido |
| **N8N_CHAT_WORKFLOW_EXAMPLES.md** | Ejemplos de flujos n8n | 📋 Referencia |
| **N8N_CHAT_CONFIG_REFERENCE.md** | Configuración técnica | 🔧 Dev reference |
| **N8N_CHAT_IMPLEMENTATION.md** | Resumen de implementación | 📌 Overview |

👉 **Comienza con `N8N_CHAT_SETUP.md`**

## 📦 Que se instaló

```
Frontend/
├── @n8n/chat (v0.63.0)         ← Paquete NPM
├── src/components/
│   └── N8nChatWidget.tsx        ← Componente React
├── .env.local                   ← Variables de entorno
└── docs/
    ├── N8N_CHAT_SETUP.md        ← 📖 Leer esto
    ├── N8N_CHAT_QUICK_START.md
    ├── N8N_CHAT_WORKFLOW_EXAMPLES.md
    ├── N8N_CHAT_CONFIG_REFERENCE.md
    └── N8N_CHAT_IMPLEMENTATION.md
```

## 🎨 Cómo Se Ve

```
┌─────────────────────┐
│   Tu Aplicación     │
│                     │
│      [Contenido]    │
│                     │
│           ╔═══════╗ │
│           ║ Chat  ║ │  ← Botón flotante
│           ╚═══════╝ │  (esquina inferior derecha)
└─────────────────────┘
```

Al hacer clic:

```
┌─────────────────────┐
│   Tu Aplicación     │
│                     │
│      [Contenido]    │
│                  ╔═════════╗
│                  ║ AhorrAI  ║
│                  ║ Assistant║
│                  ║           ║
│                  ║ ¿Cómo     ║
│                  ║ ayudarte? ║
│                  ║           ║
│                  ║ [Escribe]║
│                  ╚═════════╝
└─────────────────────┘
```

## 🔧 Configuración en `.env.local`

```bash
# Reemplaza con tu webhook URL de n8n
VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/YOUR_ID
```

**Cómo obtener la URL:**
1. En n8n, crea un flujo con nodo "Chat Trigger"
2. Haz clic en Chat Trigger → Settings
3. Copia la URL completa

**Formato:**
```
https://[instancia].app.n8n.cloud/webhook/[id-único]
```

## 🌐 Funciona en Todas las Páginas

- ✅ Landing Page
- ✅ Login/Auth
- ✅ Dashboard
- ✅ Ingresos
- ✅ Gastos
- ✅ Ahorros
- ✅ Cuentas
- ✅ Categorías
- ✅ Configuración

## 💡 Ejemplos de Uso

### Flujo Simple (IA básica)

```
Chat Trigger → AI Agent (ChatGPT) → Response
```

### Flujo Avanzado (con base de datos)

```
Chat Trigger → HTTP Request (obtener datos usuario) 
            → AI Agent (responder con contexto)
            → Response
```

### Flujo con Memoria (persistencia)

```
Chat Trigger → Load Memory (historial)
            → AI Agent (procesar con contexto)
            → Save Memory (guardar conversación)
            → Response
```

## 🔐 Seguridad

- ✅ Las URLs se comunicana través de HTTPS
- ✅ CORS configurado en n8n
- ✅ Sin exposición de credenciales sensibles
- ✅ Metadata del usuario opcional

## 🧪 Verificar que Funciona

```bash
# 1. Asegúrate de que el servidor está corriendo
npm run dev

# 2. Abre http://localhost:5173

# 3. Abre DevTools (F12)

# 4. Busca en Network → POST requests a n8n

# 5. Deberías ver respuestas 200 OK
```

**En la consola**, no debería haber errores sobre:
- `VITE_N8N_WEBHOOK_URL`
- Conexión al webhook
- CORS

## ❓ Preguntas Frecuentes

**P: ¿Dónde está el botón del chat?**
R: Esquina inferior derecha de la pantalla. Es un botón redondo.

**P: ¿Funciona sin n8n?**
R: No, necesita un webhook de n8n para procesar mensajes.

**P: ¿Puedo cambiar el color?**
R: Sí, usa variables CSS. Ver `N8N_CHAT_CONFIG_REFERENCE.md`.

**P: ¿Cómo agrego IA?**
R: En n8n, agrega un nodo "AI Agent". Ver `N8N_CHAT_WORKFLOW_EXAMPLES.md`.

**P: ¿Puedo usar en producción?**
R: Sí, solo configura la URL en `.env.production`.

## 📞 Soporte

- 📖 Documentación: Ver archivos `.md` en esta carpeta
- 🌐 NPM: https://www.npmjs.com/package/@n8n/chat
- 💬 n8n Community: https://community.n8n.io
- 📚 n8n Docs: https://docs.n8n.io

## 🎓 Próximos Pasos

1. **Lee** `N8N_CHAT_SETUP.md` (documentación completa)
2. **Crea** un flujo en n8n con Chat Trigger
3. **Obtén** la URL del webhook
4. **Configura** `.env.local`
5. **Activa** el flujo en n8n
6. **Prueba** el chat en desarrollo
7. **Personaliza** (colores, mensajes, etc.)
8. **Despliega** en producción

## ✨ Características

| Característica | Estado |
|----------------|--------|
| Chat flotante | ✅ |
| Disponible en todas las páginas | ✅ |
| Sesiones persistentes | ✅ |
| Historial de chat | ✅ |
| Mensajes personalizados | ✅ |
| Estilos CSS personalizables | ✅ |
| Streaming de respuestas | ⚠️ (configurable) |
| Carga de archivos | ⚠️ (configurable) |
| Integración con IA | ✅ (en n8n) |
| Integración con APIs | ✅ (en n8n) |

## 📋 Checklist de Implementación

- [x] Paquete instalado
- [x] Componente creado
- [x] Integración en App
- [x] Variables de entorno configuradas
- [x] Documentación completa
- [ ] Flujo n8n creado
- [ ] Webhook URL configurado
- [ ] Flujo activado
- [ ] Pruebas realizadas
- [ ] Personalización aplicada
- [ ] Desplegado en producción

## 🎉 ¡Listo para Usar!

Tienes todo instalado y configurado. Solo necesitas crear un flujo en n8n y configurar la URL.

---

**Comienza leyendo**: `N8N_CHAT_SETUP.md` 📖

**Versión**: n8n/chat v0.63.0  
**Estado**: ✅ Implementado  
**Última actualización**: Octubre 2025
