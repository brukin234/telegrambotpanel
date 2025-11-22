// Утилита для добавления тестовых данных
// Используйте в консоли браузера для тестирования

import { saveEvent, saveUser } from '../services/dataService'

/**
 * Добавить тестовые данные для бота
 * Использование в консоли браузера:
 * window.addTestData('BOT_ID')
 */
export const addTestData = (botId) => {
  if (!botId) {
    console.error('Укажите ID бота')
    return
  }

  // Добавляем тестовых пользователей
  const testUsers = [
    {
      id: 1001,
      first_name: 'Иван',
      last_name: 'Иванов',
      username: 'ivanov',
      language_code: 'ru',
      is_premium: true,
      utmSource: 'telegram',
      utmCampaign: 'promo',
    },
    {
      id: 1002,
      first_name: 'Мария',
      last_name: 'Петрова',
      username: 'petrova',
      language_code: 'ru',
      is_premium: false,
      utmSource: 'website',
      utmCampaign: 'main',
    },
    {
      id: 1003,
      first_name: 'Алексей',
      username: 'sidorov',
      language_code: 'en',
      is_premium: true,
      utmSource: 'telegram',
      utmCampaign: 'referral',
    },
  ]

  testUsers.forEach(user => {
    saveUser(botId, user)
  })

  // Добавляем тестовые события
  const now = new Date()
  const events = []

  // События за последние 7 дней
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // События для каждого пользователя
    testUsers.forEach((user, userIndex) => {
      const eventCount = Math.floor(Math.random() * 5) + 1
      
      for (let j = 0; j < eventCount; j++) {
        const eventTime = new Date(date)
        eventTime.setHours(Math.floor(Math.random() * 24))
        eventTime.setMinutes(Math.floor(Math.random() * 60))

        const actions = ['/start', '/help', '/settings', '/profile', 'message']
        const action = actions[Math.floor(Math.random() * actions.length)]

        events.push({
          userId: user.id,
          type: action.startsWith('/') ? 'command' : 'message',
          action: action,
          data: {
            text: action,
            chatId: user.id,
          },
          timestamp: eventTime.toISOString(),
        })
      }
    })
  }

  events.forEach(event => {
    saveEvent(botId, event)
  })

  console.log(`✅ Добавлено ${testUsers.length} пользователей и ${events.length} событий для бота ${botId}`)
  console.log('Обновите страницу, чтобы увидеть данные')
}

// Экспортируем в window для использования в консоли
if (typeof window !== 'undefined') {
  window.addTestData = addTestData
  window.saveEvent = saveEvent
  window.saveUser = saveUser
}






