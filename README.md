# Viernes de Gusto · web

Web de una página para Viernes de Gusto (Gusto × New La Miel, Burgos). HTML, CSS y JS sin compilación: se publica tal cual en Vercel o cualquier hosting estático. Para verla en local, abre `index.html` con doble clic, o mejor sirve la carpeta:

```
python3 -m http.server 8000
```

y abre http://localhost:8000.

Para publicarla en Vercel: en vercel.com, «Add New → Project», importa el repositorio `web-gusto` y pulsa «Deploy» (no hace falta configurar nada). Cuando tengas el dominio definitivo, cambia `og-image.png` por la URL completa en las etiquetas `og:image` y `twitter:image` de `index.html`.

## Para cada nueva edición
- En `index.html`, cambiar el sabor, la fecha y el enlace de Fourvenues (busca `data-entradas`).
- En `styles.css`, cambiar `--sabor`, `--sabor-oscuro` y `--sabor-tinta` por el color del sabor.
- En `main.js`, actualizar `EDICION.inicio` y `EDICION.fin`. Cuando pasa la fecha, la web oculta los botones de entradas y manda a Instagram.

## Pendiente de confirmar
- Música, chupito y chefs de umami (salen como «por desvelar»).
- Playlist del botón «Pruébalo» (desactivado hasta que exista).
- Galería: se añade cuando haya fotos.
