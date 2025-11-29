# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0012_alter_testimonial_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='barberprofile',
            name='qr_token',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True, verbose_name='Token único para código QR'),
        ),
        migrations.CreateModel(
            name='AppointmentAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mensaje_enviado', models.BooleanField(default=False, verbose_name='¿Se envió el mensaje de WhatsApp?')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('fecha_envio', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de envío del mensaje')),
                ('appointment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='alert', to='usuarios.appointment', verbose_name='Cita relacionada')),
            ],
            options={
                'verbose_name': 'Alerta de cita',
                'verbose_name_plural': 'Alertas de citas',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]

