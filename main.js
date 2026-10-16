(function () {
  'use strict';

  var raiz = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro: una boca que se relame y lame la pantalla ---------- */
  // La lengua no es un dibujo fijo: se calcula en cada fotograma a partir de una
  // "columna" que se curva, así se dobla y se enrosca como una lengua de verdad.
  var NS = 'http://www.w3.org/2000/svg';
  var COLORES_LENGUA = ['#FF3EA5', '#FF7A1A', '#FFE14D', '#19C27A', '#3A5BFF'];
  var serieLengua = 0;

  function crearLengua(svg, antes) {
    var id = 'lengua-viva-' + (++serieLengua);
    var defs = document.createElementNS(NS, 'defs');
    var clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', id);
    var forma = document.createElementNS(NS, 'path');
    clip.appendChild(forma); defs.appendChild(clip); svg.appendChild(defs);
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('clip-path', 'url(#' + id + ')');
    var bandas = COLORES_LENGUA.map(function (c) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('fill', c); g.appendChild(p); return p;
    });
    var surco = document.createElementNS(NS, 'path');
    surco.setAttribute('fill', 'none'); surco.setAttribute('stroke', '#1E1033');
    surco.setAttribute('stroke-opacity', '0.22'); surco.setAttribute('stroke-linecap', 'round');
    var brillo = document.createElementNS(NS, 'path');
    brillo.setAttribute('fill', 'none'); brillo.setAttribute('stroke', '#fff');
    brillo.setAttribute('stroke-opacity', '0.4'); brillo.setAttribute('stroke-linecap', 'round');
    g.appendChild(surco); g.appendChild(brillo);
    svg.insertBefore(g, antes || null);
    return { g: g, forma: forma, bandas: bandas, surco: surco, brillo: brillo };
  }

  // p: x, y (raíz), L (largo), h (medio ancho), ang (grados, 90 = hacia abajo),
  //    curva (grados extra en la punta), onda (grados de ondulación), fase
  function rampa(v) { v = Math.min(Math.max(v, 0), 1); return v * v * (3 - 2 * v); }

  function dibujarLengua(l, p) {
    var n = 18, paso = p.L / n, pts = [], i, t;
    var x = p.x, y = p.y;
    for (i = 0; i <= n; i++) {
      t = i / n;
      // Con "raiz", el arranque de la lengua se queda fijo bajo los dientes y solo se dobla el resto
      var giro = p.raiz === undefined ? p.ang : p.raiz + (p.ang - p.raiz) * rampa(t / 0.45);
      var a = (giro + p.curva * Math.pow(t, 1.6) + p.onda * Math.sin(p.fase + t * 3.2) * t * t) * Math.PI / 180;
      var h = p.h * (1 - 0.12 * t);
      pts.push({ x: x, y: y, a: a, h: h, nx: -Math.sin(a), ny: Math.cos(a) });
      x += Math.cos(a) * paso; y += Math.sin(a) * paso;
    }
    function f(v) { return v.toFixed(1); }
    function punto(q, k) { return f(q.x + q.nx * q.h * k) + ' ' + f(q.y + q.ny * q.h * k); }
    var u = pts[n];
    // Contorno: lado izquierdo, punta redonda, lado derecho
    var d = 'M' + punto(pts[0], 1);
    for (i = 1; i <= n; i++) d += 'L' + punto(pts[i], 1);
    for (i = 1; i < 12; i++) {
      var th = u.a + Math.PI / 2 - i * Math.PI / 12;
      d += 'L' + f(u.x + Math.cos(th) * u.h) + ' ' + f(u.y + Math.sin(th) * u.h);
    }
    for (i = n; i >= 0; i--) d += 'L' + punto(pts[i], -1);
    // La raíz se mete hacia dentro de la boca
    var r = pts[0];
    d += 'L' + f(r.x - Math.cos(r.a) * r.h * 0.25 - r.nx * r.h) + ' ' + f(r.y - Math.sin(r.a) * r.h * 0.25 - r.ny * r.h);
    d += 'L' + f(r.x - Math.cos(r.a) * r.h * 0.25 + r.nx * r.h) + ' ' + f(r.y - Math.sin(r.a) * r.h * 0.25 + r.ny * r.h) + 'Z';
    l.forma.setAttribute('d', d);
    // Bandas de color a lo largo de la lengua (se doblan con ella)
    var ext = { x: u.x + Math.cos(u.a) * u.h * 1.3, y: u.y + Math.sin(u.a) * u.h * 1.3, a: u.a, h: u.h * 1.4, nx: u.nx, ny: u.ny };
    var raizAtras = { x: r.x - Math.cos(r.a) * r.h * 0.5, y: r.y - Math.sin(r.a) * r.h * 0.5, a: r.a, h: r.h * 1.3, nx: r.nx, ny: r.ny };
    var todos = [raizAtras].concat(pts, [ext]);
    l.bandas.forEach(function (b, j) {
      var k0 = 1 - j * 0.4, k1 = 1 - (j + 1) * 0.4;
      if (j === 0) k0 = 3; if (j === 4) k1 = -3;
      var s = 'M' + punto(todos[0], k0), m;
      for (m = 1; m < todos.length; m++) s += 'L' + punto(todos[m], k0);
      for (m = todos.length - 1; m >= 0; m--) s += 'L' + punto(todos[m], k1);
      b.setAttribute('d', s + 'Z');
    });
    var c = 'M' + punto(pts[3], 0);
    for (i = 4; i < n; i++) c += 'L' + punto(pts[i], 0);
    l.surco.setAttribute('d', c);
    l.surco.setAttribute('stroke-width', f(p.h * 0.11));
    var bl = 'M' + punto(pts[4], 0.62);
    for (i = 5; i <= 10; i++) bl += 'L' + punto(pts[i], 0.62);
    l.brillo.setAttribute('d', bl);
    l.brillo.setAttribute('stroke-width', f(p.h * 0.13));
  }

  // Interpolación sencilla de un objeto de parámetros entre fotogramas clave
  function suave(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function entra(t) { return t * t * t; }
  function sale(t) { return 1 - Math.pow(1 - t, 3); }
  function rebote(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function linea(estado, claves, alDibujar) {
    // claves: [{ ms, ease, ...valores }]
    var activo = true, inicio = null, i = 0, desde = Object.assign({}, estado), resuelve;
    var total = claves.reduce(function (s, k) { return s + k.ms; }, 0);
    var promesa = new Promise(function (r) { resuelve = r; });
    function marco(ahora) {
      if (!activo) return;
      if (inicio === null) inicio = ahora;
      var pasado = ahora - inicio, acum = 0;
      for (i = 0; i < claves.length; i++) { if (pasado < acum + claves[i].ms) break; acum += claves[i].ms; }
      if (i >= claves.length) { aplicar(claves.length - 1, 1); alDibujar(estado, ahora); resuelve(); return; }
      aplicar(i, (pasado - acum) / claves[i].ms);
      alDibujar(estado, ahora);
      requestAnimationFrame(marco);
    }
    var base = [desde];
    claves.forEach(function (k, n) {
      var sig = Object.assign({}, base[n]);
      Object.keys(k).forEach(function (c) { if (c !== 'ms' && c !== 'ease') sig[c] = k[c]; });
      base.push(sig);
    });
    function aplicar(n, t) {
      var e = (claves[n].ease || suave)(Math.min(Math.max(t, 0), 1));
      var a = base[n], b = base[n + 1];
      Object.keys(b).forEach(function (c) {
        if (typeof b[c] === 'number' && typeof a[c] === 'number') estado[c] = a[c] + (b[c] - a[c]) * e;
      });
    }
    requestAnimationFrame(marco);
    promesa.parar = function () { activo = false; };
    promesa.total = total;
    return promesa;
  }

  // Ejecuta la intro dentro de "escenario" (pantalla completa o un marco de prueba).
  // variante 'boca': se relame y la cámara entra en la boca.
  // variante 'pantalla': se relame y una lengua gigante lame la pantalla de abajo arriba.
  function animarIntroBoca(escenario, variante, alTerminar) {
    var fondo = escenario.querySelector('.intro__fondo');
    var lema = escenario.querySelector('.intro__lema');
    var boca = escenario.querySelector('.intro__boca');
    var barrido = escenario.querySelector('.intro__barrido');
    var paradas = [], vivo = true;
    function seguir(p) { paradas.push(p); return p; }
    function parar() { vivo = false; paradas.forEach(function (p) { p.parar && p.parar(); }); }

    var lengua = boca.__lengua || (boca.__lengua = crearLengua(boca, boca.querySelector('.boca__dientes')));
    var p = { x: 200, y: 180, raiz: 90, L: 20, h: 58, ang: 90, curva: 0, onda: 0, fase: 0 };
    function dibujar(e, ahora) { e.fase = ahora / 140; dibujarLengua(lengua, e); }
    dibujarLengua(lengua, p);

    boca.style.transformOrigin = '49.5% 52%';
    boca.animate([{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 360, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both' });

    // Sale la lengua y se relame: rodea el labio de abajo y enrosca la punta hacia arriba en cada lado
    seguir(linea(p, [
      { ms: 220, ease: sale, L: 90, onda: 4 },
      { ms: 200, ease: rebote, L: 170, ang: 90, curva: -10, onda: 10 },
      { ms: 250, ease: suave, L: 195, ang: 145, curva: 80, onda: 8 },
      { ms: 360, ease: suave, L: 200, ang: 35, curva: -80, onda: 8 },
      { ms: 220, ease: suave, L: 170, ang: 90, curva: 0, onda: 6 },
      { ms: 180, ease: suave, L: 175, onda: 14 }
    ], dibujar)).then(function () {
      if (!vivo) return;
      lema.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      if (variante === 'boca') finalBoca(); else finalPantalla();
    });

    function finalBoca() {
      // Sorbe la lengua y la cámara entra en la boca
      seguir(linea(p, [{ ms: 220, ease: entra, L: 0, h: 4, onda: 0 }], dibujar));
      var r = escenario.getBoundingClientRect();
      var grande = Math.max(r.width, r.height) / boca.clientWidth * 9;
      var zoom = boca.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + grande.toFixed(1) + ')' }],
        { duration: 650, delay: 120, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' });
      var funde = escenario.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }],
        { duration: 900, delay: 120, fill: 'forwards' });
      paradas.push({ parar: function () { zoom.cancel(); funde.cancel(); } });
      funde.onfinish = function () { if (vivo) alTerminar(); };
    }

    function finalPantalla() {
      // La boca se aparta y una lengua enorme lame la pantalla de abajo arriba: lo que deja atrás ya es la web
      boca.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'translateY(30%) scale(0.8)', opacity: 0 }],
        { duration: 260, easing: 'ease-in', fill: 'forwards' });
      var r = escenario.getBoundingClientRect();
      var W = r.width, H = r.height;
      barrido.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var gigante = barrido.__lengua || (barrido.__lengua = crearLengua(barrido));
      var g = { x: W / 2, y: H + W * 0.9, L: 0, h: W * 0.6, ang: 270, curva: 0, onda: 0, fase: 0 };
      var techo = H + W * 0.9; // largo necesario para que la punta pase el borde de arriba
      seguir(linea(g, [
        { ms: 100, ease: sale, L: W * 0.5 },
        { ms: 470, ease: suave, L: techo + W * 1.1, curva: -18, onda: 6 }
      ], function (e, ahora) {
        e.fase = ahora / 160;
        dibujarLengua(gigante, e);
        // El rosa solo queda por encima de la punta: debajo está la lengua y, al irse, la web
        var punta = e.y - e.L;
        var queda = Math.max(0, Math.min(H, punta + e.h * 0.6));
        fondo.style.clipPath = 'inset(0 0 ' + (H - queda).toFixed(0) + 'px 0)';
      })).then(function () {
        if (!vivo) return;
        fondo.style.clipPath = 'inset(0 0 100% 0)';
        var sube = barrido.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-' + (H + W * 1.1).toFixed(0) + 'px)' }],
          { duration: 380, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' });
        paradas.push({ parar: function () { sube.cancel(); } });
        sube.onfinish = function () { if (vivo) alTerminar(); };
      });
    }

    return parar;
  }

  function marcarVista() {
    try { sessionStorage.setItem('gusto-intro', '1'); } catch (e) {}
  }

  function iniciarIntro() {
    var intro = document.getElementById('intro');
    if (!intro || !raiz.classList.contains('con-intro')) return;
    decorarIntro();
    letrasLema();

    var saltar = document.getElementById('saltar-intro');
    var parar = null;
    var acabada = false;

    function terminar() {
      if (acabada) return;
      acabada = true;
      if (parar) parar();
      intro.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
      raiz.classList.remove('con-intro');
      marcarVista();
      document.removeEventListener('keydown', alTeclear);
    }
    function alTeclear(e) { if (e.key === 'Escape') terminar(); }

    saltar.addEventListener('click', function () {
      terminar();
      var main = document.getElementById('contenido');
      if (main) main.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', alTeclear);

    if (!intro.animate) { setTimeout(terminar, 900); return; }

    if (movimientoReducido) {
      // Sin movimiento: la boca con la lengua fuera, quieta, y un fundido suave
      var boca = intro.querySelector('.intro__boca');
      dibujarLengua(crearLengua(boca, boca.querySelector('.boca__dientes')), { x: 200, y: 180, raiz: 90, L: 150, h: 58, ang: 90, curva: 0, onda: 0, fase: 0 });
      intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 900, fill: 'forwards' }).onfinish = terminar;
      return;
    }

    parar = animarIntroBoca(intro, 'pantalla', terminar);
    setTimeout(terminar, 3600);
  }

  /* ---------- Decoración de fondo: pegatinas de colores que flotan ---------- */
  var PEGATINAS = {
    destello: '<path d="M50 4c4 26 20 42 46 46-26 4-42 20-46 46-4-26-20-42-46-46 26-4 42-20 46-46Z"/>',
    estrella: '<path d="M50 5l13 29 32 3-24 21 7 31-28-16-28 16 7-31L5 37l32-3Z"/>',
    corazon: '<path d="M50 88C20 66 6 50 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 18-14 34-44 56Z"/>',
    rayo: '<path d="M58 4 18 56h26l-8 40 46-56H54Z"/>',
    copa: '<path d="M6 10h88L55 50v32h17v8H28v-8h17V50Z"/><circle cx="76" cy="10" r="10"/>',
    gota: '<path d="M50 6C66 32 80 48 80 64a30 30 0 0 1-60 0c0-16 14-32 30-58Z"/>',
    espiral: '<path d="M50 50m-6 0a6 6 0 1 1 12 0a14 14 0 1 1-28 0a22 22 0 1 1 44 0a30 30 0 1 1-60 0" fill="none" stroke-width="9" stroke-linecap="round"/>',
    chupito: '<path d="M22 14h56l-8 74H30Z"/>',
    nota: '<path d="M38 12 86 4v58a14 12 0 1 1-10-11V22L48 27v45a14 12 0 1 1-10-11Z"/>',
    labios: '<path d="M4 50c14-24 30-30 46-20 16-10 32-4 46 20-14 24-30 32-46 32S18 74 4 50Z"/>',
    garabato: '<path d="M6 60c10-30 22-30 26 0s16 30 22 0 18-30 22 0 12 26 18 6" fill="none" stroke-width="10" stroke-linecap="round"/>',
    aro: '<circle cx="50" cy="50" r="34" fill="none" stroke-width="14"/>'
  };
  var TINTAS = { fucsia: '#FF3EA5', naranja: '#FF7A1A', amarillo: '#FFE14D', verde: '#19C27A', azul: '#3A5BFF', rosa: '#F7A8D8', papel: '#FFF4FA' };

  function iniciarDecoracion() {
    var secciones = document.querySelectorAll('main > section');
    var nombres = Object.keys(PEGATINAS);
    var semilla = 7;
    function azar() { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; }
    function rgb(hex) { var n = parseInt(hex.slice(1), 16); return 'rgb(' + (n >> 16) + ', ' + (n >> 8 & 255) + ', ' + (n & 255) + ')'; }

    Array.prototype.forEach.call(secciones, function (sec, s) {
      var fondo = getComputedStyle(sec).backgroundColor;
      var tintas = Object.keys(TINTAS).filter(function (t) { return rgb(TINTAS[t]) !== fondo; });
      if (fondo === rgb(TINTAS.rosa)) tintas = tintas.filter(function (t) { return t !== 'papel'; });
      var capa = document.createElement('div');
      capa.className = 'deco';
      capa.setAttribute('aria-hidden', 'true');
      var cuantas = sec.classList.contains('portada') ? 12 : 6;
      var html = '';
      for (var i = 0; i < cuantas; i++) {
        var forma = nombres[(i + s * 3) % nombres.length];
        var tinta = TINTAS[tintas[Math.floor(azar() * tintas.length)]];
        // Sobre todo en los bordes, para no tapar el texto
        var x = i % 2 === 0 ? azar() * 9 - 4 : 91 + azar() * 9;
        var y = (i + azar() * 0.8) / cuantas * 100;
        var tam = 1.8 + azar() * 3;
        var giro = Math.round(azar() * 60 - 30);
        var trazo = forma === 'garabato' || forma === 'aro' || forma === 'espiral';
        html += '<svg class="deco__pieza" viewBox="0 0 100 100" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;width:' + tam.toFixed(2) + 'rem;--giro:' + giro + 'deg;--dura:' + (5 + azar() * 5).toFixed(1) + 's;--retraso:-' + (azar() * 6).toFixed(1) + 's"' +
          (trazo ? ' stroke="' + tinta + '" fill="none"' : ' fill="' + tinta + '"') + '>' +
          '<g class="deco__sombra" transform="translate(5 5)">' + PEGATINAS[forma] + '</g>' + PEGATINAS[forma] + '</svg>';
      }
      capa.innerHTML = html;
      if (!sec.classList.contains('portada')) sec.classList.add('con-deco');
      sec.insertBefore(capa, sec.firstChild.nextSibling);
    });
  }

  // El lema de la intro: cada letra cae por separado y «colores» lleva una tinta por letra
  function letrasLema() {
    var colores = ['#FF3EA5', '#FF7A1A', '#FFE14D', '#19C27A', '#3A5BFF'];
    var n = 0;
    document.querySelectorAll('.intro__linea').forEach(function (linea) {
      var esColores = linea.classList.contains('intro__linea--colores');
      var html = '';
      Array.prototype.forEach.call(linea.textContent, function (ch, i) {
        if (ch === ' ') { html += ' '; return; }
        var estilo = '--d:' + (esColores ? 260 + i * 70 : n++ * 30) + 'ms;--r:' + (i % 2 ? 25 : -25) + 'deg;--r2:' + (i % 2 ? -5 : 5) + 'deg';
        if (esColores) estilo += ';--c:' + colores[i % colores.length];
        html += '<span class="intro__letra" style="' + estilo + '">' + ch + '</span>';
      });
      linea.innerHTML = html;
    });
  }

  // La intro también lleva pegatinas: por toda la pantalla menos el centro, donde están el lema y la boca
  function decorarIntro() {
    var fondo = document.querySelector('.intro__fondo');
    if (!fondo) return;
    var nombres = Object.keys(PEGATINAS);
    var tintas = ['fucsia', 'naranja', 'amarillo', 'verde', 'azul', 'papel'];
    var semilla = 3;
    function azar() { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; }
    var html = '';
    for (var i = 0; i < 18; i++) {
      var x, y, intentos = 0;
      do { x = azar() * 104 - 4; y = azar() * 100 - 2; intentos++; }
      while (((x > 18 && x < 76 && y > 10 && y < 84) || (x > 66 && y < 13)) && intentos < 40);
      var forma = nombres[i % nombres.length];
      var tinta = TINTAS[tintas[Math.floor(azar() * tintas.length)]];
      var trazo = forma === 'garabato' || forma === 'aro' || forma === 'espiral';
      html += '<svg class="deco__pieza deco__pieza--entra" viewBox="0 0 100 100" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;width:' + (2 + azar() * 3.2).toFixed(2) + 'rem;--giro:' + Math.round(azar() * 60 - 30) + 'deg;--dura:' + (4 + azar() * 4).toFixed(1) + 's;--retraso:-' + (azar() * 6).toFixed(1) + 's;--entra:' + Math.round(i * 25) + 'ms"' +
        (trazo ? ' stroke="' + tinta + '" fill="none"' : ' fill="' + tinta + '"') + '>' +
        '<g class="deco__sombra" transform="translate(5 5)">' + PEGATINAS[forma] + '</g>' + PEGATINAS[forma] + '</svg>';
    }
    var capa = document.createElement('div');
    capa.className = 'deco';
    capa.innerHTML = html;
    fondo.appendChild(capa);
  }

  /* ---------- «Pruébalo»: enlaces a las playlists de Spotify ---------- */
  // Pega aquí el enlace de cada playlist cuando exista; mientras esté vacío, el botón sale como «pronto».
  var PLAYLISTS = {
    umami: 'https://open.spotify.com/playlist/1diwoHYeV590P5D9R8vARR',
    proximo: '',
    siguiente: ''
  };


  // Baraja de tickets: al tocar el ticket de delante pasa al fondo y asoma la siguiente fiesta
  function iniciarBaraja() {
    var baraja = document.querySelector('[data-baraja]');
    if (!baraja) return;
    var cartas = Array.prototype.slice.call(baraja.querySelectorAll('.ticket'));
    var boton = baraja.querySelector('[data-baraja-pasar]');
    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ocupado = false;
    var contador = baraja.querySelector('[data-baraja-contador]');
    function colocar() {
      if (contador) contador.textContent = (cartas.findIndex(function (c) { return c.dataset.pos === '0'; }) + 1) + '/' + cartas.length;
      cartas.forEach(function (c) {
        var delante = c.dataset.pos === '0';
        c.inert = !delante;
        if (delante) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
      });
    }
    function pasar() {
      if (ocupado) return;
      var frente = cartas.filter(function (c) { return c.dataset.pos === '0'; })[0];
      var mover = function () {
        cartas.forEach(function (c) {
          var p = +c.dataset.pos;
          c.dataset.pos = String(p === 0 ? cartas.length - 1 : p - 1);
        });
        colocar();
      };
      if (reducido || !frente.animate) { mover(); return; }
      ocupado = true;
      var anim = frente.animate([
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: 'translate(-70%, 0.5rem) rotate(-16deg)', offset: 0.5 },
        { transform: window.matchMedia('(max-width: 899px)').matches ? 'translate(1.4rem, -1.2rem) rotate(7.5deg)' : 'translate(2.4rem, -2rem) rotate(12deg)' }
      ], { duration: 560, easing: 'cubic-bezier(.3,.7,.2,1)' });
      setTimeout(function () { frente.style.zIndex = '0'; mover(); }, 280);
      anim.onfinish = function () { frente.style.zIndex = ''; ocupado = false; };
    }
    baraja.querySelector('.baraja__mazo').addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      pasar();
    });
    if (boton) boton.addEventListener('click', pasar);
    colocar();
    // La primera vez que se ve, la baraja se abre un momento para enseñar que hay más tickets detrás
    if (!reducido && 'IntersectionObserver' in window) {
      var visto = new IntersectionObserver(function (entradas) {
        if (!entradas[0].isIntersecting) return;
        visto.disconnect();
        setTimeout(function () {
          baraja.classList.add('baraja--asoma');
          setTimeout(function () { baraja.classList.remove('baraja--asoma'); }, 900);
        }, document.documentElement.classList.contains('con-intro') ? 3200 : 700);
      }, { threshold: 0.6 });
      visto.observe(baraja);
    }
  }

  function iniciarPlaylists() {
    document.querySelectorAll('[data-playlist]').forEach(function (a) {
      var url = PLAYLISTS[a.getAttribute('data-playlist')];
      var pronto = a.querySelector('[data-playlist-pronto]');
      if (url) {
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        a.removeAttribute('aria-disabled');
        a.setAttribute('aria-label', 'Pruébalo: escucha la playlist en Spotify');
        if (pronto) pronto.remove();
      } else {
        a.setAttribute('aria-label', 'Pruébalo: la playlist de Spotify llega pronto');
      }
    });
  }

  /* ---------- Estado de la edición según la fecha ---------- */
  var EDICION = {
    inicio: new Date('2026-10-17T00:00:00+02:00'),
    fin: new Date('2026-10-17T04:30:00+02:00')
  };

  function actualizarEdicion() {
    var ahora = new Date();
    var cuando = document.querySelector('[data-cuando]');
    var corto = document.querySelector('[data-cuando-corto]');

    if (ahora >= EDICION.fin) {
      raiz.classList.add('evento-pasado');
      document.querySelectorAll('[data-entradas]').forEach(function (a) {
        if (a.closest('.cabecera')) {
          a.href = 'https://www.instagram.com/gustoexperiencee/';
          a.textContent = 'Próximo sabor';
        } else {
          a.hidden = true;
        }
      });
      document.querySelectorAll('[data-pasada]').forEach(function (p) { p.hidden = false; });
      if (cuando) cuando.textContent = 'Se sirvió el viernes 16 de octubre';
      return;
    }

    var mismoDia = ahora.toDateString() === new Date('2026-10-16T12:00:00+02:00').toDateString();
    if (mismoDia || ahora >= EDICION.inicio) {
      if (cuando) cuando.textContent = ahora >= EDICION.inicio ? 'Sirviéndose ahora' : 'Esta noche · viernes 16';
      if (corto) corto.textContent = ahora >= EDICION.inicio ? 'Ahora' : 'Esta noche';
    }
  }

  /* ---------- Barra de pedido y boca animada ---------- */
  function vigilar() {
    if (!('IntersectionObserver' in window)) return;

    var barra = document.querySelector('[data-barra]');
    var ticket = document.querySelector('.ticket .boton');
    var pedido = document.getElementById('pedido');
    var visibles = new Set();

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target);
      });
      barra.classList.toggle('visible', visibles.size === 0);
    });
    if (barra && ticket) obs.observe(ticket);
    if (barra && pedido) obs.observe(pedido);

    var portada = document.querySelector('.portada');
    if (portada) {
      new IntersectionObserver(function (entradas) {
        portada.classList.toggle('quieto', !entradas[0].isIntersecting);
      }).observe(portada);
    }
  }

  /* ---------- Luces del hero: focos que barren, neblina y confeti con profundidad ---------- */
  function iniciarLuces() {
    var lienzo = document.querySelector('.portada__luces');
    if (!lienzo || !lienzo.getContext) return;
    var ctx = lienzo.getContext('2d');
    var colores = ['255,225,77', '255,62,165', '58,91,255', '25,194,122', '255,122,26'];
    var ancho = 0, alto = 0, escala = 1, activo = true, visible = true;
    var focos = [
      { x: 0.12, base: 0.55, amp: 0.38, vel: 0.23, fase: 0, color: colores[0] },
      { x: 0.5, base: 0, amp: 0.5, vel: 0.17, fase: 2.1, color: colores[1] },
      { x: 0.9, base: -0.5, amp: 0.36, vel: 0.2, fase: 4.2, color: colores[2] }
    ];
    var motas = [];
    for (var i = 0; i < 24; i++) {
      var capa = i % 3; // 0 lejos, 1 medio, 2 cerca
      motas.push({
        x: Math.random(), y: Math.random(),
        r: [26, 9, 3.5][capa] * (0.7 + Math.random() * 0.6),
        a: [0.3, 0.55, 0.95][capa],
        vel: [0.006, 0.012, 0.022][capa] * (0.7 + Math.random() * 0.6),
        prof: [0.15, 0.4, 0.8][capa],
        balanceo: Math.random() * Math.PI * 2,
        color: colores[i % colores.length]
      });
    }

    function medir() {
      escala = Math.min(window.devicePixelRatio || 1, 1.5);
      ancho = lienzo.clientWidth; alto = lienzo.clientHeight;
      lienzo.width = Math.round(ancho * escala);
      lienzo.height = Math.round(alto * escala);
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
    }

    function pintar(t) {
      var s = t / 1000;
      ctx.clearRect(0, 0, ancho, alto);
      ctx.globalCompositeOperation = 'source-over';

      focos.forEach(function (f) {
        var ox = f.x * ancho, oy = -alto * 0.04;
        var ang = Math.PI / 2 + f.base + Math.sin(s * f.vel * Math.PI * 2 * 0.25 + f.fase) * f.amp;
        var largo = alto * 1.25, abre = 0.16;
        var g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * largo, oy + Math.sin(ang) * largo);
        g.addColorStop(0, 'rgba(' + f.color + ',0.45)');
        g.addColorStop(0.5, 'rgba(' + f.color + ',0.2)');
        g.addColorStop(1, 'rgba(' + f.color + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(ang - abre) * largo, oy + Math.sin(ang - abre) * largo);
        ctx.lineTo(ox + Math.cos(ang + abre) * largo, oy + Math.sin(ang + abre) * largo);
        ctx.closePath();
        ctx.fill();
      });

      var scroll = window.scrollY || 0;
      motas.forEach(function (m) {
        var y = ((m.y - s * m.vel) % 1 + 1) % 1;
        var px = (m.x + Math.sin(s * 0.5 + m.balanceo) * 0.015) * ancho;
        var py = y * (alto + 80) - 40 - scroll * m.prof * 0.35;
        var g = ctx.createRadialGradient(px, py, 0, px, py, m.r);
        g.addColorStop(0, 'rgba(' + m.color + ',' + m.a + ')');
        g.addColorStop(m.r > 10 ? 0.2 : 0.6, 'rgba(' + m.color + ',' + m.a * 0.6 + ')');
        g.addColorStop(1, 'rgba(' + m.color + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, m.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function bucle(t) {
      if (!activo || !visible) return;
      pintar(t);
      requestAnimationFrame(bucle);
    }
    function reanudar() {
      if (movimientoReducido) return;
      if (activo && visible) requestAnimationFrame(bucle);
    }

    medir();
    window.addEventListener('resize', function () { medir(); if (movimientoReducido) pintar(4000); });
    if (movimientoReducido) { pintar(4000); return; }

    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden; reanudar();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var antes = activo; activo = e[0].isIntersecting;
        if (activo && !antes) reanudar();
      }).observe(lienzo);
    }
    reanudar();
  }

  /* ---------- Parallax por capas ---------- */
  function iniciarParallax() {
    if (movimientoReducido) return;
    var capas = Array.prototype.map.call(document.querySelectorAll('[data-parallax]'), function (el) {
      return { el: el, factor: parseFloat(el.getAttribute('data-parallax')) || 0, seccion: el.closest('section') || document.body };
    });
    if (!capas.length) return;
    var pendiente = false;
    function mover() {
      pendiente = false;
      var vh = window.innerHeight;
      capas.forEach(function (c) {
        var caja = c.seccion.getBoundingClientRect();
        if (caja.bottom < -vh * 0.5 || caja.top > vh * 1.5) return;
        var desplaza = -caja.top * c.factor;
        c.el.style.transform = 'translate3d(0,' + desplaza.toFixed(1) + 'px,0)';
      });
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    mover();
  }

  /* ---------- Calendario de varios meses ----------
     Para añadir una fiesta, añade una línea a FIESTAS. */
  var FIESTAS = [
    { fecha: '2026-10-16', sabor: 'Umami', enlace: 'la-carta.html' }
  ];
  // Viernes de Gusto se celebra cada dos viernes en New La Miel (Ji, 16/10/2026).
  // Las fechas que no están en FIESTAS salen con el sabor por desvelar.
  var CADA_DOS_VIERNES_DESDE = '2026-10-16';
  var PRIMER_MES = [2026, 9];  // octubre 2026 (los meses empiezan en 0)
  var NUM_MESES = 9;           // hasta junio 2027


  // Cuenta atrás y lista de las próximas fiestas (Menú del mes)
  function iniciarProximas() {
    var lista = document.querySelector('[data-proximas]');
    if (!lista) return;
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var mesesLargos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    var fecha = new Date(CADA_DOS_VIERNES_DESDE + 'T12:00:00');
    while (fecha < hoy) fecha.setDate(fecha.getDate() + 14);
    var colores = ['amarillo', 'verde', 'azul', 'naranja', 'rosa'];
    var html = '';
    var primera = null;
    for (var i = 0; i < 5; i++) {
      var c = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
      var f = FIESTAS.filter(function (x) { return x.fecha === c; })[0];
      if (!primera) primera = { fecha: new Date(fecha), sabor: f && f.sabor };
      var clase = f && f.sabor ? 'proxima--sabor' : 'proxima--' + colores[i % colores.length];
      var etiqueta = fecha.getDate() + ' de ' + mesesLargos[fecha.getMonth()] + ': ' + (f && f.sabor ? f.sabor : 'sabor por desvelar');
      html += '<li class="proxima ' + clase + '"><a href="' + (f ? f.enlace : 'la-carta.html') + '" aria-label="' + etiqueta + '">' +
        '<span class="proxima__dia">' + fecha.getDate() + '</span><span class="proxima__mes">' + meses[fecha.getMonth()] + '</span>' +
        '<span class="proxima__sabor">' + (f && f.sabor ? f.sabor : 'Por desvelar') + '</span></a></li>';
      fecha.setDate(fecha.getDate() + 14);
    }
    lista.innerHTML = html;

    var cuenta = document.querySelector('[data-cuenta]');
    if (!cuenta || !primera) return;
    var dias = Math.round((primera.fecha - hoy) / 86400000);
    cuenta.querySelector('[data-cuenta-numero]').innerHTML = dias === 0 ? '¡Es esta noche!' :
      (dias === 1 ? '¡Mañana!' : 'Faltan <strong>' + dias + '</strong> días');
    cuenta.querySelector('[data-cuenta-fecha]').textContent = 'Viernes ' + primera.fecha.getDate() + ' de ' + mesesLargos[primera.fecha.getMonth()] +
      ' · ' + (primera.sabor ? primera.sabor : 'sabor por desvelar') + ' · 00:00';
    cuenta.hidden = false;
  }

  function iniciarCalendario() {
    var caja = document.querySelector('[data-calendario]');
    if (!caja) return;
    var titulo = caja.querySelector('figcaption');
    var tabla = caja.querySelector('[data-mes-tabla]');
    var nota = caja.querySelector('[data-mes-nota]');
    var anterior = caja.querySelector('[data-mes-anterior]');
    var siguiente = caja.querySelector('[data-mes-siguiente]');
    var nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var dias = [['L', 'lunes'], ['M', 'martes'], ['X', 'miércoles'], ['J', 'jueves'], ['V', 'viernes'], ['S', 'sábado'], ['D', 'domingo']];
    var hoy = new Date();
    var claveHoy = clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var indice = 0;

    var inicioCiclo = new Date(CADA_DOS_VIERNES_DESDE + 'T12:00:00');
    function toca(a, m, d) {
      var dias = Math.round((new Date(a, m, d, 12) - inicioCiclo) / 86400000);
      return dias >= 0 && dias % 14 === 0;
    }
    function clave(a, m, d) { return a + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
    function mesDe(i) { var m = PRIMER_MES[1] + i; return [PRIMER_MES[0] + Math.floor(m / 12), m % 12]; }

    // Empieza en el mes actual si está dentro del calendario
    for (var k = 0; k < NUM_MESES; k++) {
      var mk = mesDe(k);
      if (mk[0] === hoy.getFullYear() && mk[1] === hoy.getMonth()) indice = k;
    }

    function pintar() {
      var am = mesDe(indice), a = am[0], m = am[1];
      titulo.textContent = nombres[m] + ' ' + a;
      var hueco = (new Date(a, m, 1).getDay() + 6) % 7;
      var total = new Date(a, m + 1, 0).getDate();
      var html = '<table><thead><tr>' + dias.map(function (d) {
        return '<th scope="col" abbr="' + d[1] + '">' + d[0] + '</th>';
      }).join('') + '</tr></thead><tbody><tr>';
      var celdas = 0, hayFiesta = false;
      for (var h = 0; h < hueco; h++) { html += '<td></td>'; celdas++; }
      for (var d = 1; d <= total; d++) {
        var c = clave(a, m, d);
        var fiesta = FIESTAS.filter(function (f) { return f.fecha === c; })[0];
        if (!fiesta && toca(a, m, d)) fiesta = { fecha: c, sabor: '', enlace: 'la-carta.html' };
        var clases = [];
        if (c < claveHoy) clases.push('dia-pasado');
        if (c === claveHoy) clases.push('dia-hoy');
        if (fiesta) {
          hayFiesta = true;
          clases.push('dia-gusto');
          if (!fiesta.sabor) clases.push('dia-sorpresa');
          html += '<td class="' + clases.join(' ') + '"><a href="' + fiesta.enlace + '" aria-label="' + d + ' de ' + nombres[m].toLowerCase() + ': Viernes de Gusto, ' + (fiesta.sabor || 'sabor por desvelar') + '">' + d + '<span aria-hidden="true">' + (fiesta.sabor || '¿?') + '</span></a></td>';
        } else {
          html += '<td' + (clases.length ? ' class="' + clases.join(' ') + '"' : '') + (c === claveHoy ? ' aria-current="date"' : '') + '>' + d + '</td>';
        }
        celdas++;
        if (celdas % 7 === 0 && d < total) html += '</tr><tr>';
      }
      while (celdas % 7 !== 0) { html += '<td></td>'; celdas++; }
      tabla.innerHTML = html + '</tr></tbody></table>';
      nota.hidden = hayFiesta;
      anterior.disabled = indice === 0;
      siguiente.disabled = indice === NUM_MESES - 1;
    }

    anterior.hidden = false;
    siguiente.hidden = false;
    anterior.addEventListener('click', function () { if (indice > 0) { indice--; pintar(); } });
    siguiente.addEventListener('click', function () { if (indice < NUM_MESES - 1) { indice++; pintar(); } });
    pintar();
  }


  /* La cabecera acompaña al bajar: en la portada se fija al pasar el primer bloque; en el resto ya va pegada arriba */
  function iniciarCabeceraFija() {
    var cab = document.querySelector('.cabecera');
    if (!cab) return;
    var umbral = function () { return cab.offsetHeight + 40; };
    var ticking = false;
    var revisar = function () {
      ticking = false;
      cab.classList.toggle('cabecera--fija', (window.scrollY || 0) > umbral());
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(revisar); }
    }, { passive: true });
    revisar();
  }

  /* En móvil, el menú deja a la vista la página actual */
  var menu = document.querySelector('.cabecera__nav');
  var actual = document.querySelector('.cabecera__nav [aria-current="page"]');
  if (menu) {
    if (actual) menu.scrollLeft = actual.offsetLeft - (menu.clientWidth - actual.offsetWidth) / 2;
    // El difuminado del borde solo cuando queda menú por ver, para no apagar el último enlace
    var alFinal = function () { menu.classList.toggle('al-final', menu.scrollLeft + menu.clientWidth >= menu.scrollWidth - 4); };
    menu.addEventListener('scroll', alFinal, { passive: true });
    alFinal();
  }

  iniciarIntro();
  actualizarEdicion();
  vigilar();
  iniciarDecoracion();
  iniciarPlaylists(); iniciarBaraja();
  iniciarLuces();
  iniciarCalendario(); iniciarProximas();
  iniciarParallax();
  iniciarCabeceraFija();
})();
