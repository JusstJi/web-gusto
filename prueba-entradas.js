/* Prueba de venta de entradas con QR (no se cobra nada).
   Cada entrada es un QR firmado con ECDSA P-256: el escáner solo necesita la clave
   pública para saber si es auténtica, así funciona sin cobertura. En la versión real
   la clave privada vive en el servidor y el QR se crea cuando Stripe confirma el pago;
   aquí, como es una prueba, las dos claves van en este archivo. */

const CLAVE_PRIVADA_PRUEBA = {"kty":"EC","crv":"P-256","x":"v-9LFgKBcQq6k9XbaJi3G5VxCzU6jidazQhCfcB74yk","y":"ai456GbVKHrZ6yPLivAb9JUTLLWwoI6yuz_HYCMkTrY","d":"lmRrI4KkJlcq6BU_d8d8sHx1ylVjBYSHKmTRzufXTgA"};
const CLAVE_PUBLICA = {"kty":"EC","crv":"P-256","x":"v-9LFgKBcQq6k9XbaJi3G5VxCzU6jidazQhCfcB74yk","y":"ai456GbVKHrZ6yPLivAb9JUTLLWwoI6yuz_HYCMkTrY"};
const ALGORITMO = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
const PREFIJO = "GUSTO1";
const EVENTO = "prueba";
const GASTOS = 1;
const TRAMOS = [
  { precio: 4, nombre: "Primeras" },
  { precio: 6, nombre: "Segundo tramo" },
  { precio: 8, nombre: "Último tramo" },
];

const euros = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function aBase64url(bytes) {
  let s = "";
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deBase64url(texto) {
  const s = atob(texto.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

const leer = (clave, defecto) => {
  try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; }
};
const guardar = (clave, valor) => {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin memoria, sigue funcionando */ }
};

async function firmar(datos) {
  const clave = await crypto.subtle.importKey("jwk", CLAVE_PRIVADA_PRUEBA, ALGORITMO, false, ["sign"]);
  const cuerpo = aBase64url(new TextEncoder().encode(JSON.stringify(datos)));
  const firma = await crypto.subtle.sign(ALGORITMO, clave, new TextEncoder().encode(cuerpo));
  return `${PREFIJO}.${cuerpo}.${aBase64url(new Uint8Array(firma))}`;
}

async function comprobar(texto) {
  const partes = String(texto).trim().split(".");
  if (partes.length !== 3 || partes[0] !== PREFIJO) return null;
  try {
    const clave = await crypto.subtle.importKey("jwk", CLAVE_PUBLICA, ALGORITMO, false, ["verify"]);
    const ok = await crypto.subtle.verify(ALGORITMO, clave, deBase64url(partes[2]), new TextEncoder().encode(partes[1]));
    if (!ok) return null;
    const datos = JSON.parse(new TextDecoder().decode(deBase64url(partes[1])));
    return datos.e === EVENTO ? datos : null;
  } catch {
    return null;
  }
}

function dibujarQR(texto) {
  const qr = qrcode(0, "M");
  qr.addData(texto);
  qr.make();
  const modulos = qr.getModuleCount();
  const margen = 4;
  const lado = 10;
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = (modulos + margen * 2) * lado;
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, lienzo.width, lienzo.height);
  ctx.fillStyle = "#16130F";
  for (let f = 0; f < modulos; f++) {
    for (let c = 0; c < modulos; c++) {
      if (qr.isDark(f, c)) ctx.fillRect((c + margen) * lado, (f + margen) * lado, lado, lado);
    }
  }
  return lienzo;
}

/* Imagen para guardar en el móvil: el QR con los datos debajo */
function imagenEntrada(entrada, qr) {
  const ancho = 720;
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = 1040;
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#F4EFE3";
  ctx.fillRect(0, 0, ancho, lienzo.height);
  ctx.fillStyle = "#16130F";
  ctx.textAlign = "center";
  ctx.font = "900 64px 'Big Shoulders Display', sans-serif";
  ctx.fillText("GUSTO", ancho / 2, 100);
  ctx.font = "700 28px 'Courier Prime', monospace";
  ctx.fillText("FIESTA DE PRUEBA · NEW LA MIEL", ancho / 2, 150);
  ctx.drawImage(qr, 80, 190, 560, 560);
  ctx.font = "700 34px 'Courier Prime', monospace";
  ctx.fillText(entrada.n.toUpperCase().slice(0, 28), ancho / 2, 820);
  ctx.font = "400 28px 'Courier Prime', monospace";
  ctx.fillText(`Entrada ${euros(entrada.p)} · nº ${entrada.i.slice(0, 6).toUpperCase()}`, ancho / 2, 870);
  ctx.fillText("Enseña este QR en la puerta", ancho / 2, 960);
  return lienzo;
}

