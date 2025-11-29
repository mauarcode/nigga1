import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import GalleryImage

# Crear elementos de galería de ejemplo
gallery_items = [
    {
        'titulo': 'Corte Degradado Moderno',
        'descripcion': 'Corte con degradado perfecto y acabado profesional',
        'video_url': '',
        'orden': 0,
        'activo': True
    },
    {
        'titulo': 'Diseño de Barba Ejecutivo',
        'descripcion': 'Barba perfectamente perfilada para el profesional moderno',
        'video_url': '',
        'orden': 1,
        'activo': True
    },
    {
        'titulo': 'Afeitado Clásico',
        'descripcion': 'Experiencia de afeitado tradicional con navaja',
        'video_url': '',
        'orden': 2,
        'activo': True
    },
    {
        'titulo': 'Corte Infantil',
        'descripcion': 'Ambiente cómodo para los más pequeños',
        'video_url': '',
        'orden': 3,
        'activo': True
    },
    {
        'titulo': 'Tutorial de Corte - YouTube',
        'descripcion': 'Mira cómo realizamos un corte profesional paso a paso',
        'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',  # Ejemplo
        'orden': 4,
        'activo': True
    },
    {
        'titulo': 'Nuestro Espacio',
        'descripcion': 'Un vistazo a nuestras instalaciones modernas y cómodas',
        'video_url': '',
        'orden': 5,
        'activo': True
    },
    {
        'titulo': 'Productos Premium',
        'descripcion': 'Utilizamos solo los mejores productos del mercado',
        'video_url': '',
        'orden': 6,
        'activo': True
    },
    {
        'titulo': 'Equipo Profesional',
        'descripcion': 'Nuestro equipo de barberos expertos',
        'video_url': '',
        'orden': 7,
        'activo': True
    },
]

print("Creando elementos de galeria...")
count = 0

for item_data in gallery_items:
    obj, created = GalleryImage.objects.get_or_create(
        titulo=item_data['titulo'],
        defaults=item_data
    )
    if created:
        count += 1
        print(f"  + {item_data['titulo']}")
    else:
        print(f"  - {item_data['titulo']} (ya existe)")

print(f"\nProceso completado: {count} nuevos elementos creados")
print(f"Total en galeria: {GalleryImage.objects.count()}")
print("\nPuedes gestionar la galeria en:")
print("  Frontend: http://localhost:3001/admin (pestana Galeria)")
print("  Backend: http://localhost:8000/admin/usuarios/galleryimage/")
print("\nPara agregar imagenes reales:")
print("  1. Ve al panel de admin")
print("  2. Haz clic en 'Editar' en un elemento")
print("  3. Sube una imagen o agrega una URL de video")
print("  4. Guarda los cambios")


