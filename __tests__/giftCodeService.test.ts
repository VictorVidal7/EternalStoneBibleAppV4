/**
 * giftCodeService unit tests.
 *
 * Mocks @react-native-firebase/auth's lazy require() (same pattern as
 * AuthContext.test.tsx) and global fetch, so every RedeemOutcome the
 * redeemGiftCode Cloud Function can produce (see functions/src/index.ts's
 * RedeemResult) is exercised without a real network call or native module.
 */

const mockGetIdToken = jest.fn();
let mockCurrentUser: {getIdToken: jest.Mock} | null = null;

const mockAuthFn = jest.fn(() => ({
  get currentUser() {
    return mockCurrentUser;
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: mockAuthFn,
}));

import {
  redeemGiftCode,
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
    mockCurrentUser = {getIdToken: mockGetIdToken};
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
    expect(url).toEqual(expect.stringContaining('redeemGiftCode'));
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer fake-id-token');
    expect(JSON.parse(init.body)).toEqual({code: 'ABCD-1234'});
  });

  it('maps a 200 success response to {status: success}', async () => {
    mockFetchOnce(200, {status: 'success'});
    expect(await redeemGiftCode('ABCD-1234')).toEqual({status: 'success'});
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
