import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleVersion } from '../types/bible';

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
];

interface BibleVersionContextType {
  selectedVersion: BibleVersion;
  setVersion: (versionId: string) => Promise<void>;
  availableVersions: BibleVersion[];
}

const BibleVersionContext = createContext<BibleVersionContextType | undefined>(undefined);

export function BibleVersionProvider({ children }: { children: ReactNode }) {
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(AVAILABLE_VERSIONS[0]);

  useEffect(() => {
    loadSavedVersion();
  }, []);

  async function loadSavedVersion() {
    try {
      const savedVersionId = await AsyncStorage.getItem(VERSION_STORAGE_KEY);
      if (savedVersionId) {
        const version = AVAILABLE_VERSIONS.find(v => v.id === savedVersionId);
        if (version) {
          setSelectedVersion(version);
        }
      }
    } catch (error) {
      console.error('Error loading saved version:', error);
    }
  }

  async function setVersion(versionId: string) {
    const version = AVAILABLE_VERSIONS.find(v => v.id === versionId);
    if (version) {
      setSelectedVersion(version);
      await AsyncStorage.setItem(VERSION_STORAGE_KEY, versionId);
    }
  }

  return (
    <BibleVersionContext.Provider
      value={{
        selectedVersion,
        setVersion,
        availableVersions: AVAILABLE_VERSIONS,
      }}
    >
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
