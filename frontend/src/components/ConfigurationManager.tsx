'use client'

import { useState, useEffect } from 'react'
import { Save, X, Edit, Upload, Trash2, Plus } from 'lucide-react'

interface PageSection {
  id?: number
  nombre: string
  tipo_seccion: string
  titulo: string
  subtitulo: string
  contenido: string
  imagen_fondo?: string | null
  imagen_principal?: string | null
  video_url: string
  boton_texto: string
  boton_url: string
  color_fondo: string
  color_texto: string
  orden: number
  activo: boolean
}

interface WebsiteContent {
  id: number
  tipo_contenido: string
  contenido: string
  imagen?: string | null
  activo: boolean
}

interface SystemSettings {
  id?: number
  tipo_configuracion: string
  clave: string
  valor: string
  descripcion: string
}

const WEBSITE_CONTENT_GROUPS: Array<{ group: string; options: Array<{ value: string; label: string }> }> = [
  {
    group: 'Identidad y branding',
    options: [
      { value: 'nombre_barberia', label: 'Nombre de la barbería' },
      { value: 'slogan', label: 'Slogan' },
      { value: 'logo_barberia', label: 'Logo principal (se muestra en el header)' },
      { value: 'branding_color_primario', label: 'Color primario' },
      { value: 'branding_color_secundario', label: 'Color secundario' },
    ],
  },
  {
    group: 'Inicio / Hero',
    options: [
      { value: 'inicio_titulo', label: 'Título principal' },
      { value: 'inicio_subtitulo', label: 'Subtítulo' },
      { value: 'inicio_descripcion', label: 'Descripción' },
      { value: 'inicio_hero_image', label: 'Imagen de fondo (Hero) (se muestra en la sección principal)' },
      { value: 'hero_color_fondo', label: 'Color de fondo' },
    ],
  },
  {
    group: 'Características destacadas',
    options: [
      { value: 'features_color_fondo', label: 'Color de fondo' },
      { value: 'features_color_icono', label: 'Color de íconos' },
      { value: 'caracteristica_1_titulo', label: 'Título 1' },
      { value: 'caracteristica_1_descripcion', label: 'Descripción 1' },
      { value: 'caracteristica_2_titulo', label: 'Título 2' },
      { value: 'caracteristica_2_descripcion', label: 'Descripción 2' },
      { value: 'caracteristica_3_titulo', label: 'Título 3' },
      { value: 'caracteristica_3_descripcion', label: 'Descripción 3' },
      { value: 'caracteristica_4_titulo', label: 'Título 4' },
      { value: 'caracteristica_4_descripcion', label: 'Descripción 4' },
    ],
  },
  {
    group: 'Servicios y productos',
    options: [
      { value: 'servicios_descripcion', label: 'Servicios · Descripción' },
      { value: 'servicios_imagen', label: 'Servicios · Imagen principal (opcional, para futuras mejoras)' },
      { value: 'servicios_color_fondo', label: 'Servicios · Color de fondo' },
      { value: 'catalogo_titulo', label: 'Catálogo · Título' },
      { value: 'catalogo_descripcion', label: 'Catálogo · Descripción' },
      { value: 'productos_color_fondo', label: 'Catálogo · Color de fondo' },
    ],
  },
  {
    group: 'Ubicación',
    options: [
      { value: 'ubicacion_titulo', label: 'Ubicación · Título' },
      { value: 'ubicacion_descripcion', label: 'Ubicación · Descripción' },
      { value: 'ubicacion_direccion', label: 'Ubicación · Dirección' },
      { value: 'ubicacion_maps_url', label: 'Ubicación · URL de Google Maps' },
      { value: 'ubicacion_color_fondo', label: 'Ubicación · Color de fondo' },
    ],
  },
  {
    group: 'Establecimiento',
    options: [
      { value: 'establecimiento_titulo', label: 'Título' },
      { value: 'establecimiento_descripcion', label: 'Descripción principal' },
      { value: 'descripcion_general', label: 'Descripción secundaria' },
      { value: 'establecimiento_imagen', label: 'Imagen del establecimiento (se muestra en la página web)' },
      { value: 'establecimiento_color_fondo', label: 'Color de fondo' },
      { value: 'establecimiento_historia', label: 'Historia' },
      { value: 'establecimiento_mision', label: 'Misión' },
      { value: 'establecimiento_vision', label: 'Visión' },
    ],
  },
  {
    group: 'Galería y testimonios',
    options: [
      { value: 'galeria_color_fondo', label: 'Galería · Color de fondo' },
      { value: 'galeria_descripcion', label: 'Galería · Descripción' },
      { value: 'galeria_placeholder_text', label: 'Galería · Mensaje sin elementos' },
      { value: 'testimonios_color_fondo', label: 'Testimonios · Color de fondo' },
    ],
  },
  {
    group: 'Contacto',
    options: [
      { value: 'contacto_telefono', label: 'Teléfono' },
      { value: 'contacto_email', label: 'Email' },
      { value: 'contacto_direccion', label: 'Dirección' },
      { value: 'contacto_whatsapp', label: 'WhatsApp' },
      { value: 'contacto_instagram', label: 'Instagram (texto)' },
      { value: 'contacto_facebook', label: 'Facebook (texto)' },
      { value: 'social_facebook', label: 'URL Facebook' },
      { value: 'social_instagram', label: 'URL Instagram' },
      { value: 'social_twitter', label: 'URL Twitter/X' },
      { value: 'horarios_laborales', label: 'Horarios laborales' },
      { value: 'horarios_especiales', label: 'Horarios especiales' },
      { value: 'contacto_color_fondo', label: 'Color de fondo' },
      { value: 'contacto_color_tarjeta', label: 'Color de tarjetas' },
    ],
  },
  {
    group: 'Footer',
    options: [
      { value: 'footer_color_fondo', label: 'Color de fondo' },
      { value: 'footer_color_texto', label: 'Color de texto' },
      { value: 'footer_descripcion', label: 'Descripción' },
      { value: 'footer_servicio_1', label: 'Servicio destacado 1' },
      { value: 'footer_servicio_2', label: 'Servicio destacado 2' },
      { value: 'footer_servicio_3', label: 'Servicio destacado 3' },
      { value: 'footer_servicio_4', label: 'Servicio destacado 4' },
    ],
  },
  {
    group: 'Legales',
    options: [
      { value: 'politica_privacidad', label: 'Política de privacidad' },
      { value: 'terminos_condiciones', label: 'Términos y condiciones' },
      { value: 'politica_cancelacion', label: 'Política de cancelación' },
    ],
  },
]

