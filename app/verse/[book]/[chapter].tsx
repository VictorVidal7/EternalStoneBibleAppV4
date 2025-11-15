import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import bibleDB from '../../../src/lib/database';
import { BibleVerse } from '../../../src/types/bible';
import { getBookByName } from '../../../src/constants/bible';
import { useTheme } from '../../../src/hooks/useTheme';
import { useBibleVersion } from '../../../src/hooks/useBibleVersion';

export default function VerseReadingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { selectedVersion } = useBibleVersion();
  const { book, chapter, verse: highlightVerse } = useLocalSearchParams<{
    book: string;
    chapter: string;
    verse?: string;
  }>();

  const bookInfo = getBookByName(book);
  const chapterNum = parseInt(chapter);

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<number>>(new Set());

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadChapter();
    loadBookmarks();
  }, [book, chapter, selectedVersion.id]);

  async function loadChapter() {
    try {
      setLoading(true);
      console.log(`📖 Loading chapter: book="${book}", chapter=${chapterNum}, version="${selectedVersion.id}"`);

      await bibleDB.initialize();

      const chapterVerses = await bibleDB.getChapter(book, chapterNum, selectedVersion.id);
      console.log(`✅ Loaded ${chapterVerses.length} verses`);

      setVerses(chapterVerses);

      // Update reading progress
      if (chapterVerses.length > 0) {
        await bibleDB.updateReadingProgress(book, chapterNum, 1);
      }

      setLoading(false);

      // Scroll to highlighted verse if provided
      if (highlightVerse && scrollViewRef.current) {
        setTimeout(() => {
          const verseNum = parseInt(highlightVerse as string);
          // Simplified scrolling - in production would use measurement
        }, 300);
      }
    } catch (error) {
      console.error(`❌ Error loading chapter ${book} ${chapterNum}:`, error);
      setLoading(false);
    }
  }

  async function loadBookmarks() {
    try {
      console.log(`📑 Loading bookmarks for ${book} ${chapterNum}...`);
      const allBookmarks = await bibleDB.getBookmarks();
      const currentChapterBookmarks = allBookmarks
        .filter((b) => b.book === book && b.chapter === chapterNum)
        .map((b) => b.verse);

      console.log(`✅ Found ${currentChapterBookmarks.length} bookmarks for this chapter`);
      setBookmarkedVerses(new Set(currentChapterBookmarks));
    } catch (error) {
      console.error(`❌ Error loading bookmarks for ${book} ${chapterNum}:`, error);
    }
  }

  async function toggleBookmark(verse: BibleVerse) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isBookmarked = bookmarkedVerses.has(verse.verse);

    if (isBookmarked) {
      // Find and remove bookmark
      const allBookmarks = await bibleDB.getBookmarks();
      const bookmark = allBookmarks.find(
        (b) => b.book === verse.book && b.chapter === verse.chapter && b.verse === verse.verse
      );

      if (bookmark) {
        await bibleDB.removeBookmark(bookmark.id);
        const newSet = new Set(bookmarkedVerses);
        newSet.delete(verse.verse);
        setBookmarkedVerses(newSet);
      }
    } else {
      // Add bookmark
      await bibleDB.addBookmark({
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        createdAt: new Date().toISOString(),
      });

      const newSet = new Set(bookmarkedVerses);
      newSet.add(verse.verse);
      setBookmarkedVerses(newSet);
    }
  }

  async function handleCopyVerse(verse: BibleVerse) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', 'Versículo copiado al portapapeles');
  }

  async function handleShareVerse(verse: BibleVerse) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `"${verse.text}"\n\n${verse.book} ${verse.chapter}:${verse.verse} (${selectedVersion.abbreviation})`;

    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  async function handleAddNote(verse: BibleVerse) {
    setSelectedVerse(verse);

    // Check if note already exists
    const existingNote = await bibleDB.getNoteForVerse(verse.book, verse.chapter, verse.verse);

    if (existingNote) {
      setNoteText(existingNote.note);
    } else {
      setNoteText('');
    }

    setNoteModalVisible(true);
  }

  async function saveNote() {
    if (!selectedVerse || !noteText.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const existingNote = await bibleDB.getNoteForVerse(
      selectedVerse.book,
      selectedVerse.chapter,
      selectedVerse.verse
    );

    if (existingNote) {
      await bibleDB.updateNote(existingNote.id, noteText.trim());
    } else {
      const now = new Date().toISOString();
      await bibleDB.addNote({
        book: selectedVerse.book,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse,
        text: selectedVerse.text,
        note: noteText.trim(),
        createdAt: now,
        updatedAt: now,
      });
    }

    setNoteModalVisible(false);
    setNoteText('');
    Alert.alert(t.ok, t.notes.saved);
  }

  function navigateChapter(direction: 'prev' | 'next') {
    if (!bookInfo) return;

    let newChapter = chapterNum + (direction === 'next' ? 1 : -1);

    if (newChapter < 1 || newChapter > bookInfo.chapters) {
      Alert.alert(
        t.app.endOfBook,
        direction === 'next'
          ? t.app.endOfBookMessage
          : t.app.firstChapterMessage
      );
      return;
    }

    router.replace(`/verse/${book}/${newChapter}` as any);
  }

  if (!bookInfo || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${bookInfo.name} ${chapterNum}`,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => setFontSize((prev) => Math.min(prev + 2, 24))}
                style={styles.headerButton}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFontSize((prev) => Math.max(prev - 2, 12))}
                style={styles.headerButton}
              >
                <Ionicons name="remove-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Navigation Bar */}
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateChapter('prev')}
            disabled={chapterNum === 1}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={chapterNum === 1 ? colors.textTertiary : colors.primary}
            />
            <Text
              style={[styles.navButtonText, { color: chapterNum === 1 ? colors.textTertiary : colors.primary }]}
            >
              {t.previous}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.navTitle, { color: colors.text }]}>
            {bookInfo.name} {chapterNum}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateChapter('next')}
            disabled={chapterNum === bookInfo.chapters}
          >
            <Text
              style={[styles.navButtonText, { color: chapterNum === bookInfo.chapters ? colors.textTertiary : colors.primary }]}
            >
              {t.next}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={chapterNum === bookInfo.chapters ? colors.textTertiary : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Verses */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.versesContainer}
          contentContainerStyle={styles.versesContent}
        >
          {verses.map((verse) => {
            const isBookmarked = bookmarkedVerses.has(verse.verse);
            const isHighlighted = highlightVerse && parseInt(highlightVerse as string) === verse.verse;

            return (
              <View
                key={verse.verse}
                style={[styles.verseItem, { backgroundColor: colors.surface }, isHighlighted && { backgroundColor: colors.verseHighlight, borderColor: colors.warning, borderWidth: 2 }]}
              >
                <View style={styles.verseHeader}>
                  <Text style={[styles.verseNumber, { color: colors.primary }]}>{verse.verse}</Text>

                  <TouchableOpacity onPress={() => toggleBookmark(verse)}>
                    <Ionicons
                      name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={isBookmarked ? colors.bookmark : colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.verseText, { fontSize, color: colors.text }]}>{verse.text}</Text>

                <View style={[styles.verseActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCopyVerse(verse)}
                  >
                    <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>{t.copy}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleShareVerse(verse)}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>{t.share}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAddNote(verse)}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>Nota</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Note Modal */}
        <Modal
          visible={noteModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setNoteModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedVerse
                    ? `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`
                    : 'Nota'}
                </Text>
                <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedVerse && (
                <Text style={[styles.modalVerse, { color: colors.textSecondary, backgroundColor: colors.surfaceVariant }]}>"{selectedVerse.text}"</Text>
              )}

              <TextInput
                style={[styles.noteInput, { color: colors.text, borderColor: colors.border }]}
                placeholder={t.notes.placeholder}
                placeholderTextColor={colors.textTertiary}
                value={noteText}
                onChangeText={setNoteText}
                multiline
                autoFocus
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: noteText.trim() ? colors.success : colors.textTertiary }]}
                onPress={saveNote}
                disabled={!noteText.trim()}
              >
                <Text style={styles.saveButtonText}>Guardar Nota</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#BDC3C7',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  versesContainer: {
    flex: 1,
  },
  versesContent: {
    padding: 16,
  },
  verseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  verseItemHighlighted: {
    backgroundColor: '#FFF9E6',
    borderColor: '#F39C12',
    borderWidth: 2,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  verseText: {
    lineHeight: 26,
    color: '#2C3E50',
    marginBottom: 12,
  },
  verseActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalVerse: {
    fontSize: 15,
    lineHeight: 22,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
