/**
 * 📖 dictionaryNaves — Nave's Topical Bible (1897, public domain)
 * cross-reference panel data (Tanda 5, v1.1 fast-follow).
 *
 * Scope: [[essb-premium-audit-pastors-teachers]]'s integration-prep research
 * live-verified all 10 v1 dictionary entries against a real Nave's mirror
 * and found exactly 6 "clean" (no curation/vetting needed) — Nazaret,
 * Belén, Galilea, Jericó, Sinagoga, Tiro — deferring the other 4 (Aarón,
 * Josué needed curation; Sanedrín, Jornada de un día de reposo had no
 * usable panel) to a future pass. `NAVES_ALLOWLIST` below is exactly that
 * 6-slug set — nothing else renders a panel, even if this module later
 * grows more entries by mistake (see the allow-list test).
 *
 * IMPORTANT — sourcing note for whoever reviews this: the prior research
 * memory decided the EDITION (Nave's 1897) and the ALLOW-LIST (these 6
 * slugs), but never actually extracted cross-reference data into the repo
 * — that only existed as "verified against a mirror" during the spike, not
 * as committed data. This file's content was extracted fresh for this
 * change from a single online Nave's Topical Bible mirror
 * (biblestudytools.com/concordances/naves-topical-bible/<topic>.html,
 * fetched 2026-07-29), trimmed to the sub-headings most relevant to each
 * headword (not every sub-heading Nave's lists, to keep the panel
 * lightweight), with headings translated to Spanish and references kept as
 * individual `<Book> <chapter>[:<verse>[-<verseEnd>]]` citations so they
 * run through the SAME `linkifyReferences`/`parseReference` tap-to-jump
 * path as every other citation on this screen.
 *
 * Fidelity gate: every single reference below is verified by
 * `dictionaryNaves.test.ts` to actually exist in this app's own bundled
 * RVR1960 verse data (book + chapter + verse, not just an in-range
 * guess) — the same discipline this project already applies to its other
 * translated-content batches (see the Millennium multi-view citation
 * checks in [[essb-premium-audit-pastors-teachers]]). That test is the
 * permanent regression guard: it fails loudly if a future edit
 * introduces a citation that doesn't resolve.
 *
 * Un-vetted claim: the edition match (1897 vs. a later Nave's revision) has
 * NOT been independently re-verified the way the ISBE 1915 spike did for
 * that source — flagged here, same as that spike flagged "verify
 * 1915-not-1979" as a required follow-up step for ISBE.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** One labeled group of Bible references under a dictionary entry's Nave's
 *  Topical Bible panel, e.g. heading "Jesús va a la región de Tiro" with
 *  refs `["Mateo 15:21"]`. */
export interface NavesCrossReference {
  heading: string;
  /** Individual `<Book> <chapter>[:<verse>[-<verseEnd>]]` citations, each
   *  one independently tappable via `linkifyReferences`. */
  refs: readonly string[];
}

/** The only 6 slugs this panel ever renders for — see the module doc
 *  comment for why these 6 and not the other 4 v1 entries. */
export const NAVES_ALLOWLIST = [
  'nazaret',
  'belen',
  'galilea',
  'jerico',
  'sinagoga',
  'tiro',
] as const;

export const DICTIONARY_NAVES_REFS: Readonly<
  Record<string, readonly NavesCrossReference[]>
