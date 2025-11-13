import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BIBLE_BOOKS } from '../../src/constants/bible';
import { useTheme } from '../../src/hooks/useTheme';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function BibleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const oldTestament = BIBLE_BOOKS.filter((book) => book.testament === 'old');
  const newTestament = BIBLE_BOOKS.filter((book) => book.testament === 'new');

  const sections = [
    { title: t.bible.oldTestament, data: oldTestament },
    { title: t.bible.newTestament, data: newTestament },
  ];

  function goToChapterSelection(bookName: string) {
    router.push(`/chapter/${bookName}` as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
            <Ionicons
              name={section.data[0]?.testament === 'old' ? 'book' : 'heart'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>
              {section.data.length} {t.bible.books}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bookItem, { backgroundColor: colors.surface }]}
            onPress={() => goToChapterSelection(item.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.bookIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.bookIcon, { color: colors.primary }]}>{item.abbr}</Text>
            </View>

            <View style={styles.bookInfo}>
              <Text style={[styles.bookName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.bookChapters, { color: colors.textSecondary }]}>
                {item.chapters} {item.chapters === 1 ? t.bible.chapter : t.bible.chapters}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: '#ECF0F1',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookChapters: {
    fontSize: 14,
  },
});
