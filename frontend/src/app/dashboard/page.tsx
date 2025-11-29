'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Star,
  Gift,
  Settings,
  LogOut,
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Tipos para TypeScript
interface Appointment {
  id: number
  servicio: {
    nombre: string
    precio: number
  }
  barbero: {
    user: {
      first_name: string
      last_name: string
    }
    qr_token?: string
  }
  fecha_hora: string
  estado: string
  encuesta_completada?: boolean
}

interface ClientProfile {
  cortes_realizados: number
  cortes_para_promocion: number
  es_elegible_para_promocion: boolean
}

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('appointments')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSurvey, setPendingSurvey] = useState<any>(null)

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  // Cargar datos reales desde la API
  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('user_role')

    // Si no hay token, redirigir a login
    if (!token) {
      window.location.href = '/login'
      return
    }

    // Si es admin, redirigir al panel de admin
    if (role === 'admin') {
      window.location.href = '/admin'
      return
    }

    // Cargar datos del cliente desde la API
    const loadClientData = async () => {
      try {
        setLoading(true)

        // Cargar citas del cliente
        const appointmentsResponse = await fetch('https://barberrock.es/api/citas/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!appointmentsResponse.ok) {
          if (appointmentsResponse.status === 401) {
            // Token inválido o expirado, redirigir al login
            localStorage.clear()
            window.location.href = '/login'
            return
          }
          throw new Error('Error al cargar citas')
        }
        
        const appointmentsData = await appointmentsResponse.json()
        const allAppointments = Array.isArray(appointmentsData.results) 
          ? appointmentsData.results 
          : Array.isArray(appointmentsData) 
            ? appointmentsData 
            : []
        setAppointments(allAppointments)

        // Verificar si hay encuestas pendientes
        // Buscar citas completadas sin encuesta (usando el campo encuesta_completada)
        if (Array.isArray(allAppointments)) {
          const completedAppointments = allAppointments.filter((apt: Appointment) => 
            apt.estado === 'completada' && !apt.encuesta_completada
          )
          
          if (completedAppointments.length > 0) {
            // Tomar la primera cita completada sin encuesta
            const apt = completedAppointments[0]
            setPendingSurvey({
              appointmentId: apt.id,
              barbero: `${apt.barbero?.user?.first_name || ''} ${apt.barbero?.user?.last_name || ''}`.trim() || 'Barbero',
              fecha_hora: apt.fecha_hora
            })
          }
        }

        // Cargar perfil del cliente (para programa de fidelización)
        const profileResponse = await fetch('https://barberrock.es/api/clientes/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            // Token inválido o expirado, redirigir al login
            localStorage.clear()
            window.location.href = '/login'
            return
          }
          // Si falla, continuar sin perfil
          console.warn('No se pudo cargar el perfil del cliente')
        } else {
          const profileData = await profileResponse.json()
          
          // Buscar el perfil del usuario actual
          const profilesList = Array.isArray(profileData.results) 
            ? profileData.results 
            : Array.isArray(profileData) 
              ? profileData 
              : []
          
          if (Array.isArray(profilesList)) {
            const currentProfile = profilesList.find((p: any) => p.user?.id === parseInt(localStorage.getItem('user_id') || '0'))
            if (currentProfile) {
              setProfile({
                cortes_realizados: currentProfile.cortes_realizados || 0,
                cortes_para_promocion: currentProfile.cortes_para_promocion || 5,
                es_elegible_para_promocion: currentProfile.es_elegible_para_promocion || false
              })
            }
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error al cargar datos del cliente:', error)
        setLoading(false)
      }
    }

    loadClientData()
  }, [])

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'agendada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Agendada
          </span>
        )
      case 'completada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completada
          </span>
        )
      case 'cancelada':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        // Actualizar la lista de citas
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, estado: 'cancelada' } : apt
        ))
        alert('Cita cancelada exitosamente')
      } else {
        alert('Error al cancelar la cita')
      }
    } catch (error) {
      console.error('Error al cancelar cita:', error)
      alert('Error al cancelar la cita. Por favor, intenta de nuevo.')
    }
  }

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
                {localStorage.getItem('user_display_name') || localStorage.getItem('user_username') || 'Usuario'}
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
        {/* Información del cliente */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold">¡Hola, {localStorage.getItem('user_display_name') || localStorage.getItem('user_username') || 'Usuario'}!</h1>
                  <p className="text-primary-100 mt-1">Panel de Cliente - Gestiona tus citas aquí</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (pendingSurvey) {
                    if (confirm('Antes de agendar tu siguiente cita, cuéntanos cómo te fue con ' + pendingSurvey.barbero + '. ¿Deseas calificar el servicio ahora?')) {
                      window.location.href = `/encuesta/${pendingSurvey.appointmentId}`
                    }
                  } else {
                    window.location.href = '/cita'
                  }
                }}
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors shadow-lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Nueva Cita
              </button>
            </div>
          </div>

          {/* Banner informativo para clientes */}
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>¿Necesitas ayuda?</strong> Desde aquí puedes agendar citas, ver tu historial y gestionar tus próximas visitas.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de información del cliente */}
          <div className="mt-4 bg-white rounded-lg shadow p-6">

            {/* Programa de fidelización */}
            {profile && (
              <div className="mt-6 bg-primary-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gift className="w-6 h-6 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Programa de Fidelización
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profile.cortes_realizados} de {profile.cortes_para_promocion} cortes completados
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {profile.es_elegible_para_promocion ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ¡Felicidades! Has ganado un corte gratis
                      </span>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-600">
                          {profile.cortes_para_promocion - profile.cortes_realizados} cortes restantes
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${(profile.cortes_realizados / profile.cortes_para_promocion) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banner de encuesta pendiente */}
        {pendingSurvey && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Star className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Tienes una reseña pendiente
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    Antes de agendar tu siguiente cita, cuéntanos cómo te fue con {pendingSurvey.barbero}
                  </p>
                  <Link
                    href={`/encuesta/${pendingSurvey.appointmentId}`}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Calificar Servicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegación por pestañas */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mis Citas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Mis Citas</h3>
            </div>
            <div className="divide-y">
              {Array.isArray(appointments) && appointments.filter(a => a.estado !== 'completada' && a.estado !== 'cancelada').length > 0 ? (
                appointments
                  .filter(a => a.estado !== 'completada' && a.estado !== 'cancelada')
                  .map(appointment => (
                  <div key={appointment.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {appointment.servicio.nombre}
                          </h4>
                          {getStatusBadge(appointment.estado)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          Con {appointment.barbero.user.first_name} {appointment.barbero.user.last_name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {formatDate(appointment.fecha_hora)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          {profile?.es_elegible_para_promocion ? (
                            <span className="text-green-600">Gratis</span>
                          ) : (
                            `$${appointment.servicio.precio}`
                          )}
                        </p>
                        {(appointment.estado === 'agendada' || appointment.estado === 'confirmada' || appointment.estado === 'pendiente') && (
                          <button 
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Cancelar cita
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No tienes citas programadas</p>
                  <Link href="/cita" className="btn-primary">
                    Agendar primera cita
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Historial de Citas</h3>
            </div>
            <div className="divide-y">
              {Array.isArray(appointments) && appointments.filter(a => a.estado === 'completada').length > 0 ? (
                appointments
                  .filter(a => a.estado === 'completada')
                  .map(appointment => (
                  <div key={appointment.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {appointment.servicio.nombre}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(appointment.estado)}
                            <Link 
                              href={`/encuesta/${appointment.id}`}
                              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                              Evaluar Servicio
                            </Link>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          Con {appointment.barbero.user.first_name} {appointment.barbero.user.last_name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {formatDate(appointment.fecha_hora)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          ${appointment.servicio.precio}
                        </p>
                        <button className="text-sm text-primary-600 hover:text-primary-700">
                          Dejar reseña
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay historial de citas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

