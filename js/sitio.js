/* ═══════════════════════════════════════════════════════════════════════
   EL SITIO — telón de entrada, idioma, música y rótulo de marea.
   Todo degrada con elegancia: sin JS la web se lee entera en español.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // localStorage falla en ventanas privadas y con las cookies bloqueadas:
  // aquí solo guarda comodidades, así que un fallo nunca puede romper nada.
  var memoria = {
    leer: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    grabar: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* da igual */ } }
  };

  var cuerpo = document.body;

  // ── IDIOMA ────────────────────────────────────────────────────────────
  function ponerIdioma(lang) {
    cuerpo.classList.toggle('lang-es', lang === 'es');
    cuerpo.classList.toggle('lang-en', lang === 'en');
    document.documentElement.lang = lang;
    memoria.grabar('sss_lang', lang);
  }

  var guardado = memoria.leer('sss_lang');
  if (guardado === 'es' || guardado === 'en') {
    ponerIdioma(guardado);
  } else {
    // Sin preferencia previa: todo el que no hable español ve inglés.
    var nav = (navigator.language || 'es').toLowerCase();
    ponerIdioma(nav.indexOf('es') === 0 ? 'es' : 'en');
  }

  var btnIdioma = document.getElementById('btn-idioma');
  if (btnIdioma) {
    btnIdioma.addEventListener('click', function () {
      ponerIdioma(cuerpo.classList.contains('lang-es') ? 'en' : 'es');
    });
  }

  // ── MÚSICA ────────────────────────────────────────────────────────────
  // menu_guitarra.mp3 — la pista del menú, generada para el juego.
  var musica = document.getElementById('musica');
  var btnAudio = document.getElementById('btn-audio');
  var VOLUMEN = 0.5;
  var fundido = null;

  function fundir(hacia, alTerminar) {
    if (!musica) return;
    clearInterval(fundido);
    var paso = (hacia - musica.volume) / 26;
    fundido = setInterval(function () {
      var v = musica.volume + paso;
      if ((paso > 0 && v >= hacia) || (paso < 0 && v <= hacia) || paso === 0) {
        musica.volume = Math.max(0, Math.min(1, hacia));
        clearInterval(fundido);
        if (alTerminar) alTerminar();
      } else {
        musica.volume = Math.max(0, Math.min(1, v));
      }
    }, 55);
  }

  function sonar() {
    if (!musica) return Promise.reject();
    musica.volume = 0;
    var p = musica.play();
    // El navegador puede negarse si no hubo gesto: se avisa al botón y ya.
    return (p && p.then ? p : Promise.resolve()).then(function () {
      fundir(VOLUMEN);
      if (btnAudio) btnAudio.setAttribute('aria-pressed', 'true');
      memoria.grabar('sss_audio', '1');
    });
  }

  function callar() {
    fundir(0, function () { if (musica) musica.pause(); });
    if (btnAudio) btnAudio.setAttribute('aria-pressed', 'false');
    memoria.grabar('sss_audio', '0');
  }

  if (btnAudio) {
    btnAudio.addEventListener('click', function () {
      if (btnAudio.getAttribute('aria-pressed') === 'true') callar();
      else sonar().catch(function () { /* el navegador dijo que no */ });
    });
  }

  // ── EL TELÓN ──────────────────────────────────────────────────────────
  var telon = document.getElementById('telon');
  var zarpar = document.getElementById('zarpar');
  // Quien llega por un enlace profundo (…/#bestiario) va a ver algo concreto:
  // la cinemática ahí estorbaría. Y da un modo de entrada limpio para capturas.
  var enlaceProfundo = location.hash && location.hash.length > 1;
  // Los flags de captura también entran directos: si no, toda foto del sitio
  // sale con el telón puesto (que es justo lo que pasó la primera vez).
  var modoCaptura = false;
  try {
    var q = new URLSearchParams(location.search);
    modoCaptura = q.has('ya') || q.has('ir') || q.has('tira') || q.has('marea');
  } catch (e) {}
  var yaEstuvo = memoria.leer('sss_visitado') === '1' || enlaceProfundo || modoCaptura;

  function abrirTelon(conMusica) {
    if (!telon) return;
    telon.classList.add('zarpando');
    cuerpo.style.overflow = '';
    if (conMusica) sonar().catch(function () { /* sin música, pero entra igual */ });
    setTimeout(function () { telon.hidden = true; }, 1800);
    memoria.grabar('sss_visitado', '1');
  }

  if (telon && zarpar && !yaEstuvo) {
    telon.hidden = false;
    cuerpo.style.overflow = 'hidden';
    zarpar.addEventListener('click', function () { abrirTelon(true); });
    // Escapar también entra (sin música).
    document.addEventListener('keydown', function (e) {
      if (!telon.hidden && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        abrirTelon(e.key !== 'Escape');
      }
    });
  } else if (telon) {
    telon.hidden = true;
  }

  // El salto al ancla de la carga lo hace el navegador, seco y exacto.
  // El desplazamiento suave se enciende después, para los clics del menú.
  window.addEventListener('load', function () {
    setTimeout(function () { document.documentElement.classList.add('suave'); }, 120);
  });

  /* ?ir=<id> — flag de captura. Un navegador sin ventana ignora el ancla de
     la URL, y las imágenes perezosas mueven el suelo mientras cargan: este
     flag las trae todas de golpe y reafirma la posición hasta que el alto
     de la página deja de cambiar. Para las fotos del sitio, nada más. */
  (function () {
    var destinoId;
    try { destinoId = new URLSearchParams(location.search).get('ir'); } catch (e) { return; }
    if (!destinoId) return;

    Array.prototype.forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (im) {
      im.loading = 'eager';
    });

    var golpes = 0;
    var fijar = setInterval(function () {
      var el = document.getElementById(destinoId);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset);
      if (++golpes > 24) clearInterval(fijar);
    }, 100);
  })();

  if (telon && telon.hidden) {
    // Quien ya entró y dejó la música puesta la recupera en su primer clic:
    // ningún navegador deja sonar nada sin un gesto previo.
    if (memoria.leer('sss_audio') === '1') {
      var reanudar = function () {
        sonar().catch(function () {});
        document.removeEventListener('pointerdown', reanudar);
      };
      document.addEventListener('pointerdown', reanudar, { once: true });
    }
  }

  // ── RÓTULO DE LA MAREA VIVA ───────────────────────────────────────────
  var elNombre = document.getElementById('marea-nombre');
  var elNota = document.getElementById('marea-nota');
  var elRotulo = document.getElementById('rotulo-marea');

  function dosLenguas(es, en) {
    return '<span class="es">' + es + '</span><span class="en">' + en + '</span>';
  }

  if (window.Mar && elNombre && elNota) {
    window.Mar.alCambiarMarea(function (m) {
      elNombre.innerHTML = dosLenguas(m.es, m.en);
      elNota.innerHTML = dosLenguas(m.notaEs, m.notaEn);
      if (elRotulo) {
        var acento = m.id === 'prismatica'
          ? '#d9a7ff'
          : window.Mar.rgb([
              Math.min(255, m.horiz[0] + 62),
              Math.min(255, m.horiz[1] + 62),
              Math.min(255, m.horiz[2] + 62)
            ]);
        elRotulo.style.setProperty('--marea-acento', acento);
      }
    });

    // ── La lista de mareas: misma tabla, mismos colores ──
    var lista = document.getElementById('lista-mareas');
    if (lista) {
      window.Mar.MAREAS.forEach(function (m) {
        var li = document.createElement('li');
        var muestra;
        if (m.id === 'prismatica') {
          li.className = 'es-iris';
          muestra = 'linear-gradient(140deg,#ff8a8a,#ffe08a,#8affc0,#8ad2ff,#c89aff)';
        } else {
          muestra = 'linear-gradient(180deg,' + window.Mar.rgb(m.horiz) + ',' + window.Mar.rgb(m.hondo) + ')';
        }
        li.innerHTML =
          '<span class="mareas__muestra" style="background:' + muestra + '"></span>' +
          '<span><span class="mareas__nombre">' + dosLenguas(m.es, m.en) + '</span>' +
          '<span class="mareas__regla">' + dosLenguas(m.reglaEs, m.reglaEn) + '</span></span>';
        lista.appendChild(li);
      });
    }
  }

  // ── APARICIONES AL DESPLAZAR ──────────────────────────────────────────
  // Regla de oro: el contenido NUNCA puede quedarse invisible. La clase que
  // lo esconde solo se pone si hay quien vaya a quitarla, y aun así un
  // temporizador de seguridad lo destapa todo pase lo que pase.
  var SELECTOR = '.carta, .bestia, .prismatica, .mutaciones li, .mareas li,' +
                 '.capturas figure, .tienda, .titulo, .parrafo';

  // ?ya=1 (el flag de captura del mar) deja la página entera ya puesta.
  var sinAnimar = false;
  try {
    var qs = new URLSearchParams(location.search);
    sinAnimar = qs.get('ya') === '1';
    if (qs.get('tira') === '1') cuerpo.classList.add('tira');
  } catch (e) {}

  function destaparTodo() {
    var todos = document.querySelectorAll('.aparece');
    Array.prototype.forEach.call(todos, function (el) { el.classList.add('visible'); });
  }

  if (sinAnimar || !('IntersectionObserver' in window)) {
    // Nada que animar: se ve todo desde el primer cuadro.
  } else {
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          vigia.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    var observar = function (raiz) {
      Array.prototype.forEach.call(raiz.querySelectorAll(SELECTOR), function (el) {
        if (el.classList.contains('aparece')) return;
        el.classList.add('aparece');
        vigia.observe(el);
      });
    };
    observar(document);
    // La lista de mareas la escribe el JS un instante después.
    setTimeout(function () { observar(document); }, 80);
    // El seguro: si algo se tuerce, a los 3 s la página se ve entera igual.
    setTimeout(destaparTodo, 3000);
  }
})();
