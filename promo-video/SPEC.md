# SPEC — HogarIQ Promo Video (Opción C: «Dos cuentas, una sola calma»)

## GOAL
- **Audience:** Parejas y hogares que coordinan gastos diarios, pagos recurrentes y metas compartidas sin hojas de cálculo ni discusiones incómodas.
- **Core Idea:** La fricción de dividir gastos entre dos cuentas dispersas colapsa visual y literalmente en **una sola pantalla de calma** con `@HogarIQBot`, Split 50/50 en 1 clic, proyección a 30 días y modo día/noche sincronizado web y móvil.
- **Language:** Español (España/LatAm neutro, directo y cálido).
- **Narrative Spine (one problem/value thread from frame 1 to end card):** Un gasto real de supermercado (`$85.00` — `$42.50 c/u`) + el balance diario del hogar viajan desde un chat confuso en pantalla dividida hasta quedar registrados por IA, liquidados en `Split 50/50` (`1-Click Saldar` -> `$0.00`), reflejados en `+30 días` de liquidez proyectada (`$1,510.82 / día`), y cerrados en el ecosistema HogarIQ web y móvil.
- **Format Choice (`STORYLINES.md`):** Opción C (*Split screen to one* × *One continuous take / camera travel*).

## OUTPUT
- **Project folder:** `promo-video/`
- **Canvas:** `1920 × 1080`, `30 fps`, total duration **`32.50s` (`975` frames)**.
- **Safe margin:** `96px` outer margin (`x: 96..1824`, `y: 72..1008`) on full cards; hero focal element always occupies `42%–72%` of frame width; isolated UI text scaled cleanly for `1920×1080` (`>= 26px` on isolated hero text, `44–84px` for focal numbers, `56–72px` for titles).

## TIME & MUSICAL CLOCK
- **Audio Engine & Music Track:** Catalog BGM `assets/bgm/track.wav` (HeyGen catalog `2119937a — warm uplifting modern ambient, acoustic-electronic bed, 96 BPM`), sliced from `data-media-start="30.0"` to `62.5s` (`32.50s` duration):
  - **Measured Tempo:** `96 BPM` (`1 beat = 0.625s = 18.75f`, `2 beats = 1.250s = 37.5f`, `1 bar = 2.500s = 75f`).
  - **Built-in Track Dynamics (measured 50ms RMS):**
    - `0.00s–10.00s` (file `30s..40s`): warm plucked ambient pulse (`~ -23 dB`) -> supports the 50/50 split tension & `@HogarIQBot` capture.
    - **`10.00s` (file `40.00s`, `-11 dB` peak downbeat):** **CHORUS LIFT** -> triggers the physical 50/50 split collapse into ONE unified workspace!
    - `10.00s–27.50s` (file `40s..57.5s`): steady full groove (`~ -17 dB`, 2-beat transients every `1.250s`) -> drives continuous camera travel across KPI, Family 50/50, 30-day What-If, and Day-to-Night Mint transition.
    - `27.50s–32.50s` (file `57.5s..62.5s` + `data-fade-out="2.4"`): natural arrangement taper into final HogarIQ End Card.
- **Duration Budget (zero gaps, overlapping seams handled cleanly inside a continuous world / hard beat transitions):**
  1. `01-split-hook` — `0.00s → 10.00s` (`10.00s`, bars 1–4): **Gancho + Tensión dividida (50/50 Split -> `@HogarIQBot`)**
  2. `02-unified-dashboard` — `10.00s → 16.25s` (`6.25s`, bars 5–6.5): **Revelación (Colapso a un solo control: Express AI + Disponible Hoy `$1,510.82 / día`)**
  3. `03-family-split` — `16.25s → 23.75s` (`7.50s`, bars 6.5–9.5): **Prueba (Split 50/50 Familiar `$85.00` -> `1-Click Saldar` -> `¡Cuentas totalmente equilibradas!`)**
  4. `04-forecast-and-night` — `23.75s → 28.75s` (`5.00s`, bars 9.5–11.5): **Clímax (Flujo a 30 Días + Transición Marfil -> Family Mint Web & Móvil)**
  5. `05-end-card` — `28.75s → 32.50s` (`3.75s`, final 1.5 bars): **Cierre de Marca (Isotipo HogarIQ animado, `Tu hogar en una sola cuenta.`, `hogariq.kasino21.com`)**

