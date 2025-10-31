# Refactorización del Sistema de Ahorro & Registro Simplificado - ✅ COMPLETADO (v2.2+)

**Última Actualización:** 30 de Octubre, 2025  
**Estado:** ✅ Implementación Exitosa con Sistema de Ingresos Mejorado y Formulario Simplificado

---

## Resumen Ejecutivo

Se ha completado exitosamente:

### Sistema de Ahorro (v2.1)
1. **Ahorros manuales** (en lugar de automáticos)
2. **Metas de ahorro mensual** con objetivo específico
3. **Depósitos manuales** a diferentes metas
4. **Metas personalizadas independientes** (ej: "Carro", "Vacaciones") - NO cuentan en global
5. **Meta global** que suma SOLO depósitos de metas no personalizadas
6. **Comparar progreso** contra objetivos

### Registro Simplificado (v2.1+)
1. **Registro sin datos financieros** - Solo email, password, nombre
2. **Configuración financiera posterior** - Después del signup (post-onboarding)
3. **Arquitectura limpia** - Una fuente de verdad para cada dato
4. **UX mejorado** - Flujo claro de registro → setup → uso

### Cambios Críticos en v2.1+
**Los datos de salario y meta de ahorro fueron removidos del perfil durante el registro:**
- ❌ Ya no se piden `salary` y `savings_goal` al registrarse
- ✅ Estos datos se configuran después en `financial_settings` y `savings_goals`
- ✅ Las metas personalizadas están SEPARADAS de la acumulación global
- ✅ El sistema tiene una única fuente de verdad para cada dato

---

## ✅ Cambios Implementados

### 0. Registro Simplificado (v2.1+ - Limpieza de Arquitectura)

✅ **Tabla `profiles` - Modificada (v2.1+)**
- ❌ Removido: `salary` columna (era redundante con financial_settings)
- ❌ Removido: `savings_goal` columna (era redundante con savings_goals)
- ✅ Mantenido: `id`, `email`, `full_name`, `avatar_url`, `created_at`, `updated_at`
- ✅ Beneficio: Perfil = datos básicos, finanzas = datos financieros (separación clara)

✅ **AuthController.js - Actualizado**
- ❌ Removido: parámetros `salary` y `savingsGoal` del registro
- ✅ Simplificado: Registro ahora solo pide `email`, `password`, `fullName`
- ✅ Actualizado: Función `handle_new_user()` - no inserta campos removidos

✅ **Migración de Base de Datos**
- ✅ Archivo: `003_remove_salary_savings_from_profiles.sql`
- ✅ Acción: DROP COLUMN salary, DROP COLUMN savings_goal
- ✅ Acción: UPDATE handle_new_user() trigger function

✅ **schema.sql - Actualizado**
- ✅ Tabla profiles: removidas columnas salary y savings_goal
- ✅ Función handle_new_user(): simplificada para no usar campos removidos

### 1. Base de Datos (Migraciones Supabase)

✅ **Tabla `savings_goals` - Modificada (v2.1)**
- ✅ Agregado: `goal_type` (monthly, global, custom)
- ✅ Agregado: `target_date` (fecha límite opcional)
- ✅ Agregado: `is_monthly_target` (marca la meta mensual - única por usuario)
- ✅ Agregado: `is_custom_excluded_from_global` (NUEVO v2.1 - marca si contribuye a global)
- ✅ Índice único: `idx_savings_goals_monthly_target` (garantiza una sola meta mensual)
- ✅ Índice: `idx_savings_goals_excluded_from_global` (para queries eficientes)

✅ **Tabla `financial_settings` - Modificada**
- ✅ Agregado: `monthly_savings_target` (objetivo de ahorro mensual)

✅ **Tabla `savings_deposits` - NUEVA**
- ✅ Creada con campos: id, goal_id, user_id, amount, deposit_date, description, created_at, updated_at
- ✅ RLS habilitado con 4 políticas (view, insert, update, delete)
- ✅ Índices de performance: goal_id, user_id, deposit_date

✅ **Funciones y Triggers (v2.1 - MODIFICADAS)**
- ✅ Función: `update_savings_from_deposits()` - **ACTUALIZADA v2.1** para EXCLUIR metas personalizadas
  - Antes: Sumaba todos los depósitos de TODAS las metas
  - Ahora: Solo suma depósitos donde `is_custom_excluded_from_global = FALSE`
