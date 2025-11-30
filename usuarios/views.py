from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count, Q, Sum
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime, timedelta
import uuid
from .models import (
    CustomUser,
    ClientProfile,
    BarberProfile,
    Service,
    Product,
    Package,
    Appointment,
    AppointmentProduct,
    Survey,
    WebsiteContent,
    Testimonial,
    GalleryImage,
    SystemSettings,
    PageSection,
    AppointmentAlert,
)
from .serializers import (
    CustomUserSerializer, ClientProfileSerializer, BarberProfileSerializer,
    ServiceSerializer, ProductSerializer, PackageSerializer, AppointmentSerializer, SurveySerializer, WebsiteContentSerializer,
    GalleryImageSerializer, SystemSettingsSerializer, TestimonialSerializer, PageSectionSerializer
)

# ViewSets para la API REST
class CustomUserViewSet(viewsets.ModelViewSet):
    """ViewSet para usuarios personalizados"""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [AllowAny()]
        return [IsAuthenticated()]


class ClientProfileViewSet(viewsets.ModelViewSet):
    """ViewSet para perfiles de clientes"""
    queryset = ClientProfile.objects.all()
    serializer_class = ClientProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.rol == 'cliente':
            return ClientProfile.objects.filter(user=self.request.user)
        return ClientProfile.objects.all()


class BarberProfileViewSet(viewsets.ModelViewSet):
    """ViewSet para perfiles de barberos"""
    queryset = BarberProfile.objects.filter(activo=True)
    serializer_class = BarberProfileSerializer
    permission_classes = [AllowAny]


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios"""
    queryset = Service.objects.filter(activo=True)
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet para productos"""
    queryset = Product.objects.all().order_by('-fecha_creacion')
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and getattr(user, 'rol', '') == 'admin':
            return Product.objects.all().order_by('-fecha_creacion')
        return Product.objects.filter(activo=True).order_by('-fecha_creacion')

    def perform_update(self, serializer):
        imagen = self.request.data.get('imagen')
        if imagen == '':
            serializer.save(imagen=None)
        else:
            serializer.save()


class PackageViewSet(viewsets.ModelViewSet):
    """ViewSet para paquetes"""
    queryset = Package.objects.all().order_by('-fecha_creacion')
    serializer_class = PackageSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and getattr(user, 'rol', '') == 'admin':
            return Package.objects.all().order_by('-fecha_creacion')
        return Package.objects.filter(activo=True).order_by('-fecha_creacion')

    def perform_update(self, serializer):
        imagen = self.request.data.get('imagen')
        if imagen == '':
            serializer.save(imagen=None)
        else:
            serializer.save()


