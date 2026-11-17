/**
 * R9-30 / R9-60 — the backup's key lists were enumerated by hand, and a key
 * nobody remembered never travelled. This test sweeps every AsyncStorage key
 * literal in `src/` and `app/` and fails on a key that is neither carried by
 * the backup (`BACKUP_COVERED_KEYS`), nor excluded below with its reason, nor
 * on the explicit R9-30 pending list (which the next session empties).
 *
 * And R9-60, round trip: the three memory preferences travel in
 * `payload.local`, a failed read leaves the key alone on import, and a file
 * without `local` (older builds) restores nothing over them.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
    getFavorites: jest.fn().mockResolvedValue([]),
    getNotes: jest.fn().mockResolvedValue([]),
    getReadingProgress: jest.fn().mockResolvedValue(null),
  };
  return {__esModule: true, default: instance, bibleDB: instance};
});

import fs from 'fs';
import path from 'path';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  BACKUP_COVERED_KEYS,
  buildBackup,
  importBackup,
} from '../src/services/BackupService';

/** Not carried, on purpose. Prefix keys end in `_` or `:`. */
const EXCLUDED: Record<string, string> = {
  // Packs and caches: re-downloaded or rebuilt on the device.
  '@bible_data_loaded_rvr1960': 'cache de pack',
  '@bible_data_loaded_web': 'cache de pack',
  '@cross_refs_loaded_v1': 'cache de pack',
  '@dictionary_v1_loaded_version': 'cache de pack',
  '@dictionary_v2_loaded_version': 'cache de pack',
  '@hebrew_gloss_es_loaded_version': 'cache de pack',
  '@hebrew_lemma_gloss_es_loaded_version': 'cache de pack',
  '@originals_loaded_v1': 'cache de pack',
  '@originals_pack_sha256': 'cache de pack',
  '@strongs_defs_loaded_version': 'cache de pack',
  '@web_text_version': 'cache de pack',
  // Migrations of THIS device's own data.
  '@migration_bookmarks_to_favorites_v1': 'marca de migracion local',
  '@migration_canonical_book_keys_v1': 'marca de migracion local',
  '@bible_bookmarks': 'legado: migrado a favoritos (SQLite, respaldado)',
  // Sync engine and account ownership: belong to this device and session.
  '@sync_conflicted_': 'motor de sync',
  '@sync_cursor_': 'motor de sync',
  '@sync_dropped_': 'motor de sync',
  '@sync_first_push_done:': 'motor de sync',
  '@sync_first_push_retry:': 'motor de sync',
  '@sync_own_': 'motor de sync',
  '@sync_queue_v1': 'motor de sync',
  '@sync_reread_': 'motor de sync',
  '@sync_unsettled_': 'motor de sync',
  '@local_store_owner_uid': 'dueno del almacen (R9-23)',
  '@review_log_owner_uid': 'dueno del log de repasos (R9-48)',
  '@prep_by_account': 'Mesa por cuenta (R9-59)',
  '@prep_release_pending': 'Mesa por cuenta (R9-275)',
  offering_entitlement_cache: 'premium: de la cuenta y la tienda (R9-119)',
  offering_pending_link_uid: 'premium: de la cuenta y la tienda (R9-119)',
  // Derivable (R9-60: carrying them would make R9-53 worse).
  '@memory_stats_floor': 'derivable de la nube (R9-53)',
  '@memory_stats_floor_banner_pending': 'derivable de la nube (R9-53)',
  // One-shot UI hints and onboarding.
  '@onboarding_completed': 'aviso de interfaz',
  '@contextual_hints_dismissed_v1': 'aviso de interfaz',
  '@contextual_hints_session_count_v1': 'aviso de interfaz',
  '@kids_listen_all_hint_v1': 'aviso de interfaz',
  '@audio_spain_voice_prompt_shown': 'aviso de interfaz',
  '@explore_last_visited_category_v1': 'aviso de interfaz',
  '@audio_last_position': 'posicion del reproductor en este aparato',
};

/**
 * R9-30, still open: user content and preferences that do not travel yet.
 * Each one needs its writers checked (who rewrites the key from memory after
 * a restore) before it moves to `LOCAL_BACKUP_KEYS` or a section of its own;
 * the Mesa keys go by account, like `@prep_notes`.
 */
