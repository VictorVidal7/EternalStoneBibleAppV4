/**
 * useVoices Hook
 *
 * Hook para obtener y filtrar las voces disponibles del sistema
 * Soporta espanol e ingles
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import * as Speech from 'expo-speech';
import {logger} from '@lib/utils/logger';
import {VoiceInfo, AudioLanguage} from '../types/audio';
import {SUPPORTED_LANGUAGES} from '../constants/audioConstants';

interface UseVoicesReturn {
  voices: VoiceInfo[];
  spanishVoices: VoiceInfo[];
  englishVoices: VoiceInfo[];
  isLoading: boolean;
  error: string | null;
  refreshVoices: () => Promise<void>;
  getVoicesByLanguage: (language: AudioLanguage) => VoiceInfo[];
  previewVoice: (voice: VoiceInfo, text?: string) => Promise<void>;
  stopPreview: () => Promise<void>;
}

export const useVoices = (): UseVoicesReturn => {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchVoices = useCallback(async () => {
    // Only surface the loading state on the first fetch. A later `refreshVoices`
    // (the selector re-opening after the user installed a "Español (España)"
    // voice — 58th session) swaps the list in silently instead of flashing the
    // whole modal to a spinner mid-interaction.
    if (!hasFetchedRef.current) setIsLoading(true);
    setError(null);

    try {
      const availableVoices = await Speech.getAvailableVoicesAsync();

      // Filter and map voices
      const filteredVoices: VoiceInfo[] = availableVoices
        .filter(voice => {
          // Check if voice language matches any supported language
          const langCode = voice.language.toLowerCase();
          const isSpanish = SUPPORTED_LANGUAGES.es.some(l =>
            langCode.startsWith(l.toLowerCase().split('-')[0]),
          );
          const isEnglish = SUPPORTED_LANGUAGES.en.some(l =>
            langCode.startsWith(l.toLowerCase().split('-')[0]),
          );
          return isSpanish || isEnglish;
        })
        .map(voice => ({
          identifier: voice.identifier,
          name: voice.name,
          language: voice.language,
          quality: (voice.quality || 'Default') as VoiceInfo['quality'],
          isNetworkRequired: false,
        }))
        // Sort by quality (Premium > Enhanced > Default)
        .sort((a, b) => {
          const qualityOrder = {Premium: 0, Enhanced: 1, Default: 2};
          return (
            qualityOrder[a.quality as keyof typeof qualityOrder] -
            qualityOrder[b.quality as keyof typeof qualityOrder]
          );
        });

      setVoices(filteredVoices);
    } catch (err) {
      // Recoverable (the selector shows its empty/error state and the next
      // open refetches) — logger.warn, not console.error, so a flaky TTS
      // service doesn't pop a dev LogBox pill over devotional screens.
      logger.warn('Error fetching voices', {error: String(err)});
      setError('No se pudieron cargar las voces disponibles');
    } finally {
      hasFetchedRef.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const getVoicesByLanguage = useCallback(
    (language: AudioLanguage): VoiceInfo[] => {
      const langCodes = SUPPORTED_LANGUAGES[language];
      return voices.filter(voice => {
        const voiceLang = voice.language.toLowerCase();
        return langCodes.some(l =>
          voiceLang.startsWith(l.toLowerCase().split('-')[0]),
        );
      });
    },
    [voices],
  );

  const spanishVoices = getVoicesByLanguage('es');
  const englishVoices = getVoicesByLanguage('en');

  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const previewVoice = useCallback(async (voice: VoiceInfo, text?: string) => {
    const previewText =
      text ||
      (voice.language.startsWith('es')
        ? 'Porque de tal manera amo Dios al mundo'
        : 'For God so loved the world');

    await Speech.stop();
    setIsPreviewActive(true);
    await Speech.speak(previewText, {
      voice: voice.identifier,
      language: voice.language,
      rate: 1.0,
      onDone: () => setIsPreviewActive(false),
      onStopped: () => setIsPreviewActive(false),
      onError: () => setIsPreviewActive(false),
    });
  }, []);

  const stopPreview = useCallback(async () => {
    if (isPreviewActive) {
      await Speech.stop();
      setIsPreviewActive(false);
    }
  }, [isPreviewActive]);

  return {
    voices,
    spanishVoices,
    englishVoices,
    isLoading,
    error,
    refreshVoices: fetchVoices,
    getVoicesByLanguage,
    previewVoice,
    stopPreview,
  };
};

export default useVoices;
