'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageCircle, Clock, User, Scissors, X, CheckCircle } from 'lucide-react'

interface AppointmentAlert {
  id: number
  appointment_id: number
  cliente_nombre: string
  cliente_telefono: string
  barbero: string
  servicio: string
  fecha_hora: string
  whatsapp_url: string | null
  fecha_creacion: string
}

export default function AppointmentAlerts() {
  const [alerts, setAlerts] = useState<AppointmentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAlerts()
    // Recargar alertas cada 30 segundos
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('access_token')

      if (!token) {
        setError('Debes iniciar sesión como administrador')
        return
      }

      const response = await fetch('http://137.184.35.178:8000/api/admin/alertas/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Tu sesión expiró. Por favor inicia sesión nuevamente.')
          return
        }
        throw new Error('Error al cargar las alertas')
      }

      const data = await response.json()
      setAlerts(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar las alertas')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = async (alert: AppointmentAlert) => {
    if (!alert.whatsapp_url) {
      alert('No hay número de teléfono disponible para este cliente')
      return
    }

    // Abrir WhatsApp en nueva pestaña
    window.open(alert.whatsapp_url, '_blank')

    // Marcar alerta como enviada
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://137.184.35.178:8000/api/admin/alertas/${alert.id}/enviar/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remover la alerta de la lista
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
      }
    } catch (err) {
      console.error('Error al marcar alerta como enviada:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Alertas de Nuevas Citas</h3>
            {alerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                {alerts.length}
              </span>
            )}
          </div>
          <button
            onClick={loadAlerts}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Actualizar
          </button>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {alerts.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay alertas pendientes</p>
            <p className="text-gray-500 text-sm mt-2">Todas las citas han sido procesadas</p>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="divide-y">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500 font-medium">
                        Nueva cita agendada
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(alert.fecha_creacion)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Cliente</p>
                          <p className="font-semibold text-gray-900">{alert.cliente_nombre}</p>
                          {alert.cliente_telefono && (
                            <p className="text-sm text-gray-600">{alert.cliente_telefono}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Scissors className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Barbero</p>
                          <p className="font-semibold text-gray-900">{alert.barbero}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Scissors className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Servicio</p>
                          <p className="font-semibold text-gray-900">{alert.servicio}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Fecha y Hora</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(alert.fecha_hora)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {alert.whatsapp_url ? (
                      <button
                        onClick={() => handleWhatsAppClick(alert)}
                        className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Enviar WhatsApp
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500 text-center">
                        <p>Sin teléfono</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


