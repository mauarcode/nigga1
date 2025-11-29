import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """Usuario personalizado que extiende el modelo User de Django"""
    ROLE_CHOICES = [
        ('cliente', 'Cliente'),
        ('barbero', 'Barbero'),
        ('admin', 'Administrador'),
    ]

    rol = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='cliente',
        verbose_name='Rol del usuario'
    )

    telefono = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        verbose_name='Teléfono'
    )

    fecha_nacimiento = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de nacimiento'
    )

    # Sobreescribir campos de AbstractUser para evitar conflictos
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_users',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_users',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    # Permitir autenticación por username o email
    USERNAME_FIELD = 'username'

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name or self.username


class ClientProfile(models.Model):
    """Perfil específico del cliente"""
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='client_profile'
    )

    # Sistema de fidelización
    cortes_realizados = models.PositiveIntegerField(
        default=0,
        verbose_name='Número de cortes realizados'
    )

    cortes_para_promocion = models.PositiveIntegerField(
        default=5,
        verbose_name='Cortes necesarios para promoción'
    )

    fecha_ultimo_corte = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha del último corte'
    )

    def __str__(self):
        return f"Perfil de cliente: {self.user.username}"

    @property
    def cortes_restantes_para_promocion(self):
        """Calcula cuántos cortes faltan para la promoción"""
        return max(0, self.cortes_para_promocion - self.cortes_realizados)

    @property
    def es_elegible_para_promocion(self):
        """Verifica si el cliente es elegible para promoción"""
        return self.cortes_realizados >= self.cortes_para_promocion

    class Meta:
        verbose_name = 'Perfil de cliente'
        verbose_name_plural = 'Perfiles de clientes'
        ordering = ['user__username']


class BarberProfile(models.Model):
    """Perfil específico del barbero"""
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='barber_profile'
    )

    especialidad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Especialidad'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción del barbero'
    )

    horario_inicio = models.TimeField(
        default='09:00',
        verbose_name='Hora de inicio del horario laboral'
    )

    horario_fin = models.TimeField(
        default='18:00',
        verbose_name='Hora de fin del horario laboral'
    )

    dias_laborales = models.JSONField(
        default=list,
        verbose_name='Días laborales (ej: ["lunes", "martes", "miercoles"])'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )
    
    qr_token = models.CharField(
        max_length=64,
        unique=True,
        blank=True,
        null=True,
        verbose_name='Token único para código QR'
    )

    def __str__(self):
        return f"Perfil de barbero: {self.user.username}"
    
    def save(self, *args, **kwargs):
        # Generar QR token único si no existe
        if not self.qr_token:
            import secrets
            self.qr_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Perfil de barbero'
        verbose_name_plural = 'Perfiles de barberos'
        ordering = ['user__first_name', 'user__last_name']


class Service(models.Model):
    """Modelo para servicios ofrecidos por la barbería"""
    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del servicio'
    )

    descripcion = models.TextField(
        verbose_name='Descripción del servicio'
    )

    precio = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name='Precio'
    )

    comision_barbero = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        verbose_name='Comisión para barbero'
    )

    duracion = models.PositiveIntegerField(
        help_text='Duración en minutos',
        verbose_name='Duración (minutos)'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )

    imagen = models.ImageField(
        upload_to='servicios/',
        blank=True,
        null=True,
        verbose_name='Imagen del servicio'
    )

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'
        ordering = ['nombre']


