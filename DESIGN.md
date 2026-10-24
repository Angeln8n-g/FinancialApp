# Design System: HogarIQ (Family Mint)

## Visual World: Family Mint
El universo visual **Family Mint** combina solidez institucional y cercanía humana. Evoca salud financiera, crecimiento y serenidad en el hogar, alejándose de estéticas frías de terminal bursátil y de estridencias de estilo neón/cripto.

## Design Tokens

### Color Palette
- **Fondo Base (`--background`)**: `#0A1128` (Azul Marino Noche profundo, calmado y libre de reflejos agresivos)
- **Superficie Principal (`--surface`)**: `#101A36` (Tarjetas y contenedores primarios)
- **Superficie Elevada / Hover (`--surface-elevated`)**: `#162347`
- **Superficie Activa / Focus (`--surface-active`)**: `#1D2D5A`
- **Bordes (`--border`)**: `#1E2B4D` (Borde sutil de 1px)
- **Borde de Énfasis (`--border-subtle`)**: `rgba(255, 255, 255, 0.08)`
- **Acento Primario (`--primary`)**: `#10B981` (Menta / Esmeralda Inteligente: evoca crecimiento y orden)
- **Primario Hover (`--primary-hover`)**: `#059669`
- **Acento Metas / Ahorros (`--accent-saving`)**: `#F59E0B` (Ámbar cálido para metas compartidas)
- **Ingreso (+)**: `#10B981` (Verde esmeralda nítido)
- **Gasto (-)**: `#F43F5E` (Frambuesa / Coral suave, perceptible pero no alarmista)
- **Texto Principal (`--foreground`)**: `#F8FAFC`
- **Texto Secundario (`--foreground-muted`)**: `#94A3B8`
- **Texto Terciario / Metadata (`--foreground-subtle`)**: `#64748B`

### Typography & Numerals
- **Stack Sans**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Números Financieros**: Todos los valores monetarios, porcentajes y fechas deben utilizar `font-variant-numeric: tabular-nums` (`tabular-nums` en Tailwind) para evitar desalineación entre dígitos contables.

### Iconography Rules
- **Prohibición de Emojis en Chrome**: Ningún emoji Unicode debe usarse como icono de navegación, botón o indicador funcional.
- **Iconos Vectoriales**: Toda la iconografía utiliza `lucide-react` con `strokeWidth={1.8}` a `strokeWidth={2}` para una consistencia visual unificada.

### Surfaces & Shadows
- **Tarjetas**: Superficies limpias sin efecto blur excesivo, con borde de 1px y radio `rounded-2xl` o `rounded-xl`.
- **Botones de Acción**:
  - Acción Primaria: Fondo esmeralda/menta sólido o degradado suave de tono controlado (`from-emerald-600 to-teal-600`).
  - Gasto: Fondo frambuesa suave (`bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20`).
  - Ingreso: Fondo menta suave (`bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20`).
- **Estados**: Indicadores de foco visibles, micro-transiciones suaves (`transition-all duration-150`).
