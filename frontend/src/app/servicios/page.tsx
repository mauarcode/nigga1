'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Star, Calendar } from 'lucide-react'

interface Service {
  id: number
  nombre: string
  descripcion: string
  precio: number
  duracion: number
  activo: boolean
  imagen?: string
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    // Cargar servicios desde la API real
    const loadServices = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://137.184.35.178:8000/api/servicios/')
        const data = await response.json()
        
        // La API puede devolver data.results (paginado) o data directamente (array)
        const servicesData = data.results || data
        
        // Filtrar solo servicios activos para la vista pública
        const activeServices = servicesData.filter((service: Service) => service.activo)
        setServices(activeServices)
        
        // Extraer categorías únicas (si existen en los servicios)
        const uniqueCategories = Array.from(new Set(servicesData.map((s: any) => s.categoria).filter(Boolean))) as string[]
        setCategories(uniqueCategories.length > 0 ? uniqueCategories : ['Todos los servicios'])
        
        setLoading(false)
      } catch (error) {
        console.error('Error al cargar servicios:', error)
        setLoading(false)
        // Mostrar mensaje de error al usuario
        alert('Error al cargar los servicios. Por favor, intenta de nuevo más tarde.')
      }
    }

    loadServices()
  }, [])

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.toLowerCase().includes('corte')) return '✂️'
    if (serviceName.toLowerCase().includes('barba')) return '🧔'
    if (serviceName.toLowerCase().includes('afeitado')) return '🪒'
    if (serviceName.toLowerCase().includes('tratamiento')) return '💆'
    return '✨'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Barbería BarberRock
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                Inicio
              </Link>
              <Link href="/servicios" className="text-primary-600 border-b-2 border-primary-600 px-3 py-2 text-sm font-medium">
                Servicios
              </Link>
              <Link href="/galeria" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                Galería
              </Link>
              <Link href="/contacto" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                Contacto
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-secondary">
                Iniciar Sesión
              </Link>
              <Link href="/registro" className="btn-primary">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Descubre nuestra amplia gama de servicios profesionales diseñados para realzar tu estilo personal
          </p>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="card hover:shadow-lg transition-shadow">
                <div className="relative mb-4">
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">{getServiceIcon(service.nombre)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.nombre}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {service.descripcion}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-sm">{service.duracion} min</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary-600">
                      ${service.precio}
                    </span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full btn-primary inline-flex items-center justify-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Información adicional */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir nuestros servicios?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Calidad Premium</h3>
              <p className="text-gray-600">
                Utilizamos productos de primera calidad y técnicas profesionales para garantizar resultados excepcionales.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Experiencia Personalizada</h3>
              <p className="text-gray-600">
                Cada servicio se adapta a tus necesidades específicas y estilo personal para lograr el mejor resultado.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexibilidad de Horarios</h3>
              <p className="text-gray-600">
                Agenda tu cita en el horario que más te convenga con nuestro sistema de reservas en línea.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Agenda tu cita ahora y experimenta nuestros servicios profesionales
          </p>
          <Link href="/login" className="bg-white text-primary-600 hover:bg-primary-50 font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Agendar Cita Ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Barbería BarberRock</h3>
              <p className="text-gray-300">
                Tu destino para servicios de barbería profesionales y de calidad.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Corte de cabello</li>
                <li>Diseño de barba</li>
                <li>Afeitado clásico</li>
                <li>Tratamientos capilares</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-300">
                <li>(555) 123-4567</li>
                <li>info@barberrock.com</li>
                <li>Centro Histórico, CDMX</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Horarios</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Lun-Sáb: 9:00-19:00</li>
                <li>Dom: 10:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © {new Date().getFullYear()} Barbería BarberRock. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

