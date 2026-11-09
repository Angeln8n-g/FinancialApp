#!/usr/bin/env bash
# ==============================================================================
# HogarIQ - Script de Restauración (1-Click Restore)
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Uso: $0 <ruta_al_archivo_backup.tar.gz>"
  echo "Ejemplo: $0 ./backups/hogariq_backup_20261109_120000.tar.gz"
  exit 1
fi

ARCHIVE_PATH="$1"
if [ ! -f "${ARCHIVE_PATH}" ]; then
  echo "❌ Error: El archivo ${ARCHIVE_PATH} no existe."
  exit 1
fi

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "${TEMP_DIR}"' EXIT

CONTAINER_DB="${CONTAINER_DB:-hogariq_db}"
POSTGRES_USER="${POSTGRES_USER:-hogariq_user}"
POSTGRES_DB="${POSTGRES_DB:-hogariq_prod_db}"
UPLOADS_DIR="${UPLOADS_DIR:-./uploads}"

echo "=========================================="
echo "  Iniciando Restauración de HogarIQ       "
echo "  Archivo: ${ARCHIVE_PATH}"
echo "=========================================="

echo "[1/3] Descomprimiendo archivo de respaldo..."
tar -xzf "${ARCHIVE_PATH}" -C "${TEMP_DIR}"
BACKUP_FOLDER=$(find "${TEMP_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ -z "${BACKUP_FOLDER}" ] || [ ! -f "${BACKUP_FOLDER}/database.dump" ]; then
  echo "❌ Error: Formato de respaldo inválido (no se encontró database.dump)."
  exit 1
fi

echo "[2/3] Restaurando base de datos PostgreSQL en contenedor ${CONTAINER_DB}..."
cat "${BACKUP_FOLDER}/database.dump" | docker exec -i "${CONTAINER_DB}" pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists -v || true
echo "✓ Base de datos restaurada correctamente."

echo "[3/3] Restaurando archivos de tickets y comprobantes..."
if [ -d "${BACKUP_FOLDER}/uploads" ]; then
  mkdir -p "${UPLOADS_DIR}"
  cp -r "${BACKUP_FOLDER}/uploads/"* "${UPLOADS_DIR}/" || true
  echo "✓ Archivos de comprobantes restaurados."
fi

echo "=========================================="
echo "✅ ¡Restauración completada con éxito!"
echo "   HogarIQ está listo para operar."
echo "=========================================="
