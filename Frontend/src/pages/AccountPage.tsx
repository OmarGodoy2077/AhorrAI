import { useState, useEffect } from 'react'
import { accountService, currencyService, getErrorMessage } from '@/services'
import type { Account, AccountType, Currency } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { useToast } from '@/components/ui/toast'
import { Trash2, Edit, Plus } from 'lucide-react'

export const AccountPage = () => {
  const { formatCurrency, defaultCurrency } = useFormatCurrency()
  const { success, error: showError } = useToast()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as AccountType,
    balance: 0,
    currency_id: defaultCurrency?.id || '',
    description: '',
  })

  const fetchAccounts = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError('')
      const response = await accountService.getAll({
        page: pageNum,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      // Filter out virtual accounts from the main accounts list
      const realAccounts = response.data.filter(account => !account.is_virtual_account)
      setAccounts(realAccounts)
      setTotal(response.total ? response.total - (response.data.length - realAccounts.length) : 0)
      setPage(pageNum)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrencies = async () => {
    try {
      const currencies = await currencyService.getAll()
      setCurrencies(currencies)
      if (currencies.length > 0 && !formData.currency_id) {
        setFormData(prev => ({ ...prev, currency_id: defaultCurrency?.id || currencies[0].id }))
      }
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchAccounts()
    fetchCurrencies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (editingId) {
        await accountService.update(editingId, formData)
        success('Cuenta actualizada', 'La cuenta se actualizó correctamente')
      } else {
        await accountService.create(formData)
        success('Cuenta creada', 'La nueva cuenta se agregó correctamente')
      }
      resetForm()
      fetchAccounts(1)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) return
    try {
      setError('')
      await accountService.delete(id)
      success('Cuenta eliminada', 'La cuenta se eliminó correctamente')
      fetchAccounts(1)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error al eliminar', errorMsg)
    }
  }

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency_id: account.currency_id,
      description: account.description || '',
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bank',
      balance: 0,
      currency_id: defaultCurrency?.id || currencies.length > 0 ? currencies[0].id : '',
      description: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const columns = [
    {
      header: 'Nombre',
      render: (item: Account) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: Account) => (
        <span className="capitalize text-xs bg-muted px-2 py-1 rounded">
          {item.type}
        </span>
      ),
    },
    {
      header: 'Balance',
      render: (item: Account) => (
        <span className="font-semibold">
          {formatCurrency(item.balance, item.currency?.code)}
        </span>
      ),
    },
    {
      header: 'Descripción',
      render: (item: Account) => (
        <span className="text-muted-foreground">{item.description || '-'}</span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: Account) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 animate-fade-in">
      <div className="animate-slide-in-down">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Cuentas</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Administra tus cuentas bancarias y efectivo
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg animate-slide-in-down">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{accounts.filter(acc => !acc.is_virtual_account).length}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Balance Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold truncate">
              {formatCurrency(accounts.filter(acc => !acc.is_virtual_account).reduce((sum, acc) => sum + acc.balance, 0))}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Cuentas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{accounts.filter(acc => acc.balance > 0).length}</div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full sm:w-auto transition-all duration-300 hover:scale-105"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Cuenta
      </Button>

      {showForm && (
        <Card className="animate-slide-in-up border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{editingId ? 'Editar' : 'Nueva'} Cuenta</CardTitle>
            <CardDescription className="text-sm">
              {editingId ? 'Actualiza los datos de tu cuenta' : 'Agrega una nueva cuenta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Cuenta</Label>
                <Input
                  id="name"
                  placeholder="Mi cuenta principal"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="type" className="text-sm">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as AccountType })
                    }
                  >
                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="bank">Banco</SelectItem>
                      <SelectItem value="platform">Plataforma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency" className="text-sm">Moneda</Label>
                  <Select
                    value={formData.currency_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency_id: value })
                    }
                  >
                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="balance">Balance Inicial</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Descripción opcional"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
                  {editingId ? 'Actualizar' : 'Crear'} Cuenta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={accounts}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          limit: 10,
          total,
          onPageChange: fetchAccounts,
        }}
      />
    </div>
  )
}
