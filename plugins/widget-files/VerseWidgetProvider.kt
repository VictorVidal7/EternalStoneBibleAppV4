package com.eternalstonebible.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.util.Calendar

/**
 * Home-screen widget that shows a curated daily Bible verse.
 *
 * The verse for any calendar day is chosen deterministically from
 * `DAILY_VERSES` (day-of-year modulo list size), so every device sees
 * the same verse on the same day and the verse never changes mid-day.
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
        /**
         * Curated daily verses (RVR1960). Text inlined so the widget is
         * self-contained — no JS bridge needed for the widget to render
         * even before the user has launched the app for the first time.
         */
        private data class Verse(val reference: String, val text: String)

        private val DAILY_VERSES: List<Verse> = listOf(
            Verse("Génesis 1:1", "En el principio creó Dios los cielos y la tierra."),
            Verse("Josué 1:9", "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas."),
            Verse("Salmos 23:1", "Jehová es mi pastor; nada me faltará."),
            Verse("Salmos 23:4", "Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo."),
            Verse("Salmos 27:1", "Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?"),
            Verse("Salmos 34:18", "Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu."),
            Verse("Salmos 37:4", "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón."),
            Verse("Salmos 46:1", "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones."),
            Verse("Salmos 46:10", "Estad quietos, y conoced que yo soy Dios."),
            Verse("Salmos 91:1", "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente."),
            Verse("Salmos 119:105", "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."),
            Verse("Salmos 121:1-2", "Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová, que hizo los cielos y la tierra."),
            Verse("Proverbios 3:5", "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia."),
            Verse("Proverbios 3:6", "Reconócelo en todos tus caminos, y él enderezará tus veredas."),
            Verse("Proverbios 18:10", "Torre fuerte es el nombre de Jehová; a él correrá el justo, y será levantado."),
            Verse("Isaías 26:3", "Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado."),
            Verse("Isaías 40:31", "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas."),
            Verse("Isaías 41:10", "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo."),
            Verse("Jeremías 29:11", "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis."),
            Verse("Lamentaciones 3:22-23", "Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana."),
            Verse("Mateo 6:33", "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas."),
            Verse("Mateo 11:28", "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar."),
            Verse("Juan 3:16", "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."),
            Verse("Juan 14:6", "Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí."),
            Verse("Juan 14:27", "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo."),
            Verse("Romanos 8:28", "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien."),
            Verse("Romanos 8:38-39", "Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades… nos podrá separar del amor de Dios."),
            Verse("Romanos 12:2", "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento."),
            Verse("1 Corintios 13:4", "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece."),
            Verse("2 Corintios 5:17", "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas."),
            Verse("Filipenses 4:6-7", "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias."),
            Verse("Filipenses 4:13", "Todo lo puedo en Cristo que me fortalece."),
            Verse("1 Tesalonicenses 5:16-18", "Estad siempre gozosos. Orad sin cesar. Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús."),
            Verse("Hebreos 11:1", "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve."),
            Verse("Hebreos 13:8", "Jesucristo es el mismo ayer, y hoy, y por los siglos."),
            Verse("Santiago 1:5", "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada."),
            Verse("1 Pedro 5:7", "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros."),
            Verse("1 Juan 1:9", "Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad."),
            Verse("1 Juan 4:18", "En el amor no hay temor, sino que el perfecto amor echa fuera el temor."),
            Verse("Apocalipsis 21:4", "Enjugará Dios toda lágrima de los ojos de ellos; y ya no habrá muerte, ni habrá más llanto, ni clamor, ni dolor.")
        )

        /** Day of the year (1-366) for today, local time. */
        private fun dayOfYear(): Int {
            val cal = Calendar.getInstance()
            return cal.get(Calendar.DAY_OF_YEAR)
        }

        /** Deterministic verse-of-the-day pick. */
        private fun verseForToday(): Verse {
            val idx = ((dayOfYear() - 1) % DAILY_VERSES.size + DAILY_VERSES.size) % DAILY_VERSES.size
            return DAILY_VERSES[idx]
        }

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
            val views = RemoteViews(context.packageName, R.layout.verse_widget)
            views.setTextViewText(R.id.widget_verse_text, "“${verse.text}”")
            views.setTextViewText(R.id.widget_verse_reference, verse.reference)

            // Whole-widget tap opens the app's main activity.
            val launchIntent = Intent(context, MainActivity::class.java).apply {
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
