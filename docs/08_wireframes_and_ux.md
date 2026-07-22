# Guía de UX/UI y Wireframes: HogarIQ

HogarIQ adopta una estética moderna de alta fidelidad, inspirada en las mejores prácticas de la banca digital y aplicaciones de finanzas personales contemporáneas.

---

## 1. Sistema de Diseño Visual

### Paleta de Colores (Estilo Neomorfismo y Modo Oscuro Premium)
- **Fondo Oscuro (Predeterminado):** HSL `224°, 25%, 12%` (Azul Grisáceo Profundo).
- **Tarjetas / Contenedores:** HSL `224°, 22%, 18%` (Gris Sólido de Contraste).
- **Primario / Acento:** HSL `250°, 95%, 68%` (Violeta Eléctrico Neón).
- **Éxito (Ingresos / Ahorro):** HSL `145°, 80%, 45%` (Verde Esmeralda Vibrante).
- **Peligro / Alerta (Gastos / Límites):** HSL `355°, 85%, 60%` (Rojo Coral).
- **Texto Primario:** HSL `0°, 0%, 98%` (Blanco Puro/Suave).
- **Texto Secundario:** HSL `220°, 12%, 65%` (Gris Muted).

### Tipografía (Google Fonts)
- **Títulos y Balances:** *Outfit* (Moderna, geométrica y con excelente legibilidad para números grandes).
- **Cuerpo y Contenido:** *Inter* (Altamente legible en resoluciones de pantalla pequeñas y móviles).

---

## 2. Layouts y Wireframes Descriptivos

### A. Vista de Dashboard Principal (Móvil)

```
+-------------------------------------------------------------+
| [Foto] Hola, Familia Pérez                     [Notif (3)]  |
|                                                             |
| Patrimonio Neto Familiar                                    |
| $14,250.45                                                  |
| (+2.4% este mes)                                            |
|                                                             |
| +---------------------------------------------------------+ |
| |  [Cuentas: Efectivo, BBVA, Visa, Crypto] (Carrusel)     | |
| +---------------------------------------------------------+ |
|                                                             |
| +-------------------------+     +-------------------------+ |
| | Presupuestos Mensuales  |     | Metas de Ahorro         | |
| | Comida: 82% [=======--] |     | Japón: 64% [======----] | |
| +-------------------------+     +-------------------------+ |
|                                                             |
| Actividad Reciente                                          |
| - Supermercado Mercadona          -$45.20   Hace 10 min     |
| - Nómina Mensual                 +$2,100.00   Ayer          |
|                                                             |
|      +-----------------------------------------------+      |
|      |    [Home]   [Calendario]   (+)   [Chat IA]   [Ajustes] |  <-- Barra Navegación
|      +-----------------------------------------------+      |
+-------------------------------------------------------------+
```

*Detalles UX:*
- El botón **(+)** central en la barra de navegación es de color violeta neón destacado y tiene un tamaño superior para incentivar el registro instantáneo.
- Deslizar hacia abajo refresca los datos e inicia una sincronización (`pull/push`) visualizada con un sutil micro-indicador en el encabezado.

---

### B. Entrada Rápida de Transacción (Modal Móvil / Web)

```
+-------------------------------------------------------------+
| [X] Cancelar                                     Guardar [v]|
|                                                             |
| ¿Cuánto gastaste?                                           |
| $ 120.00                                                    |
|                                                             |
| Categoría: [ ] Seleccionar (Ej. Transporte)                |
| Cuenta:    [ ] Tarjeta de Crédito Visa                      |
|                                                             |
| +---------------------------------------------------------+ |
| | O escribe / habla en lenguaje natural:                  | |
| | "Cena de ayer en pizzería con Visa por 45$"            | |
| | [Icono Micrófono para dictado por voz]                  | |
| +---------------------------------------------------------+ |
|                                                             |
| [ 1 ]  [ 2 ]  [ 3 ]                                         |
| [ 4 ]  [ 5 ]  [ 6 ]                                         |
| [ 7 ]  [ 8 ]  [ 9 ]                                         |
| [ . ]  [ 0 ]  [ B ]                                         |
+-------------------------------------------------------------+
```

*Detalles UX:*
- El campo del monto activa inmediatamente el teclado numérico a medida en dispositivos móviles, previniendo el retraso que produce abrir el teclado nativo alfanumérico.
- La caja de entrada en lenguaje natural se expande suavemente al ser seleccionada.

---

### C. Interfaz de Chat Financiero Contextual (IA)

```
+-------------------------------------------------------------+
| [<] Volver                Asistente IA             [Privado]|
|                                                             |
| [IA]: Hola familia. Estoy lista para responder preguntas    |
|       sobre su dinero. Sus datos no salen de este servidor. |
|                                                             |
| [Usuario]: ¿Cuánto gastamos en suscripciones este mes?      |
|                                                             |
| [IA]: Este mes han gastado $84.50 en suscripciones activas  |
|       (Netflix, Spotify, internet). Esto representa un 5%   |
|       menos que el mes anterior debido a la baja de Disney+. |
|                                                             |
| +---------------------------------------------------------+ |
| | Pregúntame sobre tus presupuestos o gastos...         | |
| | [Enviar >]                                              | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

*Detalles UX:*
- Burbujas de chat con bordes redondeados y micro-sombras.
- Indicador de "Escribiendo..." animado con tres puntos oscilantes cuando la IA local procesa la consulta RAG.
- Un indicador "Privado" en verde neón en la cabecera recuerda al usuario que su conversación se procesa al 100% de manera local.
