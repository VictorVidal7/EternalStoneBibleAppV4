/**
 * One compact row inside the consolidated Metas section: icon, label,
 * description, and a chip grid to pick one numeric target. Purely
 * presentational — mirrors NotificationReminderRow's layout/divider
 * conventions, minus the toggle/hour-conditional (a goal has no on/off
 * state, just a value).
 */

import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';

interface GoalOptionRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  value: number;
  options: readonly number[];
  onSelect: (value: number) => void;
  disabled?: boolean;
  isFirst?: boolean;
}

export default function GoalOptionRow({
  icon,
  label,
  description,
  value,
  options,
  onSelect,
  disabled,
  isFirst,
}: GoalOptionRowProps) {
  const {colors} = useTheme();

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
      </View>
      <View style={styles.optionGrid}>
        {options.map(option => {
          const active = option === value;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(option)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{selected: active, disabled}}
              style={[
                styles.optionChip,
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
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginLeft: 32,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  optionChipText: {fontWeight: '700', fontSize: 14},
});
