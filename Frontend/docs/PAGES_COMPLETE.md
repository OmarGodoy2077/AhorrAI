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
- **Backend**: API REST con Supabase
- **Tipos**: TypeScript con definiciones claras

### Estructura de Componentes
- `src/components/ui/` - Componentes base de Shadcn/ui
- `src/components/auth/` - Componentes específicos de autenticación
- `src/pages/` - Componentes de páginas principales
- `src/context/` - Contextos globales (AuthContext)
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
- Navegación con `useNavigate` entre pasos y al finalizar

**Efectos**:
- Fetch de monedas para uso en cuentas
- Manejo de estado local para cada paso
- Validación de formularios

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
- `incomeService.getAll()` - para obtener ingresos del mes
- `expenseService.getAll()` - para obtener gastos del mes
- `accountService.getAll()` - para obtener balances de cuentas
- Navegación a IncomePage, ExpensePage, SavingsPage para acciones rápidas

**Efectos**:
- `useEffect` que fetch datos del mes actual
- Cálculos de totales y porcentajes
- Actualización automática de estadísticas

### IncomePage

**Ruta**: `/income`
**Tipo**: Protegida

**Propósito**: Gestión completa de ingresos recurrentes (salarios) e ingresos puntuales.

**Arquitectura de Pestaña**:
La página tiene dos pestañas principales:

#### **Pestaña 1: Ingresos Puntuales**
**Componentes**:
1. **Stats Summary** (4 tarjetas):
   - Total de Ingresos (cantidad)
   - Total Confirmado (cantidad)
   - Monto Total (suma)
   - Monto Confirmado (suma)
2. **Botón "Nuevo Ingreso"**: Abre formulario
3. **Formulario de Ingreso Puntual**:
   - Nombre (ej: "Ingreso extra", "Regalo")
   - Tipo: `extra` o `variable`
   - Frecuencia: `one-time`, `weekly`, o `monthly`
   - Monto
   - Moneda
   - Fecha
   - Cuenta (opcional)
   - Descripción
4. **Data Table**: Lista de ingresos con acciones (confirmar, editar, eliminar)

**Flujo de Ingresos Puntuales**:
1. Usuario hace click en "Nuevo Ingreso"
2. Completa formulario con datos del ingreso
3. Al guardar, se crea el ingreso (se marca automáticamente como confirmado)
4. Se muestra en la tabla lista para referencia
5. Usuario puede editar o eliminar

#### **Pestaña 2: Salarios Recurrentes**
**Componentes**:
1. **Stats Summary** (4 tarjetas):
   - Salarios Fijos (cantidad)
   - Salarios Promedio (cantidad)
   - Total Salario (suma)
   - Total Confirmado (cantidad de salarios confirmados)
2. **Tarjeta de Seguimiento de Promedio** (condicional):
   - Solo visible si hay salarios tipo "Promedio"
   - Muestra:
     - Promedio Esperado (monto total de salarios promedio del mes)
     - Ingresos Confirmados (suma de ingresos confirmados)
     - Diferencia (si falta, superado, etc.)
3. **Botón "Nueva Fuente de Salario"**: Abre formulario
4. **Formulario de Salario**:
   - Nombre de la Fuente (ej: "Trabajo en X", "Freelance habitual")
   - Tipo de Ingreso (radio/select):
     - **Fijo**: Monto exacto. Genera confirmaciones automáticas basadas en frecuencia y fecha de primer pago. Se asocia a una cuenta (opcional). El sistema usa esto para generar entradas pendientes.
     - **Promedio**: Monto promedio mensual. No genera confirmaciones automáticas. Sirve como índice de seguimiento. Se compara automáticamente con ingresos confirmados del mes.
   - Monto
   - Moneda
   - *Si es tipo Fijo*:
     - Frecuencia: `weekly` o `monthly`
     - Fecha de Primer Pago (referencia para calcular fechas futuras)
     - Cuenta Destino (opcional)
   - *Si es tipo Promedio*:
     - (Oculta frecuencia y fecha, no son necesarios)
   - Descripción (opcional)
5. **Data Table**: Lista de salarios con acciones (editar, eliminar)

