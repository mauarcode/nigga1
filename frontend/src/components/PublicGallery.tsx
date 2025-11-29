'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'

interface GalleryItem {
  id: number
  titulo: string
  descripcion: string
  imagen?: string
  video_url?: string
  es_video: boolean
  orden: number
  activo: boolean
}

export default function PublicGallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  useEffect(() => {
    loadGalleryItems()
  }, [])

  const loadGalleryItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://137.184.35.178:8000/api/galeria/')
      
      if (response.ok) {
        const data = await response.json()
        const items = Array.isArray(data) ? data : data.results || []
        // Filtrar solo activos y ordenar
        const activeItems = items.filter((item: GalleryItem) => item.activo).sort((a: GalleryItem, b: GalleryItem) => a.orden - b.orden)
        setGalleryItems(activeItems)
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const openLightbox = (item: GalleryItem, index: number) => {
    setSelectedItem(item)
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedItem(null)
  }

  const goToPrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : galleryItems.length - 1
    setSelectedIndex(newIndex)
    setSelectedItem(galleryItems[newIndex])
  }

  const goToNext = () => {
    const newIndex = selectedIndex < galleryItems.length - 1 ? selectedIndex + 1 : 0
    setSelectedIndex(newIndex)
    setSelectedItem(galleryItems[newIndex])
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/
    const match = url.match(regExp)
    return match ? `https://player.vimeo.com/video/${match[1]}` : null
  }

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return getYouTubeEmbedUrl(url)
    } else if (url.includes('vimeo.com')) {
      return getVimeoEmbedUrl(url)
    }
    return url // URL directa
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando galería...</p>
        </div>
      </div>
    )
  }

  if (galleryItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay elementos en la galería en este momento.</p>
      </div>
    )
  }

  return (
    <>
      {/* Grid de galería con Masonry layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {galleryItems.map((item, index) => (
          <div
            key={item.id}
            className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
            onClick={() => openLightbox(item, index)}
          >
            {item.imagen ? (
              <div className="relative">
                <img
                  src={`http://137.184.35.178:8000${item.imagen}`}
                  alt={item.titulo}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center p-4">
                    <h3 className="font-semibold text-lg mb-1">{item.titulo}</h3>
                    {item.descripcion && (
                      <p className="text-sm text-gray-200">{item.descripcion}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : item.video_url ? (
              <div className="relative bg-gray-900 aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white opacity-75 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <h3 className="text-white font-semibold">{item.titulo}</h3>
                  {item.descripcion && (
                    <p className="text-gray-200 text-sm mt-1">{item.descripcion}</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          {/* Botón cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Botón anterior */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>

          {/* Botón siguiente */}
          <button
            onClick={goToNext}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
          >
            <ChevronRight className="w-12 h-12" />
          </button>

          {/* Contenido */}
          <div className="max-w-6xl w-full">
            {selectedItem.imagen ? (
              <div className="relative">
                <img
                  src={`http://137.184.35.178:8000${selectedItem.imagen}`}
                  alt={selectedItem.titulo}
                  className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <h3 className="text-white text-2xl font-bold mb-2">{selectedItem.titulo}</h3>
                  {selectedItem.descripcion && (
                    <p className="text-gray-200">{selectedItem.descripcion}</p>
                  )}
                </div>
              </div>
            ) : selectedItem.video_url ? (
              <div className="relative">
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(selectedItem.video_url) || undefined}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="bg-black bg-opacity-75 p-6 mt-4 rounded">
                  <h3 className="text-white text-2xl font-bold mb-2">{selectedItem.titulo}</h3>
                  {selectedItem.descripcion && (
                    <p className="text-gray-200">{selectedItem.descripcion}</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Contador */}
            <div className="text-center mt-4 text-white">
              <span className="text-sm">
                {selectedIndex + 1} / {galleryItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



