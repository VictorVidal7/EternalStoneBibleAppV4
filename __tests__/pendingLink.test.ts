/**
 * R9-584 — pendingLink.ts (el uid que espera su logIn de RevenueCat, en
 * expo-secure-store) con el almacenamiento fallando. Su docstring promete lo
 * mismo que la caché del entitlement: un fallo se registra y nunca se lanza.
 * Lo usan initialize(), logInAs, notePendingLink y forgetSessionAccount de
 * offeringService; las dos últimas pruebas lo miden donde se consume.
 */

import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {
  ENTITLEMENT_ID,
  initialize,
  linkUser,
  forgetSessionAccount,
  getLastKnownEntitlement,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  PENDING_LINK_KEY,
  getPendingLinkUid,
  setPendingLinkUid,
} from '../src/lib/offering/pendingLink';

const store = SecureStore as unknown as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};
const sdk = Purchases as unknown as {
  logIn: jest.Mock;
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};
const active = {
  entitlements: {
    active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
    all: {},
  },
};
const none = {entitlements: {active: {}, all: {}}};
const broken = new Error('keystore unavailable');

describe('R9-584 — pendingLink con el almacenamiento fallando', () => {
  beforeEach(async () => {
    __resetForTests();
    sdk.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
    await SecureStore.deleteItemAsync(PENDING_LINK_KEY);
    store.getItemAsync.mockClear();
    store.setItemAsync.mockClear();
    store.deleteItemAsync.mockClear();
  });

  it('una lectura que falla da null y no lanza', async () => {
    await SecureStore.setItemAsync(PENDING_LINK_KEY, 'beto');
    store.getItemAsync.mockRejectedValueOnce(broken);

    await expect(getPendingLinkUid()).resolves.toBeNull();
    expect(store.getItemAsync).toHaveBeenCalledTimes(1);
    // El fallo no borra nada: la lectura siguiente lo encuentra.
    await expect(getPendingLinkUid()).resolves.toBe('beto');
  });

  it('una escritura que falla no lanza, y no deja nada anotado', async () => {
    store.setItemAsync.mockRejectedValueOnce(broken);

    await expect(setPendingLinkUid('beto')).resolves.toBeUndefined();
    expect(store.setItemAsync).toHaveBeenCalledTimes(1);
    await expect(getPendingLinkUid()).resolves.toBeNull();
  });

  it('un borrado que falla no lanza, y el uid sigue en disco', async () => {
    await SecureStore.setItemAsync(PENDING_LINK_KEY, 'beto');
    store.deleteItemAsync.mockRejectedValueOnce(broken);

    await expect(setPendingLinkUid(null)).resolves.toBeUndefined();
    expect(store.deleteItemAsync).toHaveBeenCalledTimes(1);
    await expect(getPendingLinkUid()).resolves.toBe('beto');
  });

  it('el borrado que falla tras un logIn bueno no se come su respuesta', async () => {
    // Ana tiene la ofrenda; entra Beto, su logIn sale bien y su respuesta
    // dice que no la tiene. logInAs borra el pendiente ANTES de procesar la
    // respuesta: si ese borrado lanzara, Beto seguiria viendo los extras de
    // Ana durante este proceso.
    sdk.__setCustomerInfo(active);
    __setApiKeyForTests('test-key');
    await initialize();
    expect(getLastKnownEntitlement()).toBe(true);

    sdk.logIn.mockResolvedValueOnce({customerInfo: none});
    store.deleteItemAsync.mockRejectedValueOnce(broken);
    await linkUser('beto');

    expect(store.deleteItemAsync).toHaveBeenCalledWith(PENDING_LINK_KEY);
    expect(getLastKnownEntitlement()).toBe(false);
  });

  it('forgetSessionAccount no lanza con el borrado fallando', async () => {
    // La llaman el cierre de sesion y la eliminacion de la cuenta, con await:
    // su docstring dice «Never throws».
    await SecureStore.setItemAsync(PENDING_LINK_KEY, 'beto');
    store.deleteItemAsync.mockRejectedValueOnce(broken);

    await expect(forgetSessionAccount()).resolves.toBeUndefined();
    expect(store.deleteItemAsync).toHaveBeenCalledTimes(1);
  });
});
