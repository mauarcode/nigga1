"""
Script para verificar qué campos de WebsiteContent están configurados
y cuáles faltan para que la página web funcione correctamente.
"""

import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import WebsiteContent

# Campos críticos (obligatorios)
CAMPOS_CRITICOS = {
    'logo_barberia': {
        'tipo': 'IMAGEN',
        'descripcion': 'Logo principal de la barbería',
        'ubicacion': 'Barra de navegación'
    },
    'inicio_hero_image': {
        'tipo': 'IMAGEN',
        'descripcion': 'FOTO DE FONDO DEL HERO (alta calidad)',
        'ubicacion': 'Sección Hero principal',
        'nota': 'DEBE ser foto de alta calidad de la barbería o barbero en acción'
    },
    'inicio_titulo': {
        'tipo': 'TEXTO',
        'descripcion': 'Título principal del Hero',
        'ubicacion': 'Sección Hero'
    },
    'inicio_descripcion': {
        'tipo': 'TEXTO',
        'descripcion': 'Descripción del Hero',
        'ubicacion': 'Sección Hero'
    },
    'ubicacion_direccion': {
        'tipo': 'TEXTO',
        'descripcion': 'Dirección física completa',
        'ubicacion': 'Sección de ubicación'
    },
    'ubicacion_maps_url': {
        'tipo': 'HTML/URL',
        'descripcion': 'URL embebida de Google Maps (iframe)',
        'ubicacion': 'Mapa interactivo'
    },
    'contacto_telefono': {
        'tipo': 'TEXTO',
        'descripcion': 'Teléfono de contacto',
        'ubicacion': 'Sección de contacto y footer'
    },
    'contacto_email': {
        'tipo': 'TEXTO',
        'descripcion': 'Email de contacto',
        'ubicacion': 'Sección de contacto y footer'
    }
}

# Campos recomendados
CAMPOS_RECOMENDADOS = {
    'establecimiento_imagen': {
        'tipo': 'IMAGEN',
        'descripcion': 'Foto del establecimiento',
        'ubicacion': 'Sección de establecimiento'
    },
    'establecimiento_titulo': {
        'tipo': 'TEXTO',
        'descripcion': 'Título de la sección de establecimiento',
        'ubicacion': 'Sección de establecimiento'
    },
    'establecimiento_descripcion': {
        'tipo': 'TEXTO',
        'descripcion': 'Descripción del establecimiento',
        'ubicacion': 'Sección de establecimiento'
    },
    'servicios_descripcion': {
        'tipo': 'TEXTO',
        'descripcion': 'Descripción de servicios',
        'ubicacion': 'Sección de servicios'
    },
    'galeria_descripcion': {
        'tipo': 'TEXTO',
        'descripcion': 'Descripción de la galería',
        'ubicacion': 'Sección de galería'
    },
    'social_facebook': {
        'tipo': 'URL',
        'descripcion': 'URL de Facebook',
        'ubicacion': 'Footer'
    },
    'social_instagram': {
        'tipo': 'URL',
        'descripcion': 'URL de Instagram',
        'ubicacion': 'Footer'
    },
    'branding_color_primario': {
        'tipo': 'COLOR',
        'descripcion': 'Color primario de la marca',
        'ubicacion': 'Toda la página (botones, enlaces)'
    },
    'branding_color_secundario': {
        'tipo': 'COLOR',
        'descripcion': 'Color secundario de la marca',
        'ubicacion': 'Fondos secundarios'
    }
}

def verificar_campo(nombre_campo, info_campo):
    """Verifica si un campo está configurado correctamente"""
    try:
        contenido = WebsiteContent.objects.filter(tipo_contenido=nombre_campo).first()
        
        if not contenido:
            return {
                'existe': False,
                'activo': False,
                'tiene_valor': False,
                'tiene_imagen': False,
                'contenido': None
            }
        
        tiene_valor = bool(contenido.contenido and contenido.contenido.strip())
        tiene_imagen = bool(contenido.imagen)
        
        # Para campos de imagen, verificar que tenga imagen
        if info_campo['tipo'] == 'IMAGEN':
            tiene_valor = tiene_imagen
        
        return {
            'existe': True,
            'activo': contenido.activo,
            'tiene_valor': tiene_valor,
            'tiene_imagen': tiene_imagen,
            'contenido': contenido.contenido[:100] if contenido.contenido else None,
            'imagen': contenido.imagen.url if contenido.imagen else None
        }
    except Exception as e:
        return {
            'existe': False,
            'activo': False,
            'tiene_valor': False,
            'tiene_imagen': False,
            'error': str(e)
        }

