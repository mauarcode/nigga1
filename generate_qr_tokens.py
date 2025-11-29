"""
Script para generar códigos QR para barberos existentes que no tengan uno
Ejecutar después de aplicar la migración 0013
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barberia_backend.settings')
django.setup()

from usuarios.models import BarberProfile
import secrets

def generate_qr_tokens():
    """Generar tokens QR para barberos que no tengan uno"""
    barberos_sin_qr = BarberProfile.objects.filter(qr_token__isnull=True) | BarberProfile.objects.filter(qr_token='')
    
    count = 0
    for barbero in barberos_sin_qr:
        barbero.qr_token = secrets.token_urlsafe(32)
        barbero.save()
        count += 1
        print(f"QR token generado para barbero: {barbero.user.username} - Token: {barbero.qr_token}")
    
    print(f"\nTotal de tokens QR generados: {count}")
    
    # Mostrar todos los barberos con sus tokens
    print("\n=== Barberos y sus tokens QR ===")
    for barbero in BarberProfile.objects.all():
        nombre = f"{barbero.user.first_name} {barbero.user.last_name}".strip() or barbero.user.username
        print(f"{nombre}: {barbero.qr_token or 'SIN TOKEN'}")

if __name__ == '__main__':
    generate_qr_tokens()