class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet para citas"""
    queryset = Appointment.objects.all().select_related(
        'cliente__user',
        'barbero__user',
        'servicio'
    ).prefetch_related('productos')
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_queryset = super().get_queryset()
        if user.rol == 'cliente':
            return base_queryset.filter(cliente__user=user)
        elif user.rol == 'barbero':
            return base_queryset.filter(barbero__user=user)
        return base_queryset

    def perform_create(self, serializer):
        """Crear cita y actualizar contador de cortes del cliente"""
        appointment = serializer.save()

        # Si la cita se marca como completada, incrementar cortes del cliente
        if appointment.estado == 'completada' and appointment.cliente:
            cliente = appointment.cliente
            cliente.cortes_realizados += 1
            cliente.fecha_ultimo_corte = timezone.now()
            cliente.save()

    def perform_update(self, serializer):
        estado_anterior = serializer.instance.estado
        appointment = serializer.save()

        if (
            appointment.estado == 'completada'
            and estado_anterior != 'completada'
            and appointment.cliente
        ):
            cliente = appointment.cliente
            cliente.cortes_realizados += 1
            cliente.fecha_ultimo_corte = timezone.now()
            cliente.save()

        if not appointment.survey_token:
            appointment.save(update_fields=['survey_token'])


class SurveyViewSet(viewsets.ModelViewSet):
    """ViewSet para encuestas"""
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'cliente':
            return Survey.objects.filter(appointment__cliente__user=user)
        if user.rol == 'barbero':
            return Survey.objects.filter(appointment__barbero__user=user)
        return Survey.objects.all()


class WebsiteContentViewSet(viewsets.ModelViewSet):
    """ViewSet para contenido del sitio web"""
    queryset = WebsiteContent.objects.all()
    serializer_class = WebsiteContentSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """
        Si el usuario está autenticado (admin), muestra todos los elementos.
        Si no está autenticado (web pública), solo muestra activos.
        """
        if self.request.user.is_authenticated:
            queryset = WebsiteContent.objects.all().order_by('tipo_contenido')
        else:
            queryset = WebsiteContent.objects.filter(activo=True).order_by('tipo_contenido')
            # Log para depuración
            maps_url_item = queryset.filter(tipo_contenido='ubicacion_maps_url').first()
            if maps_url_item:
                print(f"[DEBUG] ubicacion_maps_url encontrado en queryset público: activo={maps_url_item.activo}, contenido={maps_url_item.contenido[:50] if maps_url_item.contenido else 'vacio'}")
            else:
                print(f"[DEBUG] ubicacion_maps_url NO encontrado en queryset público")
                # Verificar si existe pero está inactivo
                all_maps = WebsiteContent.objects.filter(tipo_contenido='ubicacion_maps_url')
                print(f"[DEBUG] Total registros ubicacion_maps_url: {all_maps.count()}")
                for item in all_maps:
                    print(f"[DEBUG]   - ID: {item.id}, Activo: {item.activo}, Contenido: {item.contenido[:50] if item.contenido else 'vacio'}")
        return queryset


class TestimonialViewSet(viewsets.ModelViewSet):
    """ViewSet para testimonios"""
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """
        Si el usuario está autenticado (admin), muestra todos los testimonios.
        Si no está autenticado (web pública), solo muestra activos.
        """
        if self.request.user.is_authenticated:
            return Testimonial.objects.all().order_by('-fecha_creacion')
        return Testimonial.objects.filter(activo=True).order_by('-fecha_creacion')


class GalleryImageViewSet(viewsets.ModelViewSet):
    """ViewSet para imágenes de galería"""
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """
        Si el usuario está autenticado (admin), muestra todos los elementos.
        Si no está autenticado (web pública), solo muestra activos.
        """
        if self.request.user.is_authenticated:
            return GalleryImage.objects.all().order_by('orden')
        return GalleryImage.objects.filter(activo=True).order_by('orden')


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración del sistema"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.rol == 'admin':
            return SystemSettings.objects.all()
        return SystemSettings.objects.none()


class PageSectionViewSet(viewsets.ModelViewSet):
    """ViewSet para secciones de página"""
    queryset = PageSection.objects.all()
    serializer_class = PageSectionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Si no está autenticado o no es admin, solo mostrar secciones activas
        if not self.request.user.is_authenticated or self.request.user.rol != 'admin':
            return PageSection.objects.filter(activo=True).order_by('orden')
        return PageSection.objects.all().order_by('orden')


# Vista personalizada de login que acepta tanto username como email
@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    """Vista de login personalizada que acepta username o email"""
    identifier = request.data.get('username')  # Puede ser username o email
    password = request.data.get('password')

    if not identifier or not password:
        return Response(
            {'error': 'Usuario/correo y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Buscar usuario por username o email
    user = None
    try:
        # Intentar por username primero
        user = CustomUser.objects.get(username=identifier)
    except CustomUser.DoesNotExist:
        try:
            # Si no encuentra por username, intentar por email
            user = CustomUser.objects.get(email=identifier)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    # Verificar contraseña
    if not user.check_password(password):
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Generar tokens
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)

    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'rol': user.rol,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    })

# Vistas personalizadas adicionales
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_barber_availability(request):
    """Obtener disponibilidad de barberos para una fecha específica"""
    fecha_str = request.GET.get('fecha')
    servicio_id = request.GET.get('servicio_id')

    if not fecha_str:
        return Response({'error': 'Fecha es requerida'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Formato de fecha inválido'}, status=status.HTTP_400_BAD_REQUEST)

    # Obtener barberos activos
    barberos = BarberProfile.objects.filter(activo=True)

    disponibilidad = []
    for barbero in barberos:
        # Verificar si el barbero trabaja ese día
        dia_semana = fecha.strftime('%A').lower()
        if dia_semana not in [d.lower() for d in barbero.dias_laborales]:
            continue

        # Obtener citas existentes para ese día
        citas_del_dia = Appointment.objects.filter(
            barbero=barbero,
            fecha_hora__date=fecha,
            estado__in=['agendada', 'confirmada']
        )

        # Calcular horarios disponibles
        horarios_disponibles = calcular_horarios_disponibles(
            barbero, fecha, citas_del_dia, servicio_id
        )

        disponibilidad.append({
            'barbero_id': barbero.id,
            'barbero_nombre': barbero.user.get_full_name(),
            'horarios_disponibles': horarios_disponibles
        })

    return Response(disponibilidad)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_barber_stats(request):
    """Obtener estadísticas para un barbero"""
    user = request.user
    if user.rol != 'barbero':
        return Response({'error': 'Solo para barberos'}, status=status.HTTP_403_FORBIDDEN)

    barbero = get_object_or_404(BarberProfile, user=user)

    # Estadísticas del mes actual
    fecha_actual = timezone.now()
    inicio_mes = fecha_actual.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    citas_mes = Appointment.objects.filter(
        barbero=barbero,
        fecha_hora__gte=inicio_mes,
        estado='completada'
    )

    # Estadísticas generales
    citas_totales = Appointment.objects.filter(barbero=barbero, estado='completada').count()
    calificacion_promedio = Survey.objects.filter(
        appointment__barbero=barbero
    ).aggregate(Avg('calificacion'))['calificacion__avg'] or 0

    # Comentarios recientes
    comentarios_recientes = Survey.objects.filter(
        appointment__barbero=barbero
    ).order_by('-fecha_creacion')[:5]

    stats = {
        'citas_mes_actual': citas_mes.count(),
        'citas_totales': citas_totales,
        'calificacion_promedio': round(calificacion_promedio, 1),
        'comentarios_recientes': [
            {
                'cliente': (
                    comentario.appointment.cliente.user.get_full_name()
                    if comentario.appointment.cliente and comentario.appointment.cliente.user
                    else comentario.appointment.nombre_cliente or 'Cliente'
                ),
                'calificacion': comentario.calificacion,
                'comentario': comentario.comentarios,
                'fecha': comentario.fecha_creacion
            }
            for comentario in comentarios_recientes
        ]
    }

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_promotions(request):
    """Verificar promociones para un cliente"""
    user = request.user
    if user.rol != 'cliente':
        return Response({'error': 'Solo para clientes'}, status=status.HTTP_403_FORBIDDEN)

    cliente = get_object_or_404(ClientProfile, user=user)

    return Response({
        'cortes_realizados': cliente.cortes_realizados,
        'cortes_para_promocion': cliente.cortes_para_promocion,
        'cortes_restantes': cliente.cortes_restantes_para_promocion,
        'es_elegible': cliente.es_elegible_para_promocion
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_available_slots(request):
    """Obtener horarios disponibles para una fecha y servicio específico"""
    fecha_str = request.GET.get('fecha')
    barbero_id = request.GET.get('barbero_id')
    duracion = int(request.GET.get('duracion', 30))

    if not all([fecha_str, barbero_id]):
        return Response({'error': 'Fecha y barbero son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Formato de fecha inválido'}, status=status.HTTP_400_BAD_REQUEST)

    # Obtener barbero
    barbero = get_object_or_404(BarberProfile, id=barbero_id, activo=True)

    # Verificar día laboral (dias_laborales es array de números: 0=Domingo, 1=Lunes, etc.)
    dia_semana_num = str(fecha.weekday() + 1)  # Python usa 0=Lun, ajustamos a 1=Lun
    if dia_semana_num == '7':
        dia_semana_num = '0'  # Domingo
    
    dias_laborales = barbero.dias_laborales or []
    if isinstance(dias_laborales, str):
        import json
        try:
            dias_laborales = json.loads(dias_laborales)
        except:
            dias_laborales = []
    
    # Convertir a strings para comparación
    dias_laborales = [str(d) for d in dias_laborales]
    
    if dia_semana_num not in dias_laborales:
        return Response({
            'fecha': fecha_str,
            'horarios_disponibles': [],
            'mensaje': 'El barbero no trabaja este día'
        })

    # Obtener citas existentes
    citas_del_dia = Appointment.objects.filter(
        barbero=barbero,
        fecha_hora__date=fecha,
        estado__in=['pendiente', 'agendada', 'confirmada', 'en_progreso']
    )

    horarios = calcular_horarios_disponibles(barbero, fecha, citas_del_dia, duracion)

    return Response({
        'fecha': fecha_str,
        'barbero': {
            'id': barbero.id,
            'nombre': f"{barbero.user.first_name} {barbero.user.last_name}".strip() or barbero.user.username
        },
        'horarios_disponibles': horarios
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_appointment(request):
    """Crear una cita respetando disponibilidad de barbero y servicio - Requiere login obligatorio"""
    # Validar que el usuario sea cliente
    if not request.user.is_authenticated or getattr(request.user, 'rol', None) != 'cliente':
        return Response(
            {'error': 'Debes iniciar sesión como cliente para agendar una cita'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data

    servicio_id = data.get('servicio_id') or data.get('servicio')
    paquete_id = data.get('paquete_id') or data.get('paquete')
    barbero_id = data.get('barbero_id') or data.get('barbero')
    fecha = data.get('fecha')
    hora = data.get('hora')
    notas = data.get('notas', '')
    estado = data.get('estado', 'agendada')
    duracion = data.get('duracion')
    contacto = data.get('contacto', {}) or {}
    cliente_id = data.get('cliente_id')
    producto_ids = data.get('productos', [])

    if not (servicio_id or paquete_id) or not all([barbero_id, fecha, hora]):
        return Response(
            {'error': 'Servicio o paquete, barbero, fecha y hora son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar que el cliente no tenga encuestas pendientes
    try:
        cliente_profile = ClientProfile.objects.get(user=request.user)
    except ClientProfile.DoesNotExist:
        return Response(
            {'error': 'Perfil de cliente no encontrado. Contacta al administrador.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar si hay citas completadas sin encuesta
    citas_sin_encuesta = Appointment.objects.filter(
        cliente=cliente_profile,
        estado='completada',
        encuesta_completada=False
    ).order_by('-fecha_hora')
    
    if citas_sin_encuesta.exists():
        cita_pendiente = citas_sin_encuesta.first()
        return Response(
            {
                'error': 'Tienes una encuesta pendiente de una cita anterior',
                'cita_pendiente': {
                    'id': cita_pendiente.id,
                    'fecha_hora': cita_pendiente.fecha_hora,
                    'barbero': f"{cita_pendiente.barbero.user.first_name} {cita_pendiente.barbero.user.last_name}".strip() or cita_pendiente.barbero.user.username,
                    'servicio': cita_pendiente.servicio.nombre if cita_pendiente.servicio else (cita_pendiente.paquete.nombre if cita_pendiente.paquete else 'N/A'),
                    'qr_token': cita_pendiente.barbero.qr_token if hasattr(cita_pendiente.barbero, 'qr_token') else None
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if producto_ids and not isinstance(producto_ids, list):
        return Response({'error': 'El formato de productos no es válido'}, status=status.HTTP_400_BAD_REQUEST)

    servicio = None
    paquete = None
    
    if servicio_id:
        try:
            servicio = Service.objects.get(id=servicio_id, activo=True)
        except Service.DoesNotExist:
            return Response({'error': 'Servicio no encontrado o inactivo'}, status=status.HTTP_404_NOT_FOUND)
    
    if paquete_id:
        try:
            paquete = Package.objects.get(id=paquete_id, activo=True)
        except Package.DoesNotExist:
            return Response({'error': 'Paquete no encontrado o inactivo'}, status=status.HTTP_404_NOT_FOUND)
        
        # Si es un paquete, agregar sus productos a la lista de productos seleccionados
        if paquete.productos.exists():
            paquete_productos = list(paquete.productos.values_list('id', flat=True))
            producto_ids = list(set(producto_ids + paquete_productos))
        
        # Si el paquete tiene servicios, usar el primero para la duración
        if paquete.servicios.exists() and not servicio:
            servicio = paquete.servicios.first()
    
    if not servicio and not paquete:
        return Response({'error': 'Debe seleccionar un servicio o un paquete'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        barbero = BarberProfile.objects.get(id=barbero_id, activo=True)
    except BarberProfile.DoesNotExist:
        return Response({'error': 'Barbero no encontrado o inactivo'}, status=status.HTTP_404_NOT_FOUND)

    if not duracion:
        if servicio:
            duracion = servicio.duracion
        else:
            # Duración por defecto para paquetes sin servicio
            duracion = 60

    try:
        duracion = int(duracion)
    except (TypeError, ValueError):
        return Response({'error': 'Duración inválida'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        fecha_hora = datetime.strptime(f"{fecha} {hora}", '%Y-%m-%d %H:%M')
    except ValueError:
        return Response({'error': 'Formato de fecha u hora inválido'}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.is_naive(fecha_hora):
        fecha_hora = timezone.make_aware(fecha_hora, timezone.get_current_timezone())

    # Verificar que el barbero trabaje ese día
    dia_semana_num = str(fecha_hora.weekday() + 1)
    if dia_semana_num == '7':
        dia_semana_num = '0'

    dias_laborales = barbero.dias_laborales or []
    if isinstance(dias_laborales, str):
        import json
        try:
            dias_laborales = json.loads(dias_laborales)
        except json.JSONDecodeError:
            dias_laborales = []

    dias_laborales = [str(d) for d in dias_laborales]
    if dia_semana_num not in dias_laborales:
        return Response({'error': 'El barbero no labora durante la fecha seleccionada'}, status=status.HTTP_400_BAD_REQUEST)

    citas_existentes = Appointment.objects.filter(
        barbero=barbero,
        fecha_hora__date=fecha_hora.date(),
        estado__in=['pendiente', 'agendada', 'confirmada', 'en_progreso']
    )

    # Validar que el horario esté libre
    slots_disponibles = calcular_horarios_disponibles(barbero, fecha_hora.date(), citas_existentes, duracion)
    slot_seleccionado = next((slot for slot in slots_disponibles if slot['hora'] == fecha_hora.strftime('%H:%M')), None)

    if not slot_seleccionado:
        return Response({'error': 'El horario seleccionado ya no está disponible'}, status=status.HTTP_409_CONFLICT)

    # Obtener datos del cliente autenticado
    user = request.user
    nombre_contacto = user.get_full_name() or user.username
    telefono_contacto = user.telefono or ''
    email_contacto = user.email or ''
    
    # Permitir sobrescribir con datos de contacto si se proporcionan
    if contacto.get('nombre'):
        nombre_contacto = contacto.get('nombre', '').strip()
    if contacto.get('telefono'):
        telefono_contacto = contacto.get('telefono', '').strip()
    if contacto.get('email'):
        email_contacto = contacto.get('email', '').strip()
    
    es_cliente_registrado = True

    # Validar que no exista otra cita del mismo cliente en el mismo horario
    if cliente_profile:
        conflicto_cliente = Appointment.objects.filter(
            cliente=cliente_profile,
            fecha_hora=fecha_hora,
            estado__in=['pendiente', 'agendada', 'confirmada', 'en_progreso']
        ).exists()
        if conflicto_cliente:
            return Response({'error': 'Ya tienes una cita agendada en este horario'}, status=status.HTTP_409_CONFLICT)

    # Verificar si el cliente es elegible para promoción (corte gratuito)
    # Solo aplica a servicios, no a paquetes
    es_elegible = cliente_profile.es_elegible_para_promocion and servicio and not paquete
    
    appointment = Appointment.objects.create(
        cliente=cliente_profile,
        barbero=barbero,
        servicio=servicio,
        paquete=paquete,
        fecha_hora=fecha_hora,
        estado=estado if estado in dict(Appointment.STATUS_CHOICES) else 'agendada',
        notas=notas,
        nombre_cliente=nombre_contacto,
        telefono_cliente=telefono_contacto,
        email_cliente=email_contacto or None,
        es_cliente_registrado=es_cliente_registrado,
    )
    
    # Si el cliente usó su corte gratuito, reiniciar el contador
    if es_elegible:
        cliente_profile.cortes_realizados = 0
        cliente_profile.save()

    if producto_ids:
        productos = Product.objects.filter(id__in=producto_ids, activo=True)
        appointment.productos.set(productos)
    
    # Crear alerta para el admin
    AppointmentAlert.objects.create(
        appointment=appointment,
        mensaje_enviado=False
    )

    return Response({
        'message': 'Cita agendada correctamente',
        'cita': {
            'id': appointment.id,
            'fecha_hora': appointment.fecha_hora,
            'barbero': {
                'id': barbero.id,
                'nombre': f"{barbero.user.first_name} {barbero.user.last_name}".strip() or barbero.user.username
            },
            'servicio': {
                'id': servicio.id if servicio else None,
                'nombre': servicio.nombre if servicio else None,
                'duracion': servicio.duracion if servicio else None,
            } if servicio else None,
            'paquete': {
                'id': paquete.id if paquete else None,
                'nombre': paquete.nombre if paquete else None,
            } if paquete else None,
            'productos': [
                {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'precio': float(producto.precio),
                } for producto in appointment.productos.all()
            ],
            'contacto': {
                'nombre': appointment.nombre_cliente,
                'telefono': appointment.telefono_cliente,
                'email': appointment.email_cliente,
            },
            'es_cliente_registrado': appointment.es_cliente_registrado,
        }
    }, status=status.HTTP_201_CREATED)


def calcular_horarios_disponibles(barbero, fecha, citas_existentes, duracion=30):
    """Calcular horarios disponibles para un barbero en una fecha específica"""
    horarios_disponibles = []

    # Crear lista de horarios ocupados
    horarios_ocupados = []
    for cita in citas_existentes:
        inicio = cita.fecha_hora.time()
        fin = (datetime.combine(fecha, inicio) + timedelta(minutes=cita.servicio.duracion)).time()
        horarios_ocupados.append((inicio, fin))

    # Generar horarios disponibles en el día laboral del barbero
    hora_actual = barbero.horario_inicio
    hora_fin = barbero.horario_fin

    while hora_actual < hora_fin:
        # Calcular fin del slot con la duración del servicio
        hora_fin_slot = (datetime.combine(fecha, hora_actual) + timedelta(minutes=duracion)).time()

        # Verificar que el slot completo cabe en el horario laboral
        if hora_fin_slot > hora_fin:
            break

        # Verificar si el slot está disponible (no se solapa con citas existentes)
        slot_libre = True
        for ocupado_inicio, ocupado_fin in horarios_ocupados:
            # Hay solapamiento si el slot empieza antes de que termine una cita
            # Y termina después de que empieza una cita
            if hora_actual < ocupado_fin and hora_fin_slot > ocupado_inicio:
                slot_libre = False
                break

        if slot_libre:
            horarios_disponibles.append({
                'hora': hora_actual.strftime('%H:%M'),
                'hora_fin': hora_fin_slot.strftime('%H:%M'),
                'disponible': True
            })

        # Avanzar 30 minutos para el siguiente slot
        hora_actual = (datetime.combine(fecha, hora_actual) + timedelta(minutes=30)).time()

    return horarios_disponibles


# Endpoints públicos para encuestas de satisfacción
@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_survey_info(request):
    token = request.GET.get('token')

    if not token:
        return Response({'error': 'Token de encuesta requerido'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        appointment = Appointment.objects.select_related(
            'barbero__user', 'servicio', 'cliente__user'
        ).get(survey_token=token)
    except Appointment.DoesNotExist:
        return Response({'error': 'Token de encuesta inválido'}, status=status.HTTP_404_NOT_FOUND)

    cliente_nombre = ''
    cliente_email = ''
    if appointment.cliente and appointment.cliente.user:
        cliente_nombre = appointment.cliente.user.get_full_name() or appointment.cliente.user.username
        cliente_email = appointment.cliente.user.email or ''
    else:
        cliente_nombre = appointment.nombre_cliente or 'Cliente'
        cliente_email = appointment.email_cliente or ''

    survey_data = None
    if hasattr(appointment, 'survey'):
        survey = appointment.survey
        survey_data = {
            'calificacion': survey.calificacion,
            'limpieza_calificacion': survey.limpieza_calificacion,
            'puntualidad_calificacion': survey.puntualidad_calificacion,
            'trato_calificacion': survey.trato_calificacion,
            'recomendaria': survey.recomendaria,
            'comentarios': survey.comentarios,
        }

    return Response({
        'cita_id': appointment.id,
        'token': appointment.survey_token,
        'tiene_encuesta': bool(survey_data),
        'cliente_nombre': cliente_nombre,
        'cliente_email': cliente_email,
        'barbero': {
            'nombre': appointment.barbero.user.get_full_name() if appointment.barbero and appointment.barbero.user else ''
        },
        'servicio': {
            'nombre': appointment.servicio.nombre if appointment.servicio else '',
            'duracion': appointment.servicio.duracion if appointment.servicio else None,
        },
        'fecha_hora': appointment.fecha_hora,
        'encuesta': survey_data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_public_survey(request):
    token = request.data.get('token')

    if not token:
        return Response({'error': 'Token de encuesta requerido'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        appointment = Appointment.objects.select_related('cliente__user', 'servicio').get(survey_token=token)
    except Appointment.DoesNotExist:
        return Response({'error': 'Token de encuesta inválido'}, status=status.HTTP_404_NOT_FOUND)

    try:
        calificacion = int(request.data.get('calificacion'))
        limpieza = int(request.data.get('limpieza_calificacion', 5))
        puntualidad = int(request.data.get('puntualidad_calificacion', 5))
        trato = int(request.data.get('trato_calificacion', 5))
    except (TypeError, ValueError):
        return Response({'error': 'Las calificaciones deben ser valores numéricos'}, status=status.HTTP_400_BAD_REQUEST)

    if calificacion < 1 or calificacion > 5:
        return Response({'error': 'La calificación general debe estar entre 1 y 5'}, status=status.HTTP_400_BAD_REQUEST)

    comentarios = request.data.get('comentarios', '').strip()
    recomendaria = request.data.get('recomendaria')
    if isinstance(recomendaria, str):
        recomendaria = recomendaria.lower() in ['true', '1', 'si', 'sí']
    elif recomendaria is None:
        recomendaria = True

    survey, _ = Survey.objects.update_or_create(
        appointment=appointment,
        defaults={
            'calificacion': calificacion,
            'limpieza_calificacion': max(1, min(limpieza, 5)),
            'puntualidad_calificacion': max(1, min(puntualidad, 5)),
            'trato_calificacion': max(1, min(trato, 5)),
            'recomendaria': bool(recomendaria),
            'comentarios': comentarios,
        }
    )

    if not appointment.encuesta_completada:
        appointment.encuesta_completada = True
        appointment.save(update_fields=['encuesta_completada'])

    cliente_nombre = ''
    if appointment.cliente and appointment.cliente.user:
        cliente_nombre = appointment.cliente.user.get_full_name() or appointment.cliente.user.username
    else:
        cliente_nombre = appointment.nombre_cliente or 'Cliente'

    servicio_nombre = appointment.servicio.nombre if appointment.servicio else ''

    Testimonial.objects.update_or_create(
        appointment=appointment,
        defaults={
            'cliente_nombre': cliente_nombre,
            'testimonio': comentarios or 'El cliente no dejó comentarios adicionales.',
            'calificacion': calificacion,
            'servicio_recibido': servicio_nombre,
            'activo': False,
        }
    )

    return Response({
        'message': '¡Gracias! Tu experiencia ha sido registrada.',
        'tiene_encuesta': True,
        'survey_id': survey.id,
    }, status=status.HTTP_201_CREATED)


# Vistas de administración
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_estadisticas_generales(request):
    """Obtener estadísticas generales para el panel de administración"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    # Estadísticas básicas
    total_users = CustomUser.objects.count()
    total_clients = CustomUser.objects.filter(rol='cliente').count()
    total_barbers = CustomUser.objects.filter(rol='barbero').count()
    total_services = Service.objects.filter(activo=True).count()

    # Estadísticas de citas
    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total_appointments = Appointment.objects.count()
    completed_appointments = Appointment.objects.filter(estado='completada').count()
    appointments_this_month = Appointment.objects.filter(
        fecha_hora__gte=current_month,
        estado='completada'
    ).count()

    # Calificación promedio
    avg_rating = Survey.objects.aggregate(Avg('calificacion'))['calificacion__avg'] or 0

    # Citas recientes (últimas 10)
    recent_appointments_qs = Appointment.objects.select_related(
        'cliente__user', 'barbero__user', 'servicio'
    ).prefetch_related('productos').order_by('-fecha_hora')[:10]

    recent_appointments = []
    for appointment in recent_appointments_qs:
        cliente_user = appointment.cliente.user if appointment.cliente and appointment.cliente.user else None
        cliente_nombre = (
            f"{cliente_user.first_name} {cliente_user.last_name}".strip()
            if cliente_user
            else appointment.nombre_cliente or 'Cliente'
        )
        barbero_user = appointment.barbero.user if appointment.barbero and appointment.barbero.user else None
        barbero_nombre = (
            f"{barbero_user.first_name} {barbero_user.last_name}".strip()
            if barbero_user
            else 'Barbero'
        )
        recent_appointments.append({
            'id': appointment.id,
            'cliente': cliente_nombre,
            'barbero': barbero_nombre,
            'servicio': appointment.servicio.nombre if appointment.servicio else '',
            'fecha_hora': appointment.fecha_hora,
            'estado': appointment.estado,
            'precio': float(appointment.servicio.precio) if appointment.servicio else None,
            'productos': [
                {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'precio': float(producto.precio),
                }
                for producto in appointment.productos.all()
            ],
        })

    stats = {
        'total_users': total_users,
        'total_clients': total_clients,
        'total_barbers': total_barbers,
        'total_services': total_services,
        'total_appointments': total_appointments,
        'completed_appointments': completed_appointments,
        'appointments_this_month': appointments_this_month,
        'average_rating': round(avg_rating, 1),
        'recent_appointments': recent_appointments
    }

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_data(request):
    """Obtener datos para el dashboard de administración"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    # Usuarios recientes (últimos 10)
    recent_users = CustomUser.objects.order_by('-date_joined')[:10].values(
        'id', 'username', 'email', 'rol', 'date_joined', 'is_active'
    )

    # Servicios más populares
    popular_services = Service.objects.filter(activo=True).annotate(
        appointment_count=Count('appointments')
    ).order_by('-appointment_count')[:5].values(
        'id', 'nombre', 'precio', 'duracion', 'appointment_count'
    )

    dashboard_data = {
        'recent_users': list(recent_users),
        'popular_services': list(popular_services)
    }

    return Response(dashboard_data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def admin_contenido_sitio(request):
    """Gestionar contenido del sitio web"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        # Obtener todo el contenido del sitio web
        content = WebsiteContent.objects.all().values(
            'id', 'tipo_contenido', 'contenido', 'activo'
        )
        return Response(list(content))

    elif request.method == 'PUT':
        # Actualizar contenido
        updates = request.data
        if not isinstance(updates, list):
            updates = [updates]

        for update in updates:
            tipo_contenido = update.get('tipo_contenido')
            contenido = update.get('contenido')

            if tipo_contenido and contenido is not None:
                WebsiteContent.objects.filter(tipo_contenido=tipo_contenido).update(
                    contenido=contenido
                )

        return Response({'message': 'Contenido actualizado correctamente'})


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_users_management(request, user_id=None):
    """Gestionar usuarios desde el panel de administración"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        def build_whatsapp_link(phone: str | None) -> str | None:
            if not phone:
                return None
            digits = ''.join(ch for ch in phone if ch.isdigit())
            if not digits:
                return None
            return f"https://wa.me/{digits}?text=Hola,%20te%20saludamos%20desde%20Barber%C3%ADa%20Elite"

        def build_user_payload(user: CustomUser) -> dict:
            client_profile = getattr(user, 'client_profile', None)
            barber_profile = getattr(user, 'barber_profile', None)
            last_visit_iso = None

            if client_profile and client_profile.fecha_ultimo_corte:
                fecha = client_profile.fecha_ultimo_corte
                if timezone.is_naive(fecha):
                    fecha = timezone.make_aware(fecha)
                last_visit_iso = timezone.localtime(fecha).isoformat()

            payload = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol,
                'telefono': user.telefono,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'fecha_nacimiento': user.fecha_nacimiento.isoformat() if user.fecha_nacimiento else None,
                'last_visit': last_visit_iso,
                'whatsapp_link': build_whatsapp_link(user.telefono),
            }

            if user.rol == 'barbero' and barber_profile:
                today = timezone.localdate()
                citas_dia = Appointment.objects.filter(
                    barbero=barber_profile,
                    estado='completada',
                    fecha_hora__date=today,
                )
                citas_mes = Appointment.objects.filter(
                    barbero=barber_profile,
                    estado='completada',
                    fecha_hora__year=today.year,
                    fecha_hora__month=today.month,
                )

                total_dia = citas_dia.count()
                total_mes = citas_mes.count()
                comision_dia = citas_dia.aggregate(total=Sum('servicio__comision_barbero'))['total'] or 0
                comision_mes = citas_mes.aggregate(total=Sum('servicio__comision_barbero'))['total'] or 0

                payload['barber_summary'] = {
                    'cortes_dia': total_dia,
                    'cortes_mes': total_mes,
                    'comision_dia': float(comision_dia),
                    'comision_mes': float(comision_mes),
                }

            return payload

        if user_id:
            # Obtener un usuario específico
            try:
                user = CustomUser.objects.select_related('client_profile', 'barber_profile').get(id=user_id)
            except CustomUser.DoesNotExist:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
            return Response(build_user_payload(user))

        users = (
            CustomUser.objects.all()
            .select_related('client_profile', 'barber_profile')
        )
        data = [build_user_payload(user) for user in users]
        return Response(data)

    elif request.method == 'POST':
        # Crear nuevo usuario
        data = request.data
        try:
            fecha_nacimiento = data.get('fecha_nacimiento') or None
            rol = data.get('rol', 'cliente')
            user = CustomUser.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                rol=rol,
                telefono=data.get('telefono', ''),
                fecha_nacimiento=fecha_nacimiento
            )
            
            # Crear perfil automáticamente según el rol
            if rol == 'barbero':
                BarberProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'especialidad': 'Cortes clásicos y modernos',
                        'biografia': f'Barbero profesional - {user.first_name} {user.last_name}'.strip(),
                        'activo': True,
                        'qr_token': str(uuid.uuid4())
                    }
                )
            elif rol == 'cliente':
                ClientProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'cortes_realizados': 0,
                        'cortes_para_promocion': 5,
                    }
                )
            
            return Response({'message': 'Usuario creado correctamente', 'id': user.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PUT':
        # Actualizar usuario
        if not user_id:
            return Response({'error': 'ID de usuario requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(id=user_id)
            data = request.data
            old_rol = user.rol

            # Actualizar campos permitidos
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            if 'telefono' in data:
                user.telefono = data['telefono']
            if 'rol' in data:
                user.rol = data['rol']
            if 'is_active' in data:
                user.is_active = data['is_active']
            if 'fecha_nacimiento' in data:
                value = data['fecha_nacimiento']
                user.fecha_nacimiento = value or None

            user.save()
            
            # Si cambió a rol barbero, crear perfil si no existe
            new_rol = data.get('rol', old_rol)
            if new_rol == 'barbero' and not BarberProfile.objects.filter(user=user).exists():
                BarberProfile.objects.create(
                    user=user,
                    especialidad='Cortes clásicos y modernos',
                    biografia=f'Barbero profesional - {user.first_name} {user.last_name}'.strip(),
                    activo=True,
                    qr_token=str(uuid.uuid4())
                )
            # Si cambió a rol cliente, crear perfil si no existe
            elif new_rol == 'cliente' and not ClientProfile.objects.filter(user=user).exists():
                ClientProfile.objects.create(
                    user=user,
                    cortes_realizados=0,
                    cortes_para_promocion=5,
                )
            
            return Response({'message': 'Usuario actualizado correctamente'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        # Eliminar usuario
        if not user_id:
            return Response({'error': 'ID de usuario requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(id=user_id)
            user.delete()
            return Response({'message': 'Usuario eliminado correctamente'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_services_management(request, service_id=None):
    """Gestionar servicios desde el panel de administración"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        if service_id:
            # Obtener un servicio específico
            try:
                service = Service.objects.get(id=service_id)
                return Response({
                    'id': service.id,
                    'nombre': service.nombre,
                    'descripcion': service.descripcion,
                    'precio': str(service.precio),
                    'comision_barbero': str(service.comision_barbero),
                    'duracion': service.duracion,
                    'activo': service.activo
                })
            except Service.DoesNotExist:
                return Response({'error': 'Servicio no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Listar todos los servicios
            services = Service.objects.all().values(
                'id', 'nombre', 'descripcion', 'precio', 'comision_barbero', 'duracion', 'activo'
            )
            return Response(list(services))

    elif request.method == 'POST':
        # Crear nuevo servicio
        data = request.data
        try:
            service = Service.objects.create(
                nombre=data['nombre'],
                descripcion=data['descripcion'],
                precio=data['precio'],
                duracion=data['duracion'],
                comision_barbero=data.get('comision_barbero', 0),
                activo=data.get('activo', True)
            )
            return Response({'message': 'Servicio creado correctamente', 'id': service.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PUT':
        # Actualizar servicio
        if not service_id:
            return Response({'error': 'ID de servicio requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
            data = request.data

            # Actualizar campos
            if 'nombre' in data:
                service.nombre = data['nombre']
            if 'descripcion' in data:
                service.descripcion = data['descripcion']
            if 'precio' in data:
                service.precio = data['precio']
            if 'comision_barbero' in data:
                service.comision_barbero = data['comision_barbero']
            if 'duracion' in data:
                service.duracion = data['duracion']
            if 'activo' in data:
                service.activo = data['activo']

            service.save()
            return Response({'message': 'Servicio actualizado correctamente'})
        except Service.DoesNotExist:
            return Response({'error': 'Servicio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        # Eliminar servicio
        if not service_id:
            return Response({'error': 'ID de servicio requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
            service.delete()
            return Response({'message': 'Servicio eliminado correctamente'})
        except Service.DoesNotExist:
            return Response({'error': 'Servicio no encontrado'}, status=status.HTTP_404_NOT_FOUND)


# Endpoints para códigos QR de barberos
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_barber_qr(request, barbero_id):
    """Obtener información del QR de un barbero"""
    if request.user.rol not in ['admin', 'barbero']:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        barbero = BarberProfile.objects.get(id=barbero_id)
    except BarberProfile.DoesNotExist:
        return Response({'error': 'Barbero no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Si es barbero, solo puede ver su propio QR
    if request.user.rol == 'barbero':
        try:
            barbero_profile = BarberProfile.objects.get(user=request.user)
            if barbero.id != barbero_profile.id:
                return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        except BarberProfile.DoesNotExist:
            return Response({'error': 'Perfil de barbero no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    from django.conf import settings
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    qr_url = f"{frontend_url}/encuesta/qr/{barbero.qr_token}" if barbero.qr_token else None
    
    return Response({
        'barbero_id': barbero.id,
        'barbero_nombre': f"{barbero.user.first_name} {barbero.user.last_name}".strip() or barbero.user.username,
        'qr_token': barbero.qr_token,
        'qr_url': qr_url
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def scan_qr_code(request, qr_token):
    """Obtener información de una cita mediante el código QR del barbero"""
    try:
        barbero = BarberProfile.objects.get(qr_token=qr_token, activo=True)
    except BarberProfile.DoesNotExist:
        return Response({'error': 'Código QR inválido'}, status=status.HTTP_404_NOT_FOUND)
    
    # Obtener la última cita completada del barbero que no tenga encuesta
    # Esto se usará cuando el cliente escanee el QR después de su cita
    return Response({
        'barbero': {
            'id': barbero.id,
            'nombre': f"{barbero.user.first_name} {barbero.user.last_name}".strip() or barbero.user.username
        },
        'mensaje': 'Por favor inicia sesión para calificar tu cita'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_survey_by_qr(request, qr_token):
    """Obtener la cita pendiente de encuesta del cliente autenticado mediante QR"""
    if request.user.rol != 'cliente':
        return Response({'error': 'Solo para clientes'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        barbero = BarberProfile.objects.get(qr_token=qr_token, activo=True)
    except BarberProfile.DoesNotExist:
        return Response({'error': 'Código QR inválido'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        cliente_profile = ClientProfile.objects.get(user=request.user)
    except ClientProfile.DoesNotExist:
        return Response({'error': 'Perfil de cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Buscar la última cita completada del cliente con este barbero que no tenga encuesta
    cita_pendiente = Appointment.objects.filter(
        cliente=cliente_profile,
        barbero=barbero,
        estado='completada',
        encuesta_completada=False
    ).order_by('-fecha_hora').first()
    
    if not cita_pendiente:
        return Response({
            'error': 'No tienes citas pendientes de calificación con este barbero',
            'tiene_cita_pendiente': False
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'tiene_cita_pendiente': True,
        'cita': {
            'id': cita_pendiente.id,
            'fecha_hora': cita_pendiente.fecha_hora,
            'servicio': cita_pendiente.servicio.nombre,
            'barbero': f"{barbero.user.first_name} {barbero.user.last_name}".strip() or barbero.user.username,
            'encuesta_token': cita_pendiente.survey_token
        }
    })


# Endpoints para alertas de admin
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_appointment_alerts(request):
    """Obtener alertas de nuevas citas para el admin"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)
    
    # Solo mostrar alertas para citas activas (no completadas ni canceladas)
    from django.utils import timezone
    alerts = AppointmentAlert.objects.filter(
        mensaje_enviado=False,
        appointment__estado__in=['pendiente', 'agendada', 'confirmada', 'en_progreso'],
        appointment__fecha_hora__gte=timezone.now() - timedelta(days=1)  # Solo citas futuras o del último día
    ).select_related(
        'appointment__cliente__user',
        'appointment__barbero__user',
        'appointment__servicio'
    ).order_by('-fecha_creacion')
    
    alerts_data = []
    for alert in alerts:
        appointment = alert.appointment
        cliente_nombre = ''
        if appointment.cliente and appointment.cliente.user:
            cliente_nombre = appointment.cliente.user.get_full_name() or appointment.cliente.user.username
        else:
            cliente_nombre = appointment.nombre_cliente or 'Cliente'
        
        alerts_data.append({
            'id': alert.id,
            'appointment_id': appointment.id,
            'cliente_nombre': cliente_nombre,
            'cliente_telefono': appointment.telefono_cliente,
            'barbero': f"{appointment.barbero.user.first_name} {appointment.barbero.user.last_name}".strip() or appointment.barbero.user.username,
            'servicio': appointment.servicio.nombre,
            'fecha_hora': appointment.fecha_hora,
            'whatsapp_url': alert.whatsapp_url,
            'fecha_creacion': alert.fecha_creacion
        })
    
    return Response(alerts_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_alert_as_sent(request, alert_id):
    """Marcar una alerta como enviada (cuando el admin hace clic en WhatsApp)"""
    if request.user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.utils import timezone
    
    try:
        alert = AppointmentAlert.objects.get(id=alert_id)
    except AppointmentAlert.DoesNotExist:
        return Response({'error': 'Alerta no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    alert.mensaje_enviado = True
    alert.fecha_envio = timezone.now()
    alert.save()
    
    return Response({'message': 'Alerta marcada como enviada'})
