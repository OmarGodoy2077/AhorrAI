# Guía de Integración con API - AhorraAI Frontend

Documentación sobre cómo el frontend se conecta con el backend de AhorraAI.

## 🌐 Configuración de API

### Variables de Entorno

El frontend utiliza variables de entorno para configurar la URL del backend.

**Archivo**: `.env`

```env
VITE_API_URL=http://localhost:3000/api
```

**Nota**: Vite expone las variables que empiezan con `VITE_` al código del cliente.

### Cliente HTTP (Axios)

**Archivo**: `src/services/api.ts`

#### Configuración Base

```typescript
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
})
```

#### Interceptor de Request

Agrega automáticamente el token JWT a todas las peticiones:

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### Interceptor de Response

Maneja errores 401 (token expirado o inválido):

```typescript
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)
```

#### Helper para Errores

Función para extraer mensajes de error de respuestas:

```typescript
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Validación con detalles
    if (error.response?.data?.details) {
      return error.response.data.details
        .map(d => d.message)
        .join(', ')
    }
    
    // Error general
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    
    // Códigos de estado
    if (error.response?.status === 404) {
      return 'Recurso no encontrado'
    }
    if (error.response?.status === 500) {
      return 'Error del servidor'
    }
  }
  
  return 'Error desconocido'
}
```

## 🔐 Autenticación

### authService

**Archivo**: `src/services/authService.ts`

#### Register

```typescript
async register(data: RegisterData): Promise<AuthResponse>

// Uso
const response = await authService.register({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'Juan Pérez'
})
// Respuesta: { user: User, token: string }
```

**Endpoint**: `POST /api/auth/register`

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Juan Pérez"
}
```

**Respuesta**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Juan Pérez",
    "created_at": "2025-10-28T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse>

// Uso
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123'
})
```

**Endpoint**: `POST /api/auth/login`

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile

```typescript
async getProfile(): Promise<User>

// Uso
const user = await authService.getProfile()
```

**Endpoint**: `GET /api/profile`

**Headers**: `Authorization: Bearer <token>`

#### Update Profile

```typescript
async updateProfile(data: Partial<User>): Promise<User>

// Uso
const updatedUser = await authService.updateProfile({
  full_name: 'Nuevo Nombre'
})
```

**Endpoint**: `PUT /api/profile`

#### Delete Account

```typescript
async deleteAccount(): Promise<void>

// Uso
await authService.deleteAccount()
```

**Endpoint**: `DELETE /api/profile`

#### Upload Avatar

```typescript
async uploadAvatar(file: File): Promise<User>

// Uso
const input = document.querySelector('input[type="file"]')
const file = input.files[0]
const updatedUser = await authService.uploadAvatar(file)
```

**Endpoint**: `PUT /api/profile`

**Content-Type**: `multipart/form-data`

## 📊 Servicios Pendientes

Los siguientes servicios deben crearse siguiendo el patrón de `authService`:

### incomeService.ts

```typescript
export const incomeService = {
  async list(params?: PaginationParams): Promise<PaginatedResponse<Income>>
  async get(id: string): Promise<Income>
  async create(data: IncomeFormData): Promise<Income>
  async update(id: string, data: Partial<IncomeFormData>): Promise<Income>
  async delete(id: string): Promise<void>
  async confirm(id: string): Promise<Income>
}
```

**Endpoints**:
- `GET /api/incomes` - Listar
- `GET /api/incomes/:id` - Obtener uno
- `POST /api/incomes` - Crear
- `PUT /api/incomes/:id` - Actualizar
- `DELETE /api/incomes/:id` - Eliminar
- `POST /api/incomes/:id/confirm` - Confirmar recepción

### expenseService.ts

```typescript
export const expenseService = {
  async list(params?: PaginationParams): Promise<PaginatedResponse<Expense>>
  async get(id: string): Promise<Expense>
  async create(data: ExpenseFormData): Promise<Expense>
  async update(id: string, data: Partial<ExpenseFormData>): Promise<Expense>
  async delete(id: string): Promise<void>
}
```

**Endpoints**:
- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

### accountService.ts

```typescript
export const accountService = {
  async list(): Promise<Account[]>
  async get(id: string): Promise<Account>
  async create(data: AccountFormData): Promise<Account>
  async update(id: string, data: Partial<AccountFormData>): Promise<Account>
  async delete(id: string): Promise<void>
}
```

**Endpoints**:
- `GET /api/accounts`
- `POST /api/accounts`
- `PUT /api/accounts/:id`
- `DELETE /api/accounts/:id`