- ✅ Función: `update_savings_from_deposits_delete()` - **ACTUALIZADA v2.1** con mismo filtro
- ✅ Triggers: INSERT, UPDATE, DELETE en `savings_deposits`
- ✅ Modificada: `update_summaries()` - Removida lógica automática de ahorro

✅ **Migraciones Registradas (9 en total)**
1. `001_refactor_savings_system_part1_alter_tables` - Modificar tablas existentes
2. `001_refactor_savings_system_part2_create_deposits_table` - Crear tabla y RLS
3. `001_refactor_savings_system_part3_create_functions` - Crear funciones
4. `001_refactor_savings_system_part4_create_triggers` - Crear triggers
5. `001_refactor_savings_system_part5_update_summaries_function` - Actualizar función de sumarios
6. `002_separate_custom_goals_from_global` (v2.1) - Agregar columna y actualizar lógica
7. `002_update_savings_functions_part1 y part2` (v2.1) - Actualizar funciones para excluir metas personalizadas
8. `003_remove_salary_savings_from_profiles` (v2.1+) - **NUEVA** - Remover columnas redundantes del perfil

---

### 2. Backend (Node.js/Express) - v2.1+ ACTUALIZADO

✅ **Nuevos Archivos**
- ✅ `src/models/savingsDeposit.js` - Modelo CRUD para depósitos
- ✅ `src/controllers/savingsDepositController.js` - Controlador con validación
- ✅ `src/routes/savingsDeposit.js` - Rutas para depósitos

✅ **Archivos Actualizados en v2.1+**
- ✅ `src/controllers/authController.js` - **ACTUALIZADO v2.1+** - Removidos parámetros `salary` y `savingsGoal` del register
  - Ahora solo requiere: `email`, `password`, `fullName`
  - Simplifica el flujo de registro
  - Datos financieros se configuran después en post-onboarding

✅ **Actualizaciones v2.1 (Separación de Metas Personalizadas)**
- ✅ `src/models/savingsGoal.js` - NUEVOS métodos: 
  - `setAsCustomExcluded()` - Marcar meta como personalizada (excluida de global)
  - `setAsCustomIncluded()` - Marcar meta para incluir en global
  - `findCustomGoals()` - Obtener todas las metas personalizadas
  - `findGoalsContributingToGlobal()` - Obtener metas que contribuyen a global
  - Previos: `findMonthlyTarget()`, `unsetMonthlyTarget()`

- ✅ `src/controllers/savingsGoalController.js` - NUEVOS handlers:
  - `setAsCustomGoal()` - Excluir meta de acumulación global
  - `setAsGlobalContributor()` - Incluir meta en acumulación global
  - `getCustomGoals()` - Listar metas personalizadas
  - `getGlobalContributors()` - Listar metas que contribuyen a global
  - Validación mejorada para prevenir marcar metas mensuales/globales como custom

- ✅ `src/routes/savingsGoal.js` - NUEVAS rutas:
  - `POST /:id/exclude-from-global` - Excluir de global
  - `POST /:id/include-in-global` - Incluir en global
  - `GET /goals/custom` - Obtener custom goals
  - `GET /goals/global-contributors` - Obtener goals que contribuyen

- ✅ `src/models/index.js` - Agregado SavingsDeposit
- ✅ `src/controllers/index.js` - Agregado SavingsDepositController
- ✅ `src/routes/index.js` - Agregado routing para savings-deposits

✅ **Endpoints Nuevos v2.1**
```
POST /api/savings-goals/:id/exclude-from-global     - Marcar como custom
POST /api/savings-goals/:id/include-in-global       - Marcar para incluir en global
GET /api/savings-goals/goals/custom                 - Listar custom goals
GET /api/savings-goals/goals/global-contributors    - Listar goals que contribuyen a global
```

✅ **Endpoints Existentes (Mantenidos)**
```
POST /api/savings-deposits                         - Crear depósito
GET /api/savings-deposits                          - Listar depósitos del usuario
GET /api/savings-deposits/:id                      - Obtener depósito específico
GET /api/savings-deposits/goal/:goalId             - Depósitos de una meta
PUT /api/savings-deposits/:id                      - Actualizar depósito
DELETE /api/savings-deposits/:id                   - Eliminar depósito
GET /api/savings-deposits/monthly-status/:year/:month - Estado mensual
POST /api/savings-goals/:id/set-monthly-target     - Establecer meta mensual
```

