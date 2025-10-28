# Guía de Componentes - AhorraAI Frontend

Esta guía documenta los componentes principales de la aplicación AhorraAI.

## 📦 Componentes UI Base (Shadcn/ui)

Todos los componentes UI base están ubicados en `src/components/ui/` y están construidos sobre Radix UI.

### Button

Componente de botón con múltiples variantes y tamaños.

**Ubicación**: `src/components/ui/button.tsx`

**Props**:
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `asChild`: boolean - para usar como wrapper

**Ejemplo**:
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Guardar</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline" size="sm">Editar</Button>
```

### Card

Componente de tarjeta para contenedores de contenido.

**Ubicación**: `src/components/ui/card.tsx`

**Componentes**:
- `Card`: Contenedor principal
- `CardHeader`: Encabezado de la tarjeta
- `CardTitle`: Título
- `CardDescription`: Descripción
- `CardContent`: Contenido principal
- `CardFooter`: Pie de la tarjeta

**Ejemplo**:
```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Ingresos del Mes</CardTitle>
    <CardDescription>Total recibido</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Q 5,000.00</p>
  </CardContent>
</Card>
```

### Input

Componente de entrada de texto.

**Ubicación**: `src/components/ui/input.tsx`

**Props**: Todas las props nativas de `<input>`

**Ejemplo**:
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="tu@email.com"
  />
</div>
```

### Label

Componente de etiqueta para inputs.

**Ubicación**: `src/components/ui/label.tsx`

**Ejemplo**:
```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="username">Nombre de Usuario</Label>
```

### Switch

Componente de interruptor (toggle).

**Ubicación**: `src/components/ui/switch.tsx`

**Props**:
- `checked`: boolean
- `onCheckedChange`: (checked: boolean) => void

**Ejemplo**:
```tsx
import { Switch } from '@/components/ui/switch'

<Switch 
  checked={isDarkMode}
  onCheckedChange={setIsDarkMode}
/>
```

### Progress

Barra de progreso.

**Ubicación**: `src/components/ui/progress.tsx`

**Props**:
- `value`: number (0-100)

**Ejemplo**:
```tsx
import { Progress } from '@/components/ui/progress'

<Progress value={65} />
```

## 🔐 Componentes de Autenticación

### LoginForm

Formulario de inicio de sesión.

**Ubicación**: `src/components/auth/LoginForm.tsx`

**Funcionalidad**:
- Valida email y contraseña
- Llama a `login()` del AuthContext
- Redirige a `/dashboard` al éxito
- Muestra errores de autenticación

### RegisterForm

Formulario de registro de nuevos usuarios.

**Ubicación**: `src/components/auth/RegisterForm.tsx`

**Funcionalidad**:
- Solicita nombre completo, email, contraseña
- Valida que las contraseñas coincidan
- Llama a `register()` del AuthContext
- Redirige a `/onboarding` para nuevos usuarios

## 🎨 Componentes de Utilidad

### ThemeToggle

Interruptor para cambiar entre modo claro y oscuro.

**Ubicación**: `src/components/ThemeToggle.tsx`

**Dependencias**: `next-themes`

**Ejemplo**:
```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

<ThemeToggle />
```

### ProtectedRoute

HOC para proteger rutas que requieren autenticación.

**Ubicación**: `src/components/ProtectedRoute.tsx`

**Props**:
- `children`: ReactNode

**Funcionalidad**:
- Verifica si el usuario está autenticado
- Muestra loader mientras carga
- Redirige a `/auth` si no está autenticado

**Ejemplo**:
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'

<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

### MainLayout

Layout principal con sidebar y header.

**Ubicación**: `src/components/MainLayout.tsx`

**Características**:
- Sidebar responsive con navegación
- Header con nombre de usuario y logout
- Toggle de tema
- Menú mobile con overlay

**Navegación incluida**:
- Dashboard
- Ingresos
- Gastos
- Ahorros
- Cuentas
- Configuración

## 📄 Componentes de Página

### LandingPage

Página de inicio para usuarios no autenticados.

**Ubicación**: `src/pages/LandingPage.tsx`

**Secciones**:
- Hero con título y CTAs
- Features (características de la app)
- CTA final
- Footer

### AuthPage

Página que contiene login/registro.

**Ubicación**: `src/pages/AuthPage.tsx`

**Funcionalidad**:
- Muestra LoginForm o RegisterForm según query param
- Permite alternar entre ambos modos
- Redirige a dashboard si ya está autenticado

### DashboardPage

Dashboard principal de la aplicación.

**Ubicación**: `src/pages/DashboardPage.tsx`

**Componentes**:
- Cards con estadísticas (balance, ingresos, gastos, ahorros)
- Acciones rápidas (botones para agregar transacciones)
- Resumen mensual con barras de progreso

### OnboardingPage

Página de configuración inicial para nuevos usuarios.

**Ubicación**: `src/pages/OnboardingPage.tsx`

**Estado**: 🚧 En construcción

### IncomePage, ExpensePage, SavingsPage, AccountPage, SettingsPage

Páginas de gestión para diferentes módulos.

**Ubicaciones**: `src/pages/*.tsx`

**Estado**: 🚧 En construcción - Placeholders creados

## 🎨 Estilos y Temas

### Clases de utilidad comunes

```tsx
// Colores
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-destructive text-destructive-foreground
bg-success text-success-foreground

// Bordes
border border-border
rounded-lg rounded-md rounded-sm

// Espaciado
p-4 px-6 py-2
m-4 mx-auto my-6
gap-4 space-y-4

// Flexbox/Grid
flex items-center justify-between
grid grid-cols-2 lg:grid-cols-4

// Efectos
hover:bg-accent hover:shadow-lg
transition-all duration-300
animate-fade-in
```

## 🔧 Mejores Prácticas

1. **Usar componentes UI de Shadcn** en lugar de HTML nativo
2. **Importar tipos** con `import type` cuando sea posible
3. **Usar el helper `cn()`** para combinar clases de Tailwind
4. **Manejar estados de carga** con spinners y disabled states
5. **Mostrar errores** de forma clara al usuario
6. **Responsive design** - probar en mobile, tablet y desktop

## 📚 Recursos

- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
