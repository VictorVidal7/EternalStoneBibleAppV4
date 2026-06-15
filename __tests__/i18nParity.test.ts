import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;

/** Collect every leaf key path (dot-joined) from a nested translation object. */
function collectLeafPaths(obj: AnyRecord, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...collectLeafPaths(value as AnyRecord, path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

/** Read the leaf value at a dot path (string leaves only; arrays/others -> undefined). */
function leafAt(obj: AnyRecord, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object') {
      return (acc as AnyRecord)[segment];
    }
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : undefined;
}

/** Extract the set of {{token}} interpolation names from a string, sorted. */
function interpolationTokens(value: string): string[] {
  const matches = value.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) ?? [];
  const names = matches.map(m => m.replace(/\{\{\s*|\s*\}\}/g, ''));
  return Array.from(new Set(names)).sort();
}

const es = translations.es as AnyRecord;
const en = translations.en as AnyRecord;

describe('i18n parity (es <-> en)', () => {
  const esPaths = collectLeafPaths(es);
  const enPaths = collectLeafPaths(en);
  const esSet = new Set(esPaths);
  const enSet = new Set(enPaths);

  it('has no keys present in es but missing in en', () => {
    const missingInEn = esPaths.filter(p => !enSet.has(p));
    expect(missingInEn).toEqual([]);
  });

  it('has no keys present in en but missing in es', () => {
    const missingInEs = enPaths.filter(p => !esSet.has(p));
    expect(missingInEs).toEqual([]);
  });

  it('uses the same interpolation tokens for every shared key', () => {
    const mismatches: string[] = [];
    for (const path of esPaths) {
      if (!enSet.has(path)) continue;
      const esValue = leafAt(es, path);
      const enValue = leafAt(en, path);
      if (esValue === undefined || enValue === undefined) continue;
      const esTokens = interpolationTokens(esValue).join(',');
      const enTokens = interpolationTokens(enValue).join(',');
      if (esTokens !== enTokens) {
        mismatches.push(`${path}: es[${esTokens}] vs en[${enTokens}]`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
