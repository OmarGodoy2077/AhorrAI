# 🤖 Chat Inteligente AhorraAI - Guía de Integración

> **Cómo agregar contexto financiero personalizado del usuario a tu chat de n8n**

---

## 📋 Tabla de Contenidos

1. [¿Qué vamos a lograr?](#-qué-vamos-a-lograr)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Paso 1: Backend](#-paso-1-backend-ya-está-listo)
4. [Paso 2: Configurar n8n](#-paso-2-configurar-n8n)
5. [Paso 3: Probar](#-paso-3-probar-todo)
6. [Ejemplos de Conversaciones](#-ejemplos-de-conversaciones)
7. [Troubleshooting](#-troubleshooting)

---

## 🎯 ¿Qué vamos a lograr?

Tu chat de n8n podrá dar **respuestas personalizadas** combinando DOS fuentes de información:

### 📚 Fuente 1: Pinecone (RAG) - Documentación General
- Información sobre finanzas personales
- Consejos generales de ahorro
- Guías sobre inversión, créditos, préstamos

### 💰 Fuente 2: API Backend - Datos REALES del Usuario
- ✅ Ingresos mensuales (confirmados)
- ✅ Gastos mensuales (necesarios e innecesarios)
- ✅ Balance total en cuentas
- ✅ Metas de ahorro (mensuales, globales, personalizadas)
- ✅ Promedios históricos (últimos 3 meses)
- ✅ Métricas de salud financiera

### 💡 Ejemplo Comparativo

**SIN contexto financiero:**
> **Usuario:** "¿Puedo comprar un carro?"  
> **Chat:** "Depende de tu presupuesto. Asegúrate de tener ahorros suficientes..."

**CON contexto financiero:**
> **Usuario:** "¿Puedo comprar un carro?"  
> **Chat:** "Analicemos tu situación: Ganas **$1,500/mes**, gastas **$100/mes**, tienes **$15,000 ahorrados** y tu tasa de ahorro es **93.3%**.
> 
> ✅ SÍ puedes! Un auto usado de **$7,000-8,000** sería ideal. Lo recuperarías en **5-6 meses** con tu capacidad de ahorro actual. Mantendrías intacto tu fondo de emergencia de **150 meses**.
>
> Tus gastos innecesarios son solo 10% del total, lo cual demuestra excelente disciplina financiera. 💪"

---

## 🏗️ Arquitectura del Sistema

El flujo de información funciona así:

```
┌──────────────────────────────────────────────────┐
│           USUARIO pregunta algo                  │
│       "¿Puedo comprar un carro?"                 │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│              N8N WORKFLOW                        │
│                                                  │
│  1️⃣ When Chat Message Received                  │
│     ↓                                            │
│     ├────────────┬─────────────────────┐        │
│     ▼            ▼                     ▼        │
│  2️⃣ HTTP Request  3️⃣ Pinecone         │        │
│     GET /user-      Busca docs         │        │
│     summary?        relevantes         │        │
│     userId=1                           │        │
│     │              │                   │        │
│     └──────┬───────┘                   │        │
│            ▼                           │        │
│  4️⃣ Code Node (Combinar ambas fuentes)│        │
│            │                           │        │
│            ▼                           │        │
│  5️⃣ AI Agent (Google Gemini)          │        │
│     Con AMBOS contextos                │        │
│            │                           │        │
│            ▼                           │        │
│  6️⃣ Respond to Webhook                 │        │
└─────────────┬────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│         BACKEND API (Node.js)                    │
│  GET /api/chat-context/user-summary?userId=1     │
│                                                  │
│  Consulta Base de Datos y retorna:              │
│  • Ingresos y gastos del mes                     │
│  • Balance de cuentas                            │
│  • Metas de ahorro                               │
│  • Historial y métricas                          │
└──────────────────────────────────────────────────┘
```

**Puntos clave:**
- ✅ n8n hace **dos llamadas en paralelo**: API y Pinecone
- ✅ Combina ambas respuestas en un solo prompt
- ✅ El AI Agent genera respuesta usando **ambos contextos**

---

## 📦 Paso 1: Backend (Ya está listo)

### ✅ Archivos Creados

Los siguientes archivos ya están en tu proyecto:

1. **`Backend/src/controllers/chatContextController.js`**  
   Controlador que genera el resumen financiero

2. **`Backend/src/routes/chatContext.js`**  
   Define la ruta `/api/chat-context/user-summary`

3. **`Backend/src/routes/index.js`** (modificado)  
   Registra las rutas del chat context

### 🔌 Endpoint Disponible

```http
GET /api/chat-context/user-summary?userId=1
```

**Parámetros:**
- `userId` (query param, requerido): ID del usuario

**Sin autenticación JWT** (para facilitar desarrollo y pruebas)

### 📊 Respuesta del Endpoint

El endpoint retorna un JSON con:

1. **`context`**: Datos estructurados (números, porcentajes, objetos)
2. **`text_summary`**: Resumen en texto legible para el AI

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "user_id": "1",
  "generated_at": "2025-11-01T10:30:00.000Z",
  "context": {
    "current_month": {
      "income": 1500.00,
      "expenses": 100.00,
      "net_savings": 1400.00,
      "savings_rate": "93.3"
    },
    "total_balance": 15000.00,
    "financial_health": {
      "expense_to_income_ratio": "6.7",
      "emergency_fund_months": "125.0"
    }
  },
  "text_summary": "📊 SITUACIÓN ACTUAL...\n- Ingresos: $1500\n- Gastos: $100\n..."
}
```

### 🧪 Probar el Endpoint

Antes de configurar n8n, verifica que funcione:

```bash
# En tu navegador o Postman
http://localhost:3001/api/chat-context/user-summary?userId=1
```

⚠️ **Importante**: Cambia `userId=1` por tu ID real.

**¿Cómo obtener tu userId?**
```javascript
// En la consola del navegador (estando logueado en AhorraAI)
localStorage.getItem('userId')
// Resultado: "1" (o tu número de usuario)
```

---

## ⚙️ Paso 2: Configurar n8n

### 📋 Estructura del Flujo

Tu flujo tendrá 6 nodos:

```
When Chat Message → HTTP Request ┐
                  → Pinecone      ├→ Code → AI Agent → Respond
```

### 1️⃣ Nodo: When Chat Message Received

Este nodo ya lo tienes. No necesitas cambiarlo.

### 2️⃣ Nodo: HTTP Request - Obtener Contexto Financiero

**Agregar NUEVO nodo después del trigger**

**Configuración:**
- **Nombre:** `Obtener Contexto Financiero`
- **Tipo:** HTTP Request
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/chat-context/user-summary?userId=1`
- **Authentication:** None
- **Headers:** Ninguno
- **Response Format:** JSON
- **Full Response:** OFF

⚠️ **IMPORTANTE:**
- Reemplaza `localhost:3001` con la URL de tu backend
- Reemplaza `userId=1` con tu ID real
- Para desarrollo, puedes hardcodear el userId

### 3️⃣ Nodo: Pinecone Vector Store

Este nodo ya lo tienes configurado. Déjalo como está.

**Query:** `={{ $json.chatInput }}`

### 4️⃣ Nodo: Code - Combinar Ambas Fuentes

**Agregar NUEVO nodo que reciba datos de ambos nodos anteriores**

Este es el nodo MÁS IMPORTANTE. Combina las dos fuentes de información.

**Configuración:**
- **Tipo:** Code
- **Nombre:** `Combinar Contexto`

**Código JavaScript:**

```javascript
// 🎯 Combina AMBAS fuentes en un solo prompt enriquecido

// 1. Obtener mensaje del usuario
const userMessage = $input.first().json.chatInput;

// 2. Obtener contexto financiero (del HTTP Request)
const financialContext = $('Obtener Contexto Financiero').first().json;

// 3. Obtener documentación relevante (de Pinecone)
const ragResults = $('Pinecone Vector Store').all();

// 4. Crear prompt enriquecido
const systemPrompt = `Eres un asistente financiero experto de AhorraAI.

📊 CONTEXTO FINANCIERO DEL USUARIO:
${financialContext.text_summary}

📚 DOCUMENTACIÓN RELEVANTE:
${ragResults.map((doc, i) => `[Doc ${i+1}] ${doc.json.pageContent || doc.json.content}`).join('\n\n')}

📋 INSTRUCCIONES:
1. Usa AMBOS contextos para dar una respuesta personalizada
2. Menciona números específicos de la situación del usuario
3. Si pregunta sobre una compra, evalúa:
   - Balance disponible: $${financialContext.context.total_balance.toFixed(2)}
   - Ahorro mensual: $${financialContext.context.current_month.net_savings.toFixed(2)}
   - Fondo emergencia: ${financialContext.context.financial_health.emergency_fund_months} meses
4. Sé empático y usa emojis 😊
5. Combina teoría (documentación) con práctica (su situación real)

💬 PREGUNTA: ${userMessage}`;

return {
  json: {
    systemPrompt: systemPrompt,
    userMessage: userMessage
  }
};
```

**¿Qué hace este código?**
- Toma las DOS fuentes de información
- Las combina en un solo prompt rico en contexto
- El AI Agent recibirá TODO el contexto necesario

### 5️⃣ Nodo: AI Agent

**Configuración:**
- **Model:** Google Gemini Chat Model (o el que uses)
- **System Message:** `={{ $json.systemPrompt }}`
- **User Message:** `={{ $json.userMessage }}`
- **Temperature:** `0.7`
- **Max Tokens:** `800`

### 6️⃣ Nodo: Respond to Webhook

**Configuración:**
- **Response Body:** `={{ $json.output }}`

---

## 🎯 Paso 3: Probar Todo

### Checklist de Verificación

#### 1. Backend Corriendo
```bash
cd Backend
npm run dev
# Debe estar corriendo en http://localhost:3001
```

#### 2. Obtener User ID
```javascript
// En consola del navegador (logueado en AhorraAI)
localStorage.getItem('userId')
```

#### 3. Probar Endpoint Directamente
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/chat-context/user-summary?userId=1"

# O en el navegador
http://localhost:3001/api/chat-context/user-summary?userId=1
```

#### 4. Actualizar URL en n8n
En el nodo HTTP Request, actualiza:
```
URL: http://localhost:3001/api/chat-context/user-summary?userId=TU_ID_AQUI
```

#### 5. Ejecutar Workflow
1. En n8n: Click en "Execute Workflow"
2. Abre el chat en tu aplicación
3. Escribe una pregunta:
   - "¿Cuánto ahorro al mes?"
   - "¿Puedo comprar un laptop de $1,500?"
   - "¿Cómo está mi salud financiera?"

#### 6. Verificar Respuesta

La respuesta debe incluir:
- ✅ Números específicos (TUS ingresos, gastos, balance)
- ✅ Análisis personalizado
- ✅ Información de documentación (RAG)
- ✅ Recomendaciones basadas en TU situación

---

## 💬 Ejemplos de Conversaciones

### Ejemplo 1: Pregunta sobre Compra Grande

**Usuario:**
> "¿Puedo comprar un carro de $10,000?"

**Chat CON contexto:**
> "¡Hola! Analicemos tu situación 📊
> 
> Tienes un balance de **$15,000** y ahorras **$1,400/mes** (93.3% de tus ingresos).
> 
> ✅ SÍ puedes comprar el carro, PERO:
> - Un auto de $10K dejaría solo $5,000 de emergencia
> - Recomiendo uno de **$7,000-8,000** máximo
> - Lo recuperarías en 5-6 meses con tu capacidad de ahorro
> 
> Tu fondo de emergencia actual cubre 125 meses de gastos, lo cual es excelente 💪
> 
> ⚠️ Considera costos adicionales:
> - Seguro: ~$50-100/mes
> - Gasolina: ~$80-150/mes
> - Mantenimiento: ~$50/mes
> 
> ¿Quieres que analicemos el impacto total en tu presupuesto?"

### Ejemplo 2: Pregunta sobre Ahorros

**Usuario:**
> "¿Cómo puedo ahorrar más?"

**Chat CON contexto:**
> "¡Tu situación es envidiable! 🌟
> 
> Actualmente ahorras **$1,400/mes** (93.3% de tus ingresos). Esto es EXCEPCIONAL.
> 
> 📊 Análisis:
> - Ingresos: $1,500/mes ✅
> - Gastos: $100/mes ✅
> - Gastos innecesarios: Solo $10 (10% del total) 👏
> 
> **Oportunidades de mejora:**
> 1. ✅ Ya estás haciendo TODO excelente
> 2. 💡 Podrías buscar aumentar ingresos (freelance, side hustle)
> 3. 📈 Cada $100 extra = $1,200/año más de ahorro
> 
> 🎯 Tus Metas:
> - Meta mensual: ✅ SUPERADA (140%)
> - Meta global: 30% completado ($15K de $50K)
> - Comprar Auto: 16.7% completado
> 
> Estás en camino correcto. ¡Sigue así! 🚀"

### Ejemplo 3: Consulta General

**Usuario:**
> "¿Cuánto gano y gasto al mes?"

**Chat CON contexto:**
> "📊 Aquí está tu resumen financiero actual:
> 
> **Ingresos del mes (Noviembre 2025):**
> - Total: **$1,500.00**
> - Confirmados y recibidos ✅
> 
> **Gastos del mes:**
> - Total: **$100.00**
> - Necesarios: $90.00 (90%)
> - Innecesarios: $10.00 (10%)
> 
> **Balance:**
> - Ahorro neto: **$1,400.00**
> - Tasa de ahorro: **93.3%** 🎯
> 
> ¡Tienes un control financiero excepcional! Tu ratio de gastos/ingresos es solo 6.7%, muy por debajo del recomendado (50-70%).
> 
> ¿Quieres analizar algo específico de tus finanzas?"

---

## 🐛 Troubleshooting

### Problema: "user_id es requerido"

**Causa:** La URL no tiene el parámetro userId

**Solución:**
- Verifica la URL: `?userId=1`
- Usa tu ID real de usuario

### Problema: Respuesta genérica (sin números específicos)

**Causa:** El nodo Code no está recibiendo datos correctamente

**Solución:**
1. Inspecciona la salida del nodo HTTP Request (debe tener `context` y `text_summary`)
2. Inspecciona la salida del nodo Code (debe tener `systemPrompt` largo)
3. Verifica que el AI Agent use `{{ $json.systemPrompt }}`

### Problema: Error en HTTP Request (ECONNREFUSED)

**Causa:** Backend no está corriendo o URL incorrecta

**Solución:**
```bash
# Verifica que el backend esté corriendo
cd Backend
npm run dev

# Prueba el endpoint manualmente
curl "http://localhost:3001/api/chat-context/user-summary?userId=1"
```

### Problema: Datos en 0 o vacíos

**Causa:** El usuario no tiene datos registrados

**Solución:**
1. Completa el onboarding en la aplicación
2. Agrega al menos 1 ingreso confirmado
3. Agrega al menos 1 gasto
4. Vuelve a probar el endpoint

### Problema: El nodo Code falla

**Causa:** Sintaxis incorrecta o referencias a nodos mal nombrados

**Solución:**
- Asegúrate que el nombre del nodo HTTP Request sea exactamente: `Obtener Contexto Financiero`
- Asegúrate que el nombre del nodo Pinecone sea exactamente: `Pinecone Vector Store`
- O ajusta los nombres en el código: `$('Nombre Exacto Del Nodo')`

---

## 📊 Resumen Final

### Lo que implementaste:

1. ✅ **Backend:** Endpoint que retorna resumen financiero del usuario
2. ✅ **n8n:** Flujo que combina contexto financiero + documentación RAG
3. ✅ **AI Agent:** Recibe AMBOS contextos para respuestas personalizadas

### Resultado:

Un chat que da respuestas **personalizadas** y **contextualizadas** usando:
- 📚 Documentación general (Pinecone RAG)
- 💰 Datos reales del usuario (API Backend)

### Flujo Completo:

```
Usuario pregunta
    ↓
n8n obtiene contexto financiero (API) + documentación (Pinecone)
    ↓
Combina ambos en un prompt enriquecido
    ↓
AI Agent genera respuesta personalizada
    ↓
Usuario recibe respuesta con SUS datos reales
```

---

## 🚀 Próximos Pasos (Opcional)

Para mejorar aún más:

- 🔒 **Producción:** Agregar autenticación JWT
- ⚡ **Performance:** Cachear contexto financiero (5-10 min)
- 🎨 **Prompts:** Refinar instrucciones del AI Agent
- 📱 **Métricas:** Agregar más indicadores financieros
- 🔄 **Dinámico:** Obtener userId automáticamente del chat

---

## 📚 Archivos de Referencia

- **Workflow JSON:** `n8n-workflow-simple.json` (importar en n8n)
- **Guía Rápida:** `N8N_CHAT_SIMPLE_SETUP.md`
- **Controlador Backend:** `Backend/src/controllers/chatContextController.js`
- **Ruta Backend:** `Backend/src/routes/chatContext.js`

---

**¿Listo para probarlo? 🚀**

Si tienes problemas, revisa la sección de [Troubleshooting](#-troubleshooting) o verifica cada paso cuidadosamente.
