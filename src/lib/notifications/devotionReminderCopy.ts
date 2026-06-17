/**
 * 📖 devotionReminderCopy — the gentle "time in the Word" reminder lines (S97).
 *
 * A calm daily invitation to open the Scriptures / Daily Light devotional —
 * never a scold (a reminder seen on a busy day should read as grace, not guilt).
 * The line is chosen deterministically by day-of-year (reusing the pure
 * [[dailyLight]] rotation) so every notification on a given day matches and it
 * refreshes tomorrow. Mirrors [[prayerReminderCopy]].
 *
 * Kept PURE (no expo-notifications / React / storage) so it is unit-testable;
 * NotificationService just resolves the day's line and schedules it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {dailyIndex} from '../../features/daily-light/dailyLight';
import type {ReminderCopy} from './prayerReminderCopy';

export const DEVOTION_REMINDER_COPY: Record<
  'es' | 'en',
  readonly ReminderCopy[]
> = {
  es: [
    {
      title: '📖 Un momento en la Palabra',
      body: 'Tómate un momento hoy para abrir las Escrituras y escuchar a Dios.',
    },
    {
      title: '📖 Tu Luz diaria te espera',
      body: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino (Salmos 119:105).',
    },
    {
      title: '📖 Alimenta tu alma',
      body: 'No solo de pan vivirá el hombre, sino de toda palabra de Dios (Mateo 4:4).',
    },
    {
      title: '📖 Acércate a Jesús',
      body: 'Unos minutos en la Palabra te acercan a Cristo. Él te espera.',
    },
    {
      title: '📖 Quédate en su Palabra',
      body: 'Si permanecéis en mi palabra, seréis verdaderamente mis discípulos (Juan 8:31).',
    },
    {
      title: '📖 Una semilla para hoy',
      body: 'Un versículo puede cambiar tu día. Pasa un momento con Dios.',
    },
  ],
  en: [
    {
      title: '📖 A moment in the Word',
      body: 'Take a moment today to open the Scriptures and listen to God.',
    },
    {
      title: '📖 Your Daily Light awaits',
      body: 'Thy word is a lamp unto my feet, and a light unto my path (Psalm 119:105).',
    },
    {
      title: '📖 Feed your soul',
      body: 'Man shall not live by bread alone, but by every word of God (Matthew 4:4).',
    },
    {
      title: '📖 Draw near to Jesus',
      body: 'A few minutes in the Word draw you near to Christ. He is waiting for you.',
    },
    {
      title: '📖 Abide in His Word',
      body: 'If ye continue in my word, then are ye my disciples indeed (John 8:31).',
    },
    {
      title: '📖 A seed for today',
      body: 'One verse can change your day. Spend a moment with God.',
    },
  ],
};

/**
 * The gentle devotion-reminder line for a given day, chosen deterministically
 * (day-of-year rotation) so the set cycles without repeating two days running.
 * Falls back to English for an unknown language.
 */
export function pickDevotionReminderCopy(
  language: 'es' | 'en',
  date: Date,
): ReminderCopy {
  const lines = DEVOTION_REMINDER_COPY[language] ?? DEVOTION_REMINDER_COPY.en;
  return lines[dailyIndex(lines.length, date)];
}
