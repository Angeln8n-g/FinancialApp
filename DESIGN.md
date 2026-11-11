# Design System: HogarIQ Multi-Theme System

## Visual Worlds & Chromatic Harmony

HogarIQ utiliza un sistema multi-tema arquitectónico diseñado para equilibrar solidez institucional, calidez hogareña y ergonomía visual prolongada. Cada paleta está calibrada matemáticamente para cumplir con estándares WCAG AAA/AA (contraste mínimo de 4.5:1 para texto secundario y 7:1+ para texto principal).

---

## 1. Los 5 Universos Visuales

### 1.1 Ámbar & Café Ejecutivo (`warm-espresso`) - *Tema Predeterminado*
- **Concepto**: Banca patrimonial privada y descanso visual absoluto para largas sesiones de control financiero sin fatiga ocular.
- **Fondo Base (`--background`)**: `#120F0D` (Espresso tostado profundo)
- **Superficie Principal (`--surface`)**: `#1A1613` (Café umber satinado)
- **Superficie Hover (`--surface-hover`)**: `#251F1B`
- **Superficie Activa (`--surface-active`)**: `#322B25`
- **Borde (`--border`)**: `#362C24` (1px sutil)
- **Borde de Énfasis (`--border-subtle`)**: `rgba(245, 158, 11, 0.12)`
- **Acento Primario (`--primary`)**: `#F59E0B` (Oro ambarino cálido)
- **Acento Primario Hover (`--primary-hover`)**: `#D97706`
- **Texto Principal (`--foreground`)**: `#FDFBF7` (Porcelana cálida, contraste 17.2:1)
- **Texto Secundario (`--foreground-muted`)**: `#C4B5A8` (Pergamino tostado, contraste 9.1:1)
- **Texto Terciario (`--foreground-subtle`)**: `#948578` (Umber atenuado, contraste 5.2:1)

### 1.2 Cobre & Nogal Real (`warm-copper`)
- **Concepto**: Lujo artesanal inspirado en terracota toscana, cobre cepillado y maderas nobles.
- **Fondo Base (`--background`)**: `#14100F`
- **Superficie Principal (`--surface`)**: `#1E1816`
- **Superficie Hover (`--surface-hover`)**: `#2B2220`
- **Superficie Activa (`--surface-active`)**: `#382D2A`
- **Borde (`--border`)**: `#42322E`
- **Borde de Énfasis (`--border-subtle`)**: `rgba(234, 88, 12, 0.12)`
- **Acento Primario (`--primary`)**: `#EA580C` (Cobre quemado / Terracota)
- **Acento Primario Hover (`--primary-hover`)**: `#C2410C`
- **Texto Principal (`--foreground`)**: `#FAF5F0` (Lino cálido, contraste 16.6:1)
- **Texto Secundario (`--foreground-muted`)**: `#C8B6B0` (Arcilla suave, contraste 9.2:1)
- **Texto Terciario (`--foreground-subtle`)**: `#93817C` (Nogal claro, contraste 5.0:1)

### 1.3 Champagne & Bosque Cálido (`warm-olive`)
- **Concepto**: Gestión de patrimonio suizo y serenidad alpina. Verdes bosques profundos con reflejos champagne metálicos.
- **Fondo Base (`--background`)**: `#0F120F`
- **Superficie Principal (`--surface`)**: `#171B17`
- **Superficie Hover (`--surface-hover`)**: `#222822`
- **Superficie Activa (`--surface-active`)**: `#2E362E`
- **Borde (`--border`)**: `#353F35`
- **Borde de Énfasis (`--border-subtle`)**: `rgba(234, 179, 8, 0.12)`
- **Acento Primario (`--primary`)**: `#EAB308` (Champagne dorado)
- **Acento Primario Hover (`--primary-hover`)**: `#CA8A04`
- **Texto Principal (`--foreground`)**: `#F6F8F5` (Niebla alpina, contraste 17.1:1)
- **Texto Secundario (`--foreground-muted`)**: `#B7BFB5` (Salvia claro, contraste 8.9:1)
- **Texto Terciario (`--foreground-subtle`)**: `#828C80` (Musgo sutil, contraste 4.9:1)