/* ---------- Página de compra ---------- */
function iniciarCompra(raiz) {
  const formulario = raiz.querySelector("#compra");
  const tramos = raiz.querySelector("#tramos");
  const cantidad = raiz.querySelector("#cantidad");
  const resumen = raiz.querySelector("#resumen");
  const pago = raiz.querySelector("#pago");
  const resultado = raiz.querySelector("#resultado");
  const error = raiz.querySelector("#error-compra");

  tramos.innerHTML = TRAMOS.map((t, i) => `
    <label class="tramo">
      <input type="radio" name="tramo" value="${t.precio}" ${i === 0 ? "checked" : ""}>
      <span class="tramo__precio">${t.precio} €</span>
      <span class="tramo__nombre">${t.nombre}</span>
    </label>`).join("");

  const pedido = () => {
    const precio = Number(formulario.tramo.value);
    const n = Number(cantidad.value);
    return { precio, n, total: (precio + GASTOS) * n };
  };
  const pintarResumen = () => {
    const p = pedido();
    resumen.innerHTML = `
      <div><dt>${p.n} × entrada ${euros(p.precio)}</dt><dd>${euros(p.precio * p.n)}</dd></div>
      <div><dt>Gastos de gestión (${p.n} × ${euros(GASTOS)})</dt><dd>${euros(GASTOS * p.n)}</dd></div>
      <div class="resumen__total"><dt>Total</dt><dd>${euros(p.total)}</dd></div>`;
  };
  formulario.addEventListener("change", pintarResumen);
  pintarResumen();

  formulario.addEventListener("submit", (ev) => {
    ev.preventDefault();
    error.textContent = "";
    if (!formulario.reportValidity()) return;
    const email = formulario.email.value.trim().toLowerCase();
    if (email !== formulario.email2.value.trim().toLowerCase()) {
      error.textContent = "Los dos emails no coinciden. Revísalos: es el fallo más común.";
      formulario.email2.focus();
      return;
    }
    pago.querySelector("#pago-total").textContent = euros(pedido().total);
    pago.querySelector("#pago-email").textContent = email;
    formulario.hidden = true;
    pago.hidden = false;
    pago.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  pago.querySelector("#volver").addEventListener("click", () => {
    pago.hidden = true;
    formulario.hidden = false;
  });

  pago.querySelector("#simular-pago").addEventListener("click", async (ev) => {
    ev.currentTarget.disabled = true;
    const p = pedido();
    const nombre = formulario.nombre.value.trim();
    const email = formulario.email.value.trim();
    const entradas = [];
    for (let k = 0; k < p.n; k++) {
      const datos = { i: crypto.randomUUID().replace(/-/g, "").slice(0, 16), e: EVENTO, p: p.precio, n: nombre };
      entradas.push({ ...datos, codigo: await firmar(datos) });
    }
    guardar("gusto-prueba-entradas", [...leer("gusto-prueba-entradas", []), ...entradas.map((e) => ({ ...e, email }))]);
    pago.hidden = true;
    mostrarEntradas(resultado, entradas, email);
  });
}

function mostrarEntradas(resultado, entradas, email) {
  const lista = resultado.querySelector("#entradas");
  lista.innerHTML = "";
  entradas.forEach((entrada, k) => {
    const qr = dibujarQR(entrada.codigo);
    const tarjeta = document.createElement("article");
    tarjeta.className = "entrada";
    tarjeta.innerHTML = `
      <p class="entrada__cabeza">Gusto · Fiesta de prueba<span>Entrada ${k + 1} de ${entradas.length}</span></p>
      <div class="entrada__qr"></div>
      <p class="entrada__nombre">${entrada.n.replace(/[<>&]/g, "")}</p>
      <p class="entrada__datos">${euros(entrada.p)} · nº ${entrada.i.slice(0, 6).toUpperCase()}</p>
      <button class="boton boton--pequeno entrada__guardar" type="button">Guardar en el móvil</button>`;
    const img = document.createElement("img");
    img.src = qr.toDataURL("image/png");
    img.alt = `Código QR de la entrada ${k + 1}`;
    tarjeta.querySelector(".entrada__qr").append(img);
    tarjeta.querySelector(".entrada__guardar").addEventListener("click", () => {
      const enlace = document.createElement("a");
      enlace.download = `entrada-gusto-${entrada.i.slice(0, 6)}.png`;
      enlace.href = imagenEntrada(entrada, qr).toDataURL("image/png");
      enlace.click();
    });
    lista.append(tarjeta);
  });

  const correo = resultado.querySelector("#correo");
  correo.querySelector("#correo-para").textContent = email;
  correo.querySelector("#correo-qr").innerHTML = "";
  const mini = new Image();
  mini.src = dibujarQR(entradas[0].codigo).toDataURL("image/png");
  mini.alt = "QR de la entrada";
  correo.querySelector("#correo-qr").append(mini);
  correo.querySelector("#correo-n").textContent = entradas.length === 1 ? "tu entrada" : `tus ${entradas.length} entradas`;

  document.querySelectorAll("[data-antes-de-pagar]").forEach((el) => { el.hidden = true; });
  resultado.hidden = false;
  resultado.scrollIntoView({ behavior: "smooth", block: "start" });
}

function iniciarRecuperar(raiz) {
  const formulario = raiz.querySelector("#recuperar");
  if (!formulario) return;
  formulario.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const email = formulario.email.value.trim().toLowerCase();
    const suyas = leer("gusto-prueba-entradas", []).filter((e) => e.email.toLowerCase() === email);
    const aviso = formulario.querySelector(".recuperar__aviso");
    if (!suyas.length) {
      aviso.textContent = "No hay entradas con ese email (en la prueba solo se buscan las compradas en este móvil).";
      return;
    }
    aviso.textContent = "";
    mostrarEntradas(raiz.querySelector("#resultado"), suyas, email);
  });
}

