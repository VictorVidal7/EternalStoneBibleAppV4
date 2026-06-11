/**
 * ✨ VERSE OF DAY CARD - Tarjeta del Verso del Día
 *
 * Componente hermoso para mostrar el verso diario con:
 * - Glassmorphism y backdrop blur
 * - Tipografía serif para el texto bíblico
 * - Border-left de 4px estilo blockquote
 * - Botones con estados hover/active
 * - Ícono Sparkles con gradiente
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {AppText as Text} from '../ui/AppText';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {
  createCelestialTheme,
  celestialBorderRadius,
} from '../../styles/celestialTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {useTheme} from '../../hooks/useTheme';
import {usePressScale} from '../../hooks/usePressScale';
import {alsoChipLabel} from '../../lib/home/alsoInVersions';

/** A translation offered by the "see it in …" chips (Sprint 77). */
export interface AlternateVersionOption {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
}

interface VerseOfDayCardProps {
  /**
   * Texto del versículo
   */
  verseText: string;

  /**
   * Referencia bíblica (ej: "Juan 3:16")
   */
  reference: string;

  /**
   * Título de la card
   * @default "Verso del Día"
   */
  title?: string;

  /**
   * Callback al presionar la card
   */
  onPress?: () => void;

  /**
   * Callback al presionar el botón de compartir
   */
  onShare?: () => void;

  /**
   * Callback al presionar el botón de favorito
   */
  onFavorite?: () => void;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;

  /**
   * Small version tag rendered next to the reference (e.g. "RVR1960") —
   * names the Bible version the verse text comes from (the user's selected
   * reading version). Pass undefined to hide.
   */
  versionLabel?: string;

  /**
   * Callback to open Study mode (S61) for this verse. When provided AND
   * {@link studyConnectionsCount} > 0, the card shows a "study web" CTA that
   * invites the reader into the verse's two-way connection web.
   */
  onStudy?: () => void;

  /**
   * Number of study connections (references + referenced-by) this verse has.
   * Drives the badge on the study CTA; the CTA is hidden when this is 0.
   */
  studyConnectionsCount?: number;

  /**
   * Other translations to offer as "see it in …" chips (Sprint 77) —
   * cross-language first (see orderAlsoVersions). Hidden when empty or when
   * {@link loadAlternateText} is missing.
   */
  alternates?: AlternateVersionOption[];

  /**
   * Lazily fetches this daily verse's text in another version. Resolves null
   * when the verse is missing there; results are cached per version for the
   * card's lifetime.
   */
  loadAlternateText?: (versionId: string) => Promise<string | null>;

  /**
   * Opens the full version-comparison screen on this verse — the natural
   * "go deeper" exit from the inline peek.
   */
  onCompare?: () => void;

  /**
   * Whether the "see it in …" chip row is shown. OFF by default — the card
   * stays minimal; a footer globe button (see {@link onToggleAlternates})
   * reveals the chips for readers who want the cross-version peek.
   */
  alternatesVisible?: boolean;

  /** Toggles {@link alternatesVisible}; the owner persists the choice. */
  onToggleAlternates?: () => void;

  /**
   * Caption naming the displayed day while browsing previous days
   * (Sprint 78) — "Ayer" or a formatted date. Null/absent means today.
   */
  historyLabel?: string | null;

  /**
   * Steps one day further back through previous daily verses. Absent =
   * the history window's end (the back chevron disables).
   */
  onPrevDay?: () => void;

  /** Steps one day toward today; only meaningful while in the past. */
  onNextDay?: () => void;

  /** Jumps straight back to today's verse; only shown while in the past. */
  onToday?: () => void;

  /**
   * Whether the history navigation row renders at all. The owner keeps
   * the chevrons mounted even at the window edges (disabled), so this
   * gates the whole affordance instead.
   */
  historyEnabled?: boolean;
}

