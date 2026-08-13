import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {VersionComparisonScreen} from '../../src/screens/VersionComparisonScreen';
import {useLocalSearchParams} from 'expo-router';
import {useAuth} from '@context/AuthContext';
import {useTheme} from '@hooks/useTheme';

export default function VersionComparisonRoute() {
  const params = useLocalSearchParams();
  const {user} = useAuth();
  const {colors} = useTheme();

  // Parámetros opcionales desde la URL
  const book = typeof params.book === 'string' ? params.book : 'Juan';
  const chapter =
    typeof params.chapter === 'string' ? parseInt(params.chapter, 10) : 3;
  const verse =
    typeof params.verse === 'string' ? parseInt(params.verse, 10) : 16;

  // AuthProvider signs the reader in anonymously at app start, so `user` is
  // only null for a brief instant before that resolves — saved comparisons
  // must be scoped to the real (anonymous or signed-in) uid, not a shared
  // placeholder, or every install would read/write the same storage bucket.
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <VersionComparisonScreen
      // expo-router REUSES this route's instance across navigations, so a
      // deep link with new params would otherwise land on the previous
      // comparison's state (the screen captures initialVerse at mount).
      // Re-keying by target forces a fresh mount whenever the params change.
      key={`${book}:${chapter}:${verse}`}
      book={book}
      chapter={chapter}
      initialVerse={verse}
      userId={user.uid}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
