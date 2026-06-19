/**
 * Sprint 100 — TTS narration follows the Bible version's language.
 *
 * Locks the rule that fixes the "se hace bolas la voz" garble: the spoken
 * language follows the LANGUAGE OF THE TEXT (its Bible version), and a chosen
 * voice is only used when its language family matches — so switching the Bible
 * version mid-listen never leaves an English voice reading Spanish text.
 */
import {
  toAudioLanguage,
  voiceLanguageFamily,
  resolveNarration,
} from '../src/features/audio/lib/narrationVoice';
import type {VoiceInfo} from '../src/features/audio/types/audio';

const enVoice: VoiceInfo = {
  identifier: 'en-voice-1',
  name: 'English Voice',
  language: 'en-US',
  quality: 'Enhanced',
};
const esVoice: VoiceInfo = {
  identifier: 'es-voice-1',
  name: 'Voz en Español',
  language: 'es-MX',
  quality: 'Enhanced',
};

describe('toAudioLanguage', () => {
  it('maps a Spanish version tag to es', () => {
    expect(toAudioLanguage('es')).toBe('es');
  });
  it('maps English (and anything non-Spanish) to en', () => {
    expect(toAudioLanguage('en')).toBe('en');
    expect(toAudioLanguage('fr')).toBe('en');
    expect(toAudioLanguage(undefined)).toBe('en');
    expect(toAudioLanguage(null)).toBe('en');
  });
});

describe('voiceLanguageFamily', () => {
  it('reduces a region tag to its language family', () => {
    expect(voiceLanguageFamily('es-MX')).toBe('es');
    expect(voiceLanguageFamily('en-GB')).toBe('en');
    expect(voiceLanguageFamily('EN-us')).toBe('en');
  });
  it('returns null for unsupported or empty tags', () => {
    expect(voiceLanguageFamily('fr-FR')).toBeNull();
    expect(voiceLanguageFamily('')).toBeNull();
    expect(voiceLanguageFamily(null)).toBeNull();
    expect(voiceLanguageFamily(undefined)).toBeNull();
  });
});

describe('resolveNarration', () => {
  it('drops a mismatched English voice when reading Spanish text (the bug)', () => {
    const choice = resolveNarration({
      contentLanguage: 'es',
      selectedLanguage: 'en',
      voice: enVoice,
    });
    expect(choice).toEqual({language: 'es-ES', voiceId: undefined});
  });

  it('drops a mismatched Spanish voice when reading English text (the reverse)', () => {
    const choice = resolveNarration({
      contentLanguage: 'en',
      selectedLanguage: 'es',
      voice: esVoice,
    });
    expect(choice).toEqual({language: 'en-US', voiceId: undefined});
  });

  it('keeps the chosen voice when it matches the content language', () => {
    expect(
      resolveNarration({
        contentLanguage: 'en',
        selectedLanguage: 'en',
        voice: enVoice,
      }),
    ).toEqual({language: 'en-US', voiceId: 'en-voice-1'});
    expect(
      resolveNarration({
        contentLanguage: 'es',
        selectedLanguage: 'es',
        voice: esVoice,
      }),
    ).toEqual({language: 'es-MX', voiceId: 'es-voice-1'});
  });

  it('uses the content language even with no voice selected', () => {
    expect(
      resolveNarration({
        contentLanguage: 'es',
        selectedLanguage: 'en',
        voice: null,
      }),
    ).toEqual({language: 'es-ES', voiceId: undefined});
  });

  it('falls back to the manual selectedLanguage when content language is unknown', () => {
    // Legacy load (no version info): behaviour is exactly as before.
    expect(
      resolveNarration({
        contentLanguage: null,
        selectedLanguage: 'en',
        voice: enVoice,
      }),
    ).toEqual({language: 'en-US', voiceId: 'en-voice-1'});
    expect(
      resolveNarration({
        contentLanguage: null,
        selectedLanguage: 'es',
        voice: null,
      }),
    ).toEqual({language: 'es-ES', voiceId: undefined});
  });
});
