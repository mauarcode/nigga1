"""
Script para corregir la tabla usuarios_testimonial
Agrega la columna 'nombre' que falta
"""

import os
import django
import sqlite3

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

def fix_testimonial_table():
    print("=" * 60)
    print("  CORRIGIENDO TABLA TESTIMONIAL")
    print("=" * 60)
    print()
    
    # Conectar a la base de datos
    db_path = 'db.sqlite3'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar si la columna 'nombre' existe
        cursor.execute("PRAGMA table_info(usuarios_testimonial)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print(f"Columnas actuales en usuarios_testimonial:")
        for col in column_names:
            print(f"  - {col}")
        print()
        
        if 'nombre' not in column_names:
            print("[INFO] La columna 'nombre' NO existe, agregandola...")
            
            # Agregar la columna nombre
            cursor.execute("""
                ALTER TABLE usuarios_testimonial 
                ADD COLUMN nombre VARCHAR(100) DEFAULT 'Cliente Anónimo'
            """)
            
            conn.commit()
            print("[OK] Columna 'nombre' agregada exitosamente")
        else:
            print("[OK] La columna 'nombre' ya existe")
        
        # Verificar columnas finales
        cursor.execute("PRAGMA table_info(usuarios_testimonial)")
        columns = cursor.fetchall()
        
        print()
        print("Columnas finales en usuarios_testimonial:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        print()
        print("=" * 60)
        print("  CORRECCION COMPLETADA")
        print("=" * 60)
        
    except Exception as e:
        print(f"[ERROR] {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    fix_testimonial_table()


