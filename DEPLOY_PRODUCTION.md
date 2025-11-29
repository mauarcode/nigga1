# Guía de Despliegue en Producción - Barberrock

Esta guía te ayudará a desplegar el proyecto Barberrock en un servidor Ubuntu usando Nginx como servidor web.

## Requisitos Previos

- Servidor Ubuntu 20.04 o superior (Digital Ocean Droplet recomendado: 2GB RAM mínimo)
- Acceso root o usuario con permisos sudo
- Dominio configurado apuntando a tu servidor
- Subdominio para la API (ej: api.tu-dominio.com)

## 0. Configurar el Proyecto para Producción (ANTES DE SUBIR)

**Importante:** Antes de subir el código al servidor, ejecuta el script de configuración en tu máquina local:

```bash
python configure_production.py --domain tu-dominio.com --api-domain api.tu-dominio.com
```

Este script actualizará automáticamente:
- Todas las URLs de `localhost:8000` → `https://api.tu-dominio.com`
- Todas las URLs de `localhost:3000` → `https://tu-dominio.com`
- Configuración de CORS en Django
- URLs de QR codes para barberos
- Archivos de entorno del frontend

Después de ejecutar el script, sube los cambios:
```bash
git add -A
git commit -m "Configurar para producción"
git push origin main
```

## 1. Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Instalar Python y Dependencias

```bash
sudo apt install python3 python3-pip python3-venv python3-dev -y
sudo apt install postgresql postgresql-contrib -y
sudo apt install nginx -y
sudo apt install git -y
sudo apt install build-essential libssl-dev libffi-dev -y
```

## 3. Instalar Node.js y npm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

## 4. Configurar PostgreSQL

```bash
sudo -u postgres psql
```

Dentro de PostgreSQL:

```sql
CREATE DATABASE barberrock_db;
CREATE USER barberrock_user WITH PASSWORD 'tu_password_seguro';
ALTER ROLE barberrock_user SET client_encoding TO 'utf8';
ALTER ROLE barberrock_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE barberrock_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE barberrock_db TO barberrock_user;
\q
```

## 5. Clonar el Repositorio

```bash
cd /var/www
sudo git clone https://tu-repositorio/barberrock.git
sudo chown -R $USER:$USER /var/www/barberrock
cd barberrock
```

## 6. Configurar Backend (Django)

### 6.1. Crear Entorno Virtual

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 6.2. Configurar Variables de Entorno

```bash
cp barberia_backend/settings.py barberia_backend/settings.py.backup
nano barberia_backend/settings.py
```

Modifica las siguientes configuraciones:

```python
DEBUG = False
ALLOWED_HOSTS = ['tu-dominio.com', 'www.tu-dominio.com', 'tu-ip']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'barberrock_db',
        'USER': 'barberrock_user',
        'PASSWORD': 'tu_password_seguro',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# CORS settings para producción
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com",
]

# Configuración de archivos estáticos y media
STATIC_ROOT = '/var/www/barberrock/staticfiles'
MEDIA_ROOT = '/var/www/barberrock/media'
```

### 6.3. Ejecutar Migraciones

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 6.4. Generar Tokens QR para Barberos

```bash
python generate_qr_tokens.py
```

## 7. Configurar Frontend (Next.js)

### 7.1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 7.2. Crear Archivo de Configuración

```bash
nano .env.production
```

Agrega:

```
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
NEXT_PUBLIC_FRONTEND_URL=https://tu-dominio.com
```

### 7.3. Construir la Aplicación

```bash
npm run build
```

## 8. Configurar Gunicorn (Servidor WSGI)

### 8.1. Instalar Gunicorn

```bash
cd /var/www/barberrock
source venv/bin/activate
pip install gunicorn
```

### 8.2. Crear Archivo de Servicio Systemd

```bash
sudo nano /etc/systemd/system/barberrock.service
```

Agrega:

```ini
[Unit]
Description=Barberrock Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/barberrock
Environment="PATH=/var/www/barberrock/venv/bin"
ExecStart=/var/www/barberrock/venv/bin/gunicorn --workers 3 --bind unix:/var/www/barberrock/barberrock.sock barberia_backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

### 8.3. Iniciar el Servicio

```bash
sudo systemctl daemon-reload
sudo systemctl start barberrock
sudo systemctl enable barberrock
sudo systemctl status barberrock
```

## 9. Configurar PM2 para Next.js

### 9.1. Instalar PM2

```bash
sudo npm install -g pm2
```

### 9.2. Crear Archivo de Configuración PM2

```bash
cd /var/www/barberrock/frontend
nano ecosystem.config.js
```

Agrega:

```javascript
module.exports = {
  apps: [{
    name: 'barberrock-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/barberrock/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 9.3. Iniciar con PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 10. Configurar Nginx

### 10.1. Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/barberrock
```

Agrega:

```nginx
# Backend API (Django)
upstream django {
    server unix:/var/www/barberrock/barberrock.sock fail_timeout=0;
}

server {
    listen 80;
    server_name api.tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/api.tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tu-dominio.com/privkey.pem;

    client_max_body_size 20M;

    # Archivos estáticos
    location /static/ {
        alias /var/www/barberrock/staticfiles/;
    }

    # Archivos media
    location /media/ {
        alias /var/www/barberrock/media/;
    }

    # API
    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend (Next.js)
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.2. Habilitar el Sitio

```bash
sudo ln -s /etc/nginx/sites-available/barberrock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 11. Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
sudo certbot --nginx -d api.tu-dominio.com
```

## 12. Configurar Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 13. Comandos Útiles

### Reiniciar Servicios

```bash
# Django
sudo systemctl restart barberrock

# Next.js
pm2 restart barberrock-frontend

# Nginx
sudo systemctl restart nginx
```

### Ver Logs

```bash
# Django
sudo journalctl -u barberrock -f

# Next.js
pm2 logs barberrock-frontend

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Actualizar Código

```bash
cd /var/www/barberrock
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart barberrock

cd frontend
npm install
npm run build
pm2 restart barberrock-frontend
```

## 14. Backup de Base de Datos

### Crear Script de Backup

```bash
sudo nano /usr/local/bin/backup-barberrock.sh
```

Agrega:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/barberrock"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U barberrock_user barberrock_db > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-barberrock.sh
```

### Configurar Cron para Backups Diarios

```bash
sudo crontab -e
```

Agrega:

```
0 2 * * * /usr/local/bin/backup-barberrock.sh
```

## 15. Monitoreo

### Instalar Monit (Opcional)

```bash
sudo apt install monit -y
```

Configurar monit para monitorear los servicios.

## Notas Importantes

1. **Seguridad**: Cambia todas las contraseñas por defecto
2. **Variables de Entorno**: No subas archivos `.env` al repositorio
3. **Backups**: Configura backups automáticos de la base de datos
4. **Logs**: Revisa regularmente los logs para detectar problemas
5. **Actualizaciones**: Mantén el sistema y las dependencias actualizadas

## Solución de Problemas

### Error 502 Bad Gateway
- Verifica que Gunicorn esté corriendo: `sudo systemctl status barberrock`
- Verifica los permisos del socket: `ls -l /var/www/barberrock/barberrock.sock`

### Error de CORS
- Verifica que `CORS_ALLOWED_ORIGINS` incluya tu dominio en producción

### Archivos estáticos no cargan
- Ejecuta: `python manage.py collectstatic --noinput`
- Verifica permisos: `sudo chown -R www-data:www-data /var/www/barberrock/staticfiles`

### Base de datos no conecta
- Verifica que PostgreSQL esté corriendo: `sudo systemctl status postgresql`
- Verifica credenciales en `settings.py`



