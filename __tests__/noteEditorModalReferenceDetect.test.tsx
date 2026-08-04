/**
 * NoteEditorModal — inline reference auto-detection (ported from
 * "Notas de sermón", see `src/features/study/sermonNotes.ts`'s
 * `getReferencedVerses`). Any Bible reference typed inline in a verse note
 * ("como dice Juan 3:16") now surfaces as a tappable chip below the input.
 *
 * The pure detection/formatting logic itself (`getReferencedVerses`,
 * `formatReferencedVerseLabel`) is already covered by
 * `__tests__/sermonNotes.test.ts` — this file only covers the NEW logic this
 * port adds: excluding the verse the note is already attached to, and that
 * tapping a chip saves the in-progress draft (never silently dropping it —
 * unlike sermon-notes' autosaving editor, this modal's draft only lives in
 * the parent's state until explicitly saved) before jumping the reader.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {NoteEditorModal} from '../src/components/reading/NoteEditorModal';
import {translations} from '../src/i18n/translations';

const mockColors = {
  overlay: 'rgba(0,0,0,0.5)',
  surface: '#111111',
  border: '#222222',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  surfaceVariant: '#1a1a1a',
  primary: '#6366f1',
  success: '#22c55e',
  onPrimary: '#ffffff',
};

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));
jest.mock('@lib/haptics', () => ({haptics: {tap: jest.fn()}}));

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockRouterPush}),
}));

// NoteImageModal drags in view-shot/expo-sharing/Premium/OfferingSheet — none
// of that is relevant here, so it's stubbed out wholesale rather than mocking
// its whole dependency tree (mirrors testimonyImageModal.test.tsx's approach
// for a similar share-image modal).
jest.mock('../src/components/reading/NoteImageModal', () => ({
  NoteImageModal: () => null,
}));

const h = translations.es.notes;

const baseProps = {
  visible: true,
  verseReference: 'Juan 3:16',
  verseText: 'Porque de tal manera amó Dios al mundo...',
  onChangeText: jest.fn(),
  onSave: jest.fn(),
  onClose: jest.fn(),
};

describe('NoteEditorModal — reference auto-detection', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  it('shows no referenced-verses section for a draft with no references', () => {
    const {queryByText} = render(
      <NoteEditorModal {...baseProps} value="Una nota sin referencias." />,
    );
    expect(queryByText(h.referencedVersesTitle)).toBeNull();
  });

  it('shows the referenced-verses section title once a reference is detected', () => {
    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        value="Esto me recuerda a Romanos 8:28."
      />,
    );
    expect(getByText(h.referencedVersesTitle)).toBeTruthy();
  });

  it('shows a chip for a reference typed inline as the draft changes', () => {
    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        value="Esto me recuerda a Romanos 8:28."
      />,
    );
    expect(getByText('Romanos 8:28')).toBeTruthy();
  });

  it('dedupes and lists multiple distinct references', () => {
    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        value="Leímos Romanos 8:28 y también Efesios 2:8-9."
      />,
    );
    expect(getByText('Romanos 8:28')).toBeTruthy();
    expect(getByText('Efesios 2:8-9')).toBeTruthy();
  });

  it('excludes the verse the note is already attached to', () => {
    const {getAllByText} = render(
      <NoteEditorModal
        {...baseProps}
        verseReference="Juan 3:16"
        value="Como dice Juan 3:16, Dios amó al mundo."
      />,
    );
    // "Juan 3:16" still appears once — as the modal's own header title — but
    // never a second time as a chip.
    expect(getAllByText('Juan 3:16')).toHaveLength(1);
  });

  it('does NOT exclude a chapter-only or range mention overlapping the attached verse', () => {
    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        verseReference="Juan 3:16"
        value="Lean todo Juan 3, especialmente Juan 3:16-18."
      />,
    );
    expect(getByText('Juan 3')).toBeTruthy();
    expect(getByText('Juan 3:16-18')).toBeTruthy();
  });

  it('tapping a chip saves the draft BEFORE navigating, then notifies onJump/onClose', () => {
    const order: string[] = [];
    const onSave = jest.fn(() => order.push('save'));
    const onClose = jest.fn(() => order.push('close'));
    const onJump = jest.fn(() => order.push('jump'));
    mockRouterPush.mockImplementation(() => order.push('push'));

    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        value="Esto me recuerda a Romanos 8:28."
        onSave={onSave}
        onClose={onClose}
        onJump={onJump}
      />,
    );
    fireEvent.press(getByText('Romanos 8:28'));

    expect(order).toEqual(['save', 'jump', 'close', 'push']);
    expect(mockRouterPush).toHaveBeenCalledWith('/verse/Romans/8?verse=28');
  });

  it('works without an onJump handler (optional prop)', () => {
    const onSave = jest.fn();
    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        value="Esto me recuerda a Romanos 8:28."
        onSave={onSave}
      />,
    );
    expect(() => fireEvent.press(getByText('Romanos 8:28'))).not.toThrow();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith('/verse/Romans/8?verse=28');
  });

  it('jumps to a chapter-only reference without a ?verse= query param', () => {
    const {getByText} = render(
      <NoteEditorModal
        {...baseProps}
        verseReference="Juan 3:16"
        value="Lean todo Romanos 8 esta semana."
      />,
    );
    fireEvent.press(getByText('Romanos 8'));
    expect(mockRouterPush).toHaveBeenCalledWith('/verse/Romans/8');
  });
});
