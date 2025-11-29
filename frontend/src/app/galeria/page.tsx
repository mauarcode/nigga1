'use client'

import Link from 'next/link'
import PublicGallery from '@/components/PublicGallery'

export default function GaleriaPage() {
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
              <Link href="/servicios" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                Servicios
              </Link>
              <Link href="/galeria" className="text-primary-600 border-b-2 border-primary-600 px-3 py-2 text-sm font-medium">
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
            Galería de Trabajos
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Descubre imágenes y videos de nuestro trabajo profesional y la experiencia que ofrecemos
          </p>
        </div>
      </section>

      {/* Galería */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PublicGallery />
        </div>
      </section>

      {/* Información adicional */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Calidad que se ve y se siente
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada corte, cada estilo, cada detalle refleja nuestro compromiso con la excelencia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Profesionalismo</h3>
              <p className="text-gray-600">
                Nuestros barberos son expertos certificados con años de experiencia en las últimas técnicas y tendencias.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Productos Premium</h3>
              <p className="text-gray-600">
                Utilizamos exclusivamente productos de primera calidad para garantizar resultados duraderos y saludables.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Ambiente Exclusivo</h3>
              <p className="text-gray-600">
                Disfruta de un espacio diseñado para tu comodidad y relajación durante tu experiencia de cuidado personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Te gusta lo que ves?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Sé parte de nuestra galería de clientes satisfechos
          </p>
          <Link href="/login" className="bg-white text-primary-600 hover:bg-primary-50 font-bold py-3 px-8 rounded-lg text-lg transition-colors inline-flex items-center">
            Agenda tu cita
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
              <h4 className="font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white">Instagram</a>
                <a href="#" className="text-gray-300 hover:text-white">Facebook</a>
              </div>
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

