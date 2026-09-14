/* ═══════════════════════════════════════════════════════════════════════
   EL MAR — fondo vivo de sweetsweetsea
   ───────────────────────────────────────────────────────────────────────
   Pinta el mismo mar de tiras 2.5D del juego: cielo, estrellas, luna,
   varias hileras de olas y bestias que emergen entre ellas.

   Los colores NO son inventados: son los de la tabla GM.MAREAS del juego
   (campo "agua": [hondo, horizonte]), pasados de 0-1 a 0-255. Cuando el
   mar cambia de marea aquí, cambia con el color con el que cambiaría allá.

   Expone window.Mar = { mareaActual(), alCambiarMarea(fn), MAREAS }.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── La tabla de mareas ────────────────────────────────────────────────
  // hondo/horiz en 0-255. "nota" es la frase corta del rótulo del héroe;
  // "regla" es la línea de números que el juego enseña en el Calendario.
  var MAREAS = [
    {
      id: 'calma',
      tira: 'calma',
      es: 'Mar en calma',            en: 'Calm sea',
      hondo: [41, 97, 133],          horiz: [77, 133, 163],
      notaEs: 'Nada anuncia nada. Aprovecha.',
      notaEn: 'Nothing foretells anything. Make the most of it.',
      reglaEs: 'El mar de todos los días: pesca corriente, bestias corrientes, cielo que sí se deja leer.',
      reglaEn: 'The everyday sea: ordinary fishing, ordinary beasts, a sky you can actually read.'
    },
    {
      id: 'dorada',
      tira: 'dorada',
      es: 'Marea Dorada',            en: 'Golden Tide',
      hondo: [115, 82, 20],          horiz: [173, 133, 41],
      notaEs: 'Hay monedas girando en la espuma… y el oro llama.',
      notaEn: 'There are coins spinning in the foam… and gold calls.',
      reglaEs: 'Botín ×3, la pesca vale ×1,5 y hay monedas en la espuma — pero el oro LLAMA: al caer la tarde, bestias ×1,6.',
      reglaEn: 'Loot ×3, catches worth ×1.5 and coins in the foam — but gold CALLS: come evening, beasts ×1.6.'
    },
    {
      id: 'prismatica',
      tira: 'calma', iris: true,
      es: 'Marea Prismática',        en: 'Prismatic Tide',
      hondo: null,                   horiz: null,   // los cicla: ver colorIris()
      notaEs: 'El mar no tiene color hoy: los tiene todos.',
      notaEn: 'The sea has no colour today: it has all of them.',
      reglaEs: 'El agua cicla TODOS los colores; lo raro pica ×2,5 y las bestias emergen con una estrella de más: hoy todo puede nacer raro.',
      reglaEn: 'The water cycles EVERY colour; rare things bite ×2.5 and beasts surface with an extra star: today anything can be born rare.'
    },
    {
      id: 'sangre',
      tira: 'sangre',
      es: 'Marea de Sangre',         en: 'Blood Tide',
      hondo: [66, 10, 13],           horiz: [107, 26, 23],
      notaEs: 'No es coral, no es alga: el agua huele a hierro.',
      notaEn: "It's not coral, it's not weed: the water smells of iron.",
      reglaEs: 'Bestias ×1,9 y DESPIERTAS, náufragos ×2, zarpar cuesta 5 de cordura… y lo que el mar suelta hoy lo paga caro.',
      reglaEn: 'Beasts ×1.9 and AWAKE, castaways ×2, setting sail costs 5 sanity… and what the sea gives today, it gives dearly.'
    },
    {
      id: 'leche',
      tira: 'leche',
      es: 'Mar de Leche',            en: 'Sea of Milk',
      hondo: [140, 148, 153],        horiz: [191, 196, 199],
      notaEs: 'La niebla y el agua son una sola cosa. Escucha.',
      notaEn: 'Fog and water are one thing. Listen.',
      reglaEs: 'Niebla total y silencio; el lazo agarra ×1,5 y lo domado sale con una estrella de más: EL día de ir de captura.',
      reglaEn: 'Total fog and silence; the lasso grips ×1.5 and what you tame gains a star: THE day to go catching.'
    },
    {
      id: 'rosada',
      tira: 'rosada',
      es: 'Marea Rosada',            en: 'Rose Tide',
      hondo: [107, 26, 66],          horiz: [158, 71, 112],
      notaEs: 'Encendido por dentro como una brasa fría.',
      notaEn: 'Lit from within like a cold ember.',
      reglaEs: 'Bestias MANSAS (solo el acero las despierta), lo raro pica ×2 y navegar SANA la mente: la única agua que devuelve.',
      reglaEn: 'Beasts TAME (only steel wakes them), rare things bite ×2 and sailing HEALS the mind: the only water that gives back.'
    },
    {
      id: 'sargazo',
      tira: 'sargazo',
      es: 'El Sargazo',              en: 'The Sargasso',
      hondo: [26, 71, 46],           horiz: [51, 102, 71],
      notaEs: 'Algas hasta donde alcanza la vista. El bote se arrastra.',
      notaEn: 'Weed as far as the eye can see. The boat drags.',
      reglaEs: 'El bote se arrastra (−10% vela), bestias escasas (×0,6), el DOBLE de restos flotando: día de cosecha mansa.',
      reglaEn: 'The boat drags (−10% sail), scarce beasts (×0.6), DOUBLE the floating debris: a day of gentle harvest.'
    }
  ];

  var CICLO_MS = 21000;   // cuánto dura cada marea
  var CRUCE_MS = 4200;    // cuánto tarda en convertirse en la siguiente

  /* Flags de captura, en el espíritu de los del juego. En la barra:
       ?marea=dorada   fija una marea y no cicla (para fotografiar su color)
       ?ya=1           las bestias nacen ya emergidas (una foto no espera)
     No estorban a nadie: sin parámetros, el mar se comporta normal. */
  var FLAGS = (function () {
    var f = {};
    try {
      new URLSearchParams(location.search).forEach(function (v, k) { f[k] = v; });
    } catch (e) { /* navegador viejo: sin flags y tan tranquilos */ }
    return f;
  })();
  var FIJA = FLAGS.marea || '';
  var YA = FLAGS.ya === '1';
  /* En modo captura (?ir=) el mar pinta un puñado de cuadros y se detiene:
     con un requestAnimationFrame perpetuo, el reloj virtual del navegador
     sin ventana nunca se agota y la captura no llega a dispararse. */
  var CAPTURA = !!FLAGS.ir;
  var cuadrosPintados = 0;
  var cuadrosEspera = 0;

  // ── Utilería de color ─────────────────────────────────────────────────
  function mezcla(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }
  function rgb(c, alfa) {
    return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (alfa === undefined ? 1 : alfa) + ')';
  }
  function hsv(h, s, v) {   // h 0-1 — gemelo de Color.from_hsv() de Godot
    var i = Math.floor(h * 6), f = h * 6 - i;
    var p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    var r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      default: r = v; g = p; b = q;
    }
    return [Math.min(255, r * 255), Math.min(255, g * 255), Math.min(255, b * 255)];
  }
  /* color_prismatica() del juego: from_hsv(fmod(t*0.28,1), 0.72, 1.18).
     Aquí gira más despacio — una web no es una partida. */
  function colorIris(t, desfase) {
    return hsv(((t * 0.09 + (desfase || 0)) % 1 + 1) % 1, 0.72, 1.0);
  }
  function paletaDe(marea, t) {
    if (marea.id === 'prismatica') {
      return { hondo: colorIris(t, 0), horiz: colorIris(t, 0.12) };
    }
    return { hondo: marea.hondo, horiz: marea.horiz };
  }

  // ── El lienzo ─────────────────────────────────────────────────────────
  var lienzo = document.getElementById('mar');
  if (!lienzo) return;
  var ctx = lienzo.getContext('2d', { alpha: false });

  var W = 0, H = 0, DPR = 1;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function medir() {
    DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    lienzo.width = Math.round(W * DPR);
    lienzo.height = Math.round(H * DPR);
    lienzo.style.width = W + 'px';
    lienzo.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sembrarEstrellas();
  }

  // ── Estrellas ─────────────────────────────────────────────────────────
  var estrellas = [];
  function sembrarEstrellas() {
    estrellas = [];
    var n = Math.round(W * H / 16000);
    n = Math.max(40, Math.min(n, 150));
    for (var i = 0; i < n; i++) {
      estrellas.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.46,
        r: Math.random() * 1.25 + 0.3,
        base: Math.random() * 0.5 + 0.25,
        vel: Math.random() * 1.6 + 0.4,
        fase: Math.random() * 6.283
      });
    }
  }

  // ── Bestias que emergen ───────────────────────────────────────────────
  // Cada aparición nace bajo la línea del agua, sube, se queda mirando y
  // se vuelve a hundir — las "presencias del horizonte" del juego.
  var ARCHIVOS = {
    grandes: ['leviatan', 'kraken', 'serpiente', 'calamar', 'ballena'],
    medianas: ['megalodon', 'tentaculo'],
    pequenas: ['sirena', 'cthulhu', 'rape', 'tortuga', 'espectro', 'cultista']
  };
  var imagenes = {};
  function cargar(nombre) {
    if (imagenes[nombre]) return imagenes[nombre];
    var im = new Image();
    im.decoding = 'async';
    im.src = 'assets/bestias/' + nombre + '.webp';
    imagenes[nombre] = im;
    return im;
  }
  // Precarga: primero las que salen antes.
  ARCHIVOS.grandes.forEach(cargar);
  ARCHIVOS.medianas.forEach(cargar);
  ARCHIVOS.pequenas.forEach(cargar);

  var apariciones = [];
  var hayFiltro = (function () {
    try { return typeof ctx.filter === 'string'; } catch (e) { return false; }
  })();

  /* ── LAS TIRAS DE AGUA ────────────────────────────────────────────────
     Los mismos PNG que el juego reparte en hileras (assets/sprites/mundo/
     mar_tira_N.png): cada marea trae la suya, con su color YA dentro — la
     dorada incluso lleva monedas girando en la espuma. Se piden solo cuando
     hacen falta (la de ahora y la de después); mientras no llegan, el mar
     se apaña con las olas dibujadas, que es el respaldo de siempre. */
  var tiras = {};
  function cargarTira(nombre) {
    if (!nombre) return null;
    if (tiras[nombre]) return tiras[nombre];
    var im = new Image();
    im.decoding = 'async';
    im.src = 'assets/olas/' + nombre + '.webp';
    tiras[nombre] = im;
    return im;
  }
  function tiraLista(nombre) {
    var im = tiras[nombre];
    return (im && im.complete && im.naturalWidth) ? im : null;
  }

  /* CINCO hileras de PNG (13 sep, pedido del usuario: "se ven espacios celestes
     del fondo fijo, no de las olas png"). Antes eran tres y arrancaban en 0,64:
     entre el horizonte (0,50) y esa primera hilera quedaba una franja del relleno
     plano — el color claro del horizonte — que se leía como cielo tumbado, no como
     agua. Ahora el agua entera lleva tira, desde 0,508 hasta pasado el borde de
     abajo, y cada hilera EMPIEZA antes de que acabe la anterior (se solapan: una
     costura entre dos hileras vuelve a ser una banda plana).
     y = dónde flota · alto = cuánto mide · vel = px/s · alfa = cuánto se entrega
     (las de lejos poco: el degradado tiene que seguir dando la distancia) ·
     estira = cuánto se ensancha respecto a la pantalla (ver abajo por qué). */
  /* EL SOLAPE, medido con la tira en la mano: el PNG trae su cuarto de arriba en
     degradado (la cresta: alfa 0 -> 1 en el 24% superior) y el resto opaco. Si
     una hilera empieza donde acaba la anterior, ese cuarto transparente deja ver
     el relleno y aparece una banda plana — el mismo defecto de antes, más abajo.
     Cada hilera arranca sobre el último tercio de la de arriba, para que su parte
     OPACA tape el filo de la anterior. */
  var HILERAS = [
    { y: 0.504, alto: 0.070, vel: 4,  alfa: 0.55, estira: 0.62 },
    { y: 0.540, alto: 0.095, vel: 8,  alfa: 0.68, estira: 0.80 },
    { y: 0.600, alto: 0.130, vel: 14, alfa: 0.80, estira: 1.05 },
    { y: 0.680, alto: 0.180, vel: 27, alfa: 0.90, estira: 1.45 },
    { y: 0.790, alto: 0.265, vel: 48, alfa: 0.98, estira: 1.90 }
  ];
  // Capas donde puede asomar una bestia: las 2 hileras dibujadas del fondo + las 5 de tira.
  var CAPAS = 2 + HILERAS.length;

  /* Dibuja una tira repetida a lo ancho. El PNG trae la cresta arriba, así
     que su borde superior ES la línea de flotación de esa hilera.

     EL ESTIRÓN: a su proporción natural, la tira entra 2 o 3 veces en la
     pantalla y el ojo caza el patrón al instante — se lee como papel pintado,
     no como agua. Ensanchándola hasta pasar del ancho de la ventana, la
     costura ocurre como mucho una vez y las olas salen más largas y mansas,
     que es justo lo que se quiere de fondo. */
  function dibujarHilera(im, hilera, alfa, iris, desfaseIris) {
    var alto = H * hilera.alto;
    var ancho = Math.max(alto * (im.naturalWidth / im.naturalHeight), W * hilera.estira);
    if (ancho < 1) return;
    var y = H * hilera.y;
    var corr = (reloj * hilera.vel) % (ancho * 2);   // dos anchos: el ciclo del espejo
    var x = -corr;

    ctx.save();
    ctx.globalAlpha = alfa;
    if (iris && hayFiltro) {
      ctx.filter = 'hue-rotate(' + Math.round((reloj * 26 + (desfaseIris || 0)) % 360) +
                   'deg) saturate(1.5)';
    }
    /* EL ESPEJO: la tira no empalma consigo misma (su borde izquierdo no es la
       continuación del derecho), así que cada repetición dejaba una COSTURA
       vertical — muy visible en las hileras de lejos, que repiten más. Las
       copias impares se pintan del revés: entonces cada junta enfrenta un borde
       con su propio reflejo y encaja por construcción. De paso el patrón dura
       el doble, que es justo lo que pide la regla del estirón. */
    var copia = 0;
    for (; x < W; x += ancho, copia++) {
      if (copia % 2 === 0) {
        ctx.drawImage(im, x, y, ancho, alto);
      } else {
        ctx.save();                       // conserva alfa y filtro de fuera
        ctx.translate(x + ancho, y);
        ctx.scale(-1, 1);
        ctx.drawImage(im, 0, 0, ancho, alto);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function nacerAparicion(iris) {
    // El iris siempre es una bestia grande: tiene que verse que es rara.
    var grupo = iris ? 'grandes'
      : (Math.random() < 0.45 ? 'grandes' : (Math.random() < 0.55 ? 'medianas' : 'pequenas'));
    var lista = ARCHIVOS[grupo];
    // Sin repetidos a la vista: dos megalodones iguales a la vez cantan mucho.
    var enAgua = apariciones.map(function (a) { return a.nombre; });
    var libres = lista.filter(function (n) { return enAgua.indexOf(n) < 0; });
    if (!libres.length) libres = lista;
    var nombre = libres[Math.floor(Math.random() * libres.length)];

    // Capa: entre qué hileras asoma (0 = al fondo). Las grandes salen CERCA,
    // nunca junto al horizonte: una bestia pequeña y alta se lee como pegatina.
    var capa = grupo === 'pequenas' ? 2 + Math.floor(Math.random() * 2)
      : (grupo === 'medianas' ? 4 + Math.floor(Math.random() * 2) : 6);
    // Altura fuera del agua, en fracción de pantalla. Contenida a propósito:
    // el mar es el fondo de una web, no el escenario de una pelea.
    var alto = grupo === 'pequenas' ? 0.042 : (grupo === 'medianas' ? 0.075 : 0.115 + Math.random() * 0.055);

    var sube = 3.2 + Math.random() * 1.8;
    return {
      nombre: nombre,
      img: cargar(nombre),
      iris: !!iris,
      capa: capa,
      x: 0.08 + Math.random() * 0.84,       // fracción del ancho
      alto: alto,                            // fracción de la altura
      giro: Math.random() < 0.5 ? -1 : 1,
      // con ?ya=1 nace con la subida hecha: sale del agua en el primer cuadro
      nace: YA ? reloj - sube : reloj,
      sube: sube,
      queda: (iris ? 11 : 5) + Math.random() * 5,
      baja: 3.2 + Math.random() * 1.8,
      desfase: Math.random()
    };
  }

  function poblar() {
    // Regla de la casa: SIEMPRE hay exactamente una prismática en el agua.
    var hayIris = false, i;
    for (i = 0; i < apariciones.length; i++) if (apariciones[i].iris) hayIris = true;
    if (!hayIris) apariciones.push(nacerAparicion(true));

    var tope = W < 700 ? 2 : 4;
    // Con ?ya=1 el mar se puebla de golpe; si no, van asomando poco a poco.
    var prisa = YA && apariciones.length < tope;
    if (apariciones.length < tope && (prisa || Math.random() < 0.02)) {
      apariciones.push(nacerAparicion(false));
    }
  }

  function dibujarAparicion(a, aguaY) {
    var im = a.img;
    if (!im.complete || !im.naturalWidth) return;

    var vida = reloj - a.nace;
    var total = a.sube + a.queda + a.baja;
    if (vida > total) return;

    // 0 = escondida bajo el agua, 1 = del todo fuera
    var f;
    if (vida < a.sube) f = vida / a.sube;
    else if (vida < a.sube + a.queda) f = 1;
    else f = 1 - (vida - a.sube - a.queda) / a.baja;
    f = f * f * (3 - 2 * f);   // suavizado

    // Tope en píxeles: en una pantalla muy alta, una fracción de la altura se
    // convierte en un sprite gigante y pixelado. El arte no da para tanto.
    var alto = Math.min(H * a.alto, im.naturalHeight * 1.15);
    var ancho = alto * (im.naturalWidth / im.naturalHeight);
    var x = a.x * W;
    // La línea de flotación de su hilera: la bestia sale DE ahí.
    var agua = aguaY;
    var y = agua - alto * f;

    ctx.save();
    // Las de más lejos se entregan menos: la distancia también es niebla.
    var lejania = 1 - a.capa / (CAPAS - 1);
    ctx.globalAlpha = Math.min(1, f * 1.6) * (0.92 - lejania * 0.22);
    // Recorte: lo que queda bajo la línea del agua no se ve.
    ctx.beginPath();
    ctx.rect(0, 0, W, agua);
    ctx.clip();

    if (hayFiltro) {
      if (a.iris) {
        ctx.filter = 'hue-rotate(' + Math.round((reloj * 32 + a.desfase * 360) % 360) +
                     'deg) saturate(1.8) brightness(1.2)';
      } else {
        // Varias bestias son casi negras; sobre agua oscura desaparecían.
        ctx.filter = 'brightness(' + (1.28 - lejania * 0.1).toFixed(2) + ') contrast(0.92)';
      }
    }
    ctx.translate(x, y);
    if (a.giro < 0) ctx.scale(-1, 1);
    // Un vaivén muy leve: el agua nunca está quieta.
    ctx.rotate(Math.sin(reloj * 0.6 + a.desfase * 6.28) * 0.016);
    ctx.drawImage(im, -ancho / 2, 0, ancho, alto);
    ctx.restore();
  }

  // ── Las hileras de olas ───────────────────────────────────────────────
  // De lejos a cerca: más abajo, más altas, más rápidas y más hondas de color.
  // SIETE filas: las dos primeras se pintan siempre (son el degradado hacia el
  // horizonte) y las cinco siguientes son el respaldo de cada hilera de PNG,
  // por si la tira aún viaja por la red. Una por hilera: antes había cinco para
  // tres hileras y la cuenta 2+h se habría salido de la tabla.
  var TIRAS = [
    { y: 0.512, amp: 0.0060, onda: 0.0038, vel: 0.14, mez: 0.00, alto: 0.09 },
    { y: 0.545, amp: 0.0085, onda: 0.0048, vel: 0.20, mez: 0.16, alto: 0.11 },
    { y: 0.588, amp: 0.0120, onda: 0.0060, vel: 0.28, mez: 0.34, alto: 0.13 },
    { y: 0.645, amp: 0.0175, onda: 0.0080, vel: 0.40, mez: 0.52, alto: 0.16 },
    { y: 0.718, amp: 0.0250, onda: 0.0105, vel: 0.58, mez: 0.70, alto: 0.20 },
    { y: 0.805, amp: 0.0330, onda: 0.0130, vel: 0.74, mez: 0.86, alto: 0.23 },
    { y: 0.908, amp: 0.0420, onda: 0.0155, vel: 0.90, mez: 1.00, alto: 0.26 }
  ];

  function dibujarTira(tira, color, t) {
    var yBase = H * tira.y;
    var amp = H * tira.amp;
    var paso = W < 700 ? 14 : 9;

    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, yBase);
    for (var x = 0; x <= W + paso; x += paso) {
      var y = yBase
        + Math.sin(x * tira.onda + t * tira.vel) * amp
        + Math.sin(x * tira.onda * 2.3 - t * tira.vel * 1.45) * amp * 0.42;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = rgb(color);
    ctx.fill();

    // La cresta: una línea de espuma tenue sobre el filo de la ola.
    ctx.beginPath();
    for (var x2 = 0; x2 <= W + paso; x2 += paso) {
      var y2 = yBase
        + Math.sin(x2 * tira.onda + t * tira.vel) * amp
        + Math.sin(x2 * tira.onda * 2.3 - t * tira.vel * 1.45) * amp * 0.42;
      if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = rgb(mezcla(color, [255, 255, 255], 0.55), 0.5);
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  // ── El cuadro ─────────────────────────────────────────────────────────
  var reloj = 0;
  var indice = 0;          // marea vigente
  var siguiente = 1;       // a la que está virando
  var cruce = 0;           // 0..1
  var ultimoCambio = 0;
  var oyentes = [];

  function avisarMarea() {
    var m = MAREAS[indice];
    for (var i = 0; i < oyentes.length; i++) {
      try { oyentes[i](m, indice); } catch (e) { /* un oyente roto no hunde el mar */ }
    }
  }

  function pintar(dt) {
    reloj += dt;

    // ¿Toca virar de marea? (con ?marea= fija, nunca)
    var desde = reloj - ultimoCambio;
    if (!FIJA && desde > CICLO_MS / 1000) {
      cruce = Math.min(1, (desde - CICLO_MS / 1000) / (CRUCE_MS / 1000));
      if (cruce >= 1) {
        indice = siguiente;
        siguiente = (siguiente + 1) % MAREAS.length;
        cruce = 0;
        ultimoCambio = reloj;
        avisarMarea();
      }
    }

    var pa = paletaDe(MAREAS[indice], reloj);
    var pb = paletaDe(MAREAS[siguiente], reloj);
    var hondo = mezcla(pa.hondo, pb.hondo, cruce);
    var horiz = mezcla(pa.horiz, pb.horiz, cruce);

    // ── cielo ──
    var cielo = ctx.createLinearGradient(0, 0, 0, H * 0.56);
    cielo.addColorStop(0, rgb(mezcla(horiz, [3, 5, 10], 0.90)));
    cielo.addColorStop(0.55, rgb(mezcla(horiz, [3, 5, 10], 0.72)));
    cielo.addColorStop(1, rgb(mezcla(horiz, [255, 245, 220], 0.13)));
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, W, H * 0.56);

    // ── estrellas ──
    for (var i = 0; i < estrellas.length; i++) {
      var e = estrellas[i];
      var brillo = e.base + Math.sin(reloj * e.vel + e.fase) * 0.28;
      if (brillo <= 0.04) continue;
      ctx.globalAlpha = Math.min(0.92, brillo) * 0.85;
      ctx.fillStyle = '#fdf8ec';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── luna (crema, como la del juego) ──
    // La mordida de la fase se pinta CON EL COLOR DEL CIELO de esa altura:
    // con 'destination-out' se abría un agujero al fondo negro del lienzo.
    var lx = W * 0.82, ly = H * 0.155, lr = Math.max(26, Math.min(W, H) * 0.045);
    var cieloLuna = mezcla(horiz, [3, 5, 10], 0.81);
    var halo = ctx.createRadialGradient(lx, ly, lr * 0.5, lx, ly, lr * 4.6);
    halo.addColorStop(0, 'rgba(255,246,222,0.17)');
    halo.addColorStop(1, 'rgba(255,246,222,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(lx, ly, lr * 4.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#f7ecd2';
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 6.283); ctx.fill();
    ctx.fillStyle = rgb(cieloLuna);
    ctx.beginPath(); ctx.arc(lx - lr * 0.58, ly - lr * 0.2, lr * 0.9, 0, 6.283); ctx.fill();

    // ── bruma del horizonte ──
    var bruma = ctx.createLinearGradient(0, H * 0.40, 0, H * 0.60);
    bruma.addColorStop(0, rgb(horiz, 0));
    bruma.addColorStop(0.62, rgb(mezcla(horiz, [255, 255, 255], 0.16), 0.5));
    bruma.addColorStop(1, rgb(horiz, 0));
    ctx.fillStyle = bruma;
    ctx.fillRect(0, H * 0.40, W, H * 0.21);

    /* ── el agua de fondo (lo que asoma entre hileras) ──
       El color del horizonte es CLARO a propósito (es la distancia), pero
       extendido media pantalla hacia abajo se leía como un cielo tumbado. Aquí
       se hunde rápido: claro solo en el filo del horizonte y agua honda en
       seguida, que es lo que el ojo espera debajo de las olas. */
    var fondo = ctx.createLinearGradient(0, H * 0.50, 0, H);
    fondo.addColorStop(0, rgb(horiz));
    fondo.addColorStop(0.12, rgb(mezcla(horiz, hondo, 0.55)));
    fondo.addColorStop(1, rgb(mezcla(hondo, [0, 0, 0], 0.18)));
    ctx.fillStyle = fondo;
    ctx.fillRect(0, H * 0.50, W, H * 0.5);

    // La raya del horizonte: sin ella el cielo y el agua son la misma mancha.
    ctx.fillStyle = rgb(mezcla(horiz, [255, 250, 235], 0.34), 0.5);
    ctx.fillRect(0, H * 0.50 - 1, W, 1.4);

    // ── hileras + bestias intercaladas ──
    poblar();

    // Las bestias de una capa se dibujan ANTES de su hilera: emergen de ella.
    function bestiasDe(capa, aguaY) {
      for (var a = 0; a < apariciones.length; a++) {
        if (apariciones[a].capa === capa) dibujarAparicion(apariciones[a], aguaY);
      }
    }

    // (1) Las dos hileras de LEJOS siguen dibujadas: dan el degradado hacia
    //     el horizonte, donde un PNG repetido se notaría como un patrón.
    for (var c = 0; c < 2; c++) {
      bestiasDe(c, H * TIRAS[c].y);
      // Hacia hondo desde el primer paso: en la primera fila el color era el del
      // horizonte a pelo y esa franja salía celeste bajo las tiras de arriba.
      var col = mezcla(horiz, hondo, 0.16 + TIRAS[c].mez * 0.84);
      col = mezcla(col, [0, 0, 0], 0.14 + TIRAS[c].mez * 0.40);
      dibujarTira(TIRAS[c], col, reloj);
    }

    // (2) Las tres de CERCA son las tiras del juego. Se piden solo estas dos.
    var mA = MAREAS[indice], mB = MAREAS[siguiente];
    cargarTira(mA.tira);
    if (cruce > 0) cargarTira(mB.tira);
    var imA = tiraLista(mA.tira);
    var imB = cruce > 0 ? tiraLista(mB.tira) : null;

    for (var h = 0; h < HILERAS.length; h++) {
      bestiasDe(2 + h, H * HILERAS[h].y);
      var hil = HILERAS[h];
      if (imA || imB) {
        // Durante el viraje, la tira vieja se va mientras la nueva entra.
        if (imA) dibujarHilera(imA, hil, hil.alfa * (1 - cruce), !!mA.iris, h * 40);
        if (imB) dibujarHilera(imB, hil, hil.alfa * cruce, !!mB.iris, h * 40);
      } else {
        // Respaldo mientras el PNG viaja por la red: las olas de siempre.
        var ct = mezcla(horiz, hondo, 0.5 + h * 0.25);
        ct = mezcla(ct, [0, 0, 0], 0.2 + h * 0.14);
        dibujarTira(TIRAS[2 + h], ct, reloj);
      }
    }

    // ── viñeta ──
    var vin = ctx.createRadialGradient(W / 2, H * 0.46, Math.min(W, H) * 0.34, W / 2, H * 0.5, Math.max(W, H) * 0.82);
    vin.addColorStop(0, 'rgba(0,0,0,0)');
    vin.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vin;
    ctx.fillRect(0, 0, W, H);

    // limpieza de apariciones cumplidas
    apariciones = apariciones.filter(function (a) {
      return (reloj - a.nace) <= (a.sube + a.queda + a.baja);
    });
  }

  // ── El bucle ──────────────────────────────────────────────────────────
  var anterior = 0, corriendo = false;

  function cuadro(ahora) {
    if (!corriendo) return;
    var dt = anterior ? Math.min((ahora - anterior) / 1000, 0.05) : 0.016;
    anterior = ahora;
    pintar(dt);
    if (CAPTURA) {
      /* La foto NO se da por buena hasta que la tira de agua está: el respaldo
         dibujado llega siempre antes que el PNG, y las capturas salían con el
         mar en bandas planas (justo lo que se fue a arreglar). Con un seguro:
         si la tira no llega nunca, se entrega lo que haya. */
      if (tiraLista(MAREAS[indice].tira) || ++cuadrosEspera > 400) cuadrosPintados++;
      if (cuadrosPintados > 60) { corriendo = false; return; }
    }
    requestAnimationFrame(cuadro);
  }

  function arrancar() {
    if (corriendo) return;
    corriendo = true;
    anterior = 0;
    requestAnimationFrame(cuadro);
  }
  function parar() { corriendo = false; }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) parar(); else arrancar();
  });

  var remedir;
  window.addEventListener('resize', function () {
    clearTimeout(remedir);
    remedir = setTimeout(medir, 160);
  });

  // ?marea=<id>: el mar se queda en esa y no vira.
  if (FIJA) {
    for (var k = 0; k < MAREAS.length; k++) {
      if (MAREAS[k].id === FIJA) { indice = k; siguiente = k; break; }
    }
  }

  // Las tiras de la marea de ahora y de la siguiente se piden YA: pedirlas en el
  // primer cuadro dejaba el mar con las olas de respaldo hasta que llegaban.
  cargarTira(MAREAS[indice].tira);
  cargarTira(MAREAS[siguiente].tira);

  medir();
  // Con "reduzca el movimiento" pintamos UN cuadro y lo dejamos quieto.
  if (quieto) { pintar(0); } else { arrancar(); }

  // ── Lo que el resto del sitio puede pedirle al mar ─────────────────────
  window.Mar = {
    MAREAS: MAREAS,
    mareaActual: function () { return MAREAS[indice]; },
    alCambiarMarea: function (fn) {
      oyentes.push(fn);
      fn(MAREAS[indice], indice);   // arranca sabiendo qué mar hay
    },
    rgb: rgb
  };
})();
