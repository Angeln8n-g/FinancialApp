# Plan de Pruebas: HogarIQ

El plan de aseguramiento de calidad (QA) de HogarIQ está diseñado para verificar la consistencia e integridad del sistema tanto en escenarios con conexión a internet como en entornos desconectados (offline-first).

---

## 1. Estrategia de Pruebas

### Pruebas Unitarias
- **Backend (NestJS):** Pruebas con **Jest** para verificar la lógica de cálculo de presupuestos, validación de transacciones y cálculo de patrimonio neto.
- **Frontend (React/React Native):** Pruebas de renderizado de componentes críticos y hooks reactivos de WatermelonDB mediante `@testing-library/react-native`.

### Pruebas de Integración
- **Sincronización:** Validación de la lógica de Pull/Push y la consistencia de los datos entre SQLite local y PostgreSQL remoto ante colisiones simuladas.
- **Base de Datos y ORM:** Pruebas contra un contenedor de Docker local temporal de PostgreSQL ejecutado en los pipelines de CI para validar que las migraciones de Prisma se aplican correctamente.

### Pruebas E2E (End-to-End)
- **Web:** Automatizado con **Playwright** simulando flujos de registro, creación de cuentas y consultas de chat de IA.
- **Móvil:** Pruebas automatizadas en emuladores de iOS y Android utilizando **Maestro** para simular clics en botones de registro rápido de transacciones.

### Pruebas de Resiliencia de Red (Offline)
- Simulación mediante scripts automatizados que cortan el tráfico de red (`iptables` o perfiles de red simulados en Playwright/Maestro) mientras el usuario genera transacciones, validando que el saldo local reaccione correctamente y que la sincronización posterior sea exitosa y libre de duplicaciones.

---

## 2. Casos de Prueba Críticos (Ejemplos)

### CP-001: Validación de Sincronización en Desconexión
1. **Acción:** Apagar la conexión de red del dispositivo.
2. **Acción:** Registrar un gasto de $10.00 en la cuenta "Efectivo".
3. **Validación Esperada:** El saldo de "Efectivo" en el dispositivo debe disminuir instantáneamente en $10.00. La base de datos local (SQLite) debe marcar el registro con `syncState = 'created'`.
4. **Acción:** Encender la conexión de red del dispositivo.
5. **Validación Esperada:** El motor de sincronización inicia la subida. La transacción aparece reflejada en PostgreSQL. El registro en SQLite actualiza su estado a `syncState = 'synced'`.

### CP-002: Límite de Presupuesto Consumido (Colaboración)
1. **Contexto:** Dos miembros del hogar (Padre e Hijo) tienen la app instalada en diferentes teléfonos. El presupuesto de "Entretenimiento" es de $50.
2. **Acción:** El Padre registra una transacción de $40 en la categoría "Entretenimiento" desde su dispositivo. El dispositivo sincroniza de inmediato.
3. **Acción:** El Hijo abre su aplicación.
4. **Validación Esperada:** El backend NestJS envía una notificación push o evento de WebSocket indicando que el presupuesto de "Entretenimiento" está al 80% de consumo. El dispositivo del Hijo recibe el cambio y actualiza el color de la barra del presupuesto a amarillo neón.

---

## 3. Pruebas de Carga y Rendimiento (Local AI Benchmarking)
Debido a que el backend incluye modelos de IA locales (Ollama), se deben realizar pruebas específicas de rendimiento:
- **Herramienta:** `k6` para pruebas de carga.
- **Objetivo:** Asegurar que el servidor local de Ollama responda en menos de 3 segundos ante consultas concurrentes de múltiples miembros de la familia sin agotar la memoria RAM del servidor host (Docker).
- **Mapeo de Límites:** Establecer límites de hilos (`num_predict`, `num_ctx`) en los archivos de configuración de Ollama del contenedor Docker.
