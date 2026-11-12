/**
 * Manual jest mock for react-native-purchases (RevenueCat), picked up
 * automatically by Jest for any require('react-native-purchases') since it
 * lives in a root __mocks__/ dir adjacent to node_modules — no explicit
 * jest.mock() call needed. Test helpers (the __-prefixed methods) let a
 * test script the fake "backend" directly instead of only through the
 * SDK's normal async API.
 */

// The real CustomerInfo always carries the purchase lists; a test that needs
// "an offering on the account without its entitlement" (R9-574) says so with
// __setCustomerInfo / mockResolvedValueOnce and a nonSubscriptionTransactions
// entry: {transactionIdentifier, productIdentifier, purchaseDate}.
const emptyCustomerInfo = () => ({
  entitlements: {active: {}, all: {}},
  allPurchasedProductIdentifiers: [],
  nonSubscriptionTransactions: [],
});
let customerInfo = emptyCustomerInfo();
// The SDK's own user. This mock does NOT model customers: logIn() answers
// with the one global customerInfo, whoever the uid is. It only tracks WHICH
// id the SDK is on, so isAnonymous() can tell an account change (R9-135)
// from the first link of an anonymous id. What the real backend does with
// the purchases of an anonymous id on logIn is not modelled here.
const ANONYMOUS_ID = '$RCAnonymousID:mock';
let appUserID = ANONYMOUS_ID;
let customerInfoListeners = [];
let offeringsResponse = {all: {}};
let productsResponse = [];

function notifyListeners() {
  customerInfoListeners.forEach(cb => cb(customerInfo));
}

const Purchases = {
  configure: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(cb => {
    customerInfoListeners.push(cb);
  }),
  removeCustomerInfoUpdateListener: jest.fn(cb => {
    customerInfoListeners = customerInfoListeners.filter(l => l !== cb);
  }),
  getCustomerInfo: jest.fn(() => Promise.resolve(customerInfo)),
  getOfferings: jest.fn(() => Promise.resolve(offeringsResponse)),
  getProducts: jest.fn(() => Promise.resolve(productsResponse)),
  purchasePackage: jest.fn(() => Promise.resolve({customerInfo})),
  purchaseStoreProduct: jest.fn(() => Promise.resolve({customerInfo})),
  restorePurchases: jest.fn(() => Promise.resolve(customerInfo)),
  logIn: jest.fn(uid => {
    appUserID = uid;
    return Promise.resolve({customerInfo});
  }),
  getAppUserID: jest.fn(() => Promise.resolve(appUserID)),
  isAnonymous: jest.fn(() =>
    Promise.resolve(appUserID.startsWith('$RCAnonymousID:')),
  ),
  invalidateCustomerInfoCache: jest.fn(() => Promise.resolve()),
  canMakePayments: jest.fn(() => Promise.resolve(true)),
  setLogHandler: jest.fn(),
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1',
    PRODUCT_ALREADY_PURCHASED_ERROR: '6',
    PAYMENT_PENDING_ERROR: '20',
  },

  // --- Test helpers, not part of the real SDK ---
  __setCustomerInfo(info) {
    customerInfo = info;
    notifyListeners();
  },
  /** The id the SDK is on; survives a "process restart" of the service. */
  __setAppUserID(id) {
    appUserID = id;
  },
  __setOfferings(offerings) {
    offeringsResponse = offerings;
  },
  __setProducts(products) {
    productsResponse = products;
  },
  __getListenerCount() {
    return customerInfoListeners.length;
  },
  __reset() {
    customerInfo = emptyCustomerInfo();
    appUserID = ANONYMOUS_ID;
    customerInfoListeners = [];
    offeringsResponse = {all: {}};
    productsResponse = [];
    for (const value of Object.values(Purchases)) {
      if (typeof value?.mockClear === 'function') value.mockClear();
    }
  },
};

module.exports = Purchases;
module.exports.default = Purchases;
