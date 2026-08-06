/**
 * SPIKE smoke test — not a permanent addition. Branch: spike/worklets-bump-live-markdown.
 *
 * Verifies that @expensify/react-native-live-markdown's MarkdownTextInput can
 * be imported without crashing, on top of the react-native-worklets 0.7.4 bump.
 *
 * SPIKE FINDING: the full interactive-render assertion is left as `test.skip`.
 * `MarkdownTextInput` requires a `parser` prop that must carry a
 * `__workletHash` (i.e. be processed by the worklets Babel plugin at build
 * time). In a real Metro-bundled app this happens automatically — Metro runs
 * babel-preset-expo (which chains react-native-worklets/plugin +
 * react-native-reanimated/plugin) over all resolved modules, including
 * node_modules. Under Jest, `transformIgnorePatterns` skips node_modules by
 * default, so the package's compiled `parseExpensiMark` export never gets
 * worklet-ified in the test environment. Adding
 * `@expensify/react-native-live-markdown` (and `react-native-worklets`) to
 * `transformIgnorePatterns` was tried and made things worse (`parser` came
 * back `undefined` entirely, likely a double-transform/module-resolution
 * issue on the already-compiled lib/commonjs output) — resolving that fully
 * is real Jest-wiring work for the future editor-feature branch, not this
 * spike, per the spike's "note as a finding, don't fight it" time budget.
 * This does NOT indicate a native/runtime problem — see the spike report for
 * the actual native Android build result, which is the evidence that matters
 * for the go/no-go call.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {
  MarkdownTextInput,
  parseExpensiMark,
} from '@expensify/react-native-live-markdown';

describe('SPIKE: @expensify/react-native-live-markdown smoke test', () => {
  it('imports MarkdownTextInput without throwing', () => {
    expect(MarkdownTextInput).toBeDefined();
  });

  it.skip('renders MarkdownTextInput without crashing (needs real-app Metro/worklet transform, not available under Jest without more setup — see file header)', () => {
    const {toJSON} = render(
      <MarkdownTextInput
        value="**hello** world"
        markdownStyle={{}}
        onChangeText={() => {}}
        parser={parseExpensiMark}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
