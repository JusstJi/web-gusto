# Viernes de Gusto · web

Web de Viernes de Gusto (Gusto × New La Miel, Burgos). HTML, CSS y JS sin compilación: se publica tal cual en Vercel o cualquier hosting estático. Para verla en local, abre `index.html` con doble clic, o mejor sirve la carpeta:

```
python3 -m http.server 8000
```

y abre http://localhost:8000.

Para publicarla en Vercel: en vercel.com, «Add New → Project», importa el repositorio `web-gusto` y pulsa «Deploy» (no hace falta configurar nada). Cuando tengas el dominio definitivo, cambia `og-image.png` por la URL completa en las etiquetas `og:image` y `twitter:image` de `index.html`.

## Páginas
- `index.html`: inicio con la intro de la lengua, la boca con la lengua de colores y la entrada de la próxima fiesta.
- `la-carta.html`, `como-se-sirve.html`, `menu-del-mes.html`, `donde-se-sirve.html`, `preguntas.html`, `haz-tu-pedido.html`.

La cabecera y el pie se repiten en cada página: si cambias el menú, cámbialo en todas.

## Para cada nueva edición
- Cambiar el sabor, la fecha, los chefs y el enlace de Fourvenues en `index.html`, `la-carta.html`, `menu-del-mes.html` y `haz-tu-pedido.html` (busca `Umami` y `data-entradas`).
- Añadir fiestas al calendario del Menú del mes: en `main.js`, lista `FIESTAS` (fecha, sabor, enlace). Los meses van de octubre de 2026 a junio de 2027 (`PRIMER_MES`, `NUM_MESES`).
- En `styles.css`, cambiar `--sabor`, `--sabor-oscuro` y `--sabor-tinta` por el color del sabor.
- En `main.js`, actualizar `EDICION.inicio` y `EDICION.fin`. Cuando pasa la fecha, la web oculta los botones de entradas y manda a Instagram.

## Pendiente de confirmar
- Música, chupito y chefs de umami (salen como «por desvelar»).
- Playlist del botón «Pruébalo» (desactivado hasta que exista).
- Galería: se añade cuando haya fotos.
