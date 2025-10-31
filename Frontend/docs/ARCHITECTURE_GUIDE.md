# 🏗️ ARQUITECTURA Y FLUJO DE LA APLICACIÓN

## Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                     NAVEGADOR                              │
│              (http://localhost:5173)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  React App (App.tsx)                               │  │
│  │  ├── CurrencyProvider                              │  │
│  │  │   └── Carga configuración financiera            │  │
│  │  ├── N8nChatWidget                                 │  │
│  │  │   └── Inicializa chat                           │  │
│  │  └── Rutas                                         │  │
│  │      └── Dashboard, Gastos, Ingresos, etc.       │  │
│  └─────────────────────────────────────────────────────┘  │
│           │                            │                   │
│           ▼                            ▼                   │
│  ┌──────────────────────┐    ┌─────────────────────┐    │
│  │ localStorage         │    │ sessionStorage      │    │
│  │ - token              │    │ - sessionId         │    │
│  │ - user               │    │                     │    │
│  └──────────────────────┘    └─────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
    ┌────────────────────┐       ┌──────────────────────┐
    │   BACKEND API      │       │   N8N WEBHOOK       │
    │ (:3000)            │       │   (Cloud hosted)    │
    │                    │       │                      │
    │ Routes:            │       │ Chat Trigger:        │
    │ ✓ /auth            │       │ ✓ Recibe mensajes   │
    │ ✓ /api/profile     │       │ ✓ Procesa con AI    │
    │ ✓ /api/accounts    │       │ ✓ Retorna respuesta │
    │ ✓ /api/expenses    │       │                      │
    │ ✓ /api/incomes     │       │ Allow Origins:       │
    │ ✓ /api/financial.. │       │ ✓ localhost:5173     │
    └────────────────────┘       │ ✓ tudominio.com      │
         │                        └──────────────────────┘
         ▼
    ┌──────────────┐
    │  SUPABASE    │
    │  (Database)  │
    │              │
    │ Tables:      │
    │ - users      │
    │ - accounts   │
    │ - expenses   │
    │ - incomes    │
    │ - settings   │
    └──────────────┘
```

---

## Flujo de Datos: Carga Inicial

```
1. Usuario abre http://localhost:5173
   │
   ▼
2. React renderiza <App />
   │
   ▼
3. CurrencyProvider inicializa
   │
   ├─ currencyService.getAll()
   │  └─ GET /api/currencies
   │     └─ SUPABASE retorna lista de monedas
   │
   └─ financialSettingService.getCurrent()
      └─ GET /api/financial-settings/current
         └─ SUPABASE retorna configuración del usuario
            (o 404 si no existe, y cae a fallback)
   
   ▼
4. N8nChatWidget inicializa
   │
   ├─ Valida VITE_N8N_WEBHOOK_URL
   │
   ├─ Llama createChat() con configuración
   │
   └─ Crea widget en #n8n-chat (esquina inferior derecha)

   ▼
5. App completamente cargada ✅
```

---

## Flujo de Datos: Usuario Escribe en Chat

```
1. Usuario escribe en el chat N8N
   ├─ Mensaje: "¿Cuál es mi saldo?"
   
   ▼
2. N8N Chat Widget intercepta el submit
   
   ▼
3. Frontend envía POST directamente a N8N webhook
   ├─ URL: https://primary-production-f465.up.railway.app/webhook/...
   ├─ Body: { chatInput: "¿Cuál es mi saldo?", sessionId: "..." }
   ├─ Headers: { "Content-Type": "application/json" }
   
   ▼
4. N8N procesa el mensaje
   ├─ Chat Trigger recibe el mensaje
   ├─ AI Agent procesa con ChatGPT/Claude
   ├─ Optional: HTTP Request a Backend API (si lo configuraste)
   └─ Retorna respuesta JSON
   
   ▼
5. Frontend recibe respuesta
   ├─ Status: 200 OK ✅ (o error)
   ├─ Body: { output: "Tu saldo es $5,000" }
   
   ▼
6. Chat widget muestra la respuesta
   └─ Usuario ve: "Tu saldo es $5,000" 💬
```

---

## Estructura de Carpetas: Frontend

```
Frontend/
├── public/                          # Assets estáticos
│   ├── favicon.ico
│   └── ...
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # App principal
│   ├── App.css
│   ├── index.css
│   │
│   ├── components/                 # Componentes React
│   │   ├── N8nChatWidget.tsx       # 🔴 Chat N8N
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   │
│   ├── context/                    # Context API
│   │   ├── CurrencyContext.tsx     # 🔴 Monedas
│   │   ├── AuthContext.tsx
│   │   └── ...
│   │
│   ├── pages/                      # Páginas (rutas)
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Expenses.tsx
│   │   └── ...
│   │
│   ├── services/                   # Servicios API
│   │   ├── api.ts                  # 🔴 Cliente Axios
│   │   ├── financialSettingService.ts
│   │   ├── currencyService.ts
│   │   ├── expenseService.ts
│   │   └── ...
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.ts
│   │   └── ...
│   │
│   ├── types/                      # TypeScript types
│   │   ├── index.ts
│   │   └── ...
│   │
│   ├── lib/                        # Utilidades
│   │   ├── utils.ts
│   │   └── ...
│   │
│   └── assets/                     # Imágenes, etc.
│
├── .env.local                      # 🔴 Variables de entorno
├── .env.example                    # Plantilla
├── package.json
├── vite.config.ts                  # 🔴 Configuración Vite
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── index.html
│
└── docs/                           # 📚 Documentación
    ├── QUICK_START_GUIDE.md        # 🔴 Esta guía
    ├── TROUBLESHOOTING_AND_FIXES.md
    ├── N8N_CHAT_FIX_SUMMARY.md
    ├── N8N_CHAT_SETUP.md
    ├── API_INTEGRATION.md
    ├── COMPONENTS.md
    ├── PAGES_COMPLETE.md
    └── ...

```

---

## Estructura de Carpetas: Backend

```
Backend/
├── src/
│   ├── index.js                    # Express app entry point
│   │
│   ├── config/                     # Configuración
│   │   ├── database.js             # Supabase connection
│   │   ├── auth.js
│   │   └── ...
│   │
│   ├── controllers/                # Lógica de negocio
│   │   ├── financialSettingController.js
│   │   ├── currencyController.js
│   │   ├── expenseController.js
│   │   └── ...
│   │
│   ├── routes/                     # Rutas Express
│   │   ├── index.js                # Router principal
│   │   ├── financialSetting.js     # 🔴 /financial-settings
│   │   ├── currency.js             # 🔴 /currencies
│   │   ├── expense.js
│   │   └── ...
│   │
│   ├── middleware/                 # Middleware
│   │   ├── auth.js                 # 🔴 JWT verification
│   │   ├── error.js
│   │   ├── validation.js
│   │   └── ...
│   │
│   ├── models/                     # Modelos (queries DB)
│   │   ├── FinancialSetting.js     # 🔴 DB queries
│   │   ├── Currency.js             # 🔴 DB queries
│   │   └── ...
│   │
│   └── utils/                      # Utilidades
│       └── ...
│
├── database/
│   ├── schema.sql                  # Esquema de BD
│   └── migrations/                 # Cambios DDL
│       ├── 001_...sql
│       ├── 002_...sql
│       └── ...
│
├── docs/
│   ├── api-endpoints.md
│   ├── backend-status.md
│   └── ...
│
├── .env                            # 🔴 Variables (no versionado)
├── .env.example                    # Plantilla
├── package.json
├── README.md
└── ...
```

---

## Variables de Entorno: Frontend

```bash
# .env.local

# 1. Backend API
VITE_API_URL=http://localhost:3000/api

# 2. N8N Webhook
VITE_N8N_WEBHOOK_URL=https://primary-production-f465.up.railway.app/webhook/547531b3-5c5a-4b5e-82d5-8170253a01a4/chat
```

**Cómo se usan:**
```typescript
// En services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL
// Resultado: "http://localhost:3000/api"

// En components/N8nChatWidget.tsx
const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL
// Resultado: "https://primary-production-..."
```

---

## Variables de Entorno: Backend

```bash
# .env (NO incluido en git)

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://user:password@db.xxx.supabase.co:5432/postgres

# Server
PORT=3000
NODE_ENV=development
TIMEZONE=America/New_York

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://tudominio.com

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
```

**Cómo se usan:**
```javascript
// En src/config/database.js
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// En src/index.js
const PORT = process.env.PORT || 3000
app.listen(PORT, ...)
```

---

## Flujo de Autenticación

```
1. Usuario va a /auth (login)
   
   ▼
2. Ingresa email y contraseña
   │
   └─ POST /api/auth/login
      ├─ Backend verifica credenciales en Supabase
      ├─ Si válido: Genera JWT token
      └─ Retorna: { token: "...", user: {...} }
   
   ▼
3. Frontend guarda en localStorage
   ├─ localStorage.setItem('token', token)
   └─ localStorage.setItem('user', JSON.stringify(user))
   
   ▼
4. Redirige a /dashboard
   
   ▼
5. Todos los requests posteriores incluyen el token
   ├─ Header: Authorization: Bearer <token>
   ├─ En api.ts interceptor lo agrega automáticamente
   └─ Backend valida con middleware authenticate

   ▼
6. Si token expira:
   ├─ Backend retorna 401 Unauthorized
   └─ Frontend limpia localStorage y redirige a /auth
```

---

## Ciclo de Vida del Componente N8nChatWidget

```
1. Component Mount
   ├─ useEffect se ejecuta (dependencia: location.pathname)
   ├─ Verifica location.pathname !== '/' && !== '/auth'
   │
   ▼ (si cumple)
   
2. Validation Phase
   ├─ ✓ Verifica si ya estaba inicializado (chatInitializedRef)
   ├─ ✓ Verifica VITE_N8N_WEBHOOK_URL existe
   ├─ ✓ Valida que URL empiece con http:// o https://
   │
   ▼ (si pasa todo)
   
3. Initialization Phase
   ├─ Intercepta console.error para suprimir CORS warnings
   ├─ Llama createChat() con configuración
   ├─ Marca chatInitializedRef.current = true
   ├─ Marca chatInitialized = true
   │
   ▼
   
4. Event Listener Setup
   ├─ Encuentra #n8n-chat container
   ├─ Agrega MutationObserver para form submissions
   ├─ Prepara para cuando usuario escriba
   │
   ▼
   
5. Ready for Interaction
   ├─ Chat widget aparece en pantalla
   ├─ Usuario puede escribir mensajes
   ├─ Se envían directamente a N8N webhook
   │
   ▼
   
6. Component Unmount
   └─ Limpia listeners y restaura console.error
```

---

## HTTP Request/Response Examples

### GET /api/financial-settings/current

**Request:**
```http
GET /api/financial-settings/current HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "salary": 5000,
  "monthly_savings_target": 1000,
  "default_currency_id": "usd-id",
  "effective_date": "2024-01-01",
  "created_at": "2024-10-30T12:00:00Z",
  "updated_at": "2024-10-30T12:00:00Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "No active financial setting found"
}
```

---

### POST N8N Webhook

**Request:**
```http
POST /webhook/547531b3-5c5a-4b5e-82d5-8170253a01a4/chat HTTP/1.1
Host: primary-production-f465.up.railway.app
Content-Type: application/json
Origin: http://localhost:5173

{
  "chatInput": "¿Cuál es mi saldo?",
  "sessionId": "session-12345"
}
```

**Response (200 OK):**
```json
{
  "output": "Tu saldo actual es de $5,000 USD. ¿Necesitas más ayuda?"
}
```

---

**Creado:** October 30, 2025
**Última revisión:** October 30, 2025
