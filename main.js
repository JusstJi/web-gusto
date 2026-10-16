(function () {
  'use strict';

  var raiz = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro: la lengua da un lametón y se abre la web ---------- */
  function marcarVista() {
    try { sessionStorage.setItem('gusto-intro', '1'); } catch (e) {}
  }

  function iniciarIntro() {
    var intro = document.getElementById('intro');
    if (!intro || !raiz.classList.contains('con-intro')) return;

    var lengua = intro.querySelector('.intro__lengua');
    var lema = intro.querySelector('.intro__lema');
    var saltar = document.getElementById('saltar-intro');
    var animaciones = [];
    var acabada = false;

    function terminar() {
      if (acabada) return;
      acabada = true;
      animaciones.forEach(function (a) { a.cancel(); });
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
      lengua.style.display = 'none';
      var fundido = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 900, fill: 'forwards' });
      animaciones.push(fundido);
      fundido.onfinish = terminar;
      return;
    }

    // Escala para que la lengua tape toda la pantalla al pasar
    var caja = lengua.getBoundingClientRect();
    var ancho = caja.width || 200;
    var alto = ancho * 1.3;
    var tapa = Math.max(window.innerWidth / ancho, window.innerHeight / alto) * 1.7;

    var asoma = lengua.animate([
      { transform: 'translate(-50%, 100%)' },
      { transform: 'translate(-50%, 38%)' }
    ], { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    animaciones.push(asoma);

    asoma.onfinish = function () {
      if (acabada) return;
      var lameton = lengua.animate([
        { transform: 'translate(-50%, 38%) rotate(0deg) scale(1)' },
        { transform: 'translate(-50%, 46%) rotate(4deg) scale(1.08)', offset: 0.14 },
        { transform: 'translate(-50%, 0%) rotate(-6deg) scale(' + tapa + ')', offset: 0.55 },
        { transform: 'translate(-50%, -' + Math.round(window.innerHeight * 1.2 + 40) + 'px) rotate(-10deg) scale(' + tapa + ')' }
      ], { duration: 1050, easing: 'cubic-bezier(0.55, 0, 0.35, 1)', fill: 'forwards' });
      animaciones.push(lameton);

      // Cuando la lengua tapa la pantalla, el fondo rosa y el lema se van: al salir deja ver la web
      var fondo = intro.animate([
        { backgroundColor: getComputedStyle(intro).backgroundColor },
        { backgroundColor: 'rgba(247, 168, 216, 0)' }
      ], { duration: 60, delay: 560, fill: 'forwards' });
      var lemaFuera = lema.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60, delay: 560, fill: 'forwards' });
      animaciones.push(fondo, lemaFuera);

      lameton.onfinish = terminar;
    };

    setTimeout(terminar, 4000);
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

  /* ---------- Barra de pedido y plato giratorio ---------- */
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

    var plato = document.querySelector('.plato');
    if (plato) {
      new IntersectionObserver(function (entradas) {
        plato.classList.toggle('quieto', !entradas[0].isIntersecting);
      }).observe(plato);
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

  /* En móvil, el menú deja a la vista la página actual */
  var actual = document.querySelector('.cabecera__nav [aria-current="page"]');
  if (actual) {
    var menu = actual.closest('.cabecera__nav');
    menu.scrollLeft = actual.offsetLeft - (menu.clientWidth - actual.offsetWidth) / 2;
  }

  iniciarIntro();
  actualizarEdicion();
  vigilar();
  iniciarLuces();
  iniciarParallax();
})();
