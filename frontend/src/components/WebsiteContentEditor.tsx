'use client'

import { useState, useEffect } from 'react'
import { Save, X, Edit } from 'lucide-react'

interface WebsiteContent {
  id: number
  tipo_contenido: string
  contenido: string
  activo: boolean
}

interface WebsiteContentEditorProps {
  content: WebsiteContent
  onSave: (content: WebsiteContent) => void
  onCancel: () => void
}

export default function WebsiteContentEditor({ content, onSave, onCancel }: WebsiteContentEditorProps) {
  const [formData, setFormData] = useState({
    contenido: content.contenido,
    activo: content.activo
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...content,
      ...formData
    })
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getFieldLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'inicio_titulo': 'Título de la página de inicio',
      'inicio_descripcion': 'Descripción de la página de inicio',
      'establecimiento_descripcion': 'Descripción del establecimiento',
      'establecimiento_historia': 'Historia del establecimiento',
      'establecimiento_mision': 'Misión del establecimiento',
      'establecimiento_vision': 'Visión del establecimiento',
      'contacto_telefono': 'Teléfono de contacto',
      'contacto_email': 'Email de contacto',
      'contacto_direccion': 'Dirección de contacto',
      'horarios_laborales': 'Horarios laborales'
    }
    return labels[tipo] || tipo.replace('_', ' ')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar Contenido: {getFieldLabel(content.tipo_contenido)}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Campo de contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido
              </label>
              <textarea
                value={formData.contenido}
                onChange={(e) => handleChange('contenido', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingrese el contenido..."
              />
            </div>

            {/* Checkbox de activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => handleChange('activo', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                Contenido activo
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
