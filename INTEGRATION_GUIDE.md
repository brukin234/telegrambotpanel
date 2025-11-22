# Руководство по интеграции BotPanel с Telegram ботом

Это руководство поможет вам подключить ваш Telegram бот к панели управления BotPanel.

## Быстрый старт

### 1. Получение токена бота

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot` или `/mybots` для управления существующими ботами
3. Следуйте инструкциям BotFather для создания нового бота или получения токена существующего
4. Скопируйте токен (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Добавление бота в панель

1. Откройте панель BotPanel
2. Перейдите в раздел "Мои ресурсы" (Bots)
3. Нажмите "Добавить бота"
4. Вставьте токен вашего бота
5. Нажмите "Проверить" для проверки токена
6. Заполните название бота (автоматически заполнится из Telegram)
7. Нажмите "Добавить"

### 3. Синхронизация данных

После добавления бота:

1. Нажмите кнопку "Синхронизировать" на карточке бота
2. Панель получит последние обновления от Telegram
3. Данные автоматически обработаются и появятся в статистике

**Важно:** Синхронизация получает только последние 100 обновлений. Для полной статистики используйте webhook (см. ниже).

## Автоматическая синхронизация (Webhook)

Для получения данных в реальном времени рекомендуется настроить webhook.

### Вариант 1: Использование готового бэкенд сервера

Если у вас есть бэкенд сервер, настройте webhook:

```javascript
// Пример для Node.js/Express
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/webhook/:botId', (req, res) => {
  const { botId } = req.params;
  const update = req.body;
  
  // Отправка события в панель через localStorage или API
  // В реальном приложении здесь должна быть отправка в панель
  
  res.status(200).send('OK');
});

app.listen(3000);
```

### Вариант 2: Использование ngrok для локальной разработки

1. Установите [ngrok](https://ngrok.com/)
2. Запустите ваш бэкенд сервер
3. Выполните: `ngrok http 3000`
4. Используйте полученный HTTPS URL для webhook

### Вариант 3: Использование облачных сервисов

- **Vercel** - бесплатный хостинг для серверных функций
- **Heroku** - платформа для развертывания приложений
- **Railway** - современная платформа для деплоя
- **Render** - простой хостинг с автоматическим деплоем

## Интеграция в ваш бот

### Python (python-telegram-bot)

```python
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters
import requests

# URL вашей панели (для отправки событий)
PANEL_URL = "http://localhost:5173"  # или ваш URL

def save_event_to_panel(bot_id, event):
    """Отправка события в панель"""
    # В реальном приложении это должно быть через API
    # Здесь пример для localStorage (только для тестирования)
    pass

async def start(update: Update, context):
    user = update.effective_user
    
    # Сохраняем событие
    event = {
        "userId": user.id,
        "type": "command",
        "action": "/start",
        "data": {
            "text": "/start",
            "chatId": update.effective_chat.id
        }
    }
    
    save_event_to_panel("your_bot_id", event)
    
    await update.message.reply_text("Привет! Я подключен к BotPanel.")

async def handle_message(update: Update, context):
    user = update.effective_user
    
    event = {
        "userId": user.id,
        "type": "message",
        "action": "message",
        "data": {
            "text": update.message.text,
            "chatId": update.effective_chat.id
        }
    }
    
    save_event_to_panel("your_bot_id", event)

def main():
    application = Application.builder().token("YOUR_BOT_TOKEN").build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT, handle_message))
    
    application.run_polling()

if __name__ == "__main__":
    main()
```

### Node.js (telegraf)

```javascript
const { Telegraf } = require('telegraf');

const bot = new Telegraf('YOUR_BOT_TOKEN');
const BOT_ID = 'your_bot_id';

// Функция для отправки события в панель
function saveEventToPanel(event) {
  // В реальном приложении это должно быть через API
  // Здесь пример для localStorage (только для тестирования)
  console.log('Event:', event);
}

bot.start((ctx) => {
  const user = ctx.from;
  
  saveEventToPanel({
    userId: user.id,
    type: 'command',
    action: '/start',
    data: {
      text: '/start',
      chatId: ctx.chat.id
    }
  });
  
  ctx.reply('Привет! Я подключен к BotPanel.');
});

bot.on('text', (ctx) => {
  const user = ctx.from;
  
  saveEventToPanel({
    userId: user.id,
    type: 'message',
    action: 'message',
    data: {
      text: ctx.message.text,
      chatId: ctx.chat.id
    }
  });
});

bot.launch();
```

## Формат данных

### Событие (Event)

```javascript
{
  userId: number,        // ID пользователя Telegram
  type: string,          // Тип: 'message', 'callback', 'command'
  action: string,        // Действие: '/start', '/help', 'button_click'
  data: object,          // Дополнительные данные
  timestamp: string      // ISO timestamp (автоматически)
}
```

### Пользователь (User)

```javascript
{
  id: number,            // ID пользователя Telegram
  first_name: string,    // Имя
  last_name: string,     // Фамилия (опционально)
  username: string,      // Username (опционально)
  language_code: string, // Код языка
  is_premium: boolean,   // Premium статус
  firstSeen: string,     // ISO timestamp первого визита
  lastSeen: string       // ISO timestamp последнего визита
}
```

## Безопасность

⚠️ **ВАЖНО:** 

1. **Не храните токены в коде** - используйте переменные окружения
2. **Не передавайте токены через незащищенные каналы**
3. **Используйте HTTPS** для webhook URL
4. **Валидируйте данные** перед сохранением
5. **Ограничьте доступ** к панели управления

## Часто задаваемые вопросы

### Почему данные не появляются?

1. Проверьте, что токен бота правильный
2. Убедитесь, что бот активен
3. Нажмите "Синхронизировать" для получения данных
4. Проверьте, что бот получает сообщения

### Как получить больше данных?

- Используйте webhook для получения данных в реальном времени
- Регулярно синхронизируйте данные через кнопку "Синхронизировать"
- Настройте автоматическую синхронизацию в вашем боте

### Можно ли использовать несколько ботов?

Да! Вы можете добавить неограниченное количество ботов. Каждый бот будет иметь свою статистику.

## Поддержка

Если у вас возникли проблемы:

1. Проверьте консоль браузера на наличие ошибок
2. Убедитесь, что токен бота действителен
3. Проверьте подключение к интернету
4. Попробуйте синхронизировать данные вручную

