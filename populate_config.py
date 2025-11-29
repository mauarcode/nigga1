import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import WebsiteContent, PageSection, SystemSettings

# Crear contenido del sitio web
website_contents = [
    {
        'tipo_contenido': 'nombre_barberia',
        'contenido': 'Barbería BarberRock',
        'activo': True
    },
    {
        'tipo_contenido': 'slogan',
        'contenido': 'Estilo y Tradición desde 1990',
        'activo': True
    },
    {
        'tipo_contenido': 'descripcion_general',
        'contenido': 'Somos una barbería moderna con tradición, ofreciendo los mejores servicios de corte, afeitado y cuidado personal para el hombre moderno.',
        'activo': True
    },
    {
        'tipo_contenido': 'inicio_titulo',
        'contenido': 'Bienvenido a Barbería BarberRock',
        'activo': True
    },
    {
        'tipo_contenido': 'inicio_descripcion',
        'contenido': 'Donde cada visita es una experiencia única. Nuestros barberos expertos te brindarán el mejor servicio con las técnicas más modernas.',
        'activo': True
    },
    {
        'tipo_contenido': 'establecimiento_descripcion',
        'contenido': 'Ubicados en el corazón de la ciudad, ofrecemos un ambiente acogedor y profesional.',
        'activo': True
    },
    {
        'tipo_contenido': 'contacto_telefono',
        'contenido': '+52 55 1234 5678',
        'activo': True
    },
    {
        'tipo_contenido': 'contacto_email',
        'contenido': 'contacto@barberiaelite.com',
        'activo': True
    },
    {
        'tipo_contenido': 'contacto_direccion',
        'contenido': 'Av. Principal 123, Col. Centro, Ciudad de México',
        'activo': True
    },
    {
        'tipo_contenido': 'horarios_laborales',
        'contenido': 'Lunes a Viernes: 9:00 AM - 8:00 PM\nSábados: 9:00 AM - 6:00 PM\nDomingos: 10:00 AM - 4:00 PM',
        'activo': True
    },
]

print("Creando contenido del sitio web...")
for content_data in website_contents:
    WebsiteContent.objects.get_or_create(
        tipo_contenido=content_data['tipo_contenido'],
        defaults={
            'contenido': content_data['contenido'],
            'activo': content_data['activo']
        }
    )
print(f"✓ {len(website_contents)} elementos de contenido creados")

# Crear secciones de página
page_sections = [
    {
        'nombre': 'Hero Principal',
        'tipo_seccion': 'hero',
        'titulo': 'Barbería BarberRock',
        'subtitulo': 'Donde el estilo se encuentra con la tradición',
        'contenido': 'Más de 30 años de experiencia brindando los mejores servicios de barbería',
        'boton_texto': 'Agendar Cita',
        'boton_url': '/cita',
        'color_fondo': '#1F2937',
        'color_texto': '#FFFFFF',
        'orden': 1,
        'activo': True
    },
    {
        'nombre': 'Acerca de Nosotros',
        'tipo_seccion': 'about',
        'titulo': '¿Quiénes Somos?',
        'subtitulo': 'Tradición y calidad desde 1990',
        'contenido': 'Somos una barbería familiar con más de 30 años de experiencia. Nuestro compromiso es ofrecer servicios de la más alta calidad con atención personalizada.',
        'color_fondo': '#FFFFFF',
        'color_texto': '#000000',
        'orden': 2,
        'activo': True
    },
    {
        'nombre': 'Nuestros Servicios',
        'tipo_seccion': 'services',
        'titulo': 'Servicios Premium',
        'subtitulo': 'Lo mejor para ti',
        'contenido': 'Ofrecemos una amplia gama de servicios para el cuidado personal masculino',
        'color_fondo': '#F9FAFB',
        'color_texto': '#000000',
        'orden': 3,
        'activo': True
    },
    {
        'nombre': 'Galería de Trabajos',
        'tipo_seccion': 'gallery',
        'titulo': 'Nuestros Trabajos',
        'subtitulo': 'Resultados que hablan por sí mismos',
        'contenido': 'Mira algunos de nuestros mejores trabajos',
        'color_fondo': '#FFFFFF',
        'color_texto': '#000000',
        'orden': 4,
        'activo': True
    },
    {
        'nombre': 'Testimonios',
        'tipo_seccion': 'testimonials',
        'titulo': 'Lo Que Dicen Nuestros Clientes',
        'subtitulo': 'Opiniones reales de clientes satisfechos',
        'contenido': '',
        'color_fondo': '#F9FAFB',
        'color_texto': '#000000',
        'orden': 5,
        'activo': True
    },
    {
        'nombre': 'Contacto',
        'tipo_seccion': 'contact',
        'titulo': 'Visítanos',
        'subtitulo': 'Estamos para servirte',
        'contenido': 'Agenda tu cita o visítanos sin cita previa',
        'boton_texto': 'Contactar',
        'boton_url': '/contacto',
        'color_fondo': '#1F2937',
        'color_texto': '#FFFFFF',
        'orden': 6,
        'activo': True
    },
]

