# Barberrock - Sistema de Gestión para Barbería

Sistema completo de gestión de citas, servicios y clientes para barberías, desarrollado con Django (backend) y Next.js (frontend).

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación Local](#instalación-local)
- [Despliegue en Producción](#despliegue-en-producción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Uso del Sistema](#uso-del-sistema)
- [API Endpoints](#api-endpoints)
- [Comandos Útiles](#comandos-útiles)

## ✨ Características

### Para Clientes
- ✅ **Agendar citas** con barberos disponibles
- ✅ **Dashboard personal** con historial de citas
- ✅ **Sistema de fidelización** (5 cortes = 1 gratis)
- ✅ **Calificar servicios** mediante QR o desde el dashboard
- ✅ **Gestión de perfil** personal

### Para Barberos
- ✅ **Panel de control** con agenda y estadísticas
- ✅ **QR personal** para recibir reseñas de clientes
- ✅ **Gestión de disponibilidad** y horarios
- ✅ **Estadísticas de rendimiento**

### Para Administradores
- ✅ **Panel completo** de administración
- ✅ **Gestión de usuarios** (clientes, barberos, admins)
- ✅ **Gestión de servicios y productos**
- ✅ **Creación de paquetes** (combinación de servicios y/o productos)
- ✅ **Alertas de nuevas citas** con integración WhatsApp
- ✅ **Estadísticas generales** del negocio
- ✅ **Gestión de contenido** del sitio web

## 🛠️ Tecnologías

### Backend
- **Django 4.2.7** - Framework web
- **Django REST Framework** - API REST
- **Simple JWT** - Autenticación
- **PostgreSQL/SQLite** - Base de datos
- **django-cors-headers** - CORS

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

## 🚀 Instalación Local

### Prerrequisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL (opcional, SQLite por defecto)
- Git

### 1. Clonar Repositorio
```bash
git clone <url-repositorio>
cd Barberrock
```

### 2. Backend (Django)

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Generar tokens QR para barberos existentes
python generate_qr_tokens.py

# Iniciar servidor
python manage.py runserver
```

Backend disponible en: `http://localhost:8000`

### 3. Frontend (Next.js)

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Frontend disponible en: `http://localhost:3000`

### 4. Script de Inicio Rápido (Windows)

```bash
INICIAR_TODO.bat
```

Este script inicia automáticamente ambos servidores.

## 🌐 Despliegue en Producción

Para instrucciones detalladas de despliegue en Ubuntu con Nginx, consulta:
**[DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)**

### Resumen Rápido
1. Configurar servidor Ubuntu
2. Instalar PostgreSQL, Python, Node.js, Nginx
3. Configurar Django con Gunicorn
4. Configurar Next.js con PM2
5. Configurar Nginx como reverse proxy
6. Configurar SSL con Let's Encrypt

## 📁 Estructura del Proyecto

```
Barberrock/
├── barberia_backend/          # Configuración Django
├── usuarios/                   # App principal (modelos, vistas, serializers)
├── core/                      # App core
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Páginas
│   │   └── components/       # Componentes React
├── Media/                     # Archivos media (imágenes)
├── manage.py
├── requirements.txt
└── README.md
```

## 🎯 Uso del Sistema

### Flujo de Cliente

1. **Registro/Login**: Crear cuenta o iniciar sesión
2. **Agendar Cita**: Seleccionar servicio, barbero y horario
3. **Asistir a Cita**: El barbero marca la cita como completada
4. **Calificar Servicio**: 
   - Escanear QR del barbero, O
   - Desde el dashboard del cliente
5. **Programa de Fidelización**: Al completar 5 cortes, obtiene 1 gratis

### Flujo de Barbero

1. **Login**: Acceder con credenciales de barbero
2. **Ver Agenda**: Consultar citas del día/semana
3. **Completar Cita**: Marcar cita como finalizada
4. **Solicitar Reseña**: Pedir al cliente que escanee su QR personal
5. **Ver Estadísticas**: Rendimiento y calificaciones

### Flujo de Administrador

1. **Login**: Acceder al panel de administración
2. **Gestión de Usuarios**: Crear/editar barberos y clientes
3. **Gestión de Servicios**: Crear/editar servicios
4. **Gestión de Productos**: Crear/editar productos
5. **Crear Paquetes**: Combinar servicios y/o productos
6. **Ver Alertas**: Nuevas citas con botón WhatsApp
7. **Estadísticas**: Dashboard con métricas del negocio

## 🔌 API Endpoints Principales

### Autenticación
- `POST /api/login/` - Login (username/email)
- `POST /api/auth/login/` - Login JWT estándar
- `POST /api/auth/refresh/` - Refresh token

### Citas
- `GET /api/citas/` - Listar citas
- `POST /api/citas/agendar/` - Agendar cita
- `GET /api/citas/horarios-disponibles/` - Horarios disponibles
- `PATCH /api/citas/{id}/` - Actualizar cita

### Servicios y Productos
- `GET /api/servicios/` - Listar servicios
- `GET /api/productos/` - Listar productos
- `GET /api/paquetes/` - Listar paquetes
- `POST /api/paquetes/` - Crear paquete (admin)

### Encuestas/Reseñas
- `GET /api/encuestas/info/?token={token}` - Info de encuesta
- `POST /api/encuestas/enviar/` - Enviar encuesta
- `GET /api/qr/{qr_token}/` - Escanear QR
- `GET /api/qr/{qr_token}/encuesta/` - Encuesta pendiente por QR

### Admin
- `GET /api/admin/dashboard/` - Dashboard admin
- `GET /api/admin/alertas/` - Alertas de citas
- `POST /api/admin/alertas/{id}/enviar/` - Marcar alerta como enviada

## 🛠️ Comandos Útiles

### Backend
```bash
# Migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell interactivo
python manage.py shell

# Recolectar archivos estáticos
python manage.py collectstatic

# Generar tokens QR
python generate_qr_tokens.py
```

### Frontend
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Linting
npm run lint
```

## 🔐 Seguridad

- Autenticación JWT
- Validación de permisos por roles
- CORS configurado
- Protección CSRF
- Validación de datos en frontend y backend

## 📝 Notas Importantes

1. **Login Obligatorio**: Para agendar citas se requiere estar autenticado como cliente
2. **Reseñas Pendientes**: Los clientes deben completar reseñas pendientes antes de agendar nuevas citas
3. **QR Personal**: Cada barbero tiene su propio QR para recibir reseñas
4. **Corte Gratis**: Al completar 5 cortes, el cliente puede elegir un servicio gratuito
5. **Alertas**: Las alertas de citas solo se muestran para citas activas

## 🐛 Solución de Problemas

### CORS Errors
- Verificar que `CORS_ALLOWED_ORIGINS` incluya el origen del frontend
- Verificar que el middleware de CORS esté antes de CommonMiddleware

### Imágenes no cargan
- Verificar que la carpeta `Media/` exista
- Verificar `MEDIA_ROOT` y `MEDIA_URL` en settings.py
- En desarrollo, verificar que `urls.py` incluya `static(settings.MEDIA_URL, ...)`

### Base de datos
- Verificar que las migraciones estén aplicadas
- Verificar conexión a PostgreSQL si se usa en producción

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Desarrollado con ❤️ para Barberrock**
