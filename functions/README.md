# `functions/` — Cloud Function de canje de gift-codes · **NO DESPLEGADA**

> **Estado: código de referencia / plan B. Esto NO corre en producción.**
> La fuente de verdad del canje de gift-codes es
> **[`vercel/gift-code-redeem/`](../vercel/gift-code-redeem/)**.
> Si vas a cambiar la lógica de canje, cámbiala **allá**, no acá.

## Por qué existe si no se despliega

No es un descuido ni un resto olvidado: está conservado **a propósito**. El motivo, ya
documentado en `src/lib/offering/giftCodeService.ts`, es de facturación:

> Cloud Functions requiere el **plan Blaze**, que convierte el proyecto Firebase
> **entero** a facturación con sobrecosto. El tier gratuito Hobby de Vercel, en
> cambio, tiene **tope duro** de uso sin overage.

O sea que la decisión no fue "Vercel es mejor", fue "no quiero exponer todo el proyecto
Firebase a facturación por medida solo para servir un endpoint de canje". El proyecto
está en **plan Spark** hoy.

Se conserva el código porque es la **salida de emergencia de un solo proveedor en una
ruta de dinero**: si Vercel Hobby cambia sus términos, si el endpoint muere, o si algún
día conviene consolidar todo en Firebase, esta implementación ya está escrita y
revisada. Reescribirla desde cero bajo presión, en el camino de un pago, sería peor.

## Quién llama a qué

```
app  →  src/lib/offering/giftCodeService.ts:44
            REDEEM_GIFT_CODE_URL = https://essb-gift-redeem.vercel.app/api/redeem
                                                    │
                                    ┌───────────────┴───────────────┐
                                    ▼                               ▼
                    vercel/gift-code-redeem/api/redeem.ts     functions/src/index.ts
                              ✅ DESPLEGADA                    ❌ NO desplegada
                         (la que atiende de verdad)            (referencia / plan B)
```

Los códigos se generan aparte con `scripts/generate-gift-codes.js`, que escribe la
colección `giftCodes` con el Admin SDK y **no depende de este directorio**.

## Qué hay que saber si algún día lo despliegas

1. **Pasar el proyecto a Blaze** — y entender que eso afecta a **todo** el proyecto
   Firebase, no solo a esta función. Es la razón por la que hoy no está desplegada;
   no la saltes sin decidirlo a conciencia.
2. **Diffear contra la versión de Vercel primero.** Las dos nacieron idénticas
   (`ca69aca` → `c3650f0`), pero la de Vercel es la que ha recibido mantenimiento
   (p. ej. `d97516b`, que fijó `firebase-admin` a 13.x para esquivar una cadena ESM
   rota de `jose`/`jwks-rsa`). **Asume que esta copia está atrás**, no que están
   sincronizadas.
3. **Configurar el secreto:** `firebase functions:secrets:set REVENUECAT_SECRET_KEY`.
   El código lo declara con `defineSecret` y lo pide en `secrets: [...]` de la función,
   así que no hay nada en disco que copiar.
4. **Re-agregar la sección `functions` a `firebase.json`.** Se quitó a propósito
   (2026-09-03) para que un `firebase deploy` a secas no intentara desplegar esto. Sin
   esa sección, `firebase deploy` solo publica hosting. La sección que se quitó era:

   ```json
   "functions": [
     {
       "source": "functions",
       "codebase": "default",
       "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local"],
       "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
     }
   ],
   ```

5. **Actualizar `REDEEM_GIFT_CODE_URL`** en `src/lib/offering/giftCodeService.ts:44` a
   la URL de la función, y publicar una versión nueva de la app — los APK ya instalados
   seguirán apuntando a Vercel.

## Por qué este directorio no está en `npm run validate`

Es un proyecto Node aparte, con su propio `package.json`, lockfile y `tsconfig.json`.
Está listado en `.prettierignore` y no lo cubren ni el `tsc` ni el `jest` de la raíz.
Su `npm audit` tampoco sale en el de la raíz — se auditó por separado en
`DOCS/REVIEW_2026-09/detail/B1b-npm-audit-subproyectos.md` (8 vulns moderate, todas
sin efecto mientras no se despliegue).

## Contexto

- Decisión completa y su rastro: memoria de proyecto `essb-gift-code-redemption`.
- Pasos de despliegue del que sí está vivo: `vercel/gift-code-redeem/README.md`.
- Hallazgo que originó este README: `R9-7` en `DOCS/REVIEW_2026-09/BUGS.md`.