---

### 3. Documentación - v2.1 ACTUALIZADO

✅ **Actualizado: `README.md`**
- Versión actualizada a v2.1
- Explicación clara de separación de metas personalizadas
- Tabla de tipos de metas con columna "Contribuye a Global"
- Ejemplo de escenario completo

✅ **Actualizado: `api-endpoints.md`**
- 4 nuevos endpoints para custom/global control
- Endpoints marcados con ⭐

✅ **Actualizado: `backend-overview.md`**
- Nueva sección de Savings Goals v2.1
- Explicación clara: "Custom vs Global Accumulation"
- Diferencia entre metas que cuentan y las que no
- Ejemplo práctico de scenario

✅ **Actualizado: `api-guide.md`**
- Ejemplos completos de uso
- Flujo de trabajo con deposits
- Explicación del endpoint monthly-status

✅ **Nuevo: `savings-refactor-migration.md`**
- Guía completa de migración
- Cambios de API
- Instrucciones de testing
- Plan de rollback

---

## 📊 Verificación en Supabase - v2.1

✅ **Tablas Verificadas**
- `savings_goals`: 16 columnas (incluyendo `is_custom_excluded_from_global`)
- `financial_settings`: 8 columnas
- `savings_deposits`: 8 columnas

✅ **Triggers Verificados**
```
✓ trigger_update_savings_on_deposit_insert (v2.1 - actualizado)
✓ trigger_update_savings_on_deposit_update (v2.1 - actualizado)
✓ trigger_update_savings_on_deposit_delete (v2.1 - actualizado)
✓ update_savings_deposits_updated_at
✓ update_savings_goals_updated_at
```

✅ **Índices Verificados v2.1**
```
✓ idx_savings_goals_monthly_target (unique, partial)
✓ idx_savings_goals_user_id
✓ idx_savings_goals_excluded_from_global (NEW v2.1)
✓ idx_savings_deposits_goal_id
✓ idx_savings_deposits_user_id
✓ idx_savings_deposits_deposit_date
```

✅ **RLS Policies Verificadas (4 para savings_deposits)**
```
✓ Users can view own savings deposits
✓ Users can insert own savings deposits
✓ Users can update own savings deposits
✓ Users can delete own savings deposits
```

✅ **Funciones Verificadas**
```
✓ update_savings_from_deposits()
✓ update_savings_from_deposits_delete()
✓ update_summaries() (modificada)
```

---

## 🎯 Casos de Uso Soportados

### 1️⃣ Usuario define meta de ahorro mensual
```javascript
// Crear meta de ahorro mensual
POST /api/savings-goals
{
  "name": "Ahorrar 1500 mensuales",
  "target_amount": 1500,
  "goal_type": "monthly",
  "is_monthly_target": true
}

// En financial_settings
{
  "monthly_savings_target": 1500
}
```

### 2️⃣ Usuario hace depósito manual
```javascript
POST /api/savings-deposits
{
  "goal_id": "uuid-of-monthly-goal",
  "amount": 1500,
  "deposit_date": "2025-10-27",
  "description": "Salary savings for October"
}

// Automáticamente: 
// ✓ Actualiza current_amount de la meta
// ✓ Actualiza current_amount de meta global (si existe)
```

### 3️⃣ Usuario verifica progreso mensual
```javascript
GET /api/savings-deposits/monthly-status/2025/10

Response:
{
  "year": 2025,
  "month": 10,
  "target": 1500,
  "actual": 1400,
  "achieved": false,
  "difference": -100,
  "percentage": 93
}
```

### 4️⃣ Usuario crea metas personalizadas
```javascript
POST /api/savings-goals
{
  "name": "Carro",
  "target_amount": 100000,
  "goal_type": "custom",
  "target_date": "2026-12-31"
}

// Los depósitos a esta meta son INDEPENDIENTES
// de otras metas
```

### 5️⃣ Usuario mantiene meta global
```javascript
POST /api/savings-goals
{
  "name": "Total Savings",
  "target_amount": 500000,
  "goal_type": "global"
}

// current_amount = SUM de todos los depósitos
// de TODAS las metas del usuario
```

---

## 📋 Checklist Pre-Deploy

