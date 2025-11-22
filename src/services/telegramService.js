const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export const isDemoToken = (token) => {
  if (!token) return true
  return token === 'demo_token'
}

export const getBotInfo = async (token) => {
  if (isDemoToken(token)) {
    return {
      success: false,
      error: 'Демо-токен используется только для оффлайн режима'
    }
  }
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/getMe`)
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        bot: data.result
      }
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка получения информации о боте'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const getBotUpdates = async (token, offset = 0, limit = 100) => {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/getUpdates?offset=${offset}&limit=${limit}`
    )
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        updates: data.result
      }
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка получения обновлений'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const setWebhook = async (token, webhookUrl) => {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    )
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        message: 'Webhook успешно установлен'
      }
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка установки webhook'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const deleteWebhook = async (token) => {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/deleteWebhook`)
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        message: 'Webhook успешно удален'
      }
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка удаления webhook'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const getWebhookInfo = async (token) => {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/getWebhookInfo`)
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        webhookInfo: data.result
      }
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка получения информации о webhook'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const sendMessage = async (token, chatId, text) => {
  if (isDemoToken(token)) {
    return {
      success: true,
      message: {
        message_id: Date.now(),
        chat: { id: chatId },
        text,
      },
    }
  }
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
        }),
      }
    )
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        message: data.result
      }
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка отправки сообщения'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const deleteTelegramMessage = async (token, chatId, messageId) => {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/deleteMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
        }),
      }
    )
    const data = await response.json()

    if (data.ok) {
      return { success: true }
    }

    return {
      success: false,
      error: data.description || 'Ошибка удаления сообщения'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const getUserProfilePhotos = async (token, userId) => {
  if (isDemoToken(token)) {
    return {
      success: false,
      error: 'Аватары недоступны в демо-режиме'
    }
  }
  try {
    const { getCachedAvatar, setCachedAvatar } = await import('./avatarCache')
    const cacheKey = `user_${userId}_${token.substring(0, 10)}`
    const cached = getCachedAvatar(cacheKey)
    
    if (cached) {
      return {
        success: true,
        photoUrl: cached
      }
    }
    
    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/getUserProfilePhotos?user_id=${userId}&limit=1`
    )
    const data = await response.json()
    
    if (data.ok && data.result.total_count > 0) {
      const fileId = data.result.photos[0][0].file_id
      const fileResponse = await fetch(
        `${TELEGRAM_API_BASE}${token}/getFile?file_id=${fileId}`
      )
      const fileData = await fileResponse.json()
      
      if (fileData.ok) {
        const photoUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`
        setCachedAvatar(cacheKey, photoUrl)
        return {
          success: true,
          photoUrl
        }
      }
    }
    
    return {
      success: false,
      error: 'Фото профиля не найдено'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка получения фото профиля'
    }
  }
}

export const getBotProfilePhoto = async (token) => {
  if (isDemoToken(token)) {
    return {
      success: false,
      error: 'Аватар бота недоступен в демо-режиме'
    }
  }
  try {
    const { getCachedAvatar, setCachedAvatar } = await import('./avatarCache')
    const cacheKey = `bot_${token.substring(0, 10)}`
    const cached = getCachedAvatar(cacheKey)
    
    if (cached) {
      return {
        success: true,
        photoUrl: cached
      }
    }
    
    const botInfo = await getBotInfo(token)
    if (!botInfo.success) {
      return { success: false, error: 'Не удалось получить информацию о боте' }
    }

    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/getChat?chat_id=${botInfo.bot.id}`
    )
    const data = await response.json()
    
    if (data.ok && data.result.photo) {
      const fileId = data.result.photo.small_file_id
      const fileResponse = await fetch(
        `${TELEGRAM_API_BASE}${token}/getFile?file_id=${fileId}`
      )
      const fileData = await fileResponse.json()
      
      if (fileData.ok) {
        const photoUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`
        setCachedAvatar(cacheKey, photoUrl)
        return {
          success: true,
          photoUrl
        }
      }
    }
    
    return {
      success: false,
      error: 'Фото профиля бота не найдено'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка получения фото профиля бота'
    }
  }
}

