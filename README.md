# SSS — sitio de Sweet Sweet Sea

Web pública del juego, servida por GitHub Pages en
<https://dybitsolutions.github.io/SSS/>.

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` | La portada del juego. |
| `privacidad.html` | **La política de privacidad** (ES + EN). Es la que enlaza Google Play Console. |
| `css/estilo.css` | Toda la hoja de estilo. Paleta y tipografía del juego (Cinzel + EB Garamond). |
| `js/mar.js` | El mar de fondo: cielo, luna, olas y bestias que emergen. |
| `js/sitio.js` | Telón de entrada, idioma, música y rótulo de marea. |
| `assets/` | Arte del juego ya optimizado a WebP. |
| `_prueba_movil.html` | Andamio de pruebas: el móvil dentro de un iframe de 412 px (no se versiona). |
| `_foto.ps1` | Fotografía la web con Edge sin ventana (no se versiona). |

Sin dependencias, sin compilación, sin backend: se abre `index.html` y ya.
Lo único externo son las fuentes de Google Fonts.

## El sitio va por pantallas

Se recorre como el menú de un juego. La **portada** es la cubierta —logo, lema,
dos botones y los **rumbos**— y no lleva texto largo: ahí el contenido es el mar
vivo y lo que asoma en él. Cada sección (`#juego`, `#bestiario`, `#noche`,
`#mareas`, `#jugar`) es una **pantalla** que se abre encima del agua, de una en
una, con su *volver al mar* arriba y su *siguiente* al pie.

Manda la dirección: `#bestiario` abre el bestiario, así que los enlaces de la
barra, los del héroe y cualquiera que alguien tenga guardado siguen valiendo.
Escapar vuelve a cubierta.

**El contenido nunca puede quedarse invisible**: quien esconde las pantallas es
el atributo `data-pantallas` que pone `js/sitio.js`. Sin JavaScript el CSS no
esconde nada y la página se lee entera de arriba abajo, como antes. Lo mismo con
`?tira=1`, la foto de la página completa.

El **velo** sobre el mar cambia con la pantalla: en la portada pesa poco (el mar
es el contenido) y en las de leer se cierra, porque un párrafo largo sobre agua
clara no hay quien lo lea.

## El mar no se inventa los colores

`js/mar.js` lleva la tabla de las seis mareas con los valores de `GM.MAREAS`
del juego (campo `agua`: `[hondo, horizonte]`), pasados de 0-1 a 0-255. Si una
marea cambia de color en el juego, aquí hay que cambiarla a mano — es la única
copia manual y está marcada con un comentario en el propio archivo.

La prismática no lleva color: los cicla, igual que `GM.color_prismatica()`.

### Las tiras de agua

`assets/olas/*.webp` son los **PNG de verdad** del juego
(`assets/sprites/mundo/mar_tira_N.png`), a dieta. El número de cada marea sale
de `world_sea.gd::_paleta_mar()` y de `GM.MAREAS.tiras` (se usa la tira
*cercana*, que es la que se ve):

| Web | Tira del juego | De dónde |
|---|---|---|
| `calma` | 1 | día par `[1,1,3]` |
| `dorada` | 12 | `GM.MAREAS.dorada` |
| `sangre` | 10 | `GM.MAREAS.sangre` |
| `leche` | 11 | `GM.MAREAS.leche` |
| `rosada` | 9 | `GM.MAREAS.rosada` |
| `sargazo` | 5 | `GM.MAREAS.sargazo` |
| `noche` | 3 | noche `[3,3,6]` — decora el pie de la sección "La noche" |

Se piden **la de ahora y la de después** (y las dos ya en el arranque, no en el
primer cuadro: si no, el mar sale con las olas de respaldo hasta que llegan).
La prismática no tiene tira propia: usa la de calma con el tono girando.

**Cinco hileras, solapadas.** Eran tres y empezaban en 0,64: entre el horizonte
y esa primera hilera quedaba una franja del relleno plano —el color claro del
horizonte— que se leía como cielo tumbado, no como agua. Ahora la llevan las
cinco, desde 0,504 hasta pasado el borde de abajo, y cada una **empieza antes de
que acabe la anterior**: el PNG trae su cuarto de arriba en degradado (la
cresta), así que una hilera pegada al filo de la otra vuelve a enseñar el
relleno.

Al dibujarlas se **ensanchan** hasta pasar del ancho de la ventana
(`HILERAS[].estira`): a su proporción natural la tira entra dos o tres veces en
pantalla y el ojo caza el patrón, que se lee como papel pintado y no como agua.

Y las copias **impares se pintan del revés**: la tira no empalma consigo misma
(su borde izquierdo no continúa al derecho) y cada repetición dejaba una costura
vertical. Espejada, cada junta enfrenta un borde con su propio reflejo y encaja
por construcción — de paso el patrón dura el doble.

## Flags de captura

En la barra de direcciones, al estilo de los flags del juego:

| Flag | Qué hace |
|---|---|
| `?marea=dorada` | Fija una marea y deja de ciclar. Vale cualquier `id` de la tabla. |
| `?ya=1` | Las bestias nacen ya emergidas y la página aparece sin animaciones de entrada. |
| `?ir=<id>` | **Abre esa pantalla** y carga las imágenes de golpe. |
| `?tira=1` | Apaga las pantallas: la página entera, seguida, para una toma larga. |

Cualquiera de ellos se salta el telón de entrada.

### Trampas de capturar esto con Edge sin ventana

1. `--virtual-time-budget` **se cuelga** con un `requestAnimationFrame` perpetuo.
   Por eso con `?ir=` el mar pinta 80 cuadros y se detiene.
2. Edge sin ventana **ignora el ancla** (`#seccion`) de la URL al capturar: para
   eso está `?ir=`. (El `#hash` sí funciona para abrir una pantalla, porque de
   eso se encarga el JS, no el desplazamiento del navegador.)
3. Windows **no abre ventanas de menos de ~500 px**, así que una captura a 412
   sale recortada y parece un desbordamiento que no existe. El móvil se mira
   dentro de un iframe de 412 (`_prueba_movil.html`).

## Pendiente

- **Steam**: cuando la ficha esté publicada, cambiar la tarjeta "Próximamente"
  de `index.html` por el botón real de lista de deseados.
- **Captcha**: hay un hueco preparado y comentado en la sección "Avisarme del
  zarpe" de `index.html`, para Cloudflare Turnstile cuando se compre el dominio.
  Hoy no hay formulario a propósito: la política dice que no recogemos datos.
