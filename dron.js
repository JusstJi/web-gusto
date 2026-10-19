// Vuelo de dron sobre un casco histórico ilustrado que termina enfocando New La Miel.
// Escena hecha a mano con three.js (vendor/), no es un mapa real ni está a escala.
import * as THREE from './vendor/three.module.min.js';

const caja = document.querySelector('[data-dron]');
const lienzo = caja && caja.querySelector('[data-dron-lienzo]');
const forzado = new URLSearchParams(location.search).has('t') ? parseFloat(new URLSearchParams(location.search).get('t')) : null; // solo para revisar fotogramas
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (caja && lienzo && webglDisponible()) {
  // Los rótulos se pintan con la letra de la web: hay que esperar a que esté cargada
  const fuentes = document.fonts ? Promise.all([
    document.fonts.load('900 96px "Big Shoulders Display"'),
    document.fonts.load('800 52px "Big Shoulders Display"')
  ]).catch(() => {}) : Promise.resolve();
  fuentes.then(iniciar);
}

function iniciar() {
  const ACERO = 0x16130f;
  const LAMPARA = 0xff7a1a;
  const LOCAL = new THREE.Vector3(18, 0, -7);   // puerta de New La Miel, en la acera norte

  // Generador con semilla: el barrio sale siempre igual
  let semilla = 11;
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(ACERO);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  escena.fog = new THREE.Fog(ACERO, 220, 760);
  const camara = new THREE.PerspectiveCamera(38, 1, 1, 2000);

  escena.add(new THREE.HemisphereLight(0xa89880, 0x1a1410, 1.6));
  const luna = new THREE.DirectionalLight(0x9fb0c8, 0.35);
  luna.position.set(-200, 300, 120);
  escena.add(luna);

  // ---------- Texturas pintadas en canvas ----------
  function texturaVentanas(encendidas) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = encendidas ? '#000' : '#2a231d'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const luz = azar();
      if (encendidas) {
        if (luz > 0.72) { g.fillStyle = luz > 0.93 ? '#ffd9a0' : '#ff9d4a'; g.fillRect(x * 32 + 9, y * 32 + 7, 14, 18); }
      } else {
        g.fillStyle = '#15110d'; g.fillRect(x * 32 + 9, y * 32 + 7, 14, 18);
        g.fillStyle = '#3a3027'; g.fillRect(x * 32 + 7, y * 32 + 25, 18, 2);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function texturaTexto(texto, ancho, alto, opciones) {
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    const g = c.getContext('2d');
    if (opciones.fondo) { g.fillStyle = opciones.fondo; g.fillRect(0, 0, ancho, alto); }
    g.font = opciones.fuente;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (opciones.brillo) { g.shadowColor = opciones.brillo; g.shadowBlur = alto * 0.25; }
    g.fillStyle = opciones.color;
    if (opciones.espacio) g.letterSpacing = opciones.espacio;
    g.fillText(texto, ancho / 2, alto / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  const paredes = [texturaVentanas(false), texturaVentanas(false)];
  const luces = [texturaVentanas(true), texturaVentanas(true)];
  const tejados = [0x3a2a22, 0x46322a, 0x2e2621, 0x52392d];

  // ---------- Suelo y calles ----------
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ color: 0x0f0c0a }));
  suelo.rotation.x = -Math.PI / 2;
  escena.add(suelo);

  const matCalle = new THREE.MeshLambertMaterial({ color: 0x231d18 });
  const matAcera = new THREE.MeshLambertMaterial({ color: 0x2d261f });
  function calle(x, z, largo, ancho, girada) {
    const acera = new THREE.Mesh(new THREE.PlaneGeometry(largo, ancho + 5), matAcera);
    acera.rotation.x = -Math.PI / 2; acera.position.set(x, 0.05, z);
    if (girada) acera.rotation.z = Math.PI / 2;
    const via = new THREE.Mesh(new THREE.PlaneGeometry(largo, ancho), matCalle);
    via.rotation.x = -Math.PI / 2; via.position.set(x, 0.1, z);
    if (girada) via.rotation.z = Math.PI / 2;
    escena.add(acera, via);
  }
  // Calle Cardenal Segura (a lo largo del eje x) y las que la cruzan
  calle(0, 0, 900, 14, false);
  calle(0, -78, 900, 8, false);
  calle(0, 76, 900, 8, false);
  const cruces = [-232, -136, -52, 64, 150, 248];
  cruces.forEach((x) => calle(x, 0, 700, 8, true));

  // Nombre de la calle pintado sobre el asfalto
  const rotulo = new THREE.Mesh(
    new THREE.PlaneGeometry(64, 5),
    new THREE.MeshBasicMaterial({ map: texturaTexto('CALLE CARDENAL SEGURA', 1024, 80, { fuente: '800 52px "Big Shoulders Display", "Arial Narrow", sans-serif', color: 'rgba(243,238,228,0.55)', espacio: '8px' }), transparent: true, depthWrite: false })
  );
  rotulo.rotation.x = -Math.PI / 2; rotulo.position.set(-34, 0.2, 3);
  escena.add(rotulo);

  // ---------- Edificios ----------
  function edificio(x, z, ancho, fondo, alto, i) {
    const geo = new THREE.BoxGeometry(ancho, alto, fondo);
    // Las ventanas guardan su tamaño en cualquier fachada: se escalan las coordenadas de textura
    const uv = geo.attributes.uv, normal = geo.attributes.normal;
    for (let k = 0; k < uv.count; k++) {
      const nx = Math.abs(normal.getX(k)), ny = Math.abs(normal.getY(k));
      if (ny > 0.5) continue;
      const lado = nx > 0.5 ? fondo : ancho;
      uv.setXY(k, uv.getX(k) * lado / 30 + i * 0.37, uv.getY(k) * alto / 26 + i * 0.21);
    }
    const p = i % 2;
    const fachada = new THREE.MeshLambertMaterial({ map: paredes[p], emissiveMap: luces[p], emissive: 0xffffff, emissiveIntensity: 0.9, color: 0xb9a894 });
    const tejado = new THREE.MeshLambertMaterial({ color: tejados[i % tejados.length] });
    const malla = new THREE.Mesh(geo, [fachada, fachada, tejado, tejado, fachada, fachada]);
    malla.position.set(x, alto / 2, z);
    escena.add(malla);
    return malla;
  }

  let cartel, toldo;

  // Manzanas entre calles, rellenas de casas de 3 a 6 plantas
  const filas = [[-74, -7], [7, 72], [-200, -82], [80, 200]];
  const bordes = [-420].concat(cruces).concat([420]);
  let n = 0;
  for (let b = 0; b < bordes.length - 1; b++) {
    const x0 = bordes[b] + 6, x1 = bordes[b + 1] - 6;
    filas.forEach(([z0, z1]) => {
      let x = x0;
      while (x < x1 - 6) {
        const ancho = Math.min(9 + azar() * 12, x1 - x);
        const fondo = Math.min(14 + azar() * 10, z1 - z0);
        const alto = 11 + Math.floor(azar() * 4) * 3.2 + (azar() > 0.92 ? 9 : 0);
        // Las casas miran a la calle: pegadas al borde de la manzana más cercano a una calle
        const pegadaArriba = z1 <= 0;
        const z = pegadaArriba ? z1 - fondo / 2 : z0 + fondo / 2;
        const esLocal = z0 === -74 && x <= LOCAL.x && x + ancho > LOCAL.x;
        if (!esLocal) edificio(x + ancho / 2, z, ancho - 0.6, fondo, alto, n++);
        else localNewLaMiel(x + ancho / 2, ancho - 0.6);
        // Patio interior de la manzana en el lado contrario
        if (z1 - z0 > 50) edificio(x + ancho / 2, pegadaArriba ? z0 + 9 : z1 - 9, ancho - 0.6, 16, alto - 3.2, n++);
        x += ancho;
      }
    });
  }

  // ---------- New La Miel ----------
  function localNewLaMiel(x, ancho) {
    const alto = 17.4, fondo = 20;
    const z = -7 - fondo / 2;
    const casa = edificio(x, z, ancho, fondo, alto, 99);
    casa.material[4] = casa.material[4].clone();
    casa.material[4].emissiveIntensity = 1.3;
    // Toldo rojo sobre la puerta, como el de la barra
    toldo = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.8, 0.5, 3), new THREE.MeshLambertMaterial({ color: 0xc8102e, emissive: 0x7a0614, emissiveIntensity: 0.9 }));
    toldo.position.set(x, 3.8, -7 + 1.25);
    escena.add(toldo);
    // Cartel luminoso
    cartel = new THREE.Mesh(
      new THREE.PlaneGeometry(ancho * 0.9, ancho * 0.9 * 0.28),
      new THREE.MeshBasicMaterial({ map: texturaTexto('NEW LA MIEL', 512, 144, { fuente: '900 96px "Big Shoulders Display", "Arial Narrow", sans-serif', color: '#ffb36b', brillo: '#ff7a1a', fondo: 'rgba(22,19,15,0.85)' }), transparent: true })
    );
    cartel.position.set(x, 6.6, -7 + 0.05);
    escena.add(cartel);
    // Banderola: el mismo cartel saliendo de la fachada, se lee desde la calle
    const banderola = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 2.6),
      new THREE.MeshBasicMaterial({ map: cartel.material.map, transparent: true, side: THREE.DoubleSide })
    );
    banderola.rotation.y = Math.PI / 2;
    banderola.position.set(x - ancho * 0.32, 10, -7 + 4.6);
    escena.add(banderola);
    const luzPuerta = new THREE.PointLight(LAMPARA, 260, 60, 1.8);
    luzPuerta.position.set(x, 5, 2);
    escena.add(luzPuerta);
    LOCAL.set(x, 0, -7);
  }

  // Marcador sobre el local
  const marcador = new THREE.Group();
  const bola = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 16), new THREE.MeshBasicMaterial({ color: LAMPARA }));
  const punta = new THREE.Mesh(new THREE.ConeGeometry(3.05, 7, 32, 1, true), new THREE.MeshBasicMaterial({ color: LAMPARA }));
  punta.rotation.x = Math.PI; punta.position.y = -4.6;
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 10), new THREE.MeshBasicMaterial({ color: 0x16130f }));
  ojo.position.z = 2.3;
  marcador.add(bola, punta, ojo);
  marcador.position.set(LOCAL.x, 23, LOCAL.z - 3);
  marcador.scale.setScalar(0.75);
  escena.add(marcador);

  // Onda que late en la puerta
  const onda = new THREE.Mesh(new THREE.RingGeometry(3, 3.8, 48), new THREE.MeshBasicMaterial({ color: LAMPARA, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  onda.rotation.x = -Math.PI / 2; onda.position.set(LOCAL.x, 0.3, LOCAL.z + 3.5);
  escena.add(onda);

  // Farolas a lo largo de las calles
  const pos = [];
  for (let x = -420; x <= 420; x += 22) { pos.push(x, 6, 8.5, x + 11, 6, -8.5); }
  cruces.forEach((cx) => { for (let z = -320; z <= 320; z += 24) pos.push(cx + 5.5, 6, z); });
  const farolaGeo = new THREE.BufferGeometry();
  farolaGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const brilloC = document.createElement('canvas'); brilloC.width = brilloC.height = 64;
  const bg = brilloC.getContext('2d');
  const grad = bg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,214,160,1)'); grad.addColorStop(0.25, 'rgba(255,160,80,0.55)'); grad.addColorStop(1, 'rgba(255,122,26,0)');
  bg.fillStyle = grad; bg.fillRect(0, 0, 64, 64);
  const farolas = new THREE.Points(farolaGeo, new THREE.PointsMaterial({ size: 9, map: new THREE.CanvasTexture(brilloC), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  escena.add(farolas);
  [-60, -20, 60, 100].forEach((dx) => {
    const l = new THREE.PointLight(0xffb070, 120, 45, 1.8);
    l.position.set(LOCAL.x + dx, 7, dx % 40 ? 8 : -8);
    escena.add(l);
  });

  // ---------- El vuelo ----------
  const ruta = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-330, 300, 360),
    new THREE.Vector3(-160, 210, 230),
    new THREE.Vector3(10, 110, 120),
    new THREE.Vector3(LOCAL.x + 80, 45, 30),
    new THREE.Vector3(LOCAL.x + 48, 18, 6)
  ], false, 'centripetal');
  const mira0 = new THREE.Vector3(-60, 0, -40);
  const DURA = 6.5;
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const hud = {
    alt: caja.querySelector('[data-dron-alt]'),
    dist: caja.querySelector('[data-dron-dist]'),
    otra: caja.querySelector('[data-dron-otra]')
  };

  let inicio = null, visible = false, pedido = false, llegado = false;
  const reloj = new THREE.Clock();

  function encuadrar(t, tiempo) {
    const k = suave(Math.min(t, 1));
    const p = ruta.getPoint(k);
    const mira = mira0.clone().lerp(new THREE.Vector3(LOCAL.x - 4, 11, LOCAL.z - 1), Math.min(1, k * 1.1));
    if (t >= 1) {
      // Al llegar, el dron se queda flotando y gira despacio alrededor del local
      const a = (tiempo - inicio - DURA) * 0.25;
      const r = Math.hypot(48, 13);
      const ang = Math.atan2(13, 48) + Math.sin(a) * 0.12;
      p.set(LOCAL.x + Math.cos(ang) * r, 18 + Math.sin(a * 1.3) * 0.8, LOCAL.z + Math.sin(ang) * r);
    }
    camara.position.copy(p);
    camara.lookAt(mira);
    if (hud.alt) hud.alt.textContent = String(Math.round(p.y * 0.4)).padStart(3, '0');
    if (hud.dist) hud.dist.textContent = String(Math.round(p.distanceTo(LOCAL) * 0.4)).padStart(3, '0');
    if (t >= 1 && !llegado) { llegado = true; caja.classList.add('dron--llegado'); }
  }

  function medir() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.fov = w / h < 1 ? 52 : 38;
    camara.updateProjectionMatrix();
  }

  function cuadro() {
    pedido = false;
    if (!visible) return;
    const tiempo = reloj.getElapsedTime();
    if (inicio === null) inicio = tiempo;
    const t = forzado !== null ? forzado : (quieto ? 1.0001 : (tiempo - inicio) / DURA);
    encuadrar(t, quieto ? inicio + DURA : tiempo);
    marcador.position.y = 23 + Math.sin(tiempo * 2.2) * 0.9;
    marcador.rotation.y = tiempo * 0.8;
    const pulso = (tiempo * 0.7) % 1;
    onda.scale.setScalar(1 + pulso * 3.5);
    onda.material.opacity = 0.9 * (1 - pulso);
    renderer.render(escena, camara);
    if (!quieto || !llegado) pedir();
  }
  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(cuadro); } }

  new ResizeObserver(() => { medir(); pedir(); }).observe(lienzo);
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible) pedir();
  }, { threshold: 0.3 }).observe(caja);

  if (hud.otra) hud.otra.addEventListener('click', () => {
    inicio = null; llegado = false; caja.classList.remove('dron--llegado');
    reloj.start(); pedir();
  });

  medir();
  caja.hidden = false;
  caja.classList.add('dron--listo');
  // Con la escena lista, el plano dibujado ya no hace falta
  const plano = document.querySelector('.mapa__svg');
  if (plano) plano.setAttribute('hidden', '');
}
