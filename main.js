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

    saltar.addEventListener('click', terminar);
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
    inicio: new Date('2026-10-16T23:00:00+02:00'),
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
    var ticket = document.querySelector('.ticket');
    var pedido = document.getElementById('pedido');
    var visibles = new Set();

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target);
      });
      var portadaArriba = ticket && ticket.getBoundingClientRect().bottom > 0;
      barra.classList.toggle('visible', visibles.size === 0 && !portadaArriba);
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

  iniciarIntro();
  actualizarEdicion();
  vigilar();
})();
