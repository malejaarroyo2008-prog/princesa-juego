/* =========================================================
   logic.js — Reglas del juego como funciones puras.
   No toca la pantalla ni el localStorage: recibe datos y
   devuelve resultados. Así se puede probar en tests.html.
   ========================================================= */
(function (root) {
  'use strict';
  const DATA = root.DATA;
  const HORA_MS = 3600 * 1000;

  /* ---------- Fechas (siempre en hora local, formato AAAA-MM-DD) ---------- */

  function aClave(fecha) {
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }

  function deClave(clave) {
    const [a, m, d] = clave.split('-').map(Number);
    return new Date(a, m - 1, d, 12, 0, 0); // mediodía: evita líos con cambios de hora
  }

  function sumarDias(clave, n) {
    const d = deClave(clave);
    d.setDate(d.getDate() + n);
    return aClave(d);
  }

  function diasEntre(a, b) { // b - a en días
    return Math.round((deClave(b) - deClave(a)) / (24 * HORA_MS));
  }

  // Lunes de la semana de una fecha (las semanas empiezan el lunes)
  function lunesDe(clave) {
    const dia = deClave(clave).getDay(); // 0 = domingo
    const atras = (dia + 6) % 7;
    return sumarDias(clave, -atras);
  }

  function esDomingo(clave) { return deClave(clave).getDay() === 0; }

  /* ---------- Metas ---------- */

  function metaPara(metas, clave) {
    if (!metas || !metas.length) return 7;
    const orden = metas.slice().sort((a, b) => a.desde.localeCompare(b.desde));
    for (const m of orden) if (clave >= m.desde && clave <= m.hasta) return Number(m.horas);
    if (clave < orden[0].desde) return Number(orden[0].horas);
    // Después de la última meta (o en un hueco): la meta anterior más cercana
    let ultima = orden[0];
    for (const m of orden) if (m.desde <= clave) ultima = m;
    return Number(ultima.horas);
  }

  function notaMetaPara(metas, clave) {
    const m = (metas || []).find(x => clave >= x.desde && clave <= x.hasta);
    return m && m.nota ? m.nota : '';
  }

  /* ---------- Niveles y etapas ---------- */

  function nivelPara(xp) {
    let nivel = DATA.NIVELES[0];
    for (const n of DATA.NIVELES) if (xp >= n.min) nivel = n;
    const sig = DATA.NIVELES.find(n => n.n === nivel.n + 1) || null;
    return { ...nivel, siguiente: sig };
  }

  function etapaPara(nivel) {
    if (nivel <= 2) return 'gatita';
    if (nivel <= 4) return 'joven';
    if (nivel <= 6) return 'adulta';
    return 'reina';
  }

  /* ---------- Pancita (hambre) ---------- */

  // La pancita se guarda como {valor, hora}; el valor real se calcula con la hora actual.
  function pancitaActual(pancita, ahora) {
    const horas = Math.max(0, (ahora - pancita.hora) / HORA_MS);
    return Math.max(0, Math.min(100, pancita.valor - DATA.HAMBRE_POR_HORA * horas));
  }

  function estaEscondida(ultimaComida, ahora) {
    return ahora - ultimaComida >= DATA.HORAS_PARA_ESCONDERSE * HORA_MS;
  }

  function animoPara(pancita, mimos) {
    if (pancita < 20) return 'triste';
    if (pancita < 45) return mimos >= 3 ? 'tranquila' : 'aburrida';
    if (pancita >= 70 && mimos >= 5) return 'juguetona';
    if (pancita >= 70) return 'feliz';
    return mimos >= 5 ? 'feliz' : 'tranquila';
  }

  /* ---------- XP de un registro ---------- */

  // Devuelve el XP base (sin racha) y si se cumplió la meta.
  function xpBase(registro, meta) {
    let base = 0;
    const horas = registro.horas;
    const hayHoras = horas !== null && horas !== undefined && horas !== '' && !isNaN(horas);
    const cumplio = hayHoras && Number(horas) <= meta;
    const debajo = hayHoras && Number(horas) <= meta - 1;
    if (cumplio) base += DATA.XP_META;
    if (debajo) base += DATA.XP_DEBAJO_META;
    const casillas = registro.casillas || {};
    for (const c of DATA.CASILLAS) if (casillas[c.id]) base += c.xp;
    const cont = registro.contadores || {};
    for (const c of DATA.CONTADORES) {
      let n = Math.max(0, Math.floor(Number(cont[c.id]) || 0));
      if (c.max !== null) n = Math.min(n, c.max);
      base += n * c.xp;
    }
    return { base, cumplio, debajo, hayHoras };
  }

  // Estado de un día para la racha: 'cumplio' | 'escudo' | 'fallo' | 'vacio'
  function estadoDia(registros, metas, clave) {
    const r = registros[clave];
    if (!r) return 'vacio';
    const { cumplio } = xpBase(r, metaPara(metas, clave));
    if (cumplio) return 'cumplio';
    if (r.escudo) return 'escudo';
    return 'fallo';
  }

  // Racha que termina en "clave" (incluida). El escudo mantiene la racha pero no suma.
  function rachaEn(registros, metas, clave) {
    let racha = 0;
    let d = clave;
    for (let i = 0; i < 400; i++) {
      const e = estadoDia(registros, metas, d);
      if (e === 'cumplio') racha++;
      else if (e === 'escudo') { /* protegido: sigue sin sumar */ }
      else break;
      d = sumarDias(d, -1);
    }
    return racha;
  }

  // Racha visible hoy: si hoy aún no cuenta, se mira hasta ayer.
  function rachaActual(registros, metas, hoy) {
    const e = estadoDia(registros, metas, hoy);
    if (e === 'cumplio' || e === 'escudo') return rachaEn(registros, metas, hoy);
    return rachaEn(registros, metas, sumarDias(hoy, -1));
  }

  function mejorRacha(registros, metas) {
    const claves = Object.keys(registros).sort();
    let mejor = 0;
    for (const c of claves) mejor = Math.max(mejor, rachaEn(registros, metas, c));
    return mejor;
  }

  function multiplicadorPara(racha) {
    for (const r of DATA.RACHAS) if (racha >= r.dias) return r.mult;
    return 1;
  }

  // XP final del día: base × multiplicador (solo si se cumplió la meta ese día).
  function xpDelDia(registros, metas, clave) {
    const r = registros[clave];
    if (!r) return { xp: 0, base: 0, mult: 1, cumplio: false, racha: 0 };
    const meta = metaPara(metas, clave);
    const b = xpBase(r, meta);
    const racha = b.cumplio ? rachaEn(registros, metas, clave) : 0;
    const mult = b.cumplio ? multiplicadorPara(racha) : 1;
    return { xp: Math.round(b.base * mult), base: b.base, mult, cumplio: b.cumplio, racha, meta };
  }

  /* ---------- Escudo semanal ---------- */

  // ¿Se puede usar escudo para el día "clave"? 1 por semana (de lunes a domingo).
  function escudoDisponible(registros, clave) {
    const lunes = lunesDe(clave);
    for (let i = 0; i < 7; i++) {
      const d = sumarDias(lunes, i);
      if (d !== clave && registros[d] && registros[d].escudo) return false;
    }
    return true;
  }

  /* ---------- Azar con semilla (para misiones de la semana) ---------- */

  function hashTexto(t) {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function azarConSemilla(semilla) {
    let s = semilla >>> 0;
    return function () { // mulberry32
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function misionesDeSemana(lunes, extraSemilla) {
    const azar = azarConSemilla(hashTexto('princesa-' + lunes + (extraSemilla || '')));
    const ids = DATA.MISIONES.map(m => m.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids.slice(0, DATA.MISIONES_POR_SEMANA);
  }

  /* ---------- Mes de la temporada (para el jefe) ---------- */

  function mesDeTemporada(inicio, clave) {
    const a = deClave(inicio), b = deClave(clave);
    let meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) meses--;
    return Math.max(1, Math.min(6, meses + 1));
  }

  /* ---------- Promedios ---------- */

  function promedio(nums) {
    const v = nums.filter(n => typeof n === 'number' && !isNaN(n));
    return v.length ? v.reduce((s, n) => s + n, 0) / v.length : null;
  }

  function horasDe(registros, desde, dias) {
    const out = [];
    for (let i = 0; i < dias; i++) {
      const c = sumarDias(desde, i);
      const r = registros[c];
      if (r && r.horas !== null && r.horas !== undefined && r.horas !== '') out.push(Number(r.horas));
    }
    return out;
  }

  const L = {
    aClave, deClave, sumarDias, diasEntre, lunesDe, esDomingo,
    metaPara, notaMetaPara, nivelPara, etapaPara,
    pancitaActual, estaEscondida, animoPara,
    xpBase, estadoDia, rachaEn, rachaActual, mejorRacha, multiplicadorPara, xpDelDia,
    escudoDisponible, hashTexto, azarConSemilla, misionesDeSemana, mesDeTemporada,
    promedio, horasDe, HORA_MS
  };
  root.L = L;
  if (typeof module !== 'undefined') module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
