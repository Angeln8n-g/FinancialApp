# Documento de Visión del Producto: HogarIQ

## 1. Introducción y Propósito
**HogarIQ** es un asistente financiero inteligente y plataforma de administración familiar diseñada para transformar la gestión de las finanzas del hogar. Más allá de ser un simple registro de ingresos y gastos, la plataforma actúa como un copiloto financiero proactivo que ayuda a las familias a comprender el comportamiento de su dinero, anticipar desafíos de liquidez y alcanzar metas de ahorro compartidas de forma colaborativa y privada.

El principio central de HogarIQ es la **privacidad absoluta y el control local**. Toda la inteligencia artificial y el procesamiento de datos se ejecutan en infraestructura controlada por el usuario (IA Local) sin enviar datos financieros sensibles a nubes de terceros.

---

## 2. Propuesta de Valor
- **Colaboración Familiar en Tiempo Real:** Multi-perfiles con roles y permisos específicos que permiten a parejas e hijos colaborar en presupuestos comunes manteniendo la privacidad en cuentas personales si se desea.
- **Inteligencia Artificial Local y Privada:** Procesamiento de lenguaje natural, clasificación de gastos, OCR de recibos y chat contextual ejecutados en servidores propios (ej. Docker local con Ollama y Postgres pgvector).
- **Experiencia Offline-First Superior:** Operación fluida en aplicaciones móviles y web sin conexión a internet. Los datos se guardan localmente y se sincronizan de forma segura mediante un motor de conciliación de conflictos cuando vuelve la conexión.
- **Automatización del Registro:** Reducción del tiempo de registro diario a menos de 5 segundos mediante registro rápido por voz, texto natural y OCR de tickets de compra.

---

## 3. Público Objetivo
1. **Parejas y Familias:** Que buscan unificar o coordinar sus ingresos, gastos fijos y metas de ahorro comunes (vacaciones, educación, vivienda).
2. **Administradores del Hogar:** Personas encargadas de planificar pagos de suscripciones, deudas, facturas de servicios y mantenimiento del hogar.
3. **Usuarios Conscientes de la Privacidad:** Usuarios que evitan servicios financieros en la nube tradicionales debido al rastreo de datos de consumo y prefieren soluciones auto-hospedadas (self-hosted).

---

## 4. Filosofía de Diseño UX/UI
HogarIQ se inspira en la estética limpia e interactiva de aplicaciones líderes del sector fintech como Revolut, Monzo y Copilot Money.
- **Simplicidad Radical:** Acciones principales (como registrar una transacción) a un solo toque.
- **Visualizaciones Clarificadoras:** Gráficos e indicadores interactivos de salud financiera que evitan la sobrecarga de datos.
- **Modo Oscuro Dinámico:** Interfaz de alto contraste adaptada para uso diurno y nocturno.
- **Accesibilidad (a11y):** Contraste de color óptimo, soporte para lectores de pantalla y navegación por gestos en dispositivos móviles.

---

## 5. Arquitectura de Inteligencia Artificial Local
Para garantizar la privacidad, la IA de HogarIQ está diseñada para ejecutarse localmente.

```
+---------------------------------------------------------------------------------+
|                                 HogarIQ Backend                                 |
|                                                                                 |
|   +-------------------+     +---------------------+     +-------------------+   |
|   |    TesseractJS    |     |  NestJS AI Service  |     |   TransformersJS  |   |
|   |    (Local OCR)    |     |  (LangChain / RAG)  |     | (LocalEmbeddings) |   |
|   +---------+---------+     +----------+----------+     +---------+---------+   |
|             |                          |                          |             |
+-------------v--------------------------v--------------------------v-------------+
              |                          |                          |
              | (Texto de Recibo)        | (Llama 3 / Mistral API)  | (Vectores 384d)
              |                          |                          |
+-------------v--------------------------v--------------------------v-------------+
|                               Servicios Locales                                 |
|                                                                                 |
|     +----------------------------------+     +----------------------------+     |
|     |           Ollama Docker          |     |     PostgreSQL + pgvector  |     |
|     |  (Llama-3-8B / Mistral-7B LLM)   |     |  (Memoria Semántica / DB)  |     |
|     +----------------------------------+     +----------------------------+     |
+---------------------------------------------------------------------------------+
```

### Componentes Clave de IA Local:
1. **Procesador de Lenguaje Natural (LLM Local):** Ejecución de **Ollama** con el modelo **Llama-3-8B-Instruct** o **Mistral-7B-Instruct** en el entorno Docker. Se utiliza para:
   - Traducir prompts en lenguaje natural ("Ayer gasté 45€ en el supermercado Mercadona con la tarjeta de débito") a transacciones estructuradas JSON.
   - Responder preguntas en el Chat Financiero Contextual.
   - Generar resúmenes financieros semanales basados en plantillas de datos crudos procesadas.
2. **Generación de Embeddings Locales:** Uso de **Transformers.js** (ejecutando el modelo `all-MiniLM-L6-v2` de Xenova de forma local en Node.js) para convertir transacciones, notas y metas en vectores de 384 dimensiones.
3. **Almacenamiento Vectorial y RAG:** Extensión **pgvector** en la base de datos PostgreSQL local. Almacena los embeddings de las transacciones para responder de manera contextual a preguntas del usuario (ej. "¿Cuánto he gastado este mes en comidas fuera de casa comparado con el anterior?").
4. **OCR Local de Recibos:** Integración de **Tesseract.js** en el backend para la extracción de texto a partir de imágenes de tickets subidas por el usuario. El texto resultante es posteriormente parseado por el LLM local para extraer el comercio, la fecha, los artículos (opcional) y el monto total.
5. **Algoritmos Heurísticos Locales (Sin LLM):** Predicciones de flujo de caja mediante modelos estadísticos autorregresivos (ARIMA simple implementado en JS o regresión lineal local) para garantizar rendimiento inmediato sin sobrecargar el LLM.
