import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  AccessibilityInfo,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {useUserPreferences} from '../context/UserPreferencesContext';
import {useTheme} from '../context/ThemeContext';
import NotificationService from '../services/NotificationService';
import {FONT_SIZES, FONT_FAMILIES} from '../constants/appConstants';
import {withTheme} from '../hoc/withTheme';
import {useLanguage} from '../hooks/useLanguage';
import {AnalyticsService} from '../services/AnalyticsService';
import HapticFeedback from '../services/HapticFeedback';
import {logger} from '../lib/utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

type FontSize = 'small' | 'medium' | 'large';
type FontFamily = 'default' | 'serif';
type LineSpacing = '1.0' | '1.5' | '2.0';
type ColorTheme = 'default' | 'sepia' | 'green' | 'purple' | 'ocean' | 'sunset';

type SettingName =
  | 'nightMode'
  | 'fontSize'
  | 'fontFamily'
  | 'lineSpacing'
  | 'textZoom'
  | 'colorTheme';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
  border: string;
  highlight: string;
  accent?: string;
}

interface ScheduledNotificationTime {
  hour: number;
  minute: number;
}

interface UserPreferencesContextType {
  nightMode: boolean;
  fontSize: number | FontSize;
  fontFamily: FontFamily;
  lineSpacing: number | LineSpacing;
  textZoom: number;
  colorTheme: ColorTheme;
  toggleNightMode: () => void;
  changeFontSize: (size: number | FontSize) => void;
  changeFontFamily: (family: FontFamily) => void;
  changeLineSpacing: (spacing: number | LineSpacing) => void;
  changeTextZoom: (zoom: number) => void;
  changeColorTheme: (theme: ColorTheme) => void;
  COLOR_THEMES: Record<string, any>;
}

// ============================================================================
// Component
// ============================================================================

