'use client'

import { useState, useEffect } from 'react'
import { Clock, Save, Calendar, AlertCircle } from 'lucide-react'

interface BarberScheduleData {
  horario_inicio: string
  horario_fin: string
  dias_laborales: string[]
}

const DIAS_SEMANA = [
  { id: '0', nombre: 'Domingo' },
  { id: '1', nombre: 'Lunes' },
  { id: '2', nombre: 'Martes' },
  { id: '3', nombre: 'Miércoles' },
  { id: '4', nombre: 'Jueves' },
  { id: '5', nombre: 'Viernes' },
  { id: '6', nombre: 'Sábado' },
]

export default function BarberSchedule() {
  const [schedule, setSchedule] = useState<BarberScheduleData>({
    horario_inicio: '09:00',
    horario_fin: '18:00',
    dias_laborales: ['1', '2', '3', '4', '5', '6'], // Lunes a sábado por defecto
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [barberId, setBarberId] = useState<number | null>(null)

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const userId = localStorage.getItem('user_id')
      
      const response = await fetch('https://barberrock.es/api/barberos/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Respuesta de barberos:', data)
        
        // Buscar el perfil del barbero actual por user ID
        const barbersList = Array.isArray(data) ? data : (data.results || [])
        console.log('Lista de barberos:', barbersList)
        console.log('Buscando barbero con user_id:', userId)
        
        // El serializer retorna user como objeto, no como ID
        const barberProfile = barbersList.find((b: any) => {
          const barberoUserId = b.user?.id || b.user_id || b.user
          console.log(`Comparando: barbero user ${barberoUserId} con userId ${userId}`)
          return barberoUserId === parseInt(userId || '0')
        })
        
        console.log('Perfil encontrado:', barberProfile)
        
        if (barberProfile) {
          setBarberId(barberProfile.id)
          
          // Asegurarse de que dias_laborales sea un array de strings
          let diasLaborales = barberProfile.dias_laborales || ['1', '2', '3', '4', '5', '6']
          if (typeof diasLaborales === 'string') {
            try {
              diasLaborales = JSON.parse(diasLaborales)
            } catch {
              diasLaborales = ['1', '2', '3', '4', '5', '6']
            }
          }
          // Convertir a strings si son números
          diasLaborales = diasLaborales.map((d: any) => String(d))
          
          setSchedule({
            horario_inicio: barberProfile.horario_inicio || '09:00',
            horario_fin: barberProfile.horario_fin || '18:00',
            dias_laborales: diasLaborales,
          })
        } else {
          console.error('No se encontró el perfil del barbero para user_id:', userId)
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!barberId) {
      alert('Error: No se encontró el perfil del barbero')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch(`https://barberrock.es/api/barberos/${barberId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      })

      if (response.ok) {
        alert('Horario actualizado correctamente')
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert('Error al actualizar el horario: ' + (errorData.detail || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error al guardar el horario')
    } finally {
      setSaving(false)
    }
  }

  const toggleDia = (diaId: string) => {
    setSchedule((prev) => ({
      ...prev,
      dias_laborales: prev.dias_laborales.includes(diaId)
        ? prev.dias_laborales.filter((d) => d !== diaId)
        : [...prev.dias_laborales, diaId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Importante:</strong> Configura tu horario de trabajo para que los clientes puedan agendar citas solo en tu disponibilidad.
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de horario */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-primary-600" />
            Mi Horario de Trabajo
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Horas de trabajo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de inicio
              </label>
              <input
                type="time"
                value={schedule.horario_inicio}
                onChange={(e) =>
                  setSchedule({ ...schedule, horario_inicio: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de fin
              </label>
              <input
                type="time"
                value={schedule.horario_fin}
                onChange={(e) =>
                  setSchedule({ ...schedule, horario_fin: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Días laborales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Días laborales
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.id}
                  onClick={() => toggleDia(dia.id)}
                  className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    schedule.dias_laborales.includes(dia.id)
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dia.nombre}
                </button>
              ))}
            </div>
            {schedule.dias_laborales.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                Debes seleccionar al menos un día laboral
              </p>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Resumen de tu disponibilidad
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <strong>Horario:</strong> {schedule.horario_inicio} - {schedule.horario_fin}
              </p>
              <p>
                <strong>Días:</strong>{' '}
                {schedule.dias_laborales.length > 0
                  ? schedule.dias_laborales
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map((id) => DIAS_SEMANA.find((d) => d.id === id)?.nombre)
                      .filter(Boolean)
                      .join(', ')
                  : 'Ninguno seleccionado'}
              </p>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || schedule.dias_laborales.length === 0}
              className="btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Horario'}
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          ¿Cómo funciona?
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
            Los clientes solo podrán agendar citas dentro de tu horario de trabajo
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
            Los días no seleccionados no estarán disponibles para reservas
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
            Puedes modificar tu horario en cualquier momento
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
            Los cambios se aplicarán inmediatamente a las nuevas reservas
          </li>
        </ul>
      </div>
    </div>
  )
}


