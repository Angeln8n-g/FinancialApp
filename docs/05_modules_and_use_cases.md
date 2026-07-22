# Módulos y Casos de Uso: HogarIQ

A continuación se detallan los 15 módulos fundamentales de HogarIQ, organizados con sus objetivos, modelos de datos locales, lógica de negocio y flujos.

---

## Módulo 1: Autenticación y Perfiles

- **Objetivo:** Permitir el acceso seguro de usuarios a la plataforma móvil y web, y gestionar su perfil básico.
- **Casos de Uso:**
  1. Registrar usuario con Email y Contraseña (con confirmación de correo).
  2. Iniciar sesión tradicional y mediante Biometría (FaceID/Fingerprint en móvil).
  3. Modificar foto de perfil, nombre y restablecer contraseña.
- **Historias de Usuario:**
  - *Como usuario,* quiero registrarme con mi correo para poder comenzar a gestionar las finanzas de mi hogar.
  - *Como usuario móvil,* quiero iniciar sesión con mi huella digital o rostro para acceder de manera instantánea y segura.
- **Modelo de Datos:** Tabla `User` y `Session`.
- **Validaciones:**
  - Correo electrónico con formato válido.
  - Contraseña con longitud mínima de 8 caracteres, al menos una mayúscula y un carácter especial.
- **Estados:** `UNAUTHENTICATED` -> `PENDING_VERIFICATION` -> `AUTHENTICATED`.
- **Flujo Principal:** 
  1. El usuario ingresa email y contraseña.
  2. Supabase autentica y devuelve JWT token + Refresh Token.
  3. La app guarda los tokens de forma segura en `Expo SecureStore` (móvil) o `HttpOnly Cookies` (web).
