import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleVersion} from '../types/bible';
import {BIBLE_VERSIONS, installedVersions} from '../constants/bible';
import bibleDB from '../lib/database';
import {useLanguage} from './useLanguage';

const VERSION_STORAGE_KEY = '@bible_version';

/** The versions that ship in the seeded DB — always available, even offline. */
const BUNDLED_IDS = BIBLE_VERSIONS.filter(v => v.bundled).map(v => v.id);

interface BibleVersionContextType {
  selectedVersion: BibleVersion;
  setVersion: (versionId: string) => Promise<void>;
  /** Versions usable RIGHT NOW (bundled + any downloaded pack) — never empties. */
  availableVersions: BibleVersion[];
  /** The DISTINCT version ids currently present in the DB (bundled + downloaded). */
  installedVersionIds: string[];
  /** Re-read which versions the DB holds (call after importing a pack). */
  refreshInstalledVersions: () => Promise<void>;
}

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(
  undefined,
);

export function BibleVersionProvider({children}: {children: ReactNode}) {
  const {language} = useLanguage();
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(
    BIBLE_VERSIONS[0],
  );
  // Whether the user has explicitly picked a version in Settings. Until then
  // the version simply follows the UI language.
  const [hasExplicitChoice, setHasExplicitChoice] = useState(false);
  // Which versions the DB actually holds. Starts with the bundled ids so the
  // picker is never empty before the DB read resolves (and so onboarding, which
  // runs while the DB seeds, still shows the shipped versions).
  const [installedVersionIds, setInstalledVersionIds] =
    useState<string[]>(BUNDLED_IDS);
  // Whether the DB has answered at least once (R9-424). Until it has,
  // `installedVersionIds` is only the bundled placeholder above, NOT a fact
  // about the DB — so nothing may conclude "that version isn't installed" yet.
  const [installedKnown, setInstalledKnown] = useState(false);

  // The catalog filtered to what's installed — what every picker should offer.
  const availableVersions = useMemo(
    () => installedVersions(installedVersionIds),
    [installedVersionIds],
  );

  // Read the versions present in the `verses` table (bundled + any imported
  // pack). Non-fatal: on failure we keep the bundled defaults so the app still
  // works offline. Exposed so the pack importer can refresh after a download.
  const refreshInstalledVersions = useCallback(async () => {
    try {
      await bibleDB.initialize();
      const stats = await bibleDB.getDatabaseStats();
      if (stats.versions && stats.versions.length > 0) {
        setInstalledVersionIds(stats.versions);
      }
    } catch {
      // Keep the bundled defaults.
    } finally {
      // After the ids (same batch), and ALSO when the read failed: a DB that
      // can't answer must not leave a rowless downloaded version selected for
      // the whole session — the safety net below then falls back to a bundled
      // one, exactly as it did before R9-424.
      setInstalledKnown(true);
    }
  }, []);

  useEffect(() => {
    refreshInstalledVersions();
  }, [refreshInstalledVersions]);

  useEffect(() => {
    loadSavedVersion();
  }, []);

  // While the user has not made an explicit choice, keep the Bible version in
  // sync with the UI language (English → KJV, Spanish → RVR1960) — but only
  // among INSTALLED versions, so we never select an un-downloaded one.
  useEffect(() => {
    if (hasExplicitChoice) return;
    const match = availableVersions.find(v => v.language === language);
    if (match && match.id !== selectedVersion.id) {
      setSelectedVersion(match);
    }
  }, [language, hasExplicitChoice, selectedVersion.id, availableVersions]);

  // Safety net: if the selected version isn't installed (a 'WEB' id saved from
  // the old buggy state, or a pack the user later deleted), fall back to a
  // bundled version of the same language, then of the UI language.
  //
  // It waits for the DB's first answer (R9-424). The saved id comes back from a
  // single AsyncStorage read, long before `refreshInstalledVersions` (DB init +
  // two queries); judging it against the bundled placeholder threw away a
  // downloaded version (KJV, RV1909…) on every cold start, and since
  // `hasExplicitChoice` was already true nothing put it back.
  //
  // The fallback is deliberately NOT persisted: this read races the startup
  // re-seed (`initializeBibleData`), so a partial list could otherwise replace
  // the user's saved choice for good.
  useEffect(() => {
    if (!installedKnown) return;
    if (availableVersions.some(v => v.id === selectedVersion.id)) return;
    const fallback =
      availableVersions.find(v => v.language === selectedVersion.language) ??
      availableVersions.find(v => v.language === language) ??
      availableVersions[0];
    if (fallback) setSelectedVersion(fallback);
  }, [
    installedKnown,
    availableVersions,
    selectedVersion.id,
    selectedVersion.language,
    language,
  ]);

  async function loadSavedVersion() {
    try {
      const savedVersionId = await AsyncStorage.getItem(VERSION_STORAGE_KEY);
      if (savedVersionId) {
        // Restore from the full catalog; the safety-net effect above corrects it
        // if that version turns out not to be installed (once the DB answers).
        const version = BIBLE_VERSIONS.find(v => v.id === savedVersionId);
        if (version) {
          setSelectedVersion(version);
          setHasExplicitChoice(true);
        }
      }
      // No saved version: the language-sync effect above picks the default.
    } catch (error) {
      console.error('Error loading saved version:', error);
    }
  }

  const setVersion = useCallback(
    async (versionId: string) => {
      // Only an INSTALLED version can be selected — the picker offers exactly
      // those, but guard here too against stale/programmatic ids.
      const version = availableVersions.find(v => v.id === versionId);
      if (version) {
        setSelectedVersion(version);
        setHasExplicitChoice(true);
        await AsyncStorage.setItem(VERSION_STORAGE_KEY, versionId);
      }
    },
    [availableVersions],
  );

  return (
    <BibleVersionContext.Provider
      value={{
        selectedVersion,
        setVersion,
        availableVersions,
        installedVersionIds,
        refreshInstalledVersions,
      }}>
      {children}
    </BibleVersionContext.Provider>
  );
}

export function useBibleVersion() {
  const context = useContext(BibleVersionContext);
  if (!context) {
    throw new Error('useBibleVersion must be used within BibleVersionProvider');
  }
  return context;
}

/**
 * Non-throwing variant for code that lives ABOVE the version provider in some
 * trees (or renders without it in unit tests) — returns undefined when there is
 * no provider. The audio engine uses it to follow the selected version's
 * language without hard-coupling to the provider (Sprint 100).
 */
export function useBibleVersionOptional() {
  return useContext(BibleVersionContext);
}
