/* =========================================================
   app.js — Pantallas, guardado y conexión de todo.
   Las reglas viven en logic.js; aquí solo se usan.
   ========================================================= */
(function () {
  'use strict';
  const D = window.DATA, L = window.L;

  const CLAVE_REAL = 'princesa-partida-v1';
  const CLAVE_DEMO = 'princesa-demo-v1';

  let estado = null;          // la partida cargada
  let modoDemo = false;       // true cuando se está viendo la demo
  let vista = 'hoy';          // pantalla actual
  let diaRegistro = 'hoy';    // 'hoy' | 'ayer'
  let borrador = null;        // registro que se está llenando
  let tiendaPestana = 'accesorios';
  let animTemporal = null;    // {clase, hasta}
  let siestaHasta = 0;        // pose panza arriba temporal

  // Control del uso continuo (anti-scroll)
  const uso = { inicio: Date.now(), ocultoDesde: null, dormida: false };

  const $ = s => document.querySelector(s);
  const ahora = () => Date.now();
  const hoy = () => L.aClave(new Date());
  const ayer = () => L.sumarDias(hoy(), -1);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Number(n || 0).toLocaleString('es-CO');
  const horasTxt = h => (h === null || h === undefined || h === '') ? '—' : String(Math.round(h * 100) / 100).replace('.', ',') + ' h';
  const multTxt = m => 'x' + String(m).replace('.', ',');
  function fechaBonita(clave, corta) {
    const op = corta ? { day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' };
    return L.deClave(clave).toLocaleDateString('es-CO', op);
  }
  const azarDe = arr => arr[Math.floor(Math.random() * arr.length)];

  /* =================== Guardado =================== */

  function leer(clave) {
    try { const t = localStorage.getItem(clave); return t ? JSON.parse(t) : null; }
    catch (e) { return null; }
  }
  function guardar() {
    try { localStorage.setItem(modoDemo ? CLAVE_DEMO : CLAVE_REAL, JSON.stringify(estado)); }
    catch (e) { toast('No se pudo guardar en este navegador.'); }
  }

  function estadoNuevo(nombre) {
    const t = ahora();
    return {
      v: 1, demo: false, nombre: nombre || '', inicio: D.TEMPORADA_INICIO, creado: t,
      lineaBase: { horas: D.LINEA_BASE_HORAS, redesMin: null, desbloqueos: null },
      metas: JSON.parse(JSON.stringify(D.METAS)),
      gata: Object.assign({}, D.GATA_DEFECTO),
      xp: 0, monedas: 0, comida: 0,
      pancita: { valor: 100, hora: t }, ultimaComida: t,
      mimos: { fecha: hoy(), n: 0 },
      registros: {}, semanas: {}, jefes: {},
      accesorios: { comprados: [], puestos: [] },
      canjes: [], regalos: [],
      balanceFinal: { redesMin: null, desbloqueos: null }
    };
  }

  /* =================== XP y registros =================== */

  // Suma (o resta, si es una corrección) XP a las tres bolsas: total, comida y monedas.
  function sumarXP(n, silencioso) {
    if (!n) return;
    const antes = L.nivelPara(estado.xp).n;
    estado.xp = Math.max(0, estado.xp + n);
    estado.monedas = Math.max(0, estado.monedas + n);
    estado.comida = Math.max(0, estado.comida + n);
    const despues = L.nivelPara(estado.xp).n;
    if (!silencioso && despues > antes) setTimeout(() => celebrarNivel(despues), 400);
  }

  // Vuelve a calcular el XP de ayer y hoy (los únicos editables) y aplica la diferencia.
  // Se hace en orden porque la racha de hoy depende de ayer.
  function recalcularEditables(silencioso) {
    [ayer(), hoy()].forEach(k => {
      const r = estado.registros[k];
      if (!r) return;
      const res = L.xpDelDia(estado.registros, estado.metas, k);
      const delta = res.xp - (r.xp || 0);
      r.xp = res.xp; r.mult = res.mult;
      sumarXP(delta, silencioso);
    });
  }

  function claveDia() { return diaRegistro === 'ayer' ? ayer() : hoy(); }

  function registroVacio() { return { horas: null, casillas: {}, contadores: {} }; }

  function cargarBorrador() {
    const r = estado.registros[claveDia()];
    borrador = r ? { horas: r.horas, casillas: Object.assign({}, r.casillas), contadores: Object.assign({}, r.contadores) } : registroVacio();
  }

  /* =================== Estado de Princesa =================== */

  function mimosHoy() {
    if (estado.mimos.fecha !== hoy()) estado.mimos = { fecha: hoy(), n: 0 };
    return estado.mimos.n;
  }

  function visualPrincesa() {
    const t = ahora();
    const pancita = L.pancitaActual(estado.pancita, t);
    const nivel = L.nivelPara(estado.xp);
    const etapa = L.etapaPara(nivel.n);
    let pose = 'sentada';
    let animo = L.animoPara(pancita, mimosHoy());
    let frase;
    if (L.estaEscondida(estado.ultimaComida, t)) { pose = 'escondida'; frase = D.FRASES.escondida[0]; }
    else if (uso.dormida) { pose = 'durmiendo'; frase = D.FRASES.dormida[0]; }
    else if (siestaHasta > t) { pose = 'panza'; frase = 'Panza arriba, como siempre. Zzz…'; }
    return { pancita, nivel, etapa, pose, animo, frase };
  }

  // Frase estable durante un rato para que no cambie en cada render
  const frasesFijas = {};
  function fraseDe(animo) {
    if (!frasesFijas[animo] || frasesFijas[animo].hasta < ahora()) {
      frasesFijas[animo] = { texto: azarDe(D.FRASES[animo]), hasta: ahora() + 60000 };
    }
    return frasesFijas[animo].texto;
  }

  function svgActual(v) {
    return window.svgPrincesa({
      colores: estado.gata, pose: v.pose, animo: v.animo, etapa: v.etapa,
      accesorios: estado.accesorios.puestos
    });
  }

  function aplicarAnimTemporal() {
    if (!animTemporal || animTemporal.hasta < ahora()) return;
    document.querySelectorAll('svg.princesa').forEach(s => s.classList.add(animTemporal.clase));
  }

  function animar(clase, ms) {
    animTemporal = { clase, hasta: ahora() + ms };
    aplicarAnimTemporal();
    setTimeout(() => {
      if (animTemporal && animTemporal.clase === clase) animTemporal = null;
      document.querySelectorAll('svg.princesa').forEach(s => s.classList.remove(clase));
    }, ms);
  }

  // Le pone una cosa a Princesa y se quita la que esté en la misma ranura (cabeza, cuello…)
  function ponerAccesorio(id) {
    const a = D.ACCESORIOS.find(x => x.id === id);
    let puestos = estado.accesorios.puestos.filter(x => x !== id);
    if (a && a.ranura) {
      puestos = puestos.filter(x => { const o = D.ACCESORIOS.find(y => y.id === x); return !o || o.ranura !== a.ranura; });
    }
    puestos.push(id);
    estado.accesorios.puestos = puestos;
  }

  function vibrar(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }

  function tocarPrincesa() {
    const v = visualPrincesa();
    if (v.pose === 'escondida') return toast('Está debajo de la cama. Un platico de comida la hace salir.');
    if (v.pose === 'durmiendo') return toast('Está dormida. Ya no hay mimos que contar: es buen momento para soltar el celular.');
    estado.mimos.n = mimosHoy() + 1;
    guardar();
    render();
    animar('ronroneando', 1800);
    vibrar([30, 40, 30, 40, 30]);
  }

  function alimentar(id) {
    const c = D.COMIDAS.find(x => x.id === id);
    if (estado.comida < c.costo) return toast('Te faltan ' + (c.costo - estado.comida) + ' de comida. La comida se gana con XP.');
    const t = ahora();
    const actual = L.pancitaActual(estado.pancita, t);
    if (actual >= 98) return toast('Princesa está llenita. Guarda la comida para después.');
    const estabaEscondida = L.estaEscondida(estado.ultimaComida, t);
    estado.comida -= c.costo;
    estado.pancita = { valor: Math.min(100, actual + c.sube), hora: t };
    estado.ultimaComida = t;
    guardar();
    render();
    if (estabaEscondida) toast('¡Salió de debajo de la cama! No se perdió nada.');
    animar('comiendo', 2600);
    if (c.ronronea) setTimeout(() => { animar('ronroneando', 2000); vibrar([30, 40, 30, 40, 30]); }, 2700);
  }

  function jugar() {
    const v = visualPrincesa();
    if (v.pose === 'escondida' || v.pose === 'durmiendo') return tocarPrincesa();
    estado.mimos.n = mimosHoy() + 1; // jugar da ánimo, no XP
    guardar();
    render();
    animar('jugando', 3200);
  }

  function siesta() {
    const v = visualPrincesa();
    if (v.pose === 'escondida') return tocarPrincesa();
    siestaHasta = ahora() + 7000;
    render();
    setTimeout(render, 7100);
  }

  /* =================== Anti-scroll =================== */

  setInterval(() => {
    if (!estado || document.hidden || uso.dormida) return;
    if (ahora() - uso.inicio >= D.MINUTOS_ANTI_SCROLL * 60000) {
      uso.dormida = true;
      render();
      modal({
        titulo: 'Princesa se quedó dormida',
        cuerpo: '<p>Bostezó, dio dos vueltas y se acurrucó. Llevas un ratico en la app: ya está todo registrado. Suelta el celular y ve a hacer algo bonito.</p><p class="suave">Puedes seguir usando la app, pero los mimos ya no cuentan hasta que vuelvas más tarde.</p>',
        botones: [{ texto: 'Listo, lo suelto', clase: 'primario' }]
      });
    }
  }, 5000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { uso.ocultoDesde = ahora(); return; }
    if (uso.ocultoDesde && ahora() - uso.ocultoDesde > 60000) {
      uso.inicio = ahora();
      if (uso.dormida) { uso.dormida = false; if (estado) render(); }
    }
    uso.ocultoDesde = null;
    if (estado) render(); // la pancita cambia con el tiempo
  });

  /* =================== Componentes de interfaz =================== */

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('visible'), 3200);
  }

  function modal(o) {
    const m = $('#modal');
    m.innerHTML = '<div class="modal-caja" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
      (o.arriba || '') +
      '<h2 id="modal-titulo">' + o.titulo + '</h2>' + (o.cuerpo || '') +
      '<div class="modal-botones">' + (o.botones || [{ texto: 'Cerrar' }]).map((b, i) =>
        '<button class="btn ' + (b.clase || '') + '" data-i="' + i + '">' + b.texto + '</button>').join('') + '</div></div>';
    m.hidden = false;
    m.querySelectorAll('.modal-botones button').forEach(btn => {
      btn.onclick = () => {
        const b = (o.botones || [])[Number(btn.dataset.i)];
        if (b && b.antesDeCerrar && b.antesDeCerrar() === false) return;
        cerrarModal();
        if (b && b.accion) b.accion();
      };
    });
    const primero = m.querySelector('.modal-botones button');
    if (primero) primero.focus();
  }
  function cerrarModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }

  function confirmar(titulo, cuerpo, textoSi, accion) {
    modal({ titulo, cuerpo: '<p>' + cuerpo + '</p>', botones: [{ texto: 'Cancelar' }, { texto: textoSi, clase: 'primario', accion }] });
  }

  function confeti() {
    const colores = ['#E86A92', '#F2C14E', '#6FA8DC', '#81B29A', '#B84A33'];
    let s = '<div class="confeti" aria-hidden="true">';
    for (let i = 0; i < 40; i++) {
      s += '<i style="left:' + Math.random() * 100 + '%;background:' + azarDe(colores) + ';animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;animation-duration:' + (1.6 + Math.random()).toFixed(2) + 's"></i>';
    }
    return s + '</div>';
  }

  function celebrarNivel(n) {
    const nv = D.NIVELES.find(x => x.n === n);
    const etapaAntes = L.etapaPara(n - 1), etapaAhora = L.etapaPara(n);
    const nombresEtapa = { gatita: 'gatita', joven: 'joven', adulta: 'adulta elegante', reina: 'con corona' };
    modal({
      arriba: confeti() + '<div class="modal-gata">' + window.svgPrincesa({ colores: estado.gata, animo: 'juguetona', etapa: etapaAhora, accesorios: estado.accesorios.puestos }) + '</div>',
      titulo: '¡Subiste a nivel ' + n + '!',
      cuerpo: '<p>Ahora eres <b>' + nv.nombre + '</b>.' + (etapaAntes !== etapaAhora ? ' Princesa creció: ahora está ' + nombresEtapa[etapaAhora] + '.' : '') + '</p>',
      botones: [{ texto: '¡Qué bien!', clase: 'primario' }]
    });
    vibrar([60, 60, 120]);
  }

  function barra(valor, max, clase) {
    const p = Math.max(0, Math.min(100, (valor / max) * 100));
    return '<div class="barra ' + (clase || '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + Math.round(valor) + '"><span style="width:' + p + '%"></span></div>';
  }

  /* =================== Render general =================== */

  function render() {
    if (!estado) return renderBienvenida();
    document.body.classList.remove('sin-nav');
    $('#banner-demo').hidden = !modoDemo;
    const nv = L.nivelPara(estado.xp);
    $('#chips').innerHTML =
      '<span class="chip" title="Nivel">Nv ' + nv.n + ' · ' + nv.nombre + '</span>' +
      '<span class="chip" title="Monedas">🪙 ' + num(estado.monedas) + '</span>' +
      '<span class="chip" title="Comida en la despensa">🥣 ' + num(estado.comida) + '</span>';
    document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('activo', b.dataset.vista === vista));
    const vistas = { hoy: vistaHoy, princesa: vistaPrincesa, retos: vistaRetos, tienda: vistaTienda, progreso: vistaProgreso, ajustes: vistaAjustes };
    $('#vista').innerHTML = (vistas[vista] || vistaHoy)();
    conectar();
    aplicarAnimTemporal();
  }

  function irA(v) {
    vista = v;
    if (v === 'hoy') cargarBorrador();
    render();
    window.scrollTo(0, 0);
  }

  /* =================== Bienvenida =================== */

  function renderBienvenida() {
    document.body.classList.add('sin-nav');
    $('#banner-demo').hidden = true;
    $('#chips').innerHTML = '';
    $('#vista').innerHTML =
      '<section class="bienvenida">' +
      '<div class="gata-grande">' + window.svgPrincesa({ colores: D.GATA_DEFECTO, animo: 'feliz', etapa: 'gatita' }) + '</div>' +
      '<h1>Princesa<br><span>temporada sin scroll</span></h1>' +
      '<p>Del 18 de noviembre de 2026 al 18 de mayo de 2027. Cada meta que cumples en la vida real se vuelve comida para Princesa.</p>' +
      '<label class="campo">¿Cómo te llamas?<input id="nombre-nuevo" type="text" maxlength="30" autocomplete="given-name" placeholder="Tu nombre"></label>' +
      '<button class="btn primario grande" id="empezar">Empezar mi temporada</button>' +
      '<button class="btn grande" id="ver-demo">Ver la demostración (30 días de ejemplo)</button>' +
      '<p class="suave pequeno">Todo se guarda solo en este navegador. Si otra persona abre el enlace, empieza con su propia Princesa.</p>' +
      '</section>';
    $('#empezar').onclick = () => {
      estado = estadoNuevo($('#nombre-nuevo').value.trim());
      modoDemo = false;
      guardar();
      irA('hoy');
      modal({
        titulo: '¡Hola' + (estado.nombre ? ', ' + esc(estado.nombre) : '') + '!',
        cuerpo: '<p>Princesa llegó con la pancita llena. Cada noche, en <b>Hoy</b>, registras tus horas de celular y lo que hiciste. Eso te da XP, que es comida y monedas.</p><p>Princesa nunca se muere ni se va. Si la descuidas dos días, se esconde debajo de la cama y sale con el primer plato.</p>',
        botones: [{ texto: 'Vamos', clase: 'primario' }]
      });
    };
    $('#ver-demo').onclick = abrirDemo;
  }

  /* =================== Pantalla: HOY (registro nocturno) =================== */

  function vistaHoy() {
    if (!borrador) cargarBorrador();
    const v = visualPrincesa();
    const k = claveDia();
    const meta = L.metaPara(estado.metas, k);
    const nota = L.notaMetaPara(estado.metas, k);
    const racha = L.rachaActual(estado.registros, estado.metas, hoy());
    const guardado = estado.registros[k];
    const frase = v.frase || fraseDe(v.animo);

    let s = '<section class="tarjeta mini">' +
      '<div class="mini-svg tocable" data-tocar title="Hazle un mimo">' + svgActual(v) + '</div>' +
      '<div class="mini-info"><p class="frase">«' + esc(frase) + '»</p>' +
      '<p class="etiqueta">Pancita ' + Math.round(v.pancita) + '/100</p>' + barra(v.pancita, 100, v.pancita < 25 ? 'baja' : '') +
      '<p class="racha">🔥 Racha: <b>' + racha + ' ' + (racha === 1 ? 'día' : 'días') + '</b> · ' + multTxt(L.multiplicadorPara(racha)) + '</p></div></section>';

    s += '<section class="tarjeta">' +
      '<div class="segmento" role="tablist">' +
      '<button role="tab" data-dia="hoy" class="' + (diaRegistro === 'hoy' ? 'activo' : '') + '">Hoy</button>' +
      '<button role="tab" data-dia="ayer" class="' + (diaRegistro === 'ayer' ? 'activo' : '') + '">Ayer</button></div>' +
      '<h2 class="cap">' + fechaBonita(k) + '</h2>' +
      '<p class="meta-dia">Meta: máximo <b>' + horasTxt(meta) + '</b> de celular' + (nota ? ' · ' + esc(nota) : '') + '</p>' +
      (guardado ? '<p class="suave pequeno">Ya registraste este día. Puedes corregirlo y volver a guardar.</p>' : '') +
      '<label class="campo">Horas de celular <span class="suave">(cópialo de Bienestar digital)</span>' +
      '<input id="horas" type="number" inputmode="decimal" step="0.1" min="0" max="24" placeholder="Ej: 4,5" value="' + (borrador.horas ?? '') + '"></label>' +
      '<ul class="autos"><li id="auto-meta">Cumplí la meta del día <b>+' + D.XP_META + '</b></li>' +
      '<li id="auto-debajo">Quedé 1 h o más por debajo <b>+' + D.XP_DEBAJO_META + '</b></li></ul>' +
      '<h3>Lo que hice</h3><div class="casillas">';
    D.CASILLAS.forEach(c => {
      const on = !!borrador.casillas[c.id];
      s += '<button class="casilla" data-casilla="' + c.id + '" aria-pressed="' + on + '"><span class="check" aria-hidden="true">' + (on ? '✓' : '') + '</span><span>' + c.texto + '</span><b>+' + c.xp + '</b></button>';
    });
    s += '</div><h3>Contadores</h3><div class="contadores">';
    D.CONTADORES.forEach(c => {
      const n = Number(borrador.contadores[c.id] || 0);
      s += '<div class="contador"><div><span>' + c.texto + '</span><small>+' + c.xp + ' cada uno' + (c.max ? ' · máx. ' + c.max : '') + '</small></div>' +
        '<div class="ctrl"><button aria-label="Menos" data-menos="' + c.id + '">−</button><output>' + n + '</output><button aria-label="Más" data-mas="' + c.id + '">+</button></div></div>';
    });
    s += '</div></section>';
    s += '<section class="tarjeta resumen" id="resumen"></section>';
    s += '<button class="btn primario grande" id="guardar-registro">' + (guardado ? 'Guardar cambios' : 'Guardar registro') + '</button>';
    s += '<div id="zona-escudo">' + zonaEscudo(k) + '</div>';
    return s;
  }

  function zonaEscudo(k) {
    const r = estado.registros[k];
    if (!r) return '';
    const res = L.xpDelDia(estado.registros, estado.metas, k);
    if (res.cumplio) return '';
    if (r.escudo) return '<section class="tarjeta escudo"><p>🛡️ Usaste el escudo en este día: tu racha está protegida.</p><button class="btn pequeno" id="quitar-escudo">Quitar escudo</button></section>';
    if (L.escudoDisponible(estado.registros, k)) {
      return '<section class="tarjeta escudo"><p>Este día no se cumplió la meta. Tienes 1 escudo esta semana para proteger tu racha.</p><button class="btn" id="usar-escudo">🛡️ Usar escudo</button></section>';
    }
    return '<section class="tarjeta escudo"><p class="suave">Ya usaste el escudo de esta semana. Se renueva el lunes. Tranquila: no se pierde XP.</p></section>';
  }

  function actualizarResumen() {
    const k = claveDia();
    const temp = Object.assign({}, estado.registros);
    temp[k] = Object.assign({}, borrador, { escudo: false });
    const res = L.xpDelDia(temp, estado.metas, k);
    const b = L.xpBase(temp[k], res.meta);
    const el = $('#resumen');
    if (!el) return;
    $('#auto-meta').classList.toggle('logrado', b.cumplio);
    $('#auto-debajo').classList.toggle('logrado', b.debajo);
    el.innerHTML = '<div><span>XP base</span><b>' + res.base + '</b></div>' +
      '<div><span>Racha</span><b>' + multTxt(res.mult) + '</b></div>' +
      '<div class="total"><span>XP de este día</span><b>' + res.xp + '</b></div>' +
      (!b.hayHoras ? '<p class="suave pequeno">Escribe las horas para saber si cumpliste la meta.</p>' :
        b.cumplio ? '<p class="pequeno ok">¡Meta cumplida!' + (res.mult > 1 ? ' Tu racha multiplica todo el XP del día.' : '') + '</p>' :
          '<p class="pequeno">Hoy no se cumplió la meta. Lo demás cuenta igual.</p>');
  }

  function guardarRegistro() {
    const k = claveDia();
    if (borrador.horas !== null && (borrador.horas < 0 || borrador.horas > 24)) return toast('Las horas deben estar entre 0 y 24.');
    if (borrador.horas === null) return toast('Escribe primero las horas de celular del día.');
    const previo = estado.registros[k] || {};
    const xpAntes = estado.xp;
    estado.registros[k] = {
      horas: borrador.horas,
      casillas: Object.assign({}, borrador.casillas),
      contadores: Object.assign({}, borrador.contadores),
      xp: previo.xp || 0, mult: previo.mult || 1,
      escudo: !!previo.escudo, regalo: !!previo.regalo, guardado: ahora()
    };
    const res0 = L.xpDelDia(estado.registros, estado.metas, k);
    if (res0.cumplio) estado.registros[k].escudo = false; // si ahora cumple, el escudo queda libre
    recalcularEditables();
    const res = L.xpDelDia(estado.registros, estado.metas, k);
    let regalo = false;
    if (res.cumplio && !estado.registros[k].regalo) {
      estado.registros[k].regalo = true; // se tira el dado una sola vez por día
      regalo = Math.random() < D.PROB_REGALO;
    }
    guardar();
    const dif = estado.xp - xpAntes;
    cargarBorrador();
    render();
    toast(dif > 0 ? '¡Guardado! +' + dif + ' XP' : dif < 0 ? 'Guardado. Se corrigieron ' + dif + ' XP.' : 'Guardado.');
    if (regalo) setTimeout(darRegalo, 900);
  }

  function darRegalo() {
    const faltan = D.ACCESORIOS.filter(a => !estado.accesorios.comprados.includes(a.id));
    let texto;
    if (faltan.length && Math.random() < 0.5) {
      const a = azarDe(faltan);
      estado.accesorios.comprados.push(a.id);
      ponerAccesorio(a.id);
      estado.regalos.push({ fecha: hoy(), tipo: 'accesorio', valor: a.id });
      texto = 'Te trajo: <b>' + a.nombre + '</b>. Ya lo tiene puesto (lo puedes quitar en su cuarto).';
    } else {
      sumarXP(D.XP_REGALO);
      estado.regalos.push({ fecha: hoy(), tipo: 'xp', valor: D.XP_REGALO });
      texto = 'Te trajo <b>' + D.XP_REGALO + ' XP</b> extra.';
    }
    guardar();
    render();
    modal({
      arriba: '<div class="modal-gata regalo">' + window.svgPrincesa({ colores: estado.gata, animo: 'juguetona', etapa: L.etapaPara(L.nivelPara(estado.xp).n), accesorios: estado.accesorios.puestos }) + '<span class="caja-regalo" aria-hidden="true">🎁</span></div>',
      titulo: '¡Princesa te trajo un regalo!',
      cuerpo: '<p>' + texto + '</p>',
      botones: [{ texto: 'Gracias, Princesa', clase: 'primario' }]
    });
  }

  function usarEscudo(quitar) {
    const k = claveDia();
    const r = estado.registros[k];
    if (!r) return;
    if (!quitar && !L.escudoDisponible(estado.registros, k)) return toast('Ya usaste el escudo de esta semana.');
    r.escudo = !quitar;
    recalcularEditables();
    guardar();
    render();
    toast(quitar ? 'Escudo devuelto.' : '🛡️ Racha protegida.');
  }

  /* =================== Pantalla: PRINCESA =================== */

  function vistaPrincesa() {
    const v = visualPrincesa();
    const nv = v.nivel;
    const frase = v.frase || fraseDe(v.animo);
    const nombresEtapa = { gatita: 'Gatita', joven: 'Joven', adulta: 'Adulta elegante', reina: 'Reina con corona' };
    const animoTxt = { feliz: 'Feliz', juguetona: 'Juguetona', tranquila: 'Tranquila', aburrida: 'Aburrida', triste: 'Triste' };
    const estadoTxt = v.pose === 'escondida' ? 'Escondida' : v.pose === 'durmiendo' ? 'Dormida' : animoTxt[v.animo];

    let s = '<section class="cuarto"><div class="gata-grande tocable" data-tocar title="Hazle un mimo">' + svgActual(v) + '</div>' +
      '<p class="burbuja">«' + esc(frase) + '»</p></section>';

    s += '<section class="tarjeta"><div class="fila-datos">' +
      '<div><span class="etiqueta">Ánimo</span><b>' + estadoTxt + '</b></div>' +
      '<div><span class="etiqueta">Etapa</span><b>' + nombresEtapa[v.etapa] + '</b></div>' +
      '<div><span class="etiqueta">Mimos hoy</span><b>' + mimosHoy() + '</b></div></div>' +
      '<p class="etiqueta">Pancita ' + Math.round(v.pancita) + '/100</p>' + barra(v.pancita, 100, v.pancita < 25 ? 'baja' : '') +
      '<p class="etiqueta">Nivel ' + nv.n + ' · ' + nv.nombre + ' — ' + num(estado.xp) + ' XP' + (nv.siguiente ? ' (faltan ' + num(nv.siguiente.min - estado.xp) + ' para ' + nv.siguiente.nombre + ')' : ' · nivel máximo') + '</p>' +
      (nv.siguiente ? barra(estado.xp - nv.min, nv.siguiente.min - nv.min, 'xp') : barra(1, 1, 'xp')) +
      '</section>';

    s += '<section class="tarjeta"><h2>Darle de comer</h2><p class="suave">Despensa: <b>' + num(estado.comida) + '</b> de comida</p><div class="comidas">';
    D.COMIDAS.forEach(c => {
      s += '<button class="btn comida" data-comer="' + c.id + '"' + (estado.comida < c.costo ? ' aria-disabled="true"' : '') + '>' +
        '<span class="emoji" aria-hidden="true">' + c.emoji + '</span><b>' + c.nombre + '</b><small>Cuesta ' + c.costo + ' · +' + c.sube + ' pancita</small></button>';
    });
    s += '</div></section>';

    s += '<section class="tarjeta"><h2>Estar con ella</h2><div class="acciones">' +
      '<button class="btn" data-tocar>🤍 Mimo</button><button class="btn" id="jugar">🧶 Jugar</button><button class="btn" id="siesta">💤 Siesta panza arriba</button></div>' +
      '<p class="suave pequeno">Los mimos y el juego le suben el ánimo. No dan XP.</p></section>';

    const comprados = D.ACCESORIOS.filter(a => estado.accesorios.comprados.includes(a.id));
    s += '<section class="tarjeta"><h2>Sus cosas y su ropita</h2>';
    if (!comprados.length) s += '<p class="suave">Todavía no tiene accesorios. Se compran en la Tienda con monedas.</p>';
    else {
      s += '<div class="lista-acc">';
      comprados.forEach(a => {
        const puesto = estado.accesorios.puestos.includes(a.id);
        s += '<button class="casilla" data-poner="' + a.id + '" aria-pressed="' + puesto + '"><span class="check" aria-hidden="true">' + (puesto ? '✓' : '') + '</span><span>' + a.nombre + '</span><small>' + (puesto ? 'Puesto' : 'Guardado') + '</small></button>';
      });
      s += '</div>';
    }
    s += '</section>';
    return s;
  }

  /* =================== Pantalla: RETOS =================== */

  function asegurarSemana(lunes) {
    if (!estado.semanas[lunes]) estado.semanas[lunes] = { misiones: L.misionesDeSemana(lunes, String(estado.creado)), hechas: [], domingo: null };
    return estado.semanas[lunes];
  }

  function vistaRetos() {
    const h = hoy();
    const lunes = L.lunesDe(h);
    const sem = asegurarSemana(lunes);
    const racha = L.rachaActual(estado.registros, estado.metas, h);
    const mejor = L.mejorRacha(estado.registros, estado.metas);
    const mult = L.multiplicadorPara(racha);
    const sigTramo = D.RACHAS.slice().reverse().find(r => r.dias > racha);

    // Escudo de la semana
    let escudoUsado = null;
    for (let i = 0; i < 7; i++) { const d = L.sumarDias(lunes, i); if (estado.registros[d] && estado.registros[d].escudo) escudoUsado = d; }

    let s = '<section class="tarjeta"><h2>Racha</h2><div class="fila-datos">' +
      '<div><span class="etiqueta">Actual</span><b>🔥 ' + racha + '</b></div>' +
      '<div><span class="etiqueta">Multiplicador</span><b>' + multTxt(mult) + '</b></div>' +
      '<div><span class="etiqueta">Mejor</span><b>' + mejor + '</b></div></div>' +
      (sigTramo ? '<p class="suave pequeno">Con ' + sigTramo.dias + ' días seguidos cumpliendo la meta, tu XP vale ' + multTxt(sigTramo.mult) + '.</p>' : '<p class="pequeno ok">Estás en el multiplicador máximo.</p>') +
      '<p class="pequeno">🛡️ Escudo de esta semana: ' + (escudoUsado ? 'usado el ' + fechaBonita(escudoUsado, true) : '<b>disponible</b> (se usa desde el registro de un día en que no cumpliste)') + '</p></section>';

    s += '<section class="tarjeta"><h2>Misiones de la semana</h2><p class="suave pequeno">Del ' + fechaBonita(lunes, true) + ' al ' + fechaBonita(L.sumarDias(lunes, 6), true) + '. Márcalas cuando las cumplas.</p><div class="casillas">';
    sem.misiones.forEach(id => {
      const m = D.MISIONES.find(x => x.id === id);
      const on = sem.hechas.includes(id);
      s += '<button class="casilla" data-mision="' + id + '" aria-pressed="' + on + '"><span class="check" aria-hidden="true">' + (on ? '✓' : '') + '</span><span>' + m.texto + '</span><b>+' + m.xp + '</b></button>';
    });
    s += '</div></section>';

    const antesDeTemporada = h < estado.inicio;
    const mes = L.mesDeTemporada(estado.inicio, antesDeTemporada ? estado.inicio : h);
    s += '<section class="tarjeta jefe"><h2>Jefe del mes ' + mes + '</h2><p class="jefe-nombre">' + D.JEFES[mes - 1] + '</p>';
    if (estado.jefes[mes]) s += '<p class="ok">✓ Lo lograste el ' + fechaBonita(estado.jefes[mes], true) + '. +' + D.XP_JEFE + ' XP</p><button class="btn pequeno" data-jefe-deshacer="' + mes + '">Deshacer</button>';
    else s += '<button class="btn primario" data-jefe="' + mes + '">¡Lo logré! +' + D.XP_JEFE + ' XP</button>';
    s += '<ol class="jefes">';
    D.JEFES.forEach((j, i) => {
      const n = i + 1;
      const est = estado.jefes[n] ? '✓' : n === mes ? '⚔️' : n < mes ? '—' : '🔒';
      s += '<li class="' + (n === mes ? 'actual' : '') + '"><span aria-hidden="true">' + est + '</span> Mes ' + n + ': ' + j + '</li>';
    });
    s += '</ol></section>';
    return s;
  }

  function toggleMision(id) {
    const sem = asegurarSemana(L.lunesDe(hoy()));
    const m = D.MISIONES.find(x => x.id === id);
    if (sem.hechas.includes(id)) { sem.hechas = sem.hechas.filter(x => x !== id); sumarXP(-m.xp); toast('Misión desmarcada (−' + m.xp + ' XP).'); }
    else { sem.hechas.push(id); sumarXP(m.xp); toast('¡Misión cumplida! +' + m.xp + ' XP'); }
    guardar(); render();
  }

  /* =================== Pantalla: TIENDA =================== */

  function vistaTienda() {
    let s = '<section class="tarjeta"><p class="monedas-grande">🪙 ' + num(estado.monedas) + ' <span>monedas</span></p>' +
      '<div class="segmento"><button data-tienda="accesorios" class="' + (tiendaPestana === 'accesorios' ? 'activo' : '') + '">Su cuarto</button>' +
      '<button data-tienda="ropa" class="' + (tiendaPestana === 'ropa' ? 'activo' : '') + '">Ropita</button>' +
      '<button data-tienda="vida" class="' + (tiendaPestana === 'vida' ? 'activo' : '') + '">Para mí</button></div></section>';
    if (tiendaPestana === 'accesorios' || tiendaPestana === 'ropa') {
      const deRopa = tiendaPestana === 'ropa';
      s += '<section class="tarjeta">' + (deRopa ? '<p class="suave pequeno">Se compra con monedas. Lo que va en la misma parte del cuerpo se cambia: un gorro reemplaza a la corona, una bufanda a la pañoleta.</p>' : '') + '<div class="productos">';
      D.ACCESORIOS.filter(a => (a.tipo === 'ropa') === deRopa).forEach(a => {
        const tiene = estado.accesorios.comprados.includes(a.id);
        s += '<div class="producto"><div class="prev">' + window.svgPrincesa({ colores: estado.gata, animo: 'feliz', etapa: 'adulta', accesorios: [a.id] }) + '</div>' +
          '<b>' + a.nombre + '</b>' + (tiene ? '<span class="ok pequeno">Ya es suyo</span>' :
            '<button class="btn pequeno" data-comprar-acc="' + a.id + '"' + (estado.monedas < a.precio ? ' aria-disabled="true"' : '') + '>🪙 ' + a.precio + '</button>') + '</div>';
      });
      s += '</div></section>';
    } else {
      s += '<section class="tarjeta"><ul class="recompensas">';
      D.RECOMPENSAS.forEach(r => {
        s += '<li><span>' + r.nombre + '</span><button class="btn pequeno" data-canjear="' + r.id + '"' + (estado.monedas < r.precio ? ' aria-disabled="true"' : '') + '>🪙 ' + num(r.precio) + '</button></li>';
      });
      s += '</ul></section>';
      s += '<section class="tarjeta"><h2>Historial de canjes</h2>';
      if (!estado.canjes.length) s += '<p class="suave">Aún no has canjeado recompensas.</p>';
      else s += '<ul class="historial">' + estado.canjes.slice().reverse().map(c => '<li><span>' + fechaBonita(c.fecha, true) + '</span>' + esc(c.nombre) + '<b>🪙 ' + num(c.precio) + '</b></li>').join('') + '</ul>';
      s += '</section>';
    }
    return s;
  }

  function comprarAccesorio(id) {
    const a = D.ACCESORIOS.find(x => x.id === id);
    if (estado.monedas < a.precio) return toast('Te faltan ' + (a.precio - estado.monedas) + ' monedas.');
    confirmar('¿Comprar ' + a.nombre + '?', 'Cuesta ' + a.precio + ' monedas. Gastar no baja tu nivel.', 'Comprar', () => {
      estado.monedas -= a.precio;
      estado.accesorios.comprados.push(id);
      ponerAccesorio(id);
      guardar(); render();
      toast(a.tipo === 'ropa' ? '¡Le queda divino! Ya lo tiene puesto.' : '¡A Princesa le encantó!');
    });
  }

  function canjear(id) {
    const r = D.RECOMPENSAS.find(x => x.id === id);
    if (estado.monedas < r.precio) return toast('Te faltan ' + num(r.precio - estado.monedas) + ' monedas.');
    confirmar('¿Canjear «' + r.nombre + '»?', 'Cuesta ' + num(r.precio) + ' monedas. Quedará en tu historial con la fecha de hoy.', 'Canjear', () => {
      estado.monedas -= r.precio;
      estado.canjes.push({ fecha: hoy(), id: r.id, nombre: r.nombre, precio: r.precio });
      guardar(); render();
      toast('¡Disfrútalo! Te lo ganaste.');
    });
  }

  /* =================== Pantalla: PROGRESO =================== */

  function graficoHoras() {
    const dias = 30, fin = hoy(), ini = L.sumarDias(fin, -(dias - 1));
    const W = 360, H = 200, izq = 26, der = 6, arr = 10, abj = 24;
    let maxY = 8;
    for (let i = 0; i < dias; i++) {
      const k = L.sumarDias(ini, i), r = estado.registros[k];
      if (r && r.horas != null) maxY = Math.max(maxY, Math.ceil(r.horas));
    }
    const anchoBarra = (W - izq - der) / dias;
    const y = v => arr + (H - arr - abj) * (1 - v / maxY);
    let s = '<svg class="grafico" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Horas de celular por día en los últimos 30 días comparadas con la meta">';
    for (let t = 0; t <= maxY; t += 2) s += '<line x1="' + izq + '" x2="' + (W - der) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="rejilla"/><text x="' + (izq - 5) + '" y="' + (y(t) + 3) + '" class="eje" text-anchor="end">' + t + '</text>';
    let metaD = '';
    for (let i = 0; i < dias; i++) {
      const k = L.sumarDias(ini, i), r = estado.registros[k];
      const meta = L.metaPara(estado.metas, k);
      const x = izq + i * anchoBarra;
      metaD += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y(meta).toFixed(1) + ' H' + (x + anchoBarra).toFixed(1) + ' ';
      if (r && r.horas != null) {
        const est = L.estadoDia(estado.registros, estado.metas, k);
        s += '<rect x="' + (x + 1.5).toFixed(1) + '" y="' + y(r.horas).toFixed(1) + '" width="' + (anchoBarra - 3).toFixed(1) + '" height="' + (y(0) - y(r.horas)).toFixed(1) + '" rx="2" class="b-' + est + '"><title>' + fechaBonita(k, true) + ': ' + horasTxt(r.horas) + ' (meta ' + horasTxt(meta) + ')</title></rect>';
      }
      if ((dias - 1 - i) % 7 === 0) s += '<text x="' + (x + anchoBarra / 2).toFixed(1) + '" y="' + (H - 8) + '" class="eje" text-anchor="middle">' + L.deClave(k).getDate() + '</text>';
    }
    s += '<path d="' + metaD + '" class="linea-meta"/>';
    s += '</svg><p class="leyenda"><span class="l-cumplio"></span>Cumplida <span class="l-fallo"></span>No cumplida <span class="l-escudo"></span>Con escudo <span class="l-meta"></span>Meta</p>';
    return s;
  }

  function vistaProgreso() {
    const h = hoy();
    const racha = L.rachaActual(estado.registros, estado.metas, h);
    const mejor = L.mejorRacha(estado.registros, estado.metas);
    const ult7 = L.horasDe(estado.registros, L.sumarDias(h, -6), 7);
    const prom7 = L.promedio(ult7);

    let s = '<section class="tarjeta"><h2>Progreso</h2><div class="fila-datos">' +
      '<div><span class="etiqueta">Racha</span><b>🔥 ' + racha + '</b></div>' +
      '<div><span class="etiqueta">Mejor racha</span><b>' + mejor + '</b></div>' +
      '<div><span class="etiqueta">Promedio 7 días</span><b>' + (prom7 == null ? '—' : horasTxt(prom7.toFixed(1))) + '</b></div></div>' +
      '<h3>Horas de celular, últimos 30 días</h3>' + graficoHoras() + '</section>';

    // Promedio semanal (últimas 8 semanas)
    s += '<section class="tarjeta"><h3>Promedio por semana</h3><ul class="semanas">';
    const lunesHoy = L.lunesDe(h);
    let alguna = false;
    for (let w = 7; w >= 0; w--) {
      const lun = L.sumarDias(lunesHoy, -7 * w);
      const hs = L.horasDe(estado.registros, lun, 7);
      if (!hs.length) continue;
      alguna = true;
      const p = L.promedio(hs);
      const metaProm = L.promedio([0, 1, 2, 3, 4, 5, 6].map(i => L.metaPara(estado.metas, L.sumarDias(lun, i))));
      s += '<li><span>Semana del ' + fechaBonita(lun, true) + '</span><b class="' + (p <= metaProm ? 'ok' : '') + '">' + horasTxt(p.toFixed(1)) + '</b><small>meta ' + horasTxt(metaProm.toFixed(1)) + '</small></li>';
    }
    if (!alguna) s += '<li class="suave">Aún no hay registros.</li>';
    s += '</ul></section>';

    s += seccionDomingo();
    s += seccionBalance();
    return s;
  }

  function seccionDomingo() {
    const h = hoy();
    const lunes = L.lunesDe(h);
    const sem = asegurarSemana(lunes);
    let s = '<section class="tarjeta"><h2>Domingo</h2>';
    if (L.esDomingo(h)) {
      s += '<p class="suave pequeno">Responde de 1 (nada) a 5 (mucho).</p>';
      D.PREGUNTAS_DOMINGO.forEach((q, i) => {
        const val = sem.domingo ? sem.domingo[i] : null;
        s += '<fieldset class="pregunta"><legend>' + q + '</legend><div class="escala">';
        for (let n = 1; n <= 5; n++) s += '<button data-domingo="' + i + '" data-valor="' + n + '" aria-pressed="' + (val === n) + '">' + n + '</button>';
        s += '</div></fieldset>';
      });
    } else {
      const faltan = 7 - ((L.deClave(h).getDay() + 7) % 7);
      s += '<p class="suave">Las cuatro preguntas se abren el domingo' + (faltan < 7 ? ' (faltan ' + faltan + ' ' + (faltan === 1 ? 'día' : 'días') + ')' : '') + '.</p>';
    }
    // Gráfico del promedio por semana
    const semanas = Object.keys(estado.semanas).sort().filter(k => estado.semanas[k].domingo && estado.semanas[k].domingo.every(v => v));
    if (semanas.length) {
      const ult = semanas.slice(-12);
      const W = 360, H = 140, izq = 22, abj = 22, arr = 10;
      const ancho = (W - izq - 6) / ult.length;
      const y = v => arr + (H - arr - abj) * (1 - v / 5);
      s += '<h3>Promedio por semana</h3><svg class="grafico" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Promedio semanal de las preguntas del domingo">';
      for (let t = 1; t <= 5; t++) s += '<line x1="' + izq + '" x2="' + (W - 6) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="rejilla"/><text x="' + (izq - 5) + '" y="' + (y(t) + 3) + '" class="eje" text-anchor="end">' + t + '</text>';
      ult.forEach((k, i) => {
        const p = L.promedio(estado.semanas[k].domingo);
        const x = izq + i * ancho;
        s += '<rect x="' + (x + 3) + '" y="' + y(p) + '" width="' + Math.max(4, ancho - 6) + '" height="' + (y(0) - y(p)) + '" rx="3" class="b-domingo"><title>' + fechaBonita(k, true) + ': ' + p.toFixed(1) + '</title></rect>';
        s += '<text x="' + (x + ancho / 2) + '" y="' + (H - 7) + '" class="eje" text-anchor="middle">' + L.deClave(k).getDate() + '/' + (L.deClave(k).getMonth() + 1) + '</text>';
      });
      s += '</svg>';
    }
    return s + '</section>';
  }

  function seccionBalance() {
    const h = hoy();
    const disponible = h >= D.TEMPORADA_FIN || modoDemo;
    let s = '<section class="tarjeta"><h2>Balance final</h2>';
    if (!disponible) {
      return s + '<p class="suave">Se abre el 18 de mayo de 2027 (faltan ' + num(L.diasEntre(h, D.TEMPORADA_FIN)) + ' días). Ahí verás tu línea base contra tu última semana.</p></section>';
    }
    const lb = estado.lineaBase;
    const ult = L.promedio(L.horasDe(estado.registros, L.sumarDias(h, -6), 7));
    const bf = estado.balanceFinal;
    const fila = (t, a, b, unidad) => {
      const dif = (a != null && b != null && a > 0) ? Math.round((1 - b / a) * 100) : null;
      return '<tr><th>' + t + '</th><td>' + (a == null ? '—' : a + unidad) + '</td><td>' + (b == null ? '—' : b + unidad) + '</td><td>' + (dif == null ? '' : (dif >= 0 ? '−' + dif + '%' : '+' + (-dif) + '%')) + '</td></tr>';
    };
    s += (modoDemo ? '<p class="suave pequeno">En la demo se muestra aunque la temporada no haya terminado.</p>' : '');
    s += '<table class="balance"><thead><tr><th></th><th>Línea base</th><th>Última semana</th><th>Cambio</th></tr></thead><tbody>' +
      fila('Horas de celular al día', lb.horas, ult == null ? null : Math.round(ult * 10) / 10, ' h') +
      fila('Minutos en redes', lb.redesMin, bf.redesMin, ' min') +
      fila('Desbloqueos', lb.desbloqueos, bf.desbloqueos, '') +
      '</tbody></table>' +
      '<div class="dos-campos"><label class="campo">Minutos en redes (última semana)<input type="number" min="0" id="bf-redes" value="' + (bf.redesMin ?? '') + '"></label>' +
      '<label class="campo">Desbloqueos (última semana)<input type="number" min="0" id="bf-desb" value="' + (bf.desbloqueos ?? '') + '"></label></div>' +
      '<button class="btn" id="guardar-balance">Guardar balance</button>' +
      '<p>Total de la temporada: <b>' + num(estado.xp) + ' XP</b>, mejor racha de <b>' + L.mejorRacha(estado.registros, estado.metas) + ' días</b> y <b>' + estado.canjes.length + '</b> recompensas canjeadas.</p>';
    return s + '</section>';
  }

  /* =================== Pantalla: AJUSTES =================== */

  function vistaAjustes() {
    const lb = estado.lineaBase, g = estado.gata;
    let s = '<section class="tarjeta"><h2>Ajustes</h2>' +
      '<label class="campo">Nombre<input id="aj-nombre" type="text" maxlength="30" value="' + esc(estado.nombre) + '"></label>' +
      '<label class="campo">Fecha de inicio de la temporada<input id="aj-inicio" type="date" value="' + estado.inicio + '"></label>' +
      '<h3>Línea base (antes de empezar)</h3><div class="tres-campos">' +
      '<label class="campo">Horas al día<input id="aj-lb-horas" type="number" step="0.1" min="0" value="' + (lb.horas ?? '') + '"></label>' +
      '<label class="campo">Min. en redes<input id="aj-lb-redes" type="number" min="0" value="' + (lb.redesMin ?? '') + '"></label>' +
      '<label class="campo">Desbloqueos<input id="aj-lb-desb" type="number" min="0" value="' + (lb.desbloqueos ?? '') + '"></label></div>' +
      '<button class="btn primario" id="aj-guardar">Guardar</button></section>';

    s += '<section class="tarjeta"><h2>Cómo se ve Princesa</h2><div class="colores">' +
      '<label>Pelaje<input type="color" id="aj-pelaje" value="' + g.pelaje + '"></label>' +
      '<label>Puntas / manchas<input type="color" id="aj-manchas" value="' + g.manchas + '"></label>' +
      '<label>Pecho<input type="color" id="aj-pecho" value="' + g.pecho + '"></label>' +
      '<label>Ojos<input type="color" id="aj-ojos" value="' + g.ojos + '"></label></div>' +
      '<label class="campo">Patrón<select id="aj-patron">' +
      [['puntas', 'Siamesa (puntas oscuras)'], ['lisa', 'Lisa'], ['manchas', 'Con manchas'], ['rayas', 'Atigrada']].map(p => '<option value="' + p[0] + '"' + (g.patron === p[0] ? ' selected' : '') + '>' + p[1] + '</option>').join('') +
      '</select></label><button class="btn pequeno" id="aj-gata-reset">Volver a los colores de Princesa</button></section>';

    s += '<section class="tarjeta"><h2>Metas de celular</h2><p class="suave pequeno">Horas máximas al día por rango de fechas. Cambiarlas recalcula hoy y ayer; los días anteriores se quedan como estaban.</p><div id="metas-lista">';
    estado.metas.forEach((m, i) => { s += filaMeta(m, i); });
    s += '</div><div class="acciones"><button class="btn pequeno" id="meta-agregar">+ Agregar rango</button><button class="btn primario pequeno" id="metas-guardar">Guardar metas</button></div></section>';

    s += '<section class="tarjeta"><h2>Copia de seguridad</h2><p class="suave pequeno">Expórtala una vez por semana y guárdala en el correo o en Drive.</p><div class="acciones">' +
      '<button class="btn" id="exportar">⬇️ Exportar JSON</button><label class="btn" for="importar">⬆️ Importar JSON</label><input type="file" id="importar" accept="application/json,.json" hidden></div></section>';

    s += '<section class="tarjeta"><h2>Más</h2><div class="acciones">' +
      (modoDemo ? '<button class="btn" id="salir-demo-aj">Salir de la demostración</button>' : '<button class="btn" id="abrir-demo">Ver modo demostración</button>') +
      '<button class="btn peligro" id="reiniciar">Reiniciar partida</button></div>' +
      '<p class="suave pequeno">Princesa: temporada sin scroll · tus datos viven solo en este navegador.</p></section>';
    return s;
  }

  function filaMeta(m, i) {
    return '<div class="fila-meta" data-i="' + i + '">' +
      '<label>Desde<input type="date" class="m-desde" value="' + m.desde + '"></label>' +
      '<label>Hasta<input type="date" class="m-hasta" value="' + m.hasta + '"></label>' +
      '<label>Horas<input type="number" step="0.5" min="0" max="24" class="m-horas" value="' + m.horas + '"></label>' +
      '<label class="ancha">Nota<input type="text" class="m-nota" value="' + esc(m.nota || '') + '"></label>' +
      '<button class="btn pequeno quitar" aria-label="Quitar rango" data-quitar-meta="' + i + '">✕</button></div>';
  }

  function leerMetasDelFormulario() {
    return Array.from(document.querySelectorAll('.fila-meta')).map(f => ({
      desde: f.querySelector('.m-desde').value,
      hasta: f.querySelector('.m-hasta').value,
      horas: parseFloat(f.querySelector('.m-horas').value),
      nota: f.querySelector('.m-nota').value.trim()
    }));
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'princesa-respaldo-' + (modoDemo ? 'demo-' : '') + hoy() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Copia descargada.');
  }

  function importar(archivo) {
    const lector = new FileReader();
    lector.onload = () => {
      let datos;
      try { datos = JSON.parse(lector.result); } catch (e) { return toast('Ese archivo no es una copia válida.'); }
      if (!datos || typeof datos !== 'object' || !datos.registros || typeof datos.xp !== 'number') return toast('Ese archivo no parece una copia de Princesa.');
      confirmar('¿Importar esta copia?', 'Reemplaza la partida actual de este navegador por la del archivo (' + num(datos.xp) + ' XP, ' + Object.keys(datos.registros).length + ' días registrados).', 'Importar', () => {
        estado = Object.assign(estadoNuevo(''), datos);
        guardar(); irA('hoy'); toast('Copia importada.');
      });
    };
    lector.readAsText(archivo);
  }

  /* =================== Modo demostración =================== */

  function generarDemo() {
    const azar = L.azarConSemilla(20261118);
    const h = hoy();
    const t = ahora();
    const e = estadoNuevo('Demo');
    e.demo = true;
    e.inicio = L.sumarDias(h, -30);
    e.creado = t - 30 * 24 * L.HORA_MS;
    e.lineaBase = { horas: 8.2, redesMin: 260, desbloqueos: 130 };
    e.balanceFinal = { redesMin: 110, desbloqueos: 70 };
    // Metas de ejemplo que bajan durante el mes de la demo
    e.metas = [
      { desde: L.sumarDias(h, -30), hasta: L.sumarDias(h, -21), horas: 7, nota: '' },
      { desde: L.sumarDias(h, -20), hasta: L.sumarDias(h, -11), horas: 6, nota: '' },
      { desde: L.sumarDias(h, -10), hasta: L.sumarDias(h, 30), horas: 5, nota: '' }
    ];
    const estadoGuardado = estado; estado = e;
    for (let i = 30; i >= 1; i--) {
      const k = L.sumarDias(h, -i);
      const tendencia = 7.6 - (30 - i) * 0.09;
      let horas = Math.max(1.5, Math.round((tendencia + (azar() - 0.5) * 2.2) * 10) / 10);
      if (i <= 5) horas = Math.min(horas, L.metaPara(e.metas, k) - 0.4); // la demo termina con una racha
      const casillas = {};
      D.CASILLAS.forEach(c => { if (azar() < 0.35) casillas[c.id] = true; });
      const contadores = {
        estudio: Math.floor(azar() * 3), entregas: azar() < 0.08 ? 1 : 0,
        screenzen: Math.floor(azar() * 3), reemplazo: azar() < 0.3 ? 1 : 0, retos10: Math.floor(azar() * 2)
      };
      e.registros[k] = { horas, casillas, contadores, xp: 0, mult: 1, escudo: false, regalo: true, guardado: t };
      if (!L.xpBase(e.registros[k], L.metaPara(e.metas, k)).cumplio && L.escudoDisponible(e.registros, k) && azar() < 0.4) e.registros[k].escudo = true;
      const res = L.xpDelDia(e.registros, e.metas, k);
      e.registros[k].xp = res.xp; e.registros[k].mult = res.mult;
      sumarXP(res.xp, true);
    }
    // Semanas: misiones y preguntas del domingo
    for (let i = 35; i >= 0; i -= 7) {
      const lun = L.lunesDe(L.sumarDias(h, -i));
      const sem = asegurarSemana(lun);
      if (i > 0) {
        sem.hechas = sem.misiones.filter(() => azar() < 0.6);
        sem.hechas.forEach(id => sumarXP(D.MISIONES.find(m => m.id === id).xp, true));
        const base = 2 + (35 - i) / 14;
        sem.domingo = [0, 1, 2, 3].map(() => Math.max(1, Math.min(5, Math.round(base + (azar() - 0.5) * 2))));
      }
    }
    e.jefes[1] = L.sumarDias(h, -9); sumarXP(D.XP_JEFE, true);
    // Algunas compras de ejemplo
    ['lazo', 'raton', 'ventana', 'bufanda'].forEach(id => { const a = D.ACCESORIOS.find(x => x.id === id); e.monedas -= a.precio; e.accesorios.comprados.push(id); e.accesorios.puestos.push(id); });
    [['pelicula', 12], ['cafe', 4]].forEach(([id, d]) => { const r = D.RECOMPENSAS.find(x => x.id === id); e.monedas -= r.precio; e.canjes.push({ fecha: L.sumarDias(h, -d), id, nombre: r.nombre, precio: r.precio }); });
    e.comida = Math.round(e.comida * 0.35);
    e.pancita = { valor: 72, hora: t };
    e.ultimaComida = t;
    estado = estadoGuardado;
    return e;
  }

  function abrirDemo() {
    modoDemo = true;
    estado = generarDemo();
    guardar();
    uso.inicio = ahora(); uso.dormida = false;
    irA('hoy');
    toast('Estás viendo la demostración: nada de esto toca la partida real.');
  }

  function salirDemo() {
    modoDemo = false;
    estado = leer(CLAVE_REAL);
    try { localStorage.removeItem(CLAVE_DEMO); } catch (e) { }
    vista = 'hoy'; borrador = null;
    render();
  }

  /* =================== Eventos =================== */

  function conectar() {
    const v = $('#vista');
    v.querySelectorAll('[data-tocar]').forEach(el => el.onclick = tocarPrincesa);

    // HOY
    const horas = $('#horas');
    if (horas) {
      horas.oninput = () => {
        const val = horas.value.replace(',', '.');
        borrador.horas = val === '' || isNaN(parseFloat(val)) ? null : parseFloat(val);
        actualizarResumen();
      };
      actualizarResumen();
    }
    v.querySelectorAll('[data-dia]').forEach(b => b.onclick = () => { diaRegistro = b.dataset.dia; cargarBorrador(); render(); });
    v.querySelectorAll('[data-casilla]').forEach(b => b.onclick = () => {
      const id = b.dataset.casilla;
      borrador.casillas[id] = !borrador.casillas[id];
      b.setAttribute('aria-pressed', borrador.casillas[id]);
      b.querySelector('.check').textContent = borrador.casillas[id] ? '✓' : '';
      actualizarResumen();
    });
    const cambiarContador = (id, d, btn) => {
      const c = D.CONTADORES.find(x => x.id === id);
      let n = Number(borrador.contadores[id] || 0) + d;
      n = Math.max(0, c.max !== null ? Math.min(c.max, n) : Math.min(50, n));
      borrador.contadores[id] = n;
      btn.parentElement.querySelector('output').textContent = n;
      actualizarResumen();
    };
    v.querySelectorAll('[data-mas]').forEach(b => b.onclick = () => cambiarContador(b.dataset.mas, 1, b));
    v.querySelectorAll('[data-menos]').forEach(b => b.onclick = () => cambiarContador(b.dataset.menos, -1, b));
    const g = $('#guardar-registro'); if (g) g.onclick = guardarRegistro;
    const ue = $('#usar-escudo'); if (ue) ue.onclick = () => usarEscudo(false);
    const qe = $('#quitar-escudo'); if (qe) qe.onclick = () => usarEscudo(true);

    // PRINCESA
    v.querySelectorAll('[data-comer]').forEach(b => b.onclick = () => alimentar(b.dataset.comer));
    const j = $('#jugar'); if (j) j.onclick = jugar;
    const si = $('#siesta'); if (si) si.onclick = siesta;
    v.querySelectorAll('[data-poner]').forEach(b => b.onclick = () => {
      const id = b.dataset.poner, p = estado.accesorios.puestos;
      if (p.includes(id)) estado.accesorios.puestos = p.filter(x => x !== id);
      else ponerAccesorio(id);
      guardar(); render();
    });

    // RETOS
    v.querySelectorAll('[data-mision]').forEach(b => b.onclick = () => toggleMision(b.dataset.mision));
    v.querySelectorAll('[data-jefe]').forEach(b => b.onclick = () => {
      const mes = Number(b.dataset.jefe);
      confirmar('¿Venciste al jefe?', '«' + D.JEFES[mes - 1] + '». Sé honesta contigo: este vale ' + D.XP_JEFE + ' XP.', 'Sí, lo logré', () => {
        estado.jefes[mes] = hoy(); sumarXP(D.XP_JEFE); guardar(); render();
        modal({ arriba: confeti(), titulo: '¡Jefe vencido!', cuerpo: '<p>+' + D.XP_JEFE + ' XP. Princesa está orgullosa.</p>', botones: [{ texto: 'Seguir', clase: 'primario' }] });
      });
    });
    v.querySelectorAll('[data-jefe-deshacer]').forEach(b => b.onclick = () => {
      const mes = Number(b.dataset.jefeDeshacer);
      delete estado.jefes[mes]; sumarXP(-D.XP_JEFE); guardar(); render();
    });

    // TIENDA
    v.querySelectorAll('[data-tienda]').forEach(b => b.onclick = () => { tiendaPestana = b.dataset.tienda; render(); });
    v.querySelectorAll('[data-comprar-acc]').forEach(b => b.onclick = () => comprarAccesorio(b.dataset.comprarAcc));
    v.querySelectorAll('[data-canjear]').forEach(b => b.onclick = () => canjear(b.dataset.canjear));

    // PROGRESO
    v.querySelectorAll('[data-domingo]').forEach(b => b.onclick = () => {
      const sem = asegurarSemana(L.lunesDe(hoy()));
      if (!sem.domingo) sem.domingo = [null, null, null, null];
      sem.domingo[Number(b.dataset.domingo)] = Number(b.dataset.valor);
      guardar(); render();
      if (sem.domingo.every(x => x)) toast('Gracias por responder. Nos vemos el otro domingo.');
    });
    const gb = $('#guardar-balance');
    if (gb) gb.onclick = () => {
      const r = $('#bf-redes').value, d = $('#bf-desb').value;
      estado.balanceFinal = { redesMin: r === '' ? null : Number(r), desbloqueos: d === '' ? null : Number(d) };
      guardar(); render(); toast('Balance guardado.');
    };

    // AJUSTES
    const ag = $('#aj-guardar');
    if (ag) {
      ag.onclick = () => {
        const n = (id) => { const x = $(id).value; return x === '' ? null : Number(x); };
        estado.nombre = $('#aj-nombre').value.trim();
        if ($('#aj-inicio').value) estado.inicio = $('#aj-inicio').value;
        estado.lineaBase = { horas: n('#aj-lb-horas'), redesMin: n('#aj-lb-redes'), desbloqueos: n('#aj-lb-desb') };
        guardar(); toast('Ajustes guardados.'); render();
      };
      ['pelaje', 'manchas', 'pecho', 'ojos'].forEach(c => {
        $('#aj-' + c).oninput = (ev) => { estado.gata[c] = ev.target.value; guardar(); };
      });
      $('#aj-patron').onchange = (ev) => { estado.gata.patron = ev.target.value; guardar(); toast('Listo. Mírala en su cuarto.'); };
      $('#aj-gata-reset').onclick = () => { estado.gata = Object.assign({}, D.GATA_DEFECTO); guardar(); render(); toast('Colores de Princesa restaurados.'); };
      $('#meta-agregar').onclick = () => {
        const metas = leerMetasDelFormulario();
        const ult = metas[metas.length - 1];
        const desde = ult && ult.hasta ? L.sumarDias(ult.hasta, 1) : hoy();
        metas.push({ desde, hasta: L.sumarDias(desde, 30), horas: ult ? ult.horas : 4, nota: '' });
        $('#metas-lista').innerHTML = metas.map(filaMeta).join('');
        conectarQuitarMeta();
      };
      conectarQuitarMeta();
      $('#metas-guardar').onclick = () => {
        const metas = leerMetasDelFormulario();
        for (const m of metas) {
          if (!m.desde || !m.hasta || isNaN(m.horas) || m.horas < 0 || m.horas > 24) return toast('Revisa las metas: cada rango necesita fechas y horas entre 0 y 24.');
          if (m.hasta < m.desde) return toast('En una meta, la fecha "hasta" es antes que "desde".');
        }
        if (!metas.length) return toast('Deja al menos una meta.');
        estado.metas = metas.sort((a, b) => a.desde.localeCompare(b.desde));
        recalcularEditables();
        guardar(); render(); toast('Metas guardadas.');
      };
      $('#exportar').onclick = exportar;
      $('#importar').onchange = (ev) => { if (ev.target.files[0]) importar(ev.target.files[0]); ev.target.value = ''; };
      const ad = $('#abrir-demo'); if (ad) ad.onclick = abrirDemo;
      const sd = $('#salir-demo-aj'); if (sd) sd.onclick = salirDemo;
      $('#reiniciar').onclick = () => {
        modal({
          titulo: '¿Reiniciar la partida?',
          cuerpo: '<p>Se borra todo lo de este navegador: XP, registros, compras y accesorios. No se puede deshacer. Si quieres, exporta antes una copia.</p><label class="campo">Escribe <b>REINICIAR</b> para confirmar<input id="confirmar-reinicio" type="text" autocomplete="off"></label>',
          botones: [{ texto: 'Cancelar' }, {
            texto: 'Borrar todo', clase: 'peligro',
            antesDeCerrar: () => { if ($('#confirmar-reinicio').value.trim().toUpperCase() !== 'REINICIAR') { toast('Escribe REINICIAR para confirmar.'); return false; } },
            accion: () => {
              try { localStorage.removeItem(modoDemo ? CLAVE_DEMO : CLAVE_REAL); } catch (e) { }
              if (modoDemo) { salirDemo(); return; }
              estado = null; vista = 'hoy'; borrador = null; render();
            }
          }]
        });
      };
    }
  }

  function conectarQuitarMeta() {
    document.querySelectorAll('[data-quitar-meta]').forEach(b => b.onclick = () => {
      const metas = leerMetasDelFormulario();
      metas.splice(Number(b.dataset.quitarMeta), 1);
      $('#metas-lista').innerHTML = metas.map(filaMeta).join('');
      conectarQuitarMeta();
    });
  }

  /* =================== Arranque =================== */

  function iniciar() {
    document.querySelectorAll('.nav button').forEach(b => b.onclick = () => irA(b.dataset.vista));
    $('#btn-ajustes').onclick = () => { if (estado) irA('ajustes'); };
    $('#salir-demo').onclick = salirDemo;
    $('#modal').addEventListener('click', ev => { if (ev.target.id === 'modal') cerrarModal(); });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#modal').hidden) cerrarModal(); });

    estado = leer(CLAVE_REAL);
    if (estado) {
      // Completa campos nuevos si la partida es de una versión anterior
      estado = Object.assign(estadoNuevo(estado.nombre), estado);
    }
    try { localStorage.removeItem(CLAVE_DEMO); } catch (e) { }
    render();
    // Refresca cada minuto (la pancita baja con el tiempo), sin tocar formularios abiertos
    setInterval(() => { if (estado && vista === 'princesa' && $('#modal').hidden) render(); }, 60000);

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { });
    }
  }

  // Permite a tests.html y a la consola revisar el estado
  window.PrincesaApp = { get estado() { return estado; }, generarDemo };

  document.addEventListener('DOMContentLoaded', iniciar);
})();
