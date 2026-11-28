/**
 * vercel/gift-code-redeem/api/redeem.ts — the gift-code endpoint, run from the
 * root jest with its three firebase-admin modules and RevenueCat (global
 * fetch) simulated. The handler itself is the real one: it is loaded with
 * require() so the root `tsc -p .` does not follow it (that folder is its own
 * Node project, with `@vercel/node` installed only there; its import is
 * type-only and babel erases it).
 *
 * The Firestore stand-in keeps the documents in a Map and runs a transaction
 * the way the Admin SDK does for one caller: reads, then the buffered writes
 * land only if the callback resolves. `doc()` throws on a "/" in the id, as
 * the real SDK does on a path with the wrong number of segments.
 */

type CodeDoc = {
  redeemed: boolean;
  redeemedByUid: string | null;
  redeemedAt: unknown;
  createdAt?: unknown;
  note?: string | null;
};

const mockDocs = new Map<string, CodeDoc>();
// How many of the next runTransaction() calls reject before running.
let mockTxFailures = 0;
const mockCollection = jest.fn();
const mockVerifyIdToken = jest.fn();

function mockRef(id: string) {
  if (id.includes('/')) {
    throw new Error(
      `Value for argument "documentPath" must point to a document, got "giftCodes/${id}"`,
    );
  }
  const snap = () => {
    const data = mockDocs.get(id);
    return {exists: data !== undefined, data: () => (data ? {...data} : data)};
  };
  return {id, get: async () => snap(), snap};
}

const mockDb = {
  collection: (name: string) => {
    mockCollection(name);
    return {doc: (id: string) => mockRef(id)};
  },
  runTransaction: async <T>(
    fn: (tx: {
      get: (ref: ReturnType<typeof mockRef>) => Promise<unknown>;
      update: (ref: ReturnType<typeof mockRef>, data: object) => void;
    }) => Promise<T>,
  ): Promise<T> => {
    if (mockTxFailures > 0) {
      mockTxFailures--;
      throw new Error('DEADLINE_EXCEEDED: transaction failed');
    }
    const writes: Array<() => void> = [];
    const result = await fn({
      get: async ref => ref.snap(),
      update: (ref, data) =>
        writes.push(() =>
          mockDocs.set(ref.id, {...(mockDocs.get(ref.id) as CodeDoc), ...data}),
        ),
    });
    writes.forEach(w => w());
    return result;
  },
};

// The mocks are registered on the path redeem.ts itself resolves, not on the
// bare name: with `vercel/gift-code-redeem/node_modules` installed (it is
// git-ignored, so only some checkouts have it) the endpoint resolves ITS OWN
// firebase-admin, a different file from the one a bare `jest.mock` (resolved
// from this test) intercepts, and the real Admin SDK ran at load time. With
// neither copy resolvable, the mock is virtual.
const ENDPOINT_DIR = require('path').join(
  __dirname,
  '../vercel/gift-code-redeem/api',
);
function mockForEndpoint(name: string, factory: () => unknown) {
  let target = name;
  let virtual = false;
  try {
    target = require.resolve(name, {paths: [ENDPOINT_DIR]});
  } catch {
    virtual = true;
  }
  jest.doMock(target, factory, {virtual});
}
mockForEndpoint('firebase-admin/app', () => ({
  cert: (x: unknown) => x,
  getApps: () => [],
  initializeApp: jest.fn(),
}));
mockForEndpoint('firebase-admin/auth', () => ({
  getAuth: () => ({verifyIdToken: mockVerifyIdToken}),
}));
mockForEndpoint('firebase-admin/firestore', () => ({
  getFirestore: () => mockDb,
  FieldValue: {serverTimestamp: () => 'SERVER_TS'},
}));

process.env.FIREBASE_SERVICE_ACCOUNT = '{}';
process.env.REVENUECAT_SECRET_KEY = 'sk_test';

const handler = require('../vercel/gift-code-redeem/api/redeem').default as (
  req: unknown,
  res: unknown,
) => Promise<void>;

const CODE = 'ABCD-EFGH';

async function post(code: unknown, uid = 'uid-1') {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(c: number) {
      this.statusCode = c;
      return this;
    },
    json(b: unknown) {
      this.body = b;
      return this;
    },
  };
  await handler(
    {
      method: 'POST',
      body: {code},
      headers: {authorization: `Bearer token-${uid}`},
    },
    res,
  );
  return {status: res.statusCode, body: res.body as {status: string}};
}

const fetchMock = jest.fn();
const grantCalls = () =>
  fetchMock.mock.calls.filter(([url]) =>
    String(url).includes('api.revenuecat.com'),
  );

