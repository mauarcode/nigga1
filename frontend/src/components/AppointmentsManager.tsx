'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, Eye, Search } from 'lucide-react'

interface Appointment {
  id: number
  cliente_nombre: string
  barbero_nombre: string
  servicio_nombre: string
  productos?: Array<{
    id: number
    nombre: string
    precio?: number
  }>
  fecha_hora: string
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  precio: number
  duracion: number
  notas?: string
}

export default function AppointmentsManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const token = localStorage.getItem('access_token')

      if (!token) {
        setAppointments([])
        setErrorMessage('Debes iniciar sesión como administrador para ver las citas.')
        return
      }

      const response = await fetch('http://137.184.35.178:8000/api/citas/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        const rawList = Array.isArray(data) ? data : data.results || []
        const mapped: Appointment[] = rawList.map((apt: any) => {
          const clienteNombre = (apt.nombre_cliente || apt.cliente?.user?.first_name || '')
            .toString()
            .trim()
          const clienteApellido = (apt.cliente?.user?.last_name || '').toString().trim()
          const clienteDisplay = [clienteNombre, clienteApellido]
            .filter(Boolean)
            .join(' ') || apt.cliente?.user?.username || 'Cliente'

          const barberoNombre = [
            (apt.barbero?.user?.first_name || '').toString().trim(),
            (apt.barbero?.user?.last_name || '').toString().trim(),
          ]
            .filter(Boolean)
            .join(' ') || apt.barbero?.user?.username || 'Barbero'

          const servicioNombre = (apt.servicio?.nombre || 'Servicio').toString()

          const precio = Number(apt.servicio?.precio ?? apt.precio ?? 0)
          const duracion = Number(apt.servicio?.duracion ?? apt.duracion ?? 0)

          return {
            id: apt.id,
            cliente_nombre: clienteDisplay,
            barbero_nombre: barberoNombre,
            servicio_nombre: servicioNombre,
            productos: Array.isArray(apt.productos)
              ? apt.productos.map((producto: any) => ({
                  id: producto.id,
                  nombre: producto.nombre || 'Producto',
                  precio: typeof producto.precio === 'number' ? producto.precio : parseFloat(producto.precio ?? 0),
                }))
              : [],
            fecha_hora: apt.fecha_hora,
            estado: apt.estado,
            precio: Number.isNaN(precio) ? 0 : precio,
            duracion: Number.isNaN(duracion) ? 0 : duracion,
            notas: apt.notas || '',
          }
        })

        setAppointments(mapped)
      } else if (response.status === 401) {
        setAppointments([])
        window.location.href = '/login'
      } else {
        setErrorMessage('No se pudieron cargar las citas. Intenta de nuevo más tarde.')
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      setErrorMessage('Error de conexión al cargar las citas.')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('Debes iniciar sesión para actualizar citas.')
        return
      }

      const response = await fetch(`http://137.184.35.178:8000/api/citas/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: newStatus }),
      })

      if (response.ok) {
        await loadAppointments()
        alert('Estado actualizado correctamente')
      } else if (response.status === 401) {
        localStorage.clear()
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error al actualizar el estado')
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800'
      case 'confirmada':
        return 'bg-blue-100 text-blue-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = filter === 'todas' || apt.estado === filter
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [apt.cliente_nombre, apt.barbero_nombre, apt.servicio_nombre].some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      )
    return matchesFilter && matchesSearch
  })

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
        <div className="px-6 py-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Citas</h2>
          <p className="text-gray-600 mt-1">Administra todas las citas de la barbería</p>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 border-b bg-gray-50">
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, barbero o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div className="flex gap-2">
              {['todas', 'pendiente', 'confirmada', 'completada', 'cancelada'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFilter(estado)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === estado
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de citas */}
        <div className="p-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron citas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.servicio_nombre}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            appointment.estado
                          )}`}
                        >
                          {appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Cliente: {appointment.cliente_nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4" />
                          <span>Barbero: {appointment.barbero_nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(appointment.fecha_hora).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(appointment.fecha_hora).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' '}({appointment.duracion} min)
                          </span>
                        </div>
                      </div>

                      {appointment.notas && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Notas:</strong> {appointment.notas}
                        </div>
                      )}
                      {appointment.productos && appointment.productos.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Productos:</strong>{' '}
                          {appointment.productos.map((producto) => producto.nombre).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <p className="text-lg font-bold text-primary-600">${appointment.precio}</p>
                      
                      {appointment.estado !== 'completada' && appointment.estado !== 'cancelada' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completada')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Marcar como completada"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelada')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar cita"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {appointments.filter((a) => a.estado === 'pendiente').length}
              </p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {appointments.filter((a) => a.estado === 'confirmada').length}
              </p>
              <p className="text-sm text-gray-600">Confirmadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {appointments.filter((a) => a.estado === 'completada').length}
              </p>
              <p className="text-sm text-gray-600">Completadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {appointments.filter((a) => a.estado === 'cancelada').length}
              </p>
              <p className="text-sm text-gray-600">Canceladas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


