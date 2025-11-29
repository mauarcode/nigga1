'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardCheck,
  QrCode,
} from 'lucide-react'
import BarberSchedule from '@/components/BarberSchedule'
import BarberCreateAppointment from '@/components/BarberCreateAppointment'
import SurveyModal from '@/components/SurveyModal'

// Tipos para TypeScript
interface Appointment {
  id: number
  cliente?: {
    user?: {
      first_name?: string
      last_name?: string
      email?: string
      telefono?: string
    } | null
  } | null
  servicio?: {
    nombre?: string
    precio?: number | string
    duracion?: number | string
  } | null
  productos?: Array<{
    id: number
    nombre?: string
    precio?: number | string
  }>
  fecha_hora: string
  estado: string
  notas?: string
  nombre_cliente?: string
  telefono_cliente?: string
  email_cliente?: string | null
  es_cliente_registrado?: boolean
  tiene_encuesta?: boolean
  survey_token?: string
  encuesta_id?: number | null
  encuesta_completada?: boolean
}

interface BarberStats {
  citas_mes_actual: number
  citas_totales: number
  calificacion_promedio: number
  ingresos_mes: number
  comentarios_recientes: Array<{
    cliente: string
    calificacion: number
    comentario: string
    fecha: string
  }>
}

export default function BarberoDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<BarberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('agenda')
  const [surveyConfig, setSurveyConfig] = useState<{ token: string; appointmentId: number } | null>(null)
  const [barberProfile, setBarberProfile] = useState<{ qr_token?: string; qr_url?: string } | null>(null)

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const loadBarberData = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      return
    }

    try {
      setLoading(true)

      // Cargar perfil del barbero para obtener QR
      try {
        const barberosResponse = await fetch('https://barberrock.es/api/barberos/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (barberosResponse.ok) {
          const barberosData = await barberosResponse.json()
          const barberosList = barberosData.results || barberosData
          // Encontrar el perfil del barbero actual (el usuario autenticado)
          const currentBarber = Array.isArray(barberosList) ? barberosList.find((b: any) => b.user?.id === parseInt(localStorage.getItem('user_id') || '0')) : null
          if (currentBarber) {
            setBarberProfile({
              qr_token: currentBarber.qr_token,
              qr_url: currentBarber.qr_url || (currentBarber.qr_token ? `http://localhost:3000/encuesta/qr/${currentBarber.qr_token}` : undefined)
            })
          }
        }
      } catch (error) {
        console.error('Error al cargar perfil del barbero:', error)
      }

      const appointmentsResponse = await fetch('https://barberrock.es/api/citas/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const appointmentsData = await appointmentsResponse.json()
      const appointmentsList: Appointment[] = appointmentsData.results || appointmentsData
      setAppointments(appointmentsList)

      try {
        const statsResponse = await fetch('https://barberrock.es/api/estadisticas/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const statsData = await statsResponse.json()
        setStats(statsData)
      } catch (error) {
        console.error('Error al cargar estadísticas:', error)
        const citasMesActual = appointmentsList.filter((apt: Appointment) => {
          const fecha = new Date(apt.fecha_hora)
          const hoy = new Date()
          return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
        }).length

        setStats({
          citas_mes_actual: citasMesActual,
          citas_totales: appointmentsList.length,
          calificacion_promedio: 4.8,
          ingresos_mes: 0,
          comentarios_recientes: []
        })
      }

      setLoading(false)
    } catch (error) {
      console.error('Error al cargar datos del barbero:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('user_role')

    if (!token) {
      window.location.href = '/login'
      return
    }

    if (role === 'admin') {
      window.location.href = '/admin'
      return
    } else if (role === 'cliente') {
      window.location.href = '/dashboard'
      return
    }

    loadBarberData()
  }, [loadBarberData])

  useEffect(() => {
    loadBarberData()
  }, [currentDate, loadBarberData])

  const handleMarkAsCompleted = async (appointmentId: number) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`https://barberrock.es/api/citas/${appointmentId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: 'completada'
        })
      })

      if (response.ok) {
        const updatedAppointment: Appointment = await response.json()
        await loadBarberData()
        if (updatedAppointment?.survey_token) {
          setSurveyConfig({ token: updatedAppointment.survey_token, appointmentId })
        }
        alert('Cita marcada como completada. Genera la encuesta de satisfacción.')
      } else {
        alert('Error al actualizar la cita')
      }
    } catch (error) {
      console.error('Error al marcar cita como completada:', error)
      alert('Error al actualizar la cita')
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`https://barberrock.es/api/citas/${appointmentId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: 'cancelada'
        })
      })

      if (response.ok) {
        await loadBarberData()
        alert('Cita cancelada exitosamente')
      } else {
        alert('Error al cancelar la cita')
      }
    } catch (error) {
      console.error('Error al cancelar cita:', error)
      alert('Error al cancelar la cita')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Confirmada
          </span>
        )
      case 'completada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completada
          </span>
        )
      case 'cancelada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelada
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {estado}
          </span>
        )
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const markAsCompleted = (appointmentId: number) => {
    handleMarkAsCompleted(appointmentId)
  }

  const cancelAppointment = (appointmentId: number) => {
    handleCancelAppointment(appointmentId)
  }

  const getClientName = (appointment: Appointment) => {
    const firstName = appointment.cliente?.user?.first_name
    const lastName = appointment.cliente?.user?.last_name
    const fullNameFromUser = [firstName, lastName].filter(Boolean).join(' ').trim()

    if (fullNameFromUser) {
      return fullNameFromUser
    }

    if (appointment.nombre_cliente && appointment.nombre_cliente.trim().length > 0) {
      return appointment.nombre_cliente
    }

    return 'Cliente sin registrar'
  }

  const getClientContactInfo = (appointment: Appointment) => {
    const parts: string[] = []

    const phoneFromProfile = appointment.cliente?.user?.telefono || ''
    const emailFromProfile = appointment.cliente?.user?.email || ''
    const phone = (appointment.telefono_cliente || '').trim() || phoneFromProfile
    const email = (appointment.email_cliente || '').trim() || emailFromProfile

    if (phone) {
      parts.push(`Tel: ${phone}`)
    }

    if (email) {
      parts.push(`Email: ${email}`)
    }

    return parts.join(' · ')
  }

  const getServiceName = (appointment: Appointment) => {
    if (appointment.servicio?.nombre) {
      return appointment.servicio.nombre
    }
    return 'Servicio sin especificar'
  }

  const getServicePrice = (appointment: Appointment) => {
    const price = appointment.servicio?.precio

    if (price === undefined || price === null || price === '') {
      return ''
    }

    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`
    }

    const parsed = parseFloat(price)
    if (!Number.isNaN(parsed)) {
      return `$${parsed.toFixed(2)}`
    }

    return ''
  }

  const normalizeToStartOfDay = (date: Date) => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  const isSameDay = (dateA: Date, dateB: Date) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    )
  }

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
  )

  const selectedDayStart = normalizeToStartOfDay(currentDate)
  const selectedDayEnd = new Date(selectedDayStart)
  selectedDayEnd.setHours(23, 59, 59, 999)

  const appointmentsForSelectedDay = sortedAppointments.filter((appointment) =>
    isSameDay(new Date(appointment.fecha_hora), selectedDayStart)
  )

  const upcomingAppointments = sortedAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.fecha_hora)
    return appointmentDate > selectedDayEnd
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                Barbería BarberRock
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                {localStorage.getItem('user_display_name') || localStorage.getItem('user_username') || 'Barbero'}
              </span>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del barbero */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary-100 rounded-full p-3">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">¡Hola, {localStorage.getItem('user_display_name') || localStorage.getItem('user_username') || 'Barbero'}!</h1>
                  <p className="text-gray-600">Panel de control del barbero</p>
                </div>
              </div>
              {barberProfile?.qr_token && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Mi Código QR</p>
                    <p className="text-xs text-gray-500">Para recibir reseñas</p>
                  </div>
                  <div className="bg-white border-2 border-primary-200 rounded-lg p-2">
                    {barberProfile.qr_url ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(barberProfile.qr_url)}&margin=1`}
                        alt="QR Code"
                        className="w-24 h-24"
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.qr-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'qr-fallback w-24 h-24 flex items-center justify-center bg-gray-100 rounded'
                            fallback.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agenda'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mi Agenda
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'estadisticas'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('horario')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'horario'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mi Horario
            </button>
            <button
              onClick={() => setActiveTab('crear-cita')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'crear-cita'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Crear Cita Manual
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'agenda' && (
          <>
            {/* Navegación de fechas */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {formatDate(currentDate)}
                  </h2>
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Agenda del día */}
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    {appointmentsForSelectedDay.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                          {appointmentsForSelectedDay.map((appointment) => {
                            const timeString = formatTime(appointment.fecha_hora)
                            const clientName = getClientName(appointment)
                            const contactInfo = getClientContactInfo(appointment)
                            const serviceName = getServiceName(appointment)
                            const servicePrice = getServicePrice(appointment)
                            const status = (appointment.estado || '').toLowerCase()

                            return (
                              <div key={appointment.id} className="relative flex items-start mb-8 last:mb-0">
                                <div className="flex-shrink-0 w-16 text-right pr-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {timeString}
                                  </div>
                                </div>

                                <div className="flex-shrink-0 w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow relative z-10 mt-1"></div>

                                <div className="flex-1 ml-4 bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {clientName}
                                    </h3>
                                    {getStatusBadge(appointment.estado)}
                                  </div>
                                  <p className="text-gray-600 mb-2">
                                    {serviceName}
                                    {servicePrice && (
                                      <span className="ml-1 font-medium">
                                        {servicePrice}
                                      </span>
                                    )}
                                  </p>
                                  {contactInfo && (
                                    <p className="text-sm text-gray-500 mb-2">
                                      {contactInfo}
                                    </p>
                                  )}
                                  {appointment.productos && appointment.productos.length > 0 && (
                                    <div className="text-sm text-gray-600 mb-3">
                                      <span className="font-medium text-gray-700">Productos:</span>
                                      <ul className="mt-1 space-y-1">
                                        {appointment.productos.map((producto) => (
                                          <li key={producto.id} className="flex items-center justify-between">
                                            <span>{producto.nombre}</span>
                                            {producto.precio !== undefined && producto.precio !== null && producto.precio !== '' && (
                                              <span className="text-gray-500">
                                                {typeof producto.precio === 'number'
                                                  ? `$${producto.precio.toFixed(2)}`
                                                  : `$${parseFloat(String(producto.precio)).toFixed(2)}`}
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {appointment.notas && (
                                    <p className="text-sm text-gray-500 mb-3">
                                      Nota: {appointment.notas}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap gap-2">
                                    {['agendada', 'confirmada', 'pendiente'].includes(status) && (
                                      <>
                                        <button
                                          onClick={() => markAsCompleted(appointment.id)}
                                          className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Finalizar corte
                                        </button>
                                        <button
                                          onClick={() => cancelAppointment(appointment.id)}
                                          className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Cancelar cita
                                        </button>
                                      </>
                                    )}

                                    {status === 'completada' && (
                                      <button
                                        onClick={() => {
                                          if (appointment.survey_token) {
                                            setSurveyConfig({ token: appointment.survey_token, appointmentId: appointment.id })
                                          } else {
                                            alert('No se encontró un token de encuesta para esta cita. Actualiza la página e inténtalo de nuevo.')
                                          }
                                        }}
                                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                      >
                                        <ClipboardCheck className="w-4 h-4 mr-1" />
                                        {appointment.encuesta_completada ? 'Ver encuesta' : 'Encuesta de satisfacción'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No tienes citas programadas para este día</p>
                        <p className="text-gray-400">Selecciona otra fecha para revisar tu agenda completa</p>
                      </div>
                    )}
                  </div>

                  <div className="xl:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Próximas citas</h3>
                      {upcomingAppointments.length > 0 ? (
                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                          {upcomingAppointments.map((appointment) => {
                            const appointmentDate = new Date(appointment.fecha_hora)
                            const clientName = getClientName(appointment)
                            const serviceName = getServiceName(appointment)

                            return (
                              <div key={appointment.id} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {appointmentDate.toLocaleDateString('es-ES', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}{' '}
                                    · {appointmentDate.toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {getStatusBadge(appointment.estado)}
                                </div>
                                <p className="text-sm text-gray-700 font-semibold mb-1">{clientName}</p>
                                <p className="text-sm text-gray-500">{serviceName}</p>
                                {appointment.productos && appointment.productos.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Productos: {appointment.productos.map((producto) => producto.nombre).join(', ')}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No tienes citas pendientes en días posteriores.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'estadisticas' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* KPIs */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas este mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.citas_mes_actual}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas totales</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.citas_totales}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Calificación promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.calificacion_promedio}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos del mes</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats.ingresos_mes || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comentarios recientes */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Comentarios recientes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.comentarios_recientes.map((comentario, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comentario.cliente}</span>
                        <div className="flex items-center">
                          {Array.from({ length: comentario.calificacion }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{comentario.comentario}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comentario.fecha).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico de servicios por mes (placeholder) */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Servicios por mes</h3>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Gráfico de servicios por mes</p>
                    <p className="text-sm text-gray-400 mt-2">
                      (Se implementaría con una librería como Chart.js o Recharts)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'horario' && (
          <BarberSchedule />
        )}

        {activeTab === 'crear-cita' && (
          <BarberCreateAppointment onCreated={loadBarberData} />
        )}
      </div>

      {surveyConfig && (
        <SurveyModal
          token={surveyConfig.token}
          appointmentId={surveyConfig.appointmentId}
          onClose={() => setSurveyConfig(null)}
          onSubmitted={() => {
            setSurveyConfig(null)
            loadBarberData()
          }}
        />
      )}
    </div>
  )
}

