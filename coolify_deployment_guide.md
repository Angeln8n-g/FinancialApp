# 🚀 Guía Oficial de Despliegue de HogarIQ en Coolify

Esta guía detalla el proceso para desplegar toda la plataforma **HogarIQ** (Backend NestJS, Web Next.js, PostgreSQL con pgvector, Redis y el servidor de IA local Ollama) de forma automatizada en tu panel de **Coolify**.

---

## 📋 1. Requisitos Previos

- Un servidor VPS (Hetzner, DigitalOcean, AWS, Vultr, Contabo, etc.) con **Coolify v4+** instalado.
- Acceso al panel de administración de Coolify.
- Tu código fuente de HogarIQ en un repositorio de **GitHub** o **GitLab**.

---

## 🛠️ 2. Paso a Paso en el Panel de Coolify

### Paso 2.1: Crear un Nuevo Recurso
1. Abre tu panel de Coolify.
2. Selecciona tu **Proyecto** y **Entorno** (ej. *Production*).
3. Haz clic en el botón **+ Add New Resource**.
4. En las opciones de despliegue, selecciona **Docker Compose**.

### Paso 2.2: Vincular el Repositorio o Copiar el Archivo
Puedes elegir uno de los dos métodos:
- **Opción A (Recomendada - Git GitHub/GitLab):** Selecciona tu repositorio git, establece la rama (`main` o `master`) y especifica que use el archivo `docker-compose.prod.yml`.
- **Opción B (Pegar Docker Compose directamente):** En la caja de texto del recurso Docker Compose, pega el contenido del archivo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: ankane/pgvector:v0.5.1
    container_name: hogariq-prod-db
    restart: always
    environment:
      POSTGRES_USER: hogariq_user
      POSTGRES_PASSWORD: hogariq_prod_password_9988
      POSTGRES_DB: hogariq_prod_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: hogariq-prod-redis
    restart: always
    ports:
      - "6379:6379"

  ollama:
    image: ollama/ollama:latest
    container_name: hogariq-prod-ollama
    restart: always
    ports:
      - "11434:11434"
    volumes:
      - ollama_prod_data:/root/.ollama

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: hogariq-prod-backend
    restart: always
    environment:
      DATABASE_URL: postgresql://hogariq_user:hogariq_prod_password_9988@db:5432/hogariq_prod_db?schema=public
      REDIS_URL: redis://redis:6379
      JWT_SECRET: hogariq_prod_secret_key_change_me_in_coolify
      OLLAMA_HOST: http://ollama:11434
      OLLAMA_MODEL: llama3.2:1b
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
      - ollama

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    container_name: hogariq-prod-web
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://api-hogariq.tudominio.com # Reemplazar con tu dominio o IP
      PORT: 3001
    ports:
      - "3001:3000"
    depends_on:
      - backend

volumes:
  postgres_prod_data:
  ollama_prod_data:
```

---

## 🌐 3. Configuración de Dominios en Coolify

En Coolify:
- **`ollama` / `db` / `redis` (Servicios Internos Privados):** 
  - **NO necesitan un dominio público.**
  - En la casilla **Domains / FQDN** de `ollama`, simplemente **déjalo en blanco** o desmarca la opción *"Publicly Accessible"*. El backend de NestJS se comunica con Ollama de forma privada en la red interna de Docker a través de `http://ollama:11434`.
  - Si Coolify te exige ingresar un valor obligatorio en el campo de texto, puedes colocar `http://ollama.local` o `http://127.0.0.1:11434`.

- **`web` (Aplicación Web Frontend):** Ingresa tu dominio público principal (ejemplo: `https://hogariq.tudominio.com`).
- **`backend` (API NestJS):** Ingresa tu subdominio de API (ejemplo: `https://api-hogariq.tudominio.com`).

Coolify generará automáticamente los certificados **SSL (HTTPS)** para `web` y `backend`.

---

---

### 🚨 Diagnóstico de Error: OpenSSL en Alpine Linux (`SyntaxError: Unexpected token 'E'...`)

**Causa Raíz:**
El contenedor `node:20-alpine` es una distribución ultra-ligera que **no incluye OpenSSL (`libssl.so`) ni `libc6-compat` por defecto**. 
Cuando ejecutas `prisma db push`, el motor nativo en C++/Rust de Prisma intenta cargar la librería `libssl` de Alpine y colapsa, respondiendo texto plano en lugar de JSON, lo que genera el error `Could not parse schema engine response`.

**Solución Aplicada:**
He actualizado **[Dockerfile.backend](file:///c:/Users/angel/Desktop/Financial%20App/Dockerfile.backend)** y **[Dockerfile.web](file:///c:/Users/angel/Desktop/Financial%20App/Dockerfile.web)** instalando las librerías de OpenSSL mediante el gestor de paquetes de Alpine:

```dockerfile
RUN apk add --no-cache openssl libc6-compat ca-certificates
```

Al hacer `git push` y **Redeploy** en Coolify, Prisma funcionará perfectamente dentro del contenedor de backend.







---

## ⚙️ 4. Tareas Post-Despliegue

---

## 🗄️ 4. Inicializar Base de Datos y Modelo de IA en Coolify

Dado que los nombres de contenedores en Coolify se generan dinámicamente con UUIDs únicos (ejemplo: `tc452ofm-backend-1`), utiliza los siguientes comandos con búsqueda dinámica `$(docker ps -q -f name=...)`:

### A. Ejecutar Migraciones de Base de Datos y Semilla Inicial:
Ejecuta en la terminal SSH de tu servidor VPS:

```bash
# 1. Aplicar tablas e índices en PostgreSQL
docker exec -it $(docker ps -q -f name=backend | head -n 1) npx prisma db push --schema=packages/database/schema.prisma

# 2. Sembrar datos iniciales (Usuarios, Categorías y Cuentas de demostración)
docker exec -it $(docker ps -q -f name=backend | head -n 1) node packages/database/seed.js
```

### B. Descargar Modelo de Inteligencia Artificial (Ollama):
Para activar el motor de inteligencia artificial privado en el servidor:

```bash
docker exec -it $(docker ps -q -f name=ollama | head -n 1) ollama pull llama3.2:1b
```

---

## ✅ 5. Verificación

- Ingresa en tu navegador a tu dominio: `https://hogariq.tudominio.com`.
- Inicia sesión con tus credenciales:
  - **Email:** `angellafraga@gmail.con`
  - **Password:** `admin123`
- ¡Tu ecosistema financiero con IA Local, WebSockets y gestión total estará funcionando en producción!
