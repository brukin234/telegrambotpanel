# Интеграция ботов с панелью

Для того чтобы панель показывала реальные данные, нужно интегрировать ваших Telegram ботов с панелью.

## Способ 1: Webhook (Рекомендуется)

### Шаг 1: Настройте webhook для вашего бота

В панели при добавлении бота укажите URL вашего webhook endpoint, например:
```
https://your-server.com/webhook/botpanel
```

### Шаг 2: Создайте webhook endpoint на вашем сервере

Пример на Node.js/Express:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Webhook endpoint для получения обновлений от Telegram
app.post('/webhook/botpanel', async (req, res) => {
  const update = req.body;
  
  // Обработайте обновление от Telegram
  if (update.message) {
    const message = update.message;
    const user = message.from;
    const chatId = message.chat.id;
    const text = message.text;
    
    // Определите ID бота из токена или другим способом
    const botId = 'YOUR_BOT_ID'; // Получите из конфигурации
    
    // Сохраните событие
    const event = {
      botId,
      userId: user.id,
      type: 'message',
      action: text?.startsWith('/') ? text.split(' ')[0] : 'message',
      data: {
        text,
        chatId,
      },
    };
    
    // Отправьте событие в панель через API или сохраните локально
    // В браузерной версии используйте localStorage через специальный API
    
    // Отправьте событие в панель (если панель на том же домене)
    if (typeof window !== 'undefined') {
      // Это будет работать только если webhook вызывается из браузера
      // Для реального использования нужен backend
    }
  }
  
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Шаг 3: Отправляйте данные в панель

Для отправки данных в панель используйте API панели. Создайте endpoint в панели для приема данных:

```javascript
// В вашем боте или webhook handler
const sendEventToPanel = async (botId, event) => {
  // Если панель на том же домене, можно использовать localStorage через iframe/postMessage
  // Или отправлять на API endpoint панели
  
  const response = await fetch('https://your-panel.com/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      botId,
      event,
    }),
  });
  
  return response.ok;
};
```

## Способ 2: Прямая интеграция в код бота

Если ваш бот написан на Node.js, вы можете напрямую интегрировать отправку данных:

```javascript
const { saveEvent, saveUser } = require('./panel-integration');

// В обработчике сообщений вашего бота
bot.on('message', async (msg) => {
  const user = msg.from;
  const text = msg.text;
  
  // Сохраните пользователя
  saveUser('YOUR_BOT_ID', {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code,
    is_premium: user.is_premium,
    utmSource: extractUTMFromMessage(msg), // Если используете UTM
  });
  
  // Сохраните событие
  saveEvent('YOUR_BOT_ID', {
    userId: user.id,
    type: 'message',
    action: text?.startsWith('/') ? text.split(' ')[0] : 'message',
    data: {
      text,
      chatId: msg.chat.id,
    },
  });
  
  // Ваша логика бота
  // ...
});
```

## Способ 3: Использование готовых библиотек

Создайте модуль интеграции для вашего бота:

```javascript
// panel-integration.js
class PanelIntegration {
  constructor(botId, panelUrl) {
    this.botId = botId;
    this.panelUrl = panelUrl;
  }
  
  async saveEvent(event) {
    // Отправка события в панель
    if (this.panelUrl) {
      return fetch(`${this.panelUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: this.botId, event }),
      });
    }
    
    // Или сохранение в localStorage (для тестирования)
    const events = JSON.parse(localStorage.getItem(`botpanel_events_${this.botId}`) || '[]');
    events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(`botpanel_events_${this.botId}`, JSON.stringify(events.slice(-10000)));
  }
  
  async saveUser(userData) {
    // Аналогично для пользователей
    const users = JSON.parse(localStorage.getItem(`botpanel_users_${this.botId}`) || '[]');
    const existingIndex = users.findIndex(u => u.id === userData.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      users.push(userData);
    }
    
    localStorage.setItem(`botpanel_users_${this.botId}`, JSON.stringify(users));
  }
}

module.exports = PanelIntegration;
```

## Формат данных

### Событие (Event)
```javascript
{
  userId: number,        // ID пользователя Telegram
  type: string,          // Тип события: 'message', 'callback', 'command', etc.
  action: string,        // Действие: '/start', '/help', 'button_click', etc.
  data: object,          // Дополнительные данные
  timestamp: string,     // ISO timestamp (автоматически)
}
```

### Пользователь (User)
```javascript
{
  id: number,            // ID пользователя Telegram
  first_name: string,
  last_name: string,
  username: string,
  language_code: string,
  is_premium: boolean,
  utmSource: string,     // Источник трафика (опционально)
  utmCampaign: string,   // Кампания (опционально)
  firstSeen: string,     // ISO timestamp первого визита
  lastSeen: string,      // ISO timestamp последнего визита
}
```

## Тестирование

Для тестирования можно вручную добавить данные через консоль браузера:

```javascript
// Добавить тестовое событие
const { saveEvent } = require('./src/services/dataService');
saveEvent('YOUR_BOT_ID', {
  userId: 123456789,
  type: 'message',
  action: '/start',
  data: { text: '/start' },
});

// Добавить тестового пользователя
const { saveUser } = require('./src/services/dataService');
saveUser('YOUR_BOT_ID', {
  id: 123456789,
  first_name: 'Test',
  username: 'testuser',
  language_code: 'ru',
  is_premium: false,
});
```

## Важные замечания

1. **Безопасность**: Не храните токены ботов в localStorage в продакшене. Используйте безопасное хранилище.

2. **Производительность**: Для больших объемов данных используйте базу данных вместо localStorage.

3. **Реальное время**: Для обновления данных в реальном времени используйте WebSocket или Server-Sent Events.

4. **Масштабирование**: Для продакшена нужен backend сервер для обработки webhook'ов и хранения данных.



