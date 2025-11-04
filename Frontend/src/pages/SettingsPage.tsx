import { useState, useEffect } from 'react'
import { authService, financialSettingService, spendingLimitService, getErrorMessage } from '@/services'
import type { FinancialSetting, SpendingLimit } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContext'
import { useCurrency } from '@/context/CurrencyContext'
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { getTodayGuatemalaDate } from '@/lib/utils'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export const SettingsPage = () => {
  const { user, logout } = useAuth()
  const { currencies, defaultCurrency, setDefaultCurrency } = useCurrency()
  const { formatCurrency } = useFormatCurrency()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentSetting, setCurrentSetting] = useState<FinancialSetting | null>(null)
  const [currentSpendingLimit, setCurrentSpendingLimit] = useState<SpendingLimit | null>(null)
  const [spendingLimitForm, setSpendingLimitForm] = useState({
    limit_amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  })

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
  })

  const [financialForm, setFinancialForm] = useState({
    default_currency_id: '',
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    fetchCurrentFinancialSetting()
    fetchCurrentSpendingLimit()
    if (user) {
      setProfileForm({ full_name: user.full_name })
    }
  }, [user, currencies])

  useEffect(() => {
    if (defaultCurrency && !currentSetting) {
      // Only update if we don't have settings yet
      setFinancialForm(prev => ({
        ...prev,
        default_currency_id: defaultCurrency.id,
      }))
    }
  }, [defaultCurrency, currentSetting])

  const fetchCurrentFinancialSetting = async () => {
    if (currencies.length === 0) return;

    try {
      const setting = await financialSettingService.getCurrent()
      setCurrentSetting(setting)
      setFinancialForm({
        default_currency_id: setting.default_currency_id || '',
      })
      // Set default currency if exists
      if (setting.default_currency_id) {
        const currency = currencies.find(c => c.id === setting.default_currency_id)
        if (currency) {
          setDefaultCurrency(currency)
        }
      }
    } catch (error) {
      // No setting created yet, that's fine
      console.log('No financial setting found yet')
      setCurrentSetting(null)
      setFinancialForm({
        default_currency_id: defaultCurrency?.id || '',
      })
    }
  }

  const fetchCurrentSpendingLimit = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      const limit = await spendingLimitService.getForMonth(currentYear, currentMonth)
      setCurrentSpendingLimit(limit)
      if (limit) {
        setSpendingLimitForm({
          limit_amount: limit.limit_amount,
          year: limit.year,
          month: limit.month,
        })
      }
    } catch (error) {
      // No spending limit found, that's fine
      console.log('No spending limit found for current month')
      setCurrentSpendingLimit(null)
    }
  }

  const handleSpendingLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      setLoading(true)

      if (currentSpendingLimit) {
        await spendingLimitService.update(currentSpendingLimit.id, {
          limit_amount: spendingLimitForm.limit_amount,
        })
        setSuccess('Límite de gasto actualizado correctamente')
      } else {
        await spendingLimitService.create({
          limit_amount: spendingLimitForm.limit_amount,
          currency: defaultCurrency?.code || 'USD',
          year: spendingLimitForm.year,
          month: spendingLimitForm.month,
        })
        setSuccess('Límite de gasto creado correctamente')
        await fetchCurrentSpendingLimit()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSpendingLimit = async () => {
    if (!currentSpendingLimit) return
    if (!window.confirm('¿Eliminar el límite de gasto del mes actual?')) return

    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await spendingLimitService.delete(currentSpendingLimit.id)
      setSuccess('Límite de gasto eliminado correctamente')
      setCurrentSpendingLimit(null)
      setSpendingLimitForm({
        limit_amount: 0,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
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
          effective_date: getTodayGuatemalaDate(),
        })
        // Refresh to get the new setting
        await fetchCurrentFinancialSetting()
      }
      
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
          <CardDescription>Configura tu moneda por defecto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFinancialSubmit} className="space-y-4">
            <div>
              <Label htmlFor="default_currency">Moneda por Defecto</Label>
              <Select
                value={financialForm.default_currency_id || defaultCurrency?.id || (currencies.length > 0 ? currencies[0].id : '')}
                onValueChange={(value) => {
                  setFinancialForm(prev => ({ ...prev, default_currency_id: value }))
                  const currency = currencies.find(c => c.id === value)
                  if (currency) {
                    setDefaultCurrency(currency)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Moneda que se usará por defecto en toda la aplicación
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
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Límite de Gastos Mensuales
          </CardTitle>
          <CardDescription>
            Establece un límite de gastos para el mes actual y recibe alertas cuando te acerques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSpendingLimitSubmit} className="space-y-4">
            {currentSpendingLimit && (
              <div className="bg-muted/50 p-3 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Límite configurado</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Límite actual:</span>
                  <span className="font-semibold">{formatCurrency(currentSpendingLimit.limit_amount)}</span>
                </div>
                {currentSpendingLimit.current_spending !== undefined && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gastado:</span>
                      <span className="font-semibold">{formatCurrency(currentSpendingLimit.current_spending)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponible:</span>
                      <span className={`font-semibold ${currentSpendingLimit.limit_amount - currentSpendingLimit.current_spending < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(currentSpendingLimit.limit_amount - currentSpendingLimit.current_spending)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="limit_amount">Límite Mensual</Label>
              <Input
                id="limit_amount"
                type="number"
                step="0.01"
                min="0"
                value={spendingLimitForm.limit_amount}
                onChange={(e) =>
                  setSpendingLimitForm((prev) => ({ ...prev, limit_amount: parseFloat(e.target.value) || 0 }))
                }
                placeholder="Ej: 5000.00"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Monto máximo que deseas gastar este mes en {defaultCurrency?.code || 'tu moneda predeterminada'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading
                  ? 'Guardando...'
                  : currentSpendingLimit
                  ? 'Actualizar Límite'
                  : 'Establecer Límite'}
              </Button>
              {currentSpendingLimit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeleteSpendingLimit}
                  disabled={loading}
                  className="sm:w-auto"
                >
                  Eliminar Límite
                </Button>
              )}
            </div>
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
