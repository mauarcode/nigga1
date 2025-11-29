from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0006_add_video_support_gallery'),
    ]

    operations = [
        migrations.AlterField(
            model_name='appointment',
            name='cliente',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                related_name='appointments',
                to='usuarios.clientprofile',
                verbose_name='Cliente',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='email_cliente',
            field=models.EmailField(
                blank=True,
                max_length=254,
                null=True,
                verbose_name='Correo de contacto',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='es_cliente_registrado',
            field=models.BooleanField(
                default=True,
                verbose_name='¿El cliente tiene cuenta registrada?',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='nombre_cliente',
            field=models.CharField(
                blank=True,
                default='',
                max_length=150,
                verbose_name='Nombre del cliente (contacto)',
            ),
        ),
        migrations.AddField(
            model_name='appointment',
            name='telefono_cliente',
            field=models.CharField(
                blank=True,
                default='',
                max_length=30,
                verbose_name='Teléfono de contacto',
            ),
        ),
    ]

