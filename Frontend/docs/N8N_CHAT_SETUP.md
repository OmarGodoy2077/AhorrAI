# n8n Chat Widget - Documentación de Implementación

## Descripción General

El widget de chat n8n ha sido integrado en AhorrAI como un chat flotante que aparece en todas las páginas de la aplicación. El widget se comunica con un flujo de n8n mediante un webhook para procesar mensajes y proporcionar respuestas automáticas.

## 📋 Arquitectura de Implementación

### Componentes Principales

#### 1. **N8nChatWidget.tsx** (`src/components/N8nChatWidget.tsx`)
- Componente React que inicializa y configura el widget de chat n8n
- Se ejecuta en el cliente (Frontend)
- Gestiona la comunicación con el webhook de n8n
- Maneja el ciclo de vida del chat (inicialización, sesiones, etc.)

#### 2. **App.tsx** (`src/App.tsx`)
- Integración del componente `N8nChatWidget`
- Se renderiza al nivel superior de la aplicación
- Disponible en todas las rutas y páginas

#### 3. **Variables de Entorno** (`.env.local`)
- Contiene la URL del webhook de n8n
- Configurable por entorno

## 🔧 Características del Widget

### Configuración Actual

```typescript
createChat({
  webhookUrl: webhookUrl,
  webhookConfig: {
    method: 'POST',
    headers: {}
  },
  target: '#n8n-chat',
  mode: 'window',                    // Chat flotante (no fullscreen)
  showWelcomeScreen: true,           // Muestra pantalla de bienvenida
  chatInputKey: 'chatInput',         // Clave para el input en n8n
  chatSessionKey: 'sessionId',       // Clave para sesiones en n8n
  loadPreviousSession: true,         // Carga historial anterior
  defaultLanguage: 'en',
  initialMessages: [                 // Mensajes iniciales
    'Hola! 👋',
    'Soy tu asistente virtual de AhorrAI. ¿Cómo puedo ayudarte a optimizar tus finanzas?'
  ],
  enableStreaming: false,            // Desactivado (requiere config en n8n)
  allowFileUploads: false,           // Sin subida de archivos
});
```

### Modo de Operación

- **Modo**: `window` (ventana flotante)
- **Ubicación**: Esquina inferior derecha de la pantalla
- **Comportamiento**: 
  - Botón flotante cerrado por defecto
  - Se expande cuando el usuario hace clic
  - Persiste en todas las páginas
  - Mantiene sesión entre navegación

## 🌐 Cómo Funciona

### Flujo de Comunicación

```
Usuario escribe mensaje en el chat
         ↓
Browser envía POST a n8n Webhook
         ↓
n8n procesa el mensaje (AI Agent, Logic, etc.)
         ↓
n8n retorna respuesta
         ↓
Widget muestra respuesta en el chat
```

### Acciones Soportadas

El webhook n8n recibe un parámetro `action` que puede ser:

1. **`sendMessage`** - Cuando el usuario envía un mensaje
   - Body: `{ chatInput: "mensaje del usuario", sessionId: "..." }`

2. **`loadPreviousSession`** - Cuando se abre el chat nuevamente
   - Carga el historial de conversaciones anterior

## ⚙️ Configuración del Webhook en n8n

### Requisitos Previos

