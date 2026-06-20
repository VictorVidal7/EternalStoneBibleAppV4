# Eternal Stone Bible — página de enlaces (GitHub Pages)

Redirector estático **$0, sin servidor** que hace que los enlaces de la app
(planes y estudios compartidos) sean **clickeables en WhatsApp**.

Los mensajeros solo convierten en enlace las URLs `http(s)://`, no el esquema
propio `eternalbible://`. Esta página recibe un enlace `https://…/o/#d=<contenido>`
y salta a `eternalbible://features/together?d=<contenido>`, que la app ya
entiende (la pantalla de unión reenvía los estudios a su visor).

El contenido viaja en el **#fragmento** de la URL, así que **nunca llega a los
servidores de GitHub**: la página es de conocimiento cero.

## Cómo publicar

1. Crea una **organización** de GitHub gratuita con el nombre de la app
   (ej. `EternalStoneBible`). Esto evita que tu nombre personal salga en la URL.
2. Dentro de la organización, crea un repo llamado **`eternalstonebible.github.io`**
   (debe coincidir exactamente con `<organización>.github.io`).
3. Copia el contenido de esta carpeta `web/` a la **raíz** de ese repo:
   - `index.html`
   - `o/index.html`
   - `.well-known/assetlinks.json`
   - `.nojekyll` ← necesario para que GitHub sirva `.well-known/`
4. En el repo: **Settings → Pages → Source: Deploy from a branch → `main` / root**.
5. A los ~1–2 min, verifica:
   - `https://eternalstonebible.github.io/o/#d=PRUEBA` (debe mostrar la página)
   - `https://eternalstonebible.github.io/.well-known/assetlinks.json`

Si registras la organización con **otro nombre**, avísame: solo hay que cambiar
una constante (`ETERNAL_WEB_BASE` en `src/lib/together/bundle.ts`).

## `assetlinks.json`

Queda listo para el futuro "abrir directo sin pasar por el navegador" (Android
App Links). Eso, además, requiere un intent-filter en `app.json` y recompilar el
APK; por ahora no es necesario — la redirección por navegador ya funciona.