class Product(models.Model):
    """Modelo para productos comercializados"""
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre del producto'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción del producto'
    )

    precio = models.DecimalField(
        max_digits=9,
        decimal_places=2,
        verbose_name='Precio del producto'
    )

    imagen = models.ImageField(
        upload_to='productos/',
        blank=True,
        null=True,
        verbose_name='Imagen del producto'
    )

    stock = models.PositiveIntegerField(
        default=0,
        verbose_name='Existencias disponibles'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-fecha_creacion']


class Package(models.Model):
    """Modelo para paquetes que combinan servicios y/o productos"""
    nombre = models.CharField(
        max_length=150,
        verbose_name='Nombre del paquete'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción del paquete'
    )

    precio = models.DecimalField(
        max_digits=9,
        decimal_places=2,
        verbose_name='Precio del paquete'
    )

    servicios = models.ManyToManyField(
        Service,
        related_name='packages',
        blank=True,
        verbose_name='Servicios incluidos'
    )

    productos = models.ManyToManyField(
        Product,
        related_name='packages',
        blank=True,
        verbose_name='Productos incluidos'
    )

    imagen = models.ImageField(
        upload_to='paquetes/',
        blank=True,
        null=True,
        verbose_name='Imagen del paquete'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Paquete'
        verbose_name_plural = 'Paquetes'
        ordering = ['-fecha_creacion']


class Appointment(models.Model):
    """Modelo para citas"""
    STATUS_CHOICES = [
        ('agendada', 'Agendada'),
        ('confirmada', 'Confirmada'),
        ('en_progreso', 'En progreso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
        ('no_show', 'No se presentó'),
    ]

    cliente = models.ForeignKey(
        ClientProfile,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Cliente',
        null=True,
        blank=True
    )

    barbero = models.ForeignKey(
        BarberProfile,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Barbero'
    )

    servicio = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Servicio',
        null=True,
        blank=True
    )

    paquete = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Paquete',
        null=True,
        blank=True
    )

    fecha_hora = models.DateTimeField(
        verbose_name='Fecha y hora de la cita'
    )

    estado = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='agendada',
        verbose_name='Estado de la cita'
    )

    notas = models.TextField(
        blank=True,
        verbose_name='Notas adicionales'
    )

    nombre_cliente = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='Nombre del cliente (contacto)'
    )

    telefono_cliente = models.CharField(
        max_length=30,
        blank=True,
        default='',
        verbose_name='Teléfono de contacto'
    )

    email_cliente = models.EmailField(
        blank=True,
        null=True,
        verbose_name='Correo de contacto'
    )

    es_cliente_registrado = models.BooleanField(
        default=True,
        verbose_name='¿El cliente tiene cuenta registrada?'
    )

    survey_token = models.CharField(
        max_length=64,
        blank=True,
        default='',
        verbose_name='Token para encuesta de satisfacción'
    )

    encuesta_completada = models.BooleanField(
        default=False,
        verbose_name='¿La encuesta de satisfacción fue completada?'
    )

    encuesta_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name='Token para encuesta de satisfacción'
    )

    productos = models.ManyToManyField(
        Product,
        through='AppointmentProduct',
        related_name='appointments',
        blank=True,
        verbose_name='Productos seleccionados'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    def __str__(self):
        if self.cliente and self.cliente.user:
            cliente_nombre = self.cliente.user.get_full_name() or self.cliente.user.username
        else:
            cliente_nombre = self.nombre_cliente or 'Cliente sin registrar'

        return f"Cita de {cliente_nombre} con {self.barbero.user.username} - {self.fecha_hora}"

    def save(self, *args, **kwargs):
        if not self.survey_token:
            import uuid
            self.survey_token = uuid.uuid4().hex
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        ordering = ['fecha_hora']


class AppointmentProduct(models.Model):
    """Relación entre citas y productos seleccionados"""
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='appointment_productos',
        verbose_name='Cita'
    )
    producto = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='appointment_productos',
        verbose_name='Producto'
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad'
    )

    class Meta:
        verbose_name = 'Producto de la cita'
        verbose_name_plural = 'Productos de la cita'
        unique_together = ('appointment', 'producto')

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad} - Cita {self.appointment_id}"


