# Guía de Páginas y Rutas - AhorraAI Frontend

Documentación de las páginas y el sistema de routing de la aplicación.

## 🗺️ Estructura de Rutas

La aplicación utiliza `react-router-dom` v6 para el enrutamiento.

### Rutas Públicas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `LandingPage` | Página de inicio pública |
| `/auth` | `AuthPage` | Login/Registro |

### Rutas Protegidas

Todas estas rutas requieren autenticación y redirigen a `/auth` si el usuario no está logueado.

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/onboarding` | `OnboardingPage` | Configuración inicial (nuevos usuarios) |
| `/dashboard` | `DashboardPage` | Dashboard principal |
| `/income` | `IncomePage` | Gestión de ingresos |
| `/expenses` | `ExpensePage` | Gestión de gastos |
| `/savings` | `SavingsPage` | Metas de ahorro |
| `/accounts` | `AccountPage` | Gestión de cuentas |
| `/settings` | `SettingsPage` | Configuración del usuario |

### Ruta Catch-All

- `*` → Redirige a `/`

## 📄 Detalle de Páginas

### LandingPage (`/`)

**Propósito**: Presentar la aplicación a usuarios no autenticados.

**Secciones**:
1. **Header**: Logo y botones de Login/Registro
2. **Hero**: Título principal y CTAs
3. **Features**: Grid con 6 características principales
4. **CTA Final**: Invitación a registrarse
5. **Footer**: Créditos

**Navegación**:
- Click en "Registrarse" → `/auth?mode=register`
- Click en "Iniciar Sesión" → `/auth`

**Estado**: ✅ Completado

---

### AuthPage (`/auth`)

**Propósito**: Autenticación de usuarios (login y registro).

**Query Params**:
- `?mode=login` (default) - Muestra LoginForm
- `?mode=register` - Muestra RegisterForm

**Comportamiento**:
- Si ya está autenticado → Redirige a `/dashboard`
- Toggle entre login/register actualiza query param
- Login exitoso → `/dashboard`
- Registro exitoso → `/onboarding`

**Estado**: ✅ Completado

---

### OnboardingPage (`/onboarding`)

**Propósito**: Configuración inicial para nuevos usuarios.

**Flujo Planeado**:
1. **Paso 1: Ingresos**
   - Configurar salario
   - Seleccionar frecuencia
   - Crear financial_settings

2. **Paso 2: Cuentas**
   - Agregar saldo inicial
   - Distribuir en efectivo/bancos
   - Crear accounts

3. **Paso 3: Metas de Ahorro**
   - Definir meta mensual
   - Meta global
   - Metas personalizadas
   - Crear savings_goals

**Navegación**:
- Al completar → `/dashboard`
- Botón "Omitir" → `/dashboard`

**Estado**: 🚧 En construcción (placeholder)

---

### DashboardPage (`/dashboard`)

**Propósito**: Vista general de las finanzas del usuario.

**Componentes**:
1. **Saludo personalizado** con nombre del usuario
2. **4 Cards de estadísticas**:
   - Balance Total
   - Ingresos del Mes
   - Gastos del Mes
   - Ahorros

3. **Acciones Rápidas**:
   - Agregar Ingreso
   - Registrar Gasto
   - Depositar Ahorro

4. **Resumen Mensual**:
   - Barras de progreso ingresos/gastos
   - Balance calculado

**Datos**: Actualmente usa datos simulados, pendiente integración con backend

**Estado**: ✅ Completado (UI básica)

---

### IncomePage (`/income`)

**Propósito**: Gestión de fuentes de ingresos.

**Funcionalidades Planeadas**:
- Listar ingresos (GET /api/incomes)
- Agregar nuevo ingreso (POST /api/incomes)
- Editar ingreso existente (PUT /api/incomes/:id)
- Eliminar ingreso (DELETE /api/incomes/:id)
- Confirmar recepción de ingreso (POST /api/incomes/:id/confirm)
- Filtros por tipo (fijo/variable/extra) y fecha

**Formulario de Ingreso**:
- Nombre
- Tipo (fixed/variable/extra)
- Monto
- Moneda
- Frecuencia
- Fecha de ingreso
- Cuenta asociada
- Descripción

**Estado**: 🚧 En construcción (placeholder)

---

### ExpensePage (`/expenses`)

**Propósito**: Registro y gestión de gastos.

**Funcionalidades Planeadas**:
- Listar gastos (GET /api/expenses)
- Agregar gasto (POST /api/expenses)
- Editar gasto (PUT /api/expenses/:id)
- Eliminar gasto (DELETE /api/expenses/:id)
- Filtros por categoría, cuenta y fecha
- Visualización por categorías (necessary/unnecessary)

**Formulario de Gasto**:
- Monto
- Moneda
- Fecha
- Cuenta de origen
- Categoría (selector jerárquico)
- Descripción

**Estado**: 🚧 En construcción (placeholder)

---

### SavingsPage (`/savings`)

**Propósito**: Gestión de metas de ahorro y depósitos.

**Funcionalidades Planeadas**:

1. **Vista de Metas**:
   - Meta Mensual (is_monthly_target=true)
   - Meta Global (goal_type='global')
   - Metas Personalizadas (goal_type='custom')
   - Progreso visual con barras

2. **Operaciones con Metas**:
   - Crear meta (POST /api/savings-goals)
   - Editar meta (PUT /api/savings-goals/:id)
   - Eliminar meta (DELETE /api/savings-goals/:id)
   - Marcar como custom/global

3. **Depósitos Manuales**:
   - Registrar depósito (POST /api/savings-deposits)
   - Ver historial de depósitos
   - Eliminar depósito

4. **Estado Mensual**:
   - Comparar target vs actual
   - Mostrar % cumplido
   - Diferencia restante

**Estado**: 🚧 En construcción (placeholder)

---

### AccountPage (`/accounts`)

**Propósito**: Gestión de cuentas bancarias y efectivo.

**Funcionalidades Planeadas**:
- Listar cuentas (GET /api/accounts)
- Agregar cuenta (POST /api/accounts)
- Editar cuenta (PUT /api/accounts/:id)
- Eliminar cuenta (DELETE /api/accounts/:id)
- Ver balance actualizado
- Filtros por tipo (cash/bank/platform)

**Formulario de Cuenta**:
- Nombre
- Tipo (cash/bank/platform)
- Balance inicial
- Moneda
- Descripción

**Estado**: 🚧 En construcción (placeholder)

---

### SettingsPage (`/settings`)

**Propósito**: Configuración del perfil y preferencias.

**Secciones Planeadas**:

1. **Perfil Personal**:
   - Editar nombre completo
   - Cambiar email
   - Subir avatar
   - Cambiar contraseña

2. **Configuración Financiera**:
   - Actualizar salario
   - Modificar meta de ahorro mensual
   - Historial de configuraciones

3. **Preferencias**:
   - Moneda predeterminada
   - Zona horaria
   - Notificaciones

4. **Cuenta**:
   - Eliminar cuenta
   - Descargar datos

**Estado**: 🚧 En construcción (placeholder)

---

## 🔐 Sistema de Protección de Rutas

### ProtectedRoute Component

Wrapper que protege rutas privadas.

**Lógica**:
```tsx
if (isLoading) return <LoadingSpinner />
if (!isAuthenticated) return <Navigate to="/auth" />
return <>{children}</>
```

**Uso en App.tsx**:
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### MainLayout Component

Layout principal que envuelve las rutas protegidas con sidebar.

**Estructura**:
```tsx
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/income" element={<IncomePage />} />
  {/* ... más rutas */}