## LOOK (Normative `DESIGN.md` Tokens — 3 Brand Themes + Typography)
- **Fonts:** Local bundled `.woff2` captured from `hogariq.kasino21.com`:
  - `Geist` (variable `100 900`) — UI & Display headings (`letter-spacing: -0.03em` display, `-0.02em` headings)
  - `Geist Mono` (variable `100 900`) — Financial numerals with `font-variant-numeric: tabular-nums`
- **Palette Tokens (strict `DESIGN.md` values):**
  - **Modo Día (*Marfil Pergamino* / `warm-ivory`):**
    - Ground `#F6F3EC`, Surface `#FFFFFF`, Surface Hover `#EDE7DC`, Border `#DCD3C3`
    - Primary/Gold `#B45309`, Foreground `#1C1917`, Muted `#544E48`, Subtle `#787068`
    - Income/Healthy `#059669`, Expense `#DC2626`
  - **Modo Tensión (*Café Ejecutivo* / `warm-espresso` — right split pane in Scene 1):**
    - Ground `#120F0D`, Surface `#1A1613`, Surface Hover `#251F1B`, Border `#362C24`
    - Primary `#F59E0B`, Foreground `#FDFBF7`, Muted `#C4B5A8`, Subtle `#948578`
    - Telegram/Positive Mint `#10B981`, Rose `#F43F5E`
  - **Modo Clímax (*Family Mint* / `mint` — Night Calm & End Card):**
    - Ground `#0A1128`, Surface `#101A36`, Surface Hover `#162347`, Border `#1E2B4D`
    - Primary `#10B981`, Secondary Sky `#38BDF8`, Amber `#F59E0B`
    - Foreground `#F8FAFC`, Muted `#94A3B8`, Subtle `#64748B`
- **Atmosphere & Banding Protection:** Only solid grounds (`#F6F3EC`, `#120F0D`, `#0A1128`) and soft **radial glows** (opacity `0.16–0.28` around focal surfaces, zero full-screen linear dark gradients). Sharp surface borders `1.5px` (`warm-ivory` `#DCD3C3`, `mint` `#1E2B4D`) + warm elevated shadows so UI surfaces stand cleanly off the backdrop at 1920×1080.
- **Root Variables Contract:** Root `index.html` declares `data-composition-variables` for `ground`, `ink`, `accent`, `font_display`, `font_mono`.

## OBJECTS & CHOREOGRAPHY
1. **Scene 1 (`01-split-hook`, 0.00s–10.00s):**
   - Frame starts split `50% / 50%`:
     - **Left half (`warm-ivory` `#F6F3EC`):** `"Cuenta A"` card stack — scattered receipts & chat confusion (`"¿Ya pagaste el súper?"`, `"Tarjeta vence hoy -$85.00"`, badge rojo `Sin dividir`). Soft tremor pulse at `2.50s` (`-1` frame shift) showing mental friction.
     - **Right half (`warm-espresso` `#120F0D`):** Authentic HogarIQ Telegram bot card (`@HogarIQBot` / `Conectar Bot Telegram`) + dark mobile chat frame with real touch tap (`touch-indicator` mounted component!) typing and sending: `"Supermercado 85 compartido"`.
     - **Headline (centered across seam card -> disappears before collapse):** `"Dos cuentas. Un caos."` (enters cleanly `0.25s`, holds `2.2s`, exits smoothly before collapse).
   - **`5.00s–8.75s`:** Bot responds with verified AI parse pill (`Categoría: Hogar • $85.00 • 🤝 50/50 Pareja`). Both halves tension up cleanly (`1.00 -> 1.03` anticipation on central hairline seam at `8.75s–9.85s`).
   - **`9.85s–10.00s`:** Center seam flashes `#10B981` + both halves physically slide/collapse inward (`power4.in` leading cleanly into `10.00s` `-11dB` chorus hit!).

2. **Scene 2 (`02-unified-dashboard`, 10.00s–16.25s):**
   - Opens at `10.00s` on unified *Marfil Pergamino* (`#F6F3EC`) HogarIQ workspace landing cleanly from center collapse (`expo.out` settle, **0ms** post-cut continuation!).
   - Camera pushes in (3-step product demo law: establish -> **isolate 1.85×** on QuickEntry + `Disponible Hoy` KPI card -> return).
   - Real top header chrome (`HogarIQ HOGAR`, `Hogar Rivera`, tabs `Dashboard | Presupuestos | Compromisos | Familia`) rendered faithfully above the **Express (Lenguaje Natural)** bar (`"Supermercado 85 compartido"` locked with emerald badge `Categoría: Hogar ✓` + `Registrar`).
   - Headline (`≤ 6 words`, dead-still once landed): `"Un mensaje. Todo en orden."`
   - **`12.50s–15.00s`:** Focus sweeps smoothly onto the enlarged **`Disponible Hoy`** card: counter & `number-pop-in` resolve cleanly to **`$1,510.82 / día`** with green **`Saludable`** pill + `Mes libre: $25,683.97` (`16.5 meses` runway). Camera drifts downward toward the `Familia` tab highlight at `15.75s–16.25s`.

