import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { calculateBotStats } from '../services/dataService'
import { addTestData } from '../utils/testData'
import { syncBotData, isDemoToken } from '../services/telegramService'
import { useAuth } from './AuthContext'

const BotsContext = createContext()

export const useBots = () => {
  const context = useContext(BotsContext)
  if (!context) {
    throw new Error('useBots must be used within BotsProvider')
  }
  return context
}

export const BotsProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [bots, setBots] = useState([])

  const mainAdminUsername = localStorage.getItem('botpanel_username') || 'main_admin'
  const resolvedCurrentUser = currentUser || mainAdminUsername

  const attachStats = useCallback(
    (list) =>
      list.map((bot) => ({
        ...bot,
        stats: calculateBotStats(bot.id),
      })),
    []
  )

  const loadAllBots = useCallback(() => {
    try {
      const savedBots = JSON.parse(localStorage.getItem('botpanel_bots') || '[]')
      return savedBots.map((bot) => ({
        ...bot,
        owner: bot.owner || mainAdminUsername,
      }))
    } catch (error) {
      console.error('Error parsing bots from storage:', error)
      return []
    }
  }, [mainAdminUsername])

  const persistAllBots = useCallback((allBots) => {
    localStorage.setItem('botpanel_bots', JSON.stringify(allBots))
  }, [])

  const saveBotsForOwner = useCallback(
    (ownerBots) => {
      const allBots = loadAllBots()
      const merged = [
        ...allBots.filter((bot) => bot.owner !== resolvedCurrentUser),
        ...ownerBots.map((bot) => ({ ...bot, owner: resolvedCurrentUser })),
      ]
      persistAllBots(merged)
      setBots(attachStats(ownerBots.map((bot) => ({ ...bot, owner: resolvedCurrentUser }))))
    },
    [attachStats, loadAllBots, persistAllBots, resolvedCurrentUser]
  )

  useEffect(() => {
    const initialized = localStorage.getItem('botpanel_initialized')
    let allBots = loadAllBots()

    if (!initialized) {
      const demoBot = {
        id: 'demo_bot_' + Date.now(),
        name: 'Демо бот',
        username: 'demo_bot',
        token: 'demo_token',
        status: 'active',
        createdAt: new Date().toISOString(),
        owner: mainAdminUsername,
      }

      addTestData(demoBot.id)
      allBots = [...allBots, demoBot]
      persistAllBots(allBots)
      localStorage.setItem('botpanel_initialized', 'true')
    }

    persistAllBots(allBots)
    const ownerBots = allBots.filter((bot) => bot.owner === resolvedCurrentUser)
    setBots(attachStats(ownerBots))
  }, [attachStats, loadAllBots, persistAllBots, resolvedCurrentUser, mainAdminUsername])

  // Обновляем статистику каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setBots((prevBots) =>
        prevBots.map((bot) => ({
          ...bot,
          stats: calculateBotStats(bot.id),
        }))
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Автоматическая синхронизация ботов с Telegram каждые 60 секунд
  // ВАЖНО: Telegram API имеет лимиты на количество запросов
  // Синхронизация каждую секунду будет слишком нагружать сервер
  // 60 секунд - оптимальный баланс между актуальностью данных и нагрузкой
  useEffect(() => {
    if (bots.length === 0) return

    const syncInterval = setInterval(async () => {
      // Синхронизируем только ботов с токенами
      const botsWithTokens = bots.filter(
        bot => bot.token && !isDemoToken(bot.token) && bot.status === 'active'
      )
      
      for (const bot of botsWithTokens) {
        try {
          // Синхронизируем данные
          await syncBotData(bot.id, bot.token)
          
          // Обновляем статистику после синхронизации
          setBots(prevBots => 
            prevBots.map(b => 
              b.id === bot.id 
                ? { ...b, stats: calculateBotStats(bot.id) }
                : b
            )
          )
        } catch (error) {
          console.error(`Ошибка синхронизации бота ${bot.name}:`, error)
        }
      }
    }, 60000) // 60 секунд - оптимальный интервал

    return () => clearInterval(syncInterval)
  }, [bots])

  const addBot = (botData) => {
    const newBot = {
      id: Date.now().toString(),
      ...botData,
      createdAt: new Date().toISOString(),
      owner: resolvedCurrentUser,
      stats: {
        totalUsers: 0,
        totalSessions: 0,
        totalEvents: 0,
        revenue: 0,
        dau: 0,
        wau: 0,
        mau: 0,
      },
    }
    const updatedBots = [...bots, newBot]
    saveBotsForOwner(updatedBots)
    return newBot
  }

  const updateBot = (id, updates) => {
    const updatedBots = bots.map((bot) =>
      bot.id === id ? { ...bot, ...updates } : bot
    )
    saveBotsForOwner(updatedBots)
  }

  const deleteBot = (id) => {
    const updatedBots = bots.filter((bot) => bot.id !== id)
    localStorage.removeItem(`botpanel_events_${id}`)
    localStorage.removeItem(`botpanel_users_${id}`)
    saveBotsForOwner(updatedBots)
  }

  const refreshBotStats = (id) => {
    setBots(prevBots => 
      prevBots.map(bot => 
        bot.id === id 
          ? { ...bot, stats: calculateBotStats(id) }
          : bot
      )
    )
  }

  return (
    <BotsContext.Provider
      value={{
        bots,
        addBot,
        updateBot,
        deleteBot,
        refreshBotStats,
      }}
    >
      {children}
    </BotsContext.Provider>
  )
}

