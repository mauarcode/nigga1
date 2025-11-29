from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, ClientProfile, BarberProfile, Service, Product, Package, Appointment, Survey, WebsiteContent, Testimonial, GalleryImage, SystemSettings, PageSection, AppointmentAlert

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Configuración del panel administrativo para usuarios personalizados"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active', 'date_joined')
    list_filter = ('rol', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('rol', 'telefono', 'fecha_nacimiento')
        }),
    )

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para perfiles de clientes"""
    list_display = ('user', 'cortes_realizados', 'cortes_para_promocion', 'cortes_restantes_para_promocion', 'es_elegible_para_promocion', 'fecha_ultimo_corte')
    list_filter = ('cortes_para_promocion', 'fecha_ultimo_corte')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('cortes_restantes_para_promocion', 'es_elegible_para_promocion')

    def cortes_restantes_para_promocion(self, obj):
        return obj.cortes_restantes_para_promocion

    def es_elegible_para_promocion(self, obj):
        return obj.es_elegible_para_promocion

    cortes_restantes_para_promocion.short_description = 'Cortes restantes para promoción'
    es_elegible_para_promocion.short_description = '¿Es elegible para promoción?'
    es_elegible_para_promocion.boolean = True

@admin.register(BarberProfile)
class BarberProfileAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para perfiles de barberos"""
    list_display = ('user', 'especialidad', 'activo', 'horario_inicio', 'horario_fin', 'qr_token')
    list_filter = ('activo', 'horario_inicio', 'horario_fin')
    search_fields = ('user__username', 'especialidad', 'descripcion', 'qr_token')
    readonly_fields = ('qr_token',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para servicios"""
    list_display = ('nombre', 'precio', 'duracion', 'activo')
    list_filter = ('activo', 'precio', 'duracion')
    search_fields = ('nombre', 'descripcion')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para productos"""
    list_display = ('nombre', 'precio', 'stock', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')
    list_editable = ('activo',)

@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para paquetes"""
    list_display = ('nombre', 'precio', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')
    list_editable = ('activo',)
    filter_horizontal = ('servicios', 'productos')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para citas"""
    list_display = ('cliente', 'barbero', 'servicio', 'fecha_hora', 'estado')
    list_filter = ('estado', 'fecha_hora', 'servicio', 'barbero')
    search_fields = ('cliente__user__username', 'barbero__user__username', 'notas')
    date_hierarchy = 'fecha_hora'

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para encuestas"""
    list_display = ('appointment', 'calificacion', 'limpieza_calificacion', 'puntualidad_calificacion', 'trato_calificacion', 'recomendaria', 'fecha_creacion')
    list_filter = ('calificacion', 'recomendaria', 'fecha_creacion')
    search_fields = ('appointment__cliente__user__username', 'comentarios', 'appointment__nombre_cliente')
    readonly_fields = ('fecha_creacion',)

@admin.register(WebsiteContent)
class WebsiteContentAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para contenido del sitio web"""
    list_display = ('tipo_contenido', 'contenido', 'activo', 'fecha_actualizacion')
    list_filter = ('tipo_contenido', 'activo')
    search_fields = ('tipo_contenido', 'contenido')
    readonly_fields = ('fecha_actualizacion',)

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para testimonios"""
    list_display = ('cliente_nombre', 'calificacion', 'servicio_recibido', 'activo', 'fecha_creacion', 'appointment')
    list_filter = ('calificacion', 'activo', 'fecha_creacion')
    search_fields = ('cliente_nombre', 'testimonio', 'servicio_recibido', 'appointment__id')
    readonly_fields = ('fecha_creacion',)

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para imágenes de galería"""
    list_display = ('titulo', 'orden', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('titulo', 'descripcion')
    list_editable = ('orden', 'activo')
    readonly_fields = ('fecha_creacion',)

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para configuración del sistema"""
    list_display = ('tipo_configuracion', 'clave', 'valor', 'descripcion')
    list_filter = ('tipo_configuracion',)
    search_fields = ('clave', 'valor', 'descripcion')
    list_editable = ('valor',)

@admin.register(PageSection)
class PageSectionAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para secciones de página"""
    list_display = ('nombre', 'tipo_seccion', 'titulo', 'orden', 'activo', 'fecha_actualizacion')
    list_filter = ('tipo_seccion', 'activo', 'fecha_creacion')
    search_fields = ('nombre', 'titulo', 'contenido')
    list_editable = ('orden', 'activo')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    
    fieldsets = (
        ('Información básica', {
            'fields': ('nombre', 'tipo_seccion', 'activo', 'orden')
        }),
        ('Contenido', {
            'fields': ('titulo', 'subtitulo', 'contenido')
        }),
        ('Medios', {
            'fields': ('imagen_fondo', 'imagen_principal', 'video_url')
        }),
        ('Botón de acción', {
            'fields': ('boton_texto', 'boton_url')
        }),
        ('Estilo', {
            'fields': ('color_fondo', 'color_texto')
        }),
        ('Información del sistema', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

@admin.register(AppointmentAlert)
class AppointmentAlertAdmin(admin.ModelAdmin):
    """Configuración del panel administrativo para alertas de citas"""
    list_display = ('appointment', 'mensaje_enviado', 'fecha_creacion', 'fecha_envio')
    list_filter = ('mensaje_enviado', 'fecha_creacion', 'fecha_envio')
    search_fields = ('appointment__cliente__user__username', 'appointment__nombre_cliente', 'appointment__barbero__user__username')
    readonly_fields = ('fecha_creacion', 'fecha_envio', 'whatsapp_url')
    date_hierarchy = 'fecha_creacion'
    
    def whatsapp_url(self, obj):
        return obj.whatsapp_url
    whatsapp_url.short_description = 'URL de WhatsApp'
