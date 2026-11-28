# Pendientes en vivo (método rápido, punto 6)

El archivo único de lo «no medible en jest». Una sesión de emulador cada dos olas; nada de esto bloquea. Cada línea
dice qué mirar y de qué hallazgo viene. Se tacha con la sesión que lo midió. Nunca el teléfono de Victor.

## De la 188b

- Pegar, el aviso a 2,0 y en español, el paseo de `R9-498` («(2/2)» arriba), «Reabrir», la Mesa y el toast de
  `R9-415` (ya con host desde `f3591bac`). Detalle: `detail/S188-revision-del-diff-s187.md`.

## Esperando algo externo

- `R9-135`: espera la cuenta de Google de prueba; la crea la sesión de emulador (`_scratch/S192e-PROMPT.md`) con Victor presente.

## De la ola 1 (sesión 190)

- **Toasts (`R9-637`, `R9-454`, `R9-638`):**
  - el toast dentro de cada modal que «daña» (ráfaga de capturas antes del toque), en Android;
  - el host como hijo directo del Modal (en `d991b711` iba dentro de la View de pantalla completa);
  - las tintas nuevas en claro, oscuro y alto contraste;
  - «Copia lista» a 2,0 en español: cuántas líneas ocupa con el tope 6, y cuánto tapa un aviso de 6 líneas arriba;
  - el toast que se monta sobre la barra de estado (`R9-638`).
- **Sync (`R9-164`):**
  - si en RNFirebase la primera entrega del servidor (con `includeMetadataChanges`), sumada a la de la caché, nombra
    todo retenido que sigue en la query;
  - si `get()` cae a la caché cuando la red se corta justo después de esa entrega;
  - el hilo nativo único (`R9-177`) con varias lecturas colgadas (`R9-645`).
- **Mesa y búsqueda:**
  - `R9-58`: que el proceso muera de verdad en segundo plano y lo tecleado siga;
  - `R9-474`: un toque doble durante la transición nativa;
  - `R9-430`: la pestaña de búsqueda que conserva su estado mientras el lector cambia la versión;
  - `R9-167` y `R9-648`: el orden real entre la relectura del foco, un campo que conserva el foco y un toque al volver
    del banco (si el blur pisa la ilustración, `R9-648` sube a P2).
- **Estudio (`R9-601`):** el fallo real de `getItem` (disco lleno, proceso muriendo) no se reproduce en jest.

## De la ola 2 (sesión 191)

Lo que la revisión NO cubrió va primero: es condición de publicar. Detalle: `detail/S191-ola2.md`.

- **Dinero (carril 8), antes de publicar nada de este carril:**
  - el orden: desplegar `vercel/gift-code-redeem` ANTES de una app con los plazos de `R9-620` (por la autorización
    durable de la §7, con su comprobación previa); medir el cliente nuevo contra el servidor viejo (el revisor C no llegó);
  - `R9-418`: la hoja de ofrenda en un Pixel 9 Pro con letra normal y GRANDE (la parte fija sola puede pasar el 90 %;
    que «Restaurar» y «Cerrar» se alcancen);
  - `R9-576`: dos toques reales en un cuadro; reabrir con la tienda sin responder muestra «Procesando…»;
  - `R9-577`: el listener real con la hoja abierta; que el grant promocional de RevenueCat sea idempotente para un uid;
  - `R9-620`: los plazos en red lenta y el stream por trozos en Chrome;
  - las suites del carril 8, sin mutar por el revisor: mutarlas en la sesión que lo toque.
- **Cruces que los revisores A y B no miraron:** los carriles 3b, 4, 5 y 6 contra los otros, y sus caminos web.
- **Lector (carril 5):** que las hojas suban con el teclado (`minHeight: 450` en pantallas chicas); el atrás nativo
  con teclado llega a `onRequestClose`; el diálogo de descartar o borrar sobre la hoja; la posición del toast en la
  hoja; TalkBack en las muestras y cabeceras (`R9-566`); el segundo cambio de versión con audio (`R9-423`).
- **Familias y Mesa (carril 3b):** la pantalla real bajo el lector mientras cambia la versión (`R9-486`, `R9-521`,
  `R9-525`); la voz real y el scroll tras la recarga (`R9-525`); el toque doble real y durante la transición
  (`R9-482`); el lector cambiando la versión con la Mesa debajo (`R9-647`); un blur real entre la vuelta del banco y
  la relectura, y la ventana de 700 ms (`R9-648`).
- **Planes y Juntos (carril 4):** `dismissTo` en el aparato (`R9-507`); el parpadeo de entrar y volver (`R9-541`); un
  toque real que no desenfoque (`R9-510`); TalkBack (`R9-542`); el código de 4 partes a mano (`R9-512`).
- **Respaldo (carril 6):** el reset con KJV descargada y elegida, y buscar en KJV (`R9-558`; la recarga real de 62 000
  versículos no corre en jest); el aviso encima del modal «Datos» y el largo de los textos nuevos; el toast de «No se
  restauró nada» dentro del modal (`R9-557`, `R9-560`).
- **Cuentas y sync (carril 9):** que AsyncStorage rechace de verdad en el aparato, y no devuelva `null` (`R9-158`,
  `R9-134`); el orden real entre el evento `null` y la promesa de `deleteUser`, y el estado de invitado sin reiniciar
  (`R9-26`); que en RNFirebase la lectura fallida rechace o venza el plazo, sin red (`R9-646`, `R9-645`).
- **Home y el mazo (carril 10):** el velo oscuro de `R9-456` en ocean, forest, sunset, esmeralda, arena y aurora de
  mañana (claro y oscuro), un tema oscuro de noche y alto contraste; la demora del corazón (`R9-437`); el degradado
  diagonal real.
- **Audio y originales (carril 11):** los huecos reales de 50 ms y ~150 ms (`R9-426`); que el avance continuo entre
  capítulos siga funcionando (el mock de voz nunca dispara `onStopped`); la pronunciación; la descarga real del pack
  con la hoja cerrada y reabierta (`R9-435`).
