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
  voiceSelectorLanguage,
  pickDefaultSpanishVoiceId,
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
const esEsLocal: VoiceInfo = {
  identifier: 'es-es-x-eee-local',
  name: 'es-ES',
  language: 'es-ES',
  quality: 'Enhanced',
};
const esEsNetwork: VoiceInfo = {
  identifier: 'es-es-x-eee-network',
  name: 'es-ES (network)',
  language: 'es-ES',
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

  it('pins an explicit es-ES voice for Spanish content when the list is provided', () => {
    // No user voice → the OS would otherwise substitute an es-us voice that
    // mangles "alabadle" etc. (56th session). Pin an es-ES voice instead.
    expect(
      resolveNarration({
        contentLanguage: 'es',
        selectedLanguage: 'es',
        voice: null,
        availableVoices: [enVoice, esVoice, esEsLocal, esEsNetwork],
      }),
    ).toEqual({language: 'es-ES', voiceId: 'es-es-x-eee-local'});
  });

  it('does not pin a voice for English content', () => {
    expect(
      resolveNarration({
        contentLanguage: 'en',
        selectedLanguage: 'en',
        voice: null,
        availableVoices: [enVoice, esVoice, esEsLocal],
      }),
    ).toEqual({language: 'en-US', voiceId: undefined});
  });

  it('does not override the user’s matching voice with the pinned one', () => {
    expect(
      resolveNarration({
        contentLanguage: 'es',
        selectedLanguage: 'es',
        voice: esVoice, // es-MX, a valid Spanish-family match
        availableVoices: [esEsLocal],
      }),
    ).toEqual({language: 'es-MX', voiceId: 'es-voice-1'});
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

describe('pickDefaultSpanishVoiceId (56th session)', () => {
  it('returns undefined with no list / an empty list', () => {
    expect(pickDefaultSpanishVoiceId(undefined)).toBeUndefined();
    expect(pickDefaultSpanishVoiceId(null)).toBeUndefined();
    expect(pickDefaultSpanishVoiceId([])).toBeUndefined();
  });

  it('returns undefined when no es-ES voice exists (leaves it to the OS)', () => {
    expect(pickDefaultSpanishVoiceId([enVoice, esVoice])).toBeUndefined();
  });

  it('picks an es-ES voice over es-US / es-MX / English', () => {
    expect(pickDefaultSpanishVoiceId([enVoice, esVoice, esEsLocal])).toBe(
      'es-es-x-eee-local',
    );
  });

  it('prefers the offline es-ES voice over the "-network" one', () => {
    expect(pickDefaultSpanishVoiceId([esEsNetwork, esEsLocal])).toBe(
      'es-es-x-eee-local',
    );
  });

  it('matches an "es_ES" underscore tag too', () => {
    expect(
      pickDefaultSpanishVoiceId([
        {...esEsLocal, language: 'es_ES', identifier: 'underscore-tag'},
      ]),
    ).toBe('underscore-tag');
  });

  it('does not match es-ESX or other near-miss tags', () => {
    expect(
      pickDefaultSpanishVoiceId([
        {...esEsLocal, language: 'es-ESX', identifier: 'near-miss'},
      ]),
    ).toBeUndefined();
  });
});

describe('voiceSelectorLanguage (Sprint 101)', () => {
  it('locks to the loaded content language and ignores the manual pick', () => {
    // Spanish text loaded while the manual preference is still English: the
    // selector must show Spanish voices and hide the toggle — an English voice
    // would be dropped by resolveNarration anyway.
    expect(
      voiceSelectorLanguage({contentLanguage: 'es', selectedLanguage: 'en'}),
    ).toEqual({language: 'es', locked: true});
    expect(
      voiceSelectorLanguage({contentLanguage: 'en', selectedLanguage: 'es'}),
    ).toEqual({language: 'en', locked: true});
  });

  it('falls back to the manual selectedLanguage with nothing loaded', () => {
    expect(
      voiceSelectorLanguage({contentLanguage: null, selectedLanguage: 'es'}),
    ).toEqual({language: 'es', locked: false});
    expect(
      voiceSelectorLanguage({contentLanguage: null, selectedLanguage: 'en'}),
    ).toEqual({language: 'en', locked: false});
  });
});
