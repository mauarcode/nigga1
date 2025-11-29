#!/usr/bin/env python
"""
Script para verificar y corregir el estado del campo ubicacion_maps_url
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import WebsiteContent

def check_and_fix():
    """Verifica y corrige el estado del campo ubicacion_maps_url"""
    try:
        # Buscar el contenido
        content = WebsiteContent.objects.filter(tipo_contenido='ubicacion_maps_url').first()
        
        if not content:
            print("[ERROR] No se encontro el contenido ubicacion_maps_url")
            print("Creando nuevo registro...")
            content = WebsiteContent.objects.create(
                tipo_contenido='ubicacion_maps_url',
                contenido='',
                activo=True
            )
            print("[OK] Registro creado")
        else:
            print(f"[OK] Contenido encontrado:")
            print(f"   ID: {content.id}")
            print(f"   Tipo: {content.tipo_contenido}")
            print(f"   Contenido (primeros 100 chars): {content.contenido[:100] if content.contenido else '(vacio)'}")
            print(f"   Activo: {content.activo}")
            print(f"   Ultima actualizacion: {content.fecha_actualizacion}")
            
            # Verificar si está activo
            if not content.activo:
                print("\n[WARNING] El contenido esta INACTIVO. Activandolo...")
                content.activo = True
                content.save()
                print("[OK] Contenido activado correctamente")
            else:
                print("\n[OK] El contenido ya esta activo")
            
            # Verificar si tiene contenido
            if not content.contenido or not content.contenido.strip():
                print("\n[WARNING] El contenido esta vacio")
            else:
                print(f"\n[OK] El contenido tiene {len(content.contenido)} caracteres")
                if '<iframe' in content.contenido:
                    print("[OK] El contenido contiene un iframe")
                else:
                    print("[WARNING] El contenido NO contiene un iframe")
        
        # Verificar todos los contenidos activos
        print("\n" + "="*60)
        print("Verificando todos los contenidos activos:")
        active_contents = WebsiteContent.objects.filter(activo=True)
        print(f"Total de contenidos activos: {active_contents.count()}")
        
        maps_in_active = active_contents.filter(tipo_contenido='ubicacion_maps_url').exists()
        print(f"¿ubicacion_maps_url esta en los activos? {maps_in_active}")
        
        if not maps_in_active:
            print("\n[WARNING] ubicacion_maps_url NO esta en los contenidos activos")
            print("Forzando activacion...")
            content.activo = True
            content.save(update_fields=['activo'])
            print("[OK] Activacion forzada completada")
        
        # Verificar nuevamente
        content.refresh_from_db()
        print(f"\n[OK] Estado final - Activo: {content.activo}")
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_and_fix()

