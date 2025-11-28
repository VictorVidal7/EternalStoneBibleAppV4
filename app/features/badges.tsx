import React from 'react';
import {BadgeCollectionScreen} from '../../src/screens/BadgeCollectionScreen';

export default function BadgesRoute() {
  // En producción, obtendrías el userId del contexto de autenticación
  const userId = 'demo-user';

  return <BadgeCollectionScreen userId={userId} />;
}
