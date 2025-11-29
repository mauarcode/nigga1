import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

print("Estructura actual de usuarios_galleryimage:")
cursor.execute("PRAGMA table_info(usuarios_galleryimage)")
columns = cursor.fetchall()
for col in columns:
    print(f"  - {col[1]} ({col[2]}) NOT NULL: {col[3]}")

# Los campos que deberían estar según el modelo actualizado:
# id, titulo, descripcion, imagen, video_url, orden, activo, fecha_creacion

print("\nRecreando tabla con estructura correcta...")

# Crear nueva tabla temporal
cursor.execute("""
CREATE TABLE usuarios_galleryimage_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    imagen VARCHAR(100) NULL,
    video_url VARCHAR(200) NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOL NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL
)
""")

# Intentar copiar datos existentes si la tabla tiene datos
try:
    cursor.execute("SELECT COUNT(*) FROM usuarios_galleryimage")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Copiando {count} registros existentes...")
        cursor.execute("""
        INSERT INTO usuarios_galleryimage_new (id, titulo, descripcion, imagen, orden, activo, fecha_creacion)
        SELECT id, titulo, descripcion, imagen, orden, activo, fecha_creacion
        FROM usuarios_galleryimage
        """)
except Exception as e:
    print(f"No se pudieron copiar datos: {e}")

# Eliminar tabla antigua
cursor.execute("DROP TABLE usuarios_galleryimage")

# Renombrar nueva tabla
cursor.execute("ALTER TABLE usuarios_galleryimage_new RENAME TO usuarios_galleryimage")

conn.commit()
conn.close()

print("\nTabla recreada exitosamente")
print("La tabla usuarios_galleryimage ahora tiene la estructura correcta")


