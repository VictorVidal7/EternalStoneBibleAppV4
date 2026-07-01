/**
 * The Bible journey routes catalog — every stop must resolve to a real
 * canonical verse-in-range (a typo fails CI rather than shipping a dead node),
 * ids are unique, routes are grouped in order, and every entry has an es/en
 * label + note.
 */
import {
  JOURNEY_STOPS,
  JOURNEY_ROUTE_ORDER,
  JOURNEY_ROUTE_ICON,
  JOURNEY_ROUTE_ACCENT,
  getStopsForRoute,
  getStopCount,
  type JourneyRouteId,
} from '../src/features/study/journeyMaps';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;
const esJ = (translations.es as AnyRecord).journeys as AnyRecord;
const enJ = (translations.en as AnyRecord).journeys as AnyRecord;

describe('journeyMaps — catalog shape', () => {
  it('ships several routes with several stops each', () => {
    expect(JOURNEY_ROUTE_ORDER.length).toBeGreaterThanOrEqual(3);
    for (const route of JOURNEY_ROUTE_ORDER) {
      expect(getStopCount(route)).toBeGreaterThanOrEqual(5);
    }
  });

  it('has unique ids', () => {
    const ids = JOURNEY_STOPS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every stop belongs to a known route, each with an icon + accent', () => {
    for (const s of JOURNEY_STOPS) {
      expect(JOURNEY_ROUTE_ORDER).toContain(s.route);
    }
    for (const r of JOURNEY_ROUTE_ORDER) {
      expect(JOURNEY_ROUTE_ICON[r]).toBeTruthy();
      expect(JOURNEY_ROUTE_ACCENT[r]).toMatch(/^#/);
    }
  });

  it('lists routes contiguously (each route is a single unbroken block)', () => {
    const seenOrder: JourneyRouteId[] = [];
    for (const s of JOURNEY_STOPS) {
      if (seenOrder[seenOrder.length - 1] !== s.route) seenOrder.push(s.route);
    }
    expect(new Set(seenOrder).size).toBe(seenOrder.length);
    expect(seenOrder).toEqual(JOURNEY_ROUTE_ORDER);
  });
});

describe('journeyMaps — every reference is real', () => {
  it('resolves every stop to a canonical, in-range verse', () => {
    const bad: string[] = [];
    for (const s of JOURNEY_STOPS) {
      const parsed = parseChristRef(s.ref);
      if (!parsed) {
        bad.push(`${s.id}: unparseable "${s.ref}"`);
        continue;
      }
      const book = getBookByName(parsed.book);
      if (!book) {
        bad.push(`${s.id}: unknown book "${parsed.book}"`);
        continue;
      }
      if (book.nameEn !== parsed.book) {
        bad.push(`${s.id}: non-canonical book "${parsed.book}"`);
      }
      if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
        bad.push(`${s.id}: chapter ${parsed.chapter} out of range`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('journeyMaps — i18n parity', () => {
  it('has a title + subtitle in BOTH languages for every route', () => {
    const esRoutes = esJ.routes as Record<string, AnyRecord>;
    const enRoutes = enJ.routes as Record<string, AnyRecord>;
    const bad: string[] = [];
    for (const r of JOURNEY_ROUTE_ORDER) {
      for (const routes of [esRoutes, enRoutes]) {
        const route = routes[r];
        if (typeof route?.title !== 'string' || !route.title) {
          bad.push(`${r}: missing title`);
        }
        if (typeof route?.subtitle !== 'string' || !route.subtitle) {
          bad.push(`${r}: missing subtitle`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has a label + note in BOTH languages for every stop', () => {
    const esItems = esJ.items as Record<string, AnyRecord>;
    const enItems = enJ.items as Record<string, AnyRecord>;
    const bad: string[] = [];
    for (const s of JOURNEY_STOPS) {
      for (const [lang, items] of [
        ['es', esItems],
        ['en', enItems],
      ] as const) {
        const item = items[s.id];
        if (!item) {
          bad.push(`${lang}: missing item ${s.id}`);
          continue;
        }
        if (typeof item.label !== 'string' || !item.label) {
          bad.push(`${lang}: ${s.id} missing label`);
        }
        if (typeof item.note !== 'string' || !item.note) {
          bad.push(`${lang}: ${s.id} missing note`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan i18n items (every keyed item is in the catalog)', () => {
    const ids = new Set(JOURNEY_STOPS.map(s => s.id));
    for (const key of Object.keys(esJ.items as AnyRecord)) {
      expect(ids.has(key)).toBe(true);
    }
  });
});

describe('getStopsForRoute', () => {
  it("returns only that route's stops, in catalog order", () => {
    for (const route of JOURNEY_ROUTE_ORDER) {
      const stops = getStopsForRoute(route);
      expect(stops.every(s => s.route === route)).toBe(true);
      expect(stops).toEqual(JOURNEY_STOPS.filter(s => s.route === route));
    }
  });

  it('every stop across all routes sums to the full catalog', () => {
    const total = JOURNEY_ROUTE_ORDER.reduce(
      (sum, r) => sum + getStopCount(r),
      0,
    );
    expect(total).toBe(JOURNEY_STOPS.length);
  });
});
