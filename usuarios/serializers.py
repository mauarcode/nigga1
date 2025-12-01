from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CustomUser,
    ClientProfile,
    BarberProfile,
    Service,
    Product,
    Package,
    Appointment,
    Survey,
    WebsiteContent,
    Testimonial,
    GalleryImage,
    SystemSettings,
    PageSection,
)


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializador para configuración del sistema"""
    class Meta:
        model = SystemSettings
        fields = ('id', 'tipo_configuracion', 'clave', 'valor', 'descripcion')

User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    """Serializador para usuarios personalizados"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                 'rol', 'telefono', 'fecha_nacimiento', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Asegurar que los usuarios creados desde el registro público sean clientes
        if 'rol' not in validated_data or validated_data.get('rol') == '':
            validated_data['rol'] = 'cliente'
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Si es cliente, crear su perfil automáticamente
        if user.rol == 'cliente':
            from .models import ClientProfile
            ClientProfile.objects.get_or_create(user=user)
        
        return user


class ClientProfileSerializer(serializers.ModelSerializer):
    """Serializador para perfiles de clientes"""
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    cortes_restantes_para_promocion = serializers.ReadOnlyField()
    es_elegible_para_promocion = serializers.ReadOnlyField()

    class Meta:
        model = ClientProfile
        fields = ('id', 'user', 'user_id', 'cortes_realizados',
                 'cortes_para_promocion', 'cortes_restantes_para_promocion',
                 'es_elegible_para_promocion', 'fecha_ultimo_corte')


class BarberProfileSerializer(serializers.ModelSerializer):
    """Serializador para perfiles de barberos"""
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    qr_url = serializers.SerializerMethodField()

    class Meta:
        model = BarberProfile
        fields = ('id', 'user', 'user_id', 'especialidad', 'descripcion',
                 'horario_inicio', 'horario_fin', 'dias_laborales', 'activo', 'qr_token', 'qr_url')
        read_only_fields = ('qr_token', 'qr_url')
    
    def get_qr_url(self, obj):
        """Genera la URL para escanear el QR del barbero"""
        if obj.qr_token:
            from django.conf import settings
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return f"{frontend_url}/encuesta/qr/{obj.qr_token}"
        return None


class ServiceSerializer(serializers.ModelSerializer):
    """Serializador para servicios"""
    class Meta:
        model = Service
        fields = ('id', 'nombre', 'descripcion', 'precio', 'precio_desde', 'comision_barbero', 'duracion', 'activo', 'imagen')


class ProductSerializer(serializers.ModelSerializer):
    """Serializador para productos"""
    class Meta:
        model = Product
        fields = (
            'id',
            'nombre',
            'descripcion',
            'precio',
            'precio_desde',
            'imagen',
            'stock',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        )


