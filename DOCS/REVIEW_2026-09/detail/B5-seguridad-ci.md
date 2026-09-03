# B5 — Seguridad de CI (`.github/workflows/ci.yml`)

**Modo:** B · **Prioridad:** P0 · **Estado:** ✅ OK (con 2 hallazgos menores: `R9-5`,
`R9-6`) · **Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa`

**Veredicto: no hay exposición explotable.** Un solo workflow (`ci.yml`, 3 jobs), y
los dos datos que definen el radio de daño son inmejorables: el `GITHUB_TOKEN` del
repo está en **read-only por defecto** y el repo tiene **cero secretos de Actions**.
Aun si una acción de terceros se comprometiera, no hay credenciales que robar ni
permiso de escritura que abusar. Los 2 hallazgos son endurecimiento y **falsa
sensación de seguridad**, no vulnerabilidades.

---

## Alcance

`git ls-files .github/` → **1 solo archivo**: `.github/workflows/ci.yml`.
Jobs: `lint-and-type-check`, `test`, `security`.

## Lo que se verificó vía API de GitHub (no solo leyendo el YAML)

| Consulta                                                         | Resultado       |
| ---------------------------------------------------------------- | --------------- |
| `/actions/permissions/workflow` → `default_workflow_permissions` | **`"read"`**    |
| `… → can_approve_pull_request_reviews`                           | **`false`**     |
| `/actions/permissions` → `allowed_actions`                       | `"all"`         |
| `… → sha_pinning_required`                                       | `false`         |
| `/actions/secrets` → `total_count`                               | **0** (ninguno) |
| Visibilidad del repo                                             | **público**     |

Esos dos ceros/read-only son lo que convierte varios "findings" genéricos de CI en
notas de bajo riesgo aquí. Vale medirlo en vez de asumir el peor caso.

## Lo que está bien hecho

- **Usa `pull_request`, NO `pull_request_target`.** Este es el error grave clásico
  (dar contexto privilegiado + secretos a código de un fork no confiable) y **no está
  presente**. `grep -nE 'pull_request_target|workflow_run|self-hosted|secrets\.'` →
  **cero matches** en todo el archivo.
- **Cero interpolación `${{ }}` dentro de un `run:`.** Los únicos `${{ }}` están en
  `concurrency.group` / `cancel-in-progress` (`github.ref`), que no se evalúan en un
  shell → **sin superficie de inyección de scripts**, que es el otro error frecuente.
- **Sin runners self-hosted** (todo `ubuntu-latest`), así que no hay riesgo de
  persistencia entre ejecuciones.
- **Sin ningún `secrets.*`** referenciado. El upload a Codecov es tokenless (permitido
  en repos públicos), lo que explica por qué no hace falta secreto — y a la vez es lo
  que deja el radio de daño en casi nada.
- **`concurrency` bien pensado:** `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`
  cancela iteraciones de una rama pero **nunca** un merge a `main`, que siempre se
  valida completo.
- **`push: branches: ['**']`** — corre en toda rama, con un comentario que explica el
  incidente que lo motivó (dos pushes rojos que pasaron inadvertidos, 61ª sesión).
- Las dos acciones de mayor privilegio son **oficiales de GitHub**
  (`actions/checkout@v4`, `actions/setup-node@v4`).

---

## ⚠️ `R9-5` — el job "Security Audit" no puede fallar nunca

**Severidad: baja como riesgo, pero es el hallazgo más útil de esta área** porque
induce a error activamente.

```yaml
security:
  name: Security Audit
  steps:
    - name: Run npm audit
      run: npm audit --audit-level=moderate
      continue-on-error: true # <-- nunca falla
    - name: Check for outdated packages
      run: npm outdated
      continue-on-error: true # <-- nunca falla