**Flujo de Salarios Recurrentes**:

**Tipo Fijo**:
1. Usuario agrega salario tipo "Fijo" con monto, frecuencia y fecha de primer pago
2. Sistema genera automáticamente entradas pendientes en ingresos puntuales según la frecuencia
3. Usuario confirma cada recepción de salario en la tabla de ingresos
4. Stats actualizan automáticamente

**Tipo Promedio**:
1. Usuario agrega salario tipo "Promedio" con monto esperado
2. No se generan confirmaciones automáticas
3. Tarjeta de seguimiento calcula diferencia vs ingresos confirmados del mes
4. Útil para salarios variables o comisiones

**Implementación Técnica**:
- Los salarios se guardan como `type: 'fixed'` en la BD
- Se diferencian por prefijo en `description`:
  - `[FIJO] descripción` → Salario fijo (genera automáticas)
  - `[PROMEDIO] descripción` → Salario promedio (solo seguimiento)
- El frontend filtra y presenta visualmente estas distinciones
- `is_confirmed` se usa para rastrear confirmaciones de salarios fijos

**Interacciones**:
- `incomeService.getAll()` - para listar todos los ingresos
- `incomeService.create()` - para crear ingreso o salario
- `incomeService.update()` - para editar
- `incomeService.delete()` - para eliminar
- `incomeService.confirm()` - para confirmar recepción de salario
- `accountService.getAll()` - para mostrar cuentas disponibles
- `currencyService.getAll()` - para mostrar monedas

**Efectos**:
- Fetch inicial de ingresos, cuentas y monedas
- Separación de datos en función del tipo/descripción
- Cálculo dinámico de estadísticas según pestaña
- Tarjeta de promedio solo visible cuando aplica

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
3. **Panel de Filtros Completo**:
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
3. Tabla se reorganiza inmediatamente

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
- Filtrado dinámico por tipo de categoría
- Filtrado dinámico por rango de fechas (Mes/Año o personalizado)
- Ordenamiento en tiempo real sin refetch
- Cálculos de totales (necesario/innecesario) actualizados según filtros actuales
- Contador dinámico de gastos mostrados vs totales
- `expenseService.create()` - para crear gasto
- `expenseService.update()` - para editar gasto
- `expenseService.delete()` - para eliminar gasto
- `categoryService.getAll()` - para mostrar categorías
- `accountService.getAll()` - para mostrar cuentas
- `currencyService.getAll()` - para mostrar monedas

**Efectos**:
- Fetch inicial de gastos, categorías, cuentas y monedas
- Filtrado de gastos por tipo
- Cálculo de totales agrupados por categoría

### SavingsPage

**Ruta**: `/savings`
**Tipo**: Protegida

**Propósito**: Gestión de metas de ahorro y depósitos.

**Componentes**:
1. **Stats Summary**: Total metas, total ahorrado, meta total con progreso
2. **Acciones Rápidas**: Crear meta, crear depósito
3. **Formulario de Meta**: Nombre, monto, tipo, fecha, descripción
4. **Formulario de Depósito**: Meta, monto, fecha, descripción
5. **Data Tables**: Metas y depósitos con acciones

**Flujo Completo**:
1. **Listado**: Fetch de metas y depósitos
2. **Creación de Meta**: Formulario con tipo (mensual/global/personalizada)
3. **Creación de Depósito**: Asociar a meta existente
4. **Edición**: A través de acciones en las tablas
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
2. **Creación**: Formulario con nombre y tipo (necesario/innecesario)
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

### AccountPage

**Ruta**: `/accounts`
**Tipo**: Protegida

**Propósito**: Gestión de cuentas bancarias y efectivo.

**Componentes**:
1. **Stats Summary**: Total cuentas, balance total
2. **Formulario**: Crear/editar cuentas
3. **Tabla de Cuentas**: Nombre, tipo, balance, acciones
4. **Botones de Acción**: Añadir, editar, eliminar

**Flujo Completo**:
1. **Listado**: Fetch de cuentas con paginación
2. **Creación**: Formulario con nombre, tipo, balance, moneda
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

### SettingsPage