print("\nCreando secciones de página...")
for section_data in page_sections:
    PageSection.objects.get_or_create(
        nombre=section_data['nombre'],
        defaults=section_data
    )
print(f"✓ {len(page_sections)} secciones creadas")

# Crear configuración del sistema
system_settings = [
    {
        'tipo_configuracion': 'general',
        'clave': 'sitio_nombre',
        'valor': 'Barbería BarberRock',
        'descripcion': 'Nombre del sitio web'
    },
    {
        'tipo_configuracion': 'general',
        'clave': 'sitio_descripcion',
        'valor': 'La mejor barbería de la ciudad con más de 30 años de experiencia',
        'descripcion': 'Descripción general del sitio'
    },
    {
        'tipo_configuracion': 'appearance',
        'clave': 'color_primario',
        'valor': '#8B4513',
        'descripcion': 'Color primario del sitio (HEX)'
    },
    {
        'tipo_configuracion': 'appearance',
        'clave': 'color_secundario',
        'valor': '#D2691E',
        'descripcion': 'Color secundario del sitio (HEX)'
    },
    {
        'tipo_configuracion': 'business',
        'clave': 'horario_apertura',
        'valor': '09:00',
        'descripcion': 'Hora de apertura del negocio'
    },
    {
        'tipo_configuracion': 'business',
        'clave': 'horario_cierre',
        'valor': '20:00',
        'descripcion': 'Hora de cierre del negocio'
    },
    {
        'tipo_configuracion': 'business',
        'clave': 'duracion_cita_default',
        'valor': '45',
        'descripcion': 'Duración predeterminada de una cita (minutos)'
    },
    {
        'tipo_configuracion': 'social_media',
        'clave': 'instagram_url',
        'valor': 'https://instagram.com/barberiaelite',
        'descripcion': 'URL de Instagram'
    },
    {
        'tipo_configuracion': 'social_media',
        'clave': 'facebook_url',
        'valor': 'https://facebook.com/barberiaelite',
        'descripcion': 'URL de Facebook'
    },
    {
        'tipo_configuracion': 'social_media',
        'clave': 'whatsapp_number',
        'valor': '+525512345678',
        'descripcion': 'Número de WhatsApp'
    },
    {
        'tipo_configuracion': 'notifications',
        'clave': 'email_notificaciones',
        'valor': 'notificaciones@barberiaelite.com',
        'descripcion': 'Email para recibir notificaciones'
    },
    {
        'tipo_configuracion': 'booking',
        'clave': 'max_citas_dia',
        'valor': '20',
        'descripcion': 'Máximo de citas por día'
    },
    {
        'tipo_configuracion': 'booking',
        'clave': 'cancelacion_horas_minimas',
        'valor': '24',
        'descripcion': 'Horas mínimas para cancelar una cita'
    },
]

print("\nCreando configuración del sistema...")
for setting_data in system_settings:
    SystemSettings.objects.get_or_create(
        clave=setting_data['clave'],
        defaults=setting_data
    )
print(f"✓ {len(system_settings)} configuraciones creadas")

print("\n✅ ¡Datos de configuración creados exitosamente!")
print("\nPuedes acceder al panel de administración en:")
print("http://localhost:3001/admin")
print("Pestaña: Configuración")


