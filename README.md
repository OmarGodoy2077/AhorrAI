# AhorraAI - Plataforma de Finanzas Personales

**AhorraAI** es una plataforma integral de finanzas personales orientada a estudiantes y jóvenes para gestionar sus finanzas, establecer metas de ahorro y visualizar su progreso financiero. La aplicación permite un seguimiento detallado de ingresos, gastos y metas de ahorro con un sistema de reportes intuitivo.

## 🌟 Características Principales

### Backend
- **API RESTful** con autenticación JWT
- **Base de datos PostgreSQL** con Supabase y seguridad a nivel de fila (RLS)
- **Gestión de usuarios** con perfiles, ingresos, gastos y ahorros
- **Sistema de ahorro** con metas manuales (mensuales, globales y personalizadas)
- **Control de gastos** con categorías jerárquicas
- **Gestión de préstamos** con seguimiento de balances
- **Resúmenes financieros** mensuales y anuales
- **Límites de gasto** mensuales por categorías
- **Soporte multi-divisas** para ingresos y gastos

### Frontend
- **Interfaz moderna** con React y TypeScript
- **Diseño responsive** compatible con dispositivos móviles y escritorio
- **Tema claro/oscuro** para una experiencia visual cómoda
- **Navegación intuitiva** con sidebar y rutas protegidas
- **Componentes UI reutilizables** con Shadcn/ui y Tailwind CSS
- **Integración con backend** para gestión completa de datos financieros
- **Experiencia de usuario** optimizada con flujos de onboarding

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** y **Express.js** para el servidor
- **Supabase PostgreSQL** como base de datos principal
- **JWT** para autenticación
- **Bcrypt.js** para hashing de contraseñas
- **Express-validator** para validación de entradas
- **Morgan** para logging de peticiones
- **Cloudinary** para subida de archivos

### Frontend
- **React 19** como framework principal
- **TypeScript** para tipado seguro
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Shadcn/ui** y **Radix UI** para componentes accesibles
- **Axios** para peticiones HTTP
- **React Router DOM** para navegación
- **Lucide React** para iconos

## 📁 Estructura del Proyecto

```
AhorrAI/
├── Backend/              # Servidor backend con API
│   ├── docs/            # Documentación del backend
│   ├── src/             # Código fuente del backend
│   │   ├── controllers/ # Controladores de API
│   │   ├── models/      # Modelos de base de datos
│   │   ├── routes/      # Definiciones de rutas
│   │   ├── middleware/  # Middleware de autenticación y validación
│   │   └── utils/       # Utilidades
│   ├── package.json
│   └── .env.example
├── Frontend/             # Aplicación frontend
│   ├── docs/            # Documentación del frontend
│   ├── public/          # Archivos estáticos
│   ├── src/             # Código fuente del frontend
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas de la aplicación
│   │   ├── context/     # Contextos de React
│   │   ├── services/    # Servicios API
│   │   ├── types/       # Tipos TypeScript
│   │   └── lib/         # Utilidades
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- Cuenta en **Supabase** para la base de datos

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd AhorrAI
```

### 2. Configurar el Backend

```bash
cd Backend
```

#### Instalar dependencias:
```bash
npm install
```

#### Configurar variables de entorno:
Copia el archivo `.env.example` a `.env` y configura las variables:
```bash
cp .env.example .env
```

Edita `.env` con tus propias variables:
```env
SUPABASE_URL=Tu_Url_Supabase
SUPABASE_ANON_KEY=Tu_Clave_Anonima_Supabase
JWT_SECRET=Tu_Secret_JWT
```

#### Iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### 3. Configurar el Frontend

En una nueva terminal, navega al directorio Frontend:

```bash
cd Frontend
```

#### Instalar dependencias:
```bash
npm install
```

#### Configurar variables de entorno:
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` para apuntar al backend:
```env
VITE_API_URL=http://localhost:3000/api
```

#### Iniciar la aplicación en modo desarrollo:
```bash
npm run dev
```

La aplicación frontend estará disponible en `http://localhost:5173`

## 🎯 Funcionalidades Clave

### Gestión de Usuarios
- Registro e inicio de sesión seguro
- Perfiles de usuarios con información básica
- Actualización de datos personales

