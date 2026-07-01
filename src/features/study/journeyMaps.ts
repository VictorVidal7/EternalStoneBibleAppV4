/**
 * 🗺️ journeyMaps — curated Bible journey routes ("Mapas de viajes bíblicos").
 *
 * Three great biblical journeys, each an ORDERED sequence of stops — a single
 * representative verse anchors each stop; tap it to jump to the passage in the
 * reader. Visual + educational + faithful: a tappable rail map, not a real
 * geographic projection (no lat/lon data), consistent with the app's existing
 * "rail with nodes" visual language (see [[prophecyMap]] / [[constellation]]).
 *
 * The Exodus route follows Números 33's own itinerary; Paul's route is a single
 * consolidated path through his most recognizable stops (not separated into his
 * 3-4 distinct journeys); Jesus' route walks His ministry from birth to the
 * empty tomb. Every ref was verified against `assets/bible-seed.db` before this
 * file was written; the theme label + a short, faithful note live in i18n
 * (`t.journeys.items[id]`), es/en parity enforced.
 *
 * PURE (no React/RN, no DB): the screen resolves each verse's text from SQLite
 * and renders the i18n prose.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key (same form as [[messianicProphecies]]). */
export type JourneyRefKey = string;

export type JourneyRouteId = 'abraham' | 'exodus' | 'exile' | 'paul' | 'jesus';

export const JOURNEY_ROUTE_ORDER: readonly JourneyRouteId[] = [
  'abraham',
  'exodus',
  'exile',
  'jesus',
  'paul',
];

export const JOURNEY_ROUTE_ICON: Record<JourneyRouteId, string> = {
  abraham: 'footsteps-outline',
  exodus: 'flag-outline',
  exile: 'moon-outline',
  paul: 'boat-outline',
  jesus: 'sunny-outline',
};

/** One accent color per route, used for the rail/nodes and the route card. */
export const JOURNEY_ROUTE_ACCENT: Record<JourneyRouteId, string> = {
  abraham: '#B91C1C',
  exodus: '#B45309',
  exile: '#4B5563',
  paul: '#0369A1',
  jesus: '#7C3AED',
};

export interface JourneyStop {
  /** Stable slug — also the i18n key `t.journeys.items[id]`. */
  id: string;
  route: JourneyRouteId;
  /** The representative verse this stop anchors to. */
  ref: JourneyRefKey;
}

/**
 * Every stop across all 3 routes. ORDER MATTERS within each route (the order
 * it is walked/rendered). Each ref was verified to resolve to a real verse in
 * `assets/bible-seed.db` before this file was written.
 */
export const JOURNEY_STOPS: readonly JourneyStop[] = [
  // ── Abraham ──
  {id: 'abraham-ur', route: 'abraham', ref: 'Genesis/12/1'},
  {id: 'abraham-shechem', route: 'abraham', ref: 'Genesis/12/7'},
  {id: 'abraham-egypt', route: 'abraham', ref: 'Genesis/12/10'},
  {id: 'abraham-hebron', route: 'abraham', ref: 'Genesis/15/6'},
  {id: 'abraham-moriah', route: 'abraham', ref: 'Genesis/22/14'},
  {id: 'abraham-beersheba', route: 'abraham', ref: 'Genesis/25/8'},

  // ── El Éxodo (Números 33's own itinerary) ──
  {id: 'exodus-rameses', route: 'exodus', ref: 'Exodus/12/37'},
  {id: 'exodus-red-sea', route: 'exodus', ref: 'Exodus/14/22'},
  {id: 'exodus-sinai', route: 'exodus', ref: 'Exodus/20/1'},
  {id: 'exodus-kadesh', route: 'exodus', ref: 'Numbers/14/34'},
  {id: 'exodus-moab', route: 'exodus', ref: 'Deuteronomy/34/5'},
  {id: 'exodus-jordan', route: 'exodus', ref: 'Joshua/3/17'},

  // ── El exilio en Babilonia ──
  {id: 'exile-jerusalem-fall', route: 'exile', ref: '2 Kings/25/9'},
  {id: 'exile-babylon-rivers', route: 'exile', ref: 'Psalms/137/1'},
  {id: 'exile-chebar', route: 'exile', ref: 'Ezekiel/1/1'},
  {id: 'exile-daniel-court', route: 'exile', ref: 'Daniel/6/16'},
  {id: 'exile-cyrus-decree', route: 'exile', ref: 'Ezra/1/1'},
  {id: 'exile-return', route: 'exile', ref: 'Ezra/3/11'},

  // ── El ministerio de Jesús ──
  {id: 'jesus-bethlehem', route: 'jesus', ref: 'Luke/2/7'},
  {id: 'jesus-jordan', route: 'jesus', ref: 'Matthew/3/17'},
  {id: 'jesus-cana', route: 'jesus', ref: 'John/2/11'},
  {id: 'jesus-capernaum', route: 'jesus', ref: 'Matthew/4/13'},
  {id: 'jesus-caesarea-philippi', route: 'jesus', ref: 'Matthew/16/16'},
  {id: 'jesus-jerusalem-entry', route: 'jesus', ref: 'Matthew/21/9'},
  {id: 'jesus-gethsemane', route: 'jesus', ref: 'Matthew/26/36'},
  {id: 'jesus-golgotha', route: 'jesus', ref: 'Matthew/27/33'},
  {id: 'jesus-empty-tomb', route: 'jesus', ref: 'Matthew/28/6'},

  // ── Los viajes misioneros de Pablo ──
  {id: 'paul-antioch', route: 'paul', ref: 'Acts/13/3'},
  {id: 'paul-lystra', route: 'paul', ref: 'Acts/14/10'},
  {id: 'paul-jerusalem-council', route: 'paul', ref: 'Acts/15/2'},
  {id: 'paul-philippi', route: 'paul', ref: 'Acts/16/9'},
  {id: 'paul-athens', route: 'paul', ref: 'Acts/17/23'},
  {id: 'paul-corinth', route: 'paul', ref: 'Acts/18/11'},
  {id: 'paul-ephesus', route: 'paul', ref: 'Acts/19/10'},
  {id: 'paul-rome', route: 'paul', ref: 'Acts/28/31'},
];

/** All stops for one route, in walk order. */
export function getStopsForRoute(route: JourneyRouteId): JourneyStop[] {
  return JOURNEY_STOPS.filter(s => s.route === route);
}

/** Total stop count for one route (for a "6 paradas" summary on the route card). */
export function getStopCount(route: JourneyRouteId): number {
  return getStopsForRoute(route).length;
}
