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
| `_prueba_movil.html` | Andamio de pruebas (no se versiona, ver `.gitignore`). |

Sin dependencias, sin compilación, sin backend: se abre `index.html` y ya.
Lo único externo son las fuentes de Google Fonts.

## El mar no se inventa los colores

`js/mar.js` lleva la tabla de las seis mareas con los valores de `GM.MAREAS`
del juego (campo `agua`: `[hondo, horizonte]`), pasados de 0-1 a 0-255. Si una
marea cambia de color en el juego, aquí hay que cambiarla a mano — es la única
copia manual y está marcada con un comentario en el propio archivo.

La prismática no lleva color: los cicla, igual que `GM.color_prismatica()`.

## Flags de captura

En la barra de direcciones, al estilo de los flags del juego:

| Flag | Qué hace |
|---|---|
| `?marea=dorada` | Fija una marea y deja de ciclar. Vale cualquier `id` de la tabla. |
| `?ya=1` | Las bestias nacen ya emergidas y la página aparece sin animaciones de entrada. |
| `?ir=<id>` | Coloca la vista en esa sección y carga las imágenes de golpe. |
| `?tira=1` | Encoge el héroe para que la página entera quepa en una toma larga. |

Cualquiera de ellos se salta el telón de entrada.

### Trampas de capturar esto con Edge sin ventana

1. `--virtual-time-budget` **se cuelga** con un `requestAnimationFrame` perpetuo.
   Por eso con `?ir=` el mar pinta 80 cuadros y se detiene.
2. Edge sin ventana **ignora el ancla** (`#seccion`) de la URL al capturar: para
   eso está `?ir=`.
3. Windows **no abre ventanas de menos de ~500 px**, así que una captura a 412
   sale recortada y parece un desbordamiento que no existe. El móvil se mira
   dentro de un iframe de 412 (`_prueba_movil.html`).

## Pendiente

- **Steam**: cuando la ficha esté publicada, cambiar la tarjeta "Próximamente"
  de `index.html` por el botón real de lista de deseados.
- **Captcha**: hay un hueco preparado y comentado en la sección "Avisarme del
  zarpe" de `index.html`, para Cloudflare Turnstile cuando se compre el dominio.
  Hoy no hay formulario a propósito: la política dice que no recogemos datos.