### savingsGoalService.ts

```typescript
export const savingsGoalService = {
  async list(): Promise<SavingsGoal[]>
  async get(id: string): Promise<SavingsGoal>
  async create(data: SavingsGoalFormData): Promise<SavingsGoal>
  async update(id: string, data: Partial<SavingsGoalFormData>): Promise<SavingsGoal>
  async delete(id: string): Promise<void>
  async setMonthlyTarget(id: string): Promise<SavingsGoal>
  async excludeFromGlobal(id: string): Promise<SavingsGoal>
  async includeInGlobal(id: string): Promise<SavingsGoal>
  async getCustomGoals(): Promise<SavingsGoal[]>
  async getGlobalContributors(): Promise<SavingsGoal[]>
}
```

### savingsDepositService.ts

```typescript
export const savingsDepositService = {
  async list(params?: PaginationParams): Promise<PaginatedResponse<SavingsDeposit>>
  async get(id: string): Promise<SavingsDeposit>
  async create(data: SavingsDepositFormData): Promise<SavingsDeposit>
  async update(id: string, data: Partial<SavingsDepositFormData>): Promise<SavingsDeposit>
  async delete(id: string): Promise<void>
  async getByGoal(goalId: string): Promise<SavingsDeposit[]>
  async getMonthlyStatus(year: number, month: number): Promise<MonthlyStatus>
}
```

**Endpoints especiales**:
- `GET /api/savings-deposits/goal/:goalId`
- `GET /api/savings-deposits/monthly-status/:year/:month`

### financialSettingService.ts

```typescript
export const financialSettingService = {
  async list(): Promise<FinancialSetting[]>
  async getCurrent(): Promise<FinancialSetting>
  async create(data: FinancialSettingFormData): Promise<FinancialSetting>
  async update(id: string, data: Partial<FinancialSettingFormData>): Promise<FinancialSetting>
  async delete(id: string): Promise<void>
}
```

### summaryService.ts

```typescript
export const summaryService = {
  async getMonthly(year: number, month: number): Promise<MonthlySummary>
  async getYearly(year: number): Promise<YearlySummary>
  async generateMonthly(): Promise<MonthlySummary>
}
```

**Endpoints**:
- `GET /api/summaries/monthly/:year/:month`
- `GET /api/summaries/yearly/:year`
- `POST /api/summaries/monthly/generate`

## 🔄 Context de Autenticación

### AuthContext

**Archivo**: `src/context/AuthContext.tsx`

El AuthContext gestiona el estado de autenticación global de la aplicación.

#### Estructura

```typescript
interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}
```

#### Uso

```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <div>No autenticado</div>
  }
  
  return (
    <div>
      <p>Bienvenido, {user?.full_name}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  )
}
```

#### Persistencia

- Token y usuario se almacenan en `localStorage`
- Al cargar la app, se intenta recuperar la sesión
- Si el token es inválido, se limpia y redirige a login

## 🛡️ Manejo de Errores

### Patrón Recomendado

```tsx
import { getErrorMessage } from '@/services/api'

const [error, setError] = useState<string>('')
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setError('')
  setIsLoading(true)
  
  try {
    await someService.create(data)
    // Éxito
  } catch (err) {
    setError(getErrorMessage(err))
  } finally {
    setIsLoading(false)
  }
}
```

### Tipos de Errores del Backend

#### Error de Validación

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### Error General

```json
{
  "error": "Usuario no encontrado"
}
```

#### Error de Servidor (500)

```json
{
  "error": "Internal server error"
}
```

## 📋 Checklist de Integración

Para cada módulo nuevo:

- [ ] Crear service en `src/services/`
- [ ] Definir tipos en `src/types/`
- [ ] Implementar métodos CRUD
- [ ] Agregar manejo de errores
- [ ] Crear hook custom (opcional) en `src/hooks/`
- [ ] Usar en componentes con try/catch
- [ ] Mostrar estados de loading
- [ ] Mostrar mensajes de error al usuario

## 🔗 Referencias

- Backend API Endpoints: `Backend/docs/api-endpoints.md`
- Backend API Guide: `Backend/docs/api-guide.md`
- Backend Overview: `Backend/docs/backend-overview.md`

## 📝 Notas

- Todos los endpoints protegidos requieren el header `Authorization: Bearer <token>`
- Los parámetros de paginación son opcionales: `page`, `limit`, `sortBy`, `sortOrder`
- Las fechas se manejan en formato ISO 8601
- La moneda predeterminada es `GTQ` (Quetzal Guatemalteco)
- El timezone es `America/Guatemala`
