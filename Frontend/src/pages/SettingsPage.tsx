import { useState, useEffect } from 'react'
import { authService, financialSettingService, getErrorMessage } from '@/services'
import type { FinancialSetting } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

export const SettingsPage = () => {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentSetting, setCurrentSetting] = useState<FinancialSetting | null>(null)

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
  })

  const [financialForm, setFinancialForm] = useState({
    salary: 0,
    monthly_savings_target: 0,
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    fetchCurrentFinancialSetting()
    if (user) {
      setProfileForm({ full_name: user.full_name })
    }
  }, [user])

  const fetchCurrentFinancialSetting = async () => {
    try {
      const setting = await financialSettingService.getCurrent()
      setCurrentSetting(setting)
      setFinancialForm({
        salary: setting.salary || 0,
        monthly_savings_target: setting.monthly_savings_target || 0,
      })
    } catch {
      // No setting created yet
      console.log('No financial setting found')
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await authService.updateProfile({ full_name: profileForm.full_name })
      setSuccess('Perfil actualizado correctamente')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      setLoading(true)
      if (currentSetting) {
        await financialSettingService.update(currentSetting.id, financialForm)
      } else {
        await financialSettingService.create({
          ...financialForm,
          effective_date: new Date().toISOString().split('T')[0],
        })
      }
      await fetchCurrentFinancialSetting()
      setSuccess('Configuración financiera actualizada')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarFile) return

    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await authService.uploadAvatar(avatarFile)
      setAvatarFile(null)
      setSuccess('Avatar actualizado correctamente')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return
    if (!window.confirm('Escribe "CONFIRMAR" para eliminar tu cuenta permanentemente.')) return

    try {
      setError('')
      await authService.deleteAccount()
      logout()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu perfil y configuración de la aplicación
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información de Perfil</CardTitle>
          <CardDescription>Actualiza tu información personal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">No se puede cambiar</p>
            </div>

            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración Financiera</CardTitle>
          <CardDescription>Establece tu salario y meta de ahorro mensual</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFinancialSubmit} className="space-y-4">
            <div>
              <Label htmlFor="salary">Salario Mensual</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={financialForm.salary}
                onChange={(e) =>
                  setFinancialForm({
                    ...financialForm,
                    salary: parseFloat(e.target.value),
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se utiliza para calcular el rendimiento
              </p>
            </div>

            <div>
              <Label htmlFor="monthly_savings_target">Meta de Ahorro Mensual</Label>
              <Input
                id="monthly_savings_target"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={financialForm.monthly_savings_target}
                onChange={(e) =>
                  setFinancialForm({
                    ...financialForm,
                    monthly_savings_target: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cantidad que deseas ahorrar cada mes
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Sube una foto de perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAvatarUpload} className="space-y-4">
            <div>
              <Label htmlFor="avatar">Seleccionar imagen</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 5MB. Formatos: JPG, PNG, GIF
              </p>
            </div>

            <Button type="submit" disabled={loading || !avatarFile}>
              {loading ? 'Subiendo...' : 'Subir Avatar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Eliminar Cuenta</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                Eliminar Mi Cuenta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