1. Cuenta activa en n8n (https://app.n8n.cloud)
2. Flujo creado con un nodo "Chat Trigger"
3. El flujo debe estar **activado**

### Pasos de Configuración en n8n

#### 1. Crear o Abrir un Flujo

- Accede a tu espacio de trabajo en n8n
- Crea un nuevo flujo o abre uno existente

#### 2. Agregar un Nodo "Chat Trigger"

- Busca y agrega el nodo **"Chat Trigger"** al flujo
- Este nodo es obligatorio para la comunicación con el widget

#### 3. Configurar el Chat Trigger

En la configuración del nodo, debes:

```
Authentication Method: APIKey o None (según tu configuración)
Allow Origins (CORS): 
  - http://localhost:5173 (desarrollo)
  - https://tudominio.com (producción)
  - https://www.tudominio.com

Methods:
  ✓ GET
  ✓ POST
```

#### 4. Configurar el Flujo de Lógica

Agrega nodos para procesar el mensaje:
- **AI Agents** para respuestas inteligentes
- **HTTP Requests** para consultar APIs
- **Memory nodes** para mantener contexto
- **LLM Nodes** para procesamiento de lenguaje

#### 5. Obtener la URL del Webhook

En el nodo "Chat Trigger":
- Copia la URL del webhook completa
- Formato: `https://yourname.app.n8n.cloud/webhook/513107b3-6f3a-4a1e-af21-659f0ed14183`

## 🔑 Configuración de Credenciales

### Variables de Entorno

#### `.env.local` (Desarrollo)

```bash
# URL del webhook n8n completa
VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID
```

#### `.env.production` (Producción)

```bash
# Asegúrate de usar la misma URL del webhook
VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID
```

### Ejemplo de Configuración Paso a Paso

1. **Abre n8n** → Tu instancia en https://app.n8n.cloud

2. **Crea un flujo con Chat Trigger**
   ```
   [Chat Trigger] → [AI Agent] → [Response]
   ```

3. **Copia la URL del webhook**
   - Haz clic en el nodo "Chat Trigger"
   - Ve a la pestaña "Settings"
   - Copia la URL completa

4. **Configura el archivo `.env.local`**
   ```bash
   VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/513107b3-6f3a-4a1e-af21-659f0ed14183
   ```

5. **Reinicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Prueba el chat**
   - Abre la aplicación en el navegador
   - Busca el botón flotante del chat en la esquina inferior derecha
   - Escribe un mensaje para probar

## 🎨 Personalización del Widget

El widget es totalmente personalizable mediante variables CSS. Edita `N8nChatWidget.tsx` o crea estilos globales:

```css
:root {
  /* Colores */
  --chat--color--primary: #e74266;
  --chat--color--secondary: #20b69e;
  --chat--color-white: #ffffff;
  --chat--color-dark: #101330;
  
  /* Dimensiones */
  --chat--window--width: 400px;
  --chat--window--height: 600px;
  
  /* Botón flotante */
  --chat--toggle--size: 64px;
  --chat--toggle--background: var(--chat--color--primary);
  
  /* Mensajes */
  --chat--message--bot--background: var(--chat--color-white);
  --chat--message--user--background: var(--chat--color--secondary);
}
```

## 📍 Ubicación de Archivos

```
Frontend/
├── src/
│   ├── components/
│   │   └── N8nChatWidget.tsx          ← Componente principal del chat
│   └── App.tsx                        ← Integración del widget
├── .env.local                         ← Configuración de credenciales
└── package.json                       ← Contiene @n8n/chat
```

## 🚀 Instalación y Deployment

### Desarrollo Local

1. **Instalar dependencias**
   ```bash
   cd Frontend
   npm install
   ```

2. **Configurar `.env.local`**
   - Copia tu webhook URL de n8n
   - Actualiza `VITE_N8N_WEBHOOK_URL`

3. **Ejecutar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Verificar el chat**
   - Accede a `http://localhost:5173`
   - El chat debe aparecer en la esquina inferior derecha

### Producción

1. **Actualizar `.env.production`**
   ```bash
   VITE_N8N_WEBHOOK_URL=https://yourname.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy**
   - Despliega los archivos generados en `dist/`
   - Asegúrate de que las variables de entorno estén configuradas

## 🔒 Seguridad y CORS

### Configuración de CORS en n8n

En el nodo "Chat Trigger" de tu flujo n8n, configura los orígenes permitidos:

**Desarrollo:**
- `http://localhost:5173`
- `http://localhost:3000`

**Producción:**
- `https://tudominio.com`
- `https://www.tudominio.com`
- `https://app.tudominio.com`

### Headers de Seguridad

Puedes agregar headers personalizados en la configuración:

```typescript
webhookConfig: {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN', // Si lo necesitas
    'Content-Type': 'application/json'
  }
}
```

## 🧪 Pruebas

### Checklist de Verificación

- [ ] El paquete `@n8n/chat` está instalado
- [ ] El archivo `.env.local` contiene la URL del webhook
- [ ] El flujo en n8n está activado
- [ ] El nodo "Chat Trigger" está configurado correctamente
- [ ] Los orígenes (CORS) están permitidos en n8n
- [ ] El chat aparece en todas las páginas
- [ ] Al hacer clic en el botón, se abre el chat
- [ ] Es posible enviar mensajes
- [ ] Las respuestas aparecen en el chat

### Solución de Problemas

| Problema | Solución |
|----------|----------|
| El chat no aparece | Verifica que `VITE_N8N_WEBHOOK_URL` esté configurado |
| Error en consola del navegador | Abre DevTools (F12) y revisa la pestaña "Console" |
| El webhook retorna 403 | Verifica CORS en n8n → Chat Trigger → Settings |
| El webhook retorna 404 | Verifica que la URL del webhook sea correcta |
| El chat no envía mensajes | Asegúrate de que el flujo n8n está **activado** |
| Las respuestas son lentas | Revisa la lógica del flujo en n8n |

## 📚 Recursos Adicionales

- **Documentación Oficial**: https://www.npmjs.com/package/@n8n/chat
- **n8n Dashboard**: https://app.n8n.cloud
- **Ejemplos de Flujos**: https://github.com/n8n-io/n8n/tree/master/packages/%40n8n/chat/resources
- **Documentación n8n**: https://docs.n8n.io

## 🎯 Próximos Pasos

1. **Crear un flujo de n8n** con Chat Trigger
2. **Configurar el webhook URL** en `.env.local`
3. **Agregar lógica** de IA o integraciones en n8n
4. **Probar** el widget en desarrollo
5. **Customizar** el aspecto y comportamiento del chat
6. **Desplegar** en producción

---

**Última actualización**: Octubre 2025
**Versión de n8n Chat**: 0.63.0
**Estado**: ✅ Implementado y configurado
