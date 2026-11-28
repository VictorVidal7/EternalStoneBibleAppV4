/**
 * giftCodeService unit tests.
 *
 * Mocks @react-native-firebase/auth's lazy require() (same pattern as
 * AuthContext.test.tsx), offeringService's linkUser (see below), and global
 * fetch, so every RedeemOutcome the redeemGiftCode Cloud Function can
 * produce (see functions/src/index.ts's RedeemResult) is exercised without
 * a real network call or native module.
 */

const mockGetIdToken = jest.fn();
let mockCurrentUser: {uid: string; getIdToken: jest.Mock} | null = null;

// Modular API (v26) — getAuth() returns the instance directly (no more
// callable namespaced default export); currentUser stays a property on it.
const mockGetAuth = jest.fn(() => ({
  get currentUser() {
    return mockCurrentUser;
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  getAuth: mockGetAuth,
}));

// Only linkUser is mocked (not refreshEntitlement — giftCodeService doesn't
// call it, RedeemCodeSheet does) — see redeemGiftCode's defensive re-link
// comment for why a successful redemption also calls this.
const mockLinkUser = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/lib/offering/offeringService', () => ({
  linkUser: (...args: unknown[]) => mockLinkUser(...args),
}));

import {
  redeemGiftCode,
  REDEEM_GIFT_CODE_URL,
  REDEEM_TIMEOUT_MS,
  __resetForTests,
} from '../src/lib/offering/giftCodeService';

