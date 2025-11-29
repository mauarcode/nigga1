from django.db import migrations, models
import uuid


def generate_token(apps, schema_editor):
    Appointment = apps.get_model('usuarios', 'Appointment')
    for appointment in Appointment.objects.all():
        if not appointment.survey_token:
            appointment.survey_token = uuid.uuid4().hex
            appointment.save(update_fields=['survey_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_appointment_contact_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='encuesta_completada',
            field=models.BooleanField(default=False, verbose_name='¿La encuesta de satisfacción fue completada?'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='survey_token',
            field=models.CharField(blank=True, default='', max_length=64, verbose_name='Token para encuesta de satisfacción'),
        ),
        migrations.RunPython(generate_token, migrations.RunPython.noop),
    ]

