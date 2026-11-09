@echo off
REM ==============================================================================
REM HogarIQ - Script de Respaldo Automatizado para Windows
REM ==============================================================================
setlocal enabledelayedexpansion

set BACKUP_DIR=.\backups
set CONTAINER_DB=hogariq_db
set POSTGRES_USER=hogariq_user
set POSTGRES_DB=hogariq_prod_db
set UPLOADS_DIR=.\uploads

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_NAME=hogariq_backup_%TIMESTAMP%
set TARGET_DIR=%BACKUP_DIR%\%BACKUP_NAME%

echo ==========================================
echo   Iniciando Respaldo Integral de HogarIQ
echo   Marca de tiempo: %TIMESTAMP%
echo ==========================================

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [1/3] Exportando base de datos PostgreSQL (%POSTGRES_DB%)...
docker exec -t %CONTAINER_DB% pg_dump -U %POSTGRES_USER% -d %POSTGRES_DB% -F c -b > "%TARGET_DIR%\database.dump"
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo exportar la base de datos con Docker.
    exit /b %errorlevel%
)
echo [OK] Volcado de base de datos generado con exito.

echo [2/3] Respaldando archivos y comprobantes escaneados...
if exist "%UPLOADS_DIR%" (
    xcopy /E /I /Q "%UPLOADS_DIR%" "%TARGET_DIR%\uploads"
) else (
    mkdir "%TARGET_DIR%\uploads"
)

echo [3/3] Empaquetando respaldo en archivo ZIP...
tar -czf "%BACKUP_DIR%\%BACKUP_NAME%.tar.gz" -C "%BACKUP_DIR%" "%BACKUP_NAME%"
rmdir /s /q "%TARGET_DIR%"

echo ==========================================
echo [EXITO] Respaldo generado correctamente:
echo %BACKUP_DIR%\%BACKUP_NAME%.tar.gz
echo ==========================================
pause
