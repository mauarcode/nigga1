import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import WebsiteContent

def check_duplicates():
    """Verificar si hay registros duplicados o problemas con las características"""
    print("="*60)
    print("Verificando características en WebsiteContent")
    print("="*60)
    
    # Buscar todas las características
    caracteristicas = [
        'caracteristica_1_titulo',
        'caracteristica_1_descripcion',
        'caracteristica_2_titulo',
        'caracteristica_2_descripcion',
        'caracteristica_3_titulo',
        'caracteristica_3_descripcion',
        'caracteristica_4_titulo',
        'caracteristica_4_descripcion',
    ]
    
    for tipo in caracteristicas:
        items = WebsiteContent.objects.filter(tipo_contenido=tipo)
        count = items.count()
        print(f"\n{tipo}:")
        print(f"  Total registros: {count}")
        
        if count > 1:
            print(f"  [ERROR] Hay {count} registros duplicados!")
            for item in items:
                print(f"    - ID: {item.id}, Activo: {item.activo}, Contenido: {item.contenido[:80] if item.contenido else '(vacio)'}")
        elif count == 1:
            item = items.first()
            print(f"  ID: {item.id}")
            print(f"  Activo: {item.activo}")
            print(f"  Contenido: {item.contenido[:100] if item.contenido else '(vacio)'}")
        else:
            print(f"  [WARNING] No existe registro para este tipo")
    
    # Verificar registros activos
    print("\n" + "="*60)
    print("Verificando registros activos (para API pública)")
    print("="*60)
    
    activos = WebsiteContent.objects.filter(activo=True)
    print(f"Total registros activos: {activos.count()}")
    
    caracteristicas_activas = activos.filter(tipo_contenido__startswith='caracteristica_')
    print(f"Características activas: {caracteristicas_activas.count()}")
    
    for tipo in caracteristicas:
        items_activos = activos.filter(tipo_contenido=tipo)
        if items_activos.exists():
            item = items_activos.first()
            print(f"  {tipo}: ACTIVO - {item.contenido[:60] if item.contenido else '(vacio)'}")
        else:
            print(f"  {tipo}: INACTIVO o NO EXISTE")

if __name__ == '__main__':
    check_duplicates()



