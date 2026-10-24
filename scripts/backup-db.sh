#!/usr/bin/env bash
# ==============================================================================
# HogarIQ - Script de Respaldo Automatizado de Base de Datos PostgreSQL
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/backups/hogariq"
LOG_FILE="${BACKUP_DIR}/backup.log"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/hogariq_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "Iniciando respaldo de base de datos hogariq_prod_db..."

# Verificar si el contenedor hogariq_db está en ejecución
if ! docker ps --format '{{.Names}}' | grep -q "^hogariq_db$"; then
    log "ERROR: El contenedor hogariq_db no se encuentra en ejecución."
    exit 1
fi

# Ejecutar pg_dump y comprimir con gzip
if docker exec hogariq_db pg_dump -U hogariq_user -d hogariq_prod_db | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
    log "✓ Respaldo completado exitosamente: ${BACKUP_FILE} (Tamaño: ${BACKUP_SIZE})"
else
    log "ERROR: Falló la ejecución de pg_dump."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Eliminar respaldos con más de 14 días de antigüedad
log "Limpiando respaldos con más de ${RETENTION_DAYS} días de antigüedad..."
find "${BACKUP_DIR}" -name "hogariq_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

log "Proceso de respaldo finalizado correctamente."
