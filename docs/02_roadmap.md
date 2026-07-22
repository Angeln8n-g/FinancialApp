# Roadmap de Desarrollo: HogarIQ

El plan de desarrollo de HogarIQ está diseñado para completarse en **tres fases incrementales**. Esto permite validar primero la arquitectura técnica básica, la sincronización offline y los flujos críticos de usuario (MVP) antes de introducir la complejidad de los modelos de IA locales y la colaboración familiar avanzada.

```
+---------------------------------------------------------------------------------+
|                               ROADMAP HOGARIQ                                   |
|                                                                                 |
|  [ Fase 1: MVP (Cimientos y Sync) ] ------------> Q1 (Meses 1-3)                |
|  * Autenticación, Dashboard, Cuentas, Transacciones                             |
|  * Sincronización Offline-First con SQLite/WatermelonDB                         |
|  * Docker & Coolify local infra + Postgres & Redis                             |
|                                                                                 |
|  [ Fase 2: Automatización e IA Local ] ----------> Q2 (Meses 4-6)               |
|  * Integración de Ollama (Llama 3) y pgvector                                  |
|  * Procesamiento natural de texto, OCR de recibos, categorización automática    |
|  * Presupuestos dinámicos, Deudas y Suscripciones                               |
|                                                                                 |
|  [ Fase 3: Ecosistema Familiar y Chat ] ---------> Q3 (Meses 7-9)               |
|  * Chat Financiero Contextual (RAG local)                                       |
|  * Roles y permisos familiares en tiempo real                                   |
|  * Patrimonio neto, Reportes visuales, Calendario financiero                    |
+---------------------------------------------------------------------------------+
```

---

## Detalle de las Fases

### Fase 1: MVP - Cimientos y Sincronización Offline-First (Mes 1 - 3)
* **Objetivo:** Establecer la arquitectura móvil y web, el backend y el motor de sincronización offline con la base de datos local.
* **Hitos:**
  - **Mes 1:** Setup de repositorios mono-repo, base de datos PostgreSQL en Docker con Supabase local, NestJS API base.
  - **Mes 2:** Configuración de la base de datos móvil local (WatermelonDB en React Native/Expo) y sincronización bidireccional (pull/push protocol) con el backend.
  - **Mes 3:** Vistas de Autenticación, Dashboard principal, Gestión de múltiples Cuentas y Registro rápido manual de transacciones. Despliegue inicial en Coolify (entorno staging).

### Fase 2: Automatización e Inteligencia Artificial Local (Mes 4 - 6)
* **Objetivo:** Introducir la IA local para automatizar el ingreso de datos y añadir inteligencia predictiva básica.
* **Hitos:**
  - **Mes 4:** Integración de Ollama en el stack Docker local. Configuración del parsing de lenguaje natural y categorización inteligente de transacciones basadas en descripciones previas.
  - **Mes 5:** OCR local con Tesseract.js para tickets de compra. Creación del módulo de Gestión de Suscripciones (con detección automática de patrones recurrentes) y Gestión de Deudas.
  - **Mes 6:** Módulo de Presupuestos y Metas de ahorro. Algoritmos estadísticos locales para la predicción de flujo de caja e ingresos/gastos futuros a 30 días.

### Fase 3: Ecosistema Familiar y Chat Contextual (Mes 7 - 9)
* **Objetivo:** Ampliar a múltiples miembros del hogar con control de acceso y lanzar el asistente conversacional.
* **Hitos:**
  - **Mes 7:** Configuración de múltiples miembros del hogar, roles familiares (Administrador, Colaborador, Espectador) y sincronización selectiva en tiempo real mediante WebSockets.
  - **Mes 8:** Chat financiero contextual con RAG (Retrieval-Augmented Generation) combinando pgvector en Postgres con Ollama local.
  - **Mes 9:** Módulo de Patrimonio Neto, Reportes financieros interactivos exportables (PDF/CSV) y Calendario financiero con recordatorios push. Lanzamiento de la versión 1.0 lista para producción autohospedada.