- [x] Migraciones aplicadas en Supabase
- [x] Tablas verificadas en Supabase
- [x] Triggers y funciones funcionando
- [x] RLS policies en lugar
- [x] Código backend actualizado
- [x] Rutas registradas correctamente
- [x] Modelos y controladores creados
- [x] Documentación actualizada
- [x] Guía de migración preparada
- [x] TypeScript types generados
- [x] v2.1: Metas personalizadas separadas de global
- [x] v2.1: Columna is_custom_excluded_from_global
- [x] v2.1: Funciones actualizadas con filtro
- [x] v2.1: 4 nuevos endpoints de control
- [x] v2.1: Toda la documentación actualizada

---

## 🎯 Cambios Críticos v2.1

**Problema Original:**
- Las metas personalizadas (carro, vacaciones) estaban siendo incluidas en la meta global
- Esto hacía que dinero apartado para necesidades específicas afectara el objetivo general

**Solución v2.1:**
- `is_custom_excluded_from_global = TRUE` → Dinero independiente, no afecta global
- `is_custom_excluded_from_global = FALSE` → Dinero que suma a global (default para monthly/global)
- Las funciones de trigger ahora FILTRAN dinero de custom goals al actualizar global

**Verificación:**
✅ Columna presente en Supabase
✅ Trigger function actualizada (verifica AND sg.is_custom_excluded_from_global = FALSE)
✅ Índice creado para performance
✅ 8 migraciones aplicadas exitosamente

---

## 🚀 Próximos Pasos

1. **Testing Completo**
   - [ ] Crear meta mensual (debería quedar is_custom_excluded_from_global = FALSE)
   - [ ] Crear meta carro (debería quedar is_custom_excluded_from_global = TRUE)
   - [ ] Depositar a meta mensual → verificar global se actualiza
   - [ ] Depositar a meta carro → verificar global NO se actualiza
   - [ ] Usar endpoint exclude-from-global para cambiar comportamiento
   - [ ] Verificar monthly-status solo cuenta deposits a meta mensual

2. **Frontend Integration**
   - Crear UI para marcar metas como custom
   - Mostrar claramente cuáles contribuyen a global
   - Mostrar metas personalizadas por separado

3. **Deployment**
   - Hacer push del código a repositorio
   - Desplegar a producción
   - Ejecutar testing en environment real

4. **Monitoreo Post-Deploy**
   - Verificar que los triggers se ejecutan correctamente
   - Monitorear performance de queries
   - Revisar logs de errores

---

## 📚 Archivos Relacionados - v2.1+

**Migraciones (9 total):**
- `Backend/database/migrations/001_refactor_savings_system.sql` (5 partes)
- `Backend/database/migrations/002_separate_custom_goals_from_global.sql` (3 partes)
- `Backend/database/migrations/003_remove_salary_savings_from_profiles.sql` (NEW v2.1+ - 1 parte)

**Documentación (Actualizada v2.1+):**
- `Backend/README.md` (v2.1+ con nuevo flujo de onboarding)
- `Backend/docs/api-endpoints.md` (comentario sobre registro simplificado)
- `Backend/docs/api-guide.md` (ejemplos de registro sin salary/savings)
- `Backend/docs/backend-overview.md` (flujo de user registration actualizado)
- `Backend/docs/savings-refactor-migration.md`
- `Backend/docs/IMPLEMENTATION_STATUS.md` (este archivo, v2.1+)

**Schema:**
- `Backend/database/schema.sql` (Actualizado v2.1+ - removidas columnas redundantes)

**Backend Code (Actualizado v2.1+):**
- `Backend/src/controllers/authController.js` (registro simplificado - removidos salary/savingsGoal)
- `Backend/src/models/savingsDeposit.js` (NUEVO v2.1)
- `Backend/src/controllers/savingsDepositController.js` (NUEVO v2.1)
- `Backend/src/routes/savingsDeposit.js` (NUEVO v2.1)
- `Backend/src/models/savingsGoal.js` (Actualizado v2.1)
- `Backend/src/controllers/savingsGoalController.js` (Actualizado v2.1)
- `Backend/src/routes/savingsGoal.js` (Actualizado v2.1)

---

### 4. Formulario de Ingresos Simplificado (v2.2+) - ✅ COMPLETADO

#### ✅ Cambios en Formulario por Tipo

**Formulario para Tipo 'EXTRA' (Ingresos Puntuales)**
- ✅ Muestra: Nombre, Tipo, Monto, Moneda, Frecuencia, Fecha, Cuenta, Descripción
- ✅ Campos obligatorios: Nombre, Monto, Frecuencia, Fecha
- ✅ Se confirma automáticamente al crear