### 1.4 Marfil & Cuero Pergamino (`warm-ivory` - Modo Claro)
- **Concepto**: Papelería de alta dirección, encuadernación en marfil y cuero ámbar. Sin reflejos blancos cegadores.
- **Fondo Base (`--background`)**: `#F6F3EC` (Papel marfil de archivo)
- **Superficie Principal (`--surface`)**: `#FFFFFF` (Superficie pura de tarjeta)
- **Superficie Hover (`--surface-hover`)**: `#EDE7DC`
- **Superficie Activa (`--surface-active`)**: `#E3DBD0`
- **Borde (`--border`)**: `#DCD3C3`
- **Borde de Énfasis (`--border-subtle`)**: `rgba(180, 83, 9, 0.10)`
- **Acento Primario (`--primary`)**: `#B45309` (Ámbar cuero artesanal)
- **Acento Primario Hover (`--primary-hover`)**: `#92400E`
- **Texto Principal (`--foreground`)**: `#1C1917` (Obsidiana carbón, contraste 14.2:1)
- **Texto Secundario (`--foreground-muted`)**: `#544E48` (Grafito cálido, contraste 5.4:1)
- **Texto Terciario (`--foreground-subtle`)**: `#787068` (Piedra cálida, contraste 4.5:1)
- **Sombra de Tarjetas (`--card-shadow`)**: `0 2px 14px -2px rgba(60, 45, 30, 0.08), 0 1px 3px 0 rgba(60, 45, 30, 0.04)`

### 1.5 Family Mint (`mint` - Original)
- **Concepto**: La identidad fundacional de HogarIQ. Azul zafiro noche con acentos de menta esmeralda viva.
- **Fondo Base (`--background`)**: `#0A1128` (Azul Noche Profundo)
- **Superficie Principal (`--surface`)**: `#101A36`
- **Superficie Hover (`--surface-hover`)**: `#162347`
- **Superficie Activa (`--surface-active`)**: `#1D2D5A`
- **Borde (`--border`)**: `#1E2B4D`
- **Borde de Énfasis (`--border-subtle`)**: `rgba(255, 255, 255, 0.08)`
- **Acento Primario (`--primary`)**: `#10B981` (Menta Esmeralda)
- **Acento Primario Hover (`--primary-hover`)**: `#059669`
- **Texto Principal (`--foreground`)**: `#F8FAFC`
- **Texto Secundario (`--foreground-muted`)**: `#94A3B8`
- **Texto Terciario (`--foreground-subtle`)**: `#64748B`

---

## 2. Semántica Financiera Universal

A diferencia del acento de navegación y marca (que se adapta a cada tema), los indicadores contables mantienen significado funcional invariable:

- **Ingreso (+) / Flujo Positivo**:
  - Modo Oscuro: `#10B981` (Verde esmeralda nítido, fondos al 12% de opacidad)
  - Modo Claro (`warm-ivory`): `#059669` (Verde bosque profundo, texto de alto contraste)
- **Gasto (-) / Compromiso de Salida**:
  - Modo Oscuro: `#F43F5E` (Frambuesa suave, visible sin estridencia)
  - Modo Claro (`warm-ivory`): `#DC2626` / `#9F1239` (Rubí cálido, contraste 6.5:1)
- **Alerta / Tarjeta con Deuda / Límite Próximo**:
  - Modo Oscuro: `#F59E0B` (Ámbar)
  - Modo Claro (`warm-ivory`): `#B45309` / `#92400E` (Ámbar oscuro)
- **Ahorro / Metas Acumuladas**:
  - Identificado con icono `PiggyBank` y fondos de contraste controlado.

---

## 3. Tipografía y Números Contables

- **Pila Sans**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Números Financieros**: Todos los valores monetarios, porcentajes y fechas deben utilizar `font-variant-numeric: tabular-nums` (`tabular-nums` en Tailwind). Prohibido números con espaciado proporcional en balances y tablas contables para evitar descuadre óptico de cifras.

---

## 4. Reglas de Iconografía y Componentes

- **Prohibición de Emojis en Chrome**: Ningún emoji Unicode debe usarse como icono de navegación, botón o indicador funcional.
- **Iconos Vectoriales**: Toda la iconografía utiliza `lucide-react` / `lucide-react-native` con `strokeWidth={1.8}` a `strokeWidth={2}`.
- **Navegación Activa**: Las pestañas y botones activos utilizan tokens semánticos del tema activo (`--primary`, `--primary-muted`, `--primary-border`).
- **Superficies**: Tarjetas `rounded-2xl` o `rounded-xl` con borde de 1px realzado y sombras multicapa suaves.
