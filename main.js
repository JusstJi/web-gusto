(function () {
  'use strict';

  var raiz = document.documentElement;

  /* ---------- «Pruébalo»: enlaces a las playlists de Spotify ---------- */
  // Pega aquí el enlace de cada playlist cuando exista; mientras esté vacío, el botón sale como «pronto».
  var PLAYLISTS = {
    umami: 'https://open.spotify.com/playlist/1diwoHYeV590P5D9R8vARR',
    proximo: '',
    siguiente: ''
  };


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

  /* ---------- Calendario de varios meses ----------
     Para añadir una fiesta, añade una línea a FIESTAS. */
  var FIESTAS = [
    { fecha: '2026-10-16', sabor: 'Umami', enlace: 'la-carta.html' },
    // Ji (19/10/2026): el color de la fiesta del 30 es amarillo limón; el sabor aún no
    { fecha: '2026-10-30', sabor: '', color: '#FDEF50', nombreColor: 'amarillo limón', enlace: 'la-carta.html' }
  ];
  // Viernes de Gusto se celebra cada dos viernes en New La Miel (Ji, 16/10/2026).
  // Las fechas que no están en FIESTAS salen con el sabor por desvelar.
  var CADA_DOS_VIERNES_DESDE = '2026-10-16';
  var PRIMER_MES = [2026, 9];  // octubre 2026 (los meses empiezan en 0)
  var NUM_MESES = 3;           // hasta diciembre 2026 (Ji, 19/10/2026)


  // Galería: al tocar una foto se abre el visor con todas las de esa fiesta
  // La Carta: se abre sola la comanda de la próxima fiesta (o la de esta noche)
  function iniciarCarta() {
    var comandas = document.querySelectorAll('[data-comandas] details[data-fecha]');
    if (!comandas.length) return;
    var ahora = new Date();
    var proxima = null;
    comandas.forEach(function (d) {
      var fin = new Date(d.dataset.fecha + 'T04:30:00+02:00');
      fin.setDate(fin.getDate() + 1);
      if (!proxima && fin > ahora) proxima = d;
    });
    if (!proxima) return;
    comandas.forEach(function (d) { d.open = d === proxima; });
  }

  // Intro con el logo (solo en la portada): el brillo cruza las letras y la cortina sube
  function iniciarIntro() {
    var intro = document.querySelector('[data-intro]');
    var html = document.documentElement;
    if (!intro || !html.classList.contains('con-intro')) { if (intro) intro.remove(); return; }
    try { sessionStorage.setItem('gusto-intro', '1'); } catch (e) {}
    var hecho = false;
    function salir() {
      if (hecho) return;
      hecho = true;
      intro.classList.add('intro--sale');
      setTimeout(function () { html.classList.remove('con-intro'); }, 250);
      setTimeout(function () { intro.remove(); }, 1000);
    }
    var t = setTimeout(salir, 2700);
    intro.addEventListener('click', function () { clearTimeout(t); salir(); });
    window.addEventListener('keydown', function () { clearTimeout(t); salir(); }, { once: true });
  }

  function iniciarGaleria() {
    var visor = document.querySelector('[data-visor]');
    if (!visor || !visor.showModal) return;
    var foto = visor.querySelector('[data-visor-foto]');
    var sabor = visor.querySelector('[data-visor-sabor]');
    var cuenta = visor.querySelector('[data-visor-cuenta]');
    var descargar = visor.querySelector('[data-visor-descargar]');
    var album = null, total = 0, actual = 1;
    foto.draggable = false;

    function ruta(n) { return 'fotos/galeria/' + album.dataset.album + '/' + String(n).padStart(2, '0') + '.jpg'; }
    function mostrar(n) {
      actual = (n - 1 + total) % total + 1;
      foto.src = ruta(actual);
      descargar.href = ruta(actual);
      descargar.setAttribute('download', 'gusto-' + album.dataset.album + '-' + String(actual).padStart(2, '0') + '.jpg');
      foto.alt = album.dataset.sabor + ', ' + album.dataset.fecha + ': foto ' + actual + ' de ' + total;
      cuenta.textContent = actual + ' / ' + total;
      // Precarga la siguiente para que pasar sea instantáneo
      new Image().src = ruta(actual % total + 1);
    }

    document.querySelectorAll('[data-album] [data-foto]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        album = a.closest('[data-album]');
        total = parseInt(album.dataset.fotos, 10);
        sabor.textContent = album.dataset.sabor;
        mostrar(parseInt(a.dataset.foto, 10));
        visor.showModal();
      });
    });
    visor.querySelector('[data-visor-cerrar]').addEventListener('click', function () { visor.close(); });
    visor.querySelector('[data-visor-anterior]').addEventListener('click', function () { mostrar(actual - 1); });
    visor.querySelector('[data-visor-siguiente]').addEventListener('click', function () { mostrar(actual + 1); });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostrar(actual - 1);
      if (e.key === 'ArrowRight') mostrar(actual + 1);
    });
    // Tocar fuera de la foto cierra; deslizar el dedo pasa de foto
    visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
    var x0 = null;
    foto.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    foto.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) mostrar(actual + (dx < 0 ? 1 : -1));
    });
  }

  // Cuenta atrás de la portada: la fiesta empieza a las 00:00 de la noche del viernes y acaba a las 04:30
  function iniciarReloj() {
    var reloj = document.querySelector('[data-reloj]');
    var hoy = document.querySelector('.hoy');
    if (hoy && 'IntersectionObserver' in window) {
      var miraHoy = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { hoy.classList.add('hoy--vista'); miraHoy.disconnect(); }
      }, { threshold: 0.25 });
      miraHoy.observe(hoy);
    } else if (hoy) hoy.classList.add('hoy--vista');
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
      var fecha = reloj.querySelector('[data-reloj-fecha]');
      var corta = document.querySelector('[data-portada-fecha]');
      if (corta) corta.textContent = dos(f.getDate()) + '.' + dos(f.getMonth() + 1);
      // la fecha grande de la portada va en el color de la fiesta cuando ya se conoce
      if (corta) corta.style.color = fiesta && fiesta.color ? fiesta.color : '';
      fecha.textContent = 'Viernes ' + f.getDate() + ' de ' + mesesLargos[f.getMonth()] +
        ' · ' + (fiesta && fiesta.sabor ? fiesta.sabor : 'sabor por desvelar');
      // Si ya sabemos el color de la fiesta, va en una pegatina al lado de la fecha
      // y tiñe la comanda (banda de arriba, subrayado y cifras) con ese color
      reloj.classList.toggle('comanda-hoy--color', !!(fiesta && fiesta.color));
      if (fiesta && fiesta.color) reloj.style.setProperty('--color', fiesta.color);
      else reloj.style.removeProperty('--color');
      if (fiesta && fiesta.color) {
        var muestra = document.createElement('span');
        muestra.className = 'reloj__color';
        muestra.style.background = fiesta.color;
        muestra.title = 'Color de la fiesta: ' + fiesta.nombreColor;
        muestra.setAttribute('role', 'img');
        muestra.setAttribute('aria-label', 'Color: ' + fiesta.nombreColor);
        fecha.insertBefore(muestra, fecha.firstChild);
      }
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
    var colores = ['amarillo', 'verde', 'rojo', 'naranja', 'rosa'];
    var html = '';
    var primera = null;
    for (var i = 0; i < 5; i++) {
      var c = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
      var f = FIESTAS.filter(function (x) { return x.fecha === c; })[0];
      if (!primera) primera = { fecha: new Date(fecha), sabor: f && f.sabor };
      var clase = f && f.sabor ? 'proxima--sabor' : (f && f.color ? 'proxima--color' : 'proxima--' + colores[i % colores.length]);
      var tinta = f && !f.sabor && f.color ? ' style="--c:' + f.color + '"' : '';
      var etiqueta = fecha.getDate() + ' de ' + mesesLargos[fecha.getMonth()] + ': ' + (f && f.sabor ? f.sabor : 'sabor por desvelar');
      html += '<li class="proxima ' + clase + '"' + tinta + '><a href="' + (f ? f.enlace : 'la-carta.html') + '" aria-label="' + etiqueta + '">' +
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
          if (!fiesta.sabor) clases.push(fiesta.color ? 'dia-color' : 'dia-sorpresa');
          html += '<td class="' + clases.join(' ') + '"' + (fiesta.color && !fiesta.sabor ? ' style="--c:' + fiesta.color + '"' : '') + '><a href="' + fiesta.enlace + '" aria-label="' + d + ' de ' + nombres[m].toLowerCase() + ': Viernes de Gusto, ' + (fiesta.sabor || 'sabor por desvelar') + '">' + d + '<span aria-hidden="true">' + (fiesta.sabor || '¿?') + '</span></a></td>';
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

  actualizarEdicion();
  vigilar();
  iniciarPlaylists();
  iniciarCalendario(); iniciarProximas(); iniciarReloj(); iniciarGaleria();
  iniciarCarta();
  iniciarIntro();
  iniciarCabeceraFija();
})();
