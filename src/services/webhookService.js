// Сервис для работы с webhook событиями от Telegram
// Этот сервис обрабатывает события, приходящие от Telegram бота

import { saveEvent, saveUser } from './dataService'
import { processTelegramUpdate } from './telegramService'

/**
 * Обработать webhook событие от Telegram
 * Вызывается когда Telegram отправляет обновление на ваш webhook URL
 */
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

/**
 * Создать webhook URL для бота
 * ВАЖНО: В продакшене нужен реальный сервер с HTTPS
 */
export const generateWebhookUrl = (baseUrl, botId) => {
  // В реальном приложении это должен быть URL вашего бэкенд сервера
  // Например: https://yourdomain.com/api/webhook/${botId}
  return `${baseUrl}/api/webhook/${botId}`
}

/**
 * ВАЖНО: Для работы webhook нужен бэкенд сервер!
 * 
 * Пример бэкенд сервера (Node.js/Express):
 * 
 * ```javascript
 * const express = require('express');
 * const app = express();
 * 
 * app.use(express.json());
 * 
 * app.post('/api/webhook/:botId', (req, res) => {
 *   const { botId } = req.params;
 *   const update = req.body;
 *   
 *   // Отправляем событие в панель (через localStorage или API)
 *   // В реальном приложении здесь должна быть отправка в панель
 *   
 *   res.status(200).send('OK');
 * });
 * 
 * app.listen(3000);
 * ```
 * 
 * Или используйте готовые сервисы:
 * - ngrok для локальной разработки
 * - Heroku, Vercel, Railway для продакшена
 */