const VerseOfDayCard: React.FC<VerseOfDayCardProps> = ({
  verseText,
  reference,
  title,
  onPress,
  onShare,
  onFavorite,
  isDark = false,
  versionLabel,
  onStudy,
  studyConnectionsCount = 0,
  alternates,
  loadAlternateText,
  onCompare,
  alternatesVisible = false,
  onToggleAlternates,
  historyLabel,
  onPrevDay,
  onNextDay,
  onToday,
  historyEnabled = false,
}) => {
  const {t} = useLanguage();
  const {colors} = useTheme();
  // Pasar colores dinámicos del tema seleccionado
  const theme = createCelestialTheme(isDark, {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    info: colors.info,
  });
  // Sprint 67: shared, reduce-motion-aware press depress (see usePressScale).
  const press = usePressScale();
  const [isFavorited, setIsFavorited] = useState(false);

  // "See it in …" inline peek (Sprint 77): which alternate version is open,
  // plus a per-version text cache so each translation loads at most once.
  const [openAlternateId, setOpenAlternateId] = useState<string | null>(null);
  const [alternateTexts, setAlternateTexts] = useState<
    Record<string, string | null>
  >({});
  const [alternateLoading, setAlternateLoading] = useState(false);

  // Use translation if title not provided
  const displayTitle = title || t.home.dailyVerse;

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.();
  };

  const languageName = (code: string) =>
    code === 'en' ? t.home.alsoLanguageEn : t.home.alsoLanguageEs;

  // Hiding the section also collapses any open peek, so re-revealing starts
  // from the clean chip row.
  useEffect(() => {
    if (!alternatesVisible) {
      setOpenAlternateId(null);
    }
  }, [alternatesVisible]);

  const handleAlternateChip = async (versionId: string) => {
    if (openAlternateId === versionId) {
      setOpenAlternateId(null);
      return;
    }
    setOpenAlternateId(versionId);
    if (alternateTexts[versionId] === undefined && loadAlternateText) {
      setAlternateLoading(true);
      try {
        const text = await loadAlternateText(versionId);
        setAlternateTexts(prev => ({...prev, [versionId]: text}));
      } catch {
        setAlternateTexts(prev => ({...prev, [versionId]: null}));
      } finally {
        setAlternateLoading(false);
      }
    }
  };

  const openAlternate = alternates?.find(v => v.id === openAlternateId);
  const openAlternateText = openAlternateId
    ? alternateTexts[openAlternateId]
    : undefined;

  return (
    <Animated.View style={{transform: [{scale: press.scale}]}}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={!onPress}>
        <BlurView
          intensity={isDark ? 30 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceGlass,
              borderColor: theme.colors.glassBorder,
              borderRadius: celestialBorderRadius.cardMedium, // 24px
            },
            theme.shadows.lg,
          ]}>
          {/* Header con ícono sparkles */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconContainerBase,
                  styles.iconChipRadius,
                  {backgroundColor: colors.primary + '20'},
                ]}>
                <Ionicons name="sparkles" size={24} color={colors.primary} />
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text
                scaleRole="display"
                style={[styles.title, {color: theme.colors.text}]}>
                {displayTitle}
              </Text>
              <View style={styles.subtitleRow}>
                <Text
                  scaleRole="compact"
                  style={[
                    styles.subtitle,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {reference}
                </Text>
                {versionLabel ? (
                  <View
                    style={[
                      styles.versionBadge,
                      {
                        backgroundColor: colors.primary + '22',
                        borderColor: colors.primary,
                      },
                    ]}>
                    <Text
                      scaleRole="compact"
                      style={[
                        styles.versionBadgeText,
                        {color: colors.primary},
                      ]}>
                      {versionLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Historial de días anteriores (Sprint 78): el verso del día es
              determinista por fecha, así que los días pasados se recomputan
              puros — chevrons acotados a la ventana + caption del día. */}
          {historyEnabled ? (
            <View style={styles.historyRow}>
              <TouchableOpacity
                onPress={onPrevDay}
                disabled={!onPrevDay}
                accessibilityRole="button"
                accessibilityLabel={t.home.dailyPrevDay}
                accessibilityState={{disabled: !onPrevDay}}
                hitSlop={8}>
                <Ionicons
                  name="chevron-back-circle-outline"
                  size={22}
                  color={
                    onPrevDay ? colors.primary : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <Text
                scaleRole="compact"
                style={[
                  styles.historyLabel,
                  {
                    color: historyLabel
                      ? colors.primary
                      : theme.colors.textSecondary,
                  },
                ]}>
                {historyLabel ?? t.home.dailyToday}
              </Text>
              <TouchableOpacity
                onPress={onNextDay}
                disabled={!onNextDay}
                accessibilityRole="button"
                accessibilityLabel={t.home.dailyNextDay}
                accessibilityState={{disabled: !onNextDay}}
                hitSlop={8}>
                <Ionicons
                  name="chevron-forward-circle-outline"
                  size={22}
                  color={
                    onNextDay ? colors.primary : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
              {onToday ? (
                <TouchableOpacity
                  style={[
                    styles.historyTodayPill,
                    {
                      backgroundColor: colors.primary + '22',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={onToday}
                  accessibilityRole="button"
                  accessibilityLabel={t.home.dailyBackToToday}>
                  <Text
                    scaleRole="compact"
                    style={[styles.historyTodayText, {color: colors.primary}]}>
                    {t.home.dailyToday}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Verso con tipografía serif y border-left */}
          <View
            style={[
              styles.verseContainer,
              {
                borderLeftColor: colors.primary,
              },
            ]}>
            <Text
              scaleRole="body"
              style={[
                styles.verseText,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.serif,
                },
              ]}>
              "{verseText}"
            </Text>
          </View>

          {/* "Ver también en…" — el mismo verso en otra lengua/versión, como
              vistazo inline sin salir del Home (Sprint 77). Oculto hasta que
              el lector lo activa con el globo del footer. */}
          {alternatesVisible &&
          alternates &&
          alternates.length > 0 &&
          loadAlternateText ? (
            <View style={styles.alsoSection}>
              <View style={styles.alsoChipRow}>
                {alternates.map(v => {
                  const isOpen = openAlternateId === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.alsoChip,
                        {
                          borderColor: isOpen
                            ? colors.primary
                            : theme.colors.glassBorder,
                          backgroundColor: isOpen
                            ? colors.primary + '22'
                            : theme.colors.hover,
                        },
                      ]}
                      onPress={() => handleAlternateChip(v.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.home.alsoIn} ${v.name} (${languageName(v.language)})`}
                      accessibilityState={{expanded: isOpen}}>
                      <Ionicons
                        name="language"
                        size={12}
                        color={
                          isOpen ? colors.primary : theme.colors.textSecondary
                        }
                      />
                      <Text
                        scaleRole="compact"
                        style={[
                          styles.alsoChipText,
                          {
                            color: isOpen
                              ? colors.primary
                              : theme.colors.textSecondary,
                          },
                        ]}>
                        {alsoChipLabel(v)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {openAlternate ? (
                <View
                  style={[
                    styles.alsoVerseContainer,
                    {borderLeftColor: colors.info},
                  ]}>
                  {alternateLoading && openAlternateText === undefined ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : openAlternateText ? (
                    <Text
                      scaleRole="body"
                      style={[
                        styles.alsoVerseText,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.fontFamily.serif,
                        },
                      ]}>
                      "{openAlternateText}"
                    </Text>
                  ) : (
                    <Text
                      scaleRole="compact"
                      style={[
                        styles.alsoUnavailable,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {t.home.alsoUnavailable.replace(
                        '{{version}}',
                        openAlternate.abbreviation,
                      )}
                    </Text>
                  )}
                  <View style={styles.alsoMetaRow}>
                    <Text
                      scaleRole="compact"
                      style={[
                        styles.alsoMetaVersion,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {openAlternate.name}
                    </Text>
                    {onCompare && (
                      <TouchableOpacity
                        style={styles.alsoCompareButton}
                        onPress={onCompare}
                        accessibilityRole="button"
                        accessibilityLabel={t.home.alsoCompare}>
                        <Text
                          scaleRole="compact"
                          style={[
                            styles.alsoCompareText,
                            {color: colors.primary},
                          ]}>
                          {t.home.alsoCompare}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={13}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Footer con botones de acción */}
          <View style={styles.footer}>
            {/* Botón leer capítulo completo */}
            {onPress && (
              <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                <Text
                  scaleRole="compact"
                  style={[styles.actionText, {color: colors.primary}]}>
                  {t.home.readFullChapter}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}

            {/* Botones de share y favorite */}
            <View style={styles.iconButtons}>
              {alternates &&
                alternates.length > 0 &&
                loadAlternateText &&
                onToggleAlternates && (
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: alternatesVisible
                          ? colors.primary + '22'
                          : theme.colors.hover,
                      },
                    ]}
                    onPress={onToggleAlternates}
                    accessibilityRole="button"
                    accessibilityLabel={t.home.alsoToggle}
                    accessibilityState={{selected: alternatesVisible}}>
                    <Ionicons
                      name="language"
                      size={20}
                      color={
                        alternatesVisible ? colors.primary : theme.colors.text
                      }
                    />
                  </TouchableOpacity>
                )}
              {onShare && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    {backgroundColor: theme.colors.hover},
                  ]}
                  onPress={onShare}
                  accessibilityRole="button"
                  accessibilityLabel={t.verse.shareVerse}>
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              )}

              {onFavorite && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    {backgroundColor: theme.colors.hover},
                  ]}
                  onPress={handleFavorite}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFavorited ? t.verse.removeFavorite : t.verse.addFavorite
                  }
                  accessibilityState={{selected: isFavorited}}>
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? '#ef4444' : theme.colors.text}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Study web CTA (S62) — invites the reader into the verse's two-way
              study connections (S61). Hidden when the verse has no connections. */}
          {onStudy && studyConnectionsCount > 0 ? (
            <TouchableOpacity
              style={[
                styles.studyCta,
                {borderTopColor: theme.colors.glassBorder},
              ]}
              onPress={onStudy}
              accessibilityRole="button"
              accessibilityLabel={`${t.home.studyVerse}, ${studyConnectionsCount}`}>
              <Ionicons
                name="git-network-outline"
                size={18}
                color={colors.primary}
              />
              <Text
                scaleRole="compact"
                style={[styles.studyCtaText, {color: colors.primary}]}>
                {t.home.studyVerse}
              </Text>
              <View
                style={[
                  styles.studyBadge,
                  {backgroundColor: colors.primary + '22'},
                ]}>
                <Text
                  scaleRole="compact"
                  style={[styles.studyBadgeText, {color: colors.primary}]}>
                  {studyConnectionsCount}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconChipRadius: {borderRadius: 12},
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24, // celestialSpacing.cardPadding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconContainerBase: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20, // lg
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12, // xs
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.7,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  verseContainer: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginBottom: 16,
  },
  verseText: {
    fontSize: 16, // base
    lineHeight: 25.6, // 16 * 1.6
    fontStyle: 'italic',
    opacity: 0.95,
  },
  alsoSection: {
    marginBottom: 4,
  },
  alsoChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alsoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  alsoChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  alsoVerseContainer: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    marginTop: 12,
    gap: 8,
  },
  alsoVerseText: {
    fontSize: 14,
    lineHeight: 22.4, // 14 * 1.6 — mirrors the main quote's rhythm
    fontStyle: 'italic',
    opacity: 0.9,
  },
  alsoUnavailable: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  alsoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  alsoMetaVersion: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
    flexShrink: 1,
  },
  alsoCompareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alsoCompareText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  historyTodayPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  historyTodayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  studyCtaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  studyBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default VerseOfDayCard;
