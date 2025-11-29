'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Scissors, 
  Calendar, 
  DollarSign, 
  Star,
  Clock
} from 'lucide-react'
import axios from 'axios'

interface Stat {
  label: string
  value: string | number
  change: number
  icon: any
  color: string
}

interface MonthlyData {
  month: string
  appointments: number
  revenue: number
}

export default function AdvancedStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get('http://localhost:8000/api/admin/estadisticas-generales/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setStats(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay estadísticas disponibles</p>
      </div>
    )
  }

  const keyStats: Stat[] = [
    {
      label: 'Total Usuarios',
      value: stats.total_users,
      change: 12.5,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Citas Este Mes',
      value: stats.appointments_this_month,
      change: 8.2,
      icon: Calendar,
      color: 'purple'
    },
    {
      label: 'Servicios Activos',
      value: stats.total_services,
      change: 0,
      icon: Scissors,
      color: 'green'
    },
    {
      label: 'Calificación Promedio',
      value: stats.average_rating,
      change: 2.1,
      icon: Star,
      color: 'yellow'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const completionRate = stats.total_appointments > 0 
    ? ((stats.completed_appointments / stats.total_appointments) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-8">
      {/* Filtro de rango temporal */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Estadísticas Avanzadas</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timeRange === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timeRange === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timeRange === 'year'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Año
          </button>
        </div>
      </div>

      {/* Tarjetas de KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${getColorClasses(stat.color)} rounded-full p-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.change !== 0 && (
                <div className={`flex items-center text-sm font-medium ${
                  stat.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos y métricas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasa de completitud */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Tasa de Completitud</h4>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                  Citas Completadas
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-primary-600">
                  {completionRate}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
              <div
                style={{ width: `${completionRate}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{stats.completed_appointments} completadas</span>
              <span>{stats.total_appointments} totales</span>
            </div>
          </div>
        </div>

        {/* Distribución de usuarios */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Usuarios</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Clientes</span>
                <span className="text-sm font-semibold text-gray-900">{stats.total_clients}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.total_clients / stats.total_users * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Barberos</span>
                <span className="text-sm font-semibold text-gray-900">{stats.total_barbers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.total_barbers / stats.total_users * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Administradores</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.total_users - stats.total_clients - stats.total_barbers}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((stats.total_users - stats.total_clients - stats.total_barbers) / stats.total_users * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de rendimiento */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Métricas de Rendimiento</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.appointments_this_month}
            </div>
            <div className="text-sm text-gray-600">Citas Este Mes</div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.average_rating}
            </div>
            <div className="text-sm text-gray-600">Calificación Promedio</div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.total_services}
            </div>
            <div className="text-sm text-gray-600">Servicios Activos</div>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow p-6 text-white">
        <h4 className="text-lg font-semibold mb-4">Resumen del Periodo</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-primary-200 text-sm mb-1">Tasa de Crecimiento</p>
            <p className="text-2xl font-bold">+12.5%</p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">Retención de Clientes</p>
            <p className="text-2xl font-bold">89%</p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">Satisfacción</p>
            <p className="text-2xl font-bold">{stats.average_rating}/5.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

