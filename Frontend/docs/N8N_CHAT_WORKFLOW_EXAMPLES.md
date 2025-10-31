# Ejemplo de Flujo n8n para AhorrAI Chat

Este documento contiene ejemplos de flujos JSON que puedes importar en n8n para crear un chat inteligente para AhorrAI.

## 📋 Flujo Básico - Chat Simple

### Descripción
Flujo simple que recibe un mensaje y responde con un saludo personalizado.

### Pasos en n8n
1. Agrega un nodo **Chat Trigger**
2. Agrega un nodo **AI Agent** (ChatGPT, Claude, etc.)
3. Conecta ambos nodos
4. Activa el flujo

### Configuración del Chat Trigger
```
Name: Chat Trigger
Authentication: None (o API Key según necesites)
Allow Origins: 
  - http://localhost:5173
  - https://tudominio.com
Methods: GET, POST
```

### Configuración del AI Agent
```
Name: AI Agent
Provider: OpenAI (ChatGPT) o tu proveedor preferido
Model: gpt-4 o gpt-3.5-turbo
System Prompt: 
"Eres un asistente de finanzas personales para AhorrAI.
Tu nombre es Nathan. 
Ayuda a los usuarios con preguntas sobre:
- Gestión de gastos
- Ahorros
- Presupuestos
- Consejos financieros

Responde de forma amable y profesional."

Input Field: 
- Selecciona "Message" o la salida del Chat Trigger
```

### Conexión de Nodos
```
Chat Trigger (output) → AI Agent (input)
AI Agent (output) → Response (envía de vuelta)
```

## 🤖 Flujo Intermedio - Con Contexto de Usuario

Este flujo envía información del usuario al AI para respuestas personalizadas.

### Pasos

1. **Chat Trigger** - Recibe el mensaje del usuario
2. **Function Node** - Extrae los datos del usuario de metadata
3. **AI Agent** - Procesa con contexto del usuario
4. **Response** - Envía la respuesta

### Código del Function Node

```javascript
// Extrae y prepara datos del usuario
return {
  userId: $node["Chat Trigger"].json.metadata?.userId,
  userEmail: $node["Chat Trigger"].json.metadata?.userEmail,
  messageInput: $node["Chat Trigger"].json.chatInput,
  context: `
    Usuario: ${$node["Chat Trigger"].json.metadata?.userEmail}
    Fecha: ${new Date().toLocaleDateString('es-ES')}
  `
};
```

### Prompt del AI Agent

```
Eres un asistente financiero para la app AhorrAI.
Contexto del usuario:
${function_node.context}

El usuario pregunta: ${function_node.messageInput}

Responde de forma amable y personalizada.
```

## 💰 Flujo Avanzado - Con Integración a Base de Datos

Este flujo obtiene datos reales del usuario desde la base de datos.

### Pasos

1. **Chat Trigger** - Recibe mensaje y userId
2. **HTTP Request** - Consulta la API de AhorrAI
   ```
   GET: https://tubackend.com/api/users/{userId}/summary
   Headers: Authorization: Bearer ${token}
   ```
3. **AI Agent** - Procesa con datos reales del usuario
4. **Response** - Envía respuesta personalizada

### Ejemplo de Respuesta HTTP

```json
{
  "userId": "user-123",
  "balance": 5000,
  "monthlyIncome": 3000,
  "monthlyExpenses": 2000,
  "savings": 500,
  "savingsGoal": 10000
}
```

### Prompt del AI Agent

```
Eres un asesor financiero inteligente para AhorrAI.

Información actual del usuario:
- Saldo: $${http_node.json.balance}
- Ingresos mensuales: $${http_node.json.monthlyIncome}
- Gastos mensuales: $${http_node.json.monthlyExpenses}
- Ahorros: $${http_node.json.savings}
- Meta de ahorro: $${http_node.json.savingsGoal}

El usuario pregunta: ${chat_trigger.json.chatInput}

Proporciona asesoramiento personalizado basado en sus datos financieros reales.
```

## 🧠 Flujo con Memoria - Persistencia de Sesión

Para mantener contexto entre mensajes, usa un Memory node.

### Pasos

1. **Chat Trigger** - Recibe mensaje
2. **AI Memory** - Carga historial de sesión
3. **AI Agent** - Procesa con contexto
4. **AI Memory** (update) - Guarda la nueva conversación
5. **Response** - Envía respuesta

### Configuración del AI Memory Node

```
Session ID: ${chat_trigger.json.sessionId}
Key: chatHistory
Return: Last 10 messages
```

## 📧 Flujo con Notificación - Enviar Email

Si el usuario solicita ayuda, envía un email a soporte.

### Pasos

1. **Chat Trigger**
2. **Condition Node** - ¿El usuario pidió soporte?
   ```
   IF message contains "hablar con" OR "soporte" OR "ayuda"
   ```
3. **Si VERDADERO**:
   - Send Email
   - Include user info and message
4. **AI Agent** - Responde siempre

### Configuración Email

```
To: soporte@ahorrai.com
Subject: Solicitud de ayuda del usuario - ${userId}
Body:
Nombre: ${userEmail}
Mensaje: ${chatInput}
Hora: ${new Date().toLocaleString('es-ES')}
```

## 🔄 Flujo de Streaming (Respuestas en Tiempo Real)

Para respuestas progresivas (ideal para LLMs lentos).

### En n8n:
1. Chat Trigger → Response Mode: **Streaming Response**
2. AI Agent → (procesa normalmente)
3. El cliente recibe respuesta por partes

### Configuración en Frontend

En `N8nChatWidget.tsx`, habilita streaming:

```typescript
enableStreaming: true,  // Cambiar a true
```

## ✅ Checklist Antes de Activar

- [ ] Nodo "Chat Trigger" configurado
- [ ] Allowed Origins incluye tu dominio
- [ ] Credenciales de OpenAI/Claude configuradas (si usas AI Agent)
- [ ] Todos los nodos están conectados correctamente
- [ ] El flujo tiene una salida de respuesta
- [ ] Prueba manual: Haz clic en "Test" en n8n
- [ ] Flujo está en estado **Activated**
- [ ] Copia la URL del webhook a `.env.local`

## 🧪 Pruebas

### En n8n

1. Haz clic en cualquier nodo
2. Click en **Test** (o "Test workflow")
3. Proporciona entrada de ejemplo:
   ```json
   {
     "action": "sendMessage",
     "chatInput": "Hola, ¿cuál es mi saldo?",
     "sessionId": "test-session-123"
   }
   ```
4. Verifica que fluya correctamente por los nodos
5. Comprueba el output final

### En el Frontend

1. Abre DevTools (F12) → Console
2. Abre la aplicación
3. Haz clic en el botón del chat
4. Envía un mensaje de prueba
5. Verifica en Network que POST llegue a n8n
6. Espera la respuesta del webhook
7. Verifica que el mensaje aparezca en el chat

## 🎓 Recursos

- [Documentación Chat Trigger n8n](https://docs.n8n.io)
- [OpenAI Node](https://docs.n8n.io/nodes/n8n-nodes-base.openai/)
- [AI Agent Node](https://docs.n8n.io/nodes/n8n-nodes-base.aiagent/)
- [Memory Node](https://docs.n8n.io/nodes/n8n-nodes-base.memory/)

---

**¡Elige el flujo que mejor se adapte a tus necesidades!** 🚀
