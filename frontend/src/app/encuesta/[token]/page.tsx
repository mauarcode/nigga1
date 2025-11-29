'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'

const ratingOptions = [1, 2, 3, 4, 5]

interface SurveyInfo {
  cita_id: number
  cliente_nombre: string
  servicio: {
    nombre: string
    duracion: number | null
  }
  tiene_encuesta: boolean
  encuesta?: {
    calificacion: number
    limpieza_calificacion: number
    puntualidad_calificacion: number
    trato_calificacion: number
    recomendaria: boolean
    comentarios: string
  }
}

interface SurveyForm {
  calificacion: number
  limpieza_calificacion: number
  puntualidad_calificacion: number
  trato_calificacion: number
  recomendaria: boolean
  comentarios: string
}

export default function PublicSurveyPage() {
  const params = useParams<{ token: string }>()
  const paramValue = decodeURIComponent(params.token)

  const [info, setInfo] = useState<SurveyInfo | null>(null)
  const [form, setForm] = useState<SurveyForm>({
    calificacion: 5,
    limpieza_calificacion: 5,
    puntualidad_calificacion: 5,
    trato_calificacion: 5,
    recomendaria: true,
    comentarios: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const hasProcessedRef = useRef(false)

  const shareTitle = useMemo(() => {
    if (!info) return 'Encuesta de satisfacción'
    return `Encuesta para ${info.servicio.nombre}`
  }, [info])

  useEffect(() => {
    // Evitar ejecuciones múltiples
    if (hasProcessedRef.current) return
    
    // Verificar si ya se procesó este parámetro en esta sesión
    const sessionKey = `survey_processed_${paramValue}`
    if (sessionStorage.getItem(sessionKey)) {
      return
    }

    const loadInfo = async () => {
      try {
        // Verificar si el parámetro es un ID numérico (cita) o un token
        const isNumericId = /^\d+$/.test(paramValue)
        
        if (isNumericId) {
          // Marcar como procesado para evitar bucles
          hasProcessedRef.current = true
          sessionStorage.setItem(sessionKey, 'true')
          
          // Es un ID de cita, necesitamos obtener el token de la encuesta
          const authToken = localStorage.getItem('access_token')
          
          if (!authToken) {
            window.location.href = '/login?redirect=/dashboard'
            return
          }

          // Obtener información de la cita
          const appointmentResponse = await fetch(`http://137.184.35.178:8000/api/citas/${paramValue}/`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })

          if (!appointmentResponse.ok) {
            throw new Error('No se encontró la cita')
          }

          const appointment = await appointmentResponse.json()
          
          // Intentar obtener el survey token de la cita
          const surveyResponse = await fetch(`http://137.184.35.178:8000/api/encuestas/?cita=${paramValue}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })
          
          if (surveyResponse.ok) {
            const surveyData = await surveyResponse.json()
            const surveys = surveyData.results || surveyData
            
            if (surveys && surveys.length > 0 && surveys[0].survey_token) {
              // Redirigir a la misma página pero con el token correcto
              window.location.href = `/encuesta/${surveys[0].survey_token}`
              return
            }
          }
          
          // Si no hay encuesta, usar el QR token del barbero
          if (appointment.barbero && appointment.barbero.qr_token) {
            window.location.href = `/encuesta/qr/${appointment.barbero.qr_token}`
            return
          } else {
            throw new Error('No se puede acceder a la encuesta. Contacta al administrador.')
          }
        }

        // Es un token normal, proceder normalmente
        hasProcessedRef.current = true
        const response = await fetch(`http://137.184.35.178:8000/api/encuestas/info/?token=${paramValue}`)
        if (!response.ok) {
          throw new Error('No se encontró la encuesta solicitada')
        }

        const data: SurveyInfo = await response.json()
        setInfo(data)

        if (data.encuesta) {
          setForm({
            calificacion: data.encuesta.calificacion,
            limpieza_calificacion: data.encuesta.limpieza_calificacion,
            puntualidad_calificacion: data.encuesta.puntualidad_calificacion,
            trato_calificacion: data.encuesta.trato_calificacion,
            recomendaria: data.encuesta.recomendaria,
            comentarios: data.encuesta.comentarios || '',
          })
          setSubmitted(true)
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'No fue posible cargar la encuesta')
      } finally {
        setLoading(false)
      }
    }

    loadInfo()
  }, [paramValue])

  const handleRatingChange = (field: keyof SurveyForm, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!info) return

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('http://137.184.35.178:8000/api/encuestas/enviar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: paramValue,
          appointment_id: info.cita_id,
          ...form,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'No se pudo registrar la encuesta')
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error al guardar la encuesta')
    } finally {
      setSubmitting(false)
    }
  }

  const renderRatingButtons = (field: keyof SurveyForm, label: string) => (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-2">
        {ratingOptions.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingChange(field, value)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center text-base font-semibold transition-colors ${
              form[field] === value
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'border-gray-300 text-gray-600 hover:border-primary-400'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="bg-primary-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold">{shareTitle}</h1>
            <p className="mt-2 text-primary-100">
              Tu opinión nos ayuda a mejorar cada visita. Por favor, completa esta breve encuesta.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
              <p className="mt-4 text-gray-600">Cargando encuesta...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-10">
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                {error}
              </div>
            </div>
          ) : info ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 px-6 py-8">
              <div className="space-y-5">
                <div className="rounded-lg border border-primary-100 bg-primary-50 px-5 py-4">
                  <p className="text-sm text-primary-700">Estás calificando a:</p>
                  <h2 className="text-xl font-semibold text-primary-900">
                    {info.servicio.nombre}
                  </h2>
                  {info.servicio.duracion && (
                    <p className="text-sm text-primary-700 mt-1">
                      Duración estimada: {info.servicio.duracion} minutos
                    </p>
                  )}
                </div>

                {renderRatingButtons('calificacion', 'Calificación general del servicio')}
                {renderRatingButtons('limpieza_calificacion', 'Limpieza del área de servicio')}
                {renderRatingButtons('puntualidad_calificacion', 'Puntualidad del servicio')}
                {renderRatingButtons('trato_calificacion', 'Trato recibido por el barbero')}
              </div>

              <div className="flex flex-col space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-gray-700">
                      ¿Recomendarías la barbería?
                    </span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, recomendaria: true }))}
                        className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          form.recomendaria
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 text-gray-600 hover:border-green-400'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, recomendaria: false }))}
                        className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          !form.recomendaria
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-gray-300 text-gray-600 hover:border-red-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios adicionales (opcional)
                    </label>
                    <textarea
                      value={form.comentarios}
                      onChange={(e) => setForm((prev) => ({ ...prev, comentarios: e.target.value }))}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Cuéntanos cómo podemos mejorar tu experiencia"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {submitted ? 'Actualizar respuestas' : 'Enviar encuesta'}
                    </>
                  )}
                </button>

                {submitted && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700">
                    ¡Gracias por compartir tu experiencia! Tus respuestas se han registrado correctamente.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