function mockFetchOnce(status: number, body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

describe('giftCodeService.redeemGiftCode', () => {
  beforeEach(() => {
    __resetForTests();
    mockGetIdToken.mockReset().mockResolvedValue('fake-id-token');
    mockCurrentUser = {uid: 'uid-123', getIdToken: mockGetIdToken};
    mockLinkUser.mockClear().mockResolvedValue(undefined);
    global.fetch = jest.fn();
  });

  it('returns invalid for an empty/blank code without calling fetch', async () => {
    expect(await redeemGiftCode('   ')).toEqual({status: 'invalid'});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns invalid when there is no signed-in user, without calling fetch', async () => {
    mockCurrentUser = null;
    expect(await redeemGiftCode('ABCD-1234')).toEqual({status: 'invalid'});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns error when getIdToken() throws, without calling fetch', async () => {
    mockGetIdToken.mockRejectedValue(new Error('token fetch failed'));
    const outcome = await redeemGiftCode('ABCD-1234');
    expect(outcome.status).toBe('error');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('POSTs the trimmed code with a Bearer auth header', async () => {
    mockFetchOnce(200, {status: 'success'});
    await redeemGiftCode('  ABCD-1234  ');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(REDEEM_GIFT_CODE_URL);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer fake-id-token');
    expect(JSON.parse(init.body)).toEqual({code: 'ABCD-1234'});
  });

  it('maps a 200 success response to {status: success}', async () => {
    mockFetchOnce(200, {status: 'success'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({status: 'success'});
  });

  it('re-links the RevenueCat App User ID to this uid on success', async () => {
    // Defensive re-link (see redeemGiftCode's comment): closes the gap
    // where offeringService.linkUser() may have silently no-op'd earlier
    // at cold start, before RevenueCat finished configuring.
    mockFetchOnce(200, {status: 'success'});
    await redeemGiftCode('ABCD-1234');
    expect(mockLinkUser).toHaveBeenCalledWith('uid-123');
  });

  describe('R9-592 — la sesion cambia mientras el servidor responde', () => {
    // El canje lee la cuenta al empezar; si al volver del fetch ya no es la
    // que esta en sesion, no la enlaza: moveria RevenueCat a la cuenta que
    // salio, y la anotaria como la cuenta en sesion (R9-582).
    function fetchOnceChangingSessionTo(
      next: {uid: string; getIdToken: jest.Mock} | null,
    ) {
      (global.fetch as jest.Mock).mockImplementationOnce(async () => {
        mockCurrentUser = next;
        return {
          status: 200,
          json: jest.fn().mockResolvedValue({status: 'success'}),
        };
      });
    }

    it('cerro sesion durante el canje: el canje sale bien y no enlaza a la cuenta que salio', async () => {
      fetchOnceChangingSessionTo(null);
      await expect(redeemGiftCode('ABCD-1234')).resolves.toEqual({
        status: 'success',
      });
      expect(mockLinkUser).not.toHaveBeenCalled();
    });

    it('entro otra cuenta durante el canje: no enlaza a la que canjeo', async () => {
      fetchOnceChangingSessionTo({
        uid: 'uid-carla',
        getIdToken: mockGetIdToken,
      });
      await redeemGiftCode('ABCD-1234');
      expect(mockLinkUser).not.toHaveBeenCalled();
    });

    it('la misma cuenta, releida (otro objeto, mismo uid): enlaza', async () => {
      fetchOnceChangingSessionTo({uid: 'uid-123', getIdToken: mockGetIdToken});
      await redeemGiftCode('ABCD-1234');
      expect(mockLinkUser).toHaveBeenCalledWith('uid-123');
    });
  });

  it('does not call linkUser again for a non-success outcome', async () => {
    mockFetchOnce(409, {status: 'already_redeemed'});
    await redeemGiftCode('ABCD-1234');
    expect(mockLinkUser).not.toHaveBeenCalled();
  });

  it('still reports success even if the defensive re-link itself fails', async () => {
    mockLinkUser.mockRejectedValue(new Error('offline'));
    mockFetchOnce(200, {status: 'success'});
    await expect(redeemGiftCode('ABCD-1234')).resolves.toEqual({
      status: 'success',
    });
  });

  it('maps a 409 already_redeemed response to {status: already_redeemed}', async () => {
    mockFetchOnce(409, {status: 'already_redeemed'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({
      status: 'already_redeemed',
    });
  });

  it('maps a 404 not_found response to {status: not_found}', async () => {
    mockFetchOnce(404, {status: 'not_found'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({status: 'not_found'});
  });

  it('maps a 401 invalid_token response to {status: invalid}', async () => {
    mockFetchOnce(401, {status: 'invalid_token', message: 'bad token'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({status: 'invalid'});
  });

  it('maps a 400 invalid_request response to {status: invalid}', async () => {
    mockFetchOnce(400, {status: 'invalid_request', message: 'missing code'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({status: 'invalid'});
  });

  it('maps a 500 server_error response to {status: error, message}', async () => {
    mockFetchOnce(500, {status: 'server_error', message: 'RevenueCat down'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({
      status: 'error',
      message: 'RevenueCat down',
    });
  });

  it('maps an unrecognized/non-JSON response to a generic error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 502,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    });
    const outcome = await redeemGiftCode('ABCD-1234');
    expect(outcome.status).toBe('error');
  });

  it('returns error when the network request itself throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    const outcome = await redeemGiftCode('ABCD-1234');
    expect(outcome.status).toBe('error');
  });
});

describe('R9-620 — the redemption has a deadline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    __resetForTests();
    mockGetIdToken.mockReset().mockResolvedValue('fake-id-token');
    mockCurrentUser = {uid: 'uid-123', getIdToken: mockGetIdToken};
    mockLinkUser.mockClear().mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  /** Settles `p` into a box, so a hang reads as `undefined`, not a stuck test. */
  function track<T>(p: Promise<T>): {value?: T} {
    const box: {value?: T} = {};
    void p.then(v => (box.value = v));
    return box;
  }

  it('a server that never answers (and ignores the abort): an error, not a spinner forever', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as never;
    const outcome = track(redeemGiftCode('ABCD-1234'));
    await jest.advanceTimersByTimeAsync(REDEEM_TIMEOUT_MS - 1);
    expect(outcome.value).toBeUndefined();
    await jest.advanceTimersByTimeAsync(1);
    expect(outcome.value).toEqual({status: 'error', message: 'Timed out'});
    expect(mockLinkUser).not.toHaveBeenCalled();
  });

  it('the request carries a signal, and the deadline aborts it', async () => {
    let signal: AbortSignal | undefined;
    global.fetch = jest.fn(
      (_url: string, init?: {signal?: AbortSignal}) =>
        new Promise((_, reject) => {
          signal = init?.signal;
          signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    ) as never;
    const outcome = track(redeemGiftCode('ABCD-1234'));
    await jest.advanceTimersByTimeAsync(0);
    expect(signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(REDEEM_TIMEOUT_MS);
    expect(signal?.aborted).toBe(true);
    expect(outcome.value?.status).toBe('error');
  });

  it('headers that arrive with a body that never does: the deadline covers the body too', async () => {
    global.fetch = jest.fn(async () => ({
      status: 200,
      json: () => new Promise(() => {}),
    })) as never;
    const outcome = track(redeemGiftCode('ABCD-1234'));
    await jest.advanceTimersByTimeAsync(REDEEM_TIMEOUT_MS);
    expect(outcome.value).toEqual({status: 'error', message: 'Timed out'});
  });

  it('CONTROL: an answer just under the deadline is still a success', async () => {
    global.fetch = jest.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({status: 200, json: async () => ({status: 'success'})}),
            REDEEM_TIMEOUT_MS - 1,
          ),
        ),
    ) as never;
    const outcome = track(redeemGiftCode('ABCD-1234'));
    await jest.advanceTimersByTimeAsync(REDEEM_TIMEOUT_MS - 1);
    expect(outcome.value).toEqual({status: 'success'});
    expect(mockLinkUser).toHaveBeenCalledWith('uid-123');
  });
});
