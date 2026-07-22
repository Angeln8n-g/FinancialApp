# Arquitectura Técnica: HogarIQ

HogarIQ está diseñado bajo una arquitectura de microservicios e infraestructura contenida (Docker), optimizada para despliegues sencillos de un solo clic con **Coolify**.

---

## 1. Arquitectura por Capas

```
+---------------------------------------------------------------------------------+
|                                 CAPA DE CLIENTE                                 |
|                                                                                 |
|   +--------------------------+                  +---------------------------+   |
|   |   Frontend Web (NextJS)  |                  |   App Móvil (React Native)|   |
|   |   React + Tailwind CSS   |                  |   Expo + NativeWind CSS   |   |
|   |                          |                  |                           |   |
|   |   +------------------+   |                  |   +-------------------+   |   |
|   |   | WatermelonDB/Wasm|   |                  |   | WatermelonDB/SQLi |   |   |
|   |   | (Local Storage)  |   |                  |   | (Local Storage)   |   |   |
|   |   +--------+---------+   |                  |   +--------+----------+   |   |
|   +------------|-------------+                  +------------|--------------+   |
+----------------|---------------------------------------------|------------------+
                 | Sincronización REST y WebSockets            |
                 | (Traefik Reverse Proxy)                     |
+----------------v---------------------------------------------v------------------+
|                                 CAPA DE SERVICIOS                               |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |                        Backend (NestJS API Gateway)                     |   |
|   |                                                                         |   |
|   |   +------------------+  +-------------------+  +--------------------+   |   |
|   |   |   Sync Service   |  |   Auth Service    |  |     AI Service     |   |   |
|   |   |  (Sync Protocol) |  |    (Supabase)     |  | (LangChain/Ollama) |   |   |
|   |   +------------------+  +-------------------+  +--------------------+   |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
                                                               |
+--------------------------------------------------------------v------------------+
|                              CAPA DE ALMACENAMIENTO                             |
|                                                                                 |
|   +------------------------+  +-------------------------+  +----------------+   |
|   |  PostgreSQL + pgvector |  |       Redis Cache       |  |  Ollama Docker |   |
|   |    (Base de Datos)     |  | (Sesiones/Rate Limit/WS)|  | (Modelos Local)|   |
|   +------------------------+  +-------------------------+  +----------------+   |
+---------------------------------------------------------------------------------+
```

### Capa de Cliente (Frontend Web y Móvil)
- **Tecnología Móvil:** Expo + React Native + NativeWind (Tailwind CSS en React Native).
- **Tecnología Web:** Next.js (App Router) + React + CSS Vanilla / Tailwind.
- **Base de Datos Local (Ambos):** **WatermelonDB** con adaptador SQLite en móviles y adaptador IndexedDB/LokiJS en web. Esto permite una arquitectura reactiva donde la interfaz se actualiza instantáneamente con datos locales y los cambios se procesan en segundo plano.

### Capa de Backend
- **Framework:** NestJS.
- **ORM:** Prisma (para consultas y migraciones PostgreSQL).
- **Controlador de WebSocket:** NestJS WebSockets con adaptador Socket.io respaldado por Redis Adapter.

---

## 2. Estructura de Carpetas (Monorepo)

```
hogariq-monorepo/
├── apps/
│   ├── web/                     # Aplicación Next.js
│   │   ├── src/
│   │   │   ├── app/             # Rutas y páginas
│   │   │   ├── components/      # UI components
│   │   │   └── hooks/           # Custom hooks
│   │   └── package.json
│   ├── mobile/                  # Aplicación Expo/React Native
│   │   ├── src/
│   │   │   ├── components/      # Componentes visuales móviles
│   │   │   ├── screens/         # Pantallas
│   │   │   └── database/        # WatermelonDB schemas & sync
│   │   ├── App.tsx
│   │   └── package.json
│   └── backend/                 # API NestJS
│       ├── src/
│       │   ├── auth/            # Módulo de Autenticación (Supabase Integration)
│       │   ├── sync/            # Motor de Sincronización Offline
│       │   ├── ai/              # Procesamiento local de LLM, RAG y OCR
│       │   ├── database/        # Módulo de Prisma y Postgres connection
│       │   └── main.ts
│       └── package.json
├── packages/
│   ├── types/                   # Tipos TypeScript compartidos
│   └── database/                # Schema.prisma compartido y migraciones
├── docker/                      # Dockerfiles y scripts de base de datos
├── docker-compose.yml           # Orquestación de contenedores locales
└── README.md
```

---

## 3. Estrategia Offline-First con Sincronización

El flujo de sincronización de datos implementa el protocolo de sincronización bidireccional optimizado para **WatermelonDB**:

1. **Pull (Descarga):** El cliente envía su última marca de tiempo (`lastPulledAt`). El servidor NestJS responde con todos los registros creados, modificados o eliminados desde esa fecha para el hogar del usuario actual.
2. **Push (Subida):** El cliente envía todos los cambios locales pendientes agrupados por entidad (creados, actualizados, eliminados). El servidor los inserta o actualiza en PostgreSQL mediante transacciones ACID de Prisma.
3. **Resolución de Conflictos:** Si un registro se modificó tanto en el cliente como en el servidor desde la última sincronización, se aplica la estrategia **"Server Wins"** (el servidor tiene prioridad), a menos que sea una transacción de gasto donde los cambios se fusionan sumando modificaciones si no colisionan campos críticos.

```
Cliente                                               Servidor
   |                                                     |
   |---- PULL (lastPulledAt) --------------------------->|
   |                                                     | (Busca cambios en DB)
   |<--- Cambios del servidor y nuevo timestamp ---------|
   |                                                     |
   |---- PUSH (creaciones, actualizaciones, eliminaciones)-->|
   |                                                     | (Aplica cambios a DB)
   |<--- Confirmación de éxito de push ------------------|
   |                                                     |
```

---

## 4. Sistema de Notificaciones y Tiempo Real

- **Sincronización en tiempo real:** Cuando un miembro del hogar registra una transacción en su dispositivo móvil, el servidor NestJS detecta el cambio, lo procesa en la base de datos y emite un evento WebSocket al resto de clientes conectados del mismo hogar usando un canal único `household:<household_id>`.
- **Notificaciones Push:** Para recordatorios de facturas y alertas financieras, el backend NestJS utiliza el **Expo Notification Service** para enviar notificaciones push a los dispositivos móviles iOS y Android, y la API de Web Push para navegadores Web.

---

## 5. Estrategia de Caching y Cola de Mensajes (Redis)

- **Caché de Consultas:** Cacheo de reportes financieros pesados y balances históricos agregados con un tiempo de expiración (TTL) corto (5 minutos) para evitar consultas complejas recurrentes a PostgreSQL.
- **Gestión de WebSockets:** Redis se utiliza como adaptador Pub/Sub de Socket.io, permitiendo escalar el backend horizontalmente si es necesario en el futuro.
- **Cola de Trabajos (BullMQ en NestJS):** Procesamiento de tareas pesadas en segundo plano que bloquean el hilo principal de Node.js:
  - Generación de embeddings locales con Transformers.js.
  - Ejecución de OCR local en recibos PDF/Imágenes.
  - Generación de resúmenes semanales usando Ollama.
