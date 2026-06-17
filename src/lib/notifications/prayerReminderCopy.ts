/**
 * 🙏 prayerReminderCopy — the gentle prayer-reminder lines (Sprint 95).
 *
 * Curated, warm invitations to pray — never a scold (the prayer companion is
 * "never a scold", Sprint 93), so a reminder seen on a hard day reads as grace,
 * not pressure. The line is chosen deterministically by day-of-year (reusing
 * the pure [[dailyLight]] rotation), so every notification on a given day
 * matches and it refreshes tomorrow.
 *
 * Kept PURE (no expo-notifications / React / storage) so it is unit-testable;
 * NotificationService just resolves the day's line and schedules it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {dailyIndex} from '../../features/daily-light/dailyLight';

export interface ReminderCopy {
  title: string;
  body: string;
}

export const PRAYER_REMINDER_COPY: Record<
  'es' | 'en',
  readonly ReminderCopy[]
> = {
  es: [
    {
      title: '🙏 Un momento para orar',
      body: 'Tu Padre celestial te espera. Pasa un momento con Él hoy.',
    },
    {
      title: '🙏 Acércate con confianza',
      body: 'Acerquémonos confiadamente al trono de la gracia (Hebreos 4:16).',
    },
    {
      title: '🙏 Él te escucha',
      body: 'Echa sobre Él toda tu ansiedad, porque él tiene cuidado de ti (1 Pedro 5:7).',
    },
    {
      title: '🙏 Habla con Dios',
      body: 'No hay oración demasiado pequeña. Cuéntale lo que hay en tu corazón.',
    },
    {
      title: '🙏 Un tiempo de gratitud',
      body: 'Dale gracias hoy por su bondad; su misericordia es para siempre.',
    },
    {
      title: '🙏 Quietud con Él',
      body: 'Estad quietos, y conoced que yo soy Dios (Salmos 46:10).',
    },
  ],
  en: [
    {
      title: '🙏 A moment to pray',
      body: 'Your heavenly Father is waiting. Spend a moment with Him today.',
    },
    {
      title: '🙏 Come with confidence',
      body: 'Let us come boldly unto the throne of grace (Hebrews 4:16).',
    },
    {
      title: '🙏 He hears you',
      body: 'Cast all your anxiety on Him, because He cares for you (1 Peter 5:7).',
    },
    {
      title: '🙏 Talk with God',
      body: 'No prayer is too small. Tell Him what is on your heart.',
    },
    {
      title: '🙏 A time to give thanks',
      body: 'Thank Him today for His goodness; His mercy endures forever.',
    },
    {
      title: '🙏 Be still with Him',
      body: 'Be still, and know that I am God (Psalm 46:10).',
    },
  ],
};

/**
 * The gentle prayer-reminder line for a given day, chosen deterministically
 * (day-of-year rotation) so the set cycles without repeating two days running.
 * Falls back to English for an unknown language.
 */
export function pickPrayerReminderCopy(
  language: 'es' | 'en',
  date: Date,
): ReminderCopy {
  const lines = PRAYER_REMINDER_COPY[language] ?? PRAYER_REMINDER_COPY.en;
  return lines[dailyIndex(lines.length, date)];
}