```

Ambos pasos llevan `continue-on-error: true`, y son los **únicos** pasos del job. O
sea: el job titulado "Security Audit" **sale verde siempre**, sin importar qué
encuentre.

**Por qué importa:** ahora mismo `npm audit` reporta **8 vulnerabilidades, 1 de ellas
HIGH** (ver `detail/B1-npm-audit.md`) y el check de CI aparece en verde. Alguien
mirando la lista de checks de un PR concluye razonablemente "la auditoría de seguridad
pasó", cuando lo que pasó es que se ejecutó y se ignoró el resultado. `npm outdated`
además devuelve exit code 1 siempre que haya algo desactualizado (~50 paquetes hoy),
así que sin el `continue-on-error` ese paso sería rojo permanente — es decir, la
bandera es necesaria para el diseño actual, pero el diseño actual no informa nada.

**Repro:** abrir cualquier run de CI reciente en Actions → job "Security Audit" verde;
correr `npm audit --audit-level=moderate` localmente → exit code distinto de 0.

**Opciones (ninguna aplicada):** (a) dejar `npm outdated` informativo pero quitarle el
`continue-on-error` a `npm audit` **una vez** que las 8 estén clasificadas y las
inevitables tengan excepción explícita — `B1` ya hizo esa clasificación, así que la
precondición está lista; (b) si se prefiere que no bloquee, renombrar el job a algo
como "Dependency Report" para que no prometa una garantía que no da. Lo importante es
que el nombre y el comportamiento coincidan.

## 💡 `R9-6` — endurecimiento de CI: sin bloque `permissions:` y acción de terceros en tag mutable

**Severidad: baja** (defensa en profundidad; hoy mitigado por configuración del repo).

**(a) No hay ningún bloque `permissions:`** — ni a nivel workflow ni por job. Sin él,
el `GITHUB_TOKEN` hereda el default del repositorio. **Hoy ese default es `"read"`**
(verificado por API), así que en la práctica el token ya es de solo lectura y no hay
escalada real. Pero es un ajuste de _settings del repo_, mutable desde la UI y
silenciosamente: un cambio futuro a "read and write" volvería este workflow
permisivo sin que nadie toque el YAML. Un `permissions: {contents: read}` a nivel
workflow hace la garantía explícita e independiente de esa configuración.

**(b) `codecov/codecov-action@v4` es de terceros y está fijada a un tag mutable.**
`v4` es una referencia móvil: quien controle el repo de la acción puede reapuntarla.
Codecov además tiene precedente histórico de compromiso de cadena de suministro (el
incidente del bash-uploader en 2021), así que no es una preocupación hipotética para
este proveedor en particular. `sha_pinning_required` del repo es `false`, así que nada
lo fuerza.

**Por qué NO es urgente:** el radio de daño está acotado a casi cero por lo medido
arriba — **0 secretos** en el repo y token **read-only**. Una acción comprometida no
podría exfiltrar credenciales ni pushear código; a lo sumo falsear el resultado del
job o envenenar la caché de npm del run. **Arreglo sugerido (no aplicado):** fijar a
SHA completo (`codecov/codecov-action@<sha40>  # v4.x.y`). Las dos acciones oficiales
de GitHub se pueden dejar en tag por convención, aunque fijarlas también no cuesta.

---

## Nota lateral (no es de seguridad)

CI corre **Node 20**; la máquina de Victor tiene **Node 24.11.1**, y `package.json`
**no declara `engines`**. Es un desfase de dos majors entre local y CI sin nada que lo
documente ni lo fuerce — no es un problema de seguridad, pero es exactamente el tipo
de brecha que produce un "en mi máquina pasa". Encaja en la fila `B8` (vigencia de
Expo SDK 57 / RN 0.86); se anota acá porque salió al leer el workflow.

## Caveats

- Solo existe 1 workflow, así que la cobertura de esta área es completa **para
  Actions**. No se auditaron otras automatizaciones fuera de GitHub (despliegue de
  Vercel, hooks de husky locales) — el hook de husky `pre-commit` sí se observó
  funcionando (corre `prettier --write` sobre lo staged), pero no se auditó como
  superficie.
- Los valores de permisos/secretos son **al 2026-09-03**. Son configuración de repo,
  cambiable desde la UI sin dejar rastro en git — que es justo el argumento de
  `R9-6(a)`.

## Comandos usados

```
git ls-files .github/                                   # 1 archivo
cat .github/workflows/ci.yml
grep -nE 'pull_request_target|workflow_run|self-hosted|secrets\.' .github/workflows/ci.yml
grep -nE 'run:.*\$\{\{' .github/workflows/ci.yml
curl -H "Authorization: Bearer <token de git credential>" \
  api.github.com/repos/VictorVidal7/EternalStoneBibleAppV4/actions/permissions/workflow
  …/actions/permissions
  …/actions/secrets
```
