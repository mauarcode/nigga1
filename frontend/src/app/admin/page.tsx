'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Scissors,
  Calendar,
  Image,
  Settings,
  BarChart3,
  Star,
  DollarSign,
  User,
  Edit,
  Trash2,
  Plus,
  Eye,
  Save,
  X,
  LogOut,
  Bell
} from 'lucide-react'
import ConfigurationManager from '@/components/ConfigurationManager'
import GalleryManager from '@/components/GalleryManager'
import UsersManager from '@/components/UsersManager'
import ServicesManager from '@/components/ServicesManager'
import ProductsManager from '@/components/ProductsManager'
import PackagesManager from '@/components/PackagesManager'
import AdvancedStats from '@/components/AdvancedStats'
import AppointmentsManager from '@/components/AppointmentsManager'
import TestimonialsManager from '@/components/TestimonialsManager'
import AppointmentAlerts from '@/components/AppointmentAlerts'

// Tipos para TypeScript
interface AdminStats {
  total_users: number
  total_clients: number
  total_barbers: number
  total_services: number
  total_appointments: number
  completed_appointments: number
  appointments_this_month: number
  completed_this_month: number
  average_rating: number
  recent_appointments: number
}

interface DashboardData {
  recent_appointments: Array<{
    id: number
    cliente: string
    barbero: string
    servicio: string
    fecha_hora: string
    estado: string
    precio: number
  }>
  recent_users: Array<{
    id: number
    username: string
    email: string
    rol: string
    date_joined: string
    is_active: boolean
  }>
  popular_services: Array<{
    id: number
    nombre: string
    precio: number
    duracion: number
    appointment_count: number
  }>
}

interface WebsiteContent {
  id: number
  tipo_contenido: string
  contenido: string
  activo: boolean
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [content, setContent] = useState<WebsiteContent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingContent, setEditingContent] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  useEffect(() => {
    // Verificar que el usuario sea administrador
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('user_role')

    if (!token) {
      window.location.href = '/login'
      return
    }

    if (role !== 'admin') {
      // Si no es admin, redirigir según su rol
      if (role === 'barbero') {
        window.location.href = '/barbero'
      } else {
        window.location.href = '/dashboard'
      }
      return
    }

    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setLoading(false)
      window.location.href = '/login'
      return
    }

    const authHeaders: HeadersInit = {
      Authorization: `Bearer ${token}`,
    }

    try {
      // Cargar estadísticas
      const statsResponse = await fetch('https://barberrock.es/api/admin/estadisticas-generales/', {
        headers: authHeaders,
        cache: 'no-store',
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      } else if (statsResponse.status === 401) {
        throw new Error('unauthorized')
      }

      // Cargar datos del dashboard
      const dashboardResponse = await fetch('https://barberrock.es/api/admin/dashboard/', {
        headers: authHeaders,
        cache: 'no-store',
      })
      if (dashboardResponse.ok) {
        const dashboardDataResponse = await dashboardResponse.json()
        setDashboardData(dashboardDataResponse)
      } else if (dashboardResponse.status === 401) {
        throw new Error('unauthorized')
      }

      // Cargar contenido del sitio web
      const contentResponse = await fetch('https://barberrock.es/api/admin/contenido-sitio/', {
        headers: authHeaders,
        cache: 'no-store',
      })
      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        setContent(Array.isArray(contentData) ? contentData : contentData.results || [])
      } else if (contentResponse.status === 401) {
        throw new Error('unauthorized')
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
      if (error instanceof Error && error.message === 'unauthorized') {
        alert('Tu sesión expiró. Inicia sesión nuevamente.')
        localStorage.clear()
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditContent = (tipo_contenido: string, currentValue: string) => {
    setEditingContent(tipo_contenido)
    setEditValue(currentValue)
  }

  const handleSaveContent = async (tipo_contenido: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('https://barberrock.es/api/admin/contenido-sitio/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify([{
          tipo_contenido,
          contenido: editValue
        }]),
      })

      if (response.ok) {
        setContent(prev => prev.map(item =>
          item.tipo_contenido === tipo_contenido
            ? { ...item, contenido: editValue }
            : item
        ))
        setEditingContent(null)
        setEditValue('')
      } else if (response.status === 401) {
        alert('Tu sesión expiró. Inicia sesión nuevamente.')
        localStorage.clear()
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Error al guardar el contenido')
    }
  }

  const handleCancelEdit = () => {
    setEditingContent(null)
    setEditValue('')
  }

  const getContentDisplayName = (tipo_contenido: string) => {
    const names: { [key: string]: string } = {
      'inicio_titulo': 'Título de inicio',
      'inicio_descripcion': 'Descripción de inicio',
      'establecimiento_descripcion': 'Descripción del establecimiento',
      'establecimiento_historia': 'Historia del establecimiento',
      'establecimiento_mision': 'Misión del establecimiento',
      'establecimiento_vision': 'Visión del establecimiento',
      'contacto_telefono': 'Teléfono de contacto',
      'contacto_email': 'Email de contacto',
      'contacto_direccion': 'Dirección de contacto',
      'horarios_laborales': 'Horarios laborales',
      'nombre_barberia': 'Nombre de la barbería',
      'slogan': 'Slogan de la barbería',
      'descripcion_general': 'Descripción general',
    }
    return names[tipo_contenido] || tipo_contenido
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
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
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Barbería BarberRock
              </Link>
              <span className="ml-4 text-gray-600">Panel de Administración</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                {localStorage.getItem('user_display_name') || localStorage.getItem('user_username') || 'Admin'}
              </span>
              <Link href="/" className="btn-secondary">
                Volver a Inicio
              </Link>
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
        {/* Navegación por pestañas */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />
              Dashboard y Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Scissors className="inline-block w-4 h-4 mr-2" />
              Servicios
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="inline-block w-4 h-4 mr-2" />
              Alertas
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline-block w-4 h-4 mr-2" />
              Citas
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="inline-block w-4 h-4 mr-2" />
              Productos
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Image className="inline-block w-4 h-4 mr-2" />
              Galería
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'testimonials'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="inline-block w-4 h-4 mr-2" />
              Testimonios
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline-block w-4 h-4 mr-2" />
              Configuración
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'dashboard' && stats && dashboardData && (
          <div className="space-y-8">
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-3">
                    <Scissors className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Servicios Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_services}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Citas este mes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.appointments_this_month}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.average_rating}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Citas recientes */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Citas Recientes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {(dashboardData.recent_appointments ?? []).map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{appointment.servicio}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.estado === 'completada' ? 'bg-green-100 text-green-800' :
                            appointment.estado === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.estado}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {appointment.cliente} con {appointment.barbero}
                        </p>
                        {appointment.productos && appointment.productos.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Productos: {appointment.productos.map((producto: any) => producto.nombre).join(', ')}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs">
                          {new Date(appointment.fecha_hora).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">${appointment.precio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Estadísticas avanzadas */}
            <AdvancedStats />
          </div>
        )}

        {activeTab === 'alerts' && (
          <AppointmentAlerts />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsManager />
        )}

        {activeTab === 'users' && (
          <UsersManager />
        )}

        {activeTab === 'services' && (
          <ServicesManager />
        )}

        {activeTab === 'gallery' && (
          <GalleryManager />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsManager />
        )}

        {activeTab === 'products' && (
          <ProductsManager />
        )}


        {activeTab === 'settings' && (
          <ConfigurationManager />
        )}
      </div>
    </div>
  )
}