beforeEach(() => {
  mockDocs.clear();
  mockDocs.set(CODE, {
    redeemed: false,
    redeemedByUid: null,
    redeemedAt: null,
    createdAt: 'CREATED',
    note: null,
  });
  mockTxFailures = 0;
  mockCollection.mockClear();
  mockVerifyIdToken.mockReset().mockImplementation(async (token: string) => ({
    uid: token.replace('token-', ''),
    firebase: {sign_in_provider: 'google.com'},
  }));
  fetchMock.mockReset().mockResolvedValue({ok: true, text: async () => ''});
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('redeem endpoint — the happy path', () => {
  it('a valid code: 200, one grant to that uid, and the code marked to them', async () => {
    expect(await post(CODE)).toEqual({status: 200, body: {status: 'success'}});
    expect(grantCalls()).toHaveLength(1);
    expect(String(grantCalls()[0][0])).toContain('/subscribers/uid-1/');
    expect(mockDocs.get(CODE)).toMatchObject({
      redeemed: true,
      redeemedByUid: 'uid-1',
    });
  });

  it('a code nobody created: 404', async () => {
    expect((await post('ZZZZ-ZZZZ')).body).toEqual({status: 'not_found'});
    expect(grantCalls()).toHaveLength(0);
  });
});

describe('R9-20 — the shape of the code, before Auth and Firestore', () => {
  it('«AB/CD»: 400, without spending verifyIdToken nor a Firestore read', async () => {
    const r = await post('AB/CD');
    expect(r.status).toBe(400);
    expect(r.body.status).toBe('invalid_request');
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it('other garbage (too long, no dash, a path) is 400 too, for free', async () => {
    for (const junk of ['ABCDEFGH', 'ABCD-EFGH-IJKL', '../x/y', 'ABCD-EFG']) {
      expect((await post(junk)).status).toBe(400);
    }
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it('a typo with a letter the generator never uses (O) still reaches the lookup: 404, as before', async () => {
    expect((await post('ABCD-EFGO')).body).toEqual({status: 'not_found'});
    expect(mockVerifyIdToken).toHaveBeenCalledTimes(1);
  });
});

describe('R9-21 — a grant never leaves the code available to a second account', () => {
  it('the bookkeeping write fails: nothing is granted, 500, and the code is still whole', async () => {
    mockTxFailures = 1;
    const r = await post(CODE, 'uid-1');
    expect(r.status).toBe(500);
    expect(r.body.status).toBe('server_error');
    // Before the fix: granted, then the mark failed, then 200 — and the code
    // stayed available.
    expect(grantCalls()).toHaveLength(0);
    expect(mockDocs.get(CODE)?.redeemed).toBe(false);
  });

  it('once granted, a second account gets 409 and no second grant', async () => {
    expect((await post(CODE, 'uid-1')).status).toBe(200);
    const second = await post(CODE, 'uid-2');
    expect(second).toEqual({status: 409, body: {status: 'already_redeemed'}});
    expect(grantCalls()).toHaveLength(1);
  });

  it('RevenueCat refuses: the code stays bound to uid-1; uid-1 retries and gets it; uid-2 gets 409', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'x',
    });
    expect((await post(CODE, 'uid-1')).status).toBe(500);
    // Never released (Victor's decision): still uid-1's.
    expect(mockDocs.get(CODE)).toMatchObject({
      redeemed: true,
      redeemedByUid: 'uid-1',
    });
    expect(await post(CODE, 'uid-1')).toEqual({
      status: 200,
      body: {status: 'success'},
    });
    expect(await post(CODE, 'uid-2')).toEqual({
      status: 409,
      body: {status: 'already_redeemed'},
    });
    expect(mockDocs.get(CODE)?.redeemedByUid).toBe('uid-1');
    expect(
      grantCalls().map(([url]) => String(url).includes('/uid-1/')),
    ).toEqual([true, true]);
  });

  it('uid-1 in flight, its retry gets 200, then the first grant comes back refused: the code stays uid-1 only, uid-2 gets 409 and no grant', async () => {
    let refuseFirst!: () => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          refuseFirst = () =>
            resolve({ok: false, status: 503, text: async () => ''});
        }),
    );
    let firstSettled = false;
    const first = post(CODE, 'uid-1').then(r => {
      firstSettled = true;
      return r;
    });
    for (let i = 0; i < 10 && grantCalls().length === 0; i++) {
      await new Promise(r => setImmediate(r));
    }
    // Race control: the first request has claimed and its grant is in flight.
    expect(grantCalls()).toHaveLength(1);
    expect(mockDocs.get(CODE)?.redeemedByUid).toBe('uid-1');
    const retry = await post(CODE, 'uid-1');
    expect(retry).toEqual({status: 200, body: {status: 'success'}});
    // The retry answered while the first request was still in flight.
    expect(firstSettled).toBe(false);
    refuseFirst();
    expect((await first).status).toBe(500);
    const other = await post(CODE, 'uid-2');
    // Before this fix: the refusal released the code and uid-2 got a second
    // grant (one code, two entitlements).
    expect(
      grantCalls().filter(([url]) => String(url).includes('/uid-2/')),
    ).toEqual([]);
    expect(other).toEqual({status: 409, body: {status: 'already_redeemed'}});
    // One owner at the end: uid-1.
    expect(mockDocs.get(CODE)).toMatchObject({
      redeemed: true,
      redeemedByUid: 'uid-1',
    });
  });

  it('no answer from RevenueCat (the grant may have landed): the code stays bound to that uid; others get 409, and that uid retries to a 200', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect((await post(CODE, 'uid-1')).status).toBe(500);
    expect(mockDocs.get(CODE)?.redeemedByUid).toBe('uid-1');
    expect((await post(CODE, 'uid-2')).status).toBe(409);
    expect(await post(CODE, 'uid-1')).toEqual({
      status: 200,
      body: {status: 'success'},
    });
    // The grant each time went to uid-1 only.
    expect(grantCalls().every(([url]) => String(url).includes('/uid-1/'))).toBe(
      true,
    );
  });

  it('a retry by the account that already redeemed it answers 200 (the app may never have heard the first answer)', async () => {
    expect((await post(CODE, 'uid-1')).status).toBe(200);
    // Before: 409 «already redeemed» to the very person who has it.
    expect(await post(CODE, 'uid-1')).toEqual({
      status: 200,
      body: {status: 'success'},
    });
    expect(mockDocs.get(CODE)?.redeemedByUid).toBe('uid-1');
  });
});