class Survey(models.Model):
    """Modelo para encuestas de satisfacción"""
    RATING_CHOICES = [
        (1, '1 - Muy malo'),
        (2, '2 - Malo'),
        (3, '3 - Regular'),
        (4, '4 - Bueno'),
        (5, '5 - Excelente'),
    ]

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='survey',
        verbose_name='Cita relacionada'
    )

    calificacion = models.PositiveIntegerField(
        choices=RATING_CHOICES,
        verbose_name='Calificación general'
    )

    limpieza_calificacion = models.PositiveIntegerField(
        choices=RATING_CHOICES,
        verbose_name='Calificación de limpieza',
        default=5
    )

    puntualidad_calificacion = models.PositiveIntegerField(
        choices=RATING_CHOICES,
        verbose_name='Calificación de puntualidad',
        default=5
    )

    trato_calificacion = models.PositiveIntegerField(
        choices=RATING_CHOICES,
        verbose_name='Calificación del trato recibido',
        default=5
    )

    recomendaria = models.BooleanField(
        default=True,
        verbose_name='¿Recomendaría la barbería?'
    )

    comentarios = models.TextField(
        blank=True,
        verbose_name='Comentarios adicionales'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    def __str__(self):
        if self.appointment and self.appointment.cliente and self.appointment.cliente.user:
            cliente_nombre = self.appointment.cliente.user.get_full_name() or self.appointment.cliente.user.username
        else:
            cliente_nombre = self.appointment.nombre_cliente or 'Cliente'
        return f"Encuesta de {cliente_nombre} - {self.calificacion}/5"

    class Meta:
        verbose_name = 'Encuesta'
        verbose_name_plural = 'Encuestas'
        ordering = ['-fecha_creacion']


class WebsiteContent(models.Model):
    """Modelo para contenido editable del sitio web público"""
    CONTENT_TYPE_CHOICES = [
        # Página de inicio
        ('inicio_titulo', 'Título de la página de inicio'),
        ('inicio_descripcion', 'Descripción de la página de inicio'),
        ('inicio_subtitulo', 'Subtítulo de la página de inicio'),
        ('inicio_hero_image', 'Imagen principal (Hero)'),
        ('hero_color_fondo', 'Color de fondo para sección hero'),
        ('branding_color_primario', 'Color primario de la marca'),
        ('branding_color_secundario', 'Color secundario de la marca'),

        # Establecimiento
        ('establecimiento_titulo', 'Título del establecimiento'),
        ('establecimiento_descripcion', 'Descripción del establecimiento'),
        ('establecimiento_historia', 'Historia del establecimiento'),
        ('establecimiento_mision', 'Misión del establecimiento'),
        ('establecimiento_vision', 'Visión del establecimiento'),
        ('establecimiento_imagen', 'Imagen del establecimiento'),
        ('establecimiento_color_fondo', 'Color de fondo de la sección de establecimiento'),

        # Servicios
        ('servicios_descripcion', 'Descripción general de servicios'),
        ('servicios_imagen', 'Imagen de servicios'),
        ('servicios_color_fondo', 'Color de fondo de la sección de servicios'),
        ('catalogo_titulo', 'Título del catálogo de productos'),
        ('catalogo_descripcion', 'Descripción del catálogo de productos'),
        ('productos_color_fondo', 'Color de fondo de la sección de productos'),

        # Ubicación
        ('ubicacion_titulo', 'Título de la sección de ubicación'),
        ('ubicacion_descripcion', 'Descripción de la sección de ubicación'),
        ('ubicacion_direccion', 'Dirección física del local'),
        ('ubicacion_maps_url', 'URL de Google Maps del local'),
        ('ubicacion_color_fondo', 'Color de fondo de la sección de ubicación'),

        # Contacto
        ('contacto_telefono', 'Teléfono de contacto'),
        ('contacto_email', 'Email de contacto'),
        ('contacto_direccion', 'Dirección de contacto'),
        ('contacto_whatsapp', 'WhatsApp de contacto'),
        ('contacto_instagram', 'Instagram'),
        ('contacto_facebook', 'Facebook'),
        ('social_facebook', 'URL de Facebook'),
        ('social_instagram', 'URL de Instagram'),
        ('social_twitter', 'URL de Twitter / X'),
        ('horarios_laborales', 'Horarios laborales'),
        ('horarios_especiales', 'Horarios especiales'),
        ('contacto_color_fondo', 'Color de fondo de la sección contacto'),
        ('contacto_color_tarjeta', 'Color de las tarjetas de contacto'),

        # SEO y metadata
        ('meta_titulo', 'Título para SEO'),
        ('meta_descripcion', 'Descripción para SEO'),
        ('meta_keywords', 'Palabras clave para SEO'),

        # Configuración general
        ('nombre_barberia', 'Nombre de la barbería'),
        ('slogan', 'Slogan de la barbería'),
        ('descripcion_general', 'Descripción general de la barbería'),
        ('logo_barberia', 'Logo de la barbería'),
        ('features_color_fondo', 'Color de fondo de la sección de características'),
        ('features_color_icono', 'Color de ícono de características'),
        ('galeria_color_fondo', 'Color de fondo de la sección de galería'),
        ('galeria_descripcion', 'Descripción de la sección de galería'),
        ('galeria_placeholder_text', 'Mensaje cuando la galería está vacía'),
        ('testimonios_color_fondo', 'Color de fondo de la sección de testimonios'),
        ('footer_color_fondo', 'Color de fondo del pie de página'),
        ('footer_color_texto', 'Color de texto del pie de página'),
        ('footer_descripcion', 'Descripción del pie de página'),
        ('footer_servicio_1', 'Servicio destacado 1 en pie de página'),
        ('footer_servicio_2', 'Servicio destacado 2 en pie de página'),
        ('footer_servicio_3', 'Servicio destacado 3 en pie de página'),
        ('footer_servicio_4', 'Servicio destacado 4 en pie de página'),
        ('caracteristica_1_titulo', 'Título de característica 1'),
        ('caracteristica_1_descripcion', 'Descripción de característica 1'),
        ('caracteristica_2_titulo', 'Título de característica 2'),
        ('caracteristica_2_descripcion', 'Descripción de característica 2'),
        ('caracteristica_3_titulo', 'Título de característica 3'),
        ('caracteristica_3_descripcion', 'Descripción de característica 3'),
        ('caracteristica_4_titulo', 'Título de característica 4'),
        ('caracteristica_4_descripcion', 'Descripción de característica 4'),

        # Políticas
        ('politica_privacidad', 'Política de privacidad'),
        ('terminos_condiciones', 'Términos y condiciones'),
        ('politica_cancelacion', 'Política de cancelación'),
    ]

    tipo_contenido = models.CharField(
        max_length=50,
        choices=CONTENT_TYPE_CHOICES,
        unique=True,
        verbose_name='Tipo de contenido'
    )

    contenido = models.TextField(
        verbose_name='Contenido'
    )

    imagen = models.ImageField(
        upload_to='website/',
        blank=True,
        null=True,
        verbose_name='Imagen relacionada'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    def __str__(self):
        return f"{self.get_tipo_contenido_display()}: {self.contenido[:50]}..."

    class Meta:
        verbose_name = 'Contenido del sitio web'
        verbose_name_plural = 'Contenido del sitio web'
        ordering = ['tipo_contenido']


class Testimonial(models.Model):
    """Modelo para testimonios de clientes"""
    cliente_nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre del cliente',
        db_column='cliente_nombre'
    )

    cliente_foto = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Foto del cliente',
        db_column='cliente_foto'
    )

    testimonio = models.TextField(
        verbose_name='Testimonio del cliente',
        db_column='testimonio'
    )

    calificacion = models.PositiveIntegerField(
        choices=[
            (1, '1 - Muy malo'),
            (2, '2 - Malo'),
            (3, '3 - Regular'),
            (4, '4 - Bueno'),
            (5, '5 - Excelente'),
        ],
        verbose_name='Calificación',
        db_column='calificacion'
    )

    servicio_recibido = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Servicio recibido',
        db_column='servicio_recibido'
    )

    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de visualización',
        db_column='orden'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='Activo/Visible',
        db_column='activo'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación',
        db_column='fecha_creacion'
    )

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='testimonial',
        verbose_name='Cita relacionada',
        db_column='appointment_id'
    )

    def __str__(self):
        if self.appointment:
            return f"Testimonio de {self.cliente_nombre} - Cita #{self.appointment.id}"
        return f"Testimonio de {self.cliente_nombre} ({self.calificacion}/5)"

    class Meta:
        verbose_name = 'Testimonio'
        verbose_name_plural = 'Testimonios'
        ordering = ['-fecha_creacion']


