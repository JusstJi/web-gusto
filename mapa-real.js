// Vuelo de dron sobre el mapa real de Burgos (MapLibre + teselas de OpenFreeMap, sin clave)
// que termina en la puerta de New La Miel. Si el mapa no carga, se usa el vuelo ilustrado (dron.js).

const LOCAL = [-3.7035898, 42.3422114];      // puerta de New La Miel [lng, lat], marcada por Ji
const SALIDA = { center: [-3.7155, 42.3365], zoom: 13.2, pitch: 20, bearing: -20 };
const LLEGADA = { center: LOCAL, zoom: 16.4, pitch: 55, bearing: 32 };
const ESTILO = 'https://tiles.openfreemap.org/styles/dark';
const ESPERA = 9000;                          // si el mapa no está listo en este tiempo, vuelo ilustrado

const caja = document.querySelector('[data-dron]');
const lienzo = caja && caja.querySelector('[data-dron-lienzo]');
const params = new URLSearchParams(location.search);
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
let ilustrado = false;

function vueloIlustrado() {
  if (ilustrado) return;
  ilustrado = true;
  const capa = caja && caja.querySelector('[data-dron-mapa]');
  if (capa) capa.remove();
  if (lienzo) lienzo.hidden = false;
  import('./dron.js');
}

function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function cargar(src, css) {
  return new Promise((ok, mal) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = css;
    document.head.append(l);
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = mal;
    document.head.append(s);
  });
}

// Solo prepara el mapa cuando el bloque está cerca de verse
if (caja && lienzo && webglDisponible()) {
  if (params.has('t') || params.has('ilustrado')) vueloIlustrado();   // para revisar el vuelo ilustrado
  else {
    const cerca = new IntersectionObserver((e) => {
      if (!e[0].isIntersecting) return;
      cerca.disconnect();
      const reloj = setTimeout(vueloIlustrado, ESPERA);
      cargar('vendor/maplibre/maplibre-gl.js', 'vendor/maplibre/maplibre-gl.css')
        .then(() => iniciar(reloj))
        .catch(() => { clearTimeout(reloj); vueloIlustrado(); });
    }, { rootMargin: '600px 0px' });
    cerca.observe(caja.parentElement);   // la caja sigue oculta hasta que haya mapa
  }
}

function iniciar(reloj) {
  const maplibregl = window.maplibregl;
  if (ilustrado || !maplibregl) { clearTimeout(reloj); vueloIlustrado(); return; }

  const capa = document.createElement('div');
  capa.className = 'dron__mapa';
  capa.dataset.dronMapa = '';
  capa.setAttribute('role', 'region');
  capa.setAttribute('aria-label', 'Mapa de Burgos con la ubicación de New La Miel, calle Cardenal Segura 25');
  lienzo.hidden = true;
  lienzo.before(capa);
  caja.hidden = false;
  caja.classList.add('dron--real');

  let mapa;
  try {
    mapa = new maplibregl.Map({
      container: capa,
      style: ESTILO,
      ...(quieto ? LLEGADA : SALIDA),
      attributionControl: false,           // el crédito va en el pie del mapa, fuera del visor
      cooperativeGestures: true,
      maxPitch: 75,
      fadeDuration: 0,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda para hacer zoom en el mapa',
        'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda para hacer zoom en el mapa',
        'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa'
      }
    });
  } catch (e) { clearTimeout(reloj); caja.classList.remove('dron--real'); vueloIlustrado(); return; }

  let listo = false;
  mapa.on('error', () => {
    if (listo) return;                 // una tesela suelta que falla no tumba el vuelo
    clearTimeout(reloj);
    mapa.remove();
    caja.classList.remove('dron--real');
    vueloIlustrado();
  });

  mapa.on('load', () => {
    if (ilustrado) { mapa.remove(); return; }
    listo = true;
    clearTimeout(reloj);
    vestir(mapa);
    new maplibregl.Marker({ element: chincheta(), anchor: 'bottom' }).setLngLat(LOCAL).addTo(mapa);

    const plano = document.querySelector('.mapa__svg');
    if (plano) plano.setAttribute('hidden', '');
    const pie = document.querySelector('.mapa figcaption');
    if (pie && pie.firstChild && pie.firstChild.nodeType === 3) {
      pie.firstChild.textContent = 'Mapa real de Burgos. ';
      const credito = document.createElement('small');
      credito.className = 'mapa__credito';
      credito.innerHTML = 'Mapa: <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · Datos © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a>';
      pie.append(credito);
    }
    caja.classList.add('dron--listo');
    volar(mapa);
  });
}

