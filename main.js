(function () {
  'use strict';

  var raiz = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro: la boca abierta da un lametón, se amplía y se abre la web ---------- */
  function marcarVista() {
    try { sessionStorage.setItem('gusto-intro', '1'); } catch (e) {}
  }

  function iniciarIntro() {
    var intro = document.getElementById('intro');
    if (!intro || !raiz.classList.contains('con-intro')) return;

    var boca = intro.querySelector('.intro__boca');
    var lema = intro.querySelector('.intro__lema');
    var lengua = intro.querySelector('.intro__lengua');
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
      var fundido = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: 900, fill: 'forwards' });
      animaciones.push(fundido);
      fundido.onfinish = terminar;
      return;
    }

    function animar(el, pasos, opciones) {
      opciones.fill = 'forwards';
      var a = el.animate(pasos, opciones);
      animaciones.push(a);
      return a;
    }

    // 1. La boca aparece ya abierta, con la lengua fuera
    animar(boca, [
      { transform: 'scale(0.5)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });

    // 2. Lametón
    var lameton = animar(lengua, [
      { transform: 'rotate(0deg) scaleY(1)' },
      { transform: 'rotate(-14deg) scaleY(0.88)', offset: 0.3 },
      { transform: 'rotate(14deg) scaleY(1.18)', offset: 0.65 },
      { transform: 'rotate(0deg) scaleY(1)' }
    ], { duration: 760, delay: 300, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' });

    // 3. Zoom hacia la lengua hasta llenar la pantalla y aparece la portada
    lameton.onfinish = function () {
      if (acabada) return;
      var zoom = Math.max(window.innerWidth, window.innerHeight) / Math.max(boca.getBoundingClientRect().width, 1) * 6;
      animar(lema, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
      animar(boca, [{ transform: 'scale(1)' }, { transform: 'scale(' + zoom.toFixed(1) + ')' }], { duration: 700, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' });
      animar(intro, [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 700, easing: 'linear' }).onfinish = terminar;
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
  var PRIMER_MES = [2026, 9];  // octubre 2026 (los meses empiezan en 0)
  var NUM_MESES = 9;           // hasta junio 2027

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
        var clases = [];
        if (c < claveHoy) clases.push('dia-pasado');
        if (c === claveHoy) clases.push('dia-hoy');
        if (fiesta) {
          hayFiesta = true;
          clases.push('dia-gusto');
          html += '<td class="' + clases.join(' ') + '"><a href="' + fiesta.enlace + '" aria-label="' + d + ' de ' + nombres[m].toLowerCase() + ': Viernes de Gusto, ' + fiesta.sabor + '">' + d + '<span>' + fiesta.sabor + '</span></a></td>';
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
  iniciarCalendario();
  iniciarParallax();
})();
