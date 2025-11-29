from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0009_merge_20251101_1232'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='comision_barbero',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8, verbose_name='Comisión para barbero'),
        ),
    ]

