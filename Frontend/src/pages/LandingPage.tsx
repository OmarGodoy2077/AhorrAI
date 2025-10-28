import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  Target, 
  BarChart3,
  Sparkles
} from 'lucide-react'

export const LandingPage = () => {
  const features = [
    {
      icon: Wallet,
      title: 'Gestión de Ingresos y Gastos',
      description: 'Registra y categoriza tus transacciones de forma sencilla',
    },
    {
      icon: PiggyBank,
      title: 'Metas de Ahorro',
      description: 'Define objetivos y rastrea tu progreso hacia ellos',
    },
    {
      icon: Target,
      title: 'Ahorro Mensual',
      description: 'Establece metas mensuales y monitorea tu cumplimiento',
    },
    {
      icon: BarChart3,
      title: 'Reportes Visuales',
      description: 'Visualiza tus finanzas con gráficos intuitivos',
    },
    {
      icon: TrendingUp,
      title: 'Seguimiento de Progresos',
      description: 'Observa cómo mejoran tus finanzas mes a mes',
    },
    {
      icon: Sparkles,
      title: 'Diseño Intuitivo',
      description: 'Interfaz moderna y fácil de usar para jóvenes',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">AhorraAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Toma control de tus
            <span className="text-primary"> finanzas</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            La aplicación de finanzas personales diseñada especialmente para estudiantes y jóvenes. 
            Ahorra de forma inteligente, alcanza tus metas y construye un futuro financiero sólido.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link to="/auth?mode=register">
              <Button size="lg" className="text-lg">
                Comenzar Gratis
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">¿Qué puedes hacer con AhorraAI?</h2>
          <p className="mt-2 text-muted-foreground">
            Todas las herramientas que necesitas para manejar tu dinero
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
            <h2 className="text-3xl font-bold">
              ¿Listo para mejorar tus finanzas?
            </h2>
            <p className="text-lg opacity-90">
              Únete a miles de jóvenes que ya están tomando control de su dinero
            </p>
            <Link to="/auth?mode=register">
              <Button size="lg" variant="secondary" className="text-lg">
                Crear cuenta gratuita
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 AhorraAI. Hecho con ❤️ para estudiantes y jóvenes.</p>
        </div>
      </footer>
    </div>
  )
}