</Route>
```

**Características**:
- Sidebar con navegación
- Header con usuario y logout
- Responsive con menú mobile
- Usa `<Outlet />` para renderizar rutas hijas

## 🚀 Navegación Programática

### useNavigate Hook

```tsx
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

// Navegar a una ruta
navigate('/dashboard')

// Navegar con replace (no agrega a historial)
navigate('/auth', { replace: true })

// Navegar hacia atrás
navigate(-1)
```

### Link Component

```tsx
import { Link } from 'react-router-dom'

<Link to="/dashboard">Ir al Dashboard</Link>
<Link to="/auth?mode=register">Registrarse</Link>
```

## 📊 Flujo de Usuario Completo

```
1. Usuario visita "/" (LandingPage)
   ↓
2. Click en "Registrarse" → "/auth?mode=register"
   ↓
3. Completa formulario de registro → AuthContext.register()
   ↓
4. Redirige a "/onboarding"
   ↓
5. Completa configuración inicial (3 pasos)
   ↓
6. Redirige a "/dashboard"
   ↓
7. Usa la aplicación navegando entre rutas protegidas
   ↓
8. Click en logout → Limpia sesión y redirige a "/auth"
```

## 🔄 Redirecciones Automáticas

- Usuario no autenticado intenta acceder ruta protegida → `/auth`
- Usuario autenticado visita `/auth` → `/dashboard`
- Ruta no encontrada → `/`

## 📝 Notas de Desarrollo

- Todas las páginas en construcción muestran un placeholder
- Los datos del dashboard son simulados (pendiente integración backend)
- El onboarding está diseñado pero no implementado
- Se recomienda implementar las páginas en este orden:
  1. SettingsPage (configuración de perfil)
  2. IncomePage (CRUD más simple)
  3. ExpensePage (CRUD con categorías)
  4. AccountPage (gestión de cuentas)
  5. SavingsPage (lógica compleja de metas)
  6. OnboardingPage (usa componentes de otras páginas)