const WEBSITE_CONTENT_OPTIONS = WEBSITE_CONTENT_GROUPS.flatMap((group) =>
  group.options.map((option) => ({
    ...option,
    displayLabel: `${group.group} · ${option.label}`,
  }))
)

const CONTENT_LABELS = WEBSITE_CONTENT_OPTIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.displayLabel
  return acc
}, {})

const isColorField = (tipo?: string) => !!tipo && tipo.includes('color')
const isUrlField = (tipo?: string) => !!tipo && (tipo.startsWith('social_') || tipo.endsWith('_url'))
const isEmailField = (tipo?: string) => !!tipo && tipo.includes('email')
const isPhoneField = (tipo?: string) => !!tipo && tipo.includes('telefono')
const isTextareaField = (tipo?: string) =>
  !tipo ||
  ['descripcion', 'politica', 'terminos', 'historia', 'vision', 'mision', 'horarios'].some((kw) =>
    tipo.includes(kw)
  )
const isMultilinePreferred = (tipo?: string) => !!tipo && tipo.includes('horarios')

const normalizeColorValue = (value?: string) => {
  if (!value) return '#000000'
  const trimmed = value.trim()
  if (!trimmed.startsWith('#')) {
    return `#${trimmed.replace(/^#+/, '')}`.slice(0, 7)
  }
  return trimmed.slice(0, 7)
}

