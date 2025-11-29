from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count, Q
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime, timedelta
from .models import CustomUser, ClientProfile, BarberProfile, Service, Appointment, Survey, WebsiteContent, Testimonial, GalleryImage, SystemSettings, PageSection
from .serializers import (
    CustomUserSerializer, ClientProfileSerializer, BarberProfileSerializer,
    ServiceSerializer, AppointmentSerializer, SurveySerializer, WebsiteContentSerializer,
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


class AppointmentViewSet(viewsets.ModelViewSet):
    """ViewSet para citas"""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'cliente':
            return Appointment.objects.filter(cliente__user=user)
        elif user.rol == 'barbero':
            return Appointment.objects.filter(barbero__user=user)
        return Appointment.objects.all()

    def perform_create(self, serializer):
        """Crear cita y actualizar contador de cortes del cliente"""
        appointment = serializer.save()

        # Si la cita se marca como completada, incrementar cortes del cliente
        if appointment.estado == 'completada':
            cliente = appointment.cliente
            cliente.cortes_realizados += 1
            cliente.fecha_ultimo_corte = timezone.now()
            cliente.save()


class SurveyViewSet(viewsets.ModelViewSet):
    """ViewSet para encuestas"""
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'cliente':
            return Survey.objects.filter(appointment__cliente__user=user)
        return Survey.objects.all()


class WebsiteContentViewSet(viewsets.ModelViewSet):
    """ViewSet para contenido del sitio web"""
    queryset = WebsiteContent.objects.filter(activo=True)
    serializer_class = WebsiteContentSerializer
    permission_classes = [AllowAny]


class TestimonialViewSet(viewsets.ModelViewSet):
    """ViewSet para testimonios"""
    queryset = Testimonial.objects.filter(activo=True)
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]


class GalleryImageViewSet(viewsets.ModelViewSet):
    """ViewSet para imágenes de galería"""
    queryset = GalleryImage.objects.filter(activo=True)
    serializer_class = GalleryImageSerializer
    permission_classes = [AllowAny]


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
                'cliente': comentario.appointment.cliente.user.get_full_name(),
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
@permission_classes([IsAuthenticated])
def get_available_slots(request):
    """Obtener horarios disponibles para una fecha y servicio específico"""
    fecha_str = request.GET.get('fecha')
    servicio_id = request.GET.get('servicio_id')
    barbero_id = request.GET.get('barbero_id')

    if not all([fecha_str, servicio_id]):
        return Response({'error': 'Fecha y servicio son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Formato de fecha inválido'}, status=status.HTTP_400_BAD_REQUEST)

    # Obtener servicio
    servicio = get_object_or_404(Service, id=servicio_id)

    # Obtener barbero(s)
    if barbero_id:
        barberos = BarberProfile.objects.filter(id=barbero_id, activo=True)
    else:
        barberos = BarberProfile.objects.filter(activo=True)

    horarios_disponibles = []
    for barbero in barberos:
        # Verificar día laboral
        dia_semana = fecha.strftime('%A').lower()
        if dia_semana not in [d.lower() for d in barbero.dias_laborales]:
            continue

        # Obtener citas existentes
        citas_del_dia = Appointment.objects.filter(
            barbero=barbero,
            fecha_hora__date=fecha,
            estado__in=['agendada', 'confirmada']
        )

        horarios = calcular_horarios_disponibles(barbero, fecha, citas_del_dia, servicio_id)
        horarios_disponibles.extend(horarios)

    return Response({
        'fecha': fecha_str,
        'servicio': servicio.nombre,
        'horarios_disponibles': horarios_disponibles
    })


