# Инструкция по развертыванию BotPanel на VPS

## Быстрое развертывание

### Вариант 1: Автоматический (рекомендуется)

1. Загрузите проект на VPS:
```bash
# Если проект в Git
git clone <your-repo-url> botpanel
cd botpanel

# Или загрузите файлы через scp/sftp
```

2. Сделайте скрипт исполняемым и запустите:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Вариант 2: Ручной

1. Установите Docker и Docker Compose (если не установлены):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезайдите в систему или выполните:
newgrp docker
```

2. Соберите и запустите:
```bash
docker-compose build
docker-compose up -d
```

3. Проверьте статус:
```bash
docker ps
docker logs botpanel
```

## Настройка домена (опционально)

### С Nginx как reverse proxy

1. Установите Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Создайте конфигурацию `/etc/nginx/sites-available/botpanel`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/botpanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Настройте SSL с Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Обновление приложения

```bash
# Остановите контейнер
docker-compose down

# Обновите код (если через Git)
git pull

# Пересоберите и запустите
docker-compose build --no-cache
docker-compose up -d
```

## Полезные команды

```bash
# Просмотр логов
docker logs -f botpanel

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Просмотр статуса
docker ps

# Вход в контейнер
docker exec -it botpanel sh
```

## Изменение порта

Если нужно изменить порт, отредактируйте `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Внешний порт:Внутренний порт
```

## Резервное копирование

Данные хранятся в localStorage браузера, но можно настроить резервное копирование:
```bash
# Создайте скрипт backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
docker exec botpanel tar czf /tmp/backup_$DATE.tar.gz /usr/share/nginx/html
docker cp botpanel:/tmp/backup_$DATE.tar.gz ./backups/
```

## Устранение неполадок

### Контейнер не запускается
```bash
docker logs botpanel
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Порт занят
```bash
# Проверьте, что использует порт
sudo lsof -i :80
# Или измените порт в docker-compose.yml
```

### Проблемы с правами
```bash
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

## Безопасность

1. Настройте firewall:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. Используйте SSL (Let's Encrypt)
3. Регулярно обновляйте систему:
```bash
sudo apt update && sudo apt upgrade -y
```

