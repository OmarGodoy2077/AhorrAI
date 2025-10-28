# Guía de Diseño y Frontend: Sorare Basic

Este documento detalla la arquitectura de frontend, el sistema de diseño, las animaciones y las características principales de la aplicación Sorare Basic. El objetivo es servir como una guía completa para entender y replicar el diseño y la funcionalidad.

## 1. Stack Tecnológico Principal

La aplicación está construida sobre un stack moderno de JavaScript y TypeScript, enfocado en la eficiencia y una experiencia de desarrollo ágil.

-   **Framework Principal**: React 18
-   **Bundler**: Vite
-   **Lenguaje**: TypeScript
-   **Estilos**: Tailwind CSS
-   **Componentes UI**: Shadcn/ui (utilizando Radix UI y `class-variance-authority`)
-   **Iconos**: Lucide React (`lucide-react`)
-   **Gestión de Tema (Modo Día/Noche)**: `next-themes`
-   **Animaciones**: `tailwindcss-animate`
-   **Routing**: `react-router-dom`

## 2. Sistema de Diseño (Design System)

El sistema de diseño se gestiona principalmente a través de `tailwind.config.ts` y se apoya en las convenciones de Shadcn/ui.

### 2.1. Colores

Los colores se definen como variables CSS en `src/index.css` y se referencian en la configuración de Tailwind. Esto permite un theming dinámico (modos claro y oscuro) simplemente cambiando las variables.

La paleta se define en `tailwind.config.ts` usando la sintaxis `hsl(var(--variable))`:

```typescript
// tailwind.config.ts
colors: {
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))'
    },
    secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))'
    },
    // ... y más
},
```

### 2.2. Tipografía

La fuente principal es **Inter**, con un fallback a fuentes del sistema para una apariencia nativa.

```typescript
// tailwind.config.ts
fontFamily: {
    'inter': ['Inter', 'sans-serif'],
    'apple': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
    'sans': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
},
```

### 2.3. Bordes y Espaciado

El radio de los bordes (`borderRadius`) también se define con variables CSS para consistencia.

```typescript
// tailwind.config.ts
borderRadius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)'
},
```

## 3. Modo Día y Noche (Theming)

El cambio de tema es gestionado por la librería `next-themes`.

### 3.1. Configuración

En `tailwind.config.ts`, se especifica que el modo oscuro se activará cuando la clase `.dark` esté presente en un elemento padre (generalmente `<html>`).

```typescript
// tailwind.config.ts
export default {
	darkMode: ["class"],
    // ...
}
```

### 3.2. Proveedor de Tema

En `src/App.tsx`, el componente `ThemeProvider` de `next-themes` envuelve toda la aplicación. Se configura para que añada una `class` al HTML, con el tema oscuro (`dark`) como predeterminado.

```tsx
// src/App.tsx
import { ThemeProvider } from "next-themes";

const App = () => (
  // ...
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    {/* ... resto de la aplicación */}
  </ThemeProvider>
  // ...
);
```

### 3.3. Componente de Cambio de Tema

El componente `src/components/ThemeToggle.tsx` contiene la lógica para cambiar el tema.

-   Usa el hook `useTheme()` para obtener el tema actual y la función `setTheme`.
-   Renderiza un componente `Switch` de Shadcn/ui.
-   Cuando el switch se activa/desactiva, llama a `setTheme('dark')` o `setTheme('light')`, lo que provoca que `next-themes` añada o quite la clase `.dark` del `<html>`, y Tailwind CSS aplica los estilos correspondientes (`dark:*`).

```tsx
// src/components/ThemeToggle.tsx
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun /* ... */ />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon /* ... */ />
    </div>
  );
};
```

## 4. Estructura y Componentes Notables

La interfaz se construye de forma modular utilizando componentes reutilizables.

-   **`src/pages/Index.tsx`**: Es la página de inicio que renderiza el componente principal `SorareBasicLanding`.
-   **`src/components/SorareBasicLanding.tsx`**: Contiene la maquetación principal de la página de inicio, incluyendo:
    -   Una barra de navegación superior pegajosa (`sticky`).
    -   Una sección "Hero" con el título principal.
    -   Una grilla de "Essential Sorare Tools" generada dinámicamente a partir de `src/data/tools.ts`.
    -   Una grilla de tarjetas de "Community Content".
-   **`src/components/ToolCard.tsx`**: Un componente de tarjeta reutilizable que muestra una herramienta con su ícono, nombre, descripción y un enlace. Incluye un estado para marcar como favorito.
-   **`src/components/ui/`**: Este directorio contiene los componentes base de Shadcn/ui (Button, Card, Switch, etc.), que son los bloques de construcción para todos los elementos interactivos.

## 5. Animaciones y Transiciones

Las animaciones son sutiles y se gestionan a través de Tailwind CSS y el plugin `tailwindcss-animate`.

### 5.1. Keyframes y Clases de Animación

Se definen animaciones personalizadas en `tailwind.config.ts` para componentes como los acordeones.

```typescript
// tailwind.config.ts
keyframes: {
    'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
    'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } }
},
animation: {
    'accordion-down': 'accordion-down 0.2s ease-out',
    'accordion-up': 'accordion-up 0.2s ease-out'
}
```

### 5.2. Transiciones en Hover

Las tarjetas y otros elementos interactivos usan utilidades de transición de Tailwind para efectos suaves en el estado `hover`.

Ejemplo en `SorareBasicLanding.tsx` para las tarjetas de comunidad:
```html
<div class="group bg-card ... hover:shadow-xl transition-all duration-500 ... hover:-translate-y-1">
    ...
</div>
```
-   `transition-all duration-500`: Aplica una transición a todas las propiedades durante 500ms.
-   `hover:shadow-xl`: Aumenta la sombra en hover.
-   `hover:-translate-y-1`: Mueve la tarjeta ligeramente hacia arriba en hover.

## 6. Características de Frontend

-   **Lista de Herramientas Dinámica**: Las tarjetas de herramientas se renderizan a partir de un array de objetos en `src/data/tools.ts`, lo que facilita añadir o modificar herramientas.
-   **Favoritos con Persistencia**: En `SorareBasicLanding.tsx`, se utiliza `useState` y `useEffect` con `localStorage` para permitir a los usuarios marcar herramientas como favoritas y que esta selección persista entre visitas.
-   **Carga Diferida (Lazy Loading)**: El componente `LazyMatchCalendar` sugiere que los componentes más pesados se cargan de forma diferida para mejorar el rendimiento inicial de la página.
-   **Diseño Responsivo**: El uso de clases responsivas de Tailwind (como `sm:`, `lg:`, `grid-cols-1 sm:grid-cols-2`) asegura que la aplicación se vea bien en todos los tamaños de pantalla.
