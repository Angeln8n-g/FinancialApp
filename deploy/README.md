# 🚀 Guía de Despliegue Masivo y Homelab — HogarIQ

HogarIQ ha sido diseñado bajo la filosofía **100% Self-Hosted & Local-First**. Tus datos financieros familiares nunca salen de tu propia infraestructura.

A continuación encontrarás los templates y guías de instalación rápida (1-Click) para las plataformas de homelab más populares:

---

## 📦 Plataformas Soportadas

| Plataforma | Ubicación del Template | Tipo de Despliegue |
| :--- | :--- | :--- |
| **Umbrel** | `deploy/umbrel/` | App Store oficial / Custom App Store |
| **CasaOS** | `deploy/casaos/` | Custom App (Docker Compose con `x-casaos`) |
| **Coolify** | `deploy/coolify/` | Stack Compose con proxy Traefik y SSL |
| **Unraid** | `deploy/unraid/` | Community Applications XML Template |
| **Docker Compose** | `./docker-compose.yml` | Despliegue estándar en cualquier servidor Linux/macOS/Windows |

---

## 1. 🟣 Despliegue en Umbrel

1. Abre tu terminal o accede por SSH a tu servidor Umbrel.
2. Copia la carpeta `deploy/umbrel` dentro del directorio de aplicaciones personalizadas de Umbrel:
   ```bash
   cp -r deploy/umbrel ~/umbrel/app-stores/custom/hogariq
   ```
3. En la interfaz web de Umbrel, dirígete a la **App Store**, busca **HogarIQ** y presiona **Instalar**.
4. ¡Listo! La aplicación iniciará con Postgres, Redis, Backend y Web preconfigurados.

---

## 2. 🟡 Despliegue en CasaOS

1. Abre el panel principal de CasaOS en tu navegador (`http://<ip-casaos>`).
2. En la esquina superior derecha del área de apps, haz clic en **+ (Instalar)** -> **Custom Install**.
3. Haz clic en el botón superior derecho **Import** e importa el archivo:
   `deploy/casaos/docker-compose.yml`
4. Revisa los puertos (por defecto `3010`) y presiona **Instalar**.
5. CasaOS descargará las imágenes y creará el acceso directo en tu escritorio.

---

## 3. 🔵 Despliegue en Coolify

1. En tu dashboard de Coolify, crea un nuevo **Proyecto** o ingresa a uno existente.
2. Haz clic en **+ New Resource** -> **Docker Compose**.
3. Pega el contenido de `deploy/coolify/docker-compose.yml`.
4. En la pestaña de variables de entorno, configura:
   - `COOLIFY_FQDN_API`: Dominio de tu backend (ej. `https://api.hogariq.tudominio.com`).
   - `POSTGRES_PASSWORD`: Contraseña segura para PostgreSQL.
   - `JWT_SECRET`: Llave secreta segura para los tokens JWT.
5. Presiona **Deploy**. Coolify gestionará automáticamente los certificados SSL Let's Encrypt y el enrutamiento HTTP/HTTPS.

---

## 4. 🔴 Despliegue en Unraid

1. Abre el menú **Docker** o **Community Applications** en la interfaz de Unraid.
2. Coloca la plantilla `deploy/unraid/hogariq.xml` en la ruta `/boot/config/plugins/dockerMan/templates-user/`.
3. Ve a **Docker -> Add Container** y selecciona la plantilla **HogarIQ**.
4. Configura la ruta de almacenamiento (`/mnt/user/appdata/hogariq/uploads`) y presiona **Apply**.

---

## 💾 Respaldo y Restauración en 1-Paso (Backup & Restore)

HogarIQ incluye scripts de respaldo todo-en-uno que consolidan la base de datos PostgreSQL y todos los comprobantes adjuntos en un único archivo `.tar.gz`.

### Crear un Respaldo:
- **En Linux / macOS / Homelab:**
  ```bash
  chmod +x deploy/scripts/backup.sh
  ./deploy/scripts/backup.sh
  ```
- **En Windows:**
  ```cmd
  deploy\scripts\backup.bat
  ```
El archivo generado se guardará en `backups/hogariq_backup_YYYYMMDD_HHMMSS.tar.gz`.

### Restaurar un Respaldo:
- **En Linux / macOS / Homelab:**
  ```bash
  chmod +x deploy/scripts/restore.sh
  ./deploy/scripts/restore.sh ./backups/hogariq_backup_20261109_120000.tar.gz
  ```
- **En Windows:**
  ```cmd
  deploy\scripts\restore.bat .\backups\hogariq_backup_20261109_120000.tar.gz
  ```

---

## 📱 Sincronización Móvil Offline-First

Para conectar la app móvil Expo a tu instancia self-hosted:
1. En la pantalla de login de la aplicación móvil, haz clic en **"Servidor Personalizado"**.
2. Ingresa la URL de tu servidor (ej. `http://192.168.1.150:3011` o `https://api.hogariq.tudominio.com`).
3. El motor **Offline-First** guardará localmente cualquier gasto o comprobante si te quedas sin cobertura celular, sincronizándolo automáticamente al volver a casa.
