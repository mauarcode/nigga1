import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import CustomUser, ClientProfile, BarberProfile, SystemSettings, PageSection
from django.utils import timezone
from datetime import time

print("=== POBLANDO DATOS COMPLETOS ===\n")

# 1. Crear usuarios de prueba
print("1. Creando usuarios de prueba...")
users_data = [
    {
        'username': 'cliente1',
        'email': 'cliente1@test.com',
        'password': 'test123',
        'first_name': 'Juan',
        'last_name': 'Pérez',
        'rol': 'cliente',
        'telefono': '5551234567'
    },
    {
        'username': 'barbero1',
        'email': 'barbero1@test.com',
        'password': 'test123',
        'first_name': 'Carlos',
        'last_name': 'Martínez',
        'rol': 'barbero',
        'telefono': '5557654321'
    },
    {
        'username': 'barbero2',
        'email': 'barbero2@test.com',
        'password': 'test123',
        'first_name': 'Roberto',
        'last_name': 'García',
        'rol': 'barbero',
        'telefono': '5559876543'
    }
]

for user_data in users_data:
    username = user_data['username']
    if not CustomUser.objects.filter(username=username).exists():
        password = user_data.pop('password')
        user = CustomUser.objects.create_user(**user_data)
        user.set_password(password)
        user.save()
        print(f"  + Usuario creado: {username} ({user.rol})")
    else:
        print(f"  - Usuario ya existe: {username}")

# 2. Configurar perfiles de barberos
print("\n2. Configurando perfiles de barberos...")
barberos = CustomUser.objects.filter(rol='barbero')
for barbero in barberos:
    if hasattr(barbero, 'barber_profile'):
        barber_profile = barbero.barber_profile
        barber_profile.especialidad = "Cortes modernos y diseño de barba" if "Carlos" in barbero.first_name else "Afeitado clásico y cortes ejecutivos"
        barber_profile.descripcion = f"Barbero profesional con más de 10 años de experiencia"
        barber_profile.horario_inicio = time(9, 0)
        barber_profile.horario_fin = time(20, 0)
        barber_profile.dias_laborales = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
        barber_profile.activo = True
        barber_profile.save()
        print(f"  + Perfil actualizado: {barbero.get_full_name()}")

# 3. Crear configuración del sistema
print("\n3. Creando configuración del sistema...")
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
        'tipo_configuracion': 'business',
        'clave': 'intervalo_citas',
        'valor': '15',
        'descripcion': 'Intervalo entre citas disponibles (minutos)'
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
    {
        'tipo_configuracion': 'booking',
        'clave': 'dias_adelanto_max',
        'valor': '30',
        'descripcion': 'Días máximos para agendar con anticipación'
    }
]

count = 0
for setting_data in system_settings:
    obj, created = SystemSettings.objects.get_or_create(
        clave=setting_data['clave'],
        defaults=setting_data
    )
    if created:
        count += 1
        print(f"  + {setting_data['clave']}")
    else:
        print(f"  - {setting_data['clave']} (ya existe)")

print(f"  Total: {count} configuraciones nuevas creadas")

# 4. Crear secciones de página
print("\n4. Creando secciones de página...")
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
        'contenido': 'Somos una barbería familiar con más de 30 años de experiencia. Nuestro compromiso es ofrecer servicios de la más alta calidad con atención personalizada. Cada miembro de nuestro equipo es un profesional certificado que domina las técnicas tradicionales y las tendencias más modernas.',
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
        'contenido': 'Ofrecemos una amplia gama de servicios para el cuidado personal masculino, desde cortes clásicos hasta los estilos más modernos.',
        'boton_texto': 'Ver Todos',
        'boton_url': '/servicios',
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
        'contenido': 'Mira algunos de nuestros mejores trabajos y descubre la calidad que ofrecemos.',
        'boton_texto': 'Ver Galería',
        'boton_url': '/galeria',
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
        'contenido': 'Miles de clientes confían en nosotros. Lee sus experiencias.',
        'color_fondo': '#F9FAFB',
        'color_texto': '#000000',
        'orden': 5,
        'activo': True
    },
    {
        'nombre': 'Contacto y Ubicación',
        'tipo_seccion': 'contact',
        'titulo': 'Visítanos',
        'subtitulo': 'Estamos para servirte',
        'contenido': 'Agenda tu cita o visítanos sin cita previa de Lunes a Sábado.',
        'boton_texto': 'Contactar',
        'boton_url': '/login',
        'color_fondo': '#1F2937',
        'color_texto': '#FFFFFF',
        'orden': 6,
        'activo': True
    }
]

count = 0
for section_data in page_sections:
    obj, created = PageSection.objects.get_or_create(
        nombre=section_data['nombre'],
        defaults=section_data
    )
    if created:
        count += 1
        print(f"  + {section_data['nombre']}")
    else:
        print(f"  - {section_data['nombre']} (ya existe)")

print(f"  Total: {count} secciones nuevas creadas")

# Resumen final
print("\n=== RESUMEN FINAL ===")
print(f"Usuarios totales: {CustomUser.objects.count()}")
print(f"  - Clientes: {CustomUser.objects.filter(rol='cliente').count()}")
print(f"  - Barberos: {CustomUser.objects.filter(rol='barbero').count()}")
print(f"  - Admins: {CustomUser.objects.filter(rol='admin').count()}")
print(f"Perfiles de barbero configurados: {BarberProfile.objects.filter(activo=True).count()}")
print(f"Configuraciones del sistema: {SystemSettings.objects.count()}")
print(f"Secciones de página: {PageSection.objects.count()}")

print("\n=== CREDENCIALES DE PRUEBA ===")
print("Admin:")
print("  Usuario: admin")
print("  Password: admin123")
print("\nCliente:")
print("  Usuario: cliente1")
print("  Password: test123")
print("\nBarbero:")
print("  Usuario: barbero1")
print("  Password: test123")

print("\n✅ Datos poblados exitosamente!")
print("\nAcceso:")
print("  Frontend: http://localhost:3001/")
print("  Admin: http://localhost:3001/admin")
print("  Backend: http://localhost:8000/admin/")