class GalleryImage(models.Model):
    """Modelo para imágenes y videos de la galería"""
    titulo = models.CharField(
        max_length=100,
        verbose_name='Título del medio'
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción del medio'
    )

    imagen = models.ImageField(
        upload_to='galeria/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )

    video_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL del video (YouTube, Vimeo, etc.)'
    )

    video_file = models.FileField(
        upload_to='galeria/videos/',
        blank=True,
        null=True,
        verbose_name='Archivo de video (MP4)',
        help_text='Sube un archivo MP4 directamente'
    )

    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de aparición'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    def __str__(self):
        return self.titulo

    @property
    def es_video(self):
        """Indica si el elemento es un video"""
        return bool(self.video_url or self.video_file)
    
    @property
    def tipo_video(self):
        """Retorna el tipo de video: 'url' o 'file'"""
        if self.video_file:
            return 'file'
        elif self.video_url:
            return 'url'
        return None

    class Meta:
        verbose_name = 'Elemento de galería'
        verbose_name_plural = 'Elementos de galería'
        ordering = ['orden', 'fecha_creacion']


class SystemSettings(models.Model):
    """Modelo para configuración general del sistema"""
    SETTINGS_TYPE_CHOICES = [
        ('general', 'Configuración General'),
        ('appearance', 'Apariencia'),
        ('business', 'Configuración de Negocio'),
        ('notifications', 'Notificaciones'),
        ('social_media', 'Redes Sociales'),
        ('seo', 'SEO y Metadata'),
        ('payment', 'Configuración de Pagos'),
        ('booking', 'Configuración de Reservas'),
    ]

    tipo_configuracion = models.CharField(
        max_length=20,
        choices=SETTINGS_TYPE_CHOICES,
        verbose_name='Tipo de configuración'
    )

    clave = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Clave de configuración'
    )

    valor = models.TextField(
        verbose_name='Valor de configuración'
    )

    descripcion = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Descripción'
    )

    def __str__(self):
        return f"{self.get_tipo_configuracion_display()}: {self.clave}"

    class Meta:
        verbose_name = 'Configuración del sistema'
        verbose_name_plural = 'Configuración del sistema'
        ordering = ['tipo_configuracion', 'clave']


