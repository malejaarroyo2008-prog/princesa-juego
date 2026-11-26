/* =========================================================
   data.js — Todas las reglas fijas del juego en un solo lugar.
   Si quieres cambiar un XP, un precio o una meta por defecto,
   este es el archivo que se edita.
   ========================================================= */
(function (root) {
  'use strict';

  const DATA = {
    TEMPORADA_INICIO: '2026-11-18',
    TEMPORADA_FIN: '2027-05-18',
    HAMBRE_POR_HORA: 4,          // puntos de pancita que baja cada hora
    HORAS_PARA_ESCONDERSE: 48,   // 2 días sin comer -> se esconde debajo de la cama
    MINUTOS_ANTI_SCROLL: 3,      // a los 3 min de uso continuo, Princesa se duerme

    // XP automáticos según las horas de celular
    XP_META: 25,           // cumplí la meta del día
    XP_DEBAJO_META: 15,    // quedé al menos 1 h por debajo de la meta

    // Casillas del registro nocturno (sí / no)
    CASILLAS: [
      { id: 'fueraCama',   texto: 'Celular fuera de la cama', xp: 10 },
      { id: 'cenaSin',     texto: 'Cené sin celular', xp: 5 },
      { id: 'dormiTiempo', texto: 'Dormí a tiempo', xp: 15 },
      { id: 'ejercicio',   texto: 'Ejercicio', xp: 20 },
      { id: 'comiBien',    texto: 'Comí bien (desayuno, almuerzo y cena)', xp: 10 },
      { id: 'organice',    texto: 'Organicé el día 30 minutos', xp: 10 },
      { id: 'cenaFamilia', texto: 'Cena en familia', xp: 5 },
      { id: 'ocio',        texto: 'Una hora de ocio sin culpa', xp: 5 },
      { id: 'primeraHora', texto: 'Primera hora del día sin redes', xp: 15 }
    ],

    // Contadores del registro nocturno (max: null = sin tope)
    CONTADORES: [
      { id: 'estudio',   texto: 'Bloques de estudio', xp: 10, max: 4 },
      { id: 'entregas',  texto: 'Trabajos entregados a tiempo', xp: 30, max: null },
      { id: 'screenzen', texto: 'Veces que desistí en la pausa de ScreenZen', xp: 3, max: 5 },
      { id: 'reemplazo', texto: 'Actividades de reemplazo de 30 min o más', xp: 20, max: 2 },
      { id: 'retos10',   texto: 'Retos de 10 minutos superados ante un impulso fuerte', xp: 5, max: null }
    ],

    // Metas de horas máximas de celular por fecha (editables en Ajustes).
    // Punto de partida real: unas 12 h al día. Se empieza en 9 h y se baja
    // poco a poco: 1 h por semana al principio y luego 1 h por mes.
    METAS: [
      { desde: '2026-11-16', hasta: '2026-11-22', horas: 9,   nota: 'Primera semana' },
      { desde: '2026-11-23', hasta: '2026-11-29', horas: 8,   nota: '' },
      { desde: '2026-11-30', hasta: '2026-12-13', horas: 7,   nota: '' },
      { desde: '2026-12-14', hasta: '2027-01-10', horas: 6,   nota: 'Vacaciones' },
      { desde: '2027-01-11', hasta: '2027-02-07', horas: 5,   nota: '' },
      { desde: '2027-02-08', hasta: '2027-03-07', horas: 4,   nota: '' },
      { desde: '2027-03-08', hasta: '2027-04-04', horas: 3.5, nota: 'Redes solo en dos franjas' },
      { desde: '2027-04-05', hasta: '2027-05-18', horas: 3,   nota: '' }
    ],
    LINEA_BASE_HORAS: 12,

    // Racha -> multiplicador (de mayor a menor)
    RACHAS: [
      { dias: 14, mult: 2 },
      { dias: 7,  mult: 1.5 },
      { dias: 3,  mult: 1.2 }
    ],

    PROB_REGALO: 1 / 6,
    XP_REGALO: 50,

    // Niveles escalados x5 respecto al prompt original (151, 401, 801…),
    // para que duren toda la temporada. Con unos 90 XP diarios se llega a:
    // nivel 2 ≈ semana 1, nivel 3 ≈ semana 3, nivel 4 ≈ semana 6,
    // nivel 5 ≈ mes 2,5, nivel 6 ≈ mes 4 y nivel 7 (Cineasta) ≈ al final.
    NIVELES: [
      { n: 1, nombre: 'Novata',     min: 0 },
      { n: 2, nombre: 'Constante',  min: 751 },
      { n: 3, nombre: 'Organizada', min: 2001 },
      { n: 4, nombre: 'Imparable',  min: 4001 },
      { n: 5, nombre: 'Jefa',       min: 7001 },
      { n: 6, nombre: 'Directora',  min: 11001 },
      { n: 7, nombre: 'Cineasta',   min: 16001 }
    ],

    COMIDAS: [
      { id: 'croquetas', nombre: 'Croquetas', costo: 10, sube: 10, emoji: '🥣' },
      { id: 'atun',      nombre: 'Atún',      costo: 25, sube: 30, emoji: '🐟' },
      { id: 'salmon',    nombre: 'Salmón',    costo: 60, sube: 80, emoji: '🍣', ronronea: true }
    ],

    // Cosas para Princesa. tipo 'ropa' sale en la pestaña Ropita.
    // "ranura": solo se puede tener puesta una cosa por ranura
    // (por ejemplo, el gorro y la corona van los dos en la cabeza).
    ACCESORIOS: [
      { id: 'lazo',     nombre: 'Lazo',                 precio: 60 },
      { id: 'collar',   nombre: 'Collar con cascabel',  precio: 90,  ranura: 'cuello' },
      { id: 'raton',    nombre: 'Ratón de juguete',     precio: 80 },
      { id: 'cama',     nombre: 'Cama acolchada',       precio: 150 },
      { id: 'rascador', nombre: 'Rascador',             precio: 200 },
      { id: 'ventana',  nombre: 'Ventana con pájaros',  precio: 300 },
      { id: 'corona',   nombre: 'Corona de gala',       precio: 500, ranura: 'cabeza' },
      // Ropita
      { id: 'bandana',  nombre: 'Pañoleta roja',        precio: 100, tipo: 'ropa', ranura: 'cuello' },
      { id: 'bufanda',  nombre: 'Bufanda de rayas',     precio: 140, tipo: 'ropa', ranura: 'cuello' },
      { id: 'gafas',    nombre: 'Gafas de sol',         precio: 180, tipo: 'ropa', ranura: 'cara' },
      { id: 'gorro',    nombre: 'Gorro navideño',       precio: 200, tipo: 'ropa', ranura: 'cabeza' },
      { id: 'buzo',     nombre: 'Buzo con corazón',     precio: 250, tipo: 'ropa', ranura: 'cuerpo' },
      { id: 'capa',     nombre: 'Capa de superheroína', precio: 350, tipo: 'ropa', ranura: 'espalda' }
    ],

    RECOMPENSAS: [
      { id: 'capitulo',  nombre: 'Capítulo extra de una serie', precio: 40 },
      { id: 'snack',     nombre: 'Snack favorito', precio: 60 },
      { id: 'pelicula',  nombre: 'Película en casa con crispetas', precio: 80 },
      { id: 'sabado',    nombre: 'Sábado sin alarma', precio: 100 },
      { id: 'cafe',      nombre: 'Café o malteada afuera', precio: 120 },
      { id: 'picnic',    nombre: 'Picnic o paseo por un parque', precio: 120 },
      { id: 'planfam',   nombre: 'Elegir el plan familiar del sábado', precio: 150 },
      { id: 'piscina',   nombre: 'Tarde de piscina', precio: 200 },
      { id: 'cine',      nombre: 'Cine', precio: 250 },
      { id: 'sinU',      nombre: 'Un día sin pendientes de la U', precio: 300 },
      { id: 'ahorro',    nombre: '$20.000 extra al ahorro del viaje', precio: 300 },
      { id: 'pequeno',   nombre: 'Algo pequeño para mí', precio: 350 },
      { id: 'comer',     nombre: 'Salir a comer', precio: 400 },
      { id: 'grande',    nombre: 'Algo grande que llevo tiempo queriendo', precio: 1000 },
      { id: 'diacine',   nombre: 'Día completo de plan de cine', precio: 2500 },
      { id: 'final',     nombre: 'Premio final de la temporada', precio: 5000 }
    ],

    MISIONES: [
      { id: 'plano',    texto: 'Filmar un plano de un minuto', xp: 60 },
      { id: 'leer',     texto: 'Leer 30 minutos cinco días', xp: 50 },
      { id: 'caminar',  texto: 'Caminar sin celular', xp: 30 },
      { id: 'tiktok',   texto: 'Un día entero sin TikTok', xp: 40 },
      { id: 'receta',   texto: 'Cocinar una receta nueva', xp: 30 },
      { id: 'llamar',   texto: 'Llamar a alguien en vez de escribirle', xp: 20 }
    ],
    MISIONES_POR_SEMANA: 3,

    XP_JEFE: 150,
    JEFES: [
      'Un domingo sin redes',
      'Una semana sin TikTok en el celular',
      '7 días seguidos sin redes en la primera hora',
      'Terminar un ejercicio audiovisual sin interrupciones del celular',
      'Una semana usando redes solo en las dos franjas',
      'Un día de uso solo intencional'
    ],

    PREGUNTAS_DOMINGO: [
      '¿Pude concentrarme 30 minutos sin pensar en el celular?',
      '¿Aguanté el aburrimiento sin angustia?',
      '¿Disfruté algo sencillo?',
      '¿Me dormí fácil?'
    ],

    // Colores de Princesa (siamesa blue point, sacados de sus fotos).
    // "manchas" es el color de las puntas: cara, orejas, patas y cola.
    GATA_DEFECTO: {
      pelaje: '#ECE5DA',
      manchas: '#878A99',
      pecho: '#F8F4EE',
      ojos: '#9FB7D6',
      patron: 'puntas'   // 'puntas' (siamesa) | 'lisa' | 'manchas' | 'rayas'
    },

    FRASES: {
      feliz:     ['¡Qué rico estar contigo!', 'Hoy me siento de maravilla.', 'Prrr… todo está bien.'],
      juguetona: ['¿Jugamos un ratico?', '¡Atrapa el ratón!', 'Tengo energía para rato.'],
      tranquila: ['Aquí estoy, tranquilita.', 'Un día normal también es bueno.', 'Me gusta este silencio.'],
      aburrida:  ['Hmm… me estoy aburriendo.', '¿Un mimo, porfa?', 'Necesito un poquito de atención.'],
      triste:    ['Tengo la pancita vacía…', 'Te extrañé.', '¿Me das algo de comer?'],
      escondida: ['(Se escondió debajo de la cama. Un platico la hace salir.)'],
      dormida:   ['Zzz… ya es hora de soltar el celular.']
    }
  };

  root.DATA = DATA;
  if (typeof module !== 'undefined') module.exports = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
