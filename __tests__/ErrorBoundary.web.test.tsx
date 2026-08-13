/**
 * Web ErrorBoundary — storage-lock recovery (backlog batch 8).
 *
 * app/_layout.web.tsx's own boot-time catch already offered a
 * "Borrar datos y recargar" recovery for an OPFS storage-lock error, but
 * ErrorBoundary (which catches everything else in the route tree, e.g. an
 * error thrown after a successful boot from deeper inside a reader route)
 * had no such awareness — a storage-lock error caught there hit a dead-end
 * generic "Reintentar" that can never actually recover. This proves the web
 * ErrorBoundary variant now branches correctly on the caught error's shape.
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ErrorBoundary} from '../src/components/ErrorBoundary.web';

const mockClearWebStorageForLockRecovery = jest.fn(() => Promise.resolve());
jest.mock('../src/lib/database/data-loader.web', () => ({
  clearWebStorageForLockRecovery: () => mockClearWebStorageForLockRecovery(),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const reloadMock = jest.fn();

function ThrowingChild({error}: {error: Error}): React.ReactElement {
  throw error;
}

describe('web ErrorBoundary — storage-lock branch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom throws "not implemented" on a real navigation; stub reload only.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {...window.location, reload: reloadMock},
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('shows the clear-data-and-reload recovery for a storage-lock error, not the generic retry', async () => {
    const lockError = new Error('Invalid VFS state');

    const {getByText, queryByText} = render(
      <ErrorBoundary>
        <ThrowingChild error={lockError} />
      </ErrorBoundary>,
    );

    expect(getByText('No se pudo completar la descarga')).toBeTruthy();
    expect(queryByText('Reintentar')).toBeNull();

    fireEvent.press(getByText('Borrar datos y recargar'));

    await waitFor(() => {
      expect(mockClearWebStorageForLockRecovery).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  it('reloads even if clearing storage itself throws', async () => {
    mockClearWebStorageForLockRecovery.mockImplementationOnce(() =>
      Promise.reject(new Error('OPFS clear failed')),
    );
    const lockError = new Error('NoModificationAllowedError');

    const {getByText} = render(
      <ErrorBoundary>
        <ThrowingChild error={lockError} />
      </ErrorBoundary>,
    );

    fireEvent.press(getByText('Borrar datos y recargar'));

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  it('falls back to the generic retry UI for a non-storage-lock error', () => {
    const genericError = new Error('something else broke');

    const {getByText, queryByText} = render(
      <ErrorBoundary>
        <ThrowingChild error={genericError} />
      </ErrorBoundary>,
    );

    expect(getByText('Algo salió mal')).toBeTruthy();
    expect(getByText('Reintentar')).toBeTruthy();
    expect(queryByText('Borrar datos y recargar')).toBeNull();
    expect(mockClearWebStorageForLockRecovery).not.toHaveBeenCalled();
  });
});
