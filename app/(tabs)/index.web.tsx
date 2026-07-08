import {Redirect} from 'expo-router';

/**
 * Web home (T21) — v1 has no dashboard/streaks/achievements card feed
 * (native index.tsx pulls in ~10 write/premium contexts not mounted on
 * web). Landing straight on the book list matches "an excellent reader,
 * not the whole app in the browser" (T19 §4).
 */
export default function HomeWeb() {
  return <Redirect href="/bible" />;
}