const SettingsScreen: React.FC = () => {
  const {
    nightMode,
    fontSize,
    fontFamily,
    lineSpacing,
    textZoom,
    colorTheme,
    toggleNightMode,
    changeFontSize,
    changeFontFamily,
    changeLineSpacing,
    changeTextZoom,
    changeColorTheme,
    COLOR_THEMES,
  } = useUserPreferences() as UserPreferencesContextType;

  const {colors} = useTheme() as {colors: ThemeColors};
  const {t, language} = useLanguage();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);
  const [notificationTimeInput, setNotificationTimeInput] =
    useState<string>('12:00');
  const [screenReaderEnabled, setScreenReaderEnabled] =
    useState<boolean>(false);

  const styles = useMemo(
    () => createStyles(colors, fontSize, fontFamily),
    [colors, fontSize, fontFamily],
  );

  // Helper function for translations with interpolation
  const translate = useCallback(
    (key: string, params?: Record<string, any>): string => {
      // Simple translation strings for accessibility
      const translations: Record<string, Record<string, string>> = {
        es: {
          nightModeEnabled: 'Modo nocturno activado',
          nightModeDisabled: 'Modo nocturno desactivado',
          fontSizeChanged: `Tamaño de fuente cambiado a ${params?.size || ''}`,
          fontFamilyChanged: `Estilo de fuente cambiado a ${params?.family || ''}`,
          lineSpacingChanged: `Espacio entre líneas cambiado a ${params?.spacing || ''}`,
          textZoomChanged: `Ampliación de texto cambiada a ${params?.zoom || ''}%`,
          colorThemeChanged: `Esquema de colores cambiado a ${params?.theme || ''}`,
          notificationsEnabled: `Notificaciones activadas para las ${params?.time || ''}`,
          notificationsDisabled: 'Notificaciones desactivadas',
          notificationsError: 'Error al cambiar las notificaciones',
          notificationTimeChanged: `Hora de notificación cambiada a ${params?.time || ''}`,
          notificationScheduleError: 'Error al programar la notificación',
          activated: 'Activado. Toca para desactivar',
          deactivated: 'Desactivado. Toca para activar',
          selected: 'Seleccionado',
          tapToSelect: 'Toca para seleccionar',
          colorScheme: `Esquema de color ${params?.theme || ''}`,
          tapToSelectColorScheme: 'Toca para seleccionar este esquema de color',
          settingsScreen: 'Pantalla de configuración',
          scrollSettings:
            'Desplázate para ver todas las opciones de configuración',
          customizeReading: 'Personalizar lectura',
          nightMode: 'Modo noche',
          textSize: 'Tamaño del texto',
          fontStyle: 'Estilo de letra',
          lineSpacing: 'Espacio entre líneas',
          zoomText: 'Ampliar texto',
          colorSchemeLabel: 'Esquema de colores',
          readingReminders: 'Recordatorios de lectura',
          dailyReminder: 'Recordatorio diario',
          reminderTime: 'Hora del recordatorio',
          zoomSlider: 'Control deslizante de ampliación de texto',
          adjustZoom: 'Desliza para ajustar la ampliación del texto',
          notificationTimeField: 'Campo de hora de notificación',
          enterTime:
            'Ingresa la hora para el recordatorio diario en formato HH:MM',
        },
        en: {
          nightModeEnabled: 'Night mode enabled',
          nightModeDisabled: 'Night mode disabled',
          fontSizeChanged: `Font size changed to ${params?.size || ''}`,
          fontFamilyChanged: `Font style changed to ${params?.family || ''}`,
          lineSpacingChanged: `Line spacing changed to ${params?.spacing || ''}`,
          textZoomChanged: `Text zoom changed to ${params?.zoom || ''}%`,
          colorThemeChanged: `Color scheme changed to ${params?.theme || ''}`,
          notificationsEnabled: `Notifications enabled for ${params?.time || ''}`,
          notificationsDisabled: 'Notifications disabled',
          notificationsError: 'Error changing notifications',
          notificationTimeChanged: `Notification time changed to ${params?.time || ''}`,
          notificationScheduleError: 'Error scheduling notification',
          activated: 'Activated. Tap to deactivate',
          deactivated: 'Deactivated. Tap to activate',
          selected: 'Selected',
          tapToSelect: 'Tap to select',
          colorScheme: `Color scheme ${params?.theme || ''}`,
          tapToSelectColorScheme: 'Tap to select this color scheme',
          settingsScreen: 'Settings screen',
          scrollSettings: 'Scroll to see all settings options',
          customizeReading: 'Customize reading',
          nightMode: 'Night mode',
          textSize: 'Text size',
          fontStyle: 'Font style',
          lineSpacing: 'Line spacing',
          zoomText: 'Zoom text',
          colorSchemeLabel: 'Color scheme',
          readingReminders: 'Reading reminders',
          dailyReminder: 'Daily reminder',
          reminderTime: 'Reminder time',
          zoomSlider: 'Text zoom slider control',
          adjustZoom: 'Slide to adjust text zoom',
          notificationTimeField: 'Notification time field',
          enterTime: 'Enter the time for daily reminder in HH:MM format',
        },
      };

      return translations[language]?.[key] || key;
    },
    [language],
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(enabled => {
        setScreenReaderEnabled(enabled);
        logger.breadcrumb('Screen reader status checked', 'accessibility', {
          enabled,
          screen: 'SettingsScreen',
        });
      })
      .catch(error => {
        logger.error('Error checking screen reader status', error as Error, {
          screen: 'SettingsScreen',
          action: 'checkScreenReader',
        });
      });

    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled: boolean) => {
        setScreenReaderEnabled(enabled);
        logger.breadcrumb('Screen reader status changed', 'accessibility', {
          enabled,
          screen: 'SettingsScreen',
        });
      },
    );

    return () => {
      listener.remove();
    };
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    try {
      const scheduledTime =
        await NotificationService.getScheduledNotificationTime();
      if (scheduledTime) {
        const typedTime = scheduledTime as ScheduledNotificationTime;
        setNotificationsEnabled(true);
        setNotificationTimeInput(
          `${typedTime.hour.toString().padStart(2, '0')}:${typedTime.minute
            .toString()
            .padStart(2, '0')}`,
        );
        logger.breadcrumb('Notification settings loaded', 'settings', {
          time: `${typedTime.hour}:${typedTime.minute}`,
          screen: 'SettingsScreen',
        });
      }
    } catch (error) {
      logger.error('Error loading notification settings', error as Error, {
        screen: 'SettingsScreen',
        action: 'loadNotificationSettings',
      });
    }
  }, []);

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSettingChange = useCallback(
    (settingName: SettingName, newValue: any) => {
      HapticFeedback.light();

      logger.breadcrumb(`Setting changed: ${settingName}`, 'settings', {
        settingName,
        newValue,
        screen: 'SettingsScreen',
      });

      switch (settingName) {
        case 'nightMode':
          toggleNightMode();
          AccessibilityInfo.announceForAccessibility(
            newValue
              ? translate('nightModeEnabled')
              : translate('nightModeDisabled'),
          );
          break;
        case 'fontSize':
          changeFontSize(newValue);
          AccessibilityInfo.announceForAccessibility(
            translate('fontSizeChanged', {size: newValue}),
          );
          break;
        case 'fontFamily':
          changeFontFamily(newValue);
          AccessibilityInfo.announceForAccessibility(
            translate('fontFamilyChanged', {family: newValue}),
          );
          break;
        case 'lineSpacing':
          changeLineSpacing(newValue);
          AccessibilityInfo.announceForAccessibility(
            translate('lineSpacingChanged', {spacing: newValue}),
          );
          break;
        case 'textZoom':
          changeTextZoom(newValue);
          AccessibilityInfo.announceForAccessibility(
            translate('textZoomChanged', {zoom: newValue}),
          );
          break;
        case 'colorTheme':
          changeColorTheme(newValue);
          AccessibilityInfo.announceForAccessibility(
            translate('colorThemeChanged', {theme: newValue}),
          );
          break;
      }

      AnalyticsService.logEvent('settings_changed', {
        setting: settingName,
        value: newValue,
      });
    },
    [
      toggleNightMode,
      changeFontSize,
      changeFontFamily,
      changeLineSpacing,
      changeTextZoom,
      changeColorTheme,
      t,
    ],
  );

  const toggleNotifications = useCallback(
    async (value: boolean) => {
      try {
        setNotificationsEnabled(value);
        if (value) {
          const [hours, minutes] = notificationTimeInput.split(':').map(Number);
          await NotificationService.scheduleNotification(hours, minutes);
          AnalyticsService.logEvent('notifications_enabled', {
            time: notificationTimeInput,
          });
          AccessibilityInfo.announceForAccessibility(
            translate('notificationsEnabled', {time: notificationTimeInput}),
          );

          logger.breadcrumb('Notifications enabled', 'settings', {
            time: notificationTimeInput,
            screen: 'SettingsScreen',
          });
        } else {
          await NotificationService.cancelAllNotifications();
          AnalyticsService.logEvent('notifications_disabled');
          AccessibilityInfo.announceForAccessibility(
            translate('notificationsDisabled'),
          );

          logger.breadcrumb('Notifications disabled', 'settings', {
            screen: 'SettingsScreen',
          });
        }
        HapticFeedback.light();
      } catch (error) {
        logger.error('Error toggling notifications', error as Error, {
          screen: 'SettingsScreen',
          action: 'toggleNotifications',
          value,
        });
        AccessibilityInfo.announceForAccessibility(
          translate('notificationsError'),
        );
      }
    },
    [notificationTimeInput, translate],
  );

  const handleTimeChange = useCallback(
    async (text: string) => {
      setNotificationTimeInput(text);
      if (notificationsEnabled) {
        const [hours, minutes] = text.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          try {
            await NotificationService.scheduleNotification(hours, minutes);
            AnalyticsService.logEvent('notification_time_changed', {
              newTime: text,
            });
            AccessibilityInfo.announceForAccessibility(
              translate('notificationTimeChanged', {time: text}),
            );
            HapticFeedback.light();

            logger.breadcrumb('Notification time changed', 'settings', {
              newTime: text,
              screen: 'SettingsScreen',
            });
          } catch (error) {
            logger.error('Error scheduling notification', error as Error, {
              screen: 'SettingsScreen',
              action: 'handleTimeChange',
              time: text,
            });
            AccessibilityInfo.announceForAccessibility(
              translate('notificationScheduleError'),
            );
          }
        }
      }
    },
    [notificationsEnabled, translate],
  );

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderSectionTitle = useCallback(
    (title: string) => (
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
    ),
    [styles.sectionTitle],
  );

  const renderToggleOption = useCallback(
    (title: string, value: boolean, onToggle: (value: boolean) => void) => (
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{title}</Text>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{false: colors.secondary, true: colors.primary}}
          thumbColor={value ? colors.accent || colors.text : colors.text}
          accessibilityLabel={title}
          accessibilityHint={
            value ? translate('activated') : translate('deactivated')
          }
        />
      </View>
    ),
    [styles.settingRow, styles.settingLabel, colors, translate],
  );

  const renderButtonGroup = useCallback(
    (
      title: string,
      options: string[],
      currentValue: string | number,
      onChange: (value: any) => void,
    ) => (
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{title}</Text>
        <View style={styles.buttonGroup}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.button,
                currentValue === option && styles.selectedButton,
              ]}
              onPress={() => onChange(option)}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{selected: currentValue === option}}
              accessibilityHint={
                currentValue === option
                  ? translate('selected')
                  : translate('tapToSelect')
              }>
              <Text
                style={[
                  styles.buttonText,
                  currentValue === option && styles.selectedButtonText,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [
      styles.settingRow,
      styles.settingLabel,
      styles.buttonGroup,
      styles.button,
      styles.selectedButton,
      styles.buttonText,
      styles.selectedButtonText,
      translate,
    ],
  );

  const renderColorThemeOptions = useCallback(
    () => (
      <View style={styles.colorThemeContainer}>
        {Object.keys(COLOR_THEMES).map(theme => (
          <TouchableOpacity
            key={theme}
            style={[
              styles.colorThemeButton,
              {backgroundColor: COLOR_THEMES[theme].light.primary},
              colorTheme === theme && styles.selectedColorTheme,
            ]}
            onPress={() => handleSettingChange('colorTheme', theme)}
            accessibilityRole="button"
            accessibilityLabel={translate('colorScheme', {theme})}
            accessibilityState={{selected: colorTheme === theme}}
            accessibilityHint={
              colorTheme === theme
                ? translate('selected')
                : translate('tapToSelectColorScheme')
            }
          />
        ))}
      </View>
    ),
    [
      styles.colorThemeContainer,
      styles.colorThemeButton,
      styles.selectedColorTheme,
      COLOR_THEMES,
      colorTheme,
      handleSettingChange,
      translate,
    ],
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityLabel={translate('settingsScreen')}
      accessibilityHint={translate('scrollSettings')}>
      {renderSectionTitle(translate('customizeReading'))}
      {renderToggleOption(translate('nightMode'), nightMode, () =>
        handleSettingChange('nightMode', !nightMode),
      )}
      {renderButtonGroup(
        translate('textSize'),
        Object.values(FONT_SIZES),
        fontSize,
        (size: FontSize) => handleSettingChange('fontSize', size),
      )}
      {renderButtonGroup(
        translate('fontStyle'),
        Object.values(FONT_FAMILIES),
        fontFamily,
        (family: FontFamily) => handleSettingChange('fontFamily', family),
      )}
      {renderButtonGroup(
        translate('lineSpacing'),
        ['1.0', '1.5', '2.0'],
        lineSpacing.toString(),
        (spacing: LineSpacing) => handleSettingChange('lineSpacing', spacing),
      )}

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{translate('zoomText')}</Text>
        <Slider
          style={{width: 200, height: 40}}
          minimumValue={50}
          maximumValue={200}
          step={10}
          value={textZoom}
          onValueChange={value => handleSettingChange('textZoom', value)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.secondary}
          accessibilityLabel={translate('zoomSlider')}
          accessibilityHint={translate('adjustZoom')}
        />
        <Text style={styles.settingLabel}>{textZoom}%</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{translate('colorSchemeLabel')}</Text>
        {renderColorThemeOptions()}
      </View>

      {renderSectionTitle(translate('readingReminders'))}
      {renderToggleOption(
        translate('dailyReminder'),
        notificationsEnabled,
        toggleNotifications,
      )}
      {notificationsEnabled && (
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{translate('reminderTime')}:</Text>
          <TextInput
            style={styles.timeInput}
            value={notificationTimeInput}
            onChangeText={handleTimeChange}
            placeholder="HH:MM"
            keyboardType="numeric"
            placeholderTextColor={colors.secondary}
            accessibilityLabel={translate('notificationTimeField')}
            accessibilityHint={translate('enterTime')}
          />
        </View>
      )}
    </ScrollView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const createStyles = (
  colors: ThemeColors,
  fontSize: number | FontSize,
  fontFamily: FontFamily,
) => {
  const dynamicFontSize =
    fontSize === 'small' ? 14 : fontSize === 'large' ? 18 : 16;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: dynamicFontSize + 6,
      fontWeight: '700',
      color: colors.text,
      marginTop: 24,
      marginBottom: 12,
      fontFamily,
      letterSpacing: -0.3,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: dynamicFontSize,
      color: colors.text,
      fontFamily,
      flex: 1,
      marginRight: 10,
    },
    buttonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    button: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 8,
      marginBottom: 8,
      borderRadius: 8,
      backgroundColor: colors.secondary,
    },
    selectedButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: colors.text,
      fontSize: dynamicFontSize - 2,
      fontFamily,
    },
    selectedButtonText: {
      color: colors.background,
    },
    timeInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: dynamicFontSize,
      fontFamily,
      minWidth: 100,
      color: colors.text,
    },
    colorThemeContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
    },
    colorThemeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      margin: 5,
    },
    selectedColorTheme: {
      borderWidth: 2,
      borderColor: colors.text,
    },
  });
};

export default withTheme(React.memo(SettingsScreen));
