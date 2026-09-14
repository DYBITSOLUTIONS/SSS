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
    /* Densidad del lienzo. Estaba en 2 en escritorio: en una pantalla grande eso
       es pintar el CUÁDRUPLE de píxeles sesenta veces por segundo, y el mar es
       un fondo, no el contenido. A 1,5 no se nota la diferencia y baja casi a
       la mitad el trabajo de cada cuadro. */
    DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.25 : 1.5);
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
    /* LOS COLOSOS salen aparte (pedido del usuario): el Leviatán y el Kraken no
       son bestias grandes, son OTRA cosa. Emergen en las hileras del FONDO y
       ocupan un tercio de la pantalla — a esa distancia, ese tamaño solo puede
       ser algo imposible. Suben despacio, se quedan mucho y van oscuros: a
       contraluz contra el cielo, como las presencias del horizonte del juego. */
    colosos: ['leviatan', 'kraken'],
    grandes: ['serpiente', 'calamar', 'ballena'],
    medianas: ['megalodon', 'tentaculo', 'serpiente_verde', 'sirena_verde'],
    // El fondo tenía seis bichos pequeños y se repetían: ahora son diecisiete,
    // todos criaturas reales del juego (los corales andantes, el cangrejo, el
    // ermitaño, el lancero de algas, el ahogado del sombrero...).
    pequenas: ['sirena', 'cthulhu', 'rape', 'tortuga', 'espectro', 'cultista',
      'anemona', 'cangrejo', 'coral', 'ermitano', 'lancero', 'madero',
      'pezhombre', 'tortuga_coral', 'ahogado']
  };
  var PECES = ['anguila', 'atun', 'bacalao', 'caballito', 'campana', 'esqueleto',
    'globo', 'luminoso', 'medusa', 'sardina', 'tiburon'];
  var BARCAS = ['velero', 'galeon', 'barca', 'balsa'];
  var DERIVA = ['boya', 'barril', 'algas', 'huesos', 'maderos'];
  // Lo que asoma en el horizonte. La CIUDAD NEGRA sale grande: es el final del
  // juego asomando al fondo del mar (y la isla de oro, el premio que se hunde).
  var SILUETAS = [
    { id: 'isla',     alto: [0.045, 0.035], alfa: 0.50 },
    { id: 'roca',     alto: [0.040, 0.030], alfa: 0.55 },
    { id: 'ciudad',   alto: [0.150, 0.070], alfa: 0.46 },
    { id: 'isla_oro', alto: [0.070, 0.035], alfa: 0.44 }
  ];

  /* CARGA PEREZOSA. Antes se pedían las catorce bestias de golpe al abrir; con
     treinta y tantas piezas eso es medio mega antes de ver nada. Ahora cada
     archivo se pide la primera vez que le toca salir: el mar se puebla poco a
     poco, así que llegan de sobra a tiempo. */
  var imagenes = {};
  function cargarDe(carpeta, nombre) {
    var clave = carpeta + '/' + nombre;
    if (imagenes[clave]) return imagenes[clave];
    var im = new Image();
    im.decoding = 'async';
    im.src = 'assets/' + clave + '.webp';
    imagenes[clave] = im;
    return im;
  }
  function cargar(nombre) { return cargarDe('bestias', nombre); }
  function listo(im) { return im && im.complete && im.naturalWidth ? im : null; }

  var apariciones = [];

  /* A LOS LADOS. En el centro de la portada vive el grabado del título, y todo
     lo ALTO que asome ahí (un coloso, la ciudad negra) se esconde detrás de él:
     se pierde justo lo que se quería enseñar. Lo grande sale por los costados. */
  function xLateral() {
    return Math.random() < 0.5 ? 0.05 + Math.random() * 0.20
                               : 0.75 + Math.random() * 0.20;
  }

  var hayFiltro = (function () {
    try { return typeof ctx.filter === 'string'; } catch (e) { return false; }
  })();

  /* EL TINTE, UNA VEZ Y NO SESENTA POR SEGUNDO. Cada bestia, cada pez y cada
     barca se dibujaban con ctx.filter puesto — y un filtro de lienzo se
     recalcula en CADA drawImage. Con treinta piezas en el agua eso es lo que
     atascaba la página en equipos modestos. Ahora el sprite teñido se cocina
     una vez en un lienzo aparte y luego solo se pega. Las combinaciones son
     pocas (un puñado de sprites por un puñado de tintes), así que la caché no
     crece: el único filtro que sigue en vivo es el del iris, que TIENE que
     girar de tono cuadro a cuadro, y es UNA bestia. */
  var tenidos = {};
  function tenido(im, filtro) {
    if (!hayFiltro || !filtro) return im;
    var clave = im.src + '|' + filtro;
    if (tenidos[clave]) return tenidos[clave];
    if (Object.keys(tenidos).length > 90) tenidos = {};
    var c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    var g = c.getContext('2d');
    g.filter = filtro;
    g.drawImage(im, 0, 0);
    tenidos[clave] = c;
    return c;
  }

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
  /* EL SOLAPE, segunda medida (pedido del usuario: "donde se unen las olas se ve
     la línea"). La cuenta que importa: el PNG trae su 24% de arriba en degradado
     (la cresta), así que la parte OPACA de una hilera empieza en y + 0,24·alto y
     termina en y + alto. Para que no se vea el filo de la de arriba, la opaca de
     la de abajo tiene que empezar BIEN ANTES de que la anterior acabe. Antes el
     margen era de tres milésimas de pantalla —dos o tres píxeles— y la junta se
     leía como una raya. Ahora va de 20 a 60 milésimas. */
  /* DIEZ HILERAS, no cinco (14 sep, pedido del usuario mirando el juego: "más
     olas en vez de olas más grandes y estiradas"). Tenía razón: en el juego el
     mar es una textura DENSA de crestas pequeñas que se aprietan hacia el
     horizonte, y aquí eran cinco olas enormes estiradas a lo ancho de la
     pantalla. El estirón defendía de la costura… pero de eso ya se encarga el
     ESPEJO de las copias impares, así que se puede repetir mucho más.

     La tabla no está puesta a ojo: las `y` siguen una curva de perspectiva
     (juntas arriba, separadas abajo) y los `alto` se calcularon HACIA ARRIBA
     para que cada hilera tape el filo de la anterior con margen (el PNG trae su
     24% de arriba en degradado: ver el comentario del solape). `estira` va de
     0,20 arriba —cinco copias, olas diminutas— a 0,70 abajo. */
  var HILERAS = [
    { y: 0.498, alto: 0.051, vel: 2,  alfa: 0.52, estira: 0.20 },
    { y: 0.508, alto: 0.069, vel: 2,  alfa: 0.57, estira: 0.22 },
    { y: 0.533, alto: 0.085, vel: 4,  alfa: 0.62, estira: 0.26 },
    { y: 0.570, alto: 0.100, vel: 7,  alfa: 0.67, estira: 0.31 },
    { y: 0.619, alto: 0.115, vel: 12, alfa: 0.72, estira: 0.36 },
    { y: 0.679, alto: 0.129, vel: 19, alfa: 0.78, estira: 0.42 },
    { y: 0.749, alto: 0.143, vel: 27, alfa: 0.83, estira: 0.48 },
    { y: 0.829, alto: 0.163, vel: 37, alfa: 0.88, estira: 0.55 },
    { y: 0.919, alto: 0.205, vel: 49, alfa: 0.93, estira: 0.62 },
    { y: 1.018, alto: 0.340, vel: 64, alfa: 0.98, estira: 0.70 }
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
    /* Cada hilera arranca DESPLAZADA. Con diez hileras empezando todas en x=0,
       las crestas se alineaban en columnas y el mar se leía como una rejilla
       hasta que las velocidades las desincronizaban (medio minuto). El desfase
       sale de la propia y, así que es el mismo en cada visita. */
    var desf = (hilera.y * 3137) % (ancho * 2);
    var corr = (reloj * hilera.vel + desf) % (ancho * 2);   // dos anchos: el ciclo del espejo
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
    var hayColoso = false;
    for (var hc = 0; hc < apariciones.length; hc++) if (apariciones[hc].coloso) hayColoso = true;
    var tirada = Math.random();
    var grupo = iris ? 'grandes'
      : (!hayColoso && tirada < 0.13 ? 'colosos'
        : (tirada < 0.48 ? 'grandes' : (tirada < 0.74 ? 'medianas' : 'pequenas')));
    var lista = ARCHIVOS[grupo];
    // Sin repetidos a la vista: dos megalodones iguales a la vez cantan mucho.
    var enAgua = apariciones.map(function (a) { return a.nombre; });
    var libres = lista.filter(function (n) { return enAgua.indexOf(n) < 0; });
    if (!libres.length) libres = lista;
    var nombre = libres[Math.floor(Math.random() * libres.length)];

    // Capa: entre qué hileras asoma (0 = al fondo). Las grandes salen CERCA,
    // nunca junto al horizonte: una bestia pequeña y alta se lee como pegatina.
    /* Doce capas ahora (2 dibujadas + 10 de tira): lo pequeño arriba, lo grande
       abajo del todo, y los colosos al fondo — un coloso en la orilla no es un
       coloso, es un bicho. */
    var capa = grupo === 'colosos' ? Math.floor(Math.random() * 2)
      : (grupo === 'pequenas' ? 3 + Math.floor(Math.random() * 3)
      : (grupo === 'medianas' ? 6 + Math.floor(Math.random() * 3)
      : CAPAS - 2 + Math.floor(Math.random() * 2)));
    /* TAMAÑOS. Antes cada grupo salía SIEMPRE del mismo alto y el mar parecía de
       juguete: todas las bestias medían igual. Ahora cada grupo tiene su
       horquilla —y una de cada siete grandes sale COLOSAL, del tamaño de los
       jefes del juego—, así que el mismo bicho no se ve dos veces igual.
       Sigue contenido a propósito: el mar es el fondo de una web, no el
       escenario de una pelea. */
    var alto;
    if (grupo === 'colosos') alto = 0.240 + Math.random() * 0.130;   // un tercio de pantalla
    else if (grupo === 'pequenas') alto = 0.026 + Math.random() * 0.034;
    else if (grupo === 'medianas') alto = 0.055 + Math.random() * 0.050;
    else alto = (Math.random() < 0.14 ? 0.200 + Math.random() * 0.080
                                      : 0.105 + Math.random() * 0.070);

    /* SEPARACIÓN: con el reparto ampliado, tres bestias caían juntas en el mismo
       palmo de agua y el resto del mar quedaba vacío. Se prueban tres sitios y
       se elige el que quede más lejos de las que ya están fuera. */
    var x = 0.08 + Math.random() * 0.84;
    var mejor = -1;
    for (var t = 0; t < 3; t++) {
      var cand = 0.08 + Math.random() * 0.84;
      var lejos = 1;
      for (var o = 0; o < apariciones.length; o++) {
        lejos = Math.min(lejos, Math.abs(apariciones[o].x - cand));
      }
      if (lejos > mejor) { mejor = lejos; x = cand; }
    }

    // El coloso sube despacio y se queda: lo que es grande tarda en salir.
    if (grupo === 'colosos') x = xLateral();
    var sube = grupo === 'colosos' ? 6.5 + Math.random() * 3.0 : 3.2 + Math.random() * 1.8;
    return {
      nombre: nombre,
      img: cargar(nombre),
      iris: !!iris,
      coloso: grupo === 'colosos',
      capa: capa,
      x: x,                                  // fracción del ancho (ya separada)
      alto: alto,                            // fracción de la altura
      giro: Math.random() < 0.5 ? -1 : 1,
      // con ?ya=1 nace con la subida hecha: sale del agua en el primer cuadro
      nace: YA ? reloj - sube : reloj,
      sube: sube,
      queda: (grupo === 'colosos' ? 14 : (iris ? 11 : 5)) + Math.random() * 6,
      baja: grupo === 'colosos' ? 6.0 + Math.random() * 2.5 : 3.2 + Math.random() * 1.8,
      desfase: Math.random()
    };
  }

  function poblar() {
    // Regla de la casa: SIEMPRE hay exactamente una prismática en el agua.
    var hayIris = false, i;
    for (i = 0; i < apariciones.length; i++) if (apariciones[i].iris) hayIris = true;
    if (!hayIris) apariciones.push(nacerAparicion(true));

    var tope = W < 700 ? 2 : 5;   // hay diecisiete bichos: que se note
    // Con ?ya=1 el mar se puebla de golpe; si no, van asomando poco a poco.
    var prisa = YA && apariciones.length < tope;
    if (apariciones.length < tope && (prisa || Math.random() < 0.02)) {
      apariciones.push(nacerAparicion(false));
    }
  }

  /* ── LOS PECES QUE SALTAN ─────────────────────────────────────────────
     Un pez sale del agua en parábola, con el morro siguiendo la curva, y vuelve
     a entrar con su chapoteo. Son los peces de verdad del juego (los mismos
     iconos que llenan tu mochila), y duran poco más de un segundo: el mar se
     mueve aunque no haya ninguna bestia asomando. */
  var saltos = [];
  function nacerSalto() {
    return {
      img: cargarDe('peces', PECES[Math.floor(Math.random() * PECES.length)]),
      capa: 3 + Math.floor(Math.random() * (CAPAS - 3)),
      nace: reloj,
      dura: 1.1 + Math.random() * 0.8,
      x: 0.07 + Math.random() * 0.86,
      dir: Math.random() < 0.5 ? -1 : 1,
      alto: 0.030 + Math.random() * 0.028,
      arco: 0.035 + Math.random() * 0.050,
      corre: 0.03 + Math.random() * 0.05
    };
  }
  function dibujarSalto(sa, aguaY) {
    var im = listo(sa.img); if (!im) return;
    var t = (reloj - sa.nace) / sa.dura;
    if (t < 0 || t > 1) return;
    var alto = Math.min(H * sa.alto, im.naturalHeight);
    var ancho = alto * (im.naturalWidth / im.naturalHeight);
    var x = (sa.x + sa.dir * sa.corre * (t - 0.5)) * W;
    var y = aguaY - H * sa.arco * Math.sin(Math.PI * t) - alto * 0.35;

    // El chapoteo, al salir y al entrar.
    var borde = Math.min(t, 1 - t);
    if (borde < 0.14) {
      ctx.save();
      ctx.globalAlpha = (1 - borde / 0.14) * 0.5;
      ctx.fillStyle = '#e9f6ff';
      ctx.beginPath();
      ctx.ellipse(x, aguaY, ancho * (0.5 + borde * 3), alto * 0.16, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }

    // El morro sigue la parábola (los peces del juego miran a la IZQUIERDA).
    var vy = -Math.PI * Math.cos(Math.PI * t) * H * sa.arco;
    var ang = Math.atan2(-vy, Math.abs(sa.dir * sa.corre * W));
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.translate(x, y);
    ctx.rotate(sa.dir > 0 ? -ang : ang);
    ctx.scale(sa.dir > 0 ? -1 : 1, 1);
    ctx.drawImage(tenido(im, 'brightness(1.12)'), -ancho / 2, -alto / 2, ancho, alto);
    ctx.restore();
  }

  /* ── LAS BARCAS DEL FONDO ─────────────────────────────────────────────
     Los cascos náufragos del juego (velero, galeón, barca, balsa) cruzando muy
     despacio por las hileras de lejos, a contraluz. No son decoración inventada:
     son lo que te encuentras a la deriva ahí fuera. */
  var barcas = [];
  function nacerBarca(dentro) {
    var dir = Math.random() < 0.5 ? -1 : 1;
    return {
      img: cargarDe('mar', BARCAS[Math.floor(Math.random() * BARCAS.length)]),
      capa: 1 + Math.floor(Math.random() * 3),
      x: dentro ? 0.15 + Math.random() * 0.7 : (dir > 0 ? -0.18 : 1.18),
      dir: dir,
      vel: 0.008 + Math.random() * 0.010,
      alto: 0.055 + Math.random() * 0.055,
      desfase: Math.random() * 6.283
    };
  }
  function dibujarBarca(b, aguaY) {
    var im = listo(b.img); if (!im) return;
    var alto = Math.min(H * b.alto, im.naturalHeight);
    var ancho = alto * (im.naturalWidth / im.naturalHeight);
    var y = aguaY - alto * 0.86 + Math.sin(reloj * 0.7 + b.desfase) * alto * 0.03;
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.beginPath(); ctx.rect(0, 0, W, aguaY); ctx.clip();
    ctx.translate(b.x * W, y);
    ctx.rotate(Math.sin(reloj * 0.6 + b.desfase) * 0.018);
    if (b.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(tenido(im, 'brightness(0.42) contrast(1.1)'), -ancho / 2, 0, ancho, alto);   // a contraluz
    ctx.restore();
  }

  /* ── LO QUE FLOTA ─────────────────────────────────────────────────────
     Boya, barril, algas, huesos y maderos: los restos que el juego reparte por
     el agua. Cabecean en las hileras de cerca y se van con la corriente. */
  var deriva = [];
  function nacerDeriva(dentro) {
    var dir = Math.random() < 0.5 ? -1 : 1;
    return {
      img: cargarDe('mar', DERIVA[Math.floor(Math.random() * DERIVA.length)]),
      capa: CAPAS - 1 - Math.floor(Math.random() * 3),
      x: dentro ? 0.1 + Math.random() * 0.8 : (dir > 0 ? -0.1 : 1.1),
      dir: dir,
      vel: 0.020 + Math.random() * 0.030,
      alto: 0.030 + Math.random() * 0.030,
      desfase: Math.random() * 6.283
    };
  }
  function dibujarDeriva(d, aguaY) {
    var im = listo(d.img); if (!im) return;
    var alto = Math.min(H * d.alto, im.naturalHeight);
    var ancho = alto * (im.naturalWidth / im.naturalHeight);
    var y = aguaY - alto * 0.72 + Math.sin(reloj * 1.1 + d.desfase) * alto * 0.10;
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.beginPath(); ctx.rect(0, 0, W, aguaY + alto * 0.3); ctx.clip();
    ctx.translate(d.x * W, y);
    ctx.rotate(Math.sin(reloj * 0.9 + d.desfase) * 0.06);
    ctx.drawImage(im, -ancho / 2, 0, ancho, alto);
    ctx.restore();
  }

  /* ── LO QUE HAY EN EL HORIZONTE ───────────────────────────────────────
     Una isla en la niebla o un roquedo, muy lejos, apareciendo y borrándose
     como las "presencias del horizonte" del juego: nunca están mucho rato y
     nunca se acercan. */
  var lejanias = [];
  function nacerLejania() {
    var q = SILUETAS[Math.floor(Math.random() * SILUETAS.length)];
    if (FLAGS.silueta) {
      for (var k = 0; k < SILUETAS.length; k++) if (SILUETAS[k].id === FLAGS.silueta) q = SILUETAS[k];
    }
    return {
      img: cargarDe('mar', q.id),
      nace: reloj,
      dura: 26 + Math.random() * 22,
      // Lo alto (la ciudad) a un lado; lo bajo puede caer donde quiera.
      x: q.alto[0] > 0.09 ? xLateral() : 0.1 + Math.random() * 0.8,
      alto: q.alto[0] + Math.random() * q.alto[1],
      alfa: q.alfa,
      vel: (Math.random() < 0.5 ? -1 : 1) * 0.0015
    };
  }
  function dibujarLejania(l, aguaY) {
    var im = listo(l.img); if (!im) return;
    var t = (reloj - l.nace) / l.dura;
    if (t < 0 || t > 1) return;
    var f = Math.min(1, Math.min(t, 1 - t) / 0.18);
    var alto = Math.min(H * l.alto, im.naturalHeight);
    var ancho = alto * (im.naturalWidth / im.naturalHeight);
    ctx.save();
    ctx.globalAlpha = f * l.alfa;
    ctx.drawImage(tenido(im, 'brightness(0.72) contrast(0.8)'),
      (l.x + l.vel * (reloj - l.nace)) * W - ancho / 2, aguaY - alto * 0.94, ancho, alto);
    ctx.restore();
  }

  /* ── NUBES ────────────────────────────────────────────────────────────
     Las tres nubes del juego cruzando el cielo, apenas visibles: el cielo era
     un degradado liso con estrellas y nada más. */
  var nubes = [];
  var sembrado = false;
  function nacerNube(dentro) {
    var dir = Math.random() < 0.5 ? -1 : 1;
    return {
      img: cargarDe('mar', 'nube_' + (1 + Math.floor(Math.random() * 3))),
      x: dentro ? Math.random() : (dir > 0 ? -0.3 : 1.3),
      y: 0.04 + Math.random() * 0.30,
      dir: dir,
      vel: 0.004 + Math.random() * 0.006,
      ancho: 0.22 + Math.random() * 0.26,
      alfa: 0.10 + Math.random() * 0.14
    };
  }
  function dibujarNube(n) {
    var im = listo(n.img); if (!im) return;
    var ancho = W * n.ancho;
    var alto = ancho * (im.naturalHeight / im.naturalWidth);
    ctx.save();
    ctx.globalAlpha = n.alfa;
    ctx.translate(n.x * W, n.y * H);
    if (n.dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(im, -ancho / 2, -alto / 2, ancho, alto);
    ctx.restore();
  }

  /* El paso del tiempo de todo lo que va a la deriva (las bestias llevan su
     propio reloj de nacer / quedarse / hundirse). */
  function correrDeriva(dt) {
    var i;
    for (i = 0; i < barcas.length; i++) barcas[i].x += barcas[i].dir * barcas[i].vel * dt;
    for (i = 0; i < deriva.length; i++) deriva[i].x += deriva[i].dir * deriva[i].vel * dt;
    for (i = 0; i < nubes.length; i++) nubes[i].x += nubes[i].dir * nubes[i].vel * dt;
    barcas = barcas.filter(function (b) { return b.x > -0.3 && b.x < 1.3; });
    deriva = deriva.filter(function (d) { return d.x > -0.2 && d.x < 1.2; });
    nubes = nubes.filter(function (n) { return n.x > -0.45 && n.x < 1.45; });
    saltos = saltos.filter(function (sa) { return reloj - sa.nace <= sa.dura; });
    lejanias = lejanias.filter(function (l) { return reloj - l.nace <= l.dura; });

    var poco = W < 700;   // en el móvil, la mitad de todo

    /* LA SIEMBRA. Todo esto entra por un borde y tarda su tiempo en cruzar: si
       no se siembra, el primer minuto de visita el mar está vacío de barcas y
       de restos (y las fotos salían sin nada). Al abrir, el mar lleva rato ahí:
       una barca, un par de restos y unas nubes YA puestos. */
    if (!sembrado) {
      sembrado = true;
      /* Flags de captura: ?coloso=1 planta un coloso ya emergido y
         ?silueta=<id> fija lo que asoma en el horizonte (isla, roca, ciudad,
         isla_oro). Salen por lotería, y una foto no puede esperar la lotería. */
      if (FLAGS.coloso === '1') {
        var col = nacerAparicion(false);
        col.coloso = true;
        col.nombre = ARCHIVOS.colosos[Math.floor(Math.random() * ARCHIVOS.colosos.length)];
        col.img = cargar(col.nombre);
        col.capa = Math.floor(Math.random() * 2);
        col.alto = 0.240 + Math.random() * 0.130;
        col.x = xLateral();
        col.sube = 7.0; col.queda = 40; col.baja = 6;
        col.nace = reloj - col.sube;      // ya emergido del todo
        apariciones.push(col);
      }
      barcas.push(nacerBarca(true));
      deriva.push(nacerDeriva(true));
      if (!poco) deriva.push(nacerDeriva(true));
      nubes.push(nacerNube(true));
      if (!poco) nubes.push(nacerNube(true));
      lejanias.push(nacerLejania());
      saltos.push(nacerSalto());
    }

    if (!barcas.length && Math.random() < 0.004) barcas.push(nacerBarca());
    if (deriva.length < (poco ? 1 : 3) && Math.random() < 0.012) deriva.push(nacerDeriva());
    if (!lejanias.length && Math.random() < 0.006) lejanias.push(nacerLejania());
    if (nubes.length < (poco ? 1 : 3) && Math.random() < 0.010) nubes.push(nacerNube());
    if (saltos.length < (poco ? 1 : 3) && Math.random() < 0.020) saltos.push(nacerSalto());
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
    ctx.globalAlpha = Math.min(1, f * 1.6) * (0.92 - lejania * 0.22) * (a.coloso ? 0.82 : 1);
    // Recorte: lo que queda bajo la línea del agua no se ve.
    ctx.beginPath();
    ctx.rect(0, 0, W, agua);
    ctx.clip();

    var dibujo = im;
    if (a.iris && hayFiltro) {
      // El único filtro EN VIVO: el iris tiene que girar de tono cada cuadro.
      ctx.filter = 'hue-rotate(' + Math.round((reloj * 32 + a.desfase * 360) % 360) +
                   'deg) saturate(1.8) brightness(1.2)';
    } else if (a.coloso) {
      // A contraluz: lo enorme y lejano se lee como sombra, no como bicho.
      dibujo = tenido(im, 'brightness(0.42) contrast(1.15) saturate(0.7)');
    } else {
      // Varias bestias son casi negras; sobre agua oscura desaparecían.
      dibujo = tenido(im, 'brightness(' + (1.28 - lejania * 0.1).toFixed(2) + ') contrast(0.92)');
    }
    ctx.translate(x, y);
    if (a.giro < 0) ctx.scale(-1, 1);
    // Un vaivén muy leve: el agua nunca está quieta.
    ctx.rotate(Math.sin(reloj * 0.6 + a.desfase * 6.28) * 0.016);
    ctx.drawImage(dibujo, -ancho / 2, 0, ancho, alto);
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

  /* ── EL CIELO: LAS OCHO LUNAS Y LAS NOCHES RARAS ──────────────────────
     La web enseñaba SIEMPRE la misma luna con la misma mordida. En el juego la
     luna lleva las ocho fases de la de verdad (la del reloj del teléfono) y hay
     noches que traen otra cosa en el cielo. Aquí igual: se arranca en la fase
     REAL de hoy y se avanza una con cada marea, así que quien se quede un rato
     las ve las ocho; y las mareas con carácter traen su cielo. */
  var FASES = [
    { es: 'Luna nueva',        en: 'New moon' },
    { es: 'Luna creciente',    en: 'Waxing crescent' },
    { es: 'Cuarto creciente',  en: 'First quarter' },
    { es: 'Gibosa creciente',  en: 'Waxing gibbous' },
    { es: 'Luna llena',        en: 'Full moon' },
    { es: 'Gibosa menguante',  en: 'Waning gibbous' },
    { es: 'Cuarto menguante',  en: 'Last quarter' },
    { es: 'Luna menguante',    en: 'Waning crescent' }
  ];
  /* Los cielos raros son los del juego (GM.FENOMENOS) y cada uno cae en la
     marea que le pega: la sangre trae la luna roja, la prismática trae la
     segunda luna que LATE, la de leche vela la luna en niebla y el sargazo
     -el agua más muerta- se queda sin estrellas. */
  var CIELOS = {
    sangre: { es: 'Luna de Sangre',      en: 'Blood Moon' },
    dos:    { es: 'Las Dos Lunas',       en: 'The Two Moons' },
    velada: { es: 'Luna velada',         en: 'Veiled moon' },
    sin:    { es: 'Noche sin Estrellas', en: 'Starless Night' }
  };
  var CIELO_DE = { sangre: 'sangre', prismatica: 'dos', leche: 'velada', sargazo: 'sin' };

  // La fase de HOY. Luna nueva de referencia: 6 de enero de 2000, 18:14 UTC.
  function faseHoy() {
    var d = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
    var k = (d / 29.530588853) % 1;
    if (k < 0) k += 1;
    return Math.round(k * 8) % 8;
  }
  var fase = faseHoy();

  /* LA LUNA ES LA DEL JUEGO. Estaba dibujada a mano (un disco crema con una
     mordida elíptica) hasta que aparecieron las ocho fases pintadas que usa el
     instrumental del celular: `assets/lunas/fase_0..7` más la de sangre. Se
     usan esas; el disco dibujado se queda de RESPALDO exacto para el rato en
     que el PNG aún viaja por la red (mismo patrón que las tiras de agua).

     El respaldo se pinta en un lienzo APARTE y se pega ya recortado. Dos
     razones: la mordida de la fase se hace con 'destination-out', que en el
     lienzo grande abriría un agujero al negro del fondo (el bug del 13 sep), y
     así la luna entera puede entrar y salir con alfa durante el viraje. */
  var lunas = {};
  function lienzoLuna(r, k, color) {
    r = Math.round(r);
    var clave = r + '|' + k + '|' + color;
    if (lunas[clave]) return lunas[clave];
    if (Object.keys(lunas).length > 48) lunas = {};   // el viraje tiñe: no acumular
    var lado = r * 2 + 2;
    var c = document.createElement('canvas');
    c.width = lado; c.height = lado;
    var g = c.getContext('2d');
    var cx = lado / 2, cy = lado / 2;
    g.fillStyle = color;
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill();

    // Media luna a oscuras (izquierda si crece, derecha si mengua)...
    var creciente = k < 4;
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    if (creciente) g.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5);
    else g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
    g.fill();
    // ...y el terminador, que es una elipse: si la luz es MENOS de media (fina)
    // la elipse come más sombra; si es MÁS (gibosa) devuelve luz.
    var cosang = Math.cos(2 * Math.PI * (k / 8));
    var rx = Math.abs(cosang) * r;
    if (rx > 0.4) {
      if (cosang <= 0) { g.globalCompositeOperation = 'source-over'; g.fillStyle = color; }
      g.beginPath(); g.ellipse(cx, cy, rx, r, 0, 0, 6.283); g.fill();
    }
    lunas[clave] = c;
    return c;
  }

  /* Pinta la luna en (cx,cy) con radio r: el PNG de su fase si ya llegó, y si
     no el disco dibujado. Con la marea de sangre se cruza a la luna roja. */
  function lunaEn(cx, cy, r, k, rojo, colTxt) {
    var normal = listo(cargarDe('lunas', 'fase_' + k));
    var roja = rojo > 0.01 ? listo(cargarDe('lunas', 'sangre')) : null;
    if (!normal && !roja) {
      var disco = lienzoLuna(r, k, colTxt);
      ctx.drawImage(disco, cx - disco.width / 2, cy - disco.height / 2);
      return;
    }
    var d = r * 2.12;   // el grabado trae su propio margen alrededor del disco
    var alfa = ctx.globalAlpha;
    if (normal) {
      ctx.globalAlpha = alfa * (1 - (roja ? rojo : 0));
      ctx.drawImage(normal, cx - d / 2, cy - d / 2, d, d);
    }
    if (roja) {
      ctx.globalAlpha = alfa * rojo;
      ctx.drawImage(roja, cx - d / 2, cy - d / 2, d, d);
    }
    ctx.globalAlpha = alfa;
  }

  // Cuánto pesa cada cielo ahora mismo (0..1), mezclando durante el viraje.
  function pesoCielo(id) {
    var a = CIELO_DE[MAREAS[indice].id] === id ? 1 : 0;
    var b = CIELO_DE[MAREAS[siguiente].id] === id ? 1 : 0;
    return a + (b - a) * cruce;
  }

  function pintarCielo() {
    var sangriento = pesoCielo('sangre');
    var dobles = pesoCielo('dos');
    var velo = pesoCielo('velada');
    var apagado = pesoCielo('sin');

    // ── estrellas ── (la Noche sin Estrellas las borra)
    var brilloBase = (1 - apagado) * (1 - velo * 0.55);
    if (brilloBase > 0.02) {
      for (var i = 0; i < estrellas.length; i++) {
        var e = estrellas[i];
        var brillo = e.base + Math.sin(reloj * e.vel + e.fase) * 0.28;
        if (brillo <= 0.04) continue;
        ctx.globalAlpha = Math.min(0.92, brillo) * 0.85 * brilloBase;
        ctx.fillStyle = '#fdf8ec';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ── la luna ──
    var lr = Math.max(26, Math.min(W, H) * 0.045);
    var lx = W * 0.82, ly = H * 0.155;
    var visible = 1 - apagado;
    if (visible <= 0.02) return;

    var crema = [247, 236, 210];
    var sangre = [206, 62, 46];
    var col = mezcla(crema, sangre, sangriento);
    var colTxt = 'rgb(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ')';

    // El halo: enorme y lechoso con la luna velada, rojo con la de sangre.
    var haloR = lr * (4.6 + velo * 3.4);
    var halo = ctx.createRadialGradient(lx, ly, lr * 0.5, lx, ly, haloR);
    halo.addColorStop(0, 'rgba(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ',' +
      (0.17 + velo * 0.16 + sangriento * 0.08).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ',0)');
    ctx.save();
    ctx.globalAlpha = visible;
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(lx, ly, haloR, 0, 6.283); ctx.fill();

    ctx.globalAlpha = visible * (1 - velo * 0.45);   // velada: se adivina, no se ve
    lunaEn(lx, ly, lr, fase, sangriento, colTxt);

    /* LA SEGUNDA LUNA: sale más chica, con otra fase (sus cráteres no
       coinciden, dice el juego) y LATE. No se anuncia sola: el rótulo la
       nombra, como la noche nombra su causa. */
    if (dobles > 0.02) {
      var late = 1 + Math.sin(reloj * 1.9) * 0.055;
      var r2 = lr * 0.62 * late;
      ctx.globalAlpha = visible * dobles * 0.9;
      // Otra fase que la primera: en el juego "sus cráteres no coinciden".
      // Abajo y a la derecha: en 0,665 x 0,235 caía DETRÁS del grabado del
      // título y no se veía (cazado mirando la captura).
      lunaEn(W * 0.930, H * 0.290, r2, (fase + 3) % 8, sangriento, colTxt);
    }
    ctx.restore();
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

  var dtCuadro = 0.016;
  function pintar(dt) {
    reloj += dt;
    dtCuadro = dt;

    // ¿Toca virar de marea? (con ?marea= fija, nunca)
    var desde = reloj - ultimoCambio;
    if (!FIJA && desde > CICLO_MS / 1000) {
      cruce = Math.min(1, (desde - CICLO_MS / 1000) / (CRUCE_MS / 1000));
      if (cruce >= 1) {
        indice = siguiente;
        siguiente = (siguiente + 1) % MAREAS.length;
        cruce = 0;
        ultimoCambio = reloj;
        fase = (fase + 1) % 8;   // cada marea, una luna: se ven las ocho
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

    // ── estrellas, luna (con su fase) y las noches raras ──
    pintarCielo();

    // ── nubes: cruzan el cielo por delante de la luna ──
    for (var nu = 0; nu < nubes.length; nu++) dibujarNube(nubes[nu]);

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

    // ── lo que hay en el horizonte, detrás de todas las hileras ──
    for (var le = 0; le < lejanias.length; le++) dibujarLejania(lejanias[le], H * 0.505);

    // ── hileras + todo lo que vive entre ellas ──
    poblar();
    correrDeriva(dtCuadro);

    // Todo lo de una capa se dibuja ANTES de su hilera: emerge de ella.
    function bestiasDe(capa, aguaY) {
      var i;
      for (i = 0; i < barcas.length; i++) if (barcas[i].capa === capa) dibujarBarca(barcas[i], aguaY);
      for (i = 0; i < apariciones.length; i++) if (apariciones[i].capa === capa) dibujarAparicion(apariciones[i], aguaY);
      for (i = 0; i < deriva.length; i++) if (deriva[i].capa === capa) dibujarDeriva(deriva[i], aguaY);
      for (i = 0; i < saltos.length; i++) if (saltos[i].capa === capa) dibujarSalto(saltos[i], aguaY);
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
        /* Respaldo mientras el PNG viaja por la red. Se construye de la propia
           hilera: antes venía de TIRAS[2+h], una tabla paralela que había que
           mantener a la par — con diez hileras se habría salido de ella. */
        var f = h / (HILERAS.length - 1);
        var ct = mezcla(horiz, hondo, 0.35 + f * 0.65);
        ct = mezcla(ct, [0, 0, 0], 0.16 + f * 0.34);
        dibujarTira({ y: hil.y, amp: hil.alto * 0.20, onda: 0.0035 + f * 0.011,
                      vel: 0.12 + f * 0.8 }, ct, reloj);
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
  cargarDe('lunas', 'fase_' + fase);   // la de esta noche, ya

  medir();
  // Con "reduzca el movimiento" pintamos UN cuadro y lo dejamos quieto.
  if (quieto) { pintar(0); } else { arrancar(); }

  // ── Lo que el resto del sitio puede pedirle al mar ─────────────────────
  window.Mar = {
    MAREAS: MAREAS,
    mareaActual: function () { return MAREAS[indice]; },
    // Qué se ve hoy ahí arriba: la fase de la luna y, si la hay, la noche rara.
    cieloActual: function () {
      var raro = CIELO_DE[MAREAS[indice].id];
      return { fase: FASES[fase], cielo: raro ? CIELOS[raro] : null };
    },
    alCambiarMarea: function (fn) {
      oyentes.push(fn);
      fn(MAREAS[indice], indice);   // arranca sabiendo qué mar hay
    },
    rgb: rgb
  };
})();
