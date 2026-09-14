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
| `assets/bestias/` | Las criaturas: 4 grandes, 4 medianas y 15 pequeñas (WebP). |
| `assets/peces/` | Los once peces de la mochila: la tabla de la pesca y los saltos. |
| `assets/mar/` | Barcas náufragas, isla, roca, lo que flota y las nubes. |
| `assets/items/` | Las cuatro armas, la botella y la llave. |
| `assets/gente/` | Los cuatro marineros jugables y los seis vecinos del muelle. |
| `assets/comida/` | Los doce platos del fogón, con sus grabados. |
| `assets/baratijas/` | Lo que la draga sube del fondo del puerto. |
| `assets/lunas/` | Las ocho fases pintadas + la de sangre (las del instrumental del juego). |
| `assets/celular/` | La placa de conexión y el carrete del instrumental. |
| `site.webmanifest` | Para que el sitio se pueda "instalar" en el móvil (nombre, iconos, color). |
| `robots.txt` · `sitemap.xml` | Lo que leen los buscadores. |
| `assets/olas/` | Las tiras de agua de cada marea. |
| `_prueba_movil.html` | Andamio de pruebas: el móvil dentro de un iframe de 412 px (no se versiona). |
| `_foto.ps1` | Fotografía la web con Edge sin ventana (no se versiona). |

Sin dependencias, sin compilación, sin backend: se abre `index.html` y ya.
Lo único externo son las fuentes de Google Fonts.

## El sitio va por pantallas

Se recorre como el menú de un juego. La **portada** es la cubierta —logo, lema,
dos botones y los **rumbos**— y no lleva texto largo: ahí el contenido es el mar
vivo y lo que asoma en él. Las **ocho pantallas** (`#juego`, `#juegas`,
`#muelle`, `#marineros`, `#bestiario`, `#noche`, `#mareas` —que se llama *El
mar* y lleva las mareas **y las islas**—, `#jugar`) se abren encima del agua, de
una en una, con su *volver al mar* arriba y su *siguiente* al pie.

Se recorren también **con el teclado**: las flechas ← → pasan de una a otra y
Escape vuelve a cubierta. Al abrirse, el foco viaja con la pantalla — sin eso,
quien navega con teclado o con lector se quedaba con el foco en la barra
mientras la página entera cambiaba debajo.

Desde 1080 px hacia abajo la barra no cabe: el botón **≡** despliega las ocho
(antes la navegación desaparecía del todo en el móvil y desde una sección solo
se podía volver a la portada).

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

## Lo que vive en el mar del fondo

No es un fondo animado cualquiera: todo lo que se mueve ahí es material del
juego, y por eso el mar de la web se parece al del juego.

| Qué | De dónde | Cómo se porta |
|---|---|---|
| **Bestias** | `assets/bestias` | Emergen, se quedan mirando y se hunden. Tres tamaños con su horquilla, y **una de cada siete grandes sale colosal**. Siempre hay UNA prismática. Al nacer buscan sitio lejos de las demás (si no, se apelotonan en el mismo palmo de agua). |
| **Colosos** | `assets/bestias` | El Leviatán y el Kraken van aparte: salen en las hileras del **fondo**, ocupan un tercio de pantalla, suben despacio, se quedan mucho y van **a contraluz**. A esa distancia, ese tamaño solo puede ser algo imposible. |
| **El horizonte** | `assets/mar` | Isla en la niebla, roquedo, la **ciudad negra** (grande: es el final del juego asomando) y la isla de oro. Asoman y se borran; nunca se acercan. |
| **Peces** | `assets/peces` | Saltan en parábola con el morro siguiendo la curva y su chapoteo al salir y al entrar. |
| **Barcas náufragas** | `assets/mar` | Cruzan las hileras de lejos, a contraluz, muy despacio. |
| **Lo que flota** | `assets/mar` | Boya, barril, algas, huesos y maderos cabeceando en las hileras de cerca. |
| **Nubes** | `assets/mar` | Cruzan el cielo por delante de la luna, casi transparentes. |

**Lo grande sale por los costados** (`xLateral()`): en el centro de la portada
vive el grabado del título, y un coloso o la ciudad negra plantados ahí se
esconden detrás de él — se pierde justo lo que se quería enseñar.

Todo se pide **cuando le toca salir**, no al abrir la página: con treinta y
tantas piezas, precargarlas todas era medio mega antes de ver nada. Y al abrir
hay una **siembra** (una barca, un par de restos, unas nubes ya puestos), porque
lo que entra por un borde tarda un minuto en cruzar y el mar arrancaba vacío.

## Las ocho lunas y las noches raras

La luna llevaba siempre la misma mordida. Ahora:

- Arranca en la **fase real de hoy** (como en el juego, donde la luna del reloj
  del móvil es la de verdad) y **avanza una con cada marea**: quien se quede un
  rato las ve las ocho.
- Son las **ocho fases pintadas** del juego (`assets/lunas`, las mismas que usa
  el instrumental del celular), y la **de sangre** tiene su propio grabado: en
  la marea de sangre se cruza de una a otra.
