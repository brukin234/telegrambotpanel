import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useBots } from '../context/BotsContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { getUsers, getEvents } from '../services/dataService'
import { Users, TrendingUp, MessageSquare } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7d')
  const [activeBarIndex, setActiveBarIndex] = useState(null)
  const { bots } = useBots()
  const { t } = useLanguage()
  const { theme } = useTheme()
  
  // Цвета для графиков в зависимости от темы
  const chartColors = theme === 'blue' ? {
    primary: '#3b82f6', // blue-500
    primaryLight: '#60a5fa', // blue-400
    primaryDark: '#2563eb', // blue-600
    secondary: '#4ade80', // green-400 (для второго графика)
  } : theme === 'white' ? {
    primary: '#6b7280', // gray-500
    primaryLight: '#9ca3af', // gray-400
    primaryDark: '#4b5563', // gray-600
    secondary: '#9ca3af', // gray-400
  } : {
    primary: '#22c55e', // green-500
    primaryLight: '#4ade80', // green-400
    primaryDark: '#16a34a', // green-600
    secondary: '#4ade80', // green-400
  }

  // Вычисляем общую статистику из всех ботов
  const totalStats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Определяем период для фильтрации
    let startDate = new Date()
    if (timeRange === '1d') {
      startDate.setDate(startDate.getDate() - 1)
    } else if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30)
    } else if (timeRange === '90d') {
      startDate.setDate(startDate.getDate() - 90)
    }
    startDate.setHours(0, 0, 0, 0)
    
    // Подсчитываем новых пользователей за период
    let newUsersInPeriod = 0
    let totalMessages = 0
    
    bots.forEach(bot => {
      const users = getUsers(bot.id)
      newUsersInPeriod += users.filter(user => {
        if (!user.firstSeen) return false
        const firstSeen = new Date(user.firstSeen)
        firstSeen.setHours(0, 0, 0, 0)
        return firstSeen.getTime() >= startDate.getTime()
      }).length
      
      // Подсчитываем сообщения за период
      const events = getEvents(bot.id, { startDate: startDate.toISOString() })
      totalMessages += events.filter(e => e.type === 'message' || (e.data?.text && !e.action?.startsWith('/'))).length
    })
    
    return bots.reduce(
      (acc, bot) => ({
        totalUsers: acc.totalUsers + (bot.stats?.totalUsers || 0),
        newUsersInPeriod: newUsersInPeriod,
        totalMessages: totalMessages,
      }),
      { totalUsers: 0, newUsersInPeriod: 0, totalMessages: 0 }
    )
  }, [bots, timeRange])

  // Данные для графиков
  const chartData = useMemo(() => {
    const days = []
    const today = new Date()
    
    // Определяем количество дней для графика
    let daysCount = 7
    if (timeRange === '1d') {
      daysCount = 1
    } else if (timeRange === '7d') {
      daysCount = 7
    } else if (timeRange === '30d') {
      daysCount = 30
    } else if (timeRange === '90d') {
      daysCount = 90
    }
    
    // Создаем массив дней
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
      
      // Подсчитываем пользователей и сообщения за этот день
      let usersCount = 0
      let messagesCount = 0
      
      bots.forEach(bot => {
        const users = getUsers(bot.id)
        usersCount += users.filter(user => {
          if (!user.firstSeen) return false
          const firstSeen = new Date(user.firstSeen)
          firstSeen.setHours(0, 0, 0, 0)
          return firstSeen.getTime() === date.getTime()
        }).length
        
        const events = getEvents(bot.id, { 
          startDate: date.toISOString(),
          endDate: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString()
        })
        messagesCount += events.filter(e => e.type === 'message' || (e.data?.text && !e.action?.startsWith('/'))).length
      })
      
      days.push({
        date: dateStr,
        users: usersCount,
        messages: messagesCount,
      })
    }
    
    return days
  }, [bots, timeRange])

  const stats = [
    {
      name: t('newUsers'),
      value: totalStats.newUsersInPeriod.toLocaleString(),
      change: timeRange === '1d' ? t('today') : timeRange === '7d' ? t('days7') : timeRange === '30d' ? t('days30') : t('days90'),
      trend: 'neutral',
      icon: Users,
      color: 'green',
    },
    {
      name: t('totalUsers'),
      value: totalStats.totalUsers.toLocaleString(),
      change: t('allTime'),
      trend: 'neutral',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      name: t('messages'),
      value: totalStats.totalMessages.toLocaleString(),
      change: timeRange === '1d' ? t('today') : timeRange === '7d' ? t('days7') : timeRange === '30d' ? t('days30') : t('days90'),
      trend: 'neutral',
      icon: MessageSquare,
      color: 'purple',
    },
  ]

  return (
    <div className="min-h-screen bg-dark-50 page-transition">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('dashboardTitle')}</h1>
          <p className="text-gray-400">{t('dashboardDescription')}</p>
        </div>

        {bots.length === 0 && (
          <div className="mb-8 bg-primary-900/30 border border-primary-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1">
                  {t('addFirstBot')}
                </h3>
                <p className="text-gray-400">
                  {t('addFirstBotText')}
                </p>
              </div>
              <Link
                to="/bots"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors btn-glow btn-glow-primary"
              >
                {t('addBot')}
              </Link>
            </div>
          </div>
        )}

        {/* Time Range Selector */}
        <div className="mb-6 flex space-x-2">
          {['1d', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-200 text-gray-300 hover:bg-dark-300'
              }`}
            >
              {range === '1d' ? t('today') : range === '7d' ? t('days7') : range === '30d' ? t('days30') : t('days90')}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              blue: 'bg-primary-900/50 text-primary-400',
              purple: 'bg-primary-800/50 text-primary-300',
              green: 'bg-primary-700/50 text-primary-400',
              orange: 'bg-orange-900/50 text-orange-400',
            }
            return (
              <div key={index} className="bg-dark-200 rounded-xl shadow-md p-6 border border-dark-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${colorClasses[stat.color]} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-gray-400">
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-400">{stat.name}</p>
              </div>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Новые пользователи */}
          <div className="bg-dark-200 rounded-xl shadow-md p-6 border border-dark-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-100">{t('newUsersChart')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px', color: '#9ca3af' }}
                  formatter={(value, name) => {
                    if (name === 'users') return [value, t('newUsersChart')]
                    return [value, name]
                  }}
                />
                <Area type="monotone" dataKey="users" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Сообщения */}
          <div className="bg-dark-200 rounded-xl shadow-md p-6 border border-dark-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-100">{t('messagesChart')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                onMouseLeave={() => setActiveBarIndex(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px', color: '#9ca3af' }}
                  formatter={(value, name) => {
                    if (name === 'messages') return [value, t('messagesChart')]
                    return [value, name]
                  }}
                />
                <Bar 
                  dataKey="messages" 
                  fill={chartColors.primaryDark} 
                  radius={[8, 8, 0, 0]}
                  onMouseEnter={(_, index) => setActiveBarIndex(index)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`messages-${index}`}
                      fill={index === activeBarIndex ? chartColors.primary : chartColors.primaryDark}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Общий график */}
        <div className="bg-dark-200 rounded-xl shadow-md p-6 border border-dark-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">{t('activity')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px', color: '#9ca3af' }}
                formatter={(value, name) => {
                  if (name === 'users') return [value, t('newUsersChart')]
                  if (name === 'messages') return [value, t('messagesChart')]
                  return [value, name]
                }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="users"
                stroke={chartColors.primary}
                strokeWidth={2}
                name={t('newUsersChart')}
                dot={{ fill: chartColors.primary, r: 4 }}
                activeDot={{ r: 6, fill: chartColors.primary }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="messages"
                stroke={chartColors.secondary}
                strokeWidth={2}
                name={t('messagesChart')}
                dot={{ fill: chartColors.secondary, r: 4 }}
                activeDot={{ r: 6, fill: chartColors.secondary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

