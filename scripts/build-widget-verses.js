/**
 * 🧩 build-widget-verses.js — regenerate the Android widget's Kotlin source
 * so its verse-of-the-day list is the SAME references, in the SAME order, as
 * the app's own daily verse feature (whatever DAILY_VERSE_REFS currently
 * holds — this script is data-driven, not pinned to a specific count).
 *
 * WHY (T7+ tech-debt audit): `plugins/widget-files/VerseWidgetProvider.kt`
 * used to carry its OWN, separate, hardcoded list of just 40 verses
 * (Spanish/RVR1960 text only), picked by `Calendar.DAY_OF_YEAR % 40`. The
 * real app picks the daily verse from `DAILY_VERSE_REFS` in
 * `src/constants/daily-verses.ts` (172 references at the time this script was
 * written; see that file for the current count) via
 * `(getDayOfYear(date) - 1) % DAILY_VERSE_REFS.length`. Because the list
 * sizes differed, the widget almost never showed the same verse as the app on
 * the same day. This script closes that gap by making the widget's list
 * literally the SAME references, in the SAME order, so `% size` lands on the
 * same entry in both places (see the day-of-year discussion below for one
 * remaining edge case that is OUT OF SCOPE here).
 *
 * The widget stays deliberately self-contained (no JS bridge — it must be
 * able to render before the user has ever opened the app), so the verse TEXT
 * still has to be inlined into the generated Kotlin, not loaded at runtime.
 * This script resolves that text once, from in-repo data, and bakes it in.
 *
 * SOURCES (all in-repo, no network → fully deterministic):
 *   - references:    src/constants/daily-verses.ts       (DAILY_VERSE_REFS)
 *   - Spanish text:  src/lib/database/bible-data-rvr1960.ts (RVR1960_DATA)
 *   - English text:  src/lib/database/bible-data-web.ts     (WEB_DATA)
 *     WEB (World English Bible) was chosen over KJV/BSB because it is the
 *     app's OTHER bundled version (ships in assets/bible-seed.db alongside
 *     RVR1960 — see scripts/rebuild-seed.js) — the only English text
 *     guaranteed present before the user downloads anything, which matches
 *     the widget's "must work before first launch" constraint.
 *   - book names (es/en): src/constants/bible.ts           (BIBLE_BOOKS)
 *
 * OUTPUT: fully overwrites plugins/widget-files/VerseWidgetProvider.kt (the
 * SOURCE file a config plugin copies into the prebuilt android/ tree on
 * every `expo prebuild` — never edit the copy under android/, it is
 * regenerated and gitignored).
 *
 * This is a ONE-OFF, MANUALLY-RUN script — it is not part of the normal
 * build. Re-run it (and commit the resulting .kt file) whenever
 * `DAILY_VERSE_REFS` changes in daily-verses.ts (new entries added,
 * reordered, etc.) so the widget doesn't drift out of sync again. See the
 * matching pointer comment atop daily-verses.ts.
 *
 * Usage:
 *   node scripts/build-widget-verses.js
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REFS_FILE = path.join(ROOT, 'src/constants/daily-verses.ts');
const RVR_FILE = path.join(ROOT, 'src/lib/database/bible-data-rvr1960.ts');
const WEB_FILE = path.join(ROOT, 'src/lib/database/bible-data-web.ts');
const BOOKS_FILE = path.join(ROOT, 'src/constants/bible.ts');
const KT_FILE = path.join(ROOT, 'plugins/widget-files/VerseWidgetProvider.kt');

/**
 * Extract a `[ ... ]` array literal that starts right after `marker` (marker
 * must end with the literal's opening `[`) and evaluate it as JS. Used for
 * .ts source files that are valid JS object/array syntax (unquoted keys,
 * single quotes, trailing commas, `//` comments) but not strict JSON.
 */
function extractArrayLiteral(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1)
    throw new Error(`Marker not found: ${JSON.stringify(marker)}`);
  const bracketStart = idx + marker.length - 1; // marker ends with '['
  let depth = 0;
  let i = bracketStart;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  const literal = src.slice(bracketStart, i);
  // eslint-disable-next-line no-new-func -- trusted, in-repo source, not user input.
  return new Function(`"use strict"; return (${literal});`)();
}

/** Parse a `export const X_DATA = [ ... ]` JSON array out of a .ts data file
 *  (same trick as scripts/rebuild-seed.js's parseTsArray). */
function parseJsonArray(file) {
  const c = fs.readFileSync(file, 'utf8');
  return JSON.parse(c.slice(c.indexOf('['), c.lastIndexOf(']') + 1));
}

