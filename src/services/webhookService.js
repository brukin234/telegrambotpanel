import { saveEvent, saveUser } from './dataService'
import { processTelegramUpdate } from './telegramService'

export const handleWebhookEvent = (update, botId) => {
  try {
    const { event, user } = processTelegramUpdate(update, botId)
    
    if (user) {
      saveUser(botId, user)
    }
    
    if (event) {
      saveEvent(botId, event)
    }

    return { success: true, event, user }
  } catch (error) {
    console.error('Error handling webhook event:', error)
    return { success: false, error: error.message }
  }
}

export const generateWebhookUrl = (baseUrl, botId) => {
  return `${baseUrl}/api/webhook/${botId}`
}

