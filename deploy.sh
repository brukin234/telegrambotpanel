#!/bin/bash

# Скрипт развертывания BotPanel на VPS
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем развертывание BotPanel..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Устанавливаем..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker установлен. Перезайдите в систему или выполните: newgrp docker"
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Устанавливаем..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose установлен"
fi

# Останавливаем существующий контейнер если есть
if [ "$(docker ps -aq -f name=botpanel)" ]; then
    echo "🛑 Останавливаем существующий контейнер..."
    docker stop botpanel || true
    docker rm botpanel || true
fi

# Собираем и запускаем
echo "🔨 Собираем образ..."
docker-compose build --no-cache

echo "🚀 Запускаем контейнер..."
docker-compose up -d

# Ждем запуска
sleep 3

# Проверяем статус
if [ "$(docker ps -q -f name=botpanel)" ]; then
    echo "✅ BotPanel успешно развернут!"
    echo "📡 Приложение доступно по адресу: http://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "Полезные команды:"
    echo "  Просмотр логов: docker logs -f botpanel"
    echo "  Остановка: docker-compose down"
    echo "  Перезапуск: docker-compose restart"
    echo "  Обновление: ./deploy.sh"
else
    echo "❌ Ошибка при запуске. Проверьте логи: docker logs botpanel"
    exit 1
fi

