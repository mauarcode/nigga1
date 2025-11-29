'use client'

import { useState, useEffect } from 'react'
import { User, Edit, Trash2, Plus, X, Save, Eye, EyeOff, QrCode } from 'lucide-react'
import axios from 'axios'

interface Usuario {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  rol: 'admin' | 'barbero' | 'cliente'
  telefono?: string
  is_active: boolean
  date_joined: string
  fecha_nacimiento?: string | null
  last_visit?: string | null
  whatsapp_link?: string | null
  barber_summary?: {
    cortes_dia: number
    cortes_mes: number
    comision_dia: number
    comision_mes: number
  } | null
}

interface FormData {
  username: string
  email: string
  first_name: string
  last_name: string
  rol: 'admin' | 'barbero' | 'cliente'
  telefono: string
  fecha_nacimiento: string
  password: string
  is_active: boolean
}

export default function UsersManager() {
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'todos' | 'clientes' | 'barberos'>('todos')
  const [barberQR, setBarberQR] = useState<{ qr_token?: string; qr_url?: string } | null>(null)
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    rol: 'cliente',
    telefono: '',
    fecha_nacimiento: '',
    password: '',
    is_active: true
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get('http://137.184.35.178:8000/api/admin/usuarios/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const normalized: Usuario[] = (response.data || []).map((user: any) => ({
        ...user,
        telefono: user.telefono || '',
        fecha_nacimiento: user.fecha_nacimiento || null,
        last_visit: user.last_visit || null,
        whatsapp_link: user.whatsapp_link || null,
        barber_summary: user.barber_summary || null,
      }))

      setUsers(normalized)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      alert('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      rol: 'cliente',
      telefono: '',
      fecha_nacimiento: '',
      password: '',
      is_active: true
    })
    setIsEditing(false)
    setCurrentUser(null)
    setShowPassword(false)
    setBarberQR(null)
  }

  const handleAddClick = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEditClick = async (user: Usuario) => {
    setIsEditing(true)
    setCurrentUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      rol: user.rol,
      telefono: user.telefono || '',
      fecha_nacimiento: user.fecha_nacimiento ? user.fecha_nacimiento.slice(0, 10) : '',
      password: '', // No precargamos la contraseña
      is_active: user.is_active
    })
    
    // Si es barbero, cargar su perfil para obtener el QR
    if (user.rol === 'barbero') {
      try {
        const token = localStorage.getItem('access_token')
        const barberosResponse = await axios.get('http://137.184.35.178:8000/api/barberos/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const barberosList = barberosResponse.data.results || barberosResponse.data
        const barberProfile = Array.isArray(barberosList) 
          ? barberosList.find((b: any) => b.user?.id === user.id)
          : null
        if (barberProfile) {
          setBarberQR({
            qr_token: barberProfile.qr_token,
            qr_url: barberProfile.qr_url || (barberProfile.qr_token ? `http://localhost:3000/encuesta/qr/${barberProfile.qr_token}` : undefined)
          })
        }
      } catch (error) {
        console.error('Error al cargar perfil del barbero:', error)
      }
    } else {
      setBarberQR(null)
    }
    
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      if (isEditing && currentUser) {
        // Actualizar usuario existente
        const updateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          telefono: formData.telefono,
          rol: formData.rol,
          is_active: formData.is_active,
          fecha_nacimiento: formData.fecha_nacimiento || null,
        }

        // Solo incluir password si se proporciona
        if (formData.password) {
          updateData.password = formData.password
        }

        await axios.put(
          `http://137.184.35.178:8000/api/admin/usuarios/${currentUser.id}/`,
          updateData,
          { headers }
        )
        alert('Usuario actualizado exitosamente')
      } else {
        // Crear nuevo usuario
        if (!formData.password) {
          alert('La contraseña es requerida para nuevos usuarios')
          return
        }

        const payload = {
          ...formData,
          fecha_nacimiento: formData.fecha_nacimiento || null,
        }

        await axios.post(
          'http://137.184.35.178:8000/api/admin/usuarios/',
          payload,
          { headers }
        )
        alert('Usuario creado exitosamente')
      }

      setShowModal(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.error('Error al guardar usuario:', error)
      const errorMsg = error.response?.data?.error || 'Error al guardar usuario'
      alert(errorMsg)
    }
  }

  const handleDelete = async (user: Usuario) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${user.username}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      await axios.delete(`http://137.184.35.178:8000/api/admin/usuarios/${user.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      alert('Usuario eliminado exitosamente')
      fetchUsers()
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert('Error al eliminar usuario')
    }
  }

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'barbero':
        return 'bg-blue-100 text-blue-800'
      case 'cliente':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter((user) => {
    if (activeFilter === 'clientes') {
      return user.rol === 'cliente'
    }
    if (activeFilter === 'barberos') {
      return user.rol === 'barbero'
    }
    return true
  })

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const barberSummaries = activeFilter === 'barberos'
    ? filteredUsers.filter((user) => user.barber_summary)
    : []

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return '0.00'
    return value.toFixed(2)
  }

  const getNextBirthday = (dateString?: string | null) => {
    if (!dateString) return null
    const birthDate = new Date(dateString)
    if (Number.isNaN(birthDate.getTime())) return null

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    let next = new Date(todayStart.getFullYear(), birthDate.getMonth(), birthDate.getDate())

    if (Number.isNaN(next.getTime())) {
      return null
    }

    if (next < todayStart) {
      next = new Date(todayStart.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
    }

    const diffDays = Math.round((next.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
    return { date: next, daysRemaining: diffDays }
  }

  const formatBirthday = (date: Date) => {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    })
  }

  const formatBirthdateFull = (value?: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const upcomingBirthdays = users
    .filter((user) => user.rol === 'cliente' && user.fecha_nacimiento)
    .map((user) => {
      const info = getNextBirthday(user.fecha_nacimiento)
      if (!info) return null
      return {
        user,
        nextDate: info.date,
        daysRemaining: info.daysRemaining,
      }
    })
    .filter((item): item is { user: Usuario; nextDate: Date; daysRemaining: number } => item !== null)
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'clientes', label: 'Clientes' },
                { key: 'barberos', label: 'Barberos' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setActiveFilter(option.key as typeof activeFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === option.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddClick}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {upcomingBirthdays.length > 0 && (
          <div className="px-6 py-6 border-b bg-amber-50/60">
            <h4 className="text-sm font-semibold text-amber-900 mb-4">
              Próximos cumpleaños de clientes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBirthdays.map(({ user, nextDate, daysRemaining }) => (
                <div key={user.id} className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs font-medium text-amber-700">
                      {daysRemaining === 0 ? 'Hoy' : `En ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Fecha: {formatBirthday(nextDate)}</span>
                    {user.whatsapp_link ? (
                      <a
                        href={user.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        Felicitar
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Sin contacto</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {barberSummaries.length > 0 && (
          <div className="px-6 py-6 border-b bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Resumen del desempeño de barberos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barberSummaries.map((barber) => (
                <div key={barber.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h5 className="text-base font-semibold text-gray-900">
                      {barber.first_name || barber.username}
                    </h5>
                    <span className="text-xs uppercase tracking-wide text-gray-500">Barbero</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Cortes hoy</p>
                      <p className="text-lg font-semibold text-gray-900">{barber.barber_summary?.cortes_dia ?? 0}</p>
                      <p className="text-xs text-gray-500">Comisión ${formatCurrency(barber.barber_summary?.comision_dia)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cortes mes</p>
                      <p className="text-lg font-semibold text-gray-900">{barber.barber_summary?.cortes_mes ?? 0}</p>
                      <p className="text-xs text-gray-500">Comisión ${formatCurrency(barber.barber_summary?.comision_mes)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-600 text-center">No hay usuarios registrados en esta categoría</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email / Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última visita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha nacimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha registro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        {user.telefono && (
                          <div className="text-sm text-gray-500">{user.telefono}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolBadge(user.rol)}`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(user.last_visit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatBirthdateFull(user.fecha_nacimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.whatsapp_link ? (
                          <a
                            href={user.whatsapp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700"
                          >
                            WhatsApp
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.date_joined).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button 
                onClick={() => { setShowModal(false); resetForm(); setBarberQR(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mostrar QR si es barbero */}
            {isEditing && formData.rol === 'barbero' && barberQR?.qr_token && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Código QR del Barbero</p>
                    <p className="text-xs text-blue-700 mt-1">Para recibir reseñas de clientes</p>
                  </div>
                  <div className="bg-white border-2 border-blue-200 rounded-lg p-2">
                    {barberQR.qr_url ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(barberQR.qr_url)}&margin=1`}
                        alt="QR Code"
                        className="w-20 h-20"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent && !parent.querySelector('.qr-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'qr-fallback w-20 h-20 flex items-center justify-center bg-gray-100 rounded'
                            fallback.innerHTML = '<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded">
                        <QrCode className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    required
                    disabled={isEditing} // No permitir cambiar username al editar
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    placeholder="5512345678"
                  />
                </div>
                <div>
                  <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                    Rol *
                  </label>
                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={(e) => {
                      handleInputChange(e)
                      // Si cambia a barbero y estamos editando, cargar el QR
                      if (e.target.value === 'barbero' && isEditing && currentUser) {
                        handleEditClick(currentUser)
                      } else if (e.target.value !== 'barbero') {
                        setBarberQR(null)
                      }
                    }}
                    className="mt-1 block w-full input-field"
                    required
                  >
                    <option value="cliente">Cliente</option>
                    <option value="barbero">Barbero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

            <div>
              <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                className="mt-1 block w-full input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña {isEditing ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field pr-10"
                    required={!isEditing}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!isEditing && (
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Usuario activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


