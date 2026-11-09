@echo off
REM ==============================================================================
REM HogarIQ - Script de Restauración para Windows
REM ==============================================================================
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Uso: restore.bat ^<ruta_al_archivo_backup.tar.gz^>
    echo Ejemplo: restore.bat .\backups\hogariq_backup_20261109_120000.tar.gz
    exit /b 1
)

set ARCHIVE_PATH=%~1
set CONTAINER_DB=hogariq_db
set POSTGRES_USER=hogariq_user
set POSTGRES_DB=hogariq_prod_db
set UPLOADS_DIR=.\uploads
set TEMP_DIR=.\temp_restore

if not exist "%ARCHIVE_PATH%" (
    echo [ERROR] El archivo "%ARCHIVE_PATH%" no existe.
    exit /b 1
)

echo ==========================================
echo   Iniciando Restauracion de HogarIQ
echo   Archivo: %ARCHIVE_PATH%
echo ==========================================

if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo [1/3] Descomprimiendo archivo de respaldo...
tar -xzf "%ARCHIVE_PATH%" -C "%TEMP_DIR%"

echo [2/3] Restaurando base de datos PostgreSQL en contenedor %CONTAINER_DB%...
for /d %%D in ("%TEMP_DIR%\*") do (
    if exist "%%D\database.dump" (
        type "%%D\database.dump" | docker exec -i %CONTAINER_DB% pg_restore -U %POSTGRES_USER% -d %POSTGRES_DB% --clean --if-exists
        echo [OK] Base de datos restaurada correctamente.
    )
    if exist "%%D\uploads" (
        echo [3/3] Restaurando comprobantes y adjuntos...
        if not exist "%UPLOADS_DIR%" mkdir "%UPLOADS_DIR%"
        xcopy /E /I /Q /Y "%%D\uploads\*" "%UPLOADS_DIR%\"
    )
)

rmdir /s /q "%TEMP_DIR%"

echo ==========================================
echo [EXITO] Restauracion completada con exito!
echo ==========================================
pause
