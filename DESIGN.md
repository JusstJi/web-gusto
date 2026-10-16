# Design · Viernes de Gusto

Mundo: carta de restaurante impresa en risografía sobre el rosa de la fiesta. En portada, composición centrada tipo cartel: la marca, una boca que saca una lengua con los colores de los sabores y una ola con esos colores que cruza la pantalla; la entrada apaisada se apoya en la ola.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--rosa` | #F7A8D8 | Color de la fiesta, fondo base |
| `--tinta` | #1E1033 | Texto, botones, sección ¿Dónde? y pie |
| `--fucsia` | #FF3EA5 | Menú del mes, sombra de los títulos |
| `--amarillo` | #FFE14D | Hoja de La Carta, texto de botones |
| `--verde` | #19C27A | Cómo se sirve |
| `--azul` | #3A5BFF | Fondo de La Carta, sombra de la boca |
| `--azul-tinta` | #2A22C9 | Títulos de marca (5.3:1 sobre rosa) |
| `--sabor` / `--sabor-oscuro` / `--sabor-tinta` | #410107 / #6A0A14 / #F7B6BA | Umami (granate del cartel) y su texto rosa. Cambiar por edición |

Cada sección es un campo de color entero. El texto siempre en `--tinta` (o rosa/papel sobre tinta).

## Tipografía
- Shrikhand (cursiva ancha): marca, títulos, nombres de plato.
- Familjen Grotesk 400/600/700: todo lo demás.
Ambas autoalojadas en `fonts/` (OFL).

## Componentes
- Botón píldora: tinta + amarillo; hover fucsia; `--hueco` con borde; desactivado con borde discontinuo.
- Ticket: muescas laterales con máscara, girado -2°, en color del sabor.
- Línea de carta: nombre · puntos · fecha. Ingredientes en lista con separadores discontinuos.
- «Por desvelar»: chip tinta sobre amarillo para lo que aún no se sabe.

## Movimiento
- Intro (solo primera visita por sesión, «Saltar» y Escape): la lengua asoma, da el lametón y sale dejando ver la web. ~2 s. Con «reducir movimiento», solo fundido del lema.
- La lengua de la portada se mueve en bucle; se para fuera de pantalla y con «reducir movimiento».
