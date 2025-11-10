import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, TextInput, AccessibilityInfo } from 'react-native';
import Slider from '@react-native-community/slider';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useTheme } from '../context/ThemeContext';
import NotificationService from '../services/NotificationService';
import { FONT_SIZES, FONT_FAMILIES } from '../constants/appConstants';
import { withTheme } from '../hoc/withTheme';
import { useTranslation } from 'react-i18next';
import { AnalyticsService } from '../services/AnalyticsService';
import HapticFeedback from '../services/HapticFeedback';

const SettingsScreen = () => {
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
    COLOR_THEMES
  } = useUserPreferences();
  
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTimeInput, setNotificationTimeInput] = useState('12:00');
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  const styles = React.useMemo(() => createStyles(colors, fontSize, fontFamily), [colors, fontSize, fontFamily]);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );

    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );

    return () => {
      listener.remove();
    };
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    const scheduledTime = await NotificationService.getScheduledNotificationTime();
    if (scheduledTime) {
      setNotificationsEnabled(true);
      setNotificationTimeInput(`${scheduledTime.hour.toString().padStart(2, '0')}:${scheduledTime.minute.toString().padStart(2, '0')}`);
    }
  }, []);

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const handleSettingChange = (settingName, newValue) => {
    HapticFeedback.light();
    switch (settingName) {
      case 'nightMode':
        toggleNightMode();
        AccessibilityInfo.announceForAccessibility(newValue ? t('Modo nocturno activado') : t('Modo nocturno desactivado'));
        break;
      case 'fontSize':
        changeFontSize(newValue);
        AccessibilityInfo.announceForAccessibility(t('Tamaño de fuente cambiado a {{size}}', { size: newValue }));
        break;
      case 'fontFamily':
        changeFontFamily(newValue);
        AccessibilityInfo.announceForAccessibility(t('Estilo de fuente cambiado a {{family}}', { family: newValue }));
        break;
      case 'lineSpacing':
        changeLineSpacing(newValue);
        AccessibilityInfo.announceForAccessibility(t('Espacio entre líneas cambiado a {{spacing}}', { spacing: newValue }));
        break;
      case 'textZoom':
        changeTextZoom(newValue);
        AccessibilityInfo.announceForAccessibility(t('Ampliación de texto cambiada a {{zoom}}%', { zoom: newValue }));
        break;
      case 'colorTheme':
        changeColorTheme(newValue);
        AccessibilityInfo.announceForAccessibility(t('Esquema de colores cambiado a {{theme}}', { theme: newValue }));
        break;
    }
    AnalyticsService.logEvent('settings_changed', { setting: settingName, value: newValue });
  };

  const toggleNotifications = useCallback(async (value) => {
    try {
      setNotificationsEnabled(value);
      if (value) {
        const [hours, minutes] = notificationTimeInput.split(':').map(Number);
        await NotificationService.scheduleNotification(hours, minutes);
        AnalyticsService.logEvent('notifications_enabled', { time: notificationTimeInput });
        AccessibilityInfo.announceForAccessibility(t('Notificaciones activadas para las {{time}}', { time: notificationTimeInput }));
      } else {
        await NotificationService.cancelAllNotifications();
        AnalyticsService.logEvent('notifications_disabled');
        AccessibilityInfo.announceForAccessibility(t('Notificaciones desactivadas'));
      }
      HapticFeedback.light();
    } catch (error) {
      console.error('Error toggling notifications:', error);
      AccessibilityInfo.announceForAccessibility(t('Error al cambiar las notificaciones'));
    }
  }, [notificationTimeInput, t]);

  const handleTimeChange = useCallback(async (text) => {
    setNotificationTimeInput(text);
    if (notificationsEnabled) {
      const [hours, minutes] = text.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        try {
          await NotificationService.scheduleNotification(hours, minutes);
          AnalyticsService.logEvent('notification_time_changed', { newTime: text });
          AccessibilityInfo.announceForAccessibility(t('Hora de notificación cambiada a {{time}}', { time: text }));
          HapticFeedback.light();
        } catch (error) {
          console.error('Error scheduling notification:', error);
          AccessibilityInfo.announceForAccessibility(t('Error al programar la notificación'));
        }
      }
    }
  }, [notificationsEnabled, t]);

  const renderSectionTitle = (title) => (
    <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
  );

  const renderToggleOption = (title, value, onToggle) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.secondary, true: colors.primary }}
        thumbColor={value ? colors.accent : colors.text}
        accessibilityLabel={title}
        accessibilityHint={value ? t('Activado. Toca para desactivar') : t('Desactivado. Toca para activar')}
      />
    </View>
  );

  const renderButtonGroup = (title, options, currentValue, onChange) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{title}</Text>
      <View style={styles.buttonGroup}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.button,
              currentValue === option && styles.selectedButton
            ]}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityLabel={option}
            accessibilityState={{ selected: currentValue === option }}
            accessibilityHint={currentValue === option ? t('Seleccionado') : t('Toca para seleccionar')}
          >
            <Text style={[
              styles.buttonText,
              currentValue === option && styles.selectedButtonText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderColorThemeOptions = () => (
    <View style={styles.colorThemeContainer}>
      {Object.keys(COLOR_THEMES).map((theme) => (
        <TouchableOpacity
          key={theme}
          style={[
            styles.colorThemeButton,
            { backgroundColor: COLOR_THEMES[theme].light.primary },
            colorTheme === theme && styles.selectedColorTheme,
          ]}
          onPress={() => handleSettingChange('colorTheme', theme)}
          accessibilityRole="button"
          accessibilityLabel={t("Esquema de color {{theme}}", { theme })}
          accessibilityState={{ selected: colorTheme === theme }}
          accessibilityHint={colorTheme === theme ? t('Seleccionado') : t('Toca para seleccionar este esquema de color')}
        />
      ))}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityLabel={t('Pantalla de configuración')}
      accessibilityHint={t('Desplázate para ver todas las opciones de configuración')}
    >
      {renderSectionTitle(t("Personalizar lectura"))}
      {renderToggleOption(t("Modo noche"), nightMode, () => handleSettingChange('nightMode', !nightMode))}
      {renderButtonGroup(t("Tamaño del texto"), Object.values(FONT_SIZES), fontSize, (size) => handleSettingChange('fontSize', size))}
      {renderButtonGroup(t("Estilo de letra"), Object.values(FONT_FAMILIES), fontFamily, (family) => handleSettingChange('fontFamily', family))}
      {renderButtonGroup(t("Espacio entre líneas"), ['1.0', '1.5', '2.0'], lineSpacing, (spacing) => handleSettingChange('lineSpacing', spacing))}
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{t("Ampliar texto")}</Text>
        <Slider
          style={{width: 200, height: 40}}
          minimumValue={50}
          maximumValue={200}
          step={10}
          value={textZoom}
          onValueChange={(value) => handleSettingChange('textZoom', value)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.secondary}
          accessibilityLabel={t("Control deslizante de ampliación de texto")}
          accessibilityHint={t("Desliza para ajustar la ampliación del texto")}
        />
        <Text style={styles.settingLabel}>{textZoom}%</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{t("Esquema de colores")}</Text>
        {renderColorThemeOptions()}
      </View>

      {renderSectionTitle(t("Recordatorios de lectura"))}
      {renderToggleOption(t("Recordatorio diario"), notificationsEnabled, toggleNotifications)}
      {notificationsEnabled && (
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t("Hora del recordatorio")}:</Text>
          <TextInput
            style={styles.timeInput}
            value={notificationTimeInput}
            onChangeText={handleTimeChange}
            placeholder="HH:MM"
            keyboardType="numeric"
            placeholderTextColor={colors.secondary}
            accessibilityLabel={t("Campo de hora de notificación")}
            accessibilityHint={t("Ingresa la hora para el recordatorio diario en formato HH:MM")}
          />
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors, fontSize, fontFamily) => {
  const dynamicFontSize = fontSize === 'small' ? 14 : fontSize === 'large' ? 18 : 16;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: dynamicFontSize + 4,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
      fontFamily,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
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
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 8,
      marginBottom: 8,
      borderRadius: 4,
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
      borderColor: colors.secondary,
      borderRadius: 4,
      padding: 8,
      fontSize: dynamicFontSize,
      fontFamily,
      minWidth: 80,
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