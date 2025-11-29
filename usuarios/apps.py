from django.apps import AppConfig

class UsuariosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'usuarios'

    def ready(self):
        # Importar señales aquí para evitar problemas de importación circular
        from django.db.models.signals import post_save
        from django.dispatch import receiver
        from django.contrib.auth import get_user_model

        User = get_user_model()

        @receiver(post_save, sender=User)
        def create_user_profile(sender, instance, created, **kwargs):
            """Crear perfil automáticamente cuando se crea un usuario"""
            if created:
                from .models import ClientProfile, BarberProfile
                if instance.rol == 'cliente':
                    ClientProfile.objects.create(user=instance)
                elif instance.rol == 'barbero':
                    BarberProfile.objects.create(user=instance)
