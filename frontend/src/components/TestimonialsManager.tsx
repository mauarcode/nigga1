'use client'

import { useState, useEffect } from 'react'
import { Star, Edit, Trash2, Eye, EyeOff, Plus, X, Save } from 'lucide-react'

interface Testimonial {
  id: number
  cliente_nombre: string
  testimonio: string
  calificacion: number
  fecha_creacion: string
  activo: boolean
  servicio_recibido?: string
  cliente_foto?: string
}

export default function TestimonialsManager() {
const [testimonials, setTestimonials] = useState<Testimonial[]>([])
const [loading, setLoading] = useState(true)
const [errorState, setErrorState] = useState('')
const [editingId, setEditingId] = useState<number | null>(null)
const [editForm, setEditForm] = useState({
  testimonio: '',
  activo: true,
})
const [showCreateModal, setShowCreateModal] = useState(false)
const [createForm, setCreateForm] = useState({
  cliente_nombre: '',
  servicio_recibido: '',
  calificacion: 5,
  testimonio: '',
  activo: true,
})

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/testimonios/', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (response.ok) {
        const data = await response.json()
        const parsed = Array.isArray(data) ? data : data?.results ?? []
        setTestimonials(parsed)
        setErrorState('')
      } else if (response.status === 401) {
        setTestimonials([])
        setErrorState('No autorizado. Vuelve a iniciar sesión como administrador.')
      }
    } catch (error) {
      console.error('Error loading testimonials:', error)
      setErrorState('No se pudieron cargar los testimonios. Revisa tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id)
    setEditForm({
      testimonio: testimonial.testimonio,
      activo: testimonial.activo,
    })
  }

  const handleSave = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/testimonios/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        await loadTestimonials()
        setEditingId(null)
        alert('Testimonio actualizado correctamente')
      }
    } catch (error) {
      console.error('Error updating testimonial:', error)
      alert('Error al actualizar el testimonio')
    }
  }

  const toggleVisibility = async (id: number, currentActivo: boolean) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/testimonios/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ activo: !currentActivo }),
      })

      if (response.ok) {
        await loadTestimonials()
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Error al cambiar la visibilidad')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este testimonio?')) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/api/testimonios/${id}/`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (response.ok) {
        await loadTestimonials()
        alert('Testimonio eliminado correctamente')
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      alert('Error al eliminar el testimonio')
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      cliente_nombre: '',
      servicio_recibido: '',
      calificacion: 5,
      testimonio: '',
      activo: true,
    })
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!createForm.cliente_nombre.trim() || !createForm.testimonio.trim()) {
      alert('Nombre del cliente y testimonio son obligatorios')
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/testimonios/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cliente_nombre: createForm.cliente_nombre.trim(),
          testimonio: createForm.testimonio.trim(),
          calificacion: Number(createForm.calificacion),
          servicio_recibido: createForm.servicio_recibido.trim(),
          activo: createForm.activo,
        }),
      })

      if (response.ok) {
        await loadTestimonials()
        resetCreateForm()
        setShowCreateModal(false)
        alert('Testimonio creado correctamente')
      } else {
        const errorData = await response.json()
        alert(
          'Error al crear el testimonio: ' +
            (errorData.detail || errorData.error || JSON.stringify(errorData))
        )
      }
    } catch (error) {
      console.error('Error creating testimonial:', error)
      alert('Error al crear el testimonio')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Testimonios</h2>
            <p className="text-gray-600 mt-1">Administra los testimonios de clientes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo testimonio
          </button>
        </div>

        {/* Estadísticas */}
        <div className="px-6 py-4 border-b bg-gray-50">
          {errorState && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorState}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{testimonials.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {testimonials.filter((t) => t.activo).length}
              </p>
              <p className="text-sm text-gray-600">Visibles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {testimonials.filter((t) => !t.activo).length}
              </p>
              <p className="text-sm text-gray-600">Ocultos</p>
            </div>
          </div>
        </div>

        {/* Lista de testimonios */}
        <div className="p-6">
          {testimonials.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay testimonios aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className={`border rounded-lg p-4 ${
                    !testimonial.activo ? 'bg-gray-50 opacity-75' : ''
                  }`}
                >
                  {editingId === testimonial.id ? (
                    // Modo edición
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Testimonio
                        </label>
                        <textarea
                          value={editForm.testimonio}
                          onChange={(e) =>
                            setEditForm({ ...editForm, testimonio: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`activo-${testimonial.id}`}
                          checked={editForm.activo}
                          onChange={(e) =>
                            setEditForm({ ...editForm, activo: e.target.checked })
                          }
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`activo-${testimonial.id}`}
                          className="text-sm text-gray-700"
                        >
                          Visible en la página
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(testimonial.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo visualización
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {testimonial.cliente_nombre}
                          </h3>
                          {!testimonial.activo && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                              Oculto
                            </span>
                          )}
                        </div>

                        <div className="mb-2">{renderStars(testimonial.calificacion)}</div>

                        <p className="text-gray-600 mb-2">{testimonial.testimonio}</p>

                        <p className="text-sm text-gray-500">
                          {new Date(testimonial.fecha_creacion).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => toggleVisibility(testimonial.id, testimonial.activo)}
                          className={`p-2 rounded-lg transition-colors ${
                            testimonial.activo
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title={testimonial.activo ? 'Ocultar' : 'Mostrar'}
                        >
                          {testimonial.activo ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(testimonial)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(testimonial.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Nuevo testimonio</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetCreateForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del cliente *
                </label>
                <input
                  type="text"
                  value={createForm.cliente_nombre}
                  onChange={(e) => setCreateForm({ ...createForm, cliente_nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio recibido
                  </label>
                  <input
                    type="text"
                    value={createForm.servicio_recibido}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, servicio_recibido: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Corte de cabello, Afeitado, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calificación
                  </label>
                  <select
                    value={createForm.calificacion}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, calificacion: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} estrellas
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonio *</label>
                <textarea
                  value={createForm.testimonio}
                  onChange={(e) => setCreateForm({ ...createForm, testimonio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Escribe el comentario del cliente..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="nuevo-testimonio-activo"
                  type="checkbox"
                  checked={createForm.activo}
                  onChange={(e) => setCreateForm({ ...createForm, activo: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="nuevo-testimonio-activo" className="text-sm text-gray-700">
                  Mostrar de inmediato en la página pública
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetCreateForm()
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Guardar testimonio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