- Debajo sigue el disco **dibujado a mano** como respaldo exacto para el rato en
  que el PNG aún viaja por la red. Se pinta en un **lienzo aparte** y se pega ya
  recortado: la mordida se hace con `destination-out`, que en el lienzo grande
  abriría un agujero al negro del fondo (el bug del 13 sep). La sombra es media
  luna + una elipse: si la luz es menos de media, la elipse **come** sombra; si
  es más (gibosa), **devuelve** luz.
- Cada marea con carácter trae **su cielo**, de la tabla `GM.FENOMENOS` del
  juego: la de sangre trae la **Luna de Sangre**, la prismática **Las Dos Lunas**
  (la segunda es más chica, lleva otra fase y late), la de leche vela la luna en
  niebla y el sargazo se queda **sin estrellas**. El rótulo lo nombra — en el
  juego la noche siempre dice su causa.

## Lo que no se ve

- **La ficha del juego para los buscadores** (`schema.org/VideoGame`, en el
  `<head>`): convierte un enlace suelto en una tarjeta con plataformas, ofertas
  y capturas. Esta página es la que apuntará desde la ficha de Steam, así que
  conviene que se presente bien. Lleva también `canonical`.
- **`site.webmanifest`**: el sitio se puede añadir a la pantalla de inicio del
  móvil con el icono de la app y el color del abismo.
- **`robots.txt` + `sitemap.xml`**: la portada y la política, nada más — el
  resto del sitio son pantallas de la misma página.

## Que no se atasque

El mar es un fondo, no el contenido, y tiene que costar poco:

- **El tinte se cocina una vez.** Cada bestia, pez y barca se dibujaba con
  `ctx.filter` puesto — y un filtro de lienzo se recalcula en CADA `drawImage`.
  Con treinta piezas en el agua, eso era lo que atascaba la página. Ahora el
  sprite teñido se guarda en un lienzo aparte y luego solo se pega. El único
  filtro en vivo es el del iris, que tiene que girar de tono, y es UNA bestia.
- **Densidad 1,5** (antes 2 en escritorio): pintar el cuádruple de píxeles
  sesenta veces por segundo no se nota en un fondo, pero se siente en el
  ventilador.
- La pestaña oculta **para** el bucle, y `prefers-reduced-motion` pinta un solo
  cuadro y lo deja quieto.

## Flags de captura

En la barra de direcciones, al estilo de los flags del juego:

| Flag | Qué hace |
|---|---|
| `?marea=dorada` | Fija una marea (y su cielo) y deja de ciclar. Vale cualquier `id` de la tabla: `sangre` trae la luna roja, `prismatica` las dos lunas, `leche` la velada y `sargazo` la noche sin estrellas. |
| `?ya=1` | Las bestias nacen ya emergidas y la página aparece sin animaciones de entrada. |
| `?ir=<id>` | **Abre esa pantalla** y carga las imágenes de golpe. |
| `?tira=1` | Apaga las pantallas: la página entera, seguida, para una toma larga. |
| `?coloso=1` | Planta un coloso (Leviatán o Kraken) ya emergido: salen por lotería y una foto no espera. |
| `?silueta=<id>` | Fija lo que asoma en el horizonte: `isla`, `roca`, `ciudad`, `isla_oro`. |
| `?menu=1` | Deja el menú de la barra desplegado (un clic no cabe en una foto). |
| `?postal=1` | La portada DESNUDA: solo el grabado, el lema y el mar. De aquí sale `assets/og.webp`, la imagen que se ve al compartir el enlace. |

Cualquiera de ellos se salta el telón de entrada.

### Trampas de capturar esto con Edge sin ventana

1. `--virtual-time-budget` **se cuelga** con un `requestAnimationFrame` perpetuo.
   Por eso con `?ir=` el mar pinta 80 cuadros y se detiene.
2. Edge sin ventana **ignora el ancla** (`#seccion`) de la URL al capturar: para
   eso está `?ir=`. (El `#hash` sí funciona para abrir una pantalla, porque de
   eso se encarga el JS, no el desplazamiento del navegador.)
3. Edge sin ventana **rinde en un viewport MÁS PEQUEÑO que la ventana pedida**
   (con `--window-size=1220,715` el área útil fue 1194×622) y rellena el resto
   de negro. Para una imagen de medida exacta —la tarjeta social son 1200×630—
   hay que pedir de más y **recortar el área no negra** antes de escalar.
4. Windows **no abre ventanas de menos de ~500 px**, así que una captura a 412
   sale recortada y parece un desbordamiento que no existe. El móvil se mira
   dentro de un iframe de 412 (`_prueba_movil.html`).

## Pendiente

- **Steam**: cuando la ficha esté publicada, cambiar la tarjeta "Próximamente"
  de `index.html` por el botón real de lista de deseados.
- **Captcha**: hay un hueco preparado y comentado en la sección "Avisarme del
  zarpe" de `index.html`, para Cloudflare Turnstile cuando se compre el dominio.
  Hoy no hay formulario a propósito: la política dice que no recogemos datos.
