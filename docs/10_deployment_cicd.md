# Despliegue y CI/CD: HogarIQ

HogarIQ está optimizado para su despliegue y auto-hospedaje rápido mediante **Coolify**, una alternativa moderna y open-source a Heroku o Vercel, o mediante **Docker Desktop** de forma local.

---

## 1. Pipeline de CI/CD (GitHub Actions)

El archivo `.github/workflows/deploy.yml` gestiona el ciclo de construcción y publicación:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Linter & Tests
        run: |
          npm run lint
          npm run test

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Webhook
        run: |
          curl -X POST "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}" \
               -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

---

## 2. Preparación para Coolify

Coolify permite desplegar proyectos basados en repositorios Git leyendo un archivo `docker-compose.yml` en la raíz del proyecto. 

### Características del Despliegue en Coolify:
- **Nixpacks / Dockerfiles:** Coolify puede autodetectar y construir cada aplicación utilizando Nixpacks, o podemos indicarle que use los Dockerfiles específicos.
- **Base de Datos y Redis:** Coolify puede aprovisionar servicios dedicados de PostgreSQL y Redis con un clic, inyectando las variables de entorno automáticamente.
- **SSL Automático:** Coolify integra Traefik y Let's Encrypt, por lo que gestiona los certificados SSL y HTTPS para todos nuestros dominios configurados sin esfuerzo manual.

---

## 3. Configuración del Docker Compose de Producción

Este archivo define la estructura de contenedores necesaria para desplegar en tu propio servidor a través de Coolify:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
      - REDIS_URL=redis://redis:6379
      - OLLAMA_HOST=http://ollama:11434
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - ollama

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    environment:
      - NEXT_PUBLIC_API_URL=https://api.hogariq.local
    ports:
      - "80:80"

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    # Nota: Si el host tiene GPU Nvidia, se puede añadir la sección deploy.resources.reservations para aceleración por hardware.

volumes:
  ollama_data:
```
*(Las configuraciones completas de los Dockerfiles se encuentran detalladas en la raíz del espacio de trabajo).*
