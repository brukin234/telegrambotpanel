# Инструкция по загрузке проекта на GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на [github.com](https://github.com)
2. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
3. Заполните:
   - **Repository name**: `botpanel` (или другое имя)
   - **Description**: "Telegram Bot Management Panel"
   - Выберите **Public** или **Private**
   - НЕ ставьте галочки на "Add a README file", "Add .gitignore", "Choose a license" (у нас уже есть эти файлы)
4. Нажмите **"Create repository"**

## Шаг 2: Инициализируйте Git в проекте (если еще не сделано)

Откройте терминал в папке проекта и выполните:

```bash
# Проверьте, есть ли уже Git репозиторий
git status

# Если ошибка "not a git repository", инициализируйте:
git init
```

## Шаг 3: Добавьте все файлы

```bash
# Добавьте все файлы в staging
git add .

# Проверьте, что будет загружено (опционально)
git status
```

## Шаг 4: Сделайте первый коммит

```bash
git commit -m "Initial commit: BotPanel application"
```

## Шаг 5: Подключите удаленный репозиторий

```bash
# Замените YOUR_USERNAME на ваш GitHub username
# Замените botpanel на имя вашего репозитория (если отличается)

git remote add origin https://github.com/YOUR_USERNAME/botpanel.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/botpanel.git
```

## Шаг 6: Загрузите код на GitHub

```bash
# Загрузите код в ветку main
git branch -M main
git push -u origin main
```

Если GitHub попросит авторизацию:
- Для HTTPS: используйте Personal Access Token (см. ниже)
- Для SSH: настройте SSH ключи

## Настройка авторизации

### Вариант 1: Personal Access Token (для HTTPS)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Выберите права: `repo` (полный доступ к репозиториям)
4. Скопируйте токен
5. При `git push` используйте токен вместо пароля:
   - Username: ваш GitHub username
   - Password: вставьте токен

### Вариант 2: SSH ключи (рекомендуется)

```bash
# Сгенерируйте SSH ключ (если еще нет)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Скопируйте публичный ключ
cat ~/.ssh/id_ed25519.pub

# Добавьте ключ на GitHub:
# Settings → SSH and GPG keys → New SSH key → вставьте ключ

# Используйте SSH URL при добавлении remote:
git remote set-url origin git@github.com:YOUR_USERNAME/botpanel.git
```

## Обновление кода на GitHub

После внесения изменений:

```bash
# Добавьте измененные файлы
git add .

# Сделайте коммит
git commit -m "Описание изменений"

# Загрузите на GitHub
git push
```

## Полезные команды Git

```bash
# Проверить статус
git status

# Посмотреть историю коммитов
git log

# Посмотреть изменения
git diff

# Отменить изменения в файле (до git add)
git checkout -- filename

# Отменить git add
git reset filename

# Изменить последний коммит
git commit --amend -m "Новое сообщение"
```

## Структура файлов для Git

✅ **Будут загружены:**
- Все исходные файлы (`src/`)
- Конфигурационные файлы (`package.json`, `vite.config.js`, и т.д.)
- Docker файлы (`Dockerfile`, `docker-compose.yml`)
- Документация (`README.md`, `DEPLOY.md`)
- `.gitignore`

❌ **НЕ будут загружены** (благодаря .gitignore):
- `node_modules/`
- `dist/`
- `.env` файлы
- Логи
- Временные файлы редактора

## Клонирование на VPS

После загрузки на GitHub, на VPS выполните:

```bash
# Клонируйте репозиторий
git clone https://github.com/YOUR_USERNAME/botpanel.git
cd botpanel

# Запустите развертывание
chmod +x deploy.sh
./deploy.sh
```

## Обновление на VPS

```bash
cd botpanel
git pull
docker-compose build --no-cache
docker-compose up -d
```

