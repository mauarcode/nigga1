import sqlite3

# Conectar a la base de datos
db_path = 'db.sqlite3'
conn = sqlite3.connect(db_path)
cursor = cursor = conn.cursor()

# Ver la estructura actual
print("Estructura actual:")
cursor.execute("PRAGMA table_info(usuarios_websitecontent)")
columns = cursor.fetchall()
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

# Los campos que SI deberían estar según el modelo:
# id, tipo_contenido, contenido, imagen, activo, fecha_actualizacion

# Crear una nueva tabla temporal con la estructura correcta
print("\nCreando tabla temporal...")
cursor.execute("""
CREATE TABLE usuarios_websitecontent_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_contenido VARCHAR(50) NOT NULL UNIQUE,
    contenido TEXT NOT NULL,
    imagen VARCHAR(100) NULL,
    activo BOOL NOT NULL DEFAULT 1,
    fecha_actualizacion DATETIME NULL
)
""")

# Copiar los datos de la tabla antigua a la nueva
print("Copiando datos...")
cursor.execute("""
INSERT INTO usuarios_websitecontent_new (id, tipo_contenido, contenido, imagen, activo, fecha_actualizacion)
SELECT id, tipo_contenido, contenido, imagen, activo, fecha_actualizacion
FROM usuarios_websitecontent
""")

# Eliminar la tabla antigua
print("Eliminando tabla antigua...")
cursor.execute("DROP TABLE usuarios_websitecontent")

# Renombrar la nueva tabla
print("Renombrando tabla nueva...")
cursor.execute("ALTER TABLE usuarios_websitecontent_new RENAME TO usuarios_websitecontent")

conn.commit()
conn.close()

print("\nProceso completado exitosamente")
print("La tabla usuarios_websitecontent ahora tiene la estructura correcta")
