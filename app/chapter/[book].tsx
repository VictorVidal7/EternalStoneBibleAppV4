import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBookByName } from '../../src/constants/bible';
import { useTheme } from '../../src/hooks/useTheme';

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookInfo = getBookByName(book);

  if (!bookInfo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);

  function goToChapter(chapter: number) {
    router.push(`/verse/${book}/${chapter}` as any);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: bookInfo.name,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{bookInfo.name}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {bookInfo.testament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
          </Text>
          <Text style={[styles.chapterCount, { color: colors.primary }]}>
            {bookInfo.chapters} {bookInfo.chapters === 1 ? 'capítulo' : 'capítulos'}
          </Text>
        </View>

        <FlatList
          data={chapters}
          numColumns={4}
          keyExtractor={(item) => item.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chapterButton, { backgroundColor: colors.surface, borderColor: colors.primaryLight }]}
              onPress={() => goToChapter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chapterNumber, { color: colors.primary }]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.gridContent}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  chapterCount: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
  gridContent: {
    padding: 16,
  },
  chapterButton: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#E8F4FD',
  },
  chapterNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});
