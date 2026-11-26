/* =========================================================
   princesa.js — Dibujo de Princesa en SVG.
   Devuelve el SVG como texto. Los colores salen de variables
   CSS (--pelaje, --manchas, --pecho, --ojos) para poder
   cambiarlos desde Ajustes sin redibujar nada a mano.
   Las animaciones viven en css/styles.css (sección PRINCESA).
   ========================================================= */
(function (root) {
  'use strict';

  const ETAPAS = {
    gatita: { cuerpo: 0.72, cabeza: 1.18 },
    joven:  { cuerpo: 0.86, cabeza: 1.06 },
    adulta: { cuerpo: 1,    cabeza: 1 },
    reina:  { cuerpo: 1,    cabeza: 1 }
  };

  /* ---------- Cuarto (fondo y muebles) ---------- */
  function cuarto(acc, pose) {
    let s = '';
    s += '<rect x="0" y="0" width="320" height="182" fill="var(--pared)"/>';
    s += '<rect x="0" y="180" width="320" height="70" fill="var(--piso)"/>';
    s += '<path d="M0 200 H320 M0 225 H320" stroke="var(--piso-linea)" stroke-width="2"/>';
    if (acc.ventana) {
      s += '<g class="ventana">' +
        '<rect x="205" y="28" width="90" height="74" rx="6" fill="#BFE3F5" stroke="var(--linea)" stroke-width="3"/>' +
        '<circle cx="275" cy="46" r="9" fill="#FFD66B"/>' +
        '<path d="M212 92 Q232 70 252 92 Q270 76 290 92 V98 H212Z" fill="#9CCB86"/>' +
        '<g class="pajaro p1"><path d="M222 50 q5 -5 10 0 q5 -5 10 0" stroke="#3d2c2e" stroke-width="2" fill="none"/></g>' +
        '<g class="pajaro p2"><path d="M245 64 q4 -4 8 0 q4 -4 8 0" stroke="#3d2c2e" stroke-width="2" fill="none"/></g>' +
        '<path d="M250 28 V102 M205 65 H295" stroke="var(--linea)" stroke-width="3"/>' +
        '<rect x="199" y="100" width="102" height="8" rx="3" fill="#C9A27E" stroke="var(--linea)" stroke-width="2"/>' +
        '</g>';
    }
    if (acc.rascador) {
      s += '<g class="rascador">' +
        '<rect x="14" y="214" width="56" height="12" rx="4" fill="#B98A62" stroke="var(--linea)" stroke-width="2.5"/>' +
        '<rect x="32" y="120" width="20" height="96" fill="#E8D3A9" stroke="var(--linea)" stroke-width="2.5"/>' +
        '<path d="M32 134 H52 M32 148 H52 M32 162 H52 M32 176 H52 M32 190 H52 M32 204 H52" stroke="#C7AE80" stroke-width="2"/>' +
        '<rect x="16" y="110" width="52" height="12" rx="4" fill="#B98A62" stroke="var(--linea)" stroke-width="2.5"/>' +
        '<path d="M60 122 v18" stroke="#E86A92" stroke-width="2"/><circle cx="60" cy="143" r="5" fill="#E86A92"/>' +
        '</g>';
    }
    if (acc.cama && pose !== 'escondida') {
      s += '<g class="cama-acolchada">' +
        '<ellipse cx="160" cy="222" rx="86" ry="18" fill="#9D8BD1" stroke="var(--linea)" stroke-width="2.5"/>' +
        '<ellipse cx="160" cy="218" rx="70" ry="11" fill="#C3B6EE"/>' +
        '</g>';
    }
    return s;
  }

  function raton() {
    return '<g class="raton">' +
      '<path d="M286 226 q14 6 22 -4" stroke="#8b8b8b" stroke-width="2" fill="none"/>' +
      '<ellipse cx="270" cy="222" rx="17" ry="10" fill="#B5B5B5" stroke="var(--linea)" stroke-width="2"/>' +
      '<circle cx="258" cy="212" r="6" fill="#D9A3A3" stroke="var(--linea)" stroke-width="2"/>' +
      '<circle cx="257" cy="221" r="1.8" fill="#3d2c2e"/>' +
      '</g>';
  }

  /* ---------- Princesa sentada (pose principal) ---------- */
  function sentada(id, colores, etapa, acc) {
    const e = ETAPAS[etapa] || ETAPAS.adulta;
    const patron = colores.patron || 'puntas';
    const puntas = patron === 'puntas';
    const colorPata = puntas ? 'var(--manchas)' : 'var(--pecho)';
    const cuerpoD = 'M88 198 C 72 165 82 118 120 114 C 158 118 168 165 152 198 Z';
    const cabezaE = '<ellipse cx="120" cy="82" rx="48" ry="40"/>';

    let s = '<defs>' +
      '<clipPath id="' + id + '-cuerpo"><path d="' + cuerpoD + '"/></clipPath>' +
      '<clipPath id="' + id + '-cabeza">' + cabezaE + '</clipPath>' +
      // Máscara de siamesa: gris oscuro en la nariz que se difumina hacia afuera
      '<radialGradient id="' + id + '-mascara" cx="50%" cy="62%" r="50%">' +
      '<stop offset="0%" stop-color="var(--manchas)" stop-opacity="1"/>' +
      '<stop offset="55%" stop-color="var(--manchas)" stop-opacity=".75"/>' +
      '<stop offset="100%" stop-color="var(--manchas)" stop-opacity="0"/></radialGradient>' +
      '</defs>';

    s += '<g transform="translate(160 222) scale(' + e.cuerpo + ') translate(-120 -200)">';
    s += '<g class="gata">';

    // Cola (detrás del cuerpo): doble trazo para tener contorno
    s += '<g class="cola">' +
      '<path d="M146 192 C 200 192 206 140 182 110" stroke="var(--linea)" stroke-width="17" fill="none" stroke-linecap="round"/>' +
      '<path d="M146 192 C 200 192 206 140 182 110" stroke="' + (puntas ? 'var(--manchas)' : 'var(--pelaje)') + '" stroke-width="11" fill="none" stroke-linecap="round"/>' +
      (patron === 'manchas' || patron === 'rayas' ?'<path d="M188 120 C 194 132 196 140 194 150" stroke="var(--manchas)" stroke-width="11" fill="none" stroke-linecap="round" stroke-dasharray="' + (patron === 'rayas' ? '5 7' : '40 100') + '"/>' : '') +
      '</g>';

    // Capa (detrás del cuerpo, se asoma por los lados)
    if (acc.capa) {
      s += '<g class="ropa capa"><path d="M92 120 Q120 112 148 120 L176 198 Q120 210 64 198 Z" fill="#7B4FB0" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M150 130 L170 192" stroke="#9E77CF" stroke-width="3" fill="none"/></g>';
    }

    // Cuerpo que respira
    s += '<g class="cuerpo">';
    s += '<path d="' + cuerpoD + '" fill="var(--pelaje)"/>';
    s += '<g clip-path="url(#' + id + '-cuerpo)">';
    s += '<path d="M104 198 C 98 170 106 142 120 140 C 134 142 142 170 136 198 Z" fill="var(--pecho)"/>';
    if (patron === 'manchas') {
      s += '<path d="M80 200 C 76 172 84 148 102 140 C 108 162 104 186 110 200 Z" fill="var(--manchas)"/>';
      s += '<path d="M140 122 C 158 128 166 150 164 170 C 150 164 140 146 140 122 Z" fill="var(--manchas)"/>';
    } else if (patron === 'rayas') {
      s += '<path d="M82 150 Q94 154 100 146 M80 166 Q92 170 99 162 M82 182 Q93 186 100 178 M158 150 Q146 154 140 146 M160 166 Q148 170 141 162 M158 182 Q147 186 140 178" stroke="var(--manchas)" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
    s += '</g>';
    // Buzo: va dentro del cuerpo para que respire con ella
    if (acc.buzo) {
      s += '<g class="ropa buzo" clip-path="url(#' + id + '-cuerpo)">' +
        '<rect x="70" y="122" width="100" height="62" fill="#E07A9A"/>' +
        '<path d="M70 178 H170" stroke="#C45C7E" stroke-width="7"/>' +
        '<path d="M70 129 H170" stroke="#C45C7E" stroke-width="5"/>' +
        '<path d="M120 166 C 104 154 106 142 114 142 C 118 142 120 146 120 148 C 120 146 122 142 126 142 C 134 142 136 154 120 166 Z" fill="#FFF4F7"/>' +
        '</g>';
    }
    s += '<path d="' + cuerpoD + '" fill="none" stroke="var(--linea)" stroke-width="3" stroke-linejoin="round"/>';
    s += '</g>';

    // Patas delanteras
    s += '<g class="patas">' +
      '<ellipse cx="107" cy="198" rx="13" ry="7.5" fill="' + colorPata + '" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<ellipse class="pata-der" cx="133" cy="198" rx="13" ry="7.5" fill="' + colorPata + '" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<path d="M103 196 v4 M111 196 v4 M129 196 v4 M137 196 v4" stroke="var(--linea)" stroke-width="1.5" class="dedos"/>' +
      '</g>';
    // Pata levantada (solo al jugar)
    s += '<g class="pata-arriba"><ellipse cx="148" cy="150" rx="10" ry="13" fill="' + colorPata + '"stroke="var(--linea)" stroke-width="2.5"/></g>';

    // Collar
    if (acc.collar) {
      s += '<g class="collar"><path d="M94 120 Q120 134 146 120" stroke="#D9534F" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="120" cy="131" r="6" fill="#F2C14E" stroke="var(--linea)" stroke-width="2"/><path d="M117 133 h6" stroke="var(--linea)" stroke-width="1.5"/></g>';
    }
    // Ropita del cuello
    if (acc.bandana) {
      s += '<g class="ropa bandana"><path d="M92 118 Q120 130 148 118 L122 152 Q120 155 118 152 Z" fill="#D9534F" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<circle cx="110" cy="128" r="2.2" fill="#fff"/><circle cx="130" cy="128" r="2.2" fill="#fff"/><circle cx="120" cy="138" r="2.2" fill="#fff"/><circle cx="116" cy="146" r="1.8" fill="#fff"/><circle cx="125" cy="146" r="1.8" fill="#fff"/></g>';
    }
    if (acc.bufanda) {
      s += '<g class="ropa bufanda">' +
        '<path d="M130 124 L134 170 L148 168 L142 122 Z" fill="#F2C14E" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M133 140 L145 139 M134 154 L146 153" stroke="#4FA3A5" stroke-width="5"/>' +
        '<path d="M88 116 Q120 132 152 116 L154 128 Q120 146 86 128 Z" fill="#F2C14E" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M100 123 L102 135 M116 127 L117 139 M132 126 L132 138" stroke="#4FA3A5" stroke-width="5"/></g>';
    }

    // Cabeza (con su propia escala según la etapa)
    s += '<g transform="translate(120 104) scale(' + e.cabeza + ') translate(-120 -104)">';
    s += '<g class="cabeza">';
    // Orejas
    // Orejas (grandes, como las de Princesa)
    const orejaIzqFill = (patron === 'manchas' || puntas) ? 'var(--manchas)' : 'var(--pelaje)';
    const orejaDerFill = puntas ? 'var(--manchas)' : 'var(--pelaje)';
    const orejaDentro = puntas ? '#B7A3AC' : '#F2A7B5';
    s += '<g class="oreja oreja-izq"><path d="M76 74 L 78 18 L 114 48 Z" fill="' + orejaIzqFill + '" stroke="var(--linea)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M85 63 L 86 32 L 106 50 Z" fill="' + orejaDentro + '"/></g>';
    s += '<g class="oreja oreja-der"><path d="M164 74 L 162 18 L 126 48 Z" fill="' + orejaDerFill + '" stroke="var(--linea)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M155 63 L 154 32 L 134 50 Z" fill="' + orejaDentro + '"/></g>';
    // Cara
    s += '<ellipse cx="120" cy="82" rx="48" ry="40" fill="var(--pelaje)"/>';
    s += '<g clip-path="url(#' + id + '-cabeza)">';
    if (patron === 'manchas') {
      s += '<path d="M66 84 C 66 56 88 40 114 42 C 110 60 102 72 84 96 Z" fill="var(--manchas)"/>';
    } else if (patron === 'rayas') {
      s += '<path d="M110 44 L113 60 M120 42 L120 60 M130 44 L127 60 M72 80 L86 84 M72 92 L86 92 M168 80 L154 84 M168 92 L154 92" stroke="var(--manchas)" stroke-width="4.5" stroke-linecap="round"/>';
    }
    if (puntas) {
      // Máscara gris azulada alrededor de ojos y nariz
      s += '<ellipse cx="120" cy="92" rx="40" ry="34" fill="url(#' + id + '-mascara)"/>';
    } else {
      s += '<ellipse cx="120" cy="104" rx="20" ry="14" fill="var(--pecho)"/>';
    }
    s += '</g>';
    s += '<ellipse cx="120" cy="82" rx="48" ry="40" fill="none" stroke="var(--linea)" stroke-width="3"/>';
    // Cachetes
    s += '<circle cx="88" cy="100" r="6" fill="#F4A6A6" opacity=".55"/><circle cx="152" cy="100" r="6" fill="#F4A6A6" opacity=".55"/>';
    // Ojos: abiertos, felices (^ ^) y cerrados. El CSS muestra el que toque.
    s += '<g class="ojos-abiertos">';
    [100, 140].forEach(x => {
      s += '<g class="ojo"><ellipse cx="' + x + '" cy="82" rx="10" ry="12" fill="var(--ojos)" stroke="var(--linea)" stroke-width="2"/>' +
        '<ellipse class="pupila" cx="' + x + '" cy="83" rx="4" ry="9" fill="#2b1d1a"/>' +
        '<circle cx="' + (x + 3) + '" cy="77" r="3" fill="#fff"/></g>';
    });
    s += '</g>';
    s += '<g class="parpados"><path d="M89 81 A 11 12 0 0 1 111 81 Z M129 81 A 11 12 0 0 1 151 81 Z" fill="var(--pelaje)" stroke="var(--linea)" stroke-width="2"/></g>';
    s += '<g class="ojos-felices"><path d="M90 86 Q100 73 110 86 M130 86 Q140 73 150 86" stroke="var(--linea)" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>';
    s += '<g class="ojos-cerrados"><path d="M90 82 Q100 91 110 82 M130 82 Q140 91 150 82" stroke="var(--linea)" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>';
    // Nariz, bocas y bigotes
    s += '<path d="M114 96 L126 96 L120 103 Z" fill="' + (puntas ? '#5C5E6B' : '#E88A9A') + '"stroke="var(--linea)" stroke-width="1.5" stroke-linejoin="round"/>';
    s += '<path class="boca boca-sonrisa" d="M120 103 Q120 110 112 109 M120 103 Q120 110 128 109" stroke="var(--linea)" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    s += '<path class="boca boca-triste" d="M112 112 Q120 105 128 112" stroke="var(--linea)" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    s += '<path class="boca boca-plana" d="M113 109 L127 109" stroke="var(--linea)" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    s += '<ellipse class="boca boca-abierta" cx="120" cy="109" rx="5" ry="4.5" fill="#9B4A52" stroke="var(--linea)" stroke-width="1.5"/>';
    s += '<path d="M102 100 L68 94 M102 105 L68 107 M138 100 L172 94 M138 105 L172 107" stroke="var(--linea)" stroke-width="1.4" opacity=".7"/>';
    // Gafas de sol
    if (acc.gafas) {
      s += '<g class="ropa gafas"><rect x="86" y="72" width="28" height="21" rx="9" fill="#2B2B33" stroke="var(--linea)" stroke-width="2"/>' +
        '<rect x="126" y="72" width="28" height="21" rx="9" fill="#2B2B33" stroke="var(--linea)" stroke-width="2"/>' +
        '<path d="M114 80 Q120 76 126 80 M86 78 L74 74 M154 78 L166 74" stroke="var(--linea)" stroke-width="2.5" fill="none"/>' +
        '<path d="M92 77 l6 0 M132 77 l6 0" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></g>';
    }
    // Accesorios de la cabeza (el gorro tapa el lazo)
    if (acc.lazo && !acc.gorro) {
      s += '<g class="lazo"><path d="M146 42 L132 32 L134 52 Z M146 42 L160 30 L160 52 Z" fill="#E86A92" stroke="var(--linea)" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="146" cy="42" r="5" fill="#C94A74" stroke="var(--linea)" stroke-width="2"/></g>';
    }
    if (acc.corona) {
      s += '<g class="corona"><path d="M98 46 L102 22 L111 36 L120 16 L129 36 L138 22 L142 46 Z" fill="#F2C14E" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<circle cx="120" cy="34" r="3.5" fill="#E86A92"/><circle cx="106" cy="38" r="2.5" fill="#6FA8DC"/><circle cx="134" cy="38" r="2.5" fill="#6FA8DC"/></g>';
    }
    if (acc.gorro) {
      s += '<g class="ropa gorro"><path d="M82 50 Q 104 2 158 14 Q 146 30 158 50 Z" fill="#D63B3B" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<circle cx="160" cy="15" r="9" fill="#FFFFFF" stroke="var(--linea)" stroke-width="2"/>' +
        '<path d="M76 46 Q120 30 164 46 L164 58 Q120 42 76 58 Z" fill="#FFFFFF" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/></g>';
    }
    s += '</g></g>'; // fin cabeza

    // Plato de comida (solo al comer) y ovillo (solo al jugar)
    s += '<g class="plato"><path d="M92 200 L148 200 L141 214 L99 214 Z" fill="#6FA8DC" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M100 200 q6 -8 12 0 q6 -8 12 0 q6 -8 12 0" fill="#C98B5B" stroke="var(--linea)" stroke-width="1.5"/></g>';
    s += '<g class="ovillo"><circle cx="196" cy="190" r="12" fill="#E86A92" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<path d="M186 186 q10 -6 20 4 M188 196 q8 -10 18 -2" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/></g>';

    s += '</g></g>';
    s += '<text class="prrr" x="215" y="70">prrr…</text>';
    return s;
  }

  /* ---------- Princesa dormida, acurrucada ---------- */
  function durmiendo(id, colores, etapa, acc) {
    const e = ETAPAS[etapa] || ETAPAS.adulta;
    const puntas = colores.patron === 'puntas';
    const manchas = colores.patron === 'manchas';
    const colorCola = puntas ? 'var(--manchas)' : 'var(--pelaje)';
    let s = '<defs><radialGradient id="' + id + '-mascara-d" cx="50%" cy="60%" r="50%">' +
      '<stop offset="0%" stop-color="var(--manchas)"/><stop offset="55%" stop-color="var(--manchas)" stop-opacity=".7"/>' +
      '<stop offset="100%" stop-color="var(--manchas)" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id + '-cab-d"><ellipse cx="88" cy="170" rx="34" ry="28"/></clipPath></defs>';
    s += '<g transform="translate(160 222) scale(' + e.cuerpo + ') translate(-120 -200)"><g class="gata dormida">';
    s += '<g class="cuerpo">';
    s += '<ellipse cx="128" cy="176" rx="64" ry="27" fill="var(--pelaje)" stroke="var(--linea)" stroke-width="3"/>';
    if (manchas) s += '<path d="M150 152 C 172 154 188 166 190 178 C 172 176 158 168 150 152 Z" fill="var(--manchas)"/>';
    if (colores.patron === 'rayas') s += '<path d="M130 152 q4 10 0 18 M146 152 q4 10 0 18 M162 156 q4 10 0 16" stroke="var(--manchas)" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    s += '<path d="M66 190 C 70 214 186 214 192 186" stroke="var(--linea)" stroke-width="15" fill="none" stroke-linecap="round"/>';
    s += '<path d="M66 190 C 70 214 186 214 192 186" stroke="' + colorCola + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    if (puntas) s += '<ellipse cx="112" cy="196" rx="11" ry="7" fill="var(--manchas)" stroke="var(--linea)" stroke-width="2.5"/>';
    s += '</g>';
    // Cabeza apoyada
    const orejas = (manchas || puntas) ? 'var(--manchas)' : 'var(--pelaje)';
    s += '<path d="M60 160 L 58 126 L 84 146 Z" fill="' + orejas + '" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<path d="M100 146 L 116 120 L 118 152 Z" fill="' + (puntas ? 'var(--manchas)' : 'var(--pelaje)') + '" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<ellipse cx="88" cy="170" rx="34" ry="28" fill="var(--pelaje)"/>';
    if (puntas) s += '<g clip-path="url(#' + id + '-cab-d)"><ellipse cx="90" cy="174" rx="28" ry="24" fill="url(#' + id + '-mascara-d)"/></g>';
    else s += '<ellipse cx="90" cy="182" rx="14" ry="9" fill="var(--pecho)"/>';
    s += '<ellipse cx="88" cy="170" rx="34" ry="28" fill="none" stroke="var(--linea)" stroke-width="3"/>';
    s += '<path d="M72 168 Q78 174 84 168 M94 168 Q100 174 106 168" stroke="var(--linea)" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += '<path d="M86 177 L94 177 L90 181 Z" fill="' + (puntas ? '#4E505C' : '#E88A9A') + '"/>';
    if (acc.corona) s += '<path d="M76 146 L78 130 L84 140 L90 126 L96 140 L102 130 L104 146 Z" fill="#F2C14E" stroke="var(--linea)" stroke-width="2" transform="rotate(-12 90 140)"/>';
    s += '</g></g>';
    s += '<g class="zzz"><text x="200" y="120">z</text><text x="216" y="100">z</text><text x="234" y="78">Z</text></g>';
    return s;
  }

  /* ---------- Princesa panza arriba (su gesto típico) ---------- */
  function panzaArriba(id, colores, etapa, acc) {
    const e = ETAPAS[etapa] || ETAPAS.adulta;
    const puntas = colores.patron === 'puntas';
    const p = puntas ? 'var(--manchas)' : 'var(--pecho)';
    let s = '<defs><radialGradient id="' + id + '-mascara-p" cx="55%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="var(--manchas)"/><stop offset="55%" stop-color="var(--manchas)" stop-opacity=".7"/>' +
      '<stop offset="100%" stop-color="var(--manchas)" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id + '-cab-p"><ellipse cx="66" cy="182" rx="31" ry="27"/></clipPath></defs>';
    s += '<g transform="translate(160 222) scale(' + e.cuerpo + ') translate(-120 -200)"><g class="gata panza">';
    // Cola estirada
    s += '<path d="M182 190 C 205 196 222 192 236 182" stroke="var(--linea)" stroke-width="15" fill="none" stroke-linecap="round"/>';
    s += '<path d="M182 190 C 205 196 222 192 236 182" stroke="' + (puntas ? 'var(--manchas)' : 'var(--pelaje)') + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
    // Patas de atrás arriba
    s += '<path d="M168 168 L 184 136" stroke="var(--linea)" stroke-width="20" stroke-linecap="round"/><path d="M168 168 L 184 136" stroke="var(--pelaje)" stroke-width="14" stroke-linecap="round"/>';
    s += '<ellipse cx="186" cy="132" rx="10" ry="8" fill="' + p + '" stroke="var(--linea)" stroke-width="2.5"/>';
    s += '<g class="cuerpo">';
    s += '<ellipse cx="128" cy="180" rx="60" ry="28" fill="var(--pelaje)" stroke="var(--linea)" stroke-width="3"/>';
    s += '<ellipse cx="132" cy="172" rx="40" ry="15" fill="var(--pecho)"/>';
    s += '</g>';
    // Patitas de adelante dobladas hacia arriba (como en sus fotos)
    s += '<path d="M96 166 L 98 140 M114 164 L 120 138" stroke="var(--linea)" stroke-width="18" stroke-linecap="round"/>';
    s += '<path d="M96 166 L 98 140 M114 164 L 120 138" stroke="var(--pelaje)" stroke-width="12" stroke-linecap="round"/>';
    s += '<ellipse class="patita" cx="98" cy="136" rx="9" ry="8" fill="' + p + '" stroke="var(--linea)" stroke-width="2.5"/>';
    s += '<ellipse class="patita p2" cx="121" cy="134" rx="9" ry="8" fill="' + p + '" stroke="var(--linea)" stroke-width="2.5"/>';
    // Cabeza de lado, con las orejas hacia abajo
    const orejas = puntas || colores.patron === 'manchas' ? 'var(--manchas)' : 'var(--pelaje)';
    s += '<path d="M42 196 L 22 214 L 54 210 Z M40 166 L 14 156 L 34 186 Z" fill="' + orejas + '" stroke="var(--linea)" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<ellipse cx="66" cy="182" rx="31" ry="27" fill="var(--pelaje)"/>';
    if (puntas) s += '<g clip-path="url(#' + id + '-cab-p)"><ellipse cx="72" cy="182" rx="26" ry="23" fill="url(#' + id + '-mascara-p)"/></g>';
    s += '<ellipse cx="66" cy="182" rx="31" ry="27" fill="none" stroke="var(--linea)" stroke-width="3"/>';
    s += '<path d="M60 168 Q66 172 72 168 M60 192 Q66 196 72 192" stroke="var(--linea)" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += '<path d="M84 177 L84 187 L89 182 Z" fill="' + (puntas ? '#4E505C' : '#E88A9A') + '"/>';
    if (acc.collar) s += '<path d="M96 168 Q100 182 96 196" stroke="#D9534F" stroke-width="6" fill="none" stroke-linecap="round"/>';
    s += '</g></g>';
    s += '<g class="zzz"><text x="200" y="110">z</text><text x="216" y="90">z</text><text x="234" y="68">Z</text></g>';
    return s;
  }

  /* ---------- Princesa escondida debajo de la cama ---------- */
  function escondida(colores) {
    return '<g class="cama-grande">' +
      '<rect x="40" y="104" width="12" height="118" rx="3" fill="#A97C5A" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<rect x="268" y="120" width="12" height="102" rx="3" fill="#A97C5A" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<rect x="46" y="190" width="228" height="32" fill="#2f2326"/>' +
      '<rect x="44" y="140" width="232" height="30" rx="6" fill="#F4F0E8" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<path d="M44 150 H276 V192 Q240 200 200 192 Q160 200 120 192 Q80 200 44 192 Z" fill="#8FB8DE" stroke="var(--linea)" stroke-width="2.5"/>' +
      '<rect x="60" y="126" width="56" height="20" rx="8" fill="#fff" stroke="var(--linea)" stroke-width="2.5"/>' +
      '</g>' +
      '<g class="ojitos"><ellipse cx="150" cy="208" rx="5" ry="4" fill="var(--ojos)"/><ellipse cx="170" cy="208" rx="5" ry="4" fill="var(--ojos)"/></g>' +
      '<path class="colita" d="M250 222 q14 -2 18 -14" stroke="' + (colores.patron === 'puntas' ? 'var(--manchas)' : 'var(--pelaje)') + '"stroke-width="7" fill="none" stroke-linecap="round"/>';
  }

  /* ---------- Función principal ---------- */
  let contador = 0;
  function svgPrincesa(o) {
    const id = 'pz' + (++contador);
    const col = Object.assign({}, root.DATA.GATA_DEFECTO, o.colores || {});
    const acc = {};
    (o.accesorios || []).forEach(a => { acc[a] = true; });
    if (o.etapa === 'reina' && !acc.gorro) acc.corona = true; // de reina siempre lleva corona, salvo con gorro
    const pose = o.pose || 'sentada';

    const estilo = '--pelaje:' + col.pelaje + ';--manchas:' + col.manchas + ';--pecho:' + col.pecho + ';--ojos:' + col.ojos;
    let s = '<svg class="princesa pose-' + pose + ' animo-' + (o.animo || 'tranquila') + ' etapa-' + (o.etapa || 'adulta') +
      '" viewBox="0 0 320 250" style="' + estilo + '" role="img" aria-label="Princesa, ' + (o.animo || '') + '">';
    s += cuarto(acc, pose);
    if (pose === 'escondida') s += escondida(col);
    else {
      if (acc.raton) s += raton();
      if (pose === 'durmiendo') s += durmiendo(id, col, o.etapa, acc);
      else if (pose === 'panza') s += panzaArriba(id, col, o.etapa, acc);
      else s += sentada(id, col, o.etapa, acc);
    }
    s += '</svg>';
    return s;
  }

  root.svgPrincesa = svgPrincesa;
})(typeof window !== 'undefined' ? window : globalThis);