### Sistema de Ahorros
- **Metas de ahorro** de tres tipos: mensuales, globales y personalizadas
- **Depósitos manuales** en lugar de ahorros automáticos
- Seguimiento del progreso hacia metas
- Control de metas mensuales vs. objetivo real

### Gestión de Ingresos
- Registro de fuentes de ingresos (fijos, variables, extra)
- Confirmación de recepción de ingresos
- Soporte multi-divisa
- Actualización automática de balances

### Control de Gastos
- Categorización jerárquica de gastos (necesarios/innecesarios)
- Registro detallado con fechas y montos
- Límites de gasto mensuales
- Seguimiento de gastos por categorías

### Manejo de Cuentas
- Seguimiento de múltiples cuentas (efectivo, bancos, plataformas)
- Balance automático basado en ingresos/gastos
- Soporte multi-divisa

### Resúmenes Financieros
- Resúmenes mensuales detallados
- Acumulados anuales
- Visualización de tendencias
- Reportes financieros automáticos

### Gestión de Préstamos
- Registro de préstamos con intereses
- Seguimiento de balances pendientes
- Control de estado (activo, pagado, etc.)

## 📱 Flujo de Usuario

1. **Página Principal**: El usuario descubre la aplicación
2. **Registro/Inicio de Sesión**: Creación de cuenta o acceso
3. **Configuración Inicial** (usuarios nuevos): Configuración de datos financieros básicos
4. **Dashboard Principal**: Vista general de las finanzas
5. **Gestión Financiera**: Registro de ingresos, gastos y ahorros
6. **Análisis y Reportes**: Revisión de resúmenes y progreso

## 💼 Base de Datos (Supabase)

### Tablas Principales
- `profiles`: Perfiles de usuarios
- `financial_settings`: Configuración financiera (salario, objetivos de ahorro)
- `income_sources`: Fuentes de ingresos
- `expenses`: Registro de gastos
- `accounts`: Cuentas bancarias y de efectivo
- `categories`: Categorías jerárquicas para gastos
- `monthly_summaries`: Resúmenes financieros mensuales
- `yearly_summaries`: Resúmenes financieros anuales
- `loans`: Préstamos personales
- `currencies`: Monedas soportadas
- `savings_goals`: Metas de ahorro (mensuales, globales, personalizadas)
- `savings_deposits`: Depósitos manuales a metas de ahorro
- `spending_limits`: Límites de gasto mensuales

## 🔐 Seguridad

- **Autenticación JWT**: Tokens para acceso a endpoints protegidos
- **Seguridad a nivel de fila (RLS)**: Usuarios solo acceden a sus propios datos
- **Validación de entradas**: Todos los inputs son validados
- **Hashing de contraseñas**: Con bcrypt.js
- **Cabeceras de seguridad**: Con Helmet.js

## 🧪 Pruebas

### Backend
```bash
npm test
```

### Frontend
```bash
npm run test
```

## 🚀 Despliegue

### Backend
1. Configura tus variables de entorno en el servidor
2. Ejecuta `npm install --production` para instalar solo dependencias de producción
3. Inicia el servidor con `npm start`

### Frontend
1. Ejecuta `npm run build` para generar la versión de producción
2. Sirve los archivos estáticos desde la carpeta `dist/`
3. Asegúrate de configurar correctamente la variable de entorno para la URL del backend

## 🤝 Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y haz commit: `git commit -m 'Agregar nueva funcionalidad'`
3. Haz push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request

### Guía de Estilo
- Sigue las convenciones de nomenclatura existentes
- Escribe código TypeScript limpio y documentado
- Asegúrate de que todas las pruebas pasen antes de hacer commit
- Incluye documentación para nuevas funcionalidades en los directorios `docs/`

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Desarrollado por

AhorraAI Team - 2025

---

**Nota**: Este proyecto está en desarrollo activo. Algunas funcionalidades pueden estar incompletas o en construcción. Para más detalles sobre el estado actual del proyecto, revisa los archivos `BACKEND_STATUS.md` y `FRONTEND_STATUS.md` en los directorios correspondientes.