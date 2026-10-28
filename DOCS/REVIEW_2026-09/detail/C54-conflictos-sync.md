# C54 — Resolución de conflictos de sync (Modo C, sesión 115)

**Estado: PENDIENTE — «sin medir» por decisión de Victor en la 115.** No tuvo agente.

## Por qué no se midió

- El sync solo corre con una cuenta NO anónima (`src/context/SyncEngineContext.tsx:93`: `user &&
!user.isAnonymous`), y la app de cada instancia arranca con una cuenta anónima.
- La única cuenta de Google del AVD es la REAL de Victor: iniciar sesión con ella haría que los conflictos se
  escribieran en sus datos reales de Firestore.
- Victor eligió dejarla «sin medir» (junto con `C55`), con la receta escrita para otra sesión. El 7.º agente
  se usó para lo «de paso» (`R9-417`, `R9-412`).

## La receta, para cuando toque

- Una cuenta de Google de PRUEBA (no la de Victor), agregada por él en una instancia de solo lectura del AVD
  (Ajustes del sistema → Cuentas; la instancia se descarta al apagar); la app inicia sesión con ella.
- El 2.o dispositivo: `scripts/device2.js` (clave de admin, gitignorada, solo en el principal), SIEMPRE con
  `--uid=<el uid de la cuenta de prueba>` explícito: **su uid por defecto es la cuenta real de Victor**. El
  subcomando `conflict` sella `updatedAt` dentro de la ventana de conflicto. Todo doc escrito, borrado al
  terminar (`device2.js delete ... --uid=...`).
- Alternativa: dos instancias de solo lectura con la misma cuenta de prueba (cada emulador compromete ~6,4 GB:
  ver el techo en `CONTINUAR.md` §6).