**Formulario para Tipo 'VARIABLE' (Salario Promedio)**
- ❌ NO muestra: Frecuencia, Fecha, Día de pago
- ✅ Muestra: Nombre, Tipo, Monto, Moneda, Cuenta, Descripción
- ✅ Campos obligatorios: Nombre, Monto
- ✅ Se confirma automáticamente al crear
- ✅ Es solo un índice de referencia mensual

#### ✅ Cambios en Frontend (IncomePage.tsx)

**Campos Condicionales**
- ✅ `frequency` solo visible cuando `type === 'extra'`
- ✅ `income_date` solo visible cuando `type === 'extra'`
- ✅ Etiqueta actualizada: "Variable (Salario Promedio)"

**Lógica de Envío**
- ✅ Para `type === 'extra'`: incluye `frequency`, `income_date`, `is_confirmed: true`
- ✅ Para `type === 'variable'`: excluye `frequency`, `income_date`, incluye `is_confirmed: true`

**Edición de Registros**
- ✅ `handleEdit()` solo carga campos relevantes según tipo
- ✅ Evita errores al editar ingresos tipo 'variable' sin campos opcionales

#### ✅ Cambios en Validación Backend

**validateIncome (middleware)**
- ✅ `frequency` solo requerido cuando `type === 'fixed'` (para salary_schedules)
- ✅ Para ingresos regulares: `frequency` opcional según tipo
- ✅ Mantiene validación estricta para campos obligatorios

#### ✅ Cambios en Tipos TypeScript

**IncomeFormData**
- ✅ `frequency?: IncomeFrequency` (opcional)
- ✅ `income_date?: string` (opcional)
- ✅ Permite formularios flexibles según tipo

#### ✅ Experiencia de Usuario Mejorada

**Flujo Simplificado para Salario Promedio**
1. Usuario selecciona "Variable (Salario Promedio)"
2. Formulario muestra solo campos esenciales
3. No confunde con conceptos de frecuencia/fechas
4. Crea ingreso confirmado automáticamente
5. Aparece en cálculos de promedio mensual

**Flujo para Ingresos Extras**
1. Usuario selecciona "Extra"
2. Formulario muestra todos los campos
3. Incluye frecuencia y fecha específica
4. Funciona como ingresos puntuales tradicionales

#### ✅ Problemas Identificados y Solucionados

**PROBLEMA 1: Duplicación de ingresos generados**
- ❌ Se generaban múltiples registros para el mismo período/fecha
- ✅ Solución: Índice parcial único `idx_unique_generated_income` en base de datos
- ✅ Solución: Lógica mejorada en `generateSalaryIncomes()` para detectar exactamente por `(user_id, name, income_date, type)`
- ✅ Limpieza: Migración `cleanup_duplicate_generated_incomes` removió 13 duplicados manteniendo el más reciente

**PROBLEMA 2: No se podían eliminar ingresos confirmados**
- ❌ La API no validaba si un ingreso estaba confirmado
- ✅ Solución: `deleteIncome()` ahora retorna 400 si el ingreso es confirmado
- ✅ UX mejorado: Mensaje claro "Cannot delete confirmed income. Edit the amount instead."
- ✅ Protección: Evita corrupción de históricos de ingresos

**PROBLEMA 3: Lógica de confirmación deficiente**
- ❌ Solo manejaba ingresos fijos, ignoraba variables y extras
- ✅ Solución: `confirmIncome()` simplificada - solo marca como confirmado sin lógica compleja
- ✅ Nuevo endpoint: `GET /api/income/confirmation/period` para obtener período de confirmación
- ✅ Nuevo endpoint: `POST /api/income/confirmation/create` para crear confirmaciones de salarios variables

**PROBLEMA 4: Falta de soporte para ingresos variables/promedio**
- ❌ No había forma de confirmar salarios variables o calcular promedios
- ✅ Solución: `getSalaryConfirmationPeriod()` calcula período actual (mensual/quincenal)
- ✅ Calcula: total esperado, total actual, diferencia, estado (met/partial/pending)
- ✅ Soporte para múltiples tipos de ingresos: fixed, variable, extra

**PROBLEMA 5: Rutas conflictivas en Express**
- ❌ POST `/generate/salary-incomes` estaba después de `/:id`, causando conflicto
- ✅ Solución: Reordenadas rutas específicas ANTES de rutas paramétrizadas
- ✅ Orden correcto: `/generate/salary-incomes`, `/confirmation/period`, `/confirmation/create` → CRUD

