'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star, Send, Copy, Check, Loader2 } from 'lucide-react'

interface SurveyModalProps {
  token: string
  appointmentId: number
  onClose: () => void
  onSubmitted: () => void
}

interface SurveyInfo {
  cita_id: number
  cliente_nombre: string
  cliente_email: string
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

const ratingOptions = [1, 2, 3, 4, 5]

interface SurveyForm {
  calificacion: number
  limpieza_calificacion: number
  puntualidad_calificacion: number
  trato_calificacion: number
  recomendaria: boolean
  comentarios: string
}

export default function SurveyModal({ token, appointmentId, onClose, onSubmitted }: SurveyModalProps) {
  const [info, setInfo] = useState<SurveyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<SurveyForm>({
    calificacion: 5,
    limpieza_calificacion: 5,
    puntualidad_calificacion: 5,
    trato_calificacion: 5,
    recomendaria: true,
    comentarios: '',
  })

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return ''
    }
    return `${window.location.origin}/encuesta/${token}`
  }, [token])

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/encuestas/info/?token=${token}`)
        if (!response.ok) {
          throw new Error('No se pudo obtener la información de la encuesta')
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
  }, [token])

  const handleRatingChange = (field: keyof SurveyForm, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError('')

      const response = await fetch('http://localhost:8000/api/encuestas/enviar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          appointment_id: appointmentId,
          ...form,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'No se pudo registrar la encuesta')
      }

      setSubmitted(true)
      onSubmitted()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error al guardar la encuesta')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (err) {
      console.error(err)
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
            className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold transition-colors ${
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Encuesta de satisfacción</h2>
            <p className="text-sm text-gray-500">
              Comparte la encuesta con tu cliente para registrar su experiencia.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <XIcon />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="mt-4 text-gray-600">Cargando información...</p>
          </div>
        ) : error ? (
          <div className="px-6 py-10">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
              {error}
            </div>
          </div>
        ) : info ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Encuesta presencial</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Pide al cliente que responda estas preguntas directamente en tu dispositivo.
                </p>

                <div className="space-y-4">
                  {renderRatingButtons('calificacion', 'Calificación general')}
                  {renderRatingButtons('limpieza_calificacion', 'Limpieza del área de servicio')}
                  {renderRatingButtons('puntualidad_calificacion', 'Puntualidad del servicio')}
                  {renderRatingButtons('trato_calificacion', 'Trato recibido')}

                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-gray-700">
                      ¿Recomendarías la barbería?
                    </span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, recomendaria: true }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
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
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
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
                      Comentarios adicionales
                    </label>
                    <textarea
                      value={form.comentarios}
                      onChange={(e) => setForm((prev) => ({ ...prev, comentarios: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="¿Hay algo que debamos saber para mejorar tu experiencia?"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {submitted ? 'Actualizar encuesta' : 'Registrar encuesta'}
                      </>
                    )}
                  </button>

                  {submitted && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                      ¡La encuesta fue registrada correctamente!
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Encuesta vía QR</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Imprime o muestra este código QR para que el cliente abra la encuesta en su propio dispositivo.
                </p>

                <div className="flex flex-col items-center justify-center py-4">
                  {shareUrl ? (
                    <img
                      src={`https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(shareUrl)}`}
                      alt="Código QR para encuesta"
                      className="rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-gray-100 rounded-lg">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  )}

                  <button
                    onClick={() => window.open(shareUrl, '_blank')}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-600"
                  >
                    Abrir encuesta en nueva pestaña
                  </button>
                </div>

                <div className="rounded-md bg-gray-50 border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600">
                  <p className="font-semibold text-gray-700">Enlace directo:</p>
                  <p className="mt-1 break-words text-xs text-gray-500">{shareUrl}</p>

                  <button
                    onClick={handleCopyShareUrl}
                    className="mt-3 inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700"
                  >
                    {copyFeedback ? (
                      <>
                        <Check className="w-4 h-4" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar enlace
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <p className="font-semibold text-blue-900">Consejo:</p>
                <p>
                  Pide al cliente que complete la encuesta antes de salir. Sus respuestas se guardarán inmediatamente y podrás decidir si mostrar el testimonio en la página pública desde el panel de administración.
                </p>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