// El estilo oscuro de OpenFreeMap, pasado a los colores de la web y con los edificios en 3D
function vestir(mapa) {
  const estilo = mapa.getStyle();
  let primeraEtiqueta;
  for (const capa of estilo.layers) {
    if (capa.type === 'background') mapa.setPaintProperty(capa.id, 'background-color', '#16130F');
    if (capa.type === 'symbol' && !primeraEtiqueta) primeraEtiqueta = capa.id;
    if (/^building/.test(capa.id) && capa.type === 'fill') mapa.setLayoutProperty(capa.id, 'visibility', 'none');
  }
  mapa.addLayer({
    id: 'gusto-edificios',
    type: 'fill-extrusion',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 13,
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#2B241D', 30, '#3A3027'],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, ['coalesce', ['get', 'render_height'], 10]],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.92
    }
  }, primeraEtiqueta);
}

function chincheta() {
  const el = document.createElement('div');
  el.className = 'dron__chincheta';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="dron__onda"></span><span class="dron__punta"></span>';
  return el;
}

function volar(mapa) {
  const hud = {
    alt: caja.querySelector('[data-dron-alt]'),
    dist: caja.querySelector('[data-dron-dist]'),
    otra: caja.querySelector('[data-dron-otra]')
  };
  const local = new window.maplibregl.LngLat(...LOCAL);
  const capa = mapa.getContainer();
  let vuelta = 0, visible = false, volado = false, tocado = false, viaje = 0;

  // Altura aproximada de la cámara sobre el suelo, a partir del zoom y la inclinación
  function datos() {
    const c = mapa.getCenter();
    const mpp = 156543.03 * Math.cos(c.lat * Math.PI / 180) / 2 ** mapa.getZoom();
    const alto = mapa.getCanvas().clientHeight || 400;
    const alt = mpp * alto * 1.5 * Math.cos(mapa.getPitch() * Math.PI / 180);
    if (hud.alt) hud.alt.textContent = String(Math.min(999, Math.round(alt))).padStart(3, '0');
    if (hud.dist) hud.dist.textContent = String(Math.min(9999, Math.round(c.distanceTo(local)))).padStart(3, '0');
  }
  mapa.on('move', datos);
  datos();

  function girar() {
    cancelAnimationFrame(vuelta);
    if (quieto || tocado) return;
    let antes = performance.now();
    const paso = (ahora) => {
      if (visible && !tocado) mapa.setBearing(mapa.getBearing() + (ahora - antes) * 0.0025);
      antes = ahora;
      vuelta = requestAnimationFrame(paso);
    };
    vuelta = requestAnimationFrame(paso);
  }

  function llegar() {
    capa.classList.remove('dron__mapa--volando');
    caja.classList.add('dron--llegado');
    girar();
  }

  function despegar() {
    volado = true; tocado = false;
    const este = ++viaje;
    caja.classList.remove('dron--llegado');
    if (quieto) { mapa.jumpTo(LLEGADA); llegar(); return; }
    capa.classList.add('dron__mapa--volando');   // mientras vuela, un toque sin querer no lo para
    mapa.jumpTo(SALIDA);
    mapa.flyTo({ ...LLEGADA, duration: 5000, curve: 1.2, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), essential: true });
    mapa.once('moveend', () => { if (!tocado && este === viaje) llegar(); });
  }

  // Si la persona coge el mapa, el dron deja de girar y se queda donde lo deje
  const parar = () => { tocado = true; cancelAnimationFrame(vuelta); caja.classList.add('dron--llegado'); };
  mapa.on('dragstart', parar);
  mapa.on('zoomstart', (e) => { if (e.originalEvent) parar(); });
  mapa.on('rotatestart', (e) => { if (e.originalEvent) parar(); });

  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible && !volado) despegar();
  }, { threshold: 0.4 }).observe(caja);

  if (hud.otra) hud.otra.addEventListener('click', () => { cancelAnimationFrame(vuelta); despegar(); });
}