**Ruta**: `/settings`
**Tipo**: Protegida

**Propósito**: Configuración del perfil y preferencias.

**Componentes**:
1. **Perfil Personal**: Nombre, email (no editable)
2. **Configuración Financiera**: Salario, meta ahorro mensual
3. **Avatar**: Subida de imagen de perfil
4. **Zona de Peligro**: Eliminación de cuenta

**Flujo Completo**:
1. **Carga Inicial**: Fetch de datos del usuario y configuración
2. **Edición de Perfil**: Actualización de nombre
3. **Configuración Financiera**: Salario y meta de ahorro
4. **Subida de Avatar**: Selección y carga de imagen
5. **Eliminación de Cuenta**: Proceso de confirmación múltiple

**Interacciones**:
- `authService.updateProfile()` - para actualizar perfil
- `authService.uploadAvatar()` - para subir avatar
- `authService.deleteAccount()` - para eliminar cuenta
- `financialSettingService.getCurrent()` - para cargar configuración
- `financialSettingService.create()` - para crear configuración
- `financialSettingService.update()` - para actualizar configuración
- `useAuth.logout()` - para cerrar sesión tras eliminar cuenta

**Efectos**:
- Fetch inicial de datos del usuario y configuración
- Manejo de formularios separados
- Proceso de confirmación para eliminación de cuenta

## Interacciones Entre Páginas

### Navegación Principal
- **Dashboard** → Acciones rápidas llevan a Income/Expense/Savings
- **Sidebar** → Navegación accesible desde cualquier página protegida
- **Header** → Logout disponible en todas las páginas protegidas

### Flujo de Transacciones
- **IncomePage** → Puede crear ingresos que afectan Dashboard (stats)
- **ExpensePage** → Puede crear gastos que afectan Dashboard (stats) y Categorías
- **SavingsPage** → Puede crear metas/depositos que afectan Dashboard (stats)

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

### Actualización del 29 de Octubre de 2025

#### **IncomePage - Mejoras Significativas**

**Nuevas Características**:
1. ✅ **Sistema de Pestañas**: Separación clara entre Ingresos Puntuales y Salarios Recurrentes
2. ✅ **Gestión de Salarios Recurrentes**:
   - Tipo "Fijo": Con generación automática de confirmaciones
   - Tipo "Promedio": Para seguimiento sin confirmaciones automáticas
   - Sistema de prefijos en descripción para diferenciar (`[FIJO]` vs `[PROMEDIO]`)
3. ✅ **Tarjeta de Seguimiento de Promedio**: Muestra diferencia entre promedio esperado e ingresos confirmados
4. ✅ **Ingresos Extras Simplificados**: Se crean sin necesidad de confirmación manual
5. ✅ **Campos Dinámicos**: Formulario de salarios muestra/oculta campos según tipo

**Cambios Técnicos**:
- Los salarios se guardan como `type: 'fixed'` en BD pero se diferencian por prefijo en descripción
- Filtración inteligente en frontend para separar salarios de otros ingresos
- Cálculos automáticos de estadísticas por pestaña
- Manejo de frecuencia y fecha de primer pago solo para salarios fijos

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
- Lógica de filtración combinada (tipo + fecha + ordenamiento)
- Sorting en cliente para mejor UX (sin refetch del servidor)
- Almacenamiento de estado para cada filtro por separado
- Validación de rangos de fecha

#### **Mejoras Compartidas**

1. **Mejor Organización Visual**: Ambas páginas usan pestañas y secciones expandibles
2. **Stats Dinámicas**: Se actualizan según filtros actuales
3. **UX Consistente**: Estilos y patrones similares en ambas páginas
4. **Performance**: Filtración en cliente para respuesta inmediata

#### **Próximas Mejoras Sugeridas**

1. Guardar preferencias de filtro en localStorage
2. Exportar datos filtrados a CSV/PDF
3. Gráficos de tendencias en IncomePage (ingresos por mes)
4. Gráficos de gastos por categoría en ExpensePage
5. Alertas automáticas para salarios no confirmados
6. Sincronización automática con cambios en base de datos (WebSocket)

---
**Documentación actualizada el 29 de octubre de 2025**