# Pendientes en vivo (método rápido, punto 6)

El archivo único de lo «no medible en jest». Una sesión de emulador cada dos olas; nada de esto bloquea. Cada línea
dice qué mirar y de qué hallazgo viene. Se tacha con la sesión que lo midió. Nunca el teléfono de Victor.

## De la 188b

- Pegar, el aviso a 2,0 y en español, el paseo de `R9-498` («(2/2)» arriba), «Reabrir», la Mesa y el toast de
  `R9-415` (ya con host desde `f3591bac`). Detalle: `detail/S188-revision-del-diff-s187.md`.

## Esperando algo externo

- `R9-135`: espera la cuenta de Google de prueba.

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
