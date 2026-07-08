/**
 * Unit coverage for isStorageLockError (T22). app/_layout.web.tsx is a
 * .web.tsx file that jest-expo never loads (T21), so this pure classifier
 * was extracted into a plain .ts module specifically so it stays testable.
 *
 * Fixtures mirror the ACTUAL shape errors take by the time they reach
 * app/_layout.web.tsx: expo-sqlite's WorkerChannel re-wraps whatever the
 * worker threw as `new Error(originalError)`, which stringifies the
 * original DOMException into the message and resets `.name` to the generic
 * "Error" (see src/lib/database/storageLockError.ts's doc comment for the
 * full trace through node_modules/expo-sqlite/web/*).
 */
import {isStorageLockError} from '../src/lib/database/storageLockError';

describe('isStorageLockError', () => {
  it('recognizes a re-wrapped NoModificationAllowedError (the real shape post-WorkerChannel)', () => {
    const err = new Error(
      "NoModificationAllowedError: Failed to execute 'createSyncAccessHandle' on 'FileSystemFileHandle': Access Handles cannot be created because there is already an open access handle.",
    );
    expect(isStorageLockError(err)).toBe(true);
  });

  it('recognizes a re-wrapped InvalidStateError', () => {
    const err = new Error(
      "InvalidStateError: Failed to execute 'createSyncAccessHandle' on 'FileSystemFileHandle': An operation is not allowed on the current file handle state.",
    );
    expect(isStorageLockError(err)).toBe(true);
  });

  it('recognizes the literal "Invalid VFS state" retry-poisoning error', () => {
    const err = new Error('Invalid VFS state');
    expect(isStorageLockError(err)).toBe(true);
  });

  it('recognizes a raw (unwrapped) DOMException, in case a future expo-sqlite version stops wrapping', () => {
    const err = new DOMException(
      'Access Handles cannot be created because there is already an open access handle.',
      'NoModificationAllowedError',
    );
    expect(isStorageLockError(err)).toBe(true);
  });

  it('does NOT flag an ordinary HTTP fetch failure', () => {
    const err = new Error('Web pack fetch failed (rvr1960.sqlite): HTTP 404');
    expect(isStorageLockError(err)).toBe(false);
  });

  it('does NOT flag an offline / network TypeError', () => {
    const err = new TypeError('Failed to fetch');
    expect(isStorageLockError(err)).toBe(false);
  });

  it('does NOT flag a generic app init error', () => {
    const err = new Error('Failed to initialize app');
    expect(isStorageLockError(err)).toBe(false);
  });

  it('handles non-Error thrown values without throwing', () => {
    expect(isStorageLockError('Invalid VFS state')).toBe(true);
    expect(isStorageLockError('some string error')).toBe(false);
    expect(isStorageLockError(null)).toBe(false);
    expect(isStorageLockError(undefined)).toBe(false);
    expect(isStorageLockError(42)).toBe(false);
  });

  it('duck-types an Error-shaped plain object (e.g. a structured-clone that lost its prototype)', () => {
    expect(isStorageLockError({name: '', message: 'Invalid VFS state'})).toBe(
      true,
    );
    expect(isStorageLockError({message: 'some other failure'})).toBe(false);
  });
});
