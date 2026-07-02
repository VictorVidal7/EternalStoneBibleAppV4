import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {BadgeCollectionScreen} from '../../src/screens/BadgeCollectionScreen';
import {useAuth} from '@context/AuthContext';
import {useTheme} from '@hooks/useTheme';

export default function BadgesRoute() {
  const {user} = useAuth();
  const {colors} = useTheme();

  // AuthProvider signs the reader in anonymously at app start, so `user` is
  // only null for a brief instant before that resolves — badge progress must
  // be scoped to the real (anonymous or signed-in) uid, not a shared
  // placeholder, or every install would read/write the same storage bucket.
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <BadgeCollectionScreen userId={user.uid} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