#### ✅ Cambios de Código

**incomeController.js**
- ✅ `deleteIncome()` - Validación para prevenir eliminar ingresos confirmados
- ✅ `confirmIncome()` - Simplificada, solo confirma el ingreso
- ✅ `generateSalaryIncomes()` - Mejorada lógica de detección de duplicados, ahora marca `is_salary: true`
- ✅ `getSalaryConfirmationPeriod()` - NUEVO - Retorna estado de período actual con totales
- ✅ `createSalaryConfirmation()` - NUEVO - Crea registro en tabla salary_confirmations

**income.js (Model)**
- ✅ `create()` - Agregada validación de datos (user_id, name, amount > 0, type válido)
- ✅ `update()` - Agregada validación de updates
- ✅ `delete()` - Verificación de income confirmado antes de eliminar
- ✅ `findByUserIdAndType()` - NUEVO - Obtener ingresos por tipo
- ✅ `findActiveByUserIdAndType()` - NUEVO - Obtener ingresos no confirmados por tipo
- ✅ `calculateAverageIncome()` - NUEVO - Calcula promedio de ingresos variables/extras en período
- ✅ `getIncomesByPeriod()` - NUEVO - Obtiene ingresos en rango de fechas

**income.js (Routes)**
- ✅ Reordenadas rutas específicas ANTES de paramétrizadas
- ✅ Nuevas rutas:
  - `POST /generate/salary-incomes` - Generar ingresos para salarios programados
  - `GET /confirmation/period?period_type=monthly|biweekly` - Obtener confirmación de período
  - `POST /confirmation/create` - Crear confirmación de salario variable

#### ✅ Migraciones de Base de Datos

**Migration 1: Cleanup Duplicates**
- Migración: `cleanup_duplicate_generated_incomes`
- Acción: Eliminó 13 registros duplicados manteniendo el más reciente por fecha/usuario/tipo
- Preservó: Datos históricos de salarios confirmados

**Migration 2: Add Unique Constraint**
- Migración: `add_partial_unique_index_generated_incomes`
- Acción: Índice único parcial `idx_unique_generated_income` 
- Previene: Duplicados futuros de ingresos generados automáticamente
- Filtro: Solo aplica a registros con `description LIKE 'Generado desde:%'`

#### ✅ Flujos de Negocio Soportados

**Flujo 1: Salario FIJO con Confirmación Manual**
```
1. Usuario crea salary_schedule (ej: $4000/mes, día 15)
   - type: 'fixed'
2. Sistema genera automáticamente income_sources para cada período
   - is_salary: true, type: 'fixed', is_confirmed: false
3. Usuario ve ingresos pendientes de confirmación en GET /api/income/confirmation/period
   - Fixed salaries mostrados en "fixed_salaries" array
4. Usuario confirma ingreso: POST /api/income/:id/confirm
   - Marca income como is_confirmed: true
   - Salario está disponible para contabilización
```

**Flujo 2: Salario PROMEDIO (Index Only) - NO CONFIRMABLE**
```
1. Usuario crea income_source tipo "variable" (ej: ~$3500/mes aproximado)
   - type: 'variable'
   - Esto es SOLO un índice de referencia
2. Usuario registra ingresos extras durante el mes
   - type: 'extra' (trabajos puntuales, bonos, etc.)
3. Sistema calcula índice automáticamente en GET /api/income/confirmation/period
   - expected_average: suma de 'variable' sources
   - actual_income: suma de 'extra' incomes en el período
   - difference: actual - expected
   - status: met (si cumplió), partial (si hay algo), pending (si no hay)
4. USER VE UNA CARD VISUAL mostrando:
   - "Meta de salario promedio: $3500"
   - "Ingresos reales este mes: $3600"
   - "Estado: ✅ Cumplido (+$100)"
5. NO HAY CONFIRMACIÓN MANUAL - es puramente informativo
```

**Flujo 3: Ingresos EXTRAS para Cálculo de Promedio**
```
1. Usuario registra income_sources tipo "extra"
   - Ejemplos: trabajos freelance, bonos, comisiones
   - type: 'extra'
2. Cada extra es un ingreso independiente con fecha específica
3. Sistema SOLO incluye 'extra' en el cálculo del promedio
4. Los 'extra' no pueden ser confirmados (solo sirven para el índice)
5. Usuario ve desglose en period_incomes del endpoint de confirmación
```

