# Production Deployment Guide

## 1. Production Architecture Overview

In production, CampusCare Backend runs as a hardened Node.js process behind a reverse proxy (Nginx, Traefik, or AWS ALB) terminating SSL/TLS.

```
[Browser / Mobile Client]
         │ (HTTPS :443)
         ▼
[Reverse Proxy / Cloudflare / Nginx]
         │ (HTTP :3001, Pass-through X-Forwarded-For, X-Forwarded-Proto)
         ▼
[NestJS CampusCare Backend] (Port 3001)
         │ (TCP :5432 with SCRAM-SHA-256 / SSL)
         ▼
[Managed PostgreSQL Database]
```

---

## 2. Environment Configuration

Create a dedicated production `.env` (or supply variables via secret manager):

```env
NODE_ENV=production
PORT=3001
APP_URL=https://api.campuscare.ddu.edu.et
CORS_ORIGINS=https://campuscare.ddu.edu.et

DATABASE_URL=postgresql://campuscare_app:SuperSecretPass@db.internal.ddu.edu.et:5432/campuscare_prod?sslmode=require

SESSION_COOKIE_NAME=campuscare_session
SESSION_SECRET=a_very_long_cryptographically_secure_random_string_64_characters
SESSION_TTL_DAYS=7

THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=120

LOG_LEVEL=info
UPLOAD_DIR=/var/data/campuscare/uploads
MAX_FILE_SIZE_BYTES=5242880
```

---

## 3. Deployment Steps

### Step 1: Install Dependencies
```bash
npm ci --omit=dev
```

### Step 2: Apply Database Migrations
Never use `prisma migrate dev` or `db push` in production. Always run:
```bash
npx prisma migrate deploy
```

### Step 3: Build the Application
```bash
npm run build
```

### Step 4: Start the Production Server
Using a process manager like PM2:
```bash
pm2 start dist/main.js --name "campus-care-backend" -i max
pm2 save
```

Or run directly via Node:
```bash
node dist/main.js
```

---

## 4. Docker Deployment Example

A production-ready `Dockerfile`:

```dockerfile
# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p uploads && chown -R node:node uploads /app

USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

---

## 5. Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.campuscare.ddu.edu.et;

    ssl_certificate /etc/letsencrypt/live/api.campuscare.ddu.edu.et/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.campuscare.ddu.edu.et/privkey.pem;

    client_max_body_size 6M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
