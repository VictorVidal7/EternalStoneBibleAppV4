import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleVersion} from '../types/bible';
import {useLanguage} from './useLanguage';

const VERSION_STORAGE_KEY = '@bible_version';

// Versiones disponibles
export const AVAILABLE_VERSIONS: BibleVersion[] = [
  {
    id: 'RVR1960',
    name: 'Reina Valera 1960',
    abbreviation: 'RVR1960',
    language: 'es',
    year: '1960',
  },
  {
    id: 'KJV',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    year: '1611',
  },
  {
    id: 'WEB',
    name: 'World English Bible',
    abbreviation: 'WEB',
    language: 'en',
    year: '2000',
  },
];

interface BibleVersionContextType {
  selectedVersion: BibleVersion;
  setVersion: (versionId: string) => Promise<void>;
  availableVersions: BibleVersion[];
}

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(
  undefined,
);

export function BibleVersionProvider({children}: {children: ReactNode}) {
  const {language} = useLanguage();
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(
    AVAILABLE_VERSIONS[0],
  );
  // Whether the user has explicitly picked a version in Settings. Until then
  // the version simply follows the UI language.
  const [hasExplicitChoice, setHasExplicitChoice] = useState(false);

  useEffect(() => {
    loadSavedVersion();
  }, []);

  // While the user has not made an explicit choice, keep the Bible version in
  // sync with the UI language (English → KJV, Spanish → RVR1960). This avoids
  // an English UI paired with a Spanish Bible (and search terms that match
  // nothing).
  useEffect(() => {
    if (hasExplicitChoice) return;
    const match = AVAILABLE_VERSIONS.find(v => v.language === language);
    if (match && match.id !== selectedVersion.id) {
      setSelectedVersion(match);
    }
  }, [language, hasExplicitChoice, selectedVersion.id]);

  async function loadSavedVersion() {
    try {
      const savedVersionId = await AsyncStorage.getItem(VERSION_STORAGE_KEY);
      if (savedVersionId) {
        const version = AVAILABLE_VERSIONS.find(v => v.id === savedVersionId);
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

  async function setVersion(versionId: string) {
    const version = AVAILABLE_VERSIONS.find(v => v.id === versionId);
    if (version) {
      setSelectedVersion(version);
      setHasExplicitChoice(true);
      await AsyncStorage.setItem(VERSION_STORAGE_KEY, versionId);
    }
  }

  return (
    <BibleVersionContext.Provider
      value={{
        selectedVersion,
        setVersion,
        availableVersions: AVAILABLE_VERSIONS,
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
