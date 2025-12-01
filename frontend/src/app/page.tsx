
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, Users, Award, Phone, MapPin, Calendar, Package, Menu, X } from 'lucide-react'

interface Service {
  id: number
  nombre: string
  descripcion: string
  precio: number
  precio_desde?: boolean
  duracion: number
}

interface Testimonial {
  id: number
  cliente_nombre: string
  testimonio: string
  calificacion: number
  servicio_recibido: string
  fecha_creacion?: string
}

interface WebsiteContentItem {
  id: number
  tipo_contenido: string
  contenido: string
  imagen?: string | null
  activo?: boolean
}

interface GalleryItem {
  id: number
  titulo: string
  descripcion?: string
  imagen?: string | null
  video_url?: string | null
  video_file?: string | null
  tipo_video?: 'url' | 'file' | null
  es_video?: boolean
}

interface Product {
  id: number
  nombre: string
  descripcion: string
  precio: number
  precio_desde?: boolean
  imagen?: string | null
}

interface Package {
  id: number
  nombre: string
  descripcion: string
  precio: number
  imagen?: string | null
  activo: boolean
  servicios?: Service[]
  productos?: Product[]
}

const hexToRGBA = (hex: string, alpha = 1) => {
  if (!hex) return `rgba(15, 23, 42, ${alpha})`
  let sanitized = hex.replace('#', '').trim()
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map((char) => char + char).join('')
  }
  if (sanitized.length !== 6) {
    return `rgba(15, 23, 42, ${alpha})`
  }
  const int = parseInt(sanitized, 16)
  if (Number.isNaN(int)) {
    return `rgba(15, 23, 42, ${alpha})`
  }
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function HomePage() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [contentMap, setContentMap] = useState<Record<string, WebsiteContentItem>>({})
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detectar scroll para cambiar el estilo de la barra de navegación
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        // Cargar servicios destacados (primeros 3)
        const servicesResponse = await fetch('https://barberrock.es/api/servicios/', { cache: 'no-store' })
        const servicesData = await servicesResponse.json()
        const services = (servicesData.results || servicesData).slice(0, 3)
        setFeaturedServices(services)

        // Cargar contenido del sitio (texto e imágenes configurables)
        // Cargar todas las páginas si hay paginación
        let allContentData: WebsiteContentItem[] = []
        let nextUrl: string | null = 'https://barberrock.es/api/contenido/'
        
        while (nextUrl) {
          const contentResponse: Response = await fetch(nextUrl, { cache: 'no-store' })
          const contentDataRaw: any = await contentResponse.json()
          const pageData: WebsiteContentItem[] = contentDataRaw.results || contentDataRaw || []
          allContentData = [...allContentData, ...pageData]
          nextUrl = contentDataRaw.next || null
        }
        
        console.log('API pública - Total elementos cargados (todas las páginas):', allContentData.length)
        
        // Buscar específicamente ubicacion_maps_url en la respuesta
        const mapsItem = allContentData.find((item: WebsiteContentItem) => item.tipo_contenido === 'ubicacion_maps_url')
        console.log('API pública - ubicacion_maps_url encontrado:', mapsItem)
        if (mapsItem) {
          console.log('API pública - Detalles:', {
            id: mapsItem.id,
            activo: mapsItem.activo,
            contenido: mapsItem.contenido?.substring(0, 100) + '...'
          })
        } else {
          console.warn('⚠️ API pública: ubicacion_maps_url NO encontrado en los', allContentData.length, 'elementos activos')
        }
        
        const byKey: Record<string, WebsiteContentItem> = {}
        allContentData.forEach((item: WebsiteContentItem) => {
          byKey[item.tipo_contenido] = item
        })
        console.log('Contenido cargado - ubicacion_maps_url:', byKey['ubicacion_maps_url'])
        console.log('Contenido cargado - ubicacion_direccion:', byKey['ubicacion_direccion'])
        console.log('Contenido cargado - contacto_direccion:', byKey['contacto_direccion'])
        if (byKey['ubicacion_direccion']) {
          console.log('Detalles ubicacion_direccion:', {
            id: byKey['ubicacion_direccion'].id,
            activo: byKey['ubicacion_direccion'].activo,
            contenido: byKey['ubicacion_direccion'].contenido
          })
        }
        console.log('Todos los tipos de contenido cargados:', Object.keys(byKey))
        setContentMap(byKey)

        // Cargar galería
        const galleryResponse = await fetch('https://barberrock.es/api/galeria/', { cache: 'no-store' })
        const galleryData = await galleryResponse.json()
        setGallery(galleryData.results || galleryData)

        // Cargar productos
        const productsResponse = await fetch('https://barberrock.es/api/productos/', { cache: 'no-store' })
        const productsData = await productsResponse.json()
        const normalizedProducts = (productsData.results || productsData || []).map((product: any) => ({
          ...product,
          precio: typeof product.precio === 'number' ? product.precio : parseFloat(product.precio || '0'),
        }))
        setProducts(normalizedProducts)

        // Cargar paquetes
        const packagesResponse = await fetch('https://barberrock.es/api/paquetes/', { cache: 'no-store' })
        const packagesData = await packagesResponse.json()
        const packagesList = (packagesData.results || packagesData || []).filter((pkg: Package) => pkg.activo !== false)
        setPackages(packagesList)

        // Cargar testimonios
        const testimonialsResponse = await fetch('https://barberrock.es/api/testimonios/', { cache: 'no-store' })
        const testimonialsData = await testimonialsResponse.json()
        setTestimonials(testimonialsData.results || testimonialsData)

        setLoading(false)
      } catch (error) {
        console.error('Error al cargar datos de homepage:', error)
        setLoading(false)
      }
    }

    loadHomeData()
  }, [])

  // Mostrar solo "BarberRock" en el header
  const businessName = 'BarberRock'
  const brandPrimary = contentMap['branding_color_primario']?.contenido || '#0f172a'
  const brandSecondary = contentMap['branding_color_secundario']?.contenido || '#1e293b'
  const heroBackgroundImage = contentMap['inicio_hero_image']?.imagen
  const heroBackgroundColor = contentMap['hero_color_fondo']?.contenido || brandPrimary
  // Obtener el logo correctamente - puede venir como string o como objeto
  const logoContent = contentMap['logo_barberia']
  let logoImage: string | null = null
  if (logoContent?.imagen) {
    if (typeof logoContent.imagen === 'string') {
      logoImage = logoContent.imagen.startsWith('http') 
        ? logoContent.imagen 
        : `https://barberrock.es${logoContent.imagen}`
    }
  }
  console.log('Logo cargado:', { logoContent, logoImage })
  const featuresBackground = contentMap['features_color_fondo']?.contenido || '#ffffff'
  const featuresIconColor = contentMap['features_color_icono']?.contenido || brandPrimary
  const servicesBackground = contentMap['servicios_color_fondo']?.contenido || '#f9fafb'
  const productosBackground = contentMap['productos_color_fondo']?.contenido || '#ffffff'
  const establecimientoBackground = contentMap['establecimiento_color_fondo']?.contenido || '#ffffff'
  const galeriaBackground = contentMap['galeria_color_fondo']?.contenido || '#f9fafb'
  const testimoniosBackground = contentMap['testimonios_color_fondo']?.contenido || '#ffffff'
  const locationBackground = contentMap['ubicacion_color_fondo']?.contenido || '#f8fafc'
  const locationTitle = contentMap['ubicacion_titulo']?.contenido || 'Nuestra ubicación'
  const locationDescription =
    contentMap['ubicacion_descripcion']?.contenido ||
    'Visítanos y vive la experiencia BarberRock en el corazón de la ciudad.'
  const locationAddress =
    contentMap['ubicacion_direccion']?.contenido ||
    contentMap['contacto_direccion']?.contenido ||
    contentMap['direccion']?.contenido ||
    'Dirección no configurada'
  
  // Log para depuración
  console.log('Dirección cargada:', {
    'ubicacion_direccion': contentMap['ubicacion_direccion']?.contenido,
    'contacto_direccion': contentMap['contacto_direccion']?.contenido,
    'direccion_final': locationAddress
  })
  // Extraer URL del iframe si viene como HTML completo, o usar directamente si es URL
  const extractMapUrl = (content: string | undefined): string => {
    if (!content) {
      console.log('extractMapUrl: No hay contenido')
      return ''
    }
    // Normalizar espacios y saltos de línea
    const normalized = content.replace(/\s+/g, ' ').trim()
    console.log('extractMapUrl: Contenido recibido (primeros 200 chars):', normalized.substring(0, 200))
    
    // Buscar iframe con diferentes variaciones de espacios y comillas
    // Patrón 1: src="url" con comillas dobles (src puede estar inmediatamente después de <iframe o con espacio)
    let match = normalized.match(/<iframe[^>]*src\s*=\s*"([^"]+)"[^>]*>/i)
    if (match && match[1]) {
      console.log('extractMapUrl: URL extraída (patrón 1 - comillas dobles):', match[1])
      return match[1]
    }
    
    // Patrón 2: src='url' con comillas simples
    match = normalized.match(/<iframe[^>]*src\s*=\s*'([^']+)'[^>]*>/i)
    if (match && match[1]) {
      console.log('extractMapUrl: URL extraída (patrón 2 - comillas simples):', match[1])
      return match[1]
    }
    
    // Patrón 3: src=url sin comillas (menos común)
    match = normalized.match(/<iframe[^>]*src\s*=\s*([^\s>]+)[^>]*>/i)
    if (match && match[1] && match[1].startsWith('http')) {
      console.log('extractMapUrl: URL extraída (patrón 3 - sin comillas):', match[1])
      return match[1]
    }
    
    // Si ya es una URL directa, usarla
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      console.log('extractMapUrl: Es una URL directa:', normalized)
      return normalized
    }
    
    console.log('extractMapUrl: No se pudo extraer URL. Contenido completo:', normalized)
    return ''
  }
  const locationMapUrl = extractMapUrl(contentMap['ubicacion_maps_url']?.contenido)
  console.log('locationMapUrl final:', locationMapUrl)
  
  // Buscar video para la sección "Conócenos"
  // Busca un video con título que contenga "conocenos" o "conoce" o el primer video activo
  const conocenosVideo = gallery.find((item: GalleryItem) => 
    (item.es_video || item.video_file || item.video_url) && 
    (item.titulo?.toLowerCase().includes('conocenos') || 
     item.titulo?.toLowerCase().includes('conoce') ||
     item.titulo?.toLowerCase().includes('video'))
  ) || gallery.find((item: GalleryItem) => (item.es_video || item.video_file || item.video_url))
  
  const conocenosBackground = contentMap['conocenos_color_fondo']?.contenido || '#f9fafb'
  const conocenosTitulo = contentMap['conocenos_titulo']?.contenido || 'Conócenos'
  const conocenosDescripcion = contentMap['conocenos_descripcion']?.contenido || 'Descubre quiénes somos y nuestra pasión por la barbería'
  
  const contactBackgroundColor = contentMap['contacto_color_fondo']?.contenido || brandSecondary
  const contactCardColor = contentMap['contacto_color_tarjeta']?.contenido || '#ffffff'
  const footerBackground = contentMap['footer_color_fondo']?.contenido || '#111827'
  const footerTextColor = contentMap['footer_color_texto']?.contenido || '#ffffff'
  const footerMuted = hexToRGBA(footerTextColor, 0.75)
  const footerAccent = hexToRGBA(footerTextColor, 0.6)
  // Función auxiliar para obtener título y descripción sin duplicados
  const getFeatureContent = (
    tituloKey: string,
    descripcionKey: string,
    defaultTitle: string,
    defaultDescription: string
  ) => {
    const titulo = contentMap[tituloKey]?.contenido || ''
    const descripcion = contentMap[descripcionKey]?.contenido || ''
    
    // Si existe descripción, usar título y descripción normalmente
    if (descripcion) {
      return {
        title: titulo || defaultTitle,
        description: descripcion,
      }
    }
    
    // Si no existe descripción pero el título es largo (más de 50 caracteres),
    // asumir que el título contiene la descripción completa
    if (titulo && titulo.length > 50) {
      return {
        title: defaultTitle,
        description: titulo,
      }
    }
    
    // Si el título es corto o no existe, usar valores por defecto
    return {
      title: titulo || defaultTitle,
      description: descripcion || defaultDescription,
    }
  }

  const featureItems = [
    {
      ...getFeatureContent(
        'caracteristica_1_titulo',
        'caracteristica_1_descripcion',
        'Calidad Premium',
        'Utilizamos productos de primera calidad para garantizar resultados excepcionales.'
      ),
      icon: 'award',
    },
    {
      ...getFeatureContent(
        'caracteristica_2_titulo',
        'caracteristica_2_descripcion',
        'Expertos Certificados',
        'Nuestros barberos cuentan con años de experiencia y certificaciones profesionales.'
      ),
      icon: 'users',
    },
    {
      ...getFeatureContent(
        'caracteristica_3_titulo',
        'caracteristica_3_descripcion',
        'Horarios Flexibles',
        'Adaptamos nuestros horarios para ofrecerte la mejor atención cuando más lo necesitas.'
      ),
      icon: 'clock',
    },
    {
      ...getFeatureContent(
        'caracteristica_4_titulo',
        'caracteristica_4_descripcion',
        'Clientes Satisfechos',
        'Más de 1000 clientes satisfechos confían en nuestros servicios cada mes.'
      ),
      icon: 'star',
    },
  ]

  const renderFeatureIcon = (icon: string) => {
    const commonProps = {
      className: 'w-8 h-8',
      style: { color: featuresIconColor },
    }
    switch (icon) {
      case 'award':
        return <Award {...commonProps} />
      case 'users':
        return <Users {...commonProps} />
      case 'clock':
        return <Clock {...commonProps} />
      case 'star':
        return <Star {...commonProps} />
      default:
        return <Award {...commonProps} />
    }
  }

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        :root {
          --brand-primary: ${brandPrimary};
          --brand-secondary: ${brandSecondary};
        }
        .text-primary-600 {
          color: var(--brand-primary) !important;
        }
        .bg-primary-600 {
          background-color: var(--brand-primary) !important;
        }
        .bg-primary-50 {
          background-color: ${hexToRGBA(brandPrimary, 0.08)} !important;
        }
        .bg-primary-100 {
          background-color: ${hexToRGBA(brandPrimary, 0.12)} !important;
        }
        .border-primary-600 {
          border-color: var(--brand-primary) !important;
        }
      `}</style>
      {/* Barra de Navegación Persistente */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-2 md:gap-3">
              {logoImage && logoImage.trim() ? (
                <img
                  src={logoImage}
                  alt="Logo BarberRock"
                  className="h-8 md:h-10 w-auto object-contain max-w-[80px] md:max-w-[120px]"
                  onError={(e) => {
                    // Si falla la carga, ocultar la imagen y mostrar solo el texto
                    const img = e.currentTarget
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent) {
                      const textElement = parent.querySelector('h1')
                      if (textElement) {
                        textElement.textContent = 'Barbería BarberRock'
                      }
                    }
                  }}
                  onLoad={() => {
                    console.log('Logo cargado exitosamente:', logoImage)
                  }}
                />
              ) : null}
              <h1 
                className={`text-base md:text-xl font-bold transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                {logoImage && logoImage.trim() ? 'BarberRock' : <><span className="hidden sm:inline">Barbería </span>BarberRock</>}
              </h1>
            </div>
            
            {/* Navegación Desktop */}
            <div className="hidden xl:flex items-center space-x-6">
              <Link
                href="#servicios"
                className={`text-sm font-medium transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                }`}
              >
                Servicios
              </Link>
              <Link
                href="#galeria"
                className={`text-sm font-medium transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                }`}
              >
                Galería
              </Link>
              <Link
                href="#establecimiento"
                className={`text-sm font-medium transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                }`}
              >
                Nosotros
              </Link>
            </div>
            
            {/* Botón CTA */}
            <div className="flex items-center gap-2 md:gap-3">
              <Link
                href="/cita"
                className={`font-bold py-1.5 px-3 md:py-2 md:px-6 rounded-lg text-xs md:text-sm transition-all whitespace-nowrap ${
                  isScrolled
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white text-primary-600 hover:bg-gray-100'
                }`}
                style={isScrolled ? {} : { color: brandPrimary }}
              >
                <Calendar className="inline-block w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Agendar</span> Cita
              </Link>
              
              {/* Botón menú móvil */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`xl:hidden p-2 transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                }`}
                aria-label="Menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Menú móvil desplegable */}
          {mobileMenuOpen && (
            <div className={`xl:hidden border-t py-4 ${
              isScrolled ? 'border-gray-200 bg-white' : 'border-white/20 bg-black/50 backdrop-blur-sm'
            }`}>
              <nav className="flex flex-col space-y-2">
                <Link
                  href="#servicios"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium ${
                    isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                  }`}
                >
                  Servicios
                </Link>
                <Link
                  href="#galeria"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium ${
                    isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                  }`}
                >
                  Galería
                </Link>
                <Link
                  href="#establecimiento"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium ${
                    isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-gray-200'
                  }`}
                >
                  Nosotros
                </Link>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm px-4 py-2 text-center rounded-lg ${
                      isScrolled ? 'btn-secondary' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/registro"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm px-4 py-2 text-center rounded-lg ${
                      isScrolled ? 'btn-primary' : 'bg-white text-primary-600 hover:bg-gray-100'
                    }`}
                    style={isScrolled ? {} : { color: brandPrimary }}
                  >
                    Registrarse
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section Rediseñada */}
      <section
        id="inicio"
        className="relative min-h-[90vh] flex items-center justify-center pt-16"
        style={{
          backgroundImage: heroBackgroundImage
            ? `url(${heroBackgroundImage.startsWith('http') ? heroBackgroundImage : `https://barberrock.es${heroBackgroundImage}`})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: heroBackgroundColor,
        }}
      >
        {/* Overlay de color azul semi-transparente */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: hexToRGBA(heroBackgroundColor, 0.75),
          }}
        />
        
        {/* Contenido centrado */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline */}
          <p className="text-sm uppercase tracking-wider text-white/90 mb-4 font-medium">
            BARBERÍA BARBERROCK
          </p>
          
          {/* Headline Principal */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {contentMap['inicio_titulo']?.contenido || 'Estilo y Precisión en Cada Corte'}
          </h1>
          
          {/* Párrafo */}
          <p className="text-lg md:text-xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed">
            {contentMap['inicio_descripcion']?.contenido ||
              'Descubre la experiencia de un corte de cabello excepcional con nuestros barberos expertos. Calidad, estilo y atención personalizada en cada visita.'}
          </p>
          
          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cita"
              className="font-bold py-4 px-10 rounded-lg text-lg transition-all bg-white hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{ color: brandPrimary }}
            >
              <Calendar className="inline-block w-5 h-5 mr-2" />
              Agendar Cita
            </Link>
            <Link
              href="#servicios"
              className="font-bold py-4 px-10 rounded-lg text-lg transition-all border-2 border-white text-white hover:bg-white hover:text-primary-600"
            >
              Ver Servicios
            </Link>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-12 md:py-16" style={{ backgroundColor: servicesBackground }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Nuestros Servicios</h2>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
              {contentMap['servicios_descripcion']?.contenido || 'Ofrecemos una amplia gama de servicios de barbería para satisfacer todas tus necesidades de cuidado personal.'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando servicios...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredServices.map((service) => (
                  <div key={service.id} className="card">
                    <div className="text-center">
                      <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">
                          {service.nombre.toLowerCase().includes('corte') ? '✂️' :
                           service.nombre.toLowerCase().includes('barba') ? '🧔' :
                           service.nombre.toLowerCase().includes('afeitado') ? '🪒' :
                           service.nombre.toLowerCase().includes('tratamiento') ? '💆' : '✨'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-semibold mb-4">{service.nombre}</h3>
                      <div className="text-3xl font-bold text-primary-600 mb-4">
                        {service.precio_desde && <span className="text-lg font-normal text-gray-500">desde </span>}
                        ${service.precio}
                      </div>
                      <p className="text-gray-600 mb-6">{service.descripcion}</p>
                      <div className="flex items-center justify-center text-gray-500 mb-4">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{service.duracion} minutos</span>
                      </div>
                      <Link href="/cita" className="btn-primary w-full">
                        Agendar Ahora
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/servicios" className="btn-secondary">
                  Ver Todos los Servicios
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Paquetes */}
      {packages.length > 0 && (
        <section id="paquetes" className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Nuestros Paquetes</h2>
              <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
                Combina servicios y productos con nuestras ofertas especiales
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {packages.map((pkg) => (
                <div key={pkg.id} className="card hover:shadow-lg transition-shadow">
                  <div className="relative mb-4">
                    {pkg.imagen ? (
                      <div className="w-full h-48 relative rounded-lg overflow-hidden">
                        <img
                          src={pkg.imagen.startsWith('http') ? pkg.imagen : `https://barberrock.es${pkg.imagen}`}
                          alt={pkg.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <Package className="w-16 h-16 text-primary-600" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.nombre}</h3>
                    <p className="text-gray-600 text-sm mb-3">{pkg.descripcion}</p>
                    {(pkg.servicios && pkg.servicios.length > 0) || (pkg.productos && pkg.productos.length > 0) ? (
                      <div className="text-xs text-gray-500 mb-2">
                        {pkg.servicios && pkg.servicios.length > 0 && (
                          <div className="mb-1">
                            <strong>Servicios:</strong> {pkg.servicios.map(s => s.nombre).join(', ')}
                          </div>
                        )}
                        {pkg.productos && pkg.productos.length > 0 && (
                          <div>
                            <strong>Productos:</strong> {pkg.productos.map(p => p.nombre).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right w-full">
                      <span className="text-2xl font-bold text-primary-600">${pkg.precio}</span>
                    </div>
                  </div>
                  <Link href="/cita" className="w-full btn-primary inline-flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Paquete
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Productos */}
      <section id="productos" className="py-12 md:py-16" style={{ backgroundColor: productosBackground }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              {contentMap['catalogo_titulo']?.contenido || 'Catálogo de Productos'}
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
              {contentMap['catalogo_descripcion']?.contenido ||
                'Complementa tu servicio con nuestra selección de productos profesionales.'}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Package className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm md:text-base">Próximamente encontrarás nuestros productos destacados aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {products.map((product) => (
                <div key={product.id} className="border rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white">
                  {product.imagen ? (
                    <img
                      src={product.imagen.startsWith('http') ? product.imagen : `https://barberrock.es${product.imagen}`}
                      alt={product.nombre}
                      className="w-full h-40 sm:h-48 object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="w-full h-40 sm:h-48 bg-gray-100 rounded-t-xl flex items-center justify-center text-gray-400">
                      <Package className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                  )}
                  <div className="p-4 md:p-6 space-y-2 md:space-y-3">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">{product.nombre}</h3>
                    <p className="text-gray-600 text-sm min-h-[3rem]">
                      {product.descripcion || 'Sin descripción disponible.'}
                    </p>
                    <p className="text-2xl font-bold text-primary-600">
                      {product.precio_desde && <span className="text-sm font-normal text-gray-500">desde </span>}
                      ${product.precio.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Establecimiento */}
      <section id="establecimiento" className="py-12 md:py-16" style={{ backgroundColor: establecimientoBackground }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">{contentMap['establecimiento_titulo']?.contenido || 'Nuestro Establecimiento'}</h2>
              <p className="text-base md:text-lg text-gray-600 mb-4 md:mb-6">
                {contentMap['establecimiento_descripcion']?.contenido ||
                  'Desde hace más de 10 años, hemos sido el referente en servicios de barbería en la ciudad. Nuestro compromiso es brindar una experiencia excepcional a cada cliente que cruza nuestras puertas.'}
              </p>
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">
                {contentMap['descripcion_general']?.contenido ||
                  'Contamos con instalaciones modernas, equipos de última generación y un equipo de profesionales altamente capacitados para ofrecerte el mejor servicio posible.'}
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="flex items-center justify-center lg:justify-start">
                  <Award className="w-6 h-6 md:w-8 md:h-8 text-primary-600 mr-2 md:mr-3" />
                  <div>
                    <h4 className="font-semibold text-sm md:text-base">10+ Años</h4>
                    <p className="text-gray-600 text-xs md:text-sm">De experiencia</p>
                  </div>
                </div>
                <div className="flex items-center justify-center lg:justify-start">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-primary-600 mr-2 md:mr-3" />
                  <div>
                    <h4 className="font-semibold text-sm md:text-base">1000+ Clientes</h4>
                    <p className="text-gray-600 text-xs md:text-sm">Satisfechos</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-6 lg:mt-0">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                {contentMap['establecimiento_imagen']?.imagen ? (
                  <img
                    src={
                      contentMap['establecimiento_imagen'].imagen.startsWith('http')
                        ? contentMap['establecimiento_imagen'].imagen
                        : `https://barberrock.es${contentMap['establecimiento_imagen'].imagen}`
                    }
                    alt="Establecimiento"
                    className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Error al cargar imagen del establecimiento:', contentMap['establecimiento_imagen']?.imagen)
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        const placeholder = document.createElement('div')
                        placeholder.className = 'w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center'
                        placeholder.innerHTML = '<p class="text-primary-600 text-base md:text-lg font-medium">Error al cargar imagen</p>'
                        parent.appendChild(placeholder)
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <p className="text-primary-600 text-base md:text-lg font-medium">Imagen del establecimiento</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Conócenos con Video */}
      {conocenosVideo && (
        <section id="conocenos" className="py-20" style={{ backgroundColor: conocenosBackground }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {conocenosTitulo}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {conocenosDescripcion}
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                {/* Contenedor del video */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
                  {conocenosVideo.tipo_video === 'file' && conocenosVideo.video_file ? (
                    <video
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      controls
                      autoPlay={false}
                      muted
                      playsInline
                      poster={conocenosVideo.imagen ? (conocenosVideo.imagen.startsWith('http') ? conocenosVideo.imagen : `https://barberrock.es${conocenosVideo.imagen}`) : undefined}
                    >
                      <source
                        src={conocenosVideo.video_file.startsWith('http') ? conocenosVideo.video_file : `https://barberrock.es${conocenosVideo.video_file}`}
                        type="video/mp4"
                      />
                      Tu navegador no soporta la reproducción de videos.
                    </video>
                  ) : conocenosVideo.video_url ? (
                    <div className="absolute top-0 left-0 w-full h-full">
                      {/* Si es YouTube */}
                      {conocenosVideo.video_url.includes('youtube.com') || conocenosVideo.video_url.includes('youtu.be') ? (
                        <iframe
                          className="w-full h-full"
                          src={conocenosVideo.video_url.includes('embed') ? conocenosVideo.video_url : conocenosVideo.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          title={conocenosVideo.titulo || 'Video de la barbería'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        /* Si es otro tipo de URL, intentar iframe directo */
                        <iframe
                          className="w-full h-full"
                          src={conocenosVideo.video_url}
                          title={conocenosVideo.titulo || 'Video de la barbería'}
                          allowFullScreen
                        />
                      )}
                    </div>
                  ) : null}
                  
                  {/* Overlay decorativo opcional */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Información del video */}
                {conocenosVideo.descripcion && (
                  <div className="p-6 bg-white">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {conocenosVideo.titulo}
                    </h3>
                    <p className="text-gray-600">
                      {conocenosVideo.descripcion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Galería */}
      <section id="galeria" className="py-12 md:py-16" style={{ backgroundColor: galeriaBackground }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Galería de Trabajos</h2>
            <p className="text-base md:text-xl text-gray-600">
              {contentMap['galeria_descripcion']?.contenido || 'Algunos ejemplos de nuestro trabajo profesional'}
            </p>
          </div>

          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {gallery.map((item) => (
                <div key={item.id} className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {item.imagen ? (
                    <img
                      src={item.imagen.startsWith('http') ? item.imagen : `https://barberrock.es${item.imagen}`}
                      alt={item.titulo || 'Trabajo de la barbería'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        if (e.currentTarget.nextElementSibling) {
                          ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ${
                      item.imagen ? 'hidden' : ''
                    }`}
                  >
                    <p className="text-primary-600 font-medium">
                      {item.titulo || 'Pronto añadiremos más trabajos'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-primary-200 rounded-2xl bg-white/70">
              <p className="text-lg text-gray-600">
                {contentMap['galeria_placeholder_text']?.contenido ||
                  'Aún no has cargado fotografías en la galería. Añádelas desde el panel de administración para mostrarlas aquí.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-12 md:py-16" style={{ backgroundColor: testimoniosBackground }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Lo que dicen nuestros clientes</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 md:py-12">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm md:text-base">Cargando testimonios...</p>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {testimonials.map((testimonio) => (
                <div key={testimonio.id} className="card p-4 md:p-6">
                  <div className="flex mb-3 md:mb-4">
                    {Array.from({ length: testimonio.calificacion }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-3 md:mb-4 italic text-sm md:text-base">"{testimonio.testimonio}"</p>
                  <p className="font-semibold text-sm md:text-base">{testimonio.cliente_nombre}</p>
                  {testimonio.servicio_recibido && (
                    <p className="text-xs md:text-sm text-gray-500 mt-2">Servicio: {testimonio.servicio_recibido}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <p className="text-gray-600 text-sm md:text-base">No hay testimonios disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ubicación */}
      <section id="ubicacion" className="py-12 md:py-16" style={{ backgroundColor: locationBackground }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{locationTitle}</h2>
            <p className="text-base md:text-lg text-gray-600">{locationDescription}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col justify-center order-2 lg:order-1">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">📍 Dirección</h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed text-sm md:text-base">{locationAddress}</p>
            </div>
            <div className="relative overflow-hidden rounded-xl shadow-lg bg-white border border-gray-200 order-1 lg:order-2">
              {locationMapUrl ? (
                <iframe
                  title="Ubicación BarberRock"
                  src={locationMapUrl}
                  className="w-full h-64 sm:h-80 md:h-96"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onError={() => console.error('Error al cargar el iframe del mapa')}
                />
              ) : (
                <div className="w-full h-64 sm:h-80 md:h-96 flex flex-col items-center justify-center text-center px-4 md:px-6">
                  <p className="text-gray-600 mb-2 text-sm md:text-base">
                    Agrega el enlace embebido de Google Maps en el panel de administración.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section
        id="contacto"
        className="py-16"
        style={{ backgroundColor: contactBackgroundColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">¿Listo para tu próximo corte?</h2>
            <p className="text-lg md:text-xl text-primary-100">
              Contáctanos hoy mismo y reserva tu cita
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 text-center">
            <div
              className="rounded-lg p-4 md:p-6"
              style={{ backgroundColor: hexToRGBA(contactCardColor, 0.15) }}
            >
              <Phone className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Teléfono</h3>
              <p className="text-primary-100 text-sm md:text-base">{contentMap['contacto_telefono']?.contenido || '(555) 123-4567'}</p>
            </div>
            <div
              className="rounded-lg p-4 md:p-6"
              style={{ backgroundColor: hexToRGBA(contactCardColor, 0.15) }}
            >
              <MapPin className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Ubicación</h3>
              <p className="text-primary-100 text-sm md:text-base">
                {locationAddress}
              </p>
            </div>
            <div
              className="rounded-lg p-4 md:p-6 sm:col-span-2 md:col-span-1"
              style={{ backgroundColor: hexToRGBA(contactCardColor, 0.15) }}
            >
              <Clock className="w-10 h-10 md:w-12 md:h-12 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Horarios</h3>
              <p className="text-primary-100 whitespace-pre-line text-sm md:text-base">
                {contentMap['horarios_laborales']?.contenido || contentMap['horario_atencion']?.contenido || 'Lun-Sáb: 9:00-19:00'}
              </p>
            </div>
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Link
              href="/cita"
              className="font-bold py-3 px-6 md:px-8 rounded-lg text-base md:text-lg transition-colors inline-flex items-center"
              style={{ backgroundColor: '#ffffff', color: contactBackgroundColor }}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Cita Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12"
        style={{ backgroundColor: footerBackground, color: footerTextColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{businessName}</h3>
              <p style={{ color: footerMuted }}>
                {contentMap['footer_descripcion']?.contenido || 'Tu destino para servicios de barbería profesionales y de calidad en el corazón de la ciudad.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2" style={{ color: footerAccent }}>
                <li>{contentMap['footer_servicio_1']?.contenido || 'Corte de cabello'}</li>
                <li>{contentMap['footer_servicio_2']?.contenido || 'Afeitado clásico'}</li>
                <li>{contentMap['footer_servicio_3']?.contenido || 'Tratamientos faciales'}</li>
                <li>{contentMap['footer_servicio_4']?.contenido || 'Paquetes especiales'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2" style={{ color: footerAccent }}>
                <li>{contentMap['contacto_telefono']?.contenido || '(555) 123-4567'}</li>
                <li>{contentMap['contacto_email']?.contenido || 'info@barberiaelite.com'}</li>
                <li>{contentMap['contacto_direccion']?.contenido || 'Centro Histórico, CDMX'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4" style={{ color: footerAccent }}>
                <a href={contentMap['social_facebook']?.contenido || '#'} className="hover:opacity-80">
                  Facebook
                </a>
                <a href={contentMap['social_instagram']?.contenido || '#'} className="hover:opacity-80">
                  Instagram
                </a>
                <a href={contentMap['social_twitter']?.contenido || '#'} className="hover:opacity-80">
                  Twitter
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p style={{ color: footerAccent }}>
              © {new Date().getFullYear()} {businessName}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

