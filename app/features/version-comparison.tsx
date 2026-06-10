import React from 'react';
import {VersionComparisonScreen} from '../../src/screens/VersionComparisonScreen';
import {useLocalSearchParams} from 'expo-router';

export default function VersionComparisonRoute() {
  const params = useLocalSearchParams();

  // En producción, obtendrías el userId del contexto de autenticación
  const userId = 'demo-user';

  // Parámetros opcionales desde la URL
  const book = typeof params.book === 'string' ? params.book : 'Juan';
  const chapter =
    typeof params.chapter === 'string' ? parseInt(params.chapter, 10) : 3;
  const verse =
    typeof params.verse === 'string' ? parseInt(params.verse, 10) : 16;

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
      userId={userId}
    />
  );
}
