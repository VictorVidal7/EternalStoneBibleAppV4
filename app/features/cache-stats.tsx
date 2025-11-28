import React from 'react';
import {CacheStatsScreen} from '../../src/screens/CacheStatsScreen';

export default function CacheStatsRoute() {
  // En producción, obtendrías el userId del contexto de autenticación
  const userId = 'demo-user';

  return <CacheStatsScreen userId={userId} />;
}
