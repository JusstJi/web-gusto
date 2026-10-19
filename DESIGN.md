# Design · Viernes de Gusto

Mundo: **cocina en servicio** (Ji, 19/10/2026: la web anterior «parecía una fiesta para menores de 18»). La noche es un servicio de cocina: acero oscuro, luz naranja de lámpara de pase, comandas de papel térmico colgadas de un riel y fotos reales de la sala. Se mantiene el juego del restaurante (La Carta, Menú del mes, Haz tu pedido, chefs = DJs). Fuera: boca de dibujo, intro de la lengua, pegatinas, confeti y manchas de color.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--acero` / `--acero-2` / `--acero-3` | #16130F / #1F1A15 / #2B241D | Fondo y paneles |
| `--crema` / `--crema-2` | #F3EEE4 / #CDBFA8 | Texto y texto secundario |
| `--lampara` | #FF7A1A | Acción (botones), segunda línea de títulos |
| `--papel` / `--tinta` | #F4EFE3 / #16130F | Comandas, carta y planos impresos |
| Logo: `--verde` `--rojo` `--amarillo` `--naranja` | | Solo para marcar sabores y sellos |
| `--sabor` / `--sabor-tinta` | #410107 / #F7B6BA | Umami (álbum, plato, calendario) |
| `--limon` | #FDEF50 | Color anunciado de la fiesta del 30 oct |

## Tipografía (autoalojadas en `fonts/`, OFL)
- Big Shoulders Display 800/900, mayúsculas: marca, títulos, nombres de plato, botones.
- Courier Prime 400/700: todo lo que va impreso en papel (comandas, fechas, horarios, etiquetas).
- Familjen Grotesk: texto corrido y navegación.

## Componentes
- `.papel`: papel térmico con borde inferior de sierra; `.riel`: barra metálica de la que cuelga.
- Comanda de portada: próxima fiesta, horario, sitio, cuenta atrás y «Haz tu pedido». Se balancea al cargar (sin movimiento si «reducir movimiento»).
- Botón: naranja lámpara, letra de cartel, esquinas de 4px. `--hueco` con borde fino.
- Líneas de carta: nombre · puntos · dato.
- Sello rojo de goma («Primera edición», «¡Marchando!»).

## Fotos
- Portada: `fotos/portada.jpg` (foto 02 de Umami, barra roja). Galería con fotos reales.
