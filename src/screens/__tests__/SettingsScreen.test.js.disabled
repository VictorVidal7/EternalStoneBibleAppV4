import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { UserPreferencesProvider, useUserPreferences } from '../../context/UserPreferencesContext';
import { ErrorProvider } from '../../context/ErrorContext';
import { FONT_SIZES, FONT_FAMILIES } from '../../constants/appConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../../services/NotificationService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../../services/NotificationService', () => ({
  getScheduledNotificationTime: jest.fn(),
  scheduleNotification: jest.fn(),
  cancelAllNotifications: jest.fn(),
}));

jest.mock('../../context/UserPreferencesContext', () => ({
  ...jest.requireActual('../../context/UserPreferencesContext'),
  useUserPreferences: jest.fn(),
}));

const mockUseUserPreferences = {
  nightMode: false,
  fontSize: FONT_SIZES.MEDIUM,
  fontFamily: FONT_FAMILIES.DEFAULT,
  toggleNightMode: jest.fn(),
  changeFontSize: jest.fn(),
  changeFontFamily: jest.fn(),
};

useUserPreferences.mockImplementation(() => mockUseUserPreferences);

const AllTheProviders = ({ children }) => (
  <ErrorProvider>
    <UserPreferencesProvider>
      {children}
    </UserPreferencesProvider>
  </ErrorProvider>
);

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NotificationService.getScheduledNotificationTime.mockResolvedValue(null);
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<SettingsScreen />, { wrapper: AllTheProviders });
    expect(getByText('Apariencia')).toBeTruthy();
    expect(getByText('Modo Nocturno')).toBeTruthy();
    expect(getByText('Tamaño de Fuente')).toBeTruthy();
    expect(getByText('Tipo de Fuente')).toBeTruthy();
    expect(getByText('Notificaciones')).toBeTruthy();
    expect(getByTestId('night-mode-switch')).toBeTruthy();
  });

  it('toggles night mode', () => {
    const { getByTestId } = render(<SettingsScreen />, { wrapper: AllTheProviders });
    const nightModeSwitch = getByTestId('night-mode-switch');
    fireEvent(nightModeSwitch, 'valueChange', true);
    expect(mockUseUserPreferences.toggleNightMode).toHaveBeenCalled();
  });

  it('changes font size', () => {
    const { getByTestId } = render(<SettingsScreen />, { wrapper: AllTheProviders });
    const smallFontButton = getByTestId(`font-size-${FONT_SIZES.SMALL}`);
    fireEvent.press(smallFontButton);
    expect(mockUseUserPreferences.changeFontSize).toHaveBeenCalledWith(FONT_SIZES.SMALL);
  });

  it('changes font family', () => {
    const { getByTestId } = render(<SettingsScreen />, { wrapper: AllTheProviders });
    const serifButton = getByTestId(`font-family-${FONT_FAMILIES.SERIF}`);
    fireEvent.press(serifButton);
    expect(mockUseUserPreferences.changeFontFamily).toHaveBeenCalledWith(FONT_FAMILIES.SERIF);
  });

  it('toggles notifications', async () => {
    const { getByTestId } = render(<SettingsScreen />, { wrapper: AllTheProviders });
    const notificationsSwitch = getByTestId('notifications-switch');
    fireEvent(notificationsSwitch, 'valueChange', true);
    expect(NotificationService.scheduleNotification).toHaveBeenCalled();
  });

  it('changes notification time', async () => {
    const { getByTestId, queryByTestId } = render(<SettingsScreen />, { wrapper: AllTheProviders });
  
    // Activar las notificaciones
    const notificationsSwitch = getByTestId('notifications-switch');
    fireEvent(notificationsSwitch, 'valueChange', true);
  
    // Esperar a que aparezca el campo de entrada de tiempo
    await waitFor(() => {
      expect(queryByTestId('notification-time-input')).not.toBeNull();
    });

    const timeInput = getByTestId('notification-time-input');
    fireEvent.changeText(timeInput, '14:30');
  
    expect(NotificationService.scheduleNotification).toHaveBeenCalledWith(14, 30);
  });
});