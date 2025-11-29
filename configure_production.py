#!/usr/bin/env python3
"""
Script para configurar el proyecto para producción.
Actualiza todas las referencias de localhost a las URLs de producción.

Uso:
    python configure_production.py --domain tu-dominio.com --api-domain api.tu-dominio.com

O interactivamente:
    python configure_production.py
"""

import os
import re
import argparse
from pathlib import Path

def replace_in_file(filepath, replacements):
    """Reemplaza texto en un archivo."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"  Error en {filepath}: {e}")
        return False

def configure_frontend(frontend_url, api_url):
    """Configura el frontend con las URLs de producción."""
    frontend_dir = Path('frontend/src')
    
    replacements = [
        ('http://localhost:8000', api_url),
        ('http://localhost:3000', frontend_url),
    ]
    
    updated_files = []
    
    for ext in ['*.tsx', '*.ts', '*.js']:
        for filepath in frontend_dir.rglob(ext):
            if replace_in_file(filepath, replacements):
                updated_files.append(str(filepath))
    
    return updated_files

def configure_backend(frontend_url, api_url, domain):
    """Configura el backend con las URLs de producción."""
    settings_file = Path('barberia_backend/settings.py')
    
    if not settings_file.exists():
        print("No se encontró barberia_backend/settings.py")
        return []
    
    with open(settings_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Actualizar DEBUG
    content = re.sub(r'DEBUG\s*=\s*True', 'DEBUG = False', content)
    
    # Actualizar ALLOWED_HOSTS
    allowed_hosts = f"ALLOWED_HOSTS = ['{domain}', 'www.{domain}', '{api_url.replace('https://', '').replace('http://', '')}']"
    content = re.sub(r'ALLOWED_HOSTS\s*=\s*\[.*?\]', allowed_hosts, content)
    
    # Actualizar CORS
    cors_origins = f'''CORS_ALLOWED_ORIGINS = [
    "{frontend_url}",
    "https://www.{domain}",
]'''
    content = re.sub(
        r'CORS_ALLOWED_ORIGINS\s*=\s*\[[\s\S]*?\]',
        cors_origins,
        content
    )
    
    # Agregar FRONTEND_URL si no existe
    if 'FRONTEND_URL' not in content:
        content += f"\n\n# URL del frontend para generar enlaces (QR codes, etc.)\nFRONTEND_URL = '{frontend_url}'\n"
    else:
        content = re.sub(
            r"FRONTEND_URL\s*=\s*['\"].*?['\"]",
            f"FRONTEND_URL = '{frontend_url}'",
            content
        )
    
    with open(settings_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return ['barberia_backend/settings.py']

def create_env_files(frontend_url, api_url):
    """Crea los archivos .env para el frontend."""
    env_content = f"""# Configuración de producción
NEXT_PUBLIC_API_URL={api_url}
NEXT_PUBLIC_FRONTEND_URL={frontend_url}
"""
    
    env_production = Path('frontend/.env.production')
    with open(env_production, 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    return [str(env_production)]

def main():
    parser = argparse.ArgumentParser(description='Configurar el proyecto para producción')
    parser.add_argument('--domain', help='Dominio principal (ej: barberrock.com)')
    parser.add_argument('--api-domain', help='Dominio de la API (ej: api.barberrock.com)')
    parser.add_argument('--use-https', action='store_true', default=True, help='Usar HTTPS (por defecto: True)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Configuración de Barberrock para Producción")
    print("=" * 60)
    
    # Obtener dominio
    if args.domain:
        domain = args.domain
    else:
        domain = input("\nIngresa el dominio principal (ej: barberrock.com): ").strip()
    
    if not domain:
        print("Error: El dominio es requerido")
        return
    
    # Obtener dominio de API
    if args.api_domain:
        api_domain = args.api_domain
    else:
        default_api = f"api.{domain}"
        api_domain = input(f"Ingresa el dominio de la API [{default_api}]: ").strip() or default_api
    
    # Construir URLs
    protocol = 'https' if args.use_https else 'http'
    frontend_url = f"{protocol}://{domain}"
    api_url = f"{protocol}://{api_domain}"
    
    print(f"\nConfiguración:")
    print(f"  Frontend URL: {frontend_url}")
    print(f"  API URL: {api_url}")
    
    confirm = input("\n¿Continuar? (s/n): ").strip().lower()
    if confirm != 's':
        print("Cancelado.")
        return
    
    print("\nActualizando archivos...")
    
    # Configurar frontend
    print("\n1. Configurando Frontend...")
    frontend_files = configure_frontend(frontend_url, api_url)
    for f in frontend_files:
        print(f"   ✓ {f}")
    
    # Configurar backend
    print("\n2. Configurando Backend...")
    backend_files = configure_backend(frontend_url, api_url, domain)
    for f in backend_files:
        print(f"   ✓ {f}")
    
    # Crear archivos .env
    print("\n3. Creando archivos de entorno...")
    env_files = create_env_files(frontend_url, api_url)
    for f in env_files:
        print(f"   ✓ {f}")
    
    print("\n" + "=" * 60)
    print("¡Configuración completada!")
    print("=" * 60)
    print(f"""
Próximos pasos:

1. Revisa los cambios en los archivos actualizados
2. Sube el código al servidor:
   git add -A
   git commit -m "Configurar para producción"
   git push

3. En el servidor, ejecuta:
   cd /var/www/barberrock
   git pull
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py collectstatic --noinput
   python generate_qr_tokens.py
   sudo systemctl restart barberrock
   
   cd frontend
   npm install
   npm run build
   pm2 restart barberrock-frontend

4. Verifica que todo funcione correctamente:
   - {frontend_url}
   - {api_url}/api/
   - Los códigos QR de los barberos
""")

if __name__ == '__main__':
    main()

