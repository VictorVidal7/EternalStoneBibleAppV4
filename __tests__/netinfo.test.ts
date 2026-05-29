import {isStateOnline} from '../src/lib/sync/netinfo';

describe('isStateOnline (Sprint 46 — reachability hardening)', () => {
  it('is optimistic when there is no signal', () => {
    expect(isStateOnline(null)).toBe(true);
    expect(isStateOnline(undefined)).toBe(true);
  });

  it('treats an explicit not-connected as offline', () => {
    expect(isStateOnline({isConnected: false, isInternetReachable: true})).toBe(
      false,
    );
    expect(isStateOnline({isConnected: false, isInternetReachable: null})).toBe(
      false,
    );
  });

  it('stays online when connected even if reachability is false/null', () => {
    // The crux of the fix: the unreliable reachability probe no longer
    // forces offline — this is exactly the emulator state that blocked
    // outbound sync in Sprint 45.
    expect(isStateOnline({isConnected: true, isInternetReachable: false})).toBe(
      true,
    );
    expect(isStateOnline({isConnected: true, isInternetReachable: null})).toBe(
      true,
    );
  });

  it('stays online when fully connected and reachable', () => {
    expect(isStateOnline({isConnected: true, isInternetReachable: true})).toBe(
      true,
    );
  });

  it('stays online when connectivity is unknown (null) on both fields', () => {
    expect(isStateOnline({isConnected: null, isInternetReachable: null})).toBe(
      true,
    );
  });
});
