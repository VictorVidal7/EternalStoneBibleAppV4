/**
 * The gate for the NODE_ENV pin at the top of jest.config.js (read the
 * comment there for why the suite needs NODE_ENV === 'test').
 *
 * Two checks, because either one alone can pass without having looked:
 *
 *  1. What the suite really runs under: NODE_ENV inside a test file. On a
 *     machine whose shell exports NODE_ENV (Victor's has 'development') this
 *     fails if the pin goes away. In CI it can't tell: NODE_ENV is unset
 *     there, and jest's CLI then sets 'test' by itself, pin or no pin.
 *  2. The pin itself: a fresh Node process that starts with a given NODE_ENV
 *     and loads jest.config.js — what jest's parent process does before it
 *     forks the workers — must end up with 'test'. This doesn't depend on
 *     the shell running the suite, so it fails in CI too if the line is
 *     removed. The child also reports the value it started with, so a child
 *     that never got the shell value can't pass for one the pin overrode.
 */
import {execFileSync} from 'child_process';
import path from 'path';

const JEST_CONFIG = path.join(__dirname, '..', 'jest.config.js');

/** NODE_ENV in a new Node process before and after it loads jest.config.js. */
function nodeEnvAroundConfigLoad(shellValue: string | undefined): {
  before: string;
  after: string;
} {
  // Plain record: expo's typings declare NODE_ENV as always set, and the
  // 'unset' case needs it gone.
  const env: Record<string, string | undefined> = {...process.env};
  if (shellValue === undefined) {
    delete env.NODE_ENV;
  } else {
    env.NODE_ENV = shellValue;
  }
  const script = [
    'const before = String(process.env.NODE_ENV);',
    `require(${JSON.stringify(JEST_CONFIG)});`,
    'process.stdout.write(JSON.stringify({before, after: String(process.env.NODE_ENV)}));',
  ].join('\n');
  return JSON.parse(
    execFileSync(process.execPath, ['-e', script], {
      env: env as NodeJS.ProcessEnv,
      encoding: 'utf8',
    }),
  );
}

describe('NODE_ENV under jest (jest.config.js pins it)', () => {
  it("is 'test' inside a test file, whatever the shell exported", () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it.each([
    ['development', 'development'],
    ['production', 'production'],
    ['unset', undefined],
  ])(
    "loading jest.config.js with NODE_ENV %s leaves it 'test'",
    (_label, shellValue) => {
      const {before, after} = nodeEnvAroundConfigLoad(shellValue);
      // Control: the child really started with the shell's value.
      expect(before).toBe(String(shellValue));
      expect(after).toBe('test');
    },
  );
});
