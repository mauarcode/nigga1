from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0010_service_comision_barbero'),
    ]

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=150, verbose_name='Nombre del producto')),
                ('descripcion', models.TextField(blank=True, verbose_name='Descripción del producto')),
                ('precio', models.DecimalField(decimal_places=2, max_digits=9, verbose_name='Precio del producto')),
                ('imagen', models.ImageField(blank=True, null=True, upload_to='productos/', verbose_name='Imagen del producto')),
                ('stock', models.PositiveIntegerField(default=0, verbose_name='Existencias disponibles')),
                ('activo', models.BooleanField(default=True, verbose_name='¿Está activo?')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
            ],
            options={
                'verbose_name': 'Producto',
                'verbose_name_plural': 'Productos',
                'ordering': ['-fecha_creacion'],
            },
        ),
        migrations.CreateModel(
            name='AppointmentProduct',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.PositiveIntegerField(default=1, verbose_name='Cantidad')),
                ('appointment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appointment_productos', to='usuarios.appointment', verbose_name='Cita')),
                ('producto', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appointment_productos', to='usuarios.product', verbose_name='Producto')),
            ],
            options={
                'verbose_name': 'Producto de la cita',
                'verbose_name_plural': 'Productos de la cita',
                'unique_together': {('appointment', 'producto')},
            },
        ),
        migrations.AddField(
            model_name='appointment',
            name='productos',
            field=models.ManyToManyField(blank=True, related_name='appointments', through='usuarios.AppointmentProduct', to='usuarios.product', verbose_name='Productos seleccionados'),
        ),
    ]

