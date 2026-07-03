/**
 * Manual jest mock for react-native-purchases (RevenueCat), picked up
 * automatically by Jest for any require('react-native-purchases') since it
 * lives in a root __mocks__/ dir adjacent to node_modules — no explicit
 * jest.mock() call needed. Test helpers (the __-prefixed methods) let a
 * test script the fake "backend" directly instead of only through the
 * SDK's normal async API.
 */

let customerInfo = {entitlements: {active: {}, all: {}}};
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
  logIn: jest.fn(() => Promise.resolve({customerInfo})),
  canMakePayments: jest.fn(() => Promise.resolve(true)),
  setLogHandler: jest.fn(),
  PURCHASES_ERROR_CODE: {PURCHASE_CANCELLED_ERROR: '1'},

  // --- Test helpers, not part of the real SDK ---
  __setCustomerInfo(info) {
    customerInfo = info;
    notifyListeners();
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
    customerInfo = {entitlements: {active: {}, all: {}}};
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