3. **Scene 3 (`03-family-split`, 16.25s–23.75s):**
   - Motivated tab-slide / horizontal push (`Familia` pill activates -> smooth slide left into `/dashboard/family` **Gastos Compartidos en Pareja / Hogar (Split 50/50)**).
   - Isolated hero panel (`72%` width, large typography `>= 28px`, focal numbers `56px`):
     - Three real cards side-by-side: `Total Gastado en Común: $85.00`, `Cuota Justa por Adulto: $42.50`, `Tu Balance Personal: +$42.50 a favor` (`Sofía` vs `Mateo` individual bars).
     - Headline: `"Cuentas claras, mitad y mitad."`
   - **Mounted `press-ripple` component (`19.20s–22.50s`):** Cursor (`arrow`, 4.5% width) sweeps smoothly onto the real Amber/Emerald **`1-Click Saldar`** button, compresses in lockstep (`press_at`), triggers two expanding emerald rings -> label swaps cleanly to **`✓ Saldado`** -> **same-frame UI reaction**: balance ticks smoothly `$42.50 → $0.00`, `success-check` banner illuminates **`¡Cuentas totalmente equilibradas!`** (`#059669`)! Cursor exits off-stage right so confirmed state holds crisp and unobstructed (`21.3s–23.75s`).

4. **Scene 4 (`04-forecast-and-night`, 23.75s–28.75s):**
   - Camera tracks into **Flujo de Caja Predictivo & Salud Familiar (`IA Predictiva`, `84 /100 Saludable`)** + 7-bar **Evolución Proyectada (30 Días)** rising bar-by-bar with a golden `"What-If"` adjustment pill (`+$12,739 mes libre`).
   - **`26.00s`:** Motivated circular clip / iris wash originates cleanly from the real **`Personalizar Temas` palette button (`#10B981`)**, transforming the canvas cleanly from **Marfil Pergamino (`#F6F3EC`)** to **Family Mint (`#0A1128`)** — showcasing real HogarIQ **Desktop + Mobile** side-by-side (`assets/captured/dashboard-mint.png` + `assets/captured/dashboard-mobile-mint.png` framed in clean, crisp minimal vector hardware chrome — OR crisp native HTML + captured screen composites matching exact brand tokens) moving gracefully in depth.
   - Headline: `"Tu futuro, claro día y noche."`

5. **Scene 5 (`05-end-card`, 28.75s–32.50s):**
   - `#0A1128` serene Family Mint ground (`10%` radial `#10B981` + `#38BDF8` ambient halo behind mark).
   - UI card shrinks cleanly into the center mark: **`assets/hogariq-icon.svg`** (`240px × 240px` stage container, roof path draws/illuminates, 3 bars rise `mint -> sky -> amber`, spark dot pops!).
   - Wordmark `HogarIQ` + badge `HOGAR` lock beside/under the mark, followed by concise tagline **`"Tu hogar en una sola cuenta."`** and CTA pill **`hogariq.kasino21.com`** held crisp and rock-steady for `2.50s` (`30.00s → 32.50s`) while music fades out cleanly.

## AUDIO SYNC MAP (All SFX peaks measured in Chromium `OfflineAudioContext`)
| Cue | File | Visual Trigger (s) | Measured Peak Offset (ms) | Placed `data-start` (s) | `data-volume` |
|---|---|---|---|---|---|
| Typing chat `@HogarIQBot` | `assets/sfx/typing.mp3` | `3.10s` (`data-media-start="0.42"`) | `460ms` (trimmed to `420ms` start) | `3.10` | `0.45` |
| Key send tap | `assets/sfx/key-press.mp3` | `4.65s` | `78ms` | `4.60` | `0.50` |
| Bot AI parsed reply | `assets/sfx/notification.mp3` | `5.80s` | `232ms` (`onset 86ms`) | `5.65` | `0.38` |
| Split collapse sweep | `assets/sfx/whoosh.mp3` | `9.95s` (peaks at `10.00s` drop!) | `164ms` | `9.87` | `0.42` |
| Chorus drop / Unified settle | `assets/sfx/impact-bass-1.mp3` | `10.00s` (lands `+1` frame `10.033s`) | `77ms` | `9.96` | `0.30` |
| KPI Express card pop | `assets/sfx/pop.mp3` | `11.35s` | `122ms` | `11.26` | `0.45` |
| Tab slide -> Familia | `assets/sfx/whoosh-short.mp3` | `16.25s` | `164ms` | `16.12` | `0.38` |
| `1-Click Saldar` press | `assets/sfx/click-soft.mp3` | `20.22s` (`press_at` + compression) | `53ms` | `20.20` | `0.78` |
| `¡Equilibradas!` sparkle confirm | `assets/sfx/sparkle.mp3` | `20.38s` (`fade-out` gentle) | `30ms` | `20.38` | `0.34` |
| Theme sweep Ivory -> Mint | `assets/sfx/whoosh.mp3` | `26.00s` | `164ms` | `25.87` | `0.40` |
| End card lock click | `assets/sfx/click.mp3` | `29.15s` | `53ms` | `29.13` | `0.55` |

