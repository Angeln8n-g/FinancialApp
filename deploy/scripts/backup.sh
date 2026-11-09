#!/usr/bin/env bash
# ==============================================================================
# HogarIQ - Script de Respaldo Automatizado (1-Click Backup)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="hogariq_backup_${TIMESTAMP}"
TARGET_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
ARCHIVE_PATH="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

CONTAINER_DB="${CONTAINER_DB:-hogariq_db}"
POSTGRES_USER="${POSTGRES_USER:-hogariq_user}"
POSTGRES_DB="${POSTGRES_DB:-hogariq_prod_db}"
UPLOADS_DIR="${UPLOADS_DIR:-./uploads}"

mkdir -p "${TARGET_DIR}"

echo "=========================================="
echo "  Iniciando Respaldo Integral de HogarIQ  "
echo "  Fecha: $(date)"
echo "=========================================="

# 1. Respaldo de Base de Datos PostgreSQL
echo "[1/3] Exportando base de datos PostgreSQL (${POSTGRES_DB})..."
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_DB}$"; then
  docker exec -t "${CONTAINER_DB}" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c -b -v > "${TARGET_DIR}/database.dump"
  echo "✓ Volcado binario PostgreSQL guardado en database.dump"
else
  echo "⚠️ Contenedor ${CONTAINER_DB} no está en ejecución. Intentando pg_dump directo..."
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c -b -v > "${TARGET_DIR}/database.dump"
fi

# 2. Respaldo de Archivos y Comprobantes Escaneados
echo "[2/3] Respaldando comprobantes y adjuntos..."
if [ -d "${UPLOADS_DIR}" ]; then
  cp -r "${UPLOADS_DIR}" "${TARGET_DIR}/uploads"
  echo "✓ Comprobantes adjuntos copiados exitosamente."
else
  mkdir -p "${TARGET_DIR}/uploads"
  echo "ℹ️ Directorio de uploads no detectado; se incluye directorio vacío."
fi

# 3. Metadatos del Respaldo
cat <<EOF > "${TARGET_DIR}/metadata.json"
{
  "version": "1.0.0",
  "platform": "HogarIQ Self-Hosted",
  "timestamp": "${TIMESTAMP}",
  "database": "${POSTGRES_DB}",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# 4. Empaquetar y Comprimir
echo "[3/3] Comprimiendo archivo consolidado..."
tar -czf "${ARCHIVE_PATH}" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${TARGET_DIR}"

echo "=========================================="
echo "✅ ¡Respaldo completado exitosamente!"
echo "📁 Archivo: ${ARCHIVE_PATH}"
echo "📊 Tamaño: $(du -h "${ARCHIVE_PATH}" | cut -f1)"
echo "=========================================="
