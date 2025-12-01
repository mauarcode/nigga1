'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, CheckCircle } from 'lucide-react'

interface Service {
  id: number
  nombre: string
  descripcion: string
  precio: number
  precio_desde?: boolean
  duracion: number
}

interface Barber {
  id: number
  user: {
    first_name: string
    last_name: string
  }
  especialidad?: string
}

interface TimeSlot {
  hora: string
  hora_fin?: string
  disponible: boolean
}

interface Product {
  id: number
  nombre: string
  descripcion: string
  precio: number
  imagen?: string | null
  activo?: boolean
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

export default function CitaPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [slotsMessage, setSlotsMessage] = useState<string>('')

  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceType, setServiceType] = useState<'service' | 'package'>('service')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [esElegiblePromocion, setEsElegiblePromocion] = useState(false)

  const [notes, setNotes] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userRole = localStorage.getItem('user_role')
    
    // Si el usuario está autenticado pero NO es cliente, redirigir según su rol
    if (token && userRole) {
      if (userRole === 'admin' || userRole === 'barbero') {
        // Redirigir directamente sin alerta
        window.location.href = '/login?redirect=/cita'
        return
      } else if (userRole === 'cliente') {
        // Usuario es cliente, puede continuar
        setIsAuthenticated(true)
      } else {
        // Rol desconocido, redirigir a login
        window.location.href = '/login?redirect=/cita'
        return
      }
    } else {
      // Usuario no autenticado, redirigir a login
      window.location.href = '/login?redirect=/cita'
      return
    }

    // Cargar servicios y barberos desde la API
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Cargar servicios
        const servicesResponse = await fetch('https://barberrock.es/api/servicios/')
        const servicesData = await servicesResponse.json()
        const rawServices = servicesData.results || servicesData || []
        const normalizedServices: Service[] = rawServices
          .map((service: any) => {
            const precioNumber =
              typeof service.precio === 'number' ? service.precio : parseFloat(service.precio ?? '0')
            const duracionNumber =
              typeof service.duracion === 'number' ? service.duracion : parseInt(service.duracion ?? '0', 10)
            return {
              ...service,
              precio: Number.isFinite(precioNumber) ? precioNumber : 0,
              duracion: Number.isFinite(duracionNumber) ? duracionNumber : 30,
            }
          })
          .filter((service: any) => service.activo !== false)
        const activeServices = normalizedServices
        setServices(activeServices)

        // Cargar paquetes
        const packagesResponse = await fetch('https://barberrock.es/api/paquetes/')
        const packagesData = await packagesResponse.json()
        const rawPackages = packagesData.results || packagesData || []
        const normalizedPackages: Package[] = rawPackages
          .filter((pkg: any) => pkg.activo !== false)
          .map((pkg: any) => ({
            ...pkg,
            precio: typeof pkg.precio === 'number' ? pkg.precio : parseFloat(pkg.precio ?? '0')
          }))
        setPackages(normalizedPackages)

        // Cargar barberos
        const barbersResponse = await fetch('https://barberrock.es/api/barberos/')
        const barbersData = await barbersResponse.json()
        setBarbers(barbersData.results || barbersData)

        // Cargar productos disponibles
        const productsResponse = await fetch('https://barberrock.es/api/productos/')
        const productsData = await productsResponse.json()
        const rawProducts = productsData.results || productsData || []
        const normalizedProducts: Product[] = rawProducts
          .map((product: any) => {
            const precioNumber = typeof product.precio === 'number' ? product.precio : parseFloat(product.precio ?? '0')
            return {
              ...product,
              precio: Number.isFinite(precioNumber) ? precioNumber : 0,
            }
          })
          .filter((product: Product) => product.activo !== false)
        setProducts(normalizedProducts)

        // Cargar perfil del cliente para verificar si es elegible para promoción
        if (token) {
          try {
            const profileResponse = await fetch('https://barberrock.es/api/clientes/', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            const profileData = await profileResponse.json()
            const currentProfile = (profileData.results || profileData).find((p: any) => p.user)
            if (currentProfile && currentProfile.es_elegible_para_promocion) {
              setEsElegiblePromocion(true)
            }
          } catch (err) {
            console.error('Error al cargar perfil del cliente:', err)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setLoading(false)
        alert('Error al cargar la información. Por favor, intenta de nuevo.')
      }
    }

    loadData()
  }, [])

  // Cargar horarios disponibles desde la API
  useEffect(() => {
    const selectedItem = serviceType === 'service' ? selectedService : selectedPackage
    if (selectedBarber && selectedDate && selectedItem) {
      const loadAvailableSlots = async () => {
        try {
          setLoadingSlots(true)
          setAvailableSlots([])
          setSlotsMessage('')
          setSelectedTime('')

          const duracion = serviceType === 'service' && selectedService ? selectedService.duracion : 60
          const response = await fetch(
            `https://barberrock.es/api/citas/horarios-disponibles/?barbero_id=${selectedBarber.id}&fecha=${selectedDate}&duracion=${duracion}`
          )
          const data = await response.json()
          
          // Formatear los datos según la respuesta de la API
          const rawSlots = data.horarios_disponibles || []
          const slots: TimeSlot[] = rawSlots.map((slot: any) => ({
            hora: slot.hora,
            hora_fin: slot.hora_fin,
            disponible: slot.disponible !== false,
          }))

          if (slots.length === 0) {
            setSlotsMessage(data.mensaje || 'No hay horarios disponibles para esta fecha')
          }

          setAvailableSlots(slots)
        } catch (error) {
          console.error('Error al cargar horarios disponibles:', error)
          // Si hay error, generar horarios genéricos
          const genericSlots: TimeSlot[] = []
          for (let hour = 9; hour <= 18; hour++) {
            for (let minute of [0, 30]) {
              if (hour === 18 && minute === 30) break
              genericSlots.push({
                hora: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                disponible: true
              })
            }
          }
          setAvailableSlots(genericSlots)
          setSlotsMessage('Mostrando horarios genéricos. Verifica tu conexión con el servidor.')
        }
        setLoadingSlots(false)
      }

      loadAvailableSlots()
    }
  }, [selectedBarber, selectedDate, selectedService, selectedPackage, serviceType])

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const selectedProductDetails = products.filter((product) => selectedProducts.includes(product.id))
  const productosTotal = selectedProductDetails.reduce(
    (sum, product) => sum + (Number.isFinite(product.precio) ? product.precio : 0),
    0
  )
  const selectedItemPrice = serviceType === 'service' 
    ? (selectedService && !esElegiblePromocion ? Number(selectedService.precio ?? 0) : 0)
    : (selectedPackage ? Number(selectedPackage.precio ?? 0) : 0)
  const totalCita = Number.isFinite(selectedItemPrice) ? selectedItemPrice + productosTotal : productosTotal

  const canProceed = () => {
    switch (currentStep) {
      case 1: return (serviceType === 'service' && selectedService !== null) || (serviceType === 'package' && selectedPackage !== null)
      case 2: return selectedBarber !== null
      case 3: return selectedDate !== '' && selectedTime !== ''
      default: return true
    }
  }

  const handleConfirmAppointment = async () => {
    const selectedItem = serviceType === 'service' ? selectedService : selectedPackage
    if (!selectedItem || !selectedBarber || !selectedDate || !selectedTime) {
      alert('Por favor completa todos los campos')
      return
    }

    try {

      const token = localStorage.getItem('access_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const payload: Record<string, any> = {
        barbero_id: selectedBarber.id,
        fecha: selectedDate,
        hora: selectedTime,
        duracion: serviceType === 'service' && selectedService ? selectedService.duracion : 60,
        notas: notes,
      }

      if (serviceType === 'service' && selectedService) {
        payload.servicio_id = selectedService.id
      } else if (serviceType === 'package' && selectedPackage) {
        payload.paquete_id = selectedPackage.id
      }


      if (selectedProducts.length > 0) {
        payload.productos = selectedProducts
      }

      const response = await fetch('https://barberrock.es/api/citas/agendar/', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('¡Cita agendada exitosamente!')
        window.location.href = '/dashboard'
      } else {
        let errorMessage = 'Error al agendar la cita. Intenta nuevamente.'
        let errorData: any = {}
        try {
          errorData = await response.json()
          errorMessage = errorData.error || JSON.stringify(errorData)
          
          // Si hay una encuesta pendiente, redirigir a la página de encuesta
          if (errorData.cita_pendiente) {
            const barberoNombre = errorData.cita_pendiente.barbero || 'tu barbero'
            const mensaje = `Antes de agendar tu siguiente cita, cuéntanos cómo te fue con ${barberoNombre}. ¿Deseas calificar el servicio ahora?`
            if (confirm(mensaje)) {
              if (errorData.cita_pendiente.qr_token) {
                window.location.href = `/encuesta/qr/${errorData.cita_pendiente.qr_token}`
              } else if (errorData.cita_pendiente.id) {
                window.location.href = `/encuesta/${errorData.cita_pendiente.id}`
              }
              return
            }
          }
        } catch (error) {
          // Ignorar errores al parsear
        }

        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error al confirmar cita:', error)
      alert('Error al confirmar la cita. Por favor, intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
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
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn-secondary">
                Mi Cuenta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-4 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Seleccionar Servicio o Paquete */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 1: Elige tu servicio o paquete</h2>
            <p className="text-gray-600 mb-6">Selecciona el servicio o paquete que deseas recibir</p>

            {/* Tabs para elegir entre servicios y paquetes */}
            <div className="flex space-x-4 mb-6 border-b">
              <button
                onClick={() => {
                  setServiceType('service')
                  setSelectedService(null)
                  setSelectedPackage(null)
                }}
                className={`px-4 py-2 font-medium ${
                  serviceType === 'service'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Servicios
              </button>
              <button
                onClick={() => {
                  setServiceType('package')
                  setSelectedService(null)
                  setSelectedPackage(null)
                }}
                className={`px-4 py-2 font-medium ${
                  serviceType === 'package'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Paquetes
              </button>
            </div>

            {serviceType === 'service' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.nombre}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {service.descripcion}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">{service.duracion} min</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary-600">
                          {service.precio_desde && <span className="text-sm font-normal text-gray-500">desde </span>}
                          ${service.precio}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.imagen && (
                      <div className="w-full h-32 mb-4 rounded-lg overflow-hidden">
                        <img
                          src={pkg.imagen.startsWith('http') ? pkg.imagen : `https://barberrock.es${pkg.imagen}`}
                          alt={pkg.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {pkg.nombre}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {pkg.descripcion}
                    </p>
                    {pkg.servicios && pkg.servicios.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">
                        Incluye: {pkg.servicios.map(s => s.nombre).join(', ')}
                      </p>
                    )}
                    <div className="text-right">
                      <span className="text-xl font-bold text-primary-600">
                        ${pkg.precio}
                      </span>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No hay paquetes disponibles
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Seleccionar Barbero */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 2: Elige tu barbero</h2>
            <p className="text-gray-600 mb-8">Selecciona el profesional que prefieras</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    selectedBarber?.id === barber.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setSelectedBarber(barber)}
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                    {barber.user.first_name} {barber.user.last_name}
                  </h3>
                  {barber.especialidad && (
                    <p className="text-gray-600 text-sm text-center mb-4">
                      {barber.especialidad}
                    </p>
                  )}
                  <div className="text-center">
                    <div className="flex items-center justify-center text-yellow-400 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="text-sm">★</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">4.9 (127 reseñas)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Seleccionar Fecha y Hora */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 3: Elige fecha y hora</h2>
            <p className="text-gray-600 mb-8">Selecciona cuándo deseas tu cita</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona una fecha
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Horarios disponibles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horarios disponibles
                </label>
                {loadingSlots ? (
                  <div className="text-center py-8 text-gray-500">
                    Cargando horarios...
                  </div>
                ) : selectedDate && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.hora}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedTime === slot.hora
                            ? 'bg-primary-600 text-white'
                            : slot.disponible
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!slot.disponible}
                        onClick={() => slot.disponible && setSelectedTime(slot.hora)}
                      >
                        {slot.hora}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {selectedDate ? slotsMessage || 'No hay horarios disponibles para esta fecha' : 'Selecciona una fecha primero'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmación */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso 4: Confirmar cita</h2>
            <p className="text-gray-600 mb-8">Revisa los detalles de tu cita antes de confirmar</p>

            {products.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona productos adicionales</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Añade productos recomendados para complementar tu servicio. Podrás pagarlos directamente en la barbería.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-2">
                  {products.map((product) => {
                    const isSelected = selectedProducts.includes(product.id)
                    const priceValue = Number.isFinite(product.precio) ? product.precio : 0
                    return (
                      <label
                        key={product.id}
                        className={`border rounded-lg p-4 cursor-pointer transition ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductSelection(product.id)}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">{product.nombre}</h4>
                              <span className="text-sm font-bold text-primary-600">
                                ${priceValue.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{product.descripcion || 'Sin descripción'}</p>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Servicio seleccionado</h3>
                  <p className="text-gray-600">
                    {serviceType === 'service' ? selectedService?.nombre : selectedPackage?.nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    {serviceType === 'service' ? selectedService?.descripcion : selectedPackage?.descripcion}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Barbero</h3>
                  <p className="text-gray-600">
                    {selectedBarber?.user.first_name} {selectedBarber?.user.last_name}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Fecha y hora</h3>
                  <p className="text-gray-600">
                    {selectedDate && formatDate(selectedDate)} a las {selectedTime}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Precio</h3>
                  {esElegiblePromocion && selectedService && serviceType === 'service' ? (
                    <>
                      <p className="text-xl font-bold text-green-600">
                        Gratis
                      </p>
                      <p className="text-sm text-gray-500">
                        ¡Felicidades! Has ganado un corte gratis
                      </p>
                      {selectedProductDetails.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Productos: ${productosTotal.toFixed(2)}
                        </p>
                      )}
                    </>
                  ) : selectedService?.precio_desde ? (
                    <>
                      <p className="text-xl font-bold text-primary-600">
                        Desde ${selectedService.precio}
                      </p>
                      <p className="text-sm text-gray-500">
                        El precio final se determina en el local
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-primary-600">
                        ${totalCita.toFixed(2)}
                      </p>
                      {selectedProductDetails.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Incluye productos por ${productosTotal.toFixed(2)}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {selectedProductDetails.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Productos seleccionados</h3>
                    <ul className="space-y-2">
                      {selectedProductDetails.map((product) => {
                        const priceValue = Number.isFinite(product.precio) ? product.precio : 0
                        return (
                          <li key={product.id} className="flex items-center justify-between text-sm text-gray-600">
                            <span>{product.nombre}</span>
                            <span>${priceValue.toFixed(2)}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>


            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas adicionales</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="¿Deseas indicarnos algo más? (opcional)"
              />
            </div>

            <div className="flex items-center justify-center">
              <button 
                onClick={handleConfirmAppointment}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-2 rounded-md font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center px-6 py-2 rounded-md font-medium transition-colors ${
                canProceed()
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <Link href="/dashboard" className="btn-primary">
              Ir al Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

