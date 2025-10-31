# Guía Completa de Páginas y Flujo - AhorraAI Frontend

## 📋 Índice
- [Resumen del Proyecto](#resumen-del-proyecto)
- [Arquitectura de Rutas](#arquitectura-de-rutas)
- [Flujo Principal del Usuario](#flujo-principal-del-usuario)
- [Detalle Completo de Cada Página](#detalle-completo-de-cada-página)
  - [LandingPage](#landingpage)
  - [AuthPage](#authpage)
  - [OnboardingPage](#onboardingpage)
  - [DashboardPage](#dashboardpage)
  - [IncomePage](#incomepage)
  - [ExpensePage](#expensepage)
  - [SavingsPage](#savingspage)
  - [CategoryPage](#categorypage)
  - [AccountPage](#accountpage)
  - [SettingsPage](#settingspage)
- [Interacciones Entre Páginas](#interacciones-entre-páginas)
- [Flujo de las 3 Metas de Ahorro](#flujo-de-las-3-metas-de-ahorro)

## Resumen del Proyecto

AhorraAI es una aplicación de finanzas personales diseñada específicamente para estudiantes y jóvenes. Su objetivo es ayudar a los usuarios a tomar control de sus finanzas, establecer metas de ahorro y visualizar su progreso financiero.

### Tecnologías Principales
- **Framework**: React 19 con TypeScript
- **Bundler**: Vite
- **Estilos**: Tailwind CSS con sistema de diseño Shadcn/ui
- **Routing**: React Router DOM v7
- **Temas**: Next-themes (Día/Noche)
- **Backend**: API REST con Supabase o servicio similar
- **Tipos**: TypeScript con definiciones claras

### Estructura de Componentes
- `src/components/ui/` - Componentes base de Shadcn/ui
- `src/components/auth/` - Componentes específicos de autenticación
- `src/pages/` - Componentes de páginas principales
- `src/context/` - Contextos globales (AuthContext, CurrencyContext, DashboardContext)
- `src/services/` - Lógica de comunicación con APIs
- `src/hooks/` - Hooks personalizados
- `src/types/` - Definiciones de tipos TypeScript

## Arquitectura de Rutas

### Rutas Públicas
- `/` → LandingPage
- `/auth` → AuthPage (login/registro)

### Rutas Protegidas
- `/onboarding` → OnboardingPage
- `/dashboard` → DashboardPage
- `/income` → IncomePage
- `/expenses` → ExpensePage
- `/categories` → CategoryPage
- `/savings` → SavingsPage
- `/accounts` → AccountPage
- `/settings` → SettingsPage

### Sistema de Protección
- `ProtectedRoute`: Componente wrapper que redirige si el usuario no está autenticado
- `AuthContext`: Provee estado de autenticación global
- `MainLayout`: Layout común para rutas protegidas con sidebar

## Flujo Principal del Usuario

```
1. Usuario visita "/" (LandingPage)
   ↓
2. Click en "Registrarse" → "/auth?mode=register"
   ↓
3. Completa formulario de registro → AuthContext.register()
   ↓
4. Redirige a "/onboarding"
   ↓
5. Completa configuración inicial (3 pasos) → OnboardingPage
   ↓
6. Redirige a "/dashboard"
   ↓
7. Usa la aplicación navegando entre rutas protegidas
   ↓
8. Click en logout → Limpia sesión y redirige a "/"
```

## Detalle Completo de Cada Página

### LandingPage

**Ruta**: `/`
**Tipo**: Pública

**Propósito**: Presentar la aplicación a usuarios no autenticados y motivarlos a registrarse.

**Componentes**:
1. **Header**: Logo, navegación a auth
2. **Hero Section**: Título principal, descripción, CTAs
3. **Features Grid**: 6 características principales con iconos
4. **CTA Final**: Card con llamada a acción
5. **Footer**: Información general

**Flujo**:
- Usuario no registrado puede navegar a `/auth` para registrarse o iniciar sesión
- Botón "Comenzar Gratis" → `/auth?mode=register`
- Botón "Ya tengo cuenta" → `/auth`

**Interacciones**:
- Navegación a AuthPage para login/register
- No requiere API calls ni autenticación

**Efectos**:
- Componente estático sin useEffect
- Muestra información general de la aplicación

### AuthPage

**Ruta**: `/auth`
**Tipo**: Pública (con redirección si autenticado)

**Propósito**: Autenticar usuarios (login y registro).

**Componentes**:
1. **Logo y Título**: Marca de la aplicación
2. **Formulario**: LoginForm o RegisterForm según query param
3. **Toggle**: Entre login y registro

**Flujo**:
1. Si usuario autenticado → redirige a `/dashboard`
2. Lee query param `?mode=register` para mostrar formulario correspondiente
3. Toggle cambia el formulario y actualiza query param
4. Login exitoso → `/dashboard`
5. Registro exitoso → `/onboarding`

**Interacciones**:
- `useSearchParams` para manejar modo (login/register)
- `useAuth` para verificar autenticación
- Navegación a Dashboard o Onboarding según acción

**Efectos**:
- Redirect si ya está autenticado
- Toggle entre formulario según query param

### OnboardingPage

**Ruta**: `/onboarding`
**Tipo**: Protegida

**Propósito**: Configuración inicial para nuevos usuarios en 3 pasos.

**Componentes**:
1. **Progress Bar**: Indicador de 3 pasos
2. **Step 1**: Configuración de ingresos (salario, meta de ahorro)
3. **Step 2**: Creación de cuentas (bancarias, efectivo)
4. **Step 3**: Creación de metas de ahorro (mensuales, globales, personalizadas)

**Flujo Completo**:
1. **Paso 1 - Configuración Financiera**:
   - Ingreso de salario mensual
   - Establecimiento de meta de ahorro mensual (opcional)
   - API: `financialSettingService.create()`
   - Siguiente → Paso 2

2. **Paso 2 - Creación de Cuentas**:
   - Nombres, tipos, balances iniciales
   - API: `accountService.create()` para cada cuenta
   - Puedes agregar múltiples cuentas
   - Siguiente → Paso 3

3. **Paso 3 - Metas de Ahorro**:
   - Nombres, montos, tipos de meta
   - API: `savingsGoalService.create()` para cada meta
   - Puedes crear múltiples metas
   - Finalizar → Redirige a `/dashboard`

**Interacciones**:
- `financialSettingService` - para guardar configuración
- `accountService` - para crear cuentas
- `savingsGoalService` - para crear metas de ahorro
- `currencyService.getAll()` - para mostrar monedas en creación de cuentas
- Navegación con `useNavigate` entre pasos y al finalizar

**Efectos**:
- Fetch de monedas para uso en cuentas
- Manejo de estado local para cada paso
- Validación de formularios
- Navegación controlada por pasos

### DashboardPage

**Ruta**: `/dashboard`
**Tipo**: Protegida

**Propósito**: Vista general de las finanzas del usuario.

**Componentes**:
1. **Saludo Personalizado**: Con nombre del usuario
2. **Stats Cards**: Balance total, ingresos del mes, gastos del mes, ahorros
3. **Quick Actions**: Botones para añadir ingreso/gasto/ahorro
4. **Monthly Summary**: Comparación ingresos vs gastos con barras de progreso
5. **Onboarding Notice**: Sugerencia para completar perfil

**Flujo**:
1. Fetch de datos del mes actual desde servicios API
2. Calcula totales para mostrar en cards
3. Formatea montos con `formatCurrency`
4. Muestra gráficos de progreso visual

**Interacciones**:
- `useDashboard` hook - para obtener stats de la API
- `useAuth` - para obtener información del usuario
- Navegación a IncomePage, ExpensePage, SavingsPage para acciones rápidas

**Efectos**:
- `useEffect` que fetch datos del mes actual
- Cálculos de totales y porcentajes
- Actualización automática de estadísticas
- Manejo de loading states

### IncomePage

**Ruta**: `/income`
**Tipo**: Protegida

**Propósito**: Gestión completa de ingresos puntuales y salarios recurrentes (fuentes de salario fijo y promedio).

**Arquitectura de Pestañas**:
La página tiene dos pestañas principales:

#### **Pestaña 1: Ingresos Puntuales**
**Componentes**:
1. **Stats Summary** (2 tarjetas):
   - Total de Ingresos (cantidad)
   - Monto Total de Ingresos confirmados
2. **Botones de Acción**:
   - "Nuevo Ingreso" 
   - "Generar de Salarios" (genera ingresos pendientes desde fuentes de salario fijo)
3. **Formulario de Ingreso Puntual** (colapsible):
   - Nombre (ej: "Ingreso extra", "Regalo")
   - Monto
   - Moneda (selector)
   - Fecha específica (opcional)
   - Cuenta (opcional)
   - Descripción (opcional)
4. **Data Table**: Lista de ingresos con acciones (editar, eliminar)

**Flujo de Ingresos Puntuales**:
1. Usuario hace click en "Nuevo Ingreso"
2. Completa formulario con datos del ingreso (todo se marca como tipo 'extra' y confirmado por defecto)
3. Al guardar, se crea el ingreso y se actualiza la tabla
4. Usuario puede editar o eliminar ingresos existentes
5. Botón "Generar de Salarios" llama al endpoint que crea ingresos pendientes desde fuentes de salario fijo programadas

**Pestaña 2: Salarios Recurrentes (Fuentes de Salario)**

**Componentes**:
1. **Stats Summary** (4 tarjetas):
   - Total de Salarios (cantidad)
   - Salarios Activos (cantidad)
   - Monto Total de Salarios (suma)
   - Próximos Pagos (cantidad)
2. **Botón "Nueva Fuente de Salario"**: Abre formulario
3. **Formulario de Fuente de Salario**:
   - Nombre de la Fuente (ej: "Trabajo en X", "Freelance habitual")
   - Tipo de Ingreso: Solo "Fijo" actualmente (esto controla si se generan confirmaciones automáticas)
   - Monto
   - Moneda
   - Frecuencia: `weekly` o `monthly`
   - Día de Pago: día de la semana o del mes según frecuencia
   - Fecha de Inicio: para calcular próximos pagos
   - Cuenta Destino (opcional)
   - Descripción (opcional)
4. **Data Table**: Lista de fuentes de salario con acciones (editar, eliminar)

**Flujo de Salarios Recurrentes**:
1. Usuario agrega una nueva fuente de salario con monto, frecuencia, día de pago y fecha de inicio
2. Al guardar, se almacena la fuente como `SalarySchedule` con todos los parámetros
3. El sistema puede generar ingresos pendientes automáticamente (llamando al endpoint `/income-service/generate/salary-incomes`)
4. Las fuentes de salario no crean ingresos directamente, sino que planean pagos futuros
5. Estadísticas se actualizan mostrando información sobre fuentes activas y próximos pagos

**Formularios y Campos Especiales**:
- El formulario de salarios muestra campos específicos para programación de pagos (frecuencia, día, fecha inicio)
- No hay distinción entre "fijo" y "promedio" en el código actual de IncomePage (esto parece haber cambiado desde la documentación original)

**Interacciones**:
- `incomeService.getAll()` - para listar ingresos
- `salaryScheduleService.getAll()` - para listar fuentes de salario
- `salaryScheduleService.create()` - para crear fuente de salario
- `salaryScheduleService.update()` - para editar fuente de salario
- `salaryScheduleService.delete()` - para eliminar fuente de salario
- `incomeService.create()` - para crear ingreso puntual
- `incomeService.update()` - para editar ingreso
- `incomeService.delete()` - para eliminar ingreso
- `incomeService.generateSalaryIncomes()` - para generar ingresos pendientes desde fuentes de salario
- `accountService.getAll()` - para mostrar cuentas disponibles
- `currencyService.getAll()` - para mostrar monedas

**Efectos**:
- Fetch inicial de ingresos, fuentes de salario, cuentas y monedas
- Separación de datos entre ingresos puntuales y fuentes de salario
- Cálculo dinámico de estadísticas según pestaña activa
- Toggle entre pestañas de ingresos y salarios

### ExpensePage

**Ruta**: `/expenses`
**Tipo**: Protegida

**Propósito**: Registro, gestión y análisis completo de gastos con filtros y ordenamiento avanzados.

**Componentes**:
1. **Stats Summary** (3 tarjetas):
   - Total Gastos (monto)
   - Necesarios (monto)
   - Innecesarios (monto)
2. **Controles de Acción**:
   - Botón "Nuevo Gasto"
   - Selector de Tipo de Gasto (Todos/Necesarios/Innecesarios)
3. **Panel de Filtros Completo** (colapsible):
   - Toggle: Mes/Año vs Rango Personalizado
   - **Si Mes/Año**:
     - Selector de Mes (enero-diciembre)
     - Selector de Año (últimos 5 años)
   - **Si Rango Personalizado**:
     - Selector de Fecha Inicio
     - Selector de Fecha Fin
   - **Ordenamiento**:
     - Orden Por: Fecha / Monto / Categoría
     - Dirección: Ascendente / Descendente
   - Contador: "Mostrando X de Y gastos"
4. **Formulario de Gasto** (colapsible):
   - Descripción
   - Tipo: `fixed` o `variable`
   - Categoría (selector)
   - Monto
   - Moneda
   - Fecha
   - Cuenta (opcional)
5. **Data Table**: Lista de gastos filtrados y ordenados

**Flujo Completo**:

**Filtración**:
1. Usuario selecciona tipo de gasto (necesario/innecesario/todos)
2. Elige entre filtro Mes/Año o Rango Personalizado
3. Si Mes/Año: selecciona mes y año específicos
4. Si Rango: establece fecha inicio y fin
5. Tabla se actualiza automáticamente mostrando solo gastos coincidentes

**Ordenamiento**:
1. Usuario selecciona campo de ordenamiento:
   - **Fecha**: Ordena por `expense_date`
   - **Monto**: Ordena por cantidad gastada
   - **Categoría**: Ordena alfabéticamente por categoría
2. Usuario elige dirección (ascendente/descendente)
3. Tabla se reorganiza inmediatamente (sin nuevo request)

**CRUD de Gastos**:
1. **Creación**: Click en "Nuevo Gasto", completa formulario
2. **Edición**: Click en botón editar en fila, recarga formulario
3. **Eliminación**: Click en botón eliminar, confirmación, remueve y actualiza tabla
4. **Visualización**: Tabla muestra descripción, categoría, tipo, monto, acciones

**Interacciones**:
- `expenseService.getAll()` - para listar gastos
- `expenseService.create()` - para crear gasto
- `expenseService.update()` - para editar gasto
- `expenseService.delete()` - para eliminar gasto
- `categoryService.getAll()` - para mostrar categorías
- `accountService.getAll()` - para mostrar cuentas
- `currencyService.getAll()` - para mostrar monedas

**Efectos**:
- Fetch inicial de gastos, categorías, cuentas y monedas
- Filtrado en cliente por tipo de categoría, rango de fechas y ordenamiento
- Cálculos de totales actualizados según filtros aplicados
- Contador dinámico de gastos mostrados vs totales

### SavingsPage

**Ruta**: `/savings`
**Tipo**: Protegida

**Propósito**: Gestión de metas de ahorro y depósitos.

**Componentes**:
1. **Stats Summary**: Total metas, total ahorrado, meta total con progreso
2. **Acciones Rápidas**:
   - "Nueva Meta"
   - "Nuevo Depósito"
3. **Formulario de Meta**: Nombre, monto, tipo, fecha, descripción
4. **Formulario de Depósito**: Meta, monto, fecha, descripción
5. **Data Tables**: 
   - Metas de ahorro con acciones (eliminar)
   - Depósitos recientes (solo lectura)

**Flujo Completo**:
1. **Listado**: Fetch de metas y depósitos
2. **Creación de Meta**: Formulario con nombre, monto, tipo (mensual/global/custom), fecha objetivo (opcional)
3. **Creación de Depósito**: Asociar a meta existente con monto y fecha
4. **Edición**: No hay edición directa, solo eliminación
5. **Eliminación**: Confirmación con alerta

**Interacciones**:
- `savingsGoalService.getAll()` - para listar metas
- `savingsGoalService.create()` - para crear meta
- `savingsGoalService.delete()` - para eliminar meta
- `savingsDepositService.getAll()` - para listar depósitos
- `savingsDepositService.create()` - para crear depósito
- `savingsDepositService.delete()` - para eliminar depósito

**Efectos**:
- Fetch inicial de metas y depósitos
- Cálculo de estadísticas y progresos
- Manejo de formularios con estado local
- Progreso visual con componentes Progress

### CategoryPage

**Ruta**: `/categories`
**Tipo**: Protegida

**Propósito**: Gestión de categorías de gastos.

**Componentes**:
1. **Tabla de Categorías**: Nombre, tipo, descripción, acciones
2. **Formulario**: Crear/editar categorías
3. **Botones de Acción**: Añadir, editar, eliminar

**Flujo Completo**:
1. **Listado**: Fetch de categorías con paginación
2. **Creación**: Formulario con nombre, tipo (necesario/innecesario), descripción
3. **Edición**: Carga datos existentes en formulario
4. **Eliminación**: Confirmación con alerta

**Interacciones**:
- `categoryService.getAll()` - para listar categorías
- `categoryService.create()` - para crear categoría
- `categoryService.update()` - para editar categoría
- `categoryService.delete()` - para eliminar categoría

**Efectos**:
- Fetch inicial de categorías
- Manejo de formulario con validación
- Paginación de resultados
- Toggle entre formulario de creación/edición y tabla

### AccountPage

**Ruta**: `/accounts`
**Tipo**: Protegida

**Propósito**: Gestión de cuentas bancarias y efectivo.

**Componentes**:
1. **Stats Summary**: Total cuentas, balance total
2. **Formulario**: Crear/editar cuentas
3. **Tabla de Cuentas**: Nombre, tipo, balance, descripción, acciones
4. **Botones de Acción**: Añadir, editar, eliminar

**Flujo Completo**:
1. **Listado**: Fetch de cuentas con paginación
2. **Creación**: Formulario con nombre, tipo (cash/bank/platform), balance inicial, moneda, descripción
3. **Edición**: Carga datos existentes en formulario
4. **Eliminación**: Confirmación con alerta

**Interacciones**:
- `accountService.getAll()` - para listar cuentas
- `accountService.create()` - para crear cuenta
- `accountService.update()` - para editar cuenta
- `accountService.delete()` - para eliminar cuenta
- `currencyService.getAll()` - para mostrar monedas

**Efectos**:
- Fetch inicial de cuentas y monedas
- Cálculo de balance total
- Manejo de formulario con validación
- Paginación de resultados

### SettingsPage

**Ruta**: `/settings`
**Tipo**: Protegida

**Propósito**: Configuración del perfil y preferencias financieras.

**Componentes**:
1. **Perfil Personal**: Nombre completo (editable), email (no editable)
2. **Configuración Financiera**: Salario mensual, meta ahorro mensual, moneda por defecto
3. **Avatar**: Subida de imagen de perfil
4. **Zona de Peligro**: Eliminación de cuenta

**Flujo Completo**:
1. **Carga Inicial**: Fetch de datos del usuario y configuración financiera
2. **Edición de Perfil**: Actualización de nombre completo
3. **Configuración Financiera**: Actualización de salario, meta de ahorro y moneda por defecto
4. **Subida de Avatar**: Selección y carga de imagen
5. **Eliminación de Cuenta**: Proceso de confirmación múltiple

**Interacciones**:
- `authService.updateProfile()` - para actualizar datos del perfil
- `authService.uploadAvatar()` - para subir avatar
- `authService.deleteAccount()` - para eliminar cuenta (llama a logout)
- `financialSettingService.getCurrent()` - para cargar configuración financiera
- `financialSettingService.create()` - para crear configuración financiera
- `financialSettingService.update()` - para actualizar configuración financiera
- `useAuth.logout()` - para cerrar sesión tras eliminar cuenta

**Efectos**:
- Fetch inicial de datos del usuario y configuración
- Manejo de múltiples formularios (perfil, financiero, avatar)
- Proceso de confirmación para eliminación de cuenta
- Actualización del contexto de moneda por defecto

**Eventos que Desencadena**:
- Actualización de nombre del usuario en todas las páginas
- Cambio de moneda por defecto afecta a todo el sistema
- Eliminación de cuenta y logout completo

## Interacciones Entre Páginas

### Navegación Principal
- **Dashboard** → Acciones rápidas llevan a Income/Expense/Savings
- **Sidebar** → Navegación accesible desde cualquier página protegida
- **Header** → Logout disponible en todas las páginas protegidas

### Flujo de Transacciones
- **IncomePage** → Crea ingresos que afectan Dashboard (stats)
- **ExpensePage** → Crea gastos que afectan Dashboard (stats) y Categorías
- **SavingsPage** → Crea metas y depósitos que afectan Dashboard (stats)

### Flujo de Configuración
- **Onboarding** → Establece configuración base para Dashboard
- **Settings** → Permite actualizar configuración existente
- **CategoryPage** → Configura categorías usadas en ExpensePage
- **AccountPage** → Configura cuentas usadas en Income/Expense

## Flujo de las 3 Metas de Ahorro

### 1. Meta Mensual (`monthly`)
**Tipo**: `monthly` (en el sistema)

**Propósito**: Meta de ahorro objetivo mensual fijo que el usuario desea alcanzar.

**Flujo Completo**:
1. **Creación**: En SavingsPage o OnboardingStep3 con `goal_type: 'monthly'`
2. **Seguimiento**: Se compara contra `monthly_savings_target` en FinancialSettings
3. **Depósito**: Usuario registra depósitos que van acumulando hacia la meta
4. **Visualización**: Progreso mostrado en Dashboard y SavingsPage
5. **Reinicio**: La meta se reinicia mensualmente para nuevo seguimiento

**Conexión con Otras Páginas**:
- **Dashboard**: Mostrada en "Ahorros" card como progreso mensual
- **Settings**: Comparada con `monthly_savings_target` para cálculos
- **Onboarding**: Primera meta sugerida durante configuración inicial

### 2. Meta Global (`global`)
**Tipo**: `global` (en el sistema)

**Propósito**: Meta de ahorro de largo plazo con fecha objetivo definida.

**Flujo Completo**:
1. **Creación**: En SavingsPage o OnboardingStep3 con `goal_type: 'global'`
2. **Configuración**: Nombre, monto objetivo, fecha límite, descripción
3. **Seguimiento**: Depósitos se acumulan hasta alcanzar el objetivo
4. **Progreso**: Porcentaje completado mostrado en interfaz
5. **Compleción**: Meta se marca como completada al alcanzar objetivo

**Conexión con Otras Páginas**:
- **Dashboard**: Contribuye al total de ahorros acumulados
- **SavingsPage**: Principal vista para seguimiento detallado
- **Settings**: Puede influir en recomendaciones de ahorro

### 3. Meta Personalizada (`custom`)
**Tipo**: `custom` (en el sistema)

**Propósito**: Metas de ahorro específicas para objetivos particulares (vacaciones, compras, etc.).

**Flujo Completo**:
1. **Creación**: En SavingsPage o OnboardingStep3 con `goal_type: 'custom'`
2. **Personalización**: Nombre descriptivo, monto objetivo, descripción
3. **Seguimiento**: Similar a meta global pero sin fecha límite predeterminada
4. **Flexibilidad**: Puede tener objetivos puntuales o recurrencia personalizada
5. **Categorización**: Usada para objetivos específicos (viajes, compras, etc.)

**Conexión con Otras Páginas**:
- **Dashboard**: Incluida en cálculo total de ahorros
- **SavingsPage**: Vista detallada con todas las metas personalizadas
- **Budgeting**: Puede usarse para planificación de gastos futuros

### Flujo Compartido de las 3 Metas

**Ciclo de Vida**:
1. **Creación**: Formulario en SavingsPage o Onboarding (tipo, nombre, monto)
2. **Seguimiento**: Actualización con depósitos (SavingsDepositService)
3. **Visualización**: Progreso mostrado en Dashboard/SavingsPage
4. **Gestión**: Edición/eliminación según necesidad del usuario
5. **Completitud**: Cálculo de progreso y estado de cumplimiento

**Integración con el Sistema**:
- **Datos**: Almacenados en `savings_goals` table con diferentes `goal_type`
- **Depósitos**: Relacionados vía `goal_id` en `savings_deposits` table
- **Cálculos**: Agregados en Dashboard para estadísticas generales
- **API**: Servicios separados pero integrados (`savingsGoalService`, `savingsDepositService`)

**Impacto en la Experiencia del Usuario**:
- **Motivación**: Visualización clara del progreso hacia objetivos
- **Flexibilidad**: Tipos diferentes para necesidades específicas
- **Conexión**: Integrado con otras funcionalidades (ingresos, gastos)
- **Seguimiento**: Progreso medible y visualizable en tiempo real

---

## 📋 Historial de Cambios y Actualizaciones

### Actualización del 30 de Octubre de 2025

#### **IncomePage - Nueva Arquitectura de Fuentes de Salario**

**Nuevas Características**:
1. ✅ **Sistema de Pestañas**: Separación clara entre Ingresos Puntuales y Fuentes de Salario
2. ✅ **Gestión de Fuentes de Salario**:
   - Fuentes con programación de pagos (frecuencia, día, fecha inicio)
   - Generación automática de ingresos pendientes mediante endpoint especial
   - Cálculo de próximos pagos programados
   
**Cambios Técnicos**:
- Se han eliminado las distinciones entre "fijo" y "promedio" en el código actual
- Las fuentes de salario ahora se manejan como `SalarySchedule` independientes
- El sistema de generación automática ahora es un endpoint separado

#### **ExpensePage - Sistema de Filtración y Ordenamiento Completo**

**Nuevas Características**:
1. ✅ **Filtración Avanzada**:
   - Toggle entre filtro Mes/Año vs Rango Personalizado
   - Selectores de mes y año con validación
   - Selectores de fecha inicio/fin para rango personalizado
2. ✅ **Ordenamiento Flexible**:
   - Por Fecha (más reciente primero por defecto)
   - Por Monto (mayor gasto primero)
   - Por Categoría (orden alfabético)
   - Dirección: Ascendente/Descendente
3. ✅ **UI Mejorada**: Panel de filtros colapsible en sección gris
4. ✅ **Indicadores**: Contador dinámico "Mostrando X de Y gastos"
5. ✅ **Filtración Mantenida**: El filtro por tipo (necesario/innecesario) se mantiene y combina con fecha

**Cambios Técnicos**:
- Lógica de filtración combinada (tipo + fecha + ordenamiento) ahora se ejecuta en cliente
- Ordenamiento en cliente para mejor UX (sin refetch del servidor)
- Almacenamiento de estado para cada filtro por separado
- Validación de rangos de fecha

#### **Mejoras Compartidas**

1. **Mejor Organización Visual**: Ambas páginas usan formularios colapsables y secciones expandibles
2. **Stats Dinámicas**: Se actualizan según filtros y datos actuales
3. **UX Consistente**: Estilos y patrones similares en todas las páginas
4. **Performance**: Filtración en cliente para respuesta inmediata

---
**Documentación actualizada el 30 de octubre de 2025**