- **Flujo Alternativo:** Inicio con datos incorrectos -> la app muestra alerta visual "Credenciales inválidas" sin revelar cuál campo falló por seguridad.
- **Posibles Errores:** `AUTH_USER_NOT_FOUND` (404), `AUTH_INVALID_PASSWORD` (400), `AUTH_EMAIL_ALREADY_EXISTS` (409).
- **API Necesaria:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/biometric`.
- **Diseño de Interfaz:** Pantalla con logo animado en degradado, inputs estilizados tipo "Glassmorphism" con bordes redondeados y un botón prominente "Acceder". Enlace inferior para registrarse y opción de recuperación de clave.

---

## Módulo 2: Dashboard Financiero

- **Objetivo:** Mostrar un resumen visual de la salud financiera del hogar, balances consolidados y accesos rápidos en tiempo real.
- **Casos de Uso:**
  1. Visualizar balance consolidado de todas las cuentas.
  2. Ver gráfico de barras de ingresos vs. gastos del mes corriente.
  3. Consultar las últimas 5 transacciones recientes.
- **Historias de Usuario:**
  - *Como cabeza de familia,* quiero ver el balance total disponible del hogar al abrir la aplicación para saber si estamos en verde.
- **Modelo de Datos:** Lectura agregada de `Account` y `Transaction` filtrado por `householdId`.
- **Validaciones:** Solo lectura de datos autorizados.
- **Estados:** `LOADING` -> `LOADED` / `ERROR`.
- **Flujos:** Carga inicial -> Realiza consulta local en WatermelonDB (inmediato). En segundo plano inicia sincronización HTTP para actualizar datos de PostgreSQL.
- **Posibles Errores:** `SYNC_IN_PROGRESS` (aviso discreto superior), `DB_READ_ERROR`.
- **API Necesaria:** `GET /api/dashboard/summary`.
- **Diseño de Interfaz:** Caja superior con balance destacado en tipografía de gran tamaño. Mini-gráfico de dona con categorías de gasto, lista de transacciones recientes y botón flotante de registro rápido "+" de color vivo.

---

## Módulo 3: Gestión de Cuentas

- **Objetivo:** Crear y administrar carteras de dinero (cuentas bancarias, efectivo, tarjetas).
- **Casos de Uso:**
  1. Crear una cuenta definiendo tipo, saldo inicial y moneda.
  2. Ocultar o archivar una cuenta que ya no se usa.
- **Historias de Usuario:**
  - *Como usuario,* quiero añadir mi tarjeta de crédito para poder registrar las transacciones y ver mi deuda de forma independiente.
- **Modelo de Datos:** Tabla `Account`.
- **Validaciones:** Nombre de la cuenta obligatorio y saldo inicial numérico.
- **Estados:** `ACTIVE` -> `ARCHIVED`.
- **Flujos:** El usuario rellena el formulario de cuenta -> se guarda localmente en WatermelonDB y se encola para sincronización.
- **Posibles Errores:** `ACCOUNT_LIMIT_EXCEEDED` (si el plan gratuito tuviese límite).
- **API Necesaria:** `POST /api/accounts`, `PUT /api/accounts/:id`, `DELETE /api/accounts/:id`.
- **Diseño de Interfaz:** Carrusel horizontal de tarjetas bancarias estilizadas en CSS/NativeWind con colores personalizables que muestran el saldo y los últimos 4 dígitos.

---

## Módulo 4: Registro de Movimientos

- **Objetivo:** Registrar ingresos, gastos y transferencias rápidamente.
- **Casos de Uso:**
  1. Crear transacción manual.
  2. Crear transferencia entre cuentas propias del hogar.
  3. Carga rápida mediante comando de voz parseado por la IA local.
- **Historias de Usuario:**
  - *Como usuario,* quiero registrar un gasto en segundos al salir de una tienda para no olvidarlo.
- **Modelo de Datos:** Tabla `Transaction`.
- **Validaciones:** El monto debe ser mayor que 0. La fecha no puede ser futura (a menos que se marque como programada).
- **Estados:** `PENDING` (offline) -> `SYNCED` (en el servidor).
- **Flujos:** El usuario presiona "+", digita el monto y la categoría. Al confirmar, el balance de la cuenta se actualiza localmente de inmediato.
- **Posibles Errores:** `INSUFFICIENT_FUNDS` (alerta si la cuenta queda en negativo).
- **API Necesaria:** `POST /api/transactions`, `POST /api/transactions/voice`.
- **Diseño de Interfaz:** Teclado numérico personalizado en pantalla (tipo calculadora) para ingresar el monto en tamaño XL, seguido por selector de iconos de categoría.

---

## Módulo 5: Categorías Personalizables

- **Objetivo:** Clasificar las transacciones para estructurar los reportes de gastos.
- **Casos de Uso:**
  1. Crear categorías con color e icono específico.
  2. Modificar una categoría predeterminada.
- **Historias de Usuario:**
  - *Como usuario,* quiero crear la categoría "Mascotas" para controlar lo que gasto en mi perro.
- **Modelo de Datos:** Tabla `Category`.
- **Validaciones:** Nombre único dentro del hogar.
- **Estados:** `ACTIVE`.
- **API Necesaria:** `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`.
- **Diseño de Interfaz:** Grilla interactiva de iconos con selector de colores (círculo cromático HSL) y buscador de emojis.

---

## Módulo 6: Presupuestos

- **Objetivo:** Controlar y limitar el gasto en categorías específicas durante el mes.
- **Casos de Uso:**
  1. Establecer un límite mensual de gasto por categoría (ej. 300€ en Comida).
  2. Recibir una notificación al consumir el 80% y 100% de un presupuesto.
- **Historias de Usuario:**
  - *Como usuario,* quiero asignar un presupuesto a mis salidas a restaurantes para no pasarme de la raya este mes.
- **Modelo de Datos:** Tabla `Budget`.
- **Validaciones:** Límite debe ser positivo. Rango de fechas coherente.
- **Estados:** `UNDER_LIMIT` -> `WARNING_80` -> `OVER_LIMIT`.
- **API Necesaria:** `POST /api/budgets`, `GET /api/budgets/progress`.
- **Diseño de Interfaz:** Barra de progreso lineal animada que cambia de verde a amarillo al 80% y rojo cuando se supera el límite.

---

## Módulo 7: Metas de Ahorro

- **Objetivo:** Fomentar el ahorro para proyectos a mediano y largo plazo.
- **Casos de Uso:**
  1. Crear meta (Vacaciones Japón) con monto objetivo y fecha límite.
  2. Asignar dinero desde una cuenta hacia la meta de ahorro.
- **Historias de Usuario:**
  - *Como pareja,* queremos crear una meta común de 5000€ para las vacaciones y ver cómo vamos aportando los dos.
- **Modelo de Datos:** Tabla `SavingsGoal`.
- **Validaciones:** Fecha límite posterior a la fecha actual.
- **Estados:** `ACTIVE` -> `COMPLETED`.
- **API Necesaria:** `POST /api/savings-goals`, `POST /api/savings-goals/:id/contribute`.
- **Diseño de Interfaz:** Ilustración de "hucha de cerdito" o barra circular que se rellena con animaciones fluidas según el porcentaje alcanzado.

---

## Módulo 8: Deudas

- **Objetivo:** Registrar dinero prestado o adeudado y estructurar planes de pago.
- **Casos de Uso:**
  1. Registrar deuda con interés y fecha de vencimiento.
  2. Registrar abonos a deudas existentes.
- **Historias de Usuario:**
  - *Como usuario,* quiero llevar el control de lo que le debo a mi hermano para liquidarlo a tiempo.
- **Modelo de Datos:** Tabla `Debt`.
- **Validaciones:** El monto restante no puede superar el total original.
- **Estados:** `UNPAID` -> `PARTIALLY_PAID` -> `PAID`.
- **API Necesaria:** `POST /api/debts`, `POST /api/debts/:id/payments`.
- **Diseño de Interfaz:** Listado de deudas ordenado por fecha de vencimiento. Tarjetas con color verde para "Me deben" y rojo para "Debo".

---

## Módulo 9: Suscripciones

- **Objetivo:** Monitorear pagos recurrentes de servicios para optimizar gastos hormiga.
- **Casos de Uso:**
  1. Registrar suscripción indicando ciclo de cobro y cuenta de débito.
  2. Alerta de cobro próximo (48 horas antes).
- **Historias de Usuario:**
  - *Como usuario,* quiero registrar Netflix para que el sistema me avise antes de que se debite de mi cuenta.
- **Modelo de Datos:** Tabla `Subscription`.
- **Estados:** `ACTIVE` -> `PAUSED` -> `CANCELLED`.
- **API Necesaria:** `POST /api/subscriptions`, `GET /api/subscriptions/upcoming`.
- **Diseño de Interfaz:** Vista tipo listado con los logotipos de los servicios populares y la sumatoria mensual total de suscripciones activas.

---

## Módulo 10: Patrimonio

- **Objetivo:** Calcular el valor neto del hogar restando deudas de activos.
- **Casos de Uso:**
  1. Registrar activos no líquidos (Vehículo, Propiedad).
  2. Visualizar evolución histórica del patrimonio neto.
- **Historias de Usuario:**
  - *Como administrador,* quiero registrar el valor estimado de mi coche para sumarlo a mi patrimonio neto global.
- **Modelo de Datos:** Consultas agregadas de `Account` (tipo inversion/ahorros), `SavingsGoal` y `Debt`.
- **Estados:** `LOADED`.
- **API Necesaria:** `GET /api/patrimony/net-worth`.
- **Diseño de Interfaz:** Gráfico de línea temporal suave (smooth curve chart) que muestra la evolución de los activos frente a los pasivos mes a mes.

---

## Módulo 11: Reportes y Analítica

- **Objetivo:** Proveer gráficos detallados sobre la distribución de gastos y flujos.
- **Casos de Uso:**
  1. Generar gráfico de categorías.
  2. Exportar informe en formato PDF y CSV.
- **Historias de Usuario:**
  - *Como usuario,* quiero exportar mis gastos en Excel al final del año para hacer mi declaración fiscal.
- **Modelo de Datos:** Agregación de transacciones históricas.
- **API Necesaria:** `GET /api/reports/expense-distribution`, `GET /api/reports/export`.
- **Diseño de Interfaz:** Paneles interactivos con gráficos circulares y de barras de la librería Recharts (web) o React Native SVG Charts (móvil) con capacidad de filtrado rápido por meses.

---

## Módulo 12: Calendario Financiero

- **Objetivo:** Calendario interactivo con vencimientos de deudas, suscripciones y cobros de salarios.
- **Casos de Uso:**
  1. Visualizar en un calendario mensual los días de salida de dinero.
  2. Presionar un día del calendario para ver el detalle del cobro programado.
- **Historias de Usuario:**
  - *Como planificador,* quiero ver en un calendario cuándo vencen todos mis recibos para mantener saldo suficiente en la cuenta bancaria.
- **Modelo de Datos:** Agregación de fechas de vencimiento de `Debt`, `Subscription` y transacciones futuras.
- **Estados:** `LOADED`.
- **API Necesaria:** `GET /api/calendar/events`.
- **Diseño de Interfaz:** Cuadrícula de calendario mensual con pequeños puntos de color que representan eventos financieros (verde: ingreso programado, rojo: vencimiento de suscripción/factura).

---

## Módulo 13: Recordatorios

- **Objetivo:** Configurar alertas y notificaciones proactivas personalizadas.
- **Casos de Uso:**
  1. Configurar recordatorio diario para registrar gastos a las 9 PM.
  2. Notificar si la cuenta principal cae por debajo de 100 USD.
- **Historias de Usuario:**
  - *Como usuario,* quiero una notificación diaria en mi teléfono que me recuerde apuntar lo que gasté para tener los datos al día.
- **Modelo de Datos:** Tabla local del sistema y tokens push.
- **Validaciones:** Horas de recordatorio en formatos de 24 horas válidos.
- **Estados:** `ACTIVE` -> `DISABLED`.
- **API Necesaria:** `POST /api/reminders`, `PUT /api/reminders/:id`.
- **Diseño de Interfaz:** Listado de switches deslizantes elegantes para activar/desactivar recordatorios y selector de hora en formato spinner nativo.

---

## Módulo 14: Roles y Permisos Familiares

- **Objetivo:** Administrar quién puede editar o ver los datos dentro del hogar.
- **Casos de Uso:**
  1. Invitar a un miembro al hogar enviando un enlace o código de invitación.
  2. Cambiar rol de un miembro (Administrador, Colaborador, Espectador).
- **Historias de Usuario:**
  - *Como administrador,* quiero invitar a mi hijo al hogar con rol de 'Espectador' para que pueda ver el presupuesto de comida pero no modificar las cuentas.
- **Modelo de Datos:** Tabla `HouseholdMember`.
- **Validaciones:**
  - El rol debe corresponder a un tipo del enum `Role`.
  - Solo un usuario `ADMIN` puede invitar o cambiar roles.
- **Estados:** `PENDING_INVITATION` -> `ACCEPTED` -> `REVOKED`.
- **API Necesaria:** `POST /api/household/invite`, `PUT /api/household/members/:id`.
- **Diseño de Interfaz:** Lista de integrantes del hogar con avatares redondos, indicador de estado de invitación (insignia "Pendiente" o "Activo") y menú desplegable para alternar roles.

---

## Módulo 15: Configuración

- **Objetivo:** Configuración global de la aplicación (moneda base, idioma, temas de diseño, copias de seguridad).
- **Casos de Uso:**
  1. Cambiar la moneda base del hogar.
  2. Alternar entre modo oscuro, claro o automático (según sistema operativo).
  3. Exportar copia de seguridad local en JSON.
- **Historias de Usuario:**
  - *Como usuario,* quiero cambiar la aplicación al modo oscuro para usarla cómodamente por la noche.
- **Modelo de Datos:** Datos almacenados en el `LocalStorage` del dispositivo y configuración del `Household`.
- **Estados:** `SAVED`.
- **API Necesaria:** `PUT /api/household/config`.
- **Diseño de Interfaz:** Sección de menús limpios y agrupados con iconos al borde izquierdo, toggles a la derecha y botones de acción destructiva (ej. "Borrar datos locales") destacados en rojo con confirmación de seguridad.