/** Escape a string for embedding in a Kotlin double-quoted string literal. */
function ktString(s) {
  return (
    '"' +
    String(s)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '') +
    '"'
  );
}

function main() {
  console.log('Loading sources…');
  const refsSrc = fs.readFileSync(REFS_FILE, 'utf8');
  const refs = extractArrayLiteral(
    refsSrc,
    'export const DAILY_VERSE_REFS: DailyVerseRef[] = [',
  );
  const booksSrc = fs.readFileSync(BOOKS_FILE, 'utf8');
  const books = extractArrayLiteral(
    booksSrc,
    'export const BIBLE_BOOKS: BibleBook[] = [',
  );
  const rvr = parseJsonArray(RVR_FILE);
  const web = parseJsonArray(WEB_FILE);
  console.log(
    `  refs=${refs.length} books=${books.length} RVR1960=${rvr.length} WEB=${web.length}`,
  );

  const bookById = new Map(books.map(b => [b.id, b]));
  const key = (book, chapter, verse) => `${book}|${chapter}|${verse}`;
  const rvrByKey = new Map(
    rvr.map(r => [key(r.book_id, r.chapter, r.verse), r.text]),
  );
  const webByKey = new Map(
    web.map(r => [key(r.book_id, r.chapter, r.verse), r.text]),
  );

  const missing = [];
  const entries = refs.map((ref, idx) => {
    const book = bookById.get(ref.book);
    if (!book) missing.push(`[${idx}] unknown book id ${ref.book}`);
    const k = key(ref.book, ref.chapter, ref.verse);
    const textEs = rvrByKey.get(k);
    const textEn = webByKey.get(k);
    if (!textEs) missing.push(`[${idx}] RVR1960 missing ${k}`);
    if (!textEn) missing.push(`[${idx}] WEB missing ${k}`);
    return {
      referenceEs: `${book ? book.name : '?'} ${ref.chapter}:${ref.verse}`,
      referenceEn: `${book ? book.nameEn : '?'} ${ref.chapter}:${ref.verse}`,
      textEs: textEs || '',
      textEn: textEn || '',
      // English canonical book name + numeric chapter/verse — kept separate
      // (not just parsed back out of referenceEn) so updateWidget() can build
      // a real `eternalbible://verse/{book}/{chapter}?highlight={verse}` deep
      // link, matching the in-app route (app/(tabs)/verse/[book]/[chapter].tsx).
      bookEn: book ? book.nameEn : '',
      chapter: ref.chapter,
      verse: ref.verse,
    };
  });

  if (missing.length > 0) {
    throw new Error(
      `${missing.length} reference(s) could not be resolved:\n  ` +
        missing.join('\n  '),
    );
  }
  console.log(`  resolved all ${entries.length} references in both languages`);

  const verseLines = entries
    .map((e, idx) => {
      const es = ktString(e.textEs);
      const en = ktString(e.textEn);
      const refEs = ktString(e.referenceEs);
      const refEn = ktString(e.referenceEn);
      const bookEn = ktString(e.bookEn);
      return (
        `            Verse(${refEs}, ${refEn}, ${es}, ${en}, ${bookEn}, ${e.chapter}, ${e.verse}), ` +
        `// [${idx}] ${e.referenceEn}`
      );
    })
    .join('\n');

  const kt = `package com.eternalstonebible.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import java.util.Calendar
import java.util.Locale

/**
 * Home-screen widget that shows the app's actual verse of the day.
 *
 * THIS FILE IS GENERATED — do not hand-edit the DAILY_VERSES list below (or
 * anything else in this file: the generator owns the whole file). Re-run
 * \`node scripts/build-widget-verses.js\` from the repo root after changing
 * \`DAILY_VERSE_REFS\` in src/constants/daily-verses.ts, then commit the
 * result. See that script's header comment for the full explanation.
 *
 * DAILY_VERSES below holds the SAME ${entries.length} references as
 * \`DAILY_VERSE_REFS\` in daily-verses.ts, in the SAME order, so
 * \`(dayOfYear() - 1) % size\` picks the identical entry the app would pick
 * for the same calendar day.
 * Each entry carries BOTH the RVR1960 (Spanish) and WEB (English) text
 * inlined, because the widget is deliberately self-contained — no JS bridge,
 * so it can render even before the user has ever launched the app.
 *
 * LANGUAGE: there is currently no bridge that exposes the user's in-app
 * language choice to native Android code (NotificationService.ts sets
 * Android notification-channel display names from the app's language, but
 * never persists that choice anywhere natively readable, e.g. no
 * SharedPreferences write). Building that bridge is a separate, bigger
 * piece of app↔widget state-sharing work. As a pragmatic stand-in, this
 * widget approximates the language from the DEVICE locale
 * (\`Locale.getDefault().language\`) instead: "es" → Spanish, anything else
 * → English. That is an approximation of the user's chosen in-app language
 * (it follows the device, not necessarily the app setting), but it is a
 * real improvement over the previous behavior, which was hardcoded Spanish
 * regardless of device or app language.
 *
 * DAY-OF-YEAR CAVEAT: this file uses \`Calendar.DAY_OF_YEAR\`, which is
 * always calendar-correct (including in leap years). The app's own
 * \`getDayOfYear()\` in daily-verses.ts instead computes the day via a
 * millisecond date-difference, which is off by one (by two on the exact
 * fallback day) versus the true calendar day-of-year during Daylight Saving
 * Time, in any DST-observing timezone — verified for 2026 in
 * America/New_York and Europe/Madrid, from the day after the spring-forward
 * transition through the fall-back day (roughly Mar–Nov). Leap years alone
 * are NOT the issue — verified separately, no discrepancy. Net effect: for
 * users in DST-observing zones, the widget and the app can pick DIFFERENT
 * entries from this identical ${entries.length}-item list during that
 * ~7-month window, even though both algorithms and both lists are otherwise
 * in sync. Fixing
 * that would mean changing the app's shared getDayOfYear() (which also
 * drives daily-verse notifications, the prayer/devotion reminder rotation,
 * and the prophecy-of-the-day index) to a proper calendar-based calculation
 * — a separate, app-wide change, intentionally out of scope here.
 *
 * Para la gloria de Dios Todopoderoso.
 */
class VerseWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private data class Verse(
            val referenceEs: String,
            val referenceEn: String,
            val textEs: String,
            val textEn: String,
            val bookEn: String,
            val chapter: Int,
            val verse: Int
        )

        // BEGIN GENERATED — scripts/build-widget-verses.js. Do not hand-edit.
        private val DAILY_VERSES: List<Verse> = listOf(
${verseLines}
        )
        // END GENERATED

        /** Day of the year (1-366) for today, local time. Calendar-correct,
         *  including across DST transitions — see the class doc comment. */
        private fun dayOfYear(): Int {
            val cal = Calendar.getInstance()
            return cal.get(Calendar.DAY_OF_YEAR)
        }

        /** Deterministic verse-of-the-day pick. */
        private fun verseForToday(): Verse {
            val idx = ((dayOfYear() - 1) % DAILY_VERSES.size + DAILY_VERSES.size) % DAILY_VERSES.size
            return DAILY_VERSES[idx]
        }

        /** Approximates the user's language from the device locale — see the
         *  class doc comment for why this isn't the in-app language choice. */
        private fun isSpanish(): Boolean = Locale.getDefault().language == "es"

        /**
         * Bind the widget views for a single instance. Exposed via the
         * companion so manual refresh (e.g. from a config Activity in the
         * future) can call into the same code path.
         */
        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val verse = verseForToday()
            val spanish = isSpanish()
            val text = if (spanish) verse.textEs else verse.textEn
            val reference = if (spanish) verse.referenceEs else verse.referenceEn
            val views = RemoteViews(context.packageName, R.layout.verse_widget)
            views.setTextViewText(R.id.widget_verse_text, "“\${text}”")
            views.setTextViewText(R.id.widget_verse_reference, reference)

            // Whole-widget tap deep-links straight to today's verse in the
            // reader (same route as app/(tabs)/verse/[book]/[chapter].tsx),
            // instead of just opening the app to whatever screen it last had
            // open. setPackage pins resolution to this app so it never shows
            // a chooser even though the scheme's intent-filter has no host.
            val verseUri = Uri.parse(
                "eternalbible://verse/" + Uri.encode(verse.bookEn) + "/" + verse.chapter +
                    "?highlight=" + verse.verse
            )
            val launchIntent = Intent(Intent.ACTION_VIEW, verseUri).apply {
                setPackage(context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /** Force a refresh of every active widget instance (call after launch). */
        @JvmStatic
        fun refreshAll(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                ComponentName(context, VerseWidgetProvider::class.java)
            )
            for (id in ids) {
                updateWidget(context, mgr, id)
            }
        }
    }
}
`;

  fs.writeFileSync(KT_FILE, kt, 'utf8');
  console.log(`\nWrote ${KT_FILE}`);
  console.log(`  ${entries.length} verses, both languages inlined.`);
}

main();