export const checkUserBlocked = async (token, userId) => {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: userId,
          text: '.',
        }),
      }
    )
    const data = await response.json()
    
    if (data.ok) {
      return {
        success: true,
        blocked: false,
        messageId: data.result?.message_id,
        chatId: data.result?.chat?.id || userId
      }
    } else {
      if (data.error_code === 403) {
        return {
          success: true,
          blocked: true,
          error: data.description
        }
      }
      return {
        success: false,
        error: data.description || 'Ошибка проверки блокировки'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка подключения к Telegram API'
    }
  }
}

export const processTelegramUpdate = (update, botId) => {
  try {
    let event = null
    let user = null

    if (update.message) {
      const message = update.message
      const from = message.from
      
      user = {
        id: from.id,
        first_name: from.first_name,
        last_name: from.last_name,
        username: from.username,
        language_code: from.language_code,
        is_premium: from.is_premium || false,
      }

      if (message.text) {
        if (message.text.startsWith('/')) {
          const command = message.text.split(' ')[0]
          event = {
            userId: from.id,
            type: 'command',
            action: command,
            data: {
              text: message.text,
              chatId: message.chat.id,
              messageId: message.message_id,
            },
          }
        } else {
          event = {
            userId: from.id,
            type: 'message',
            action: 'message',
            data: {
              text: message.text,
              chatId: message.chat.id,
              messageId: message.message_id,
            },
          }
        }
      }
    }

    if (update.callback_query) {
      const callback = update.callback_query
      const from = callback.from
      
      user = {
        id: from.id,
        first_name: from.first_name,
        last_name: from.last_name,
        username: from.username,
        language_code: from.language_code,
        is_premium: from.is_premium || false,
      }

      event = {
        userId: from.id,
        type: 'callback',
        action: callback.data || 'button_click',
        data: {
          callbackData: callback.data,
          messageId: callback.message?.message_id,
          chatId: callback.message?.chat?.id,
        },
      }
    }

    return { event, user }
  } catch (error) {
    console.error('Error processing Telegram update:', error)
    return { event: null, user: null }
  }
}

export const syncBotData = async (botId, token) => {
  if (isDemoToken(token)) {
    return {
      success: true,
      processed: 0,
      total: 0,
      message: 'Демо-бот не синхронизируется'
    }
  }
  try {
    const lastUpdateIdKey = `botpanel_last_update_id_${botId}`
    const lastUpdateId = parseInt(localStorage.getItem(lastUpdateIdKey) || '0')
    
    const updatesResult = await getBotUpdates(token, lastUpdateId, 100)
    
    if (!updatesResult.success) {
      return {
        success: false,
        error: updatesResult.error
      }
    }

    const updates = updatesResult.updates || []
    if (updates.length === 0) {
      return {
        success: true,
        processed: 0,
        total: 0,
        message: 'Новых обновлений нет'
      }
    }

    let processedCount = 0
    let maxUpdateId = lastUpdateId

    const { saveEvent, saveUser, getEvents } = await import('./dataService')

    const existingEvents = getEvents(botId)
    const existingEventIds = new Set(existingEvents.map(e => e.updateId))

    for (const update of updates) {
      if (existingEventIds.has(update.update_id)) {
        maxUpdateId = Math.max(maxUpdateId, update.update_id)
        continue
      }

      const { event, user } = processTelegramUpdate(update, botId)
      
      if (user) {
        saveUser(botId, user)
      }
      
      if (event) {
        const eventWithUpdateId = {
          ...event,
          updateId: update.update_id
        }
        saveEvent(botId, eventWithUpdateId)
        processedCount++
      }

      maxUpdateId = Math.max(maxUpdateId, update.update_id)
    }

    localStorage.setItem(lastUpdateIdKey, maxUpdateId.toString())

    return {
      success: true,
      processed: processedCount,
      total: updates.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка синхронизации данных'
    }
  }
}

