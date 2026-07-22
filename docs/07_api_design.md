# Diseño de APIs: HogarIQ

La plataforma utiliza **REST API** para operaciones transaccionales estándar y sincronización de datos pesados, y **WebSockets (Socket.io)** para sincronización de cambios en tiempo real y eventos de colaboración dentro del hogar.

---

## 1. REST API

Todos los endpoints (excepto los de autenticación) requieren un token Bearer JWT en la cabecera `Authorization: Bearer <token>`.

### Autenticación

#### `POST /api/auth/register`
- **Descripción:** Crea un nuevo usuario y su hogar por defecto.
- **Request Body:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "Password123!",
    "fullName": "Juan Pérez"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "userId": "d3b07384-d113-4315-a50f-5698b6c86a34",
    "email": "usuario@ejemplo.com",
    "householdId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
  }
  ```

#### `POST /api/auth/login`
- **Descripción:** Valida credenciales y entrega tokens.
- **Request Body:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_8f9g0h...",
    "expiresIn": 3600
  }
  ```

---

### Sincronización (Offline-First Protocol)

#### `POST /api/sync/pull`
- **Descripción:** Descarga cambios del servidor desde la última sincronización.
- **Request Body:**
  ```json
  {
    "lastPulledAt": 1784570000,
    "householdId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "changes": {
      "accounts": {
        "created": [],
        "updated": [
          { "id": "acc-1", "name": "Ahorros Actualizados", "balance": "1250.00" }
        ],
        "deleted": []
      },
      "transactions": {
        "created": [
          { "id": "tx-99", "amount": "45.00", "categoryId": "cat-food", "date": "2026-07-20T12:00:00Z" }
        ],
        "updated": [],
        "deleted": []
      }
    },
    "timestamp": 1784581200
  }
  ```

#### `POST /api/sync/push`
- **Descripción:** Sube cambios del cliente al servidor.
- **Request Body:**
  ```json
  {
    "householdId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "changes": {
      "transactions": {
        "created": [
          { "id": "local-tx-1", "accountId": "acc-1", "amount": "15.50", "type": "EXPENSE", "date": "2026-07-20T23:00:00Z", "description": "Cafetería" }
        ],
        "updated": [],
        "deleted": []
      }
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "appliedCount": 1
  }
  ```

---

### Procesamiento con IA Local

#### `POST /api/ai/process-voice`
- **Descripción:** Parsea una entrada de texto/audio y registra la transacción.
- **Request Body:**
  ```json
  {
    "text": "Ayer gasté 32 dólares en supermercado Carrefour con la cuenta corriente"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "transaction": {
      "amount": 32.00,
      "type": "EXPENSE",
      "description": "Supermercado Carrefour",
      "date": "2026-07-20T12:00:00.000Z",
      "category": "Comida/Supermercado"
    }
  }
  ```

#### `POST /api/ai/chat`
- **Descripción:** Chat contextual basado en datos vectorizados (RAG).
- **Request Body:**
  ```json
  {
    "message": "¿Hemos ahorrado más que el mes pasado?"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "response": "Sí, este mes han ahorrado 450.00 USD, lo que representa un aumento del 12% en comparación con los 401.78 USD del mes pasado. El principal impulsor fue la reducción de un 18% en la categoría de Restaurantes.",
    "contextUsed": ["tx-99", "tx-120"]
  }
  ```

---

## 2. API de WebSockets

El servidor WebSocket corre en el puerto `3001` (o en la misma ruta detrás de Traefik `/socket.io`).

### Eventos de Suscripción
- `join_household`: El cliente se une a una sala correspondiente a su hogar.
  - **Payload:** `{ "householdId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" }`

### Eventos Emitidos por el Servidor
- `household_data_changed`: Notifica a otros miembros del hogar que hay nuevos datos en el servidor y que deben forzar un `pull` silencioso.
  - **Payload:**
    ```json
    {
      "entity": "transaction",
      "action": "CREATE",
      "userId": "user-uuid-who-made-change"
    }
    ```
- `budget_warning`: Alerta a todos los miembros de que una categoría superó el umbral.
  - **Payload:**
    ```json
    {
      "categoryId": "cat-food",
      "percentage": 85,
      "message": "¡Atención! Se ha consumido el 85% del presupuesto de comida del hogar."
    }
    ```
