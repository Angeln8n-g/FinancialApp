# HogarIQ - Asistente Financiero Familiar 🏡📊

![Estado: En Desarrollo](https://img.shields.io/badge/Estado-En_Desarrollo-blue)
![Licencia: Privada](https://img.shields.io/badge/Licencia-Privada-red)

**HogarIQ** es un asistente financiero inteligente y plataforma de administración familiar diseñada para transformar la gestión de las finanzas del hogar. Funciona como un copiloto financiero proactivo, ayudando a las familias a comprender el comportamiento de su dinero, anticipar desafíos de liquidez y alcanzar metas de ahorro compartidas. 

El principio central de la plataforma es la **privacidad absoluta y el control local**, integrando Inteligencia Artificial de forma privada.

## 🚀 Características Principales

*   **Colaboración Familiar en Tiempo Real:** Multi-perfiles con roles y permisos específicos para organizar presupuestos comunes o cuentas personales.
*   **Inteligencia Artificial Local:** Procesamiento de lenguaje natural y clasificación de gastos sin enviar datos a la nube (Ollama, pgvector).
*   **Experiencia Offline-First:** Las aplicaciones funcionan sin internet y se sincronizan al volver la conexión.
*   **Monorepositorio Escalar:** Unifica el código del Backend, la Aplicación Web y la Aplicación Móvil en un solo lugar.

## 📂 Arquitectura del Proyecto

Este proyecto es un monorepo administrado mediante NPM Workspaces, estructurado de la siguiente manera:

```text
HogarIQ/
├── apps/
│   ├── backend/    # API Principal (Node.js/NestJS/Express)
│   ├── web/        # Aplicación Web Frontend (Next.js/React)
│   └── mobile/     # Aplicación Móvil (React Native/Expo)
├── packages/
│   └── database/   # Esquemas de Base de Datos y Modelos (Prisma ORM)
├── docker/         # Archivos de configuración para contenedores (Docker)
└── docs/           # Documentación técnica, diseño y visión del producto
```

## 📖 Documentación

Toda la documentación técnica y de negocio se encuentra en el directorio [`docs/`](./docs/):

*   [01. Visión del Producto](./docs/01_product_vision.md)
*   [02. Roadmap](./docs/02_roadmap.md)
*   [03. Arquitectura Técnica](./docs/03_technical_architecture.md)
*   [04. Modelo de Datos (ERD)](./docs/04_data_model_erd.md)
*   [05. Módulos y Casos de Uso](./docs/05_modules_and_use_cases.md)
*   [06. Backlog](./docs/06_backlog.md)
*   [07. Diseño de API](./docs/07_api_design.md)
*   [08. Wireframes y UX](./docs/08_wireframes_and_ux.md)
*   [09. Plan de Pruebas](./docs/09_testing_plan.md)
*   [10. Despliegue y CI/CD](./docs/10_deployment_cicd.md)
*   [11. Riesgos y Mitigaciones](./docs/11_risks_and_mitigations.md)

## 🛠️ Tecnologías Utilizadas

*   **Aplicación Web:** React, Next.js, TailwindCSS
*   **Aplicación Móvil:** React Native, Expo
*   **Backend:** Node.js
*   **Base de Datos:** Prisma ORM, PostgreSQL (con pgvector)
*   **Infraestructura:** Docker, Docker Compose

## 💻 Entorno de Desarrollo Local

Para correr el proyecto en entorno de desarrollo local, puedes usar los scripts pre-configurados en la raíz del proyecto.

### Prerrequisitos
- Node.js (v18+)
- Docker y Docker Compose
- NPM (gestor de dependencias)

### Comandos Principales

1. **Instalar dependencias globales del monorepo:**
   ```bash
   npm install
   ```

2. **Migrar base de datos local:**
   ```bash
   npm run db:migrate
   ```

3. **Generar el cliente Prisma:**
   ```bash
   npm run db:generate
   ```

4. **Levantar los entornos de desarrollo:**
   *   **Backend:** `npm run dev:backend`
   *   **Aplicación Web:** `npm run dev:web`
   *   **Aplicación Móvil:** `npm run dev:mobile`

---
*Hecho con 💡 para una gestión financiera familiar más inteligente y privada.*