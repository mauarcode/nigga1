# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0013_add_qr_token_and_alerts'),
    ]

    operations = [
        migrations.CreateModel(
            name='Package',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=150, verbose_name='Nombre del paquete')),
                ('descripcion', models.TextField(blank=True, verbose_name='Descripción del paquete')),
                ('precio', models.DecimalField(decimal_places=2, max_digits=9, verbose_name='Precio del paquete')),
                ('imagen', models.ImageField(blank=True, null=True, upload_to='paquetes/', verbose_name='Imagen del paquete')),
                ('activo', models.BooleanField(default=True, verbose_name='¿Está activo?')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('productos', models.ManyToManyField(blank=True, related_name='packages', to='usuarios.product', verbose_name='Productos incluidos')),
                ('servicios', models.ManyToManyField(blank=True, related_name='packages', to='usuarios.service', verbose_name='Servicios incluidos')),
            ],
            options={
                'verbose_name': 'Paquete',
                'verbose_name_plural': 'Paquetes',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]



