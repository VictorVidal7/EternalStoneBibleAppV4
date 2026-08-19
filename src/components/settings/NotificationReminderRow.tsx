/**
 * One compact row inside the consolidated Notifications section: icon,
 * label, description, switch, and — when enabled — an inline hour picker.
 * Purely presentational; the 6 call sites in NotificationsSettings own all
 * state and NotificationService wiring.
 */

import React from 'react';
import {View, Text, StyleSheet, Switch, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {staticColors} from '@/styles/designTokens';

interface NotificationReminderRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  enabled: boolean;
  hour: number;
  hourOptions: number[];
  busy: boolean;
  onToggle: (value: boolean) => void;
  onHourSelect: (hour: number) => void;
  isFirst?: boolean;
}

export default function NotificationReminderRow({
  icon,
  label,
  description,
  enabled,
  hour,
  hourOptions,
  busy,
  onToggle,
  onHourSelect,
  isFirst,
}: NotificationReminderRowProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();

  return (
    <View
      style={[
        styles.rowContainer,
        !isFirst && [styles.rowDivider, {borderTopColor: colors.border}],
      ]}>
      <View style={styles.row}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
          style={styles.rowIcon}
        />
        <View style={styles.rowInfo}>
          <Text style={[styles.label, {color: colors.text}]}>{label}</Text>
          <Text style={[styles.description, {color: colors.textSecondary}]}>
            {description}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={busy}
          trackColor={{false: colors.border, true: colors.primary}}
          thumbColor={staticColors.white}
          accessibilityLabel={label}
        />
      </View>

      {enabled && (
        <View style={styles.hourSection}>
          <Text style={[styles.hourLabel, {color: colors.textSecondary}]}>
            {t.notifications.time}
          </Text>
          <View style={styles.hourGrid}>
            {hourOptions.map(h => {
              const active = h === hour;
              return (
                <TouchableOpacity
                  key={h}
                  onPress={() => onHourSelect(h)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityState={{selected: active, disabled: busy}}
                  accessibilityLabel={`${String(h).padStart(2, '0')}:00`}
                  style={[
                    styles.hourChip,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceVariant,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.optionChipText,
                      {color: active ? colors.onPrimary : colors.text},
                    ]}>
                    {String(h).padStart(2, '0')}:00
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  hourSection: {
    marginTop: 14,
    marginLeft: 32,
  },
  hourLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  optionChipText: {fontWeight: '700', fontSize: 14},
});