## MOTION VOCABULARY & EASING
- **Entrances (arrive):** `expo.out` (`0.42–0.58s`) or `power4.out` (`0.38s`) with subtle scale (`0.94 -> 1.00`) + `blur(8px -> 0px)` — **never all `power2.out`**.
- **Camera travel / Color wash:** `power2.inOut` (`0.65–1.10s`).
- **Departures (exit):** `power3.in` / `power4.in` (`0.22–0.35s`).
- **Overshoots:** only on micro-badges (`Saludable`, `Saldado`, spark dot) with `back.out(1.6)`.
- **Landed Headlines:** **DEAD STILL** (0 idle bob on titles; subtle `<= 2px` idle motion allowed ONLY on the floating devices / background ambient ring).
- **Transitions across scenes (cause-driven):**
  1. `01 -> 02`: **Physical Split Collapse** (left + right panes slam inward to unify).
  2. `02 -> 03`: **Nav Tab Slide Push** (`Familia` tab triggers horizontal camera glide).
  3. `03 -> 04`: **Continuous Vertical Card Glide** down dashboard cards into 30-day chart.
  4. `04 -> 05`: **Hero Container Morph** into the HogarIQ roof+bars logo mark.

## BANNED
- **NO** unauthenticated login forms or email PII (`angellafraga@gmail.con` — replaced with `"Sofía & Mateo"` / `"Hogar Rivera"` using real live UI design & metrics).
- **NO** marketing clichés ("desbloquea", "revoluciona", "sin esfuerzo", "en segundos", "todo en uno", "transforma").
- **NO** emojis anywhere in video-rendered UI cards/badges (replace every `🤝`, `🏆`, `👋`, `🔑` with Lucide SVG paths matching `apps/web/src/components`!).
- **NO** tiny illegible text (`< 24px` in hero UI focal panels — bump card scale + typography smoothly).
- **NO** full-screen linear dark gradients that band in 8-bit H.264.
- **NO** corner watermark / persistent corner logo before the End Card.
- **NO** `gsap.from()` (always `gsap.fromTo()` with `immediateRender: false` on later tweens).
- **NO** CSS `@keyframes`, Tailwind `animate-spin`/`animate-pulse`, or CSS `transform` fighting GSAP.
- **NO** `display: none` / `visibility` / `autoAlpha` directly on `.clip` elements.
- **NO** synthesized audio or unmeasured ping-pong/chime SFX (`chime.mp3` & `ping.mp3` removed).

## QA CHECKPOINTS
- Verify key frames via `npx hyperframes check --snapshots --json` and `npx hyperframes snapshot --review`:
  - `t = 1.50s` (50/50 split opening legible, Marfil vs Espresso)
  - `t = 5.90s` (`@HogarIQBot` parsed pill clear, touch indicator lifted)
  - `t = 10.05s` (Split collapse landed cleanly into Unified Dashboard)
  - `t = 13.50s` (`$1,510.82 / día` KPI isolated and sharp >= 26px)
  - `t = 20.40s` (`1-Click Saldar` pressed, emerald rings + `¡Cuentas totalmente equilibradas!`)
  - `t = 26.80s` (Theme wash into Family Mint `#0A1128` + desktop/mobile pair)
  - `t = 31.20s` (End Card mark 15–30% frame width, dead-still copy, `hogariq.kasino21.com` CTA)
  - `review-seam-*.jpg` across `9.9–10.2`, `16.1–16.4`, `23.6–23.9`, `28.6–28.9`
  - `review-phone.jpg` mobile legibility check (`<= 640px` thumb preview)
