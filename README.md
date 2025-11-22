# BotPanel - Telegram Bot Analytics Dashboard

Telegram bot management panel with authentication, bot management, user analytics, and detailed reports. Built with React, Vite, and Tailwind CSS.

## Installation

### Local Development

```bash
npm install
npm run dev
```

### VPS Deployment

#### Automatic Deployment

1. Clone the repository on your VPS:
```bash
https://github.com/brukin234/telegrambotpanel
cd telegrambotpanel
```

2. Make the deployment script executable and run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will automatically install Docker and Docker Compose if needed, build the application, and start it on port 80.

#### Manual Deployment

1. Install Docker and Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
newgrp docker
```

2. Build and start the application:
```bash
docker-compose build
docker-compose up -d
```

3. Check status:
```bash
docker ps
docker logs botpanel
```

The application will be available at `http://your-server-ip:80`

#### Domain Setup with SSL

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Create configuration `/etc/nginx/sites-available/botpanel`:
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

3. Enable configuration and setup SSL:
```bash
sudo ln -s /etc/nginx/sites-available/botpanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Updating the Application

```bash
docker-compose down
git pull
docker-compose build --no-cache
docker-compose up -d
```

#### Useful Commands

```bash
docker logs -f botpanel
docker-compose down
docker-compose restart
docker ps
```

#### Security

Configure firewall:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Features

- User authentication with auto-generated credentials
- Bot management (add, edit, delete, sync)
- User analytics and filtering
- Detailed reports (actions, UTM, bounce rate, sessions)
- Broadcast messaging with filters
- Multiple themes (Green, Dark Blue, Dark Gray)
- Multi-language support (Russian, English)
- Real-time bot synchronization

## Technologies

- React 18
- React Router
- Tailwind CSS
- Recharts
- Vite
- Docker & Nginx