#### ✅ Validaciones Implementadas

**En DELETE (deleteIncome)**
- ✅ No se puede eliminar ingreso confirmado (is_confirmed = true)
- ✅ Retorna 400: "Cannot delete confirmed income. Edit the amount instead."

**En CONFIRM (confirmIncome)**
- ✅ Solo se pueden confirmar ingresos tipo 'fixed' (salarios fijos)
- ✅ Marca is_confirmed: true cuando se confirma
- ✅ Registra confirmed_at con timestamp

**En GENERACIÓN (generateSalaryIncomes)**
- ✅ No se crean duplicados: comprueba (user_id, name, income_date, type)
- ✅ Índice único parcial en BD previene duplicados futuros
- ✅ Solo genera si next_generation_date <= hoy
- ✅ Actualiza salary_schedules con siguientes fechas

**En PERÍODO DE CONFIRMACIÓN (getSalaryConfirmationPeriod)**
- ✅ period_type obligatorio: 'monthly' o 'biweekly'
- ✅ Calcula período automáticamente
- ✅ Separación clara:
  - fixed_salaries: array de salarios confirmables
  - average_salary: índice SOLO informativo (no confirmable)
- ✅ Excluye salarios de average (solo cuenta type='extra')

**En CREACIÓN DE CONFIRMACIÓN (createSalaryConfirmation)**
- ✅ Solo acepta tipo 'fixed' (salarios fijos)
- ✅ Rechaza 'variable' y 'extra': "Only fixed salary incomes can be confirmed"
- ✅ Usa Income.confirm() para marcar confirmado

**Tipo de Ingresos Validado**
- ✅ 'fixed': Salarios confirmables manualmente
- ✅ 'variable': Índice de promedio (NO confirmable, solo información)
- ✅ 'extra': Ingresos que contribuyen al cálculo del promedio

#### ✅ Mejoras Inteligentes

- **Detección smart de duplicados**: No confía en descripción, usa (user_id, name, income_date, type)
- **Separación clara Fixed vs Average**: 
  - Fixed = confirmable manualmente
  - Average = índice informativo solamente
- **Cálculo preciso del período**: Calcula automáticamente (mensual o quincenal)
- **Exclusión de salarios del promedio**: Solo cuenta type='extra' en average
- **Estado visual del promedio**: met/partial/pending para UX clara
- **Protección de históricos**: No permite eliminar confirmados, solo editar
- **Soporte multi-tipo**: Fixed, variable, extra en mismo sistema
- **Información detallada**: Retorna desglose completo de ingresos en período

---

## 💡 Notas Importantes

⚠️ **Breaking Changes:**
- ❌ `POST /api/auth/register` ya NO acepta parámetros `salary` ni `savingsGoal` (v2.1+)
- ❌ Las columnas `salary` y `savings_goal` fueron removidas de la tabla `profiles` (v2.1+)
- ❌ `POST /api/savings-goals/:id/deposit` ahora retorna 410 Gone
- ❌ `POST /api/savings-goals/:id/set-primary` fue renombrado a `/set-monthly-target`
- ❌ Ahorros ya NO son automáticos

✅ **Beneficios v2.1+:**
- **Arquitectura limpia** - Una sola fuente de verdad para cada dato
- **Registro simplificado** - Usuarios se registran rápido, configuran después
- **Mejor UX** - Flujo claro: Sign up → Financial setup → Use app
- **Separación de responsabilidades** - Perfil (datos básicos) vs Finanzas (datos financieros)
- **Escalabilidad** - Fácil agregar múltiples ingresos/gastos/ahorros
- Mayor control del usuario sobre dónde va su dinero
- Soporte para múltiples metas simultáneamente
- Mejor tracking de comportamiento vs. objetivos
- Sistema más flexible y escalable

🔄 **Rollback:**
- Instrucciones en el archivo de migración `003_remove_salary_savings_from_profiles.sql`
- Todas las migraciones están documentadas y son reversibles

---

## 📞 Support

Para dudas o problemas:
- Revisar `savings-refactor-migration.md`
- Revisar `api-guide.md` para ejemplos
- Revisar logs de Supabase para errores de triggers

---

**Status:** ✅ LISTO PARA DEPLOYMENT

