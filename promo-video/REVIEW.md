# REVIEW — HogarIQ Promo Video (Opción C: «Dos cuentas, una sola calma»)

## Resumen de Verificación Técnica (`hyperframes check`)
- **Último informe:** `promo-video/.hyperframes/artifacts/checks/0b415c99-447d-46aa-a618-742c536fc354.json` (revisión `038f2004-ae1b-485b-bcf9-f08a7364bb14`, estado global **`ok: true`**)
- **Lint (`LINT`):** `ok: true` (`0` errores, `0` advertencias, `0` info en 6 archivos)
- **Runtime (`RUNTIME`):** `ok: true` (`0` errores, `0` advertencias)
- **Layout (`LAYOUT`):** `ok: true` (`0` errores, `0` advertencias; `3` notas `info` esperadas en transición `pr-label`, salida offscreen de `pr-cursor` y recorte de scrollbar en `.desktop-img`)
- **Motion (`MOTION`):** `ok: true` (`0` errores, `0` advertencias)
- **Contrast (`CONTRAST`):** `ok: true` (`0` errores, `0` advertencias — `48/48` elementos verificados bajo WCAG AA)
- **Craft (`CRAFT`):** `ok: true` (`0` errores, `0` advertencias — `260` muestras de composición verificadas)
- **Audio externo (`FFmpeg` / `ffprobe`):** `ok: true` (`0` errores, `0` advertencias — validado con `ffmpeg 9.0.2-essentials_build-www.gyan.dev` y `ffprobe 9.0.2-essentials_build-www.gyan.dev` instalados en `%LOCALAPPDATA%\ffmpeg\ffmpeg-9.0.2-essentials_build\bin` y agregados al `PATH` de usuario)

## Render Final (`.mp4`) Verificado
- **Archivo:** `promo-video/renders/hogariq-promo.mp4` (`6,874,134` bytes / `6.6 MB`)
- **Video (`ffprobe`):** `h264` High (`yuv420p`, `bt709`), `1920×1080` (`16:9`), `30 fps` exactos (`975` frames, `32.500000 s`, `~1.49 Mbps`)
- **Audio (`ffprobe`):** `aac` LC estéreo (`48000 Hz`, `2` canales, `32.500000 s`, `~196 kbps` — BGM + 11 cues SFX mezclados)
- **Inspección post-encode:** Fotogramas clave (`4.64s`, `20.52s`, `27.00s`, `31.20s`) extraídos directamente del `.mp4` confirman paridad visual total tras compresión.

## Inspección Visual & Correcciones Aplicadas
Se revisaron hojas de contacto (`review-beats.jpg`, `review-phone.jpg`, `review-seam-01.jpg` a `review-seam-07.jpg` y capturas clave en `keybeats-v2/contact-sheet.jpg`):

1. **Ajuste de contrato raíz (`index.html`):** Se declararon `data-width="1920"`, `data-height="1080"`, esquema en arreglo JSON (`type: "font"` para fuentes) e identificadores estables (`id="..."`) en todos los `.clip` y `<audio>`.
2. **Alineación exacta y vida útil de `press-ripple` (`18.28s → 23.73s`):** Se sincronizó `data-composition-duration="5.45"` junto con `press_at: 2.02` (`target_x: 82.6`, `target_y: 51.9`), logrando que `"1-Click Saldar ($42.50)"` permanezca legible >1.5s, comprima justo a `20.30s` con anillo esmeralda a `20.42s` y mantenga `"✓ ¡Saldado!"` estable hasta la transición hacia Flujo Predictivo (`23.73s`).
3. **Eliminación de solapamiento numérico en Split 50/50 (`03-family-split.html`):** Se secuenciaron `+$42.50 -> $0.00`, `Mateo Rivera ($0.00 -> $42.50)` y `"A favor (pendiente saldar)" -> "Liquidado • Balance en cero"` sin superposición entre frames alrededor de `20.45s`.
4. **Limpieza de cortes en `10.00s` y `23.75s`:** Se eliminó el velo blanco `.unify-wash` al colapsar la pantalla dividida y se ajustaron las entradas iniciales de `01-split-hook`, `02-unified-dashboard`, `04-forecast-and-night` y `05-end-card` para eliminar fotogramas vacíos en Frame 0 y en los puntos de corte.
5. **Contraste AA y pulido en modo Family Mint:** Se corrigió contraste en etiquetas secundarias (`#544E48` / `#047857`), se amplió la altura de `.bars-row` para evitar desbordes de eje y se recortó limpiamente el scrollbar lateral del navegador en `.desktop-img`.
6. **Limpieza:** Eliminada la carpeta temporal `_capture_site/` del workspace.
