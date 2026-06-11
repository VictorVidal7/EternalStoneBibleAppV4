/**
 * 🌐 AlsoInVersionsPanel — "Ver también en…" inside the READER's selection
 * bar (Sprint 78).
 *
 * Swaps into the selection bar the way the highlight picker does and shows
 * the FIRST selected verse in another translation: per-version chips
 * (cross-language first via [[alsoInVersions]], S77), an inline blockquote
 * peek with a lazy per-version cache, the honest "isn't available" fallback,
 * and the "Compare versions →" exit into the comparison screen.
 *
 * The verse text arrives through `loadVerseText` (the owner closes over
 * bibleDB.getVerse with the NUMERIC bookId — passing the book-name string
 * nulls silently, S77 gotcha), so this component stays free of the DB and
 * unit-testable like the S77 card.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {alsoChipLabel} from '@/lib/home/alsoInVersions';
import {useLanguage} from '@hooks/useLanguage';
import {spacing, borderRadius, fontSize} from '@/styles/designTokens';

/** A translation offered by the chips (mirrors the S77 card's option). */
export interface AlsoVersionOption {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
}

/** Reader-theme colors the panel inherits from the selection bar. */
export interface AlsoPanelColors {
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
}

interface AlsoInVersionsPanelProps {
  /** Localized "Book 3:16" caption naming the verse being peeked. */
  verseReference: string;
  /** Re-keys the per-version cache when the selection moves. */
  verseKey: string;
  /** Other translations, cross-language first (orderAlsoVersions). */
  alternates: AlsoVersionOption[];
  /** Resolves the verse text in `versionId`, null when unavailable. */
  loadVerseText: (versionId: string) => Promise<string | null>;
  colors: AlsoPanelColors;
  onCompare: () => void;
  onClose: () => void;
}

export const AlsoInVersionsPanel: React.FC<AlsoInVersionsPanelProps> = ({
  verseReference,
  verseKey,
  alternates,
  loadVerseText,
  colors,
  onCompare,
  onClose,
}) => {
  const {t} = useLanguage();

  const [openId, setOpenId] = useState<string | null>(null);
  const [texts, setTexts] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  // A new selection is a new verse — drop the cache and any open peek.
  useEffect(() => {
    setOpenId(null);
    setTexts({});
  }, [verseKey]);

  const languageName = (code: string) =>
    code === 'en' ? t.home.alsoLanguageEn : t.home.alsoLanguageEs;

  const handleChip = async (versionId: string) => {
    if (openId === versionId) {
      setOpenId(null);
      return;
    }
    setOpenId(versionId);
    if (texts[versionId] === undefined) {
      setLoading(true);
      try {
        const text = await loadVerseText(versionId);
        setTexts(prev => ({...prev, [versionId]: text}));
      } catch {
        setTexts(prev => ({...prev, [versionId]: null}));
      } finally {
        setLoading(false);
      }
    }
  };

  const open = alternates.find(v => v.id === openId);
  const openText = openId ? texts[openId] : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text
          numberOfLines={1}
          style={[styles.headerText, {color: colors.textSecondary}]}>
          {t.home.alsoIn} · {verseReference}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.verse.alsoClose}
          hitSlop={8}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.chipRow}>
        {alternates.map(v => {
          const isOpen = openId === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.chip,
                {borderColor: isOpen ? colors.primary : colors.border},
                isOpen && {backgroundColor: colors.primary + '22'},
              ]}
              onPress={() => handleChip(v.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.home.alsoIn} ${v.name} (${languageName(v.language)})`}
              accessibilityState={{expanded: isOpen}}>
              <Ionicons
                name="language"
                size={12}
                color={isOpen ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  {color: isOpen ? colors.primary : colors.textSecondary},
                ]}>
                {alsoChipLabel(v)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {open ? (
        <View
          style={[styles.verseContainer, {borderLeftColor: colors.primary}]}>
          {loading && openText === undefined ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : openText ? (
            <Text style={[styles.verseText, {color: colors.text}]}>
              "{openText}"
            </Text>
          ) : (
            <Text style={[styles.unavailable, {color: colors.textSecondary}]}>
              {t.home.alsoUnavailable.replace('{{version}}', open.abbreviation)}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text
              numberOfLines={1}
              style={[styles.metaVersion, {color: colors.textSecondary}]}>
              {open.name}
            </Text>
            <TouchableOpacity
              style={styles.compareButton}
              onPress={onCompare}
              accessibilityRole="button"
              accessibilityLabel={t.home.alsoCompare}>
              <Text style={[styles.compareText, {color: colors.primary}]}>
                {t.home.alsoCompare}
              </Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  verseContainer: {
    marginTop: spacing.md,
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    gap: spacing.xs,
  },
  verseText: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  unavailable: {
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  metaVersion: {
    flex: 1,
    fontSize: fontSize.xs,
    marginRight: spacing.sm,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 28,
  },
  compareText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});

export default AlsoInVersionsPanel;
