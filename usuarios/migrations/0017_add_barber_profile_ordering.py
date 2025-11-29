# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0016_add_survey_ordering'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='barberprofile',
            options={'ordering': ['user__first_name', 'user__last_name'], 'verbose_name': 'Perfil de barbero', 'verbose_name_plural': 'Perfiles de barberos'},
        ),
    ]