class PageSection(models.Model):
    """Modelo para secciones configurables de la página"""
    SECTION_TYPE_CHOICES = [
        ('hero', 'Sección Hero'),
        ('about', 'Acerca de'),
        ('services', 'Servicios'),
        ('gallery', 'Galería'),
        ('testimonials', 'Testimonios'),
        ('contact', 'Contacto'),
        ('footer', 'Pie de página'),
        ('custom', 'Sección personalizada'),
    ]

    nombre = models.CharField(
        max_length=100,
        verbose_name='Nombre de la sección'
    )

    tipo_seccion = models.CharField(
        max_length=20,
        choices=SECTION_TYPE_CHOICES,
        verbose_name='Tipo de sección'
    )

    titulo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Título'
    )

    subtitulo = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Subtítulo'
    )

    contenido = models.TextField(
        blank=True,
        verbose_name='Contenido'
    )

    imagen_fondo = models.ImageField(
        upload_to='secciones/',
        blank=True,
        null=True,
        verbose_name='Imagen de fondo'
    )

    imagen_principal = models.ImageField(
        upload_to='secciones/',
        blank=True,
        null=True,
        verbose_name='Imagen principal'
    )

    video_url = models.URLField(
        blank=True,
        verbose_name='URL del video'
    )

    boton_texto = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Texto del botón'
    )

    boton_url = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='URL del botón'
    )

    color_fondo = models.CharField(
        max_length=7,
        default='#FFFFFF',
        verbose_name='Color de fondo (HEX)'
    )

    color_texto = models.CharField(
        max_length=7,
        default='#000000',
        verbose_name='Color de texto (HEX)'
    )

    orden = models.PositiveIntegerField(
        default=0,
        verbose_name='Orden de aparición'
    )

    activo = models.BooleanField(
        default=True,
        verbose_name='¿Está activo?'
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_seccion_display()})"

    class Meta:
        verbose_name = 'Sección de página'
        verbose_name_plural = 'Secciones de página'
        ordering = ['orden', 'fecha_creacion']


class AppointmentAlert(models.Model):
    """Modelo para alertas de nuevas citas en el panel de administración"""
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='alert',
        verbose_name='Cita relacionada'
    )
    
    mensaje_enviado = models.BooleanField(
        default=False,
        verbose_name='¿Se envió el mensaje de WhatsApp?'
    )
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    
    fecha_envio = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de envío del mensaje'
    )
    
    def __str__(self):
        cliente_nombre = ''
        if self.appointment.cliente and self.appointment.cliente.user:
            cliente_nombre = self.appointment.cliente.user.get_full_name() or self.appointment.cliente.user.username
        else:
            cliente_nombre = self.appointment.nombre_cliente or 'Cliente'
        return f"Alerta: {cliente_nombre} - {self.appointment.fecha_hora}"
    
    @property
    def whatsapp_url(self):
        """Genera la URL de WhatsApp con el mensaje pre-formateado"""
        telefono = self.appointment.telefono_cliente or ''
        # Limpiar teléfono (solo números)
        telefono_limpio = ''.join(filter(str.isdigit, telefono))
        
        if not telefono_limpio:
            return None
        
        # Formatear fecha y hora
        fecha_formato = self.appointment.fecha_hora.strftime('%d/%m/%Y')
        hora_formato = self.appointment.fecha_hora.strftime('%H:%M')
        
        # Mensaje pre-formateado
        nombre_cliente = self.appointment.nombre_cliente or 'Cliente'
        mensaje = f"Hola {nombre_cliente}, gracias por agendar tu cita en BarberRock el día {fecha_formato} a las {hora_formato}"
        
        # Codificar mensaje para URL
        import urllib.parse
        mensaje_codificado = urllib.parse.quote(mensaje)
        
        return f"https://wa.me/{telefono_limpio}?text={mensaje_codificado}"
    
    class Meta:
        verbose_name = 'Alerta de cita'
        verbose_name_plural = 'Alertas de citas'
        ordering = ['-fecha_creacion']
