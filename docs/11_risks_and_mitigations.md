# Riesgos y Mitigaciones: HogarIQ

El desarrollo y auto-hospedaje de una aplicación financiera familiar plantea desafíos técnicos específicos en áreas de sincronización, privacidad y rendimiento. A continuación se presentan los riesgos principales identificados y sus estrategias de mitigación.

---

## 1. Pérdida de Sincronización u Overwrite de Datos (Offline-First)
- **Riesgo:** Un usuario realiza modificaciones offline mientras otro modifica en línea la misma cuenta, provocando pérdida de datos o saldos inconsistentes al reconectarse.
- **Impacto:** Alto (Pérdida de confianza en los datos financieros del hogar).
- **Mitigación:** 
  1. **Estrategia "Server Wins" para metadatos, pero "Fusión Inteligente" para transacciones:** Las transacciones nuevas nunca se sobreescriben. Si se detecta un conflicto en la edición de una transacción, se conservan los dos registros añadiendo un sufijo o alerta al usuario para que valide manualmente.
  2. **Registro de Auditoría local permanente:** WatermelonDB mantiene un historial local de cambios pendientes no sincronizados que pueden ser recuperados manualmente en un archivo JSON exportable en caso de error crítico de sincronización.

---

## 2. Alto Consumo de Recursos en Servidor Local (IA Local)
- **Riesgo:** Ollama y el procesamiento de RAG consumen el 100% de la CPU/RAM del servidor familiar (ej. un NAS doméstico o un servidor en la nube pequeño contratado para Coolify), bloqueando la API de NestJS.
- **Impacto:** Medio (Lentitud en la app, desconexiones WebSockets).
- **Mitigación:**
  1. **Encolado de Tareas Pesadas (BullMQ):** Toda solicitud de IA (OCR, generación de embeddings, resúmenes) no bloquea la API de NestJS; se envía a una cola de Redis y se ejecuta de forma asíncrona con baja prioridad.
  2. **Modelos Cuantizados:** Utilizar modelos muy cuantizados (ej. `Llama-3-8B-Instruct-Q4_K_M` u `Ollama run llama3:8b-instruct-q4_0`) que requieren menos de 4.8 GB de memoria RAM y tienen un impacto mínimo en CPU.
  3. **Caché Semántica:** Guardar en Redis las preguntas frecuentes del chat y sus respuestas vectorizadas para evitar llamar al LLM si la consulta es idéntica o muy similar.

---

## 3. Seguridad de Datos Financieros Sensibles (Hacking y RLS)
- **Riesgo:** Un usuario malintencionado explota una vulnerabilidad en la API de NestJS y obtiene acceso a las cuentas y gastos de otros hogares en la misma base de datos de PostgreSQL.
- **Impacto:** Crítico (Violación de privacidad y exposición de datos financieros).
- **Mitigación:**
  1. **Row Level Security (RLS) en Postgres:** Toda consulta SQL de Supabase o Prisma debe validar el token de usuario del hogar directamente en la capa de datos (base de datos) y no solo en la lógica del controlador NestJS.
  2. **Cifrado en Reposo:** Las descripciones detalladas de transacciones y notas pueden ser cifradas de manera opcional en la base de datos utilizando el módulo `pgcrypto` de PostgreSQL y una clave única derivada de la contraseña del administrador del hogar (cifrado de conocimiento cero / zero-knowledge).
