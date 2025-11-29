'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Edit, Trash2, Plus, Image as ImageIcon, Video, Eye, Save, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import Image from 'next/image'

interface GalleryItem {
  id?: number
  titulo: string
  descripcion: string
  imagen?: string
  video_url?: string
  video_file?: string
  tipo_medio: 'imagen' | 'video'
  tipo_video?: 'url' | 'file' | null
  orden: number
  activo: boolean
  fecha_creacion?: string
}

interface WebsiteContentImage {
  id: number
  tipo_contenido: string
  contenido: string
  imagen?: string | null
  activo: boolean
}

export default function GalleryManager() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [websiteContentImages, setWebsiteContentImages] = useState<WebsiteContentImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [editingWebsiteImage, setEditingWebsiteImage] = useState<WebsiteContentImage | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    loadGalleryItems()
    loadWebsiteContentImages()
  }, [])

  const loadWebsiteContentImages = async () => {
    try {
      const accessToken = localStorage.getItem('access_token')
      // Cargar todas las páginas si hay paginación
      let allItems: WebsiteContentImage[] = []
      let nextUrl: string | null = 'http://137.184.35.178:8000/api/contenido/'
      
      while (nextUrl) {
        const response: Response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const data: any = await response.json()
          const pageData = Array.isArray(data) ? data : data.results || []
          allItems = [...allItems, ...pageData]
          nextUrl = data.next || null
        } else {
          break
        }
      }

      // Filtrar solo los elementos que son campos de imagen (con o sin imagen)
      const imageTypes = ['logo_barberia', 'inicio_hero_image', 'establecimiento_imagen', 'servicios_imagen']
      const existingImages = allItems.filter((item: WebsiteContentImage) => 
        imageTypes.includes(item.tipo_contenido)
      )
      
      // Asegurar que siempre se muestren los 4 tipos, incluso si no existen
      const allImageTypes: WebsiteContentImage[] = imageTypes.map(tipo => {
        const existing = existingImages.find(item => item.tipo_contenido === tipo)
        return existing || {
          id: 0, // 0 indica que no existe y se debe crear
          tipo_contenido: tipo,
          contenido: ' ', // Espacio en blanco como valor mínimo requerido
          imagen: null,
          activo: true
        }
      })
      
      setWebsiteContentImages(allImageTypes)
    } catch (error) {
      console.error('Error loading website content images:', error)
    }
  }

  const getImageLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'logo_barberia': 'Logo principal',
      'inicio_hero_image': 'Imagen de fondo (Hero)',
      'establecimiento_imagen': 'Imagen del establecimiento',
      'servicios_imagen': 'Imagen de servicios',
    }
    return labels[tipo] || tipo
  }

  const handleEditWebsiteImage = async (item: WebsiteContentImage, imageFile?: File | null) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const formData = new FormData()
      
      if (imageFile) {
        formData.append('imagen', imageFile)
      } else if (item.imagen === null && item.id && item.id > 0) {
        // Solo enviar imagen vacía si es una actualización y queremos eliminar la imagen
        formData.append('imagen', '')
      }
      
      formData.append('activo', item.activo.toString())
      
      // Si es un nuevo elemento, agregar tipo_contenido y contenido
      if (!item.id || item.id === 0) {
        formData.append('tipo_contenido', item.tipo_contenido)
        // El campo contenido es requerido, usar un valor por defecto si está vacío
        const contenidoValue = (item.contenido && item.contenido.trim()) 
          ? item.contenido.trim()
          : 'Imagen de configuración' // Valor por defecto descriptivo
        formData.append('contenido', contenidoValue)
      } else {
        // Para elementos existentes, siempre enviar contenido (aunque sea el mismo)
        const contenidoValue = (item.contenido && item.contenido.trim()) 
          ? item.contenido.trim()
          : 'Imagen de configuración'
        formData.append('contenido', contenidoValue)
      }

      const url = item.id && item.id > 0
        ? `http://137.184.35.178:8000/api/contenido/${item.id}/`
        : 'http://137.184.35.178:8000/api/contenido/'
      const method = (item.id && item.id > 0) ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      })

      if (response.ok) {
        alert('✅ Imagen actualizada correctamente.\n\n💡 Recarga la página principal (Ctrl+F5) para ver los cambios.')
        loadWebsiteContentImages()
        setEditingWebsiteImage(null)
        setSelectedFile(null)
        setPreviewUrl(null)
      } else {
        const errorData = await response.json()
        alert(`Error: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error updating website image:', error)
      alert('Error de conexión')
    }
  }

  const loadGalleryItems = async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch('http://137.184.35.178:8000/api/galeria/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const items = Array.isArray(data) ? data : data.results || []
        setGalleryItems(items.sort((a: any, b: any) => a.orden - b.orden))
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Detectar tipo de medio
      if (editingItem) {
        const tipo = file.type.startsWith('video/') ? 'video' : 'imagen'
        setEditingItem({ ...editingItem, tipo_medio: tipo })
      }
    }
  }

  const handleSave = async () => {
    if (!editingItem) return

    try {
      const accessToken = localStorage.getItem('access_token')
      const formData = new FormData()

      // Si hay archivo nuevo (imagen o video)
      if (selectedFile) {
        if (editingItem.tipo_medio === 'imagen') {
          formData.append('imagen', selectedFile)
        } else if (editingItem.tipo_medio === 'video') {
          formData.append('video_file', selectedFile)
        }
      } 
      // Si se eliminó la imagen (campo vacío)
      else if (editingItem.imagen === '' && editingItem.id) {
        formData.append('imagen', '')
      }
      // Si se eliminó el video (campo vacío)
      else if (editingItem.video_file === '' && editingItem.id) {
        formData.append('video_file', '')
      }

      formData.append('titulo', editingItem.titulo)
      formData.append('descripcion', editingItem.descripcion)
      formData.append('orden', editingItem.orden.toString())
      formData.append('activo', editingItem.activo.toString())

      if (editingItem.tipo_medio === 'video') {
        if (editingItem.video_url) {
          formData.append('video_url', editingItem.video_url)
        }
      }

      const url = editingItem.id
        ? `http://137.184.35.178:8000/api/galeria/${editingItem.id}/`
        : 'http://137.184.35.178:8000/api/galeria/'

      const method = editingItem.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      })

      if (response.ok) {
        alert('✅ Elemento guardado correctamente.\n\n💡 Recarga la página principal (Ctrl+F5) para ver los cambios en la galería.')
        setShowModal(false)
        setEditingItem(null)
        setSelectedFile(null)
        setPreviewUrl(null)
        loadGalleryItems()
      } else {
        const errorData = await response.json()
        alert(`Error: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Error de conexión')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return

    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`http://137.184.35.178:8000/api/galeria/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        alert('Elemento eliminado correctamente')
        loadGalleryItems()
      } else {
        alert('Error al eliminar el elemento')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error de conexión')
    }
  }

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = galleryItems.findIndex(item => item.id === id)
    if (currentIndex === -1) return

    const newItems = [...galleryItems]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= newItems.length) return

    // Intercambiar órdenes
    const temp = newItems[currentIndex].orden
    newItems[currentIndex].orden = newItems[targetIndex].orden
    newItems[targetIndex].orden = temp

    // Actualizar en el servidor
    try {
      const accessToken = localStorage.getItem('access_token')
      
      await fetch(`http://137.184.35.178:8000/api/galeria/${newItems[currentIndex].id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orden: newItems[currentIndex].orden }),
      })

      await fetch(`http://137.184.35.178:8000/api/galeria/${newItems[targetIndex].id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orden: newItems[targetIndex].orden }),
      })

      loadGalleryItems()
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Error al reordenar')
    }
  }

  const openAddModal = () => {
    setEditingItem({
      titulo: '',
      descripcion: '',
      tipo_medio: 'imagen',
      orden: galleryItems.length,
      activo: true,
    })
    setShowModal(true)
    setPreviewUrl(null)
    setSelectedFile(null)
  }

  const openEditModal = (item: GalleryItem) => {
    const tipoMedio = item.imagen ? 'imagen' : (item.video_file || item.video_url ? 'video' : 'imagen')
    setEditingItem({ ...item, tipo_medio: tipoMedio })
    setShowModal(true)
    setPreviewUrl(null)
    setSelectedFile(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando galería...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Galería</h2>
          <p className="text-gray-600 mt-1">Administra las imágenes y videos que se mostrarán en tu sitio web</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar Medio
        </button>
      </div>

      {/* Sección de imágenes del sitio web */}
      {websiteContentImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Imágenes del sitio web</h3>
            <span className="text-sm text-gray-500">(Se muestran en diferentes secciones de la página)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteContentImages.map((item) => (
              <div
                key={item.tipo_contenido}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 bg-gray-100">
                  {item.imagen ? (
                    <img
                      src={item.imagen.startsWith('http') ? item.imagen : `http://137.184.35.178:8000${item.imagen}`}
                      alt={getImageLabel(item.tipo_contenido)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-yellow-50">
                      <div className="text-center text-yellow-600">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-xs">Sin imagen</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{getImageLabel(item.tipo_contenido)}</h4>
                  <p className="text-xs text-gray-500 mb-3">{item.tipo_contenido}</p>
                  <button
                    onClick={() => {
                      setEditingWebsiteImage(item)
                      setPreviewUrl(null)
                      setSelectedFile(null)
                    }}
                    className="w-full btn-secondary text-sm py-2 flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar imagen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Separador */}
      {websiteContentImages.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Galería de trabajos</h3>
            <span className="text-sm text-gray-500">(Imágenes y videos de la galería principal)</span>
          </div>
        </div>
      )}

      {/* Grid de galería */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, index) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Preview */}
            <div className="relative h-48 bg-gray-100">
              {item.imagen ? (
                <img
                  src={item.imagen.startsWith('http') ? item.imagen : `http://137.184.35.178:8000${item.imagen}`}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Mostrar icono si falla la carga
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'w-full h-full flex items-center justify-center bg-red-50'
                      placeholder.innerHTML = `
                        <div class="text-center text-red-600 p-4">
                          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                          <p class="text-xs">Error al cargar imagen</p>
                        </div>
                      `
                      parent.appendChild(placeholder)
                    }
                  }}
                />
              ) : item.video_url ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <Video className="w-16 h-16 text-white opacity-50" />
                  <p className="absolute bottom-2 left-2 right-2 text-white text-xs bg-black bg-opacity-50 p-1 rounded truncate">
                    {item.video_url}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-yellow-50">
                  <div className="text-center text-yellow-600">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xs">Sin imagen</p>
                  </div>
                </div>
              )}

              {/* Badge de estado */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Badge de tipo */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
                  {item.imagen ? <ImageIcon className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
                  {item.imagen ? 'Imagen' : 'Video'}
                </span>
              </div>
            </div>

            {/* Información */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{item.titulo}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.descripcion}</p>
                </div>
                <span className="ml-2 text-sm text-gray-500 font-mono">#{item.orden}</span>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReorder(item.id!, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Mover arriba"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReorder(item.id!, 'down')}
                    disabled={index === galleryItems.length - 1}
                    className={`p-1 rounded ${
                      index === galleryItems.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Mover abajo"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => item.id && handleDelete(item.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {galleryItems.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay elementos en la galería</h3>
            <p className="text-gray-600 mb-4">Comienza agregando imágenes o videos para tu galería</p>
            <button onClick={openAddModal} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Elemento
            </button>
          </div>
        )}
      </div>

      {/* Modal de agregar/editar */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingItem.id ? 'Editar' : 'Agregar'} Elemento
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tipo de medio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de medio
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setEditingItem({ ...editingItem, tipo_medio: 'imagen', video_url: '' })}
                      className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                        editingItem.tipo_medio === 'imagen'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-medium">Imagen</span>
                    </button>
                    <button
                      onClick={() => setEditingItem({ ...editingItem, tipo_medio: 'video' })}
                      className={`flex-1 p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                        editingItem.tipo_medio === 'video'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="font-medium">Video</span>
                    </button>
                  </div>
                </div>

                {/* Subir archivo o URL de video */}
                {editingItem.tipo_medio === 'imagen' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                      {previewUrl || editingItem.imagen ? (
                        <div className="space-y-4">
                          <img
                            src={previewUrl || (editingItem.imagen && editingItem.imagen.startsWith('http') ? editingItem.imagen : `http://137.184.35.178:8000${editingItem.imagen || ''}`)}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E'
                            }}
                          />
                          <div className="flex justify-center space-x-4">
                            <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center">
                              <Upload className="w-4 h-4 mr-1" />
                              Cambiar imagen
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </label>
                            {editingItem.imagen && (
                              <button
                                onClick={() => {
                                  if (confirm('¿Eliminar la imagen actual?')) {
                                    setEditingItem({ ...editingItem, imagen: '' })
                                    setPreviewUrl(null)
                                    setSelectedFile(null)
                                  }
                                }}
                                className="text-sm text-red-600 hover:text-red-800 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            Haz clic para subir o arrastra una imagen aquí
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Opción 1: Subir archivo MP4 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subir Video MP4
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                        {previewUrl || editingItem.video_file ? (
                          <div className="space-y-4">
                            <div className="bg-gray-900 rounded-lg p-8 flex items-center justify-center">
                              <Video className="w-16 h-16 text-white opacity-50" />
                            </div>
                            <div className="flex justify-center space-x-4">
                              <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                <Upload className="w-4 h-4 mr-1" />
                                Cambiar video
                                <input
                                  type="file"
                                  accept="video/mp4,video/*"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                              </label>
                              {editingItem.video_file && (
                                <button
                                  onClick={() => {
                                    if (confirm('¿Eliminar el video actual?')) {
                                      setEditingItem({ ...editingItem, video_file: '', video_url: '' })
                                      setPreviewUrl(null)
                                      setSelectedFile(null)
                                    }
                                  }}
                                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                                </button>
                              )}
                            </div>
                            {editingItem.video_file && (
                              <p className="text-xs text-gray-500">
                                Video: {editingItem.video_file}
                              </p>
                            )}
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-1">
                              Haz clic para subir un archivo MP4
                            </p>
                            <p className="text-xs text-gray-500">MP4 hasta 100MB</p>
                            <input
                              type="file"
                              accept="video/mp4,video/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    
                    {/* Opción 2: URL de video (YouTube, Vimeo, etc.) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        O usar URL de Video (YouTube, Vimeo, etc.)
                      </label>
                      <input
                        type="url"
                        value={editingItem.video_url || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, video_url: e.target.value, video_file: '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        YouTube, Vimeo o enlace directo a video
                      </p>
                    </div>
                  </div>
                )}

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editingItem.titulo}
                    onChange={(e) => setEditingItem({ ...editingItem, titulo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: Corte degradado"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editingItem.descripcion}
                    onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descripción del trabajo realizado..."
                  />
                </div>

                {/* Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de aparición
                  </label>
                  <input
                    type="number"
                    value={editingItem.orden}
                    onChange={(e) => setEditingItem({ ...editingItem, orden: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                {/* Estado activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.activo}
                    onChange={(e) => setEditingItem({ ...editingItem, activo: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <label className="text-sm text-gray-700">Mostrar en galería pública</label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingItem(null)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar imagen de WebsiteContent */}
      {editingWebsiteImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Editar {getImageLabel(editingWebsiteImage.tipo_contenido)}
                </h3>
                <button
                  onClick={() => {
                    setEditingWebsiteImage(null)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Subir imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    {previewUrl || editingWebsiteImage.imagen ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl || (editingWebsiteImage.imagen?.startsWith('http') ? editingWebsiteImage.imagen : `http://137.184.35.178:8000${editingWebsiteImage.imagen}`)}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded"
                        />
                        <div className="flex justify-center space-x-4">
                          <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center">
                            <Upload className="w-4 h-4 mr-1" />
                            Cambiar imagen
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setSelectedFile(file)
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    setPreviewUrl(reader.result as string)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {editingWebsiteImage.imagen && (
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar la imagen actual?')) {
                                  setEditingWebsiteImage({ ...editingWebsiteImage, imagen: null })
                                  setPreviewUrl(null)
                                  setSelectedFile(null)
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Haz clic para subir o arrastra una imagen aquí
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setSelectedFile(file)
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setPreviewUrl(reader.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Estado activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingWebsiteImage.activo}
                    onChange={(e) => setEditingWebsiteImage({ ...editingWebsiteImage, activo: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <label className="text-sm text-gray-700">Mostrar en la página web</label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setEditingWebsiteImage(null)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEditWebsiteImage(editingWebsiteImage, selectedFile)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



