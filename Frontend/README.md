# AhorraAI Frontend

Frontend de la aplicación de finanzas personales **AhorraAI**, orientada a estudiantes y jóvenes para gestionar sus finanzas, establecer metas de ahorro y visualizar su progreso financiero.

## 🚀 Tecnologías Utilizadas

- **Framework**: React 18
- **Bundler**: Vite
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes UI**: Shadcn/ui (Radix UI + class-variance-authority)
- **Iconos**: Lucide React
- **Tema**: next-themes (Modo Día/Noche)
- **Animaciones**: tailwindcss-animate
- **Routing**: react-router-dom
- **HTTP Client**: Axios

## 📁 Estructura del Proyecto

```
Frontend/
├── public/              # Archivos estáticos
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── ui/         # Componentes base de Shadcn/ui
│   │   ├── auth/       # Componentes de autenticación
│   │   ├── MainLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ThemeToggle.tsx
│   ├── pages/          # Páginas de la aplicación
│   │   ├── LandingPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── IncomePage.tsx
│   │   ├── ExpensePage.tsx
│   │   ├── SavingsPage.tsx
│   │   ├── AccountPage.tsx
│   │   └── SettingsPage.tsx
│   ├── context/        # Contextos de React
│   │   └── AuthContext.tsx
│   ├── services/       # Servicios API
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── types/          # Tipos TypeScript
│   │   └── index.ts
│   ├── lib/            # Utilidades
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/               # Documentación
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
cd Frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura la URL del backend:

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Ejecutar el proyecto en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 5. Compilar para producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

### 6. Previsualizar compilación de producción

```bash
npm run preview
```

## 🎨 Sistema de Diseño

### Colores

La aplicación utiliza un sistema de colores basado en variables CSS definidas en `src/index.css`:

- **Modo Claro**: Colores claros con texto oscuro
- **Modo Oscuro**: Colores oscuros con texto claro

Los colores principales incluyen:
- `primary`: Color principal de la marca (azul)
- `secondary`: Color secundario
- `accent`: Color de acentos
- `destructive`: Color para acciones destructivas (rojo)
- `success`: Color de éxito (verde)
- `warning`: Color de advertencia (amarillo)

### Tipografía

- Fuente principal: **Inter** con fallback a fuentes del sistema
- Estilos responsivos y optimizados para legibilidad

### Componentes UI

Todos los componentes base provienen de **Shadcn/ui**:
- Button
- Card
- Input
- Label
- Switch
- Progress
- Y más...

## 🔐 Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para autenticación:

1. El usuario se registra o inicia sesión
2. El backend devuelve un token JWT
3. El token se almacena en `localStorage`
4. Todas las peticiones a endpoints protegidos incluyen el token en el header `Authorization`

### AuthContext

El `AuthContext` proporciona:
- `user`: Usuario actual
- `token`: Token JWT
- `isAuthenticated`: Estado de autenticación
- `isLoading`: Estado de carga
- `login()`: Función para iniciar sesión
- `register()`: Función para registrarse
- `logout()`: Función para cerrar sesión
- `updateUser()`: Actualizar datos del usuario

## 🛣️ Rutas

### Rutas Públicas
- `/` - Landing page
- `/auth` - Página de login/registro

### Rutas Protegidas
- `/onboarding` - Configuración inicial (nuevos usuarios)
- `/dashboard` - Dashboard principal
- `/income` - Gestión de ingresos
- `/expenses` - Gestión de gastos
- `/savings` - Metas de ahorro
- `/accounts` - Cuentas bancarias
- `/settings` - Configuración del usuario

## 🌐 Integración con Backend

### Configuración de API

El archivo `src/services/api.ts` configura axios con:
- Base URL del backend
- Interceptores para agregar el token JWT
- Manejo automático de errores 401 (token expirado)

### Servicios Disponibles

#### authService
- `register(data)` - Registrar nuevo usuario
- `login(credentials)` - Iniciar sesión
- `getProfile()` - Obtener perfil del usuario
- `updateProfile(data)` - Actualizar perfil
- `deleteAccount()` - Eliminar cuenta

## 📱 Características

### ✅ Implementadas
- Sistema de autenticación completo
- Tema claro/oscuro
- Dashboard con resumen financiero
- Navegación responsive con sidebar
- Rutas protegidas
- Manejo de errores

### 🚧 En Desarrollo
- Flujo de onboarding completo
- CRUD de ingresos
- CRUD de gastos
- Gestión de metas de ahorro
- Gestión de cuentas
- Reportes y gráficos
- Configuración de perfil

## 🎯 Flujo de Usuario

1. **Landing Page**: Usuario descubre la aplicación
2. **Registro/Login**: Crea cuenta o inicia sesión
3. **Onboarding** (nuevo usuario): Configura datos financieros iniciales
4. **Dashboard**: Ve resumen de sus finanzas
5. **Gestión**: Registra ingresos, gastos, ahorros
6. **Análisis**: Revisa reportes y progreso

## 🧪 Testing

```bash
# Ejecutar pruebas (cuando estén configuradas)
npm run test
```

## 📦 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Previsualizar build de producción
- `npm run lint` - Linter de código

## 🤝 Contribución

1. Crear una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commit de cambios: `git commit -am 'Agregar nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Desarrollado por

AhorraAI Team - 2025

---

**Nota**: Este proyecto está en desarrollo activo. Algunas funcionalidades pueden estar incompletas o en construcción.
