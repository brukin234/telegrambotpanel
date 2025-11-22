// Сервис для работы с данными ботов
// Здесь хранится логика обработки и хранения данных

/**
 * Сохранить событие от бота
 */
export const saveEvent = (botId, event) => {
  try {
    const events = JSON.parse(localStorage.getItem(`botpanel_events_${botId}`) || '[]')
    const eventToSave = {
      ...event,
      id: event.id || Date.now().toString(),
      timestamp: event.timestamp || new Date().toISOString(),
    }
    events.push(eventToSave)
    // Храним только последние 10000 событий
    const recentEvents = events.slice(-10000)
    localStorage.setItem(`botpanel_events_${botId}`, JSON.stringify(recentEvents))
    return true
  } catch (error) {
    console.error('Error saving event:', error)
    return false
  }
}

/**
 * Добавить событие (алиас для saveEvent)
 */
export const addEvent = (botId, event) => {
  return saveEvent(botId, event)
}

/**
 * Удалить событие
 */
export const deleteEvent = (botId, eventId) => {
  try {
    const events = JSON.parse(localStorage.getItem(`botpanel_events_${botId}`) || '[]')
    const filtered = events.filter(e => e.id !== eventId && e.updateId !== eventId)
    localStorage.setItem(`botpanel_events_${botId}`, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting event:', error)
    return false
  }
}

/**
 * Удалить все события для пользователя
 */
export const deleteAllEventsForUser = (botId, userId) => {
  try {
    const events = JSON.parse(localStorage.getItem(`botpanel_events_${botId}`) || '[]')
    const filtered = events.filter(e => e.userId !== userId)
    localStorage.setItem(`botpanel_events_${botId}`, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting all events for user:', error)
    return false
  }
}

/**
 * Получить события бота
 */
export const getEvents = (botId, filters = {}) => {
  try {
    const events = JSON.parse(localStorage.getItem(`botpanel_events_${botId}`) || '[]')
    
    let filtered = events
    
    if (filters.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filters.startDate))
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(filters.endDate))
    }
    
    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type)
    }
    
    return filtered
  } catch (error) {
    console.error('Error getting events:', error)
    return []
  }
}

/**
 * Сохранить пользователя
 */
export const saveUser = (botId, userData) => {
  try {
    const users = JSON.parse(localStorage.getItem(`botpanel_users_${botId}`) || '[]')
    const existingIndex = users.findIndex(u => u.id === userData.id)
    
    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...userData,
        lastSeen: new Date().toISOString(),
      }
    } else {
      users.push({
        ...userData,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      })
    }
    
    localStorage.setItem(`botpanel_users_${botId}`, JSON.stringify(users))
    return true
  } catch (error) {
    console.error('Error saving user:', error)
    return false
  }
}

/**
 * Получить всех пользователей бота
 */