> = {
  nazaret: [
    {
      heading: 'José y María viven allí',
      refs: [
        'Mateo 2:23',
        'Lucas 1:26',
        'Lucas 1:27',
        'Lucas 1:56',
        'Lucas 2:4',
        'Lucas 2:39',
        'Lucas 2:51',
      ],
    },
    {
      heading: 'De allí era Jesús',
      refs: [
        'Mateo 21:11',
        'Marcos 1:24',
        'Marcos 10:47',
        'Lucas 4:34',
        'Lucas 18:37',
        'Lucas 24:19',
      ],
    },
    {
      heading: 'La gente de Nazaret rechaza a Jesús',
      refs: ['Lucas 4:16-30'],
    },
    {
      heading: 'Su reputación ("¿De Nazaret puede salir algo bueno?")',
      refs: ['Juan 1:46'],
    },
  ],
  belen: [
    {
      heading: 'Ciudad al suroeste de Jerusalén',
      refs: ['Jueces 17:7', 'Jueces 19:18'],
    },
    {
      heading: 'Llamada también Efrata',
      refs: ['Génesis 48:7', 'Salmos 132:6', 'Miqueas 5:2'],
    },
    {
      heading: 'Y Belén de Judá',
      refs: [
        'Jueces 17:7-9',
        'Jueces 19:1',
        'Jueces 19:18',
        'Rut 1:1',
        '1 Samuel 17:12',
      ],
    },
    {
      heading: 'Raquel muere y es sepultada allí',
      refs: ['Génesis 35:16', 'Génesis 35:19', 'Génesis 48:7'],
    },
    {
      heading: 'La ciudad de Booz',
      refs: ['Rut 1:1', 'Rut 1:19', 'Rut 2:4', 'Rut 4'],
    },
    {
      heading: 'Tomada por los filisteos',
      refs: ['2 Samuel 23:14-16'],
    },
    {
      heading: 'Jeroboam la convierte en fortaleza',
      refs: ['2 Crónicas 11:6'],
    },
    {
      heading: 'La ciudad de José',
      refs: ['Mateo 2:5-6', 'Lucas 2:4'],
    },
    {
      heading: 'Lugar de nacimiento de Jesús',
      refs: ['Miqueas 5:2', 'Mateo 2', 'Lucas 2:4', 'Lucas 2:15'],
    },
    {
      heading: 'Herodes asesina a los niños de Belén',
      refs: ['Mateo 2:16-18'],
    },
  ],
  galilea: [
    {
      heading: 'Profecía sobre Galilea ("Galilea de los gentiles")',
      refs: ['Isaías 9:1', 'Mateo 4:15'],
    },
    {
      heading: 'Jesús reside allí',
      refs: ['Mateo 17:22', 'Mateo 19:1', 'Juan 7:1', 'Juan 7:9'],
    },
    {
      heading: 'Enseñanza y milagros de Jesús en Galilea',
      refs: ['Mateo 4:23-25', 'Mateo 15:29-31', 'Marcos 1:14'],
    },
    {
      heading: 'Jesús se aparece allí a sus discípulos tras resucitar',
      refs: [
        'Mateo 26:32',
        'Mateo 28:7',
        'Mateo 28:10',
        'Mateo 28:16-17',
        'Marcos 14:28',
        'Marcos 16:7',
        'Juan 21',
      ],
    },
    {
      heading: 'Los discípulos eran mayormente de Galilea',
      refs: ['Hechos 1:11', 'Hechos 2:7'],
    },
    {
      heading: 'El mar de Galilea, también llamado lago de Genesaret',
      refs: ['Juan 21:1', 'Lucas 5:1'],
    },
    {
      heading: 'Jesús llama a sus discípulos junto al mar',
      refs: ['Mateo 4:18-22', 'Lucas 5:1-11'],
    },
    {
      heading: 'Milagros de Jesús en el mar de Galilea',
      refs: [
        'Mateo 8:24-32',
        'Mateo 14:22-33',
        'Marcos 4:37-39',
        'Lucas 8:22-24',
      ],
    },
  ],
  jerico: [
    {
      heading: 'Llamada "la ciudad de las palmeras"',
      refs: ['Deuteronomio 34:3'],
    },
    {
      heading: 'Rahab la ramera vivía allí',
      refs: ['Josué 2', 'Hebreos 11:31'],
    },
    {
      heading: 'Josué ve al "príncipe del ejército de Jehová" cerca de Jericó',
      refs: ['Josué 5:13-15'],
    },
    {
      heading: 'Sitiada por Josué siete días; caída y destrucción',
      refs: ['Josué 6', 'Josué 24:11'],
    },
    {
      heading: 'Reconstruida por Hiel, cumpliendo la maldición de Josué',
      refs: ['1 Reyes 16:34'],
    },
    {
      heading: 'Los "hijos de los profetas" vivían allí',
      refs: ['2 Reyes 2:4', '2 Reyes 2:5', '2 Reyes 2:15', '2 Reyes 2:18'],
    },
    {
      heading: 'Purificada por Eliseo',
      refs: ['2 Reyes 2:18-22'],
    },
    {
      heading: 'Cautivos de Judá liberados allí',
      refs: ['2 Crónicas 28:7-15'],
    },
    {
      heading: 'Ciegos sanados por Jesús cerca de Jericó',
      refs: ['Mateo 20:29-34', 'Marcos 10:46', 'Lucas 18:35'],
    },
    {
      heading: 'Zaqueo vivía allí',
      refs: ['Lucas 19:1-10'],
    },
  ],
  sinagoga: [
    {
      heading: 'Lugar donde se leían y explicaban las Escrituras',
      refs: ['Nehemías 8:1-8', 'Lucas 4:16-30', 'Juan 18:20'],
    },
    {
      heading: 'Jesús sana en la sinagoga',
      refs: ['Mateo 12:9-13', 'Lucas 13:11-14'],
    },
    {
      heading: 'Jesús enseñaba habitualmente en las sinagogas',
      refs: ['Marcos 1:39', 'Lucas 4:15'],
    },
    {
      heading: 'Pablo predicaba en las sinagogas en sus viajes',
      refs: ['Hechos 13:5', 'Hechos 17:1-2', 'Hechos 18:4'],
    },
    {
      heading: 'Servía también como tribunal',
      refs: ['Lucas 12:11', 'Hechos 9:2'],
    },
    {
      heading: 'Tenía autoridad disciplinaria y judicial',
      refs: ['Mateo 10:17', 'Hechos 22:19'],
    },
    {
      heading: '"Sinagoga de Satanás" (uso figurado)',
      refs: ['Apocalipsis 2:9', 'Apocalipsis 3:9'],
    },
  ],
  tiro: [
    {
      heading: 'Hiram, rey de Tiro, envía materiales a David',
      refs: ['2 Crónicas 2:3'],
    },
    {
      heading: 'Hiram envía hombres y materiales a Salomón para el templo',
      refs: ['1 Reyes 5:1-11'],
    },
    {
      heading: 'Ciudad fortificada y de gran comercio',
      refs: ['1 Reyes 9:26-28', 'Isaías 23'],
    },
    {
      heading: 'Riquezas y antigüedad de Tiro',
      refs: ['Isaías 23:7-8'],
    },
    {
      heading: 'Sitiada por Nabucodonosor',
      refs: ['Ezequiel 26:7'],
    },
    {
      heading: 'Jesús va a la región de Tiro',
      refs: ['Mateo 15:21'],
    },
    {
      heading: 'Sana a la hija de la mujer sirofenicia cerca de Tiro',
      refs: ['Mateo 15:21-28', 'Marcos 7:24-31'],
    },
    {
      heading: 'Multitudes de Tiro acuden a Jesús',
      refs: ['Marcos 3:8', 'Lucas 6:17'],
    },
    {
      heading: 'Pablo visita Tiro',
      refs: ['Hechos 21:3-7'],
    },
    {
      heading: 'Tiro será juzgada según su privilegio, según Jesús',
      refs: ['Mateo 11:21-22'],
    },
  ],
};

/** Nave's Topical Bible cross-references for a dictionary entry's panel, or
 *  an empty array outside the 6-slug allow-list. Never throws on an
 *  unknown slug. */
export function getNavesCrossReferences(
  slug: string,
): readonly NavesCrossReference[] {
  return DICTIONARY_NAVES_REFS[slug] ?? [];
}
