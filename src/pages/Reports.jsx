import { useState, useMemo } from 'react'
import Header from '../components/Header'
import { useBots } from '../context/BotsContext'
import { getActionsReport, getUTMReport, getBounceReport, getSessionsReport } from '../services/dataService'
import { BarChart3, TrendingUp, Users, XCircle, Clock, Link as LinkIcon } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('actions')
  const { bots } = useBots()

  // Получаем данные из всех ботов
  const actionsData = useMemo(() => {
    const allActions = {}
    bots.forEach(bot => {
      const botActions = getActionsReport(bot.id, 7)
      botActions.forEach(action => {
        if (!allActions[action.name]) {
          allActions[action.name] = { name: action.name, users: 0, requests: 0 }
        }
        allActions[action.name].users += action.users
        allActions[action.name].requests += action.requests
      })
    })
    return Object.values(allActions).sort((a, b) => b.requests - a.requests)
  }, [bots])

  const utmData = useMemo(() => {
    const allUTM = {}
    bots.forEach(bot => {
      const botUTM = getUTMReport(bot.id)
      botUTM.forEach(utm => {
        if (!allUTM[utm.source]) {
          allUTM[utm.source] = { source: utm.source, users: 0, conversions: 0 }
        }
        allUTM[utm.source].users += utm.users
        allUTM[utm.source].conversions += utm.conversions
      })
    })
    return Object.values(allUTM)
  }, [bots])

  const bounceData = useMemo(() => {
    const allBounce = {}
    bots.forEach(bot => {
      const botBounce = getBounceReport(bot.id)
      botBounce.forEach(bounce => {
        if (!allBounce[bounce.channel]) {
          allBounce[bounce.channel] = { channel: bounce.channel, total: 0, bounced: 0 }
        }
        allBounce[bounce.channel].total += bounce.total
        allBounce[bounce.channel].bounced += bounce.bounced
      })
    })
    return Object.values(allBounce).map(stat => ({
      ...stat,
      rate: stat.total > 0 ? parseFloat((stat.bounced / stat.total * 100).toFixed(1)) : 0,
    }))
  }, [bots])

  const sessionData = useMemo(() => {
    const dayStats = {
      'Пн': { avgDuration: 0, avgActions: 0, count: 0 },
      'Вт': { avgDuration: 0, avgActions: 0, count: 0 },
      'Ср': { avgDuration: 0, avgActions: 0, count: 0 },
      'Чт': { avgDuration: 0, avgActions: 0, count: 0 },
      'Пт': { avgDuration: 0, avgActions: 0, count: 0 },
      'Сб': { avgDuration: 0, avgActions: 0, count: 0 },
      'Вс': { avgDuration: 0, avgActions: 0, count: 0 },
    }
    
    bots.forEach(bot => {
      const botSessions = getSessionsReport(bot.id, 7)
      botSessions.forEach(day => {
        if (dayStats[day.day]) {
          dayStats[day.day].count++
          dayStats[day.day].avgDuration += parseFloat(day.avgDuration) || 0
          dayStats[day.day].avgActions += parseFloat(day.avgActions) || 0
        }
      })
    })
    
    return Object.keys(dayStats).map(day => ({
      day,
      avgDuration: dayStats[day].count > 0 
        ? parseFloat((dayStats[day].avgDuration / dayStats[day].count).toFixed(1))
        : 0,
      avgActions: dayStats[day].count > 0
        ? parseFloat((dayStats[day].avgActions / dayStats[day].count).toFixed(1))
        : 0,
    }))
  }, [bots])

  const COLORS = ['#22c55e', '#16a34a', '#15803d', '#f59e0b', '#10b981']

  const tabs = [
    { id: 'actions', name: 'Действия', icon: BarChart3 },
    { id: 'utm', name: 'UTM-отчет', icon: LinkIcon },
    { id: 'bounce', name: 'Отказы', icon: XCircle },
    { id: 'sessions', name: 'Сессии', icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-dark-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Отчеты</h1>
          <p className="text-gray-400">Детальная аналитика по различным метрикам</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-dark-300">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-dark-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Actions Report */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Отчет о действиях</h3>
              <p className="text-gray-400 mb-6">
                Узнайте какие команды наиболее востребованы и сколько уникальных пользователей
                использует конкретную команду
              </p>
              {actionsData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p>Данных пока нет</p>
                    <p className="text-sm mt-2">Данные появятся после подключения ботов</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={actionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ color: '#9ca3af' }} />
                    <Bar dataKey="users" fill="#22c55e" name="Уникальные пользователи" />
                    <Bar dataKey="requests" fill="#16a34a" name="Всего запросов" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* UTM Report */}
        {activeTab === 'utm' && (
          <div className="space-y-6">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Отчет о источниках трафика (UTM-отчет)</h3>
              <p className="text-gray-400 mb-6">
                Отслеживайте какой канал приводит больше трафика и считайте эффективность
                маркетинга
              </p>
              {utmData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <LinkIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p>Данных пока нет</p>
                    <p className="text-sm mt-2">Данные появятся после подключения ботов</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utmData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
                      <XAxis dataKey="source" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ color: '#9ca3af' }} />
                      <Bar dataKey="users" fill="#22c55e" name="Пользователи" />
                      <Bar dataKey="conversions" fill="#16a34a" name="Конверсии" />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={utmData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="users"
                      >
                        {utmData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bounce Report */}
        {activeTab === 'bounce' && (
          <div className="space-y-6">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Отчет об отказах</h3>
              <p className="text-gray-400 mb-6">
                Узнайте какой процент пользователей не продвигается дальше стартового сообщения
              </p>
              {bounceData.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p>Данных пока нет</p>
                    <p className="text-sm mt-2">Данные появятся после подключения ботов</p>
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={bounceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
                      <XAxis dataKey="channel" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ color: '#9ca3af' }} />
                      <Bar dataKey="total" fill="#22c55e" name="Всего пользователей" />
                      <Bar dataKey="bounced" fill="#ef4444" name="Отказы" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {bounceData.map((item, index) => (
                      <div key={index} className="bg-dark-300 border border-dark-400 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">{item.channel}</div>
                        <div className="text-2xl font-bold text-gray-100">{item.rate}%</div>
                        <div className="text-xs text-gray-500">Процент отказов</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Sessions Report */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">Отчет о сессиях</h3>
              <p className="text-gray-400 mb-6">
                Узнайте как часто пользователи пользуются вашим ботом и сколько действий
                совершают за один сеанс
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#37403a" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis yAxisId="left" stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#323b35', border: '1px solid #37403a', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="#22c55e"
                    name="Средняя длительность (мин)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgActions"
                    stroke="#16a34a"
                    name="Среднее кол-во действий"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports

