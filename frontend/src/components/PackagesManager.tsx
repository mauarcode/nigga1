'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Edit, Trash2, Save, X, Image as ImageIcon, Upload, ToggleLeft, ToggleRight, Scissors, ShoppingBag } from 'lucide-react'
import axios from 'axios'

interface Service {
  id: number
  nombre: string
  precio: number
  activo?: boolean
}

interface Product {
  id: number
  nombre: string
  precio: number
  activo?: boolean
}

interface PackageData {
  id: number
  nombre: string
  descripcion: string
  precio: string
  imagen?: string | null
  activo: boolean
  servicios: Service[]
  productos: Product[]
  fecha_creacion: string
}

interface FormState {
  nombre: string
  descripcion: string
  precio: string
  activo: boolean
  servicio_ids: number[]
  producto_ids: number[]
}

export default function PackagesManager() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPackage, setCurrentPackage] = useState<PackageData | null>(null)
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    descripcion: '',
    precio: '',
    activo: true,
    servicio_ids: [],
    producto_ids: [],
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchPackages()
    fetchServices()
    fetchProducts()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return null
    }
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://137.184.35.178:8000/api/paquetes/', {
        headers: getAuthHeaders() || undefined,
      })
      const data = Array.isArray(response.data) ? response.data : response.data?.results || []
      setPackages(data)
    } catch (error: any) {
      console.error('Error al cargar paquetes:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://137.184.35.178:8000/api/servicios/')
      const data = Array.isArray(response.data) ? response.data : response.data?.results || []
      setServices(data.filter((s: Service) => s.activo !== false))
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://137.184.35.178:8000/api/productos/')
      const data = Array.isArray(response.data) ? response.data : response.data?.results || []
      setProducts(data.filter((p: Product) => p.activo !== false))
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      activo: true,
      servicio_ids: [],
      producto_ids: [],
    })
    setSelectedImage(null)
    setPreviewUrl(null)
    setCurrentPackage(null)
  }

  const handleOpenCreate = () => {
    setIsEditing(false)
    resetForm()
    setShowModal(true)
  }

  const handleOpenEdit = (pkg: PackageData) => {
    setIsEditing(true)
    setCurrentPackage(pkg)
    setFormData({
      nombre: pkg.nombre,
      descripcion: pkg.descripcion || '',
      precio: pkg.precio.toString(),
      activo: pkg.activo,
      servicio_ids: pkg.servicios.map(s => s.id),
      producto_ids: pkg.productos.map(p => p.id),
    })
    if (pkg.imagen) {
      setPreviewUrl(`http://137.184.35.178:8000${pkg.imagen}`)
    }
    setShowModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    if (currentPackage) {
      setCurrentPackage({ ...currentPackage, imagen: null })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) return

      const payload = new FormData()
      payload.append('nombre', formData.nombre)
      payload.append('descripcion', formData.descripcion)
      payload.append('precio', formData.precio || '0')
      payload.append('activo', String(formData.activo))
      formData.servicio_ids.forEach(id => payload.append('servicio_ids', id.toString()))
      formData.producto_ids.forEach(id => payload.append('producto_ids', id.toString()))

      if (selectedImage) {
        payload.append('imagen', selectedImage)
      } else if (isEditing && currentPackage && !currentPackage.imagen && !previewUrl) {
        payload.append('imagen', '')
      }

      if (isEditing && currentPackage) {
        await axios.patch(`http://137.184.35.178:8000/api/paquetes/${currentPackage.id}/`, payload, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        })
        alert('Paquete actualizado correctamente.')
      } else {
        await axios.post('http://137.184.35.178:8000/api/paquetes/', payload, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        })
        alert('Paquete creado correctamente.')
      }

      setShowModal(false)
      resetForm()
      fetchPackages()
    } catch (error: any) {
      console.error('Error al guardar paquete:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      } else {
        const message = error.response?.data?.error || 'No fue posible guardar el paquete.'
        alert(message)
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este paquete?')) return

    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) return

      await axios.delete(`http://137.184.35.178:8000/api/paquetes/${id}/`, { headers: authHeaders })
      alert('Paquete eliminado correctamente.')
      fetchPackages()
    } catch (error: any) {
      console.error('Error al eliminar paquete:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      } else {
        alert('No fue posible eliminar el paquete.')
      }
    }
  }

  const handleToggleActive = async (pkg: PackageData) => {
    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) return

      await axios.patch(
        `http://137.184.35.178:8000/api/paquetes/${pkg.id}/`,
        { activo: !pkg.activo },
        { headers: authHeaders }
      )
      fetchPackages()
    } catch (error: any) {
      console.error('Error al actualizar estado:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login'
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando paquetes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Paquetes</h2>
            <p className="text-gray-600 mt-1">Crea paquetes combinando servicios y/o productos.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo paquete
          </button>
        </div>

        <div className="p-6">
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay paquetes registrados aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{pkg.nombre}</h3>
                      <p className="text-sm text-gray-500">Creado el {new Date(pkg.fecha_creacion).toLocaleDateString('es-MX')}</p>
                    </div>
                    <button onClick={() => handleToggleActive(pkg)} title={pkg.activo ? 'Desactivar' : 'Activar'}>
                      {pkg.activo ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {pkg.imagen && (
                    <img
                      src={`http://137.184.35.178:8000${pkg.imagen}`}
                      alt={pkg.nombre}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <p className="text-gray-600 mb-4 line-clamp-2">{pkg.descripcion}</p>

                  <div className="mb-4">
                    {pkg.servicios.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Servicios:</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.servicios.map(service => (
                            <span key={service.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              <Scissors className="w-3 h-3" />
                              {service.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {pkg.productos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Productos:</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.productos.map(product => (
                            <span key={product.id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              <ShoppingBag className="w-3 h-3" />
                              {product.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-2xl font-bold text-primary-600">${parseFloat(pkg.precio).toFixed(2)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(pkg)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Paquete' : 'Nuevo Paquete'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del paquete *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Ej: Paquete Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Servicios incluidos</label>
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay servicios disponibles</p>
                  ) : (
                    <div className="space-y-2">
                      {services.map(service => (
                        <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.servicio_ids.includes(service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, servicio_ids: [...formData.servicio_ids, service.id] })
                              } else {
                                setFormData({ ...formData, servicio_ids: formData.servicio_ids.filter(id => id !== service.id) })
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700">{service.nombre} - ${service.precio}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos incluidos</label>
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay productos disponibles</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map(product => (
                        <label key={product.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.producto_ids.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, producto_ids: [...formData.producto_ids, product.id] })
                              } else {
                                setFormData({ ...formData, producto_ids: formData.producto_ids.filter(id => id !== product.id) })
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700">{product.nombre} - ${product.precio}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                  Paquete activo
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={4}
                  className="input-field"
                  placeholder="Describe el paquete"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del paquete</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img src={previewUrl} alt="Preview" className="max-h-56 mx-auto rounded-lg object-cover" />
                      <div className="flex justify-center gap-4">
                        <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Cambiar imagen
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-sm text-red-600 hover:text-red-800 inline-flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Quitar imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Haz clic o arrastra una imagen aquí</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary inline-flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}





