# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0014_add_package_model'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='service',
            options={'ordering': ['nombre'], 'verbose_name': 'Servicio', 'verbose_name_plural': 'Servicios'},
        ),
    ]




