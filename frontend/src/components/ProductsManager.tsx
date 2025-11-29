'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Edit, Trash2, Save, X, Image as ImageIcon, Upload, ToggleLeft, ToggleRight } from 'lucide-react'
import axios from 'axios'
import PackagesManager from './PackagesManager'

interface Product {
  id: number
  nombre: string
  descripcion: string
  precio: string
  imagen?: string | null
  stock: number
  activo: boolean
  fecha_creacion: string
}

interface FormState {
  nombre: string
  descripcion: string
  precio: string
  stock: number
  activo: boolean
}

export default function ProductsManager() {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'packages'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: 0,
    activo: true,
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [authErrorNotified, setAuthErrorNotified] = useState(false)

  useEffect(() => {
    fetchProducts()
    
    const handleTabSwitch = (e: CustomEvent) => {
      setActiveSubTab(e.detail as 'products' | 'packages')
    }
    
    window.addEventListener('switchProductsTab' as any, handleTabSwitch)
    return () => {
      window.removeEventListener('switchProductsTab' as any, handleTabSwitch)
    }
  }, [])

  const handleUnauthorized = () => {
    if (!authErrorNotified) {
      setAuthErrorNotified(true)
      window.location.href = '/login'
    }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      handleUnauthorized()
      return null
    }
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get('http://137.184.35.178:8000/api/productos/', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const rawProducts: any[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : []
      const data: Product[] = rawProducts.map((product: any) => ({
        ...product,
        precio: product.precio?.toString() ?? '0',
      }))
      setProducts(data)
    } catch (error: unknown) {
      console.error('Error al cargar productos:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized()
      } else {
        alert('No fue posible cargar los productos.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: 0,
      activo: true,
    })
    setSelectedImage(null)
    setPreviewUrl(null)
    setIsEditing(false)
    setCurrentProduct(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) {
        return
      }
      await axios.patch(
        `http://137.184.35.178:8000/api/productos/${product.id}/`,
        { activo: !product.activo },
        {
          headers: {
            ...authHeaders,
          },
        }
      )
      fetchProducts()
    } catch (error: unknown) {
      console.error('Error al actualizar producto:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized()
      } else {
        alert('No fue posible actualizar el estado del producto.')
      }
    }
  }

  const handleEdit = (product: Product) => {
    setIsEditing(true)
    setCurrentProduct(product)
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      activo: product.activo,
    })
    setPreviewUrl(product.imagen ? `http://137.184.35.178:8000${product.imagen}` : null)
    setSelectedImage(null)
    setShowModal(true)
  }

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar el producto "${product.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }
    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) {
        return
      }
      await axios.delete(`http://137.184.35.178:8000/api/productos/${product.id}/`, {
        headers: {
          ...authHeaders,
        },
      })
      fetchProducts()
      alert('Producto eliminado correctamente.')
    } catch (error: unknown) {
      console.error('Error al eliminar producto:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized()
      } else {
        alert('No fue posible eliminar el producto.')
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
    if (currentProduct) {
      setCurrentProduct({ ...currentProduct, imagen: null })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const authHeaders = getAuthHeaders()
      if (!authHeaders) {
        return
      }
      const payload = new FormData()
      payload.append('nombre', formData.nombre)
      payload.append('descripcion', formData.descripcion)
      payload.append('precio', formData.precio || '0')
      payload.append('stock', String(formData.stock ?? 0))
      payload.append('activo', String(formData.activo))

      if (selectedImage) {
        payload.append('imagen', selectedImage)
      } else if (isEditing && currentProduct && !currentProduct.imagen && !previewUrl) {
        payload.append('imagen', '')
      }

      if (isEditing && currentProduct) {
        await axios.patch(`http://137.184.35.178:8000/api/productos/${currentProduct.id}/`, payload, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        })
        alert('Producto actualizado correctamente.')
      } else {
        await axios.post('http://137.184.35.178:8000/api/productos/', payload, {
          headers: {
            ...authHeaders,
            'Content-Type': 'multipart/form-data',
          },
        })
        alert('Producto creado correctamente.')
      }

      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      console.error('Error al guardar producto:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized()
      } else {
        const message = error.response?.data?.error || 'No fue posible guardar el producto.'
        alert(message)
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs para Productos y Paquetes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSubTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'products'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveSubTab('packages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'packages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Paquetes
            </button>
          </nav>
        </div>
      </div>

      {activeSubTab === 'packages' ? (
        <PackagesManager />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h2>
              <p className="text-gray-600 mt-1">Administra los productos disponibles en tu barbería.</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo producto
            </button>
          </div>

        <div className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay productos registrados aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{product.nombre}</h3>
                      <p className="text-sm text-gray-500">Creado el {new Date(product.fecha_creacion).toLocaleDateString('es-MX')}</p>
                    </div>
                    <button onClick={() => handleToggleActive(product)} title={product.activo ? 'Desactivar' : 'Activar'}>
                      {product.activo ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {product.imagen ? (
                    <img
                      src={product.imagen.startsWith('http') ? product.imagen : `http://137.184.35.178:8000${product.imagen}`}
                      alt={product.nombre}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}

                  <p className="text-gray-600 text-sm mb-4">{product.descripcion || 'Sin descripción'}</p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="text-lg font-semibold text-primary-600">${Number(product.precio).toFixed(2)}</span>
                    <span>Stock: {product.stock}</span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="input-field"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                    Producto activo
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe brevemente el producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del producto</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
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
                      <p className="text-xs text-gray-500">PNG, JPG o JPEG hasta 5MB</p>
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



