from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_appointment_contact_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='encuesta_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='Token para encuesta de satisfacción'),
        ),
        migrations.AddField(
            model_name='survey',
            name='limpieza_calificacion',
            field=models.PositiveIntegerField(choices=[(1, '1 - Muy malo'), (2, '2 - Malo'), (3, '3 - Regular'), (4, '4 - Bueno'), (5, '5 - Excelente')], default=5, verbose_name='Calificación de limpieza'),
        ),
        migrations.AddField(
            model_name='survey',
            name='puntualidad_calificacion',
            field=models.PositiveIntegerField(choices=[(1, '1 - Muy malo'), (2, '2 - Malo'), (3, '3 - Regular'), (4, '4 - Bueno'), (5, '5 - Excelente')], default=5, verbose_name='Calificación de puntualidad'),
        ),
        migrations.AddField(
            model_name='survey',
            name='recomendaria',
            field=models.BooleanField(default=True, verbose_name='¿Recomendaría la barbería?'),
        ),
        migrations.AddField(
            model_name='survey',
            name='trato_calificacion',
            field=models.PositiveIntegerField(choices=[(1, '1 - Muy malo'), (2, '2 - Malo'), (3, '3 - Regular'), (4, '4 - Bueno'), (5, '5 - Excelente')], default=5, verbose_name='Calificación del trato recibido'),
        ),
        migrations.AddField(
            model_name='testimonial',
            name='appointment',
            field=models.OneToOneField(blank=True, db_column='appointment_id', null=True, on_delete=models.SET_NULL, related_name='testimonial', to='usuarios.appointment', verbose_name='Cita relacionada'),
        ),
    ]

