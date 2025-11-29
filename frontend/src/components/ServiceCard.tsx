import Link from 'next/link'
import { Clock, Calendar } from 'lucide-react'

interface ServiceCardProps {
  id: number
  nombre: string
  descripcion: string
  precio: number
  duracion: number
  imagen?: string
  showBookingButton?: boolean
}

export default function ServiceCard({
  nombre,
  descripcion,
  precio,
  duracion,
  showBookingButton = true
}: ServiceCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="relative mb-4">
        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
          <span className="text-4xl">
            {nombre.toLowerCase().includes('corte') ? '✂️' :
             nombre.toLowerCase().includes('barba') ? '🧔' :
             nombre.toLowerCase().includes('afeitado') ? '🪒' :
             nombre.toLowerCase().includes('tratamiento') ? '💆' : '✨'}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {nombre}
        </h3>
        <p className="text-gray-600 text-sm mb-3">
          {descripcion}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm">{duracion} min</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary-600">
            ${precio}
          </span>
        </div>
      </div>

      {showBookingButton && (
        <Link
          href="/login"
          className="w-full btn-primary inline-flex items-center justify-center"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Agendar Ahora
        </Link>
      )}
    </div>
  )
}