/* ---------- Escáner de puerta ---------- */
function iniciarEscaner(raiz) {
  const video = raiz.querySelector("video");
  const empezar = raiz.querySelector("#empezar");
  const pantalla = raiz.querySelector("#veredicto");
  const contador = raiz.querySelector("#contador");
  const lienzo = document.createElement("canvas");
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  let usadas = leer("gusto-prueba-usadas", {});
  let ultimo = "";
  let ultimoA = 0;
  let ocupado = false;

  const pintarContador = () => {
    const n = Object.keys(usadas).length;
    contador.textContent = n === 1 ? "Ha entrado 1 persona" : `Han entrado ${n} personas`;
  };
  pintarContador();

  const veredicto = (tipo, titulo, detalle) => {
    pantalla.className = `veredicto veredicto--${tipo}`;
    pantalla.querySelector(".veredicto__titulo").textContent = titulo;
    pantalla.querySelector(".veredicto__detalle").textContent = detalle;
    pantalla.hidden = false;
    if (navigator.vibrate) navigator.vibrate(tipo === "ok" ? 120 : [80, 60, 80, 60, 200]);
    clearTimeout(veredicto.t);
    veredicto.t = setTimeout(() => { pantalla.hidden = true; }, 2600);
  };

  async function revisar(texto) {
    const datos = await comprobar(texto);
    if (!datos) {
      veredicto("mal", "NO VÁLIDA", "Este QR no es una entrada de Gusto o está manipulado.");
      return;
    }
    const hora = (t) => new Date(t).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (usadas[datos.i]) {
      veredicto("mal", "YA USADA", `${datos.n} · entró a las ${hora(usadas[datos.i])}`);
      return;
    }
    usadas[datos.i] = Date.now();
    guardar("gusto-prueba-usadas", usadas);
    pintarContador();
    veredicto("ok", "ADELANTE", `${datos.n} · entrada de ${euros(datos.p)}`);
  }

  function mirar() {
    if (video.readyState >= 2 && !ocupado) {
      const escala = Math.min(1, 640 / video.videoWidth);
      lienzo.width = Math.round(video.videoWidth * escala);
      lienzo.height = Math.round(video.videoHeight * escala);
      ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      const img = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
      const leido = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      // El mismo QR delante de la cámara no se cuenta otra vez hasta pasados 4 s
      if (leido && leido.data && !(leido.data === ultimo && Date.now() - ultimoA < 4000)) {
        ultimo = leido.data;
        ultimoA = Date.now();
        ocupado = true;
        revisar(leido.data).finally(() => { ocupado = false; });
      }
    }
    requestAnimationFrame(mirar);
  }

  empezar.addEventListener("click", async () => {
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      video.srcObject = flujo;
      await video.play();
      empezar.hidden = true;
      raiz.querySelector(".escaner__visor").classList.add("escaner__visor--activo");
      requestAnimationFrame(mirar);
    } catch {
      raiz.querySelector("#error-camara").textContent = "No se ha podido abrir la cámara. Dale permiso en el navegador y vuelve a intentarlo.";
    }
  });

  raiz.querySelector("#reiniciar").addEventListener("click", () => {
    if (!confirm("¿Borrar la lista de entradas ya escaneadas en este móvil?")) return;
    usadas = {};
    guardar("gusto-prueba-usadas", usadas);
    pintarContador();
  });
  pantalla.addEventListener("click", () => { pantalla.hidden = true; });
}

const raiz = document.body;
if (raiz.dataset.prueba === "compra") { iniciarCompra(raiz); iniciarRecuperar(raiz); }
if (raiz.dataset.prueba === "escaner") iniciarEscaner(raiz);