export const getUsers = (botId) => {
  try {
    return JSON.parse(localStorage.getItem(`botpanel_users_${botId}`) || '[]')
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

/**
 * Вычислить статистику бота
 */
export const calculateBotStats = (botId) => {
  try {
    const events = getEvents(botId)
    const users = getUsers(botId)
    
    // Уникальные пользователи за сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEvents = events.filter(e => new Date(e.timestamp) >= today)
    const todayUsers = new Set(todayEvents.map(e => e.userId))
    
    // Уникальные пользователи за неделю
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekEvents = events.filter(e => new Date(e.timestamp) >= weekAgo)
    const weekUsers = new Set(weekEvents.map(e => e.userId))
    
    // Уникальные пользователи за месяц
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const monthEvents = events.filter(e => new Date(e.timestamp) >= monthAgo)
    const monthUsers = new Set(monthEvents.map(e => e.userId))
    
    // Сессии (группировка событий по пользователям и времени)
    const sessions = calculateSessions(events)
    
    return {
      totalUsers: users.length,
      dau: todayUsers.size,
      wau: weekUsers.size,
      mau: monthUsers.size,
      totalEvents: events.length,
      totalSessions: sessions.length,
      revenue: 0, // Можно добавить логику расчета дохода
    }
  } catch (error) {
    console.error('Error calculating stats:', error)
    return {
      totalUsers: 0,
      dau: 0,
      wau: 0,
      mau: 0,
      totalEvents: 0,
      totalSessions: 0,
      revenue: 0,
    }
  }
}

/**
 * Вычислить сессии из событий
 */
const calculateSessions = (events) => {
  if (events.length === 0) return []
  
  // Группируем события по пользователям
  const userEvents = {}
  events.forEach(event => {
    if (!userEvents[event.userId]) {
      userEvents[event.userId] = []
    }
    userEvents[event.userId].push(event)
  })
  
  // Для каждого пользователя определяем сессии (разрыв > 30 минут = новая сессия)
  const sessions = []
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 минут
  
  Object.keys(userEvents).forEach(userId => {
    const userEventsSorted = userEvents[userId].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    )
    
    let currentSession = {
      userId,
      startTime: userEventsSorted[0].timestamp,
      endTime: userEventsSorted[0].timestamp,
      events: [userEventsSorted[0]],
    }
    
    for (let i = 1; i < userEventsSorted.length; i++) {
      const timeDiff = new Date(userEventsSorted[i].timestamp) - new Date(currentSession.endTime)
      
      if (timeDiff > SESSION_TIMEOUT) {
        sessions.push(currentSession)
        currentSession = {
          userId,
          startTime: userEventsSorted[i].timestamp,
          endTime: userEventsSorted[i].timestamp,
          events: [userEventsSorted[i]],
        }
      } else {
        currentSession.endTime = userEventsSorted[i].timestamp
        currentSession.events.push(userEventsSorted[i])
      }
    }
    
    sessions.push(currentSession)
  })
  
  return sessions
}

/**
 * Получить отчет по действиям
 */
export const getActionsReport = (botId, days = 7) => {
  try {
    const events = getEvents(botId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentEvents = events.filter(e => new Date(e.timestamp) >= cutoffDate)
    
    // Группируем по типу действия
    const actions = {}
    const userActions = {}
    
    recentEvents.forEach(event => {
      const action = event.action || event.type || 'unknown'
      
      if (!actions[action]) {
        actions[action] = { name: action, users: new Set(), requests: 0 }
      }
      
      actions[action].users.add(event.userId)
      actions[action].requests++
    })
    
    return Object.values(actions).map(action => ({
      name: action.name,
      users: action.users.size,
      requests: action.requests,
    })).sort((a, b) => b.requests - a.requests)
  } catch (error) {
    console.error('Error getting actions report:', error)
    return []
  }
}

/**
 * Получить UTM отчет
 */
export const getUTMReport = (botId) => {
  try {
    const users = getUsers(botId)
    
    const utmSources = {}
    
    users.forEach(user => {
      const source = user.utmSource || 'direct'
      const campaign = user.utmCampaign || ''
      const key = `${source}_${campaign}`
      
      if (!utmSources[source]) {
        utmSources[source] = {
          source,
          users: 0,
          conversions: 0,
        }
      }
      
      utmSources[source].users++
      // Можно добавить логику для подсчета конверсий
    })
    
    return Object.values(utmSources)
  } catch (error) {
    console.error('Error getting UTM report:', error)
    return []
  }
}

/**
 * Получить отчет об отказах
 */
export const getBounceReport = (botId) => {
  try {
    const events = getEvents(botId)
    const users = getUsers(botId)
    
    // Группируем события по UTM источникам
    const channelStats = {}
    
    users.forEach(user => {
      const channel = user.utmSource || 'direct'
      
      if (!channelStats[channel]) {
        channelStats[channel] = {
          channel,
          total: 0,
          bounced: 0,
        }
      }
      
      channelStats[channel].total++
      
      // Пользователь считается "отказом", если у него только одно событие /start
      const userEvents = events.filter(e => e.userId === user.id)
      if (userEvents.length === 1 && (userEvents[0].action === '/start' || userEvents[0].type === 'start')) {
        channelStats[channel].bounced++
      }
    })
    
    return Object.values(channelStats).map(stat => ({
      ...stat,
      rate: stat.total > 0 ? (stat.bounced / stat.total * 100).toFixed(1) : 0,
    }))
  } catch (error) {
    console.error('Error getting bounce report:', error)
    return []
  }
}

/**
 * Получить отчет о сессиях
 */
export const getSessionsReport = (botId, days = 7) => {
  try {
    const events = getEvents(botId)
    const sessions = calculateSessions(events)
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentSessions = sessions.filter(s => new Date(s.startTime) >= cutoffDate)
    
    // Группируем по дням недели
    const dayStats = {
      'Пн': { avgDuration: 0, avgActions: 0, count: 0 },
      'Вт': { avgDuration: 0, avgActions: 0, count: 0 },
      'Ср': { avgDuration: 0, avgActions: 0, count: 0 },
      'Чт': { avgDuration: 0, avgActions: 0, count: 0 },
      'Пт': { avgDuration: 0, avgActions: 0, count: 0 },
      'Сб': { avgDuration: 0, avgActions: 0, count: 0 },
      'Вс': { avgDuration: 0, avgActions: 0, count: 0 },
    }
    
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    
    recentSessions.forEach(session => {
      const day = dayNames[new Date(session.startTime).getDay()]
      const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60 // в минутах
      
      dayStats[day].count++
      dayStats[day].avgDuration += duration
      dayStats[day].avgActions += session.events.length
    })
    
    return Object.keys(dayStats).map(day => ({
      day,
      avgDuration: dayStats[day].count > 0 
        ? (dayStats[day].avgDuration / dayStats[day].count).toFixed(1)
        : 0,
      avgActions: dayStats[day].count > 0
        ? (dayStats[day].avgActions / dayStats[day].count).toFixed(1)
        : 0,
    }))
  } catch (error) {
    console.error('Error getting sessions report:', error)
    return [
      { day: 'Пн', avgDuration: 0, avgActions: 0 },
      { day: 'Вт', avgDuration: 0, avgActions: 0 },
      { day: 'Ср', avgDuration: 0, avgActions: 0 },
      { day: 'Чт', avgDuration: 0, avgActions: 0 },
      { day: 'Пт', avgDuration: 0, avgActions: 0 },
      { day: 'Сб', avgDuration: 0, avgActions: 0 },
      { day: 'Вс', avgDuration: 0, avgActions: 0 },
    ]
  }
}