const PENDING_R9_30 = [
  // Not the Mesa (free tier, one key for every account, no `prepKey`).
  '@sermon_notes',
  '@custom_plans',
  '@devotional_draft',
  '@together_groups',
  '@audio_bookmarks',
  '@audio_listening_stats',
  '@share_style_presets',
  '@share_style_presets_compact',
  '@reading_daily_goal',
  '@home_also_versions',
  'lastReadPosition',
  // Preferences (the backup already carries the theme and the reader's).
  '@app_language',
  '@app_high_contrast',
  '@app_reduce_motion_override',
  '@bible_version',
  '@reader_dual_layout',
  '@reader_focus_mode',
  '@reader_secondary_version',
  '@audio_preferences',
  '@audio_selected_voice',
  '@daily_notifications_enabled',
  '@daily_notifications_hour',
  '@devotion_reminder_enabled',
  '@devotion_reminder_hour',
  '@memory_reminder_enabled',
  '@memory_reminder_hour',
  '@prayer_reminder_enabled',
  '@prayer_reminder_hour',
  '@prophecy_reminder_enabled',
  '@prophecy_reminder_hour',
  '@sabias_que_reminder_enabled',
  '@sabias_que_reminder_hour',
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Quoted `@key` literals, plus the un-prefixed keys read by name. */
function keysInSource(): Set<string> {
  const root = path.join(__dirname, '..');
  const found = new Set<string>();
  for (const file of [
    ...sourceFiles(path.join(root, 'src')),
    ...sourceFiles(path.join(root, 'app')),
  ]) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/['"](@[a-z][a-z0-9_]*[_:]?)['"]/g)) {
      found.add(m[1]);
    }
    for (const m of text.matchAll(
      /(?:getItem|setItem|removeItem)\(\s*['"]([a-zA-Z][a-zA-Z0-9_]*)['"]/g,
    )) {
      found.add(m[1]);
    }
    for (const m of text.matchAll(
      /export const [A-Z_]*KEY\s*=\s*['"]([a-z][a-z0-9_]*)['"]/g,
    )) {
      found.add(m[1]);
    }
  }
  return found;
}

describe('R9-30 / R9-60 — every AsyncStorage key is placed', () => {
  it('no key in the code is left out of the three lists', () => {
    const placed = new Set([
      ...BACKUP_COVERED_KEYS,
      ...Object.keys(EXCLUDED),
      ...PENDING_R9_30,
    ]);
    const unplaced = [...keysInSource()].filter(k => !placed.has(k)).sort();
    expect(unplaced).toEqual([]);
  });

  it('no key sits in two lists, and none is stale', () => {
    const lists = [BACKUP_COVERED_KEYS, Object.keys(EXCLUDED), PENDING_R9_30];
    const all = lists.flat();
    expect(all.filter((k, i) => all.indexOf(k) !== i)).toEqual([]);
    const inSource = keysInSource();
    // A listed key that no longer exists in the code is a list that lies.
    expect(
      [...Object.keys(EXCLUDED), ...PENDING_R9_30].filter(
        k => !inSource.has(k),
      ),
    ).toEqual([]);
  });
});

describe('R9-60 — the memory preferences travel', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    setAchievementServiceInstance({
      initialize: jest.fn().mockResolvedValue(undefined),
      getRawUserStats: jest.fn().mockResolvedValue({}),
      getAllAchievements: jest.fn().mockResolvedValue([]),
      getReadingLog: jest.fn().mockResolvedValue([]),
      getCompletedBooks: jest.fn().mockResolvedValue([]),
      getBookReadingLog: jest.fn().mockResolvedValue([]),
      getChaptersReadLog: jest.fn().mockResolvedValue([]),
      restoreBackup: jest.fn().mockResolvedValue(undefined),
    } as unknown as AchievementService);
  });

  afterAll(() => setAchievementServiceInstance(null));

  const VALUES: Record<string, string> = {
    '@memory_daily_goal': '25',
    '@memory_weekly_target': '6',
    '@memory_celebrated_milestones': '["streak:100","goal:2026-11-01"]',
  };

  it('a round trip carries the three keys to a fresh device', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    await AsyncStorage.clear();
    const result = await importBackup(file);
    const restored = Object.fromEntries(
      await AsyncStorage.multiGet(Object.keys(VALUES)),
    );
    expect(restored).toEqual(VALUES);
    expect(result.failedSections).toEqual([]);
  });

  it('a key the export could not read is left alone, and reported', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    delete file.local['@memory_daily_goal'];
    file.meta.degradedSections.push('local:@memory_daily_goal');
    await AsyncStorage.setItem('@memory_daily_goal', '40');
    const result = await importBackup(file);
    expect(await AsyncStorage.getItem('@memory_daily_goal')).toBe('40');
    expect(result.failedSections).toContain('local:@memory_daily_goal');
  });

  it('CONTROL: a file without `local` (older build) writes none of them', async () => {
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    delete file.local;
    await AsyncStorage.setItem('@memory_weekly_target', '9');
    await importBackup(file);
    expect(await AsyncStorage.getItem('@memory_weekly_target')).toBe('9');
  });
});
