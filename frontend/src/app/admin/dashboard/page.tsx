'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Settings,
  Image,
  FileText,
  DollarSign,
  BarChart3,
  LogOut,
  Home,
  Palette,
  Camera,
  UserPlus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import WebsiteContentEditor from '../../../components/WebsiteContentEditor'
import UserEditor from '../../../components/UserEditor'

interface WebsiteContent {
  id: number
  tipo_contenido: string
  contenido: string
  activo: boolean
}

interface User {
  id: number
  username: string
  email: string
  rol: string
  first_name: string
  last_name: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingContent, setEditingContent] = useState<WebsiteContent | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    // Verificar autenticación de admin
    const token = localStorage.getItem('access_token')
    const role = localStorage.getItem('user_role')

    if (!token || role !== 'admin') {
      window.location.href = '/login'
      return
    }

    // Simular carga de datos
    setTimeout(() => {
      setWebsiteContent([
        {
          id: 1,
          tipo_contenido: 'inicio_titulo',
          contenido: 'Estilo y Precisión en Cada Corte',
          activo: true
        },
        {
          id: 2,
          tipo_contenido: 'inicio_descripcion',
          contenido: 'Descubre la experiencia de un corte de cabello excepcional con nuestros barberos expertos.',
          activo: true
        },
        {
          id: 3,
          tipo_contenido: 'establecimiento_descripcion',
          contenido: 'Desde hace más de 10 años, hemos sido el referente en servicios de barbería en la ciudad.',
          activo: true
        }
      ])

      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@barberia.com',
          rol: 'admin',
          first_name: 'Admin',
          last_name: 'Sistema'
        },
        {
          id: 2,
          username: 'carlos_barbero',
          email: 'carlos@barberia.com',
          rol: 'barbero',
          first_name: 'Carlos',
          last_name: 'Rodríguez'
        },
        {
          id: 3,
          username: 'juan_cliente',
          email: 'juan@cliente.com',
          rol: 'cliente',
          first_name: 'Juan',
          last_name: 'Pérez'
        }
      ])

      setLoading(false)
    }, 1000)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  const handleEditContent = (content: WebsiteContent) => {
    setEditingContent(content)
  }

  const handleSaveContent = (updatedContent: WebsiteContent) => {
    setWebsiteContent(prev =>
      prev.map(item =>
        item.id === updatedContent.id ? updatedContent : item
      )
    )
    setEditingContent(null)
  }

  const handleCancelEdit = () => {
    setEditingContent(null)
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
              <Link href="/" className="text-xl font-bold text-primary-600">
                Barbería BarberRock - Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{localStorage.getItem('user_name') || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del admin */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary-100 rounded-full p-3">
                  <Settings className="w-8 h-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-gray-600">Gestiona todos los aspectos de tu barbería</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/" className="btn-secondary inline-flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Ver Sitio Web
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('website')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'website'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Sitio Web
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'services'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Servicios
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Image className="w-4 h-4 inline mr-2" />
              Galería
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuración
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* KPIs */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Citas este mes</p>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-3">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos del mes</p>
                  <p className="text-2xl font-bold text-gray-900">$18,500</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Contenido web</p>
                  <p className="text-2xl font-bold text-gray-900">{websiteContent.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'website' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Contenido del Sitio Web</h3>
                <button className="btn-primary inline-flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Contenido
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {websiteContent.map((content) => (
                  <div key={content.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {content.tipo_contenido.replace('_', ' ')}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          content.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {content.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => handleEditContent(content)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{content.contenido}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                <button className="btn-primary inline-flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </button>
              </div>
            </div>
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          user.rol === 'admin' ? 'bg-red-100 text-red-800' :
                          user.rol === 'barbero' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.rol}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{user.email}</p>
                      <p className="text-gray-500 text-sm">Usuario: {user.username}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Servicios</h3>
                <button className="btn-primary inline-flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Nuevo Servicio
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Panel de Servicios</p>
                <p className="text-gray-400 mb-4">Gestiona precios, duración y disponibilidad de servicios</p>
                <button className="btn-primary">Configurar Servicios</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Galería de Trabajos</h3>
                <button className="btn-primary inline-flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Subir Imágenes
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Galería de Imágenes</p>
                <p className="text-gray-400 mb-4">Gestiona las imágenes del sitio web y trabajos realizados</p>
                <button className="btn-primary">Gestionar Galería</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Configuración General</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Configuración del Sistema</p>
                <p className="text-gray-400 mb-4">Horarios, políticas, notificaciones y configuraciones avanzadas</p>
                <button className="btn-primary">Configurar Sistema</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición de contenido */}
        {editingContent && (
          <WebsiteContentEditor
            content={editingContent}
            onSave={handleSaveContent}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  )
}
