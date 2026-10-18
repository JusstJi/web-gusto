(function () {
  'use strict';

  var raiz = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro: el lema y un barrido de arcoíris ---------- */
  // Las letras caen, se quedan un momento y cinco bandas de color suben por la
  // pantalla; cuando se van, detrás ya está la web.
  var ARCOIRIS = ['#FF3EA5', '#FF7A1A', '#FFE14D', '#19C27A', '#3A5BFF'];

  function barrerArcoiris(intro, alTapar, alTerminar) {
    // Cinco bandas anidadas: suben juntas y por arriba y por abajo asoma el arcoíris entero
    var capa = intro.querySelector('.intro__arcoiris');
    capa.innerHTML = ARCOIRIS.map(function (c, i) { return '<span style="background:' + c + ';--i:' + i + '"></span>'; }).join('');
    var sube = capa.animate([
      { transform: 'translateY(100vh)', easing: 'cubic-bezier(0.55, 0, 0.75, 1)' },
      { transform: 'translateY(-58vh)', offset: 0.5, easing: 'cubic-bezier(0.25, 0, 0.45, 1)' },
      { transform: 'translateY(-216vh)' }
    ], { duration: 1350, fill: 'both' });
    // A mitad de camino el arcoíris tapa toda la pantalla: el lema y el fondo ya sobran
    var tapa = setTimeout(alTapar, 675);
    sube.onfinish = alTerminar;
    return function () { clearTimeout(tapa); sube.cancel(); };
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
      // Sin movimiento: el lema quieto y un fundido suave
      intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 900, fill: 'forwards' }).onfinish = terminar;
      return;
    }

    // El lema se queda un momento a la vista y luego pasa el arcoíris
    var espera = setTimeout(function () {
      parar = barrerArcoiris(intro, function () { intro.classList.add('intro--tapada'); }, terminar);
    }, 1750);
    parar = function () { clearTimeout(espera); };
    setTimeout(terminar, 4200);
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
    var giros = [-7, 4, -3, 6, -5, 3, -4];
    var n = 0;
    document.querySelectorAll('.intro__linea').forEach(function (linea) {
      var esColores = linea.classList.contains('intro__linea--colores');
      var html = '';
      Array.prototype.forEach.call(linea.textContent, function (ch, i) {
        if (ch === ' ') { html += ' '; return; }
        var estilo = '--d:' + (esColores ? 420 + i * 80 : n++ * 35) + 'ms;--r:' + (i % 2 ? 25 : -25) + 'deg';
        if (esColores) estilo += ';--c:' + colores[i % colores.length] + ';--t:' + giros[i % giros.length] + 'deg';
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


  // Cuenta atrás de la portada: la fiesta empieza a las 00:00 de la noche del viernes y acaba a las 04:30
  function iniciarReloj() {
    var reloj = document.querySelector('[data-reloj]');
    if (!reloj) return;
    var mesesLargos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var cifras = reloj.querySelector('[data-reloj-cifras]');
    var ahora = reloj.querySelector('[data-reloj-ahora]');
    var campos = ['dias', 'horas', 'min', 'seg'].map(function (k) { return reloj.querySelector('[data-reloj-' + k + ']'); });
    var viernes = null, empieza = 0, acaba = 0;

    function buscar(t) {
      var f = new Date(CADA_DOS_VIERNES_DESDE + 'T12:00:00');
      for (;;) {
        empieza = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1, 0, 0).getTime();
        acaba = empieza + 4.5 * 3600000;
        if (acaba > t) break;
        f.setDate(f.getDate() + 14);
      }
      viernes = f;
      var c = f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
      var fiesta = FIESTAS.filter(function (x) { return x.fecha === c; })[0];
      reloj.querySelector('[data-reloj-fecha]').textContent = 'Viernes ' + f.getDate() + ' de ' + mesesLargos[f.getMonth()] +
        ' · ' + (fiesta && fiesta.sabor ? fiesta.sabor : 'sabor por desvelar');
    }

    function dos(n) { return String(n).padStart(2, '0'); }
    function pintar() {
      var t = Date.now();
      if (!viernes || t >= acaba) buscar(t);
      var falta = Math.max(0, Math.floor((empieza - t) / 1000));
      cifras.hidden = falta === 0;
      ahora.hidden = falta > 0;
      campos[0].textContent = Math.floor(falta / 86400);
      campos[1].textContent = dos(Math.floor(falta / 3600) % 24);
      campos[2].textContent = dos(Math.floor(falta / 60) % 60);
      campos[3].textContent = dos(falta % 60);
    }
    pintar();
    reloj.hidden = false;
    setInterval(pintar, 1000);
  }

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
  iniciarCalendario(); iniciarProximas(); iniciarReloj();
  iniciarParallax();
  iniciarCabeceraFija();
})();