def main():
    print("=" * 80)
    print("VERIFICACION DE CONFIGURACION DE PAGINA WEB - BARBERIA BARBERROCK")
    print("=" * 80)
    print()
    
    # Verificar campos críticos
    print("CAMPOS CRITICOS (OBLIGATORIOS)")
    print("-" * 80)
    criticos_faltantes = []
    criticos_incompletos = []
    
    for campo, info in CAMPOS_CRITICOS.items():
        estado = verificar_campo(campo, info)
        icono = "[OK]" if (estado['existe'] and estado['activo'] and estado['tiene_valor']) else "[FALTA]"
        
        print(f"{icono} {campo}")
        print(f"   Tipo: {info['tipo']}")
        print(f"   Descripcion: {info['descripcion']}")
        print(f"   Ubicacion: {info['ubicacion']}")
        
        if not estado['existe']:
            print(f"   Estado: NO EXISTE - Debe crearse")
            criticos_faltantes.append(campo)
        elif not estado['activo']:
            print(f"   Estado: INACTIVO - Debe activarse")
            criticos_incompletos.append(campo)
        elif not estado['tiene_valor']:
            print(f"   Estado: SIN VALOR - Debe configurarse")
            criticos_incompletos.append(campo)
        else:
            print(f"   Estado: CONFIGURADO CORRECTAMENTE")
            if estado['tiene_imagen']:
                print(f"   Imagen: {estado['imagen']}")
            elif estado['contenido']:
                print(f"   Contenido: {estado['contenido']}...")
        
        if 'nota' in info:
            print(f"   [NOTA] {info['nota']}")
        print()
    
    # Verificar campos recomendados
    print("\n" + "=" * 80)
    print("CAMPOS RECOMENDADOS")
    print("-" * 80)
    recomendados_faltantes = []
    recomendados_incompletos = []
    
    for campo, info in CAMPOS_RECOMENDADOS.items():
        estado = verificar_campo(campo, info)
        icono = "[OK]" if (estado['existe'] and estado['activo'] and estado['tiene_valor']) else "[FALTA]"
        
        print(f"{icono} {campo}")
        print(f"   Tipo: {info['tipo']}")
        print(f"   Descripcion: {info['descripcion']}")
        
        if not estado['existe']:
            print(f"   Estado: NO EXISTE")
            recomendados_faltantes.append(campo)
        elif not estado['activo']:
            print(f"   Estado: INACTIVO")
            recomendados_incompletos.append(campo)
        elif not estado['tiene_valor']:
            print(f"   Estado: SIN VALOR")
            recomendados_incompletos.append(campo)
        else:
            print(f"   Estado: CONFIGURADO")
        print()
    
    # Resumen
    print("\n" + "=" * 80)
    print("RESUMEN")
    print("=" * 80)
    
    total_criticos = len(CAMPOS_CRITICOS)
    criticos_ok = total_criticos - len(criticos_faltantes) - len(criticos_incompletos)
    
    total_recomendados = len(CAMPOS_RECOMENDADOS)
    recomendados_ok = total_recomendados - len(recomendados_faltantes) - len(recomendados_incompletos)
    
    print(f"\nCampos Criticos:")
    print(f"  [OK] Configurados: {criticos_ok}/{total_criticos}")
    print(f"  [FALTA] Faltantes: {len(criticos_faltantes)}")
    print(f"  [INCOMPLETO] Incompletos: {len(criticos_incompletos)}")
    
    if criticos_faltantes:
        print(f"\n  Campos que deben crearse:")
        for campo in criticos_faltantes:
            print(f"    - {campo}")
    
    if criticos_incompletos:
        print(f"\n  Campos que deben completarse:")
        for campo in criticos_incompletos:
            print(f"    - {campo}")
    
    print(f"\nCampos Recomendados:")
    print(f"  [OK] Configurados: {recomendados_ok}/{total_recomendados}")
    print(f"  [FALTA] Faltantes: {len(recomendados_faltantes)}")
    print(f"  [INCOMPLETO] Incompletos: {len(recomendados_incompletos)}")
    
    # Verificar imágenes específicas
    print("\n" + "=" * 80)
    print("VERIFICACION DE IMAGENES")
    print("=" * 80)
    
    imagenes_criticas = ['logo_barberia', 'inicio_hero_image', 'establecimiento_imagen']
    for campo in imagenes_criticas:
        estado = verificar_campo(campo, {'tipo': 'IMAGEN'})
        if campo == 'inicio_hero_image':
            print(f"\n[CRITICO] {campo} - FOTO DE FONDO DEL HERO")
            print("   Esta imagen es CRITICA para la primera impresion")
            print("   Debe ser una foto de ALTA CALIDAD de la barberia o barbero en accion")
            print("   Resolucion recomendada: 1920x1080px (Full HD) o superior")
        
        if estado['existe'] and estado['activo'] and estado['tiene_imagen']:
            print(f"   [OK] {campo}: Configurada correctamente")
            if estado['imagen']:
                print(f"      Ruta: {estado['imagen']}")
        else:
            print(f"   [FALTA] {campo}: NO configurada o inactiva")
    
    print("\n" + "=" * 80)
    print("VERIFICACION COMPLETA")
    print("=" * 80)
    print("\nPara mas detalles, consulta el archivo REQUISITOS_PAGINA_WEB.md")
    print("\nPara configurar los campos faltantes:")
    print("1. Inicia sesion en el panel de administracion")
    print("2. Ve a 'Configuracion' -> 'Contenido del Sitio Web'")
    print("3. Busca cada campo usando la barra de busqueda")
    print("4. Edita y activa cada campo necesario")

if __name__ == '__main__':
    main()

