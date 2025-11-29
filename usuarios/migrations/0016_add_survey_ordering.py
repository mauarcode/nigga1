# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0015_alter_service_options'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='survey',
            options={'ordering': ['-fecha_creacion'], 'verbose_name': 'Encuesta', 'verbose_name_plural': 'Encuestas'},
        ),
    ]




