'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogIn, QrCode } from 'lucide-react'

export default function QRScanPage() {
  const params = useParams<{ qrToken: string }>()
  const router = useRouter()
  const qrToken = decodeURIComponent(params.qrToken)
  
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [barberoInfo, setBarberoInfo] = useState<any>(null)
  const [citaInfo, setCitaInfo] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
    
    if (token) {
      // Usuario autenticado - buscar cita pendiente
      loadPendingSurvey()
    } else {
      // Usuario no autenticado - mostrar mensaje para iniciar sesión
      loadBarberInfo()
    }
  }, [qrToken])

  const loadBarberInfo = async () => {
    try {
      const response = await fetch(`https://barberrock.es/api/qr/${qrToken}/`)
      if (!response.ok) {
        throw new Error('Código QR inválido')
      }
      const data = await response.json()
      setBarberoInfo(data.barbero)
    } catch (err: any) {
      setError(err.message || 'Código QR inválido')
    } finally {
      setLoading(false)
    }
  }

  const loadPendingSurvey = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`https://barberrock.es/api/qr/${qrToken}/encuesta/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 404) {
          setError(errorData.error || 'No tienes citas pendientes de calificación con este barbero')
        } else {
          throw new Error(errorData.error || 'Error al cargar la información')
        }
        setLoading(false)
        return
      }
      
      const data = await response.json()
      if (data.tiene_cita_pendiente && data.cita) {
        setCitaInfo(data.cita)
        // Redirigir automáticamente a la encuesta usando el encuesta_token/survey_token (preferido) o ID
        const token = data.cita.encuesta_token || data.cita.survey_token
        const encuestaPath = token 
          ? `/encuesta/${token}` 
          : `/encuesta/${data.cita.id}`
        router.push(encuestaPath)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la información')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Código QR Inválido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Califica tu Cita
            </h2>
            {barberoInfo && (
              <p className="text-gray-600">
                Barbero: <span className="font-semibold">{barberoInfo.nombre}</span>
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Para calificar tu cita, necesitas iniciar sesión en tu cuenta de cliente.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href={`/login?redirect=/encuesta/qr/${qrToken}`}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Iniciar Sesión
            </Link>
            <Link 
              href="/registro"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Crear Cuenta
            </Link>
            <Link 
              href="/"
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sin Citas Pendientes</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link href="/dashboard" className="btn-primary w-full">
              Ir a mi Dashboard
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirigiendo a la encuesta...</p>
      </div>
    </div>
  )
}

