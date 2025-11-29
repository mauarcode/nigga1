'use client'

import { useState, useEffect } from 'react'
import { Scissors, Edit, Trash2, Plus, X, Save, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

interface Servicio {
  id: number
  nombre: string
  descripcion: string
  precio: string
  comision_barbero: string
  duracion: number
  categoria?: string
  activo: boolean
}

interface FormData {
  nombre: string
  descripcion: string
  precio: number
  comision_barbero: number
  duracion: number
  categoria: string
  activo: boolean
}

export default function ServicesManager() {
  const [services, setServices] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentService, setCurrentService] = useState<Servicio | null>(null)
const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    precio: 0,
    comision_barbero: 0,
    duracion: 30,
    categoria: '',
    activo: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get('http://137.184.35.178:8000/api/admin/servicios/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data: Servicio[] = response.data.map((service: any) => ({
        ...service,
        precio: service.precio?.toString() ?? '0',
        comision_barbero: service.comision_barbero?.toString() ?? '0',
      }))
      setServices(data)
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      alert('Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : type === 'number'
          ? parseFloat(value) || 0
          : value
    }))
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: 0,
      comision_barbero: 0,
      duracion: 30,
      categoria: '',
      activo: true
    })
    setIsEditing(false)
    setCurrentService(null)
  }

  const handleAddClick = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEditClick = (service: Servicio) => {
    setIsEditing(true)
    setCurrentService(service)
    setFormData({
      nombre: service.nombre,
      descripcion: service.descripcion,
      precio: parseFloat(service.precio ?? '0') || 0,
      comision_barbero: parseFloat(service.comision_barbero ?? '0') || 0,
      duracion: service.duracion,
      categoria: service.categoria || '',
      activo: service.activo
    })
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

      if (isEditing && currentService) {
        // Actualizar servicio existente
        await axios.put(
          `http://137.184.35.178:8000/api/admin/servicios/${currentService.id}/`,
          formData,
          { headers }
        )
        alert('Servicio actualizado exitosamente')
      } else {
        // Crear nuevo servicio
        await axios.post(
          'http://137.184.35.178:8000/api/admin/servicios/',
          formData,
          { headers }
        )
        alert('Servicio creado exitosamente')
      }

      setShowModal(false)
      resetForm()
      fetchServices()
    } catch (error: any) {
      console.error('Error al guardar servicio:', error)
      const errorMsg = error.response?.data?.error || 'Error al guardar servicio'
      alert(errorMsg)
    }
  }

  const handleDelete = async (service: Servicio) => {
    if (!window.confirm(`¿Estás seguro de eliminar el servicio "${service.nombre}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      await axios.delete(`http://137.184.35.178:8000/api/admin/servicios/${service.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      alert('Servicio eliminado exitosamente')
      fetchServices()
    } catch (error) {
      console.error('Error al eliminar servicio:', error)
      alert('Error al eliminar servicio')
    }
  }

  const getServiceIcon = (nombre: string) => {
    const lower = nombre.toLowerCase()
    if (lower.includes('corte')) return '✂️'
    if (lower.includes('barba')) return '🧔'
    if (lower.includes('afeitado')) return '🪒'
    if (lower.includes('tratamiento') || lower.includes('masaje')) return '💆'
    if (lower.includes('tinte') || lower.includes('color')) return '🎨'
    return '✨'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando servicios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Servicios</h3>
            <button
              onClick={handleAddClick}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </button>
          </div>
        </div>
        <div className="p-6">
          {services.length === 0 ? (
            <p className="text-gray-600 text-center">No hay servicios registrados</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{getServiceIcon(service.nombre)}</span>
                      <div>
                        <h4 className="font-semibold text-lg">{service.nombre}</h4>
                        {service.categoria && (
                          <span className="text-xs text-gray-500">{service.categoria}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      service.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.descripcion}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">${service.precio}</div>
                      <div className="text-sm text-gray-500">{service.duracion} minutos</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Comisión barbero: ${service.comision_barbero || '0.00'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                    <button
                      onClick={() => handleEditClick(service)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar servicio */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="mt-1 block w-full input-field"
                  placeholder="Ej: Corte de Cabello Clásico"
                  required
                />
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                  Descripción *
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full input-field"
                  placeholder="Describe el servicio..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
                    Precio (MXN) *
                  </label>
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    placeholder="250"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="comision_barbero" className="block text-sm font-medium text-gray-700">
                    Comisión para barbero (MXN)
                  </label>
                  <input
                    type="number"
                    id="comision_barbero"
                    name="comision_barbero"
                    value={formData.comision_barbero}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    placeholder="150"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="duracion" className="block text-sm font-medium text-gray-700">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    id="duracion"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleInputChange}
                    className="mt-1 block w-full input-field"
                    placeholder="30"
                    min="15"
                    step="15"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="mt-1 block w-full input-field"
                  placeholder="Cortes"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                  Servicio activo (visible para clientes)
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
                  {isEditing ? 'Actualizar' : 'Crear'} Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