class PackageSerializer(serializers.ModelSerializer):
    """Serializador para paquetes"""
    servicios = ServiceSerializer(read_only=True, many=True)
    productos = ProductSerializer(read_only=True, many=True)
    servicio_ids = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(activo=True),
        many=True,
        write_only=True,
        required=False
    )
    producto_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(activo=True),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = Package
        fields = (
            'id',
            'nombre',
            'descripcion',
            'precio',
            'servicios',
            'productos',
            'servicio_ids',
            'producto_ids',
            'imagen',
            'activo',
            'fecha_creacion',
            'fecha_actualizacion',
        )

    def create(self, validated_data):
        servicio_ids = validated_data.pop('servicio_ids', [])
        producto_ids = validated_data.pop('producto_ids', [])
        
        package = Package.objects.create(**validated_data)
        
        if servicio_ids:
            package.servicios.set(servicio_ids)
        if producto_ids:
            package.productos.set(producto_ids)
        
        return package

    def update(self, instance, validated_data):
        servicio_ids = validated_data.pop('servicio_ids', None)
        producto_ids = validated_data.pop('producto_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if servicio_ids is not None:
            instance.servicios.set(servicio_ids)
        if producto_ids is not None:
            instance.productos.set(producto_ids)
        
        return instance


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializador para citas"""
    cliente = ClientProfileSerializer(read_only=True)
    barbero = BarberProfileSerializer(read_only=True)
    paquete = PackageSerializer(read_only=True)
    servicio = ServiceSerializer(read_only=True)
    productos = ProductSerializer(read_only=True, many=True)
    cliente_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    barbero_id = serializers.IntegerField(write_only=True, required=True)
    servicio_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    paquete_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    producto_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    tiene_encuesta = serializers.SerializerMethodField()
    encuesta_token = serializers.SerializerMethodField()
    encuesta_id = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ('id', 'cliente', 'barbero', 'servicio', 'paquete', 'productos', 'cliente_id',
                 'barbero_id', 'servicio_id', 'paquete_id', 'producto_ids', 'fecha_hora', 'estado',
                 'notas', 'nombre_cliente', 'telefono_cliente',
                 'email_cliente', 'es_cliente_registrado', 'survey_token',
                 'encuesta_completada', 'fecha_creacion', 'fecha_actualizacion',
                 'tiene_encuesta', 'encuesta_token', 'encuesta_id')

        read_only_fields = ('survey_token', 'encuesta_completada', 'fecha_creacion', 'fecha_actualizacion')

    def get_tiene_encuesta(self, obj):
        return hasattr(obj, 'survey')

    def get_encuesta_token(self, obj):
        return obj.survey_token

    def get_encuesta_id(self, obj):
        return obj.survey.id if hasattr(obj, 'survey') else None

    def create(self, validated_data):
        producto_ids = validated_data.pop('producto_ids', [])
        appointment = super().create(validated_data)
        if producto_ids:
            productos = Product.objects.filter(id__in=producto_ids, activo=True)
            appointment.productos.set(productos)
        return appointment

    def update(self, instance, validated_data):
        producto_ids = validated_data.pop('producto_ids', None)
        appointment = super().update(instance, validated_data)
        if producto_ids is not None:
            productos = Product.objects.filter(id__in=producto_ids, activo=True)
            appointment.productos.set(productos)
        return appointment


class SurveySerializer(serializers.ModelSerializer):
    """Serializador para encuestas"""
    appointment = AppointmentSerializer(read_only=True)
    appointment_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Survey
        fields = (
            'id',
            'appointment',
            'appointment_id',
            'calificacion',
            'limpieza_calificacion',
            'puntualidad_calificacion',
            'trato_calificacion',
            'recomendaria',
            'comentarios',
            'fecha_creacion',
        )

    def create(self, validated_data):
        appointment_id = validated_data.pop('appointment_id')
        appointment = Appointment.objects.get(id=appointment_id)
        survey, _ = Survey.objects.update_or_create(
            appointment=appointment,
            defaults=validated_data
        )
        return survey


class TestimonialSerializer(serializers.ModelSerializer):
    """Serializador para testimonios"""
    appointment_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Testimonial
        fields = (
            'id',
            'cliente_nombre',
            'cliente_foto',
            'testimonio',
            'calificacion',
            'servicio_recibido',
            'orden',
            'activo',
            'fecha_creacion',
            'appointment',
            'appointment_id',
        )

        read_only_fields = ('fecha_creacion', 'appointment')

    def update(self, instance, validated_data):
        validated_data.pop('appointment_id', None)
        return super().update(instance, validated_data)


class GalleryImageSerializer(serializers.ModelSerializer):
    """Serializador para imágenes y videos de galería"""
    es_video = serializers.ReadOnlyField()
    tipo_video = serializers.ReadOnlyField()
    
    class Meta:
        model = GalleryImage
        fields = ('id', 'titulo', 'descripcion', 'imagen', 'video_url', 'video_file', 'es_video', 'tipo_video', 'orden', 'activo', 'fecha_creacion')


class WebsiteContentSerializer(serializers.ModelSerializer):
    """Serializador para contenido del sitio web"""
    contenido = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = WebsiteContent
        fields = ('id', 'tipo_contenido', 'contenido', 'imagen', 'activo', 'fecha_actualizacion')
    
    def validate(self, data):
        # Si es creación, contenido es requerido
        if self.instance is None and not data.get('contenido'):
            data['contenido'] = ' '  # Valor por defecto mínimo
        # Si es actualización y contenido está vacío, mantener el valor existente
        elif self.instance and not data.get('contenido'):
            data['contenido'] = self.instance.contenido or ' '
        return data


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializador para configuración del sistema"""
    class Meta:
        model = SystemSettings
        fields = ('id', 'tipo_configuracion', 'clave', 'valor', 'descripcion')


class PageSectionSerializer(serializers.ModelSerializer):
    """Serializador para secciones de página"""
    class Meta:
        model = PageSection
        fields = ('id', 'nombre', 'tipo_seccion', 'titulo', 'subtitulo', 'contenido',
                 'imagen_fondo', 'imagen_principal', 'video_url', 'boton_texto', 'boton_url',
                 'color_fondo', 'color_texto', 'orden', 'activo', 'fecha_creacion', 'fecha_actualizacion')