export default function ConfigurationManager() {
  const [activeTab, setActiveTab] = useState<'content' | 'sections' | 'settings'>('content')
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent[]>([])
  const [pageSections, setPageSections] = useState<PageSection[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [contentSearch, setContentSearch] = useState('')
  const [contentFilter, setContentFilter] = useState<'all' | 'withValue' | 'empty'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!editingItem?.tipo_contenido) return
    if (!isColorField(editingItem.tipo_contenido)) return
    const normalized = normalizeColorValue(editingItem.contenido)
    if (editingItem.contenido !== normalized) {
      setEditingItem((prev: any) => (prev ? { ...prev, contenido: normalized } : prev))
    }
  }, [editingItem?.tipo_contenido, editingItem?.contenido])

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    setToken(accessToken)
    if (accessToken) {
      loadAllData()
    }
  }, [])

  const updateEditingContent = (value: string) => {
    setEditingItem((prev: any) => (prev ? { ...prev, contenido: value } : prev))
  }

  const handleContentTypeSelect = (value: string) => {
    setEditingItem((prev: any) => {
      if (!prev) return prev
      const next = { ...prev, tipo_contenido: value }
      if (!prev.id) {
        if (isColorField(value)) {
          next.contenido = normalizeColorValue(prev.contenido)
        } else if (isColorField(prev.tipo_contenido)) {
          next.contenido = ''
        }
      }
      return next
    })
  }

  const renderContentField = () => {
    if (!editingItem) return null
    const tipo = editingItem.tipo_contenido

    if (!tipo) {
      return (
        <p className="text-sm text-gray-500">
          Selecciona el tipo de contenido para habilitar este campo.
        </p>
      )
    }

    if (isColorField(tipo)) {
      const value = normalizeColorValue(editingItem.contenido)
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <input
              type="color"
              className="h-12 w-20 border border-gray-300 rounded"
              value={value}
              onChange={(e) => updateEditingContent(normalizeColorValue(e.target.value))}
            />
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={value}
              onChange={(e) => updateEditingContent(normalizeColorValue(e.target.value))}
              placeholder="#0f172a"
            />
          </div>
          <p className="text-xs text-gray-500">
            Usa un código HEX (por ejemplo #0f172a). El color se aplicará inmediatamente en la página pública.
          </p>
        </div>
      )
    }

    if (isTextareaField(tipo)) {
      return (
        <textarea
          value={editingItem.contenido ?? ''}
          onChange={(e) => updateEditingContent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={isMultilinePreferred(tipo) ? 6 : 4}
          placeholder="Escribe el contenido aquí..."
        />
      )
    }

    const inputType = isEmailField(tipo) ? 'email' : isUrlField(tipo) ? 'url' : isPhoneField(tipo) ? 'tel' : 'text'
    const isMapsUrl = tipo === 'ubicacion_maps_url'
    const placeholder = isMapsUrl 
      ? 'Pega aquí el iframe completo de Google Maps o solo la URL del src (ej: https://www.google.com/maps/embed?pb=...)'
      : isUrlField(tipo)
      ? 'Ingresa la URL completa (ej: https://ejemplo.com)'
      : 'Escribe el contenido aquí...'
    
    return (
      <div className="space-y-2">
        <input
          type={inputType}
          value={editingItem.contenido ?? ''}
          onChange={(e) => updateEditingContent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder={placeholder}
        />
        {isMapsUrl && (
          <p className="text-xs text-gray-500">
            💡 Puedes pegar el iframe completo de Google Maps o solo la URL. El sistema extraerá automáticamente la URL necesaria.
          </p>
        )}
      </div>
    )
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem('access_token')
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }

      // Cargar contenido del sitio web
      const contentResponse = await fetch('http://localhost:8000/api/contenido/', { headers })
      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        const contentArray = Array.isArray(contentData) ? contentData : contentData.results || []
        
        // Si hay paginación, cargar todas las páginas
        if (contentData.next) {
          let allContent = [...contentArray]
          let nextUrl = contentData.next
          while (nextUrl) {
            const nextResponse = await fetch(nextUrl, { headers })
            if (nextResponse.ok) {
              const nextData = await nextResponse.json()
              allContent = [...allContent, ...(Array.isArray(nextData) ? nextData : nextData.results || [])]
              nextUrl = nextData.next
            } else {
              break
            }
          }
        console.log('Contenido cargado (todas las páginas):', allContent.length, 'elementos')
        const mapsUrlItem = allContent.find((item: any) => item.tipo_contenido === 'ubicacion_maps_url')
        console.log('Buscando ubicacion_maps_url:', mapsUrlItem)
        if (mapsUrlItem) {
          console.log('Detalles de ubicacion_maps_url:', {
            id: mapsUrlItem.id,
            tipo_contenido: mapsUrlItem.tipo_contenido,
            contenido: mapsUrlItem.contenido?.substring(0, 200) + '...',
            activo: mapsUrlItem.activo,
            imagen: mapsUrlItem.imagen,
            contenidoCompleto: mapsUrlItem.contenido
          })
          console.log('¿Está activo?', mapsUrlItem.activo)
          if (!mapsUrlItem.activo) {
            console.warn('⚠️ El contenido ubicacion_maps_url está INACTIVO. Actívalo para que aparezca en la página pública.')
          }
        } else {
          console.warn('⚠️ No se encontró ubicacion_maps_url en los 32 elementos cargados')
        }
        setWebsiteContent(allContent)
        } else {
          console.log('Contenido cargado:', contentArray.length, 'elementos')
          console.log('Buscando ubicacion_maps_url:', contentArray.find((item: any) => item.tipo_contenido === 'ubicacion_maps_url'))
          console.log('Todos los tipos de contenido:', contentArray.map((item: any) => item.tipo_contenido))
          setWebsiteContent(contentArray)
        }
      } else {
        console.error('Error al cargar contenido:', contentResponse.status, contentResponse.statusText)
      }

      // Cargar secciones de página
      const sectionsResponse = await fetch('http://localhost:8000/api/secciones/', { headers })
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json()
        setPageSections(Array.isArray(sectionsData) ? sectionsData : sectionsData.results || [])
      }

      // Cargar configuración del sistema
      const settingsResponse = await fetch('http://localhost:8000/api/configuracion/', { headers })
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSystemSettings(Array.isArray(settingsData) ? settingsData : settingsData.results || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContent = async (item: WebsiteContent, imageFile?: File | null, showAlert: boolean = true) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      
      // Activar automáticamente si tiene contenido o imagen
      // También activar si el contenido contiene un iframe (aunque esté vacío después de trim)
      const hasContent = item.contenido && item.contenido.trim().length > 0
      const hasIframe = item.contenido && item.contenido.includes('<iframe')
      const shouldBeActive = item.activo || hasContent || hasIframe || !!imageFile || !!item.imagen
      
      // Si hay imagen nueva o se eliminó la imagen
      if (imageFile || (item.imagen === null && item.id)) {
        const formData = new FormData()
        formData.append('contenido', item.contenido)
        formData.append('activo', shouldBeActive.toString())
        
        if (imageFile) {
          formData.append('imagen', imageFile)
        } else if (item.imagen === null) {
          // Enviar null para eliminar la imagen
          formData.append('imagen', '')
        }
        
        if (item.tipo_contenido) {
          formData.append('tipo_contenido', item.tipo_contenido)
        }

        const url = item.id
          ? `http://localhost:8000/api/contenido/${item.id}/`
          : 'http://localhost:8000/api/contenido/'
        const method = item.id ? 'PATCH' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        })

        if (response.ok) {
          const savedData = await response.json()
          console.log('Contenido guardado (con imagen) - Respuesta del servidor:', savedData)
          console.log('¿Se guardó como activo?', savedData.activo)
          if (showAlert) {
            const activeMsg = shouldBeActive ? '\n✅ El contenido se ha activado automáticamente.' : '\n⚠️ El contenido está inactivo y no se mostrará en la página pública.'
            alert(`✅ Contenido guardado correctamente.${activeMsg}\n\n💡 Recarga la página principal (Ctrl+F5) para ver los cambios.`)
          }
          loadAllData()
          setEditingItem(null)
          setShowAddModal(false)
          setSelectedImageFile(null)
          setImagePreview(null)
        } else {
          const error = await response.json()
          console.error('Error al guardar:', error)
          alert(`Error: ${JSON.stringify(error)}`)
        }
      } else {
        // Sin cambios en imagen, usar JSON
        const url = item.id
          ? `http://localhost:8000/api/contenido/${item.id}/`
          : 'http://localhost:8000/api/contenido/'
        const method = item.id ? 'PATCH' : 'POST'

        const payload: any = {
          contenido: item.contenido,
          activo: shouldBeActive
        }
        if (!item.id && item.tipo_contenido) {
          payload.tipo_contenido = item.tipo_contenido
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const savedData = await response.json()
          console.log('Contenido guardado - Respuesta del servidor:', savedData)
          console.log('¿Se guardó como activo?', savedData.activo)
          if (showAlert) {
            const activeMsg = shouldBeActive ? '\n✅ El contenido se ha activado automáticamente.' : '\n⚠️ El contenido está inactivo y no se mostrará en la página pública.'
            alert(`✅ Contenido guardado correctamente.${activeMsg}\n\n💡 Recarga la página principal (Ctrl+F5) para ver los cambios.`)
          }
          loadAllData()
          setEditingItem(null)
          setShowAddModal(false)
        } else {
          const error = await response.json()
          console.error('Error al guardar:', error)
          alert(`Error: ${JSON.stringify(error)}`)
        }
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Error de conexión')
    }
  }

  const handleSaveSection = async (section: PageSection) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const url = section.id 
        ? `http://localhost:8000/api/secciones/${section.id}/`
        : 'http://localhost:8000/api/secciones/'
      
      const method = section.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(section),
      })

      if (response.ok) {
        alert('Sección guardada correctamente')
        loadAllData()
        setEditingItem(null)
        setShowAddModal(false)
      } else {
        alert('Error al guardar la sección')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error de conexión')
    }
  }

  const handleDeleteSection = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta sección?')) return

    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/secciones/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        alert('Sección eliminada correctamente')
        loadAllData()
      } else {
        alert('Error al eliminar la sección')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Error de conexión')
    }
  }

  const handleSaveSetting = async (setting: SystemSettings) => {
    try {
      const accessToken = localStorage.getItem('access_token')
      const url = setting.id 
        ? `http://localhost:8000/api/configuracion/${setting.id}/`
        : 'http://localhost:8000/api/configuracion/'
      
      const method = setting.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      })

      if (response.ok) {
        alert('Configuración guardada correctamente')
        loadAllData()
        setEditingItem(null)
        setShowAddModal(false)
      } else {
        alert('Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error saving setting:', error)
      alert('Error de conexión')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteImage = async (itemId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return

    try {
      const accessToken = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/contenido/${itemId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagen: null }),
      })

      if (response.ok) {
        alert('✅ Imagen eliminada correctamente')
        loadAllData()
      } else {
        alert('Error al eliminar la imagen')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error de conexión')
    }
  }

  const getContentDisplayName = (tipo_contenido: string) => {
    if (!tipo_contenido) return 'Sin tipo'
    return CONTENT_LABELS[tipo_contenido] || tipo_contenido
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contenido del Sitio Web
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sections'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Secciones de Página
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuración del Sistema
          </button>
        </nav>
      </div>

      {/* Contenido del Sitio Web */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contenido del Sitio Web</h3>
              <p className="text-sm text-gray-600">Edita los textos e imágenes de tu sitio web</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const direccionItem = websiteContent.find(item => item.tipo_contenido === 'ubicacion_direccion')
                  if (direccionItem) {
                    setEditingItem({ ...direccionItem })
                    setShowAddModal(true)
                    setSelectedImageFile(null)
                    setImagePreview(null)
                  } else {
                    setEditingItem({
                      tipo_contenido: 'ubicacion_direccion',
                      contenido: '',
                      activo: true
                    })
                    setShowAddModal(true)
                  }
                }}
                className="btn-secondary flex items-center text-sm px-3 py-2"
                title="Editar dirección del local"
              >
                📍 Dirección
              </button>
              <button
                onClick={() => {
                  setEditingItem({
                    tipo_contenido: '',
                    contenido: '',
                    activo: true
                  })
                  setShowAddModal(true)
                }}
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contenido
              </button>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <input
              type="search"
              value={contentSearch}
              onChange={(e) => setContentSearch(e.target.value)}
              placeholder="Buscar por nombre (ej: dirección, ubicación, contacto)..."
              className="w-full lg:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex gap-2 flex-wrap">
              {contentSearch && (
                <button
                  onClick={() => setContentSearch('')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Limpiar búsqueda
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setContentFilter('all')}
                  className={`px-4 py-2 rounded-lg border ${
                    contentFilter === 'all'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setContentFilter('withValue')}
                  className={`px-4 py-2 rounded-lg border ${
                    contentFilter === 'withValue'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Con valor activo
                </button>
                <button
                  onClick={() => setContentFilter('empty')}
                  className={`px-4 py-2 rounded-lg border ${
                    contentFilter === 'empty'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Pendientes / sin valor
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {(() => {
              const filtered = websiteContent
                .filter((item) => {
                  if (!contentSearch) return true
                  const searchLower = contentSearch.toLowerCase()
                  const displayName = getContentDisplayName(item.tipo_contenido).toLowerCase()
                  const tipoContenido = (item.tipo_contenido || '').toLowerCase()
                  const contenido = (item.contenido || '').toLowerCase()
                  return displayName.includes(searchLower) || tipoContenido.includes(searchLower) || contenido.includes(searchLower)
                })
              .filter((item) => {
                // Manejar null, undefined, y strings vacíos
                const contenidoValue = item.contenido
                const hasValue = contenidoValue != null && 
                                 typeof contenidoValue === 'string' && 
                                 contenidoValue.trim().length > 0
                
                if (contentFilter === 'withValue') {
                  return item.activo && hasValue
                }
                if (contentFilter === 'empty') {
                  // Mostrar campos sin valor (null, undefined, o string vacío)
                  return !hasValue
                }
                return true
              })
              
              if (filtered.length === 0) {
                const totalItems = websiteContent.length
                const emptyItems = websiteContent.filter((item) => {
                  const contenidoValue = item.contenido
                  return !(contenidoValue != null && typeof contenidoValue === 'string' && contenidoValue.trim().length > 0)
                }).length
                
                return (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-600 text-lg mb-2">
                      {contentSearch 
                        ? `No se encontraron resultados para "${contentSearch}"`
                        : contentFilter === 'withValue'
                        ? 'No hay contenido con valor activo'
                        : contentFilter === 'empty'
                        ? `No hay contenido pendiente. Todos los campos tienen valor asignado. (Total: ${totalItems}, Vacíos: ${emptyItems})`
                        : 'No hay contenido disponible'}
                    </p>
                    {contentSearch && (
                      <button
                        onClick={() => setContentSearch('')}
                        className="text-primary-600 hover:text-primary-700 underline mt-2"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                    {contentFilter === 'empty' && emptyItems === 0 && (
                      <p className="text-sm text-gray-500 mt-4">
                        💡 Si esperabas ver campos pendientes, verifica en la consola del navegador (F12) los logs de depuración.
                      </p>
                    )}
                  </div>
                )
              }
              
              return filtered.map((item) => (
              <div key={item.id} className={`bg-white rounded-lg shadow-sm border-2 p-4 max-w-full overflow-hidden ${
                item.activo ? 'border-green-200' : 'border-gray-300 opacity-60'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3 min-w-0">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {getContentDisplayName(item.tipo_contenido)}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        item.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.activo ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.tipo_contenido}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="flex items-center gap-1 text-xs cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.activo}
                        onChange={async (e) => {
                          const newActiveState = e.target.checked
                          // Actualizar estado local inmediatamente para feedback visual
                          const updated = { ...item, activo: newActiveState }
                          // Actualizar en el array local
                          setWebsiteContent(prev => prev.map(prevItem => 
                            prevItem.id === item.id ? updated : prevItem
                          ))
                          // Guardar en el backend sin mostrar alert
                          await handleSaveContent(updated, null, false)
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span className="text-gray-700 text-xs">{item.activo ? 'ON' : 'OFF'}</span>
                    </label>
                    {editingItem?.id === item.id && !showAddModal ? (
                      <>
                        <button
                          onClick={() => handleSaveContent(editingItem)}
                          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title="Guardar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingItem({ ...item })
                          setShowAddModal(true)
                          setSelectedImageFile(null)
                          setImagePreview(null)
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {editingItem?.id === item.id ? (
                  <div className="mt-2">{renderContentField()}</div>
                ) : (
                  <div className="max-h-32 overflow-y-auto overflow-x-hidden bg-gray-50 p-3 rounded-lg">
                    {item.contenido ? (
                      <p className="text-gray-700 text-sm break-words break-all overflow-wrap-anywhere" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                        {item.contenido}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Sin contenido</p>
                    )}
                  </div>
                )}

                {item.imagen && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600">Imagen:</p>
                      <button
                        onClick={() => handleDeleteImage(item.id)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                    <img 
                      src={`http://localhost:8000${item.imagen}`} 
                      alt="Imagen" 
                      className="max-w-full max-h-32 object-contain rounded-lg shadow-sm border border-gray-200"
                    />
                  </div>
                )}
              </div>
              ))
            })()}
          </div>
        </div>
      )}

      {/* Secciones de Página */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Secciones de Página</h3>
            <button
              onClick={() => {
                setEditingItem({
                  nombre: '',
                  tipo_seccion: 'custom',
                  titulo: '',
                  subtitulo: '',
                  contenido: '',
                  video_url: '',
                  boton_texto: '',
                  boton_url: '',
                  color_fondo: '#FFFFFF',
                  color_texto: '#000000',
                  orden: 0,
                  activo: true
                })
                setShowAddModal(true)
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sección
            </button>
          </div>

          <div className="grid gap-4">
            {pageSections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{section.nombre}</h4>
                    <p className="text-sm text-gray-500">{section.tipo_seccion}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      section.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {section.activo ? 'Activa' : 'Inactiva'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingItem({ ...section })
                        setShowAddModal(true)
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => section.id && handleDeleteSection(section.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Título:</p>
                    <p className="font-medium">{section.titulo || 'Sin título'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Orden:</p>
                    <p className="font-medium">{section.orden}</p>
                  </div>
                  {section.subtitulo && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Subtítulo:</p>
                      <p className="font-medium">{section.subtitulo}</p>
                    </div>
                  )}
                  {section.contenido && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Contenido:</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded mt-1">{section.contenido}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuración del Sistema */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Configuración del Sistema</h3>
            <button
              onClick={() => {
                setEditingItem({
                  tipo_configuracion: 'general',
                  clave: '',
                  valor: '',
                  descripcion: ''
                })
                setShowAddModal(true)
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Configuración
            </button>
          </div>

          <div className="grid gap-4">
            {systemSettings.map((setting) => (
              <div key={setting.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{setting.clave}</h4>
                    <p className="text-sm text-gray-500">{setting.descripcion}</p>
                    <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {setting.tipo_configuracion}
                    </span>
                  </div>
                  {editingItem?.id === setting.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveSetting(editingItem)}
                        className="p-2 text-green-600 hover:text-green-800"
                        title="Guardar"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Cancelar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingItem({ ...setting })}
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {editingItem?.id === setting.id ? (
                  <textarea
                    value={editingItem.valor}
                    onChange={(e) => setEditingItem({ ...editingItem, valor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg font-mono text-sm">
                    {setting.valor}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para agregar/editar contenido del sitio */}
      {showAddModal && editingItem && activeTab === 'content' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem.id ? 'Editar' : 'Agregar'} Contenido
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                    setSelectedImageFile(null)
                    setImagePreview(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tipo de contenido (solo al crear) */}
                {!editingItem.id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de contenido *
                    </label>
                    <select
                      value={editingItem.tipo_contenido || ''}
                      onChange={(e) => handleContentTypeSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Seleccionar tipo...</option>
                      {WEBSITE_CONTENT_GROUPS.map((group) => (
                        <optgroup key={group.group} label={group.group}>
                          {group.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}

                {/* Contenido/Texto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido *
                  </label>
                  {renderContentField()}
                </div>

                {/* Subir imagen (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen (opcional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    {imagePreview || editingItem.imagen ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview || `http://localhost:8000${editingItem.imagen}`}
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
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                          </label>
                          {editingItem.imagen && !imagePreview && (
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar la imagen actual?')) {
                                  setEditingItem({ ...editingItem, imagen: null })
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </button>
                          )}
                          {imagePreview && (
                            <button
                              onClick={() => {
                                setImagePreview(null)
                                setSelectedImageFile(null)
                              }}
                              className="text-sm text-red-600 hover:text-red-800 flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
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
                          onChange={handleImageSelect}
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
                    checked={editingItem.activo}
                    onChange={(e) => setEditingItem({ ...editingItem, activo: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <label className="text-sm text-gray-700">Contenido activo (visible en la web)</label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                    setSelectedImageFile(null)
                    setImagePreview(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveContent(editingItem, selectedImageFile)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar secciones o configuración */}
      {showAddModal && editingItem && (activeTab === 'sections' || activeTab === 'settings') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem.id ? 'Editar' : 'Agregar'} {activeTab === 'sections' ? 'Sección' : 'Configuración'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {activeTab === 'sections' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la sección</label>
                    <input
                      type="text"
                      value={editingItem.nombre}
                      onChange={(e) => setEditingItem({ ...editingItem, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sección</label>
                    <select
                      value={editingItem.tipo_seccion}
                      onChange={(e) => setEditingItem({ ...editingItem, tipo_seccion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="hero">Sección Hero</option>
                      <option value="about">Acerca de</option>
                      <option value="services">Servicios</option>
                      <option value="gallery">Galería</option>
                      <option value="testimonials">Testimonios</option>
                      <option value="contact">Contacto</option>
                      <option value="footer">Pie de página</option>
                      <option value="custom">Personalizada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={editingItem.titulo}
                      onChange={(e) => setEditingItem({ ...editingItem, titulo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={editingItem.subtitulo}
                      onChange={(e) => setEditingItem({ ...editingItem, subtitulo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                    <textarea
                      value={editingItem.contenido}
                      onChange={(e) => setEditingItem({ ...editingItem, contenido: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color de fondo</label>
                      <input
                        type="color"
                        value={editingItem.color_fondo}
                        onChange={(e) => setEditingItem({ ...editingItem, color_fondo: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color de texto</label>
                      <input
                        type="color"
                        value={editingItem.color_texto}
                        onChange={(e) => setEditingItem({ ...editingItem, color_texto: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Texto del botón</label>
                      <input
                        type="text"
                        value={editingItem.boton_texto}
                        onChange={(e) => setEditingItem({ ...editingItem, boton_texto: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL del botón</label>
                      <input
                        type="text"
                        value={editingItem.boton_url}
                        onChange={(e) => setEditingItem({ ...editingItem, boton_url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      value={editingItem.orden}
                      onChange={(e) => setEditingItem({ ...editingItem, orden: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingItem.activo}
                      onChange={(e) => setEditingItem({ ...editingItem, activo: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Sección activa</label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de configuración</label>
                    <select
                      value={editingItem.tipo_configuracion}
                      onChange={(e) => setEditingItem({ ...editingItem, tipo_configuracion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="general">General</option>
                      <option value="appearance">Apariencia</option>
                      <option value="business">Negocio</option>
                      <option value="notifications">Notificaciones</option>
                      <option value="social_media">Redes Sociales</option>
                      <option value="seo">SEO</option>
                      <option value="payment">Pagos</option>
                      <option value="booking">Reservas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clave</label>
                    <input
                      type="text"
                      value={editingItem.clave}
                      onChange={(e) => setEditingItem({ ...editingItem, clave: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={editingItem.id}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <textarea
                      value={editingItem.valor}
                      onChange={(e) => setEditingItem({ ...editingItem, valor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={editingItem.descripcion}
                      onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (activeTab === 'sections') {
                      handleSaveSection(editingItem)
                    } else {
                      handleSaveSetting(editingItem)
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
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


