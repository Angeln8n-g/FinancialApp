# Backlog Priorizado: HogarIQ

El backlog está organizado por valor de negocio y dependencias técnicas. Las estimaciones se presentan en Puntos de Historia (SP) siguiendo la escala de Fibonacci (1, 2, 3, 5, 8, 13).

---

## 1. Backlog de la Fase 1: Cimientos y Sync (Prioridad Alta)

### US-101: Registro e Inicio de Sesión
- **Prioridad:** Crítica
- **Estimación:** 5 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Registro exitoso de usuario
    Dado que un usuario no autenticado ingresa a la vista de registro
    Cuando completa el formulario con un email único y contraseña válida
    Y presiona "Registrarse"
    Entonces el sistema debe enviar un correo de confirmación de Supabase
    Y mostrar un mensaje indicando que verifique su bandeja de entrada.
  ```

### US-102: Motor de Sincronización Local (Offline-First)
- **Prioridad:** Alta
- **Estimación:** 13 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Sincronización tras reconexión a internet
    Dado que el usuario registró 3 transacciones en modo offline
    Cuando el dispositivo detecta que la conexión a internet ha vuelto
    Entonces inicia el protocolo de sincronización enviando las transacciones locales en un push request
    Y recibe confirmación exitosa del servidor actualizando el estado de "pendiente" a "sincronizado".
  ```

### US-103: Registro Rápido Manual de Gasto
- **Prioridad:** Alta
- **Estimación:** 3 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Registro de gasto rápido exitoso
    Dado que el usuario está en el Dashboard
    Cuando presiona el botón flotante "+"
    Y digita "5.50" y selecciona la categoría "Café" y cuenta "Efectivo"
    Entonces el saldo de la cuenta "Efectivo" disminuye inmediatamente en 5.50 en la interfaz
    Y la transacción queda registrada localmente.
  ```

### US-104: Gestión de Múltiples Cuentas
- **Prioridad:** Media
- **Estimación:** 5 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Creación de cuenta bancaria
    Dado que el usuario está en la vista de cuentas
    Cuando ingresa el nombre "Banco BBVA", tipo "Cuenta Corriente" y saldo inicial de "1000.00"
    Entonces se crea la cuenta
    Y se refleja el saldo inicial en el saldo consolidado del hogar.
  ```

---

## 2. Backlog de la Fase 2: Automatización e IA Local (Prioridad Media)

### US-201: Carga y Procesamiento de Recibos con OCR Local
- **Prioridad:** Alta
- **Estimación:** 8 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Procesamiento exitoso de recibo de compra
    Dado que el usuario carga una imagen de un ticket desde su móvil
    Cuando la tarea en segundo plano procesa la imagen usando Tesseract.js local
    Entonces el sistema extrae el texto del ticket
    Y el servicio de IA local (Ollama) devuelve el comercio, la fecha y el monto para su confirmación.
  ```

### US-202: Clasificación de Transacciones mediante Lenguaje Natural
- **Prioridad:** Media
- **Estimación:** 5 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Registro por voz/texto libre
    Dado que el usuario escribe en la barra de entrada rápida: "Ayer gasté 20 dólares en gasolina"
    Cuando presiona enter
    Entonces el backend procesa el string con Ollama
    Y registra una transacción con fecha del día anterior, monto "20.00", categoría "Transporte" y moneda "USD".
  ```

### US-203: Control de Presupuestos Mensuales
- **Prioridad:** Alta
- **Estimación:** 5 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Alerta de consumo de presupuesto
    Dado que la categoría "Restaurantes" tiene un presupuesto mensual de 100 USD
    Cuando se registra un gasto de 20 USD que eleva el gasto total acumulado a 85 USD
    Entonces el sistema envía una alerta visual indicando que se ha consumido el 85% del presupuesto establecido.
  ```

---

## 3. Backlog de la Fase 3: Ecosistema Familiar y Chat Contextual (Prioridad Baja)

### US-301: Invitación y Gestión de Roles Familiares
- **Prioridad:** Alta
- **Estimación:** 5 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Invitación familiar enviada
    Dado que el usuario administrador está en la sección familiar
    Cuando ingresa el email "hijo@hogariq.com" y selecciona el rol "Espectador"
    Entonces el sistema genera un enlace de invitación seguro
    Y encola el correo electrónico de invitación para el envío.
  ```

### US-302: Chat Contextual Financiero (RAG)
- **Prioridad:** Media
- **Estimación:** 13 SP
- **Criterios de Aceptación (Gherkin):**
  ```gherkin
  Escenario: Consulta de gasto mediante chat
    Dado que el usuario tiene registradas 100 transacciones este mes
    Cuando ingresa en el chat de IA: "¿En qué he gastado más esta semana?"
    Entonces el sistema busca transacciones relevantes en pgvector
    Y Ollama genera una respuesta conversacional y privada con el desglose exacto de los mayores gastos.
  ```
