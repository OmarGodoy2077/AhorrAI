import { useState, useEffect } from 'react'
import { accountService, getErrorMessage } from '@/services'
import type { Account, AccountType } from '@/types'
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
import { Trash2, Edit, Plus } from 'lucide-react'

export const AccountPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as AccountType,
    balance: 0,
    currency: 'USD',
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
      setAccounts(response.data)
      setTotal(response.total || 0)
      setPage(pageNum)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (editingId) {
        await accountService.update(editingId, formData)
      } else {
        await accountService.create(formData)
      }
      resetForm()
      fetchAccounts(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) return
    try {
      setError('')
      await accountService.delete(id)
      fetchAccounts(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
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
      currency: 'USD',
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
          {item.currency} {item.balance.toFixed(2)}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cuentas</h1>
        <p className="text-muted-foreground mt-1">
          Administra tus cuentas bancarias y efectivo
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              USD {accounts.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Últimas Operaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Cuenta
      </Button>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Nueva'} Cuenta</CardTitle>
            <CardDescription>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as AccountType })
                    }
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="currency">Moneda</Label>
                  <Input
                    id="currency"
                    placeholder="USD"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    required
                  />
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

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
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
