# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0017_add_barber_profile_ordering'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='paquete',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='usuarios.package', verbose_name='Paquete'),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='servicio',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='usuarios.service', verbose_name='Servicio'),
        ),
    ]

