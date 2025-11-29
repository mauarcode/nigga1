from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

# Crear router para las vistas de la API
router = DefaultRouter()
router.register(r'usuarios', views.CustomUserViewSet)
router.register(r'clientes', views.ClientProfileViewSet)
router.register(r'barberos', views.BarberProfileViewSet)
router.register(r'servicios', views.ServiceViewSet)
router.register(r'productos', views.ProductViewSet)
router.register(r'paquetes', views.PackageViewSet)
router.register(r'citas', views.AppointmentViewSet)
router.register(r'encuestas', views.SurveyViewSet)
router.register(r'contenido', views.WebsiteContentViewSet)
router.register(r'testimonios', views.TestimonialViewSet)
router.register(r'galeria', views.GalleryImageViewSet)
router.register(r'configuracion', views.SystemSettingsViewSet)
router.register(r'secciones', views.PageSectionViewSet)

urlpatterns = [
    # Endpoints específicos que deben evaluarse antes del router
    path('citas/horarios-disponibles/', views.get_available_slots, name='available_slots'),
    path('citas/agendar/', views.schedule_appointment, name='schedule_appointment'),
    path('encuestas/info/', views.get_public_survey_info, name='public_survey_info'),
    path('encuestas/enviar/', views.submit_public_survey, name='public_survey_submit'),

    # Rutas del router
    path('', include(router.urls)),

    # Rutas de autenticación JWT (estándar)
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Ruta de login personalizada (acepta username o email)
    path('login/', views.custom_login, name='custom_login'),

    # Rutas personalizadas
    path('disponibilidad/', views.get_barber_availability, name='barber_availability'),
    path('estadisticas/', views.get_barber_stats, name='barber_stats'),
    path('promociones/', views.check_promotions, name='check_promotions'),

    # Rutas de administración
    path('admin/estadisticas-generales/', views.admin_estadisticas_generales, name='admin_stats'),
    path('admin/dashboard/', views.admin_dashboard_data, name='admin_dashboard'),
    path('admin/contenido-sitio/', views.admin_contenido_sitio, name='admin_content'),
    path('admin/usuarios/', views.admin_users_management, name='admin_users'),
    path('admin/usuarios/<int:user_id>/', views.admin_users_management, name='admin_user_detail'),
    path('admin/servicios/', views.admin_services_management, name='admin_services'),
    path('admin/servicios/<int:service_id>/', views.admin_services_management, name='admin_service_detail'),
    path('admin/alertas/', views.get_appointment_alerts, name='appointment_alerts'),
    path('admin/alertas/<int:alert_id>/enviar/', views.mark_alert_as_sent, name='mark_alert_sent'),
    
    # Rutas para códigos QR
    path('barberos/<int:barbero_id>/qr/', views.get_barber_qr, name='get_barber_qr'),
    path('qr/<str:qr_token>/', views.scan_qr_code, name='scan_qr_code'),
    path('qr/<str:qr_token>/encuesta/', views.get_pending_survey_by_qr, name='get_pending_survey_by_qr'),
]