def calcular_horarios_disponibles(barbero, fecha, citas_existentes, servicio_id=None):
    """Calcular horarios disponibles para un barbero en una fecha específica"""
    horarios_disponibles = []

    # Obtener servicio para calcular duración
    if servicio_id:
        servicio = Service.objects.get(id=servicio_id)
        duracion_servicio = servicio.duracion
    else:
        duracion_servicio = 60  # Duración por defecto

    # Crear lista de horarios ocupados
    horarios_ocupados = []
    for cita in citas_existentes:
        inicio = cita.fecha_hora.time()
        fin = (cita.fecha_hora + timedelta(minutes=cita.servicio.duracion)).time()
        horarios_ocupados.append((inicio, fin))

    # Generar horarios disponibles en el día laboral del barbero
    hora_actual = barbero.horario_inicio
    hora_fin = barbero.horario_fin

    while hora_actual < hora_fin:
        hora_fin_slot = (datetime.combine(timezone.now().date(), hora_actual) +
                        timedelta(minutes=duracion_servicio)).time()

        # Verificar si el slot está disponible
        slot_libre = True
        for ocupado_inicio, ocupado_fin in horarios_ocupados:
            if not (hora_fin_slot <= ocupado_inicio or hora_actual >= ocupado_fin):
                slot_libre = False
                break

        if slot_libre and hora_fin_slot <= hora_fin:
            horarios_disponibles.append({
                'hora': hora_actual.strftime('%H:%M'),
                'disponible': True
            })

        hora_actual = (datetime.combine(timezone.now().date(), hora_actual) +
                      timedelta(minutes=30)).time()  # Intervalos de 30 minutos

    return horarios_disponibles


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
    recent_appointments = Appointment.objects.select_related(
        'cliente__user', 'barbero__user', 'servicio'
    ).order_by('-fecha_hora')[:10].values(
        'id',
        'cliente__user__first_name',
        'cliente__user__last_name',
        'barbero__user__first_name',
        'barbero__user__last_name',
        'servicio__nombre',
        'fecha_hora',
        'estado',
        'servicio__precio'
    )

    stats = {
        'total_users': total_users,
        'total_clients': total_clients,
        'total_barbers': total_barbers,
        'total_services': total_services,
        'total_appointments': total_appointments,
        'completed_appointments': completed_appointments,
        'appointments_this_month': appointments_this_month,
        'average_rating': round(avg_rating, 1),
        'recent_appointments': list(recent_appointments)
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
        if user_id:
            # Obtener un usuario específico
            try:
                user = CustomUser.objects.get(id=user_id)
                return Response({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'rol': user.rol,
                    'telefono': user.telefono,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined
                })
            except CustomUser.DoesNotExist:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Listar todos los usuarios
            users = CustomUser.objects.all().values(
                'id', 'username', 'email', 'first_name', 'last_name', 'rol', 'is_active', 'date_joined'
            )
            return Response(list(users))

    elif request.method == 'POST':
        # Crear nuevo usuario
        data = request.data
        try:
            user = CustomUser.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                rol=data.get('rol', 'cliente'),
                telefono=data.get('telefono', '')
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

            user.save()
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
                    'duracion': service.duracion,
                    'activo': service.activo
                })
            except Service.DoesNotExist:
                return Response({'error': 'Servicio no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Listar todos los servicios
            services = Service.objects.all().values(
                'id', 'nombre', 'descripcion', 'precio', 'duracion', 'activo'
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
    """ViewSet para imágenes de galería"""
    queryset = GalleryImage.objects.filter(activo=True)
    serializer_class = GalleryImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.rol == 'admin':
            return GalleryImage.objects.all()
        return GalleryImage.objects.filter(activo=True)


# Vistas de administración adicionales

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_stats(request):
    """Obtener estadísticas generales para el panel de administración"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    # Estadísticas generales
    total_users = CustomUser.objects.count()
    total_clients = ClientProfile.objects.count()
    total_barbers = BarberProfile.objects.filter(activo=True).count()
    total_services = Service.objects.filter(activo=True).count()
    total_appointments = Appointment.objects.count()
    completed_appointments = Appointment.objects.filter(estado='completada').count()

    # Estadísticas del mes actual
    fecha_actual = timezone.now()
    inicio_mes = fecha_actual.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    appointments_month = Appointment.objects.filter(fecha_hora__gte=inicio_mes).count()
    completed_month = Appointment.objects.filter(
        fecha_hora__gte=inicio_mes,
        estado='completada'
    ).count()

    # Calificación promedio
    avg_rating = Survey.objects.aggregate(Avg('calificacion'))['calificacion__avg'] or 0

    stats = {
        'total_users': total_users,
        'total_clients': total_clients,
        'total_barbers': total_barbers,
        'total_services': total_services,
        'total_appointments': total_appointments,
        'completed_appointments': completed_appointments,
        'appointments_this_month': appointments_month,
        'completed_this_month': completed_month,
        'average_rating': round(avg_rating, 1),
        'recent_appointments': Appointment.objects.order_by('-fecha_creacion')[:10].count(),
    }

    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_dashboard_data(request):
    """Obtener datos para el dashboard de administración"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    # Datos recientes
    recent_appointments = Appointment.objects.select_related(
        'cliente__user', 'barbero__user', 'servicio'
    ).order_by('-fecha_creacion')[:10]

    recent_users = CustomUser.objects.order_by('-date_joined')[:10]

    # Servicios más populares
    popular_services = Service.objects.filter(activo=True).annotate(
        appointment_count=Count('appointments')
    ).order_by('-appointment_count')[:5]

    dashboard_data = {
        'recent_appointments': [
            {
                'id': apt.id,
                'cliente': f"{apt.cliente.user.first_name} {apt.cliente.user.last_name}",
                'barbero': f"{apt.barbero.user.first_name} {apt.barbero.user.last_name}",
                'servicio': apt.servicio.nombre,
                'fecha_hora': apt.fecha_hora,
                'estado': apt.estado,
                'precio': apt.servicio.precio
            }
            for apt in recent_appointments
        ],
        'recent_users': [
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'rol': user.rol,
                'date_joined': user.date_joined,
                'is_active': user.is_active
            }
            for user in recent_users
        ],
        'popular_services': [
            {
                'id': service.id,
                'nombre': service.nombre,
                'precio': service.precio,
                'duracion': service.duracion,
                'appointment_count': service.appointment_count
            }
            for service in popular_services
        ]
    }

    return Response(dashboard_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_website_content(request):
    """Obtener todo el contenido del sitio web para administración"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    content = WebsiteContent.objects.filter(activo=True)
    serializer = WebsiteContentSerializer(content, many=True)

    return Response(serializer.data)


@api_view(['PUT', 'POST'])
@permission_classes([IsAuthenticated])
def update_website_content(request):
    """Actualizar contenido del sitio web"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        # Actualizar contenido existente
        for item in request.data:
            tipo_contenido = item.get('tipo_contenido')
            contenido = item.get('contenido')

            try:
                content_obj = WebsiteContent.objects.get(tipo_contenido=tipo_contenido)
                content_obj.contenido = contenido
                content_obj.save()
            except WebsiteContent.DoesNotExist:
                WebsiteContent.objects.create(
                    tipo_contenido=tipo_contenido,
                    contenido=contenido
                )

        return Response({'message': 'Contenido actualizado correctamente'})

    return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_gallery_images(request):
    """Obtener imágenes de galería para administración"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    images = GalleryImage.objects.all().order_by('orden', 'fecha_creacion')
    serializer = GalleryImageSerializer(images, many=True)

    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_gallery_image(request):
    """Subir nueva imagen a la galería"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    serializer = GalleryImageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_system_settings(request):
    """Obtener configuración del sistema"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    settings = SystemSettings.objects.all()
    serializer = SystemSettingsSerializer(settings, many=True)

    return Response(serializer.data)


@api_view(['PUT', 'POST'])
@permission_classes([IsAuthenticated])
def update_system_settings(request):
    """Actualizar configuración del sistema"""
    user = request.user
    if user.rol != 'admin':
        return Response({'error': 'Solo para administradores'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        for item in request.data:
            clave = item.get('clave')
            valor = item.get('valor')

            try:
                setting = SystemSettings.objects.get(clave=clave)
                setting.valor = valor
                setting.save()
            except SystemSettings.DoesNotExist:
                return Response(
                    {'error': f'Configuración {clave} no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response({'message': 'Configuración actualizada correctamente'})

    return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


# ViewSet para Secciones de Página
class PageSectionViewSet(viewsets.ModelViewSet):
    """ViewSet para secciones de página configurables"""
    queryset = PageSection.objects.all().order_by('orden')
    serializer_class = PageSectionSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        # Usuarios no autenticados solo ven secciones activas
        if not self.request.user.is_authenticated:
            return PageSection.objects.filter(activo=True).order_by('orden')
        
        # Admins ven todas las secciones
        if self.request.user.rol == 'admin':
            return PageSection.objects.all().order_by('orden')
        
        # Otros usuarios autenticados solo ven secciones activas
        return PageSection.objects.filter(activo=True).order_by('orden')


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_page_sections(request, section_id=None):
    """Vista para gestionar secciones de página desde el panel de admin"""
    # Verificar que el usuario es admin
    if request.user.rol != 'admin':
        return Response(
            {'error': 'No tienes permisos para gestionar secciones'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        if section_id:
            try:
                section = PageSection.objects.get(id=section_id)
                serializer = PageSectionSerializer(section)
                return Response(serializer.data)
            except PageSection.DoesNotExist:
                return Response(
                    {'error': 'Sección no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            sections = PageSection.objects.all().order_by('orden')
            serializer = PageSectionSerializer(sections, many=True)
            return Response(serializer.data)

    elif request.method == 'POST':
        serializer = PageSectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PUT':
        if not section_id:
            return Response(
                {'error': 'Se requiere el ID de la sección'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            section = PageSection.objects.get(id=section_id)
            serializer = PageSectionSerializer(section, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except PageSection.DoesNotExist:
            return Response(
                {'error': 'Sección no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

    elif request.method == 'DELETE':
        if not section_id:
            return Response(
                {'error': 'Se requiere el ID de la sección'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            section = PageSection.objects.get(id=section_id)
            section.delete()
            return Response({'message': 'Sección eliminada correctamente'})
        except PageSection.DoesNotExist:
            return Response(
                {'error': 'Sección no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
