'use client'

import { useState, useEffect } from 'react'
import { Calendar, User, Scissors, Clock, Save, X, Plus, Phone, Mail } from 'lucide-react'

interface BarberProfile {
  id: number
  user: {
    id: number
  }
}

interface Service {
  id: number
  nombre: string
  precio: number
  duracion: number
}

interface Product {
  id: number
  nombre: string
  descripcion: string
  precio: number
}

interface Client {
  id: number
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
}

interface BarberCreateAppointmentProps {
  onCreated?: () => void
}

export default function BarberCreateAppointment({ onCreated }: BarberCreateAppointmentProps) {
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [barberProfile, setBarberProfile] = useState<BarberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [clientMode, setClientMode] = useState<'registered' | 'guest'>('registered')
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    servicio_id: '',
    fecha: '',
    hora: '',
    notas: '',
  })
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  const [guestData, setGuestData] = useState({
    nombre: '',
    telefono: '',
    email: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      
      const userId = localStorage.getItem('user_id')

      // Cargar servicios
      const servicesRes = await fetch('http://137.184.35.178:8000/api/servicios/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(Array.isArray(servicesData) ? servicesData : servicesData.results || [])
      }

      // Cargar productos
      const productsRes = await fetch('http://137.184.35.178:8000/api/productos/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        const productsList = Array.isArray(productsData) ? productsData : productsData.results || []
        setProducts(
          productsList.map((product: any) => ({
            ...product,
            precio: typeof product.precio === 'number' ? product.precio : parseFloat(product.precio || '0'),
          }))
        )
      }

      // Cargar clientes
      const clientsRes = await fetch('http://137.184.35.178:8000/api/clientes/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(Array.isArray(clientsData) ? clientsData : clientsData.results || [])
      }

      // Obtener perfil de barbero actual
      if (userId) {
        const barbersRes = await fetch('http://137.184.35.178:8000/api/barberos/')
        if (barbersRes.ok) {
          const barbersData = await barbersRes.json()
          const barbersList = Array.isArray(barbersData) ? barbersData : barbersData.results || []
          const currentBarber = barbersList.find((barber: BarberProfile) => `${barber.user.id}` === userId)
          if (currentBarber) {
            setBarberProfile(currentBarber)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.servicio_id || !formData.fecha || !formData.hora) {
      alert('Selecciona servicio, fecha y hora')
      return
    }

    if (!barberProfile) {
      alert('No se pudo identificar tu perfil de barbero. Intenta recargar la página.')
      return
    }

    if (clientMode === 'registered' && !formData.cliente_id) {
      alert('Selecciona un cliente registrado')
      return
    }

    if (clientMode === 'guest') {
      if (!guestData.nombre.trim() || !guestData.telefono.trim()) {
        alert('Para clientes sin cuenta, el nombre y el teléfono son obligatorios')
        return
      }
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const selectedService = services.find((service) => `${service.id}` === formData.servicio_id)
      const payload: Record<string, any> = {
        servicio_id: parseInt(formData.servicio_id, 10),
        barbero_id: barberProfile.id,
        fecha: formData.fecha,
        hora: formData.hora,
        duracion: selectedService?.duracion || undefined,
        notas: formData.notas,
        estado: 'confirmada',
      }

      if (clientMode === 'registered') {
        payload.cliente_id = parseInt(formData.cliente_id, 10)
      } else {
        payload.contacto = {
          nombre: guestData.nombre.trim(),
          telefono: guestData.telefono.trim(),
          email: guestData.email.trim() || undefined,
        }
      }

      if (selectedProducts.length > 0) {
        payload.productos = selectedProducts
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch('http://137.184.35.178:8000/api/citas/agendar/', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('Cita creada exitosamente')
        setFormData({
          cliente_id: '',
          servicio_id: '',
          fecha: '',
          hora: '',
          notas: '',
        })
        setGuestData({ nombre: '', telefono: '', email: '' })
        setSelectedProducts([])
        setShowForm(false)
        setClientMode('registered')
        onCreated?.()
      } else {
        const errorData = await response.json()
        alert('Error al crear la cita: ' + (errorData.detail || errorData.error || JSON.stringify(errorData)))
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al crear la cita')
    } finally {
      setSaving(false)
    }
  }

  const getClientDisplayName = (client: Client) => {
    const fullName = `${client.user.first_name} ${client.user.last_name}`.trim()
    return fullName || client.user.username
  }

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Crear Cita Manual</h2>
            <p className="text-gray-600 mt-1">Registra citas agendadas por teléfono u otros medios</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline-block mr-1" />
                Cliente *
              </label>

              <div className="flex items-center space-x-4 mb-3">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="clientMode"
                    value="registered"
                    checked={clientMode === 'registered'}
                    onChange={() => setClientMode('registered')}
                  />
                  <span>Cliente registrado</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="clientMode"
                    value="guest"
                    checked={clientMode === 'guest'}
                    onChange={() => setClientMode('guest')}
                  />
                  <span>Cliente sin cuenta</span>
                </label>
              </div>

              {clientMode === 'registered' ? (
                <select
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientDisplayName(client)} ({client.user.email})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={guestData.nombre}
                      onChange={(e) => setGuestData({ ...guestData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nombre y apellidos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                      <span className="px-3 text-gray-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        value={guestData.telefono}
                        onChange={(e) => setGuestData({ ...guestData, telefono: e.target.value })}
                        className="flex-1 px-3 py-2 outline-none"
                        placeholder="Ej. 55 1234 5678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico (opcional)
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                      <span className="px-3 text-gray-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={guestData.email}
                        onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                        className="flex-1 px-3 py-2 outline-none"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Servicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scissors className="w-4 h-4 inline-block mr-1" />
                Servicio *
              </label>
              <select
                value={formData.servicio_id}
                onChange={(e) => setFormData({ ...formData, servicio_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar servicio...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nombre} - ${service.precio} ({service.duracion} min)
                  </option>
                ))}
              </select>
            </div>

            {products.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Productos recomendados
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Selecciona los productos que el cliente desea adquirir. Esta información será visible en la cita.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {products.map((product) => {
                    const isSelected = selectedProducts.includes(product.id)
                    return (
                      <label
                        key={product.id}
                        className={`border rounded-lg p-3 flex items-start gap-3 cursor-pointer transition ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product.id)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">{product.nombre}</span>
                            <span className="text-sm font-bold text-primary-600">${product.precio.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-600">{product.descripcion || 'Sin descripción'}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline-block mr-1" />
                  Hora *
                </label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Ej: Cliente llamó por teléfono, prefiere corte degradado..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Crear Cita'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    cliente_id: '',
                    servicio_id: '',
                    fecha: '',
                    hora: '',
                    notas: '',
                  })
                  setGuestData({ nombre: '', telefono: '', email: '' })
                  setClientMode('registered')
                  setSelectedProducts([])
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 inline-flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          </form>
        )}

        {!showForm && (
          <div className="p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Crea citas manualmente para clientes que agenden por teléfono u otros medios</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Cita
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Importante:</strong> Las citas creadas manualmente se marcan como "confirmadas" automáticamente. Asegúrate de verificar tu disponibilidad antes de crear la cita.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



