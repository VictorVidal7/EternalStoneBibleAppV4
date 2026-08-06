/**
 * Standalone integration check for the `@expensify/react-native-live-markdown`
 * Jest mock wired in `jest.setup.js`.
 *
 * The library's OWN documented mock pattern —
 * `jest.mock('@expensify/react-native-live-markdown', () =>
 * require('@expensify/react-native-live-markdown/mock'))` — was tried
 * first and does NOT work in this project's Jest resolver setup: `jest.mock`
 * intercepts by resolved absolute path, this package has no "exports" map
 * (only legacy "main"/"module"/"react-native" string fields), and Jest's
 * default resolver only understands "main" — not the ad hoc "react-native"
 * field Metro honors at bundle time. That resolves the bare specifier to
 * `lib/commonjs/index.js`, the SAME absolute file the shipped mock's own
 * `require("../index.js")` reaches. Since it's the same file already being
 * mocked, that internal require hits Jest's circular-require short-circuit
 * and gets back an empty, still-in-progress exports object — `MarkdownTextInput`
 * silently comes back `undefined` (confirmed on a pristine `node_modules`
 * reinstall). See `jest.setup.js`'s own comment on the mock it actually
 * uses instead: the real component pulled via `jest.requireActual` from a
 * deep subpath that sits outside that self-referential file, plus the
 * three `global.jsi_*` stubs the shipped mock also sets.
 *
 * That mock does NOT stub this app's custom `parseNoteMarkdownRanges`
 * (`src/lib/notes/noteMarkdownRanges.ts`), which still runs for real here.
 * This is the piece the deleted spike smoke test
 * (`git log -p -- __tests__/spikeLiveMarkdownSmoke.test.tsx`) left as a
 * documented `it.skip`: the library's own precompiled parser ships from
 * `node_modules` and is never worklet-instrumented under Jest
 * (`transformIgnorePatterns` skips node_modules, so the worklets Babel
 * plugin never runs over it there). `parseNoteMarkdownRanges` sidesteps
 * that entirely by living in this app's own `src/` tree, where Jest's
 * normal babel-jest transform — using this project's own
 * `babel.config.js`, which chains `react-native-worklets/plugin` — DOES
 * apply, the same as it does for every other first-party test in this repo.
 *
 * Kept as a real (non-skipped) regression test: if this stops rendering,
 * something about the mock wiring broke, independent of anything
 * `NoteEditorModal` itself does.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {MarkdownTextInput} from '@expensify/react-native-live-markdown';
import {parseNoteMarkdownRanges} from '../src/lib/notes/noteMarkdownRanges';

describe('MarkdownTextInput + parseNoteMarkdownRanges — mock integration', () => {
  it('renders without crashing, with the real custom worklet parser wired in', () => {
    const {toJSON} = render(
      <MarkdownTextInput
        value="**hello** world"
        markdownStyle={{}}
        onChangeText={() => {}}
        parser={parseNoteMarkdownRanges}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
