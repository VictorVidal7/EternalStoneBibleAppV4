package com.eternalstonebible.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.util.Calendar
import java.util.Locale

/**
 * Home-screen widget that shows the app's actual verse of the day.
 *
 * THIS FILE IS GENERATED — do not hand-edit the DAILY_VERSES list below (or
 * anything else in this file: the generator owns the whole file). Re-run
 * `node scripts/build-widget-verses.js` from the repo root after changing
 * `DAILY_VERSE_REFS` in src/constants/daily-verses.ts, then commit the
 * result. See that script's header comment for the full explanation.
 *
 * DAILY_VERSES below holds the SAME 198 references as
 * `DAILY_VERSE_REFS` in daily-verses.ts, in the SAME order, so
 * `(dayOfYear() - 1) % size` picks the identical entry the app would pick
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
 * (`Locale.getDefault().language`) instead: "es" → Spanish, anything else
 * → English. That is an approximation of the user's chosen in-app language
 * (it follows the device, not necessarily the app setting), but it is a
 * real improvement over the previous behavior, which was hardcoded Spanish
 * regardless of device or app language.
 *
 * DAY-OF-YEAR CAVEAT: this file uses `Calendar.DAY_OF_YEAR`, which is
 * always calendar-correct (including in leap years). The app's own
 * `getDayOfYear()` in daily-verses.ts instead computes the day via a
 * millisecond date-difference, which is off by one (by two on the exact
 * fallback day) versus the true calendar day-of-year during Daylight Saving
 * Time, in any DST-observing timezone — verified for 2026 in
 * America/New_York and Europe/Madrid, from the day after the spring-forward
 * transition through the fall-back day (roughly Mar–Nov). Leap years alone
 * are NOT the issue — verified separately, no discrepancy. Net effect: for
 * users in DST-observing zones, the widget and the app can pick DIFFERENT
 * entries from this identical 198-item list during that
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
            val textEn: String
        )

        // BEGIN GENERATED — scripts/build-widget-verses.js. Do not hand-edit.
        private val DAILY_VERSES: List<Verse> = listOf(
            Verse("Génesis 1:1", "Genesis 1:1", "En el principio creó Dios los cielos y la tierra.", "In the beginning, God created the heavens and the earth."), // [0] Genesis 1:1
            Verse("Éxodo 14:14", "Exodus 14:14", "Jehová peleará por vosotros, y vosotros estaréis tranquilos.", "Yahweh will fight for you, and you shall be still.”"), // [1] Exodus 14:14
            Verse("Éxodo 15:2", "Exodus 15:2", "Jehová es mi fortaleza y mi cántico, y ha sido mi salvación. Este es mi Dios, y lo alabaré; Dios de mi padre, y lo enalteceré.", "Yah is my strength and song. He has become my salvation. This is my God, and I will praise him; my father’s God, and I will exalt him."), // [2] Exodus 15:2
            Verse("Números 6:24", "Numbers 6:24", "Jehová te bendiga, y te guarde;", "‘Yahweh bless you, and keep you."), // [3] Numbers 6:24
            Verse("Deuteronomio 31:6", "Deuteronomy 31:6", "Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos, porque Jehová tu Dios es el que va contigo; no te dejará, ni te desamparará.", "Be strong and courageous. Don’t be afraid or scared of them; for Yahweh your God himself is who goes with you. He will not fail you nor forsake you.”"), // [4] Deuteronomy 31:6
            Verse("Deuteronomio 31:8", "Deuteronomy 31:8", "Y Jehová va delante de ti; él estará contigo, no te dejará, ni te desamparará; no temas ni te intimides.", "Yahweh himself is who goes before you. He will be with you. He will not fail you nor forsake you. Don’t be afraid. Don’t be discouraged.”"), // [5] Deuteronomy 31:8
            Verse("Josué 1:9", "Joshua 1:9", "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.", "Haven’t I commanded you? Be strong and courageous. Don’t be afraid, neither be dismayed: for Yahweh your God is with you wherever you go.”"), // [6] Joshua 1:9
            Verse("Josué 24:15", "Joshua 24:15", "Y si mal os parece servir a Jehová, escogeos hoy a quién sirváis; si a los dioses a quienes sirvieron vuestros padres, cuando estuvieron al otro lado del río, o a los dioses de los amorreos en cuya tierra habitáis; pero yo y mi casa serviremos a Jehová.", "If it seems evil to you to serve Yahweh, choose this day whom you will serve; whether the gods which your fathers served that were beyond the River, or the gods of the Amorites, in whose land you dwell: but as for me and my house, we will serve Yahweh.”"), // [7] Joshua 24:15
            Verse("1 Samuel 16:7", "1 Samuel 16:7", "Y Jehová respondió a Samuel: No mires a su parecer, ni a lo grande de su estatura, porque yo lo desecho; porque Jehová no mira lo que mira el hombre; pues el hombre mira lo que está delante de sus ojos, pero Jehová mira el corazón.", "But Yahweh said to Samuel, “Don’t look on his face, or on the height of his stature; because I have rejected him: for I see not as man sees; for man looks at the outward appearance, but Yahweh looks at the heart.”"), // [8] 1 Samuel 16:7
            Verse("1 Crónicas 16:11", "1 Chronicles 16:11", "Buscad a Jehová y su poder; Buscad su rostro continuamente.", "Seek Yahweh and his strength. Seek his face forever more."), // [9] 1 Chronicles 16:11
            Verse("2 Crónicas 7:14", "2 Chronicles 7:14", "si se humillare mi pueblo, sobre el cual mi nombre es invocado, y oraren, y buscaren mi rostro, y se convirtieren de sus malos caminos; entonces yo oiré desde los cielos, y perdonaré sus pecados, y sanaré su tierra.", "if my people, who are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then I will hear from heaven, and will forgive their sin, and will heal their land."), // [10] 2 Chronicles 7:14
            Verse("Nehemías 8:10", "Nehemiah 8:10", "Luego les dijo: Id, comed grosuras, y bebed vino dulce, y enviad porciones a los que no tienen nada preparado; porque día santo es a nuestro Señor; no os entristezcáis, porque el gozo de Jehová es vuestra fuerza.", "Then he said to them, “Go your way. Eat the fat, drink the sweet, and send portions to him for whom nothing is prepared; for this day is holy to our Lord. Don’t be grieved; for the joy of Yahweh is your strength.”"), // [11] Nehemiah 8:10
            Verse("Job 19:25", "Job 19:25", "Yo sé que mi Redentor vive, Y al fin se levantará sobre el polvo;", "But as for me, I know that my Redeemer lives. In the end, he will stand upon the earth."), // [12] Job 19:25
            Verse("Salmos 1:1", "Psalms 1:1", "Bienaventurado el varón que no anduvo en consejo de malos, Ni estuvo en camino de pecadores, Ni en silla de escarnecedores se ha sentado;", "Blessed is the man who doesn’t walk in the counsel of the wicked, nor stand on the path of sinners, nor sit in the seat of scoffers;"), // [13] Psalms 1:1
            Verse("Salmos 16:11", "Psalms 16:11", "Me mostrarás la senda de la vida; En tu presencia hay plenitud de gozo; Delicias a tu diestra para siempre.", "You will show me the path of life. In your presence is fullness of joy. In your right hand there are pleasures forever more."), // [14] Psalms 16:11
            Verse("Salmos 18:2", "Psalms 18:2", "Jehová, roca mía y castillo mío, y mi libertador; Dios mío, fortaleza mía, en él confiaré; Mi escudo, y la fuerza de mi salvación, mi alto refugio.", "Yahweh is my rock, my fortress, and my deliverer; my God, my rock, in whom I take refuge; my shield, and the horn of my salvation, my high tower."), // [15] Psalms 18:2
            Verse("Salmos 19:1", "Psalms 19:1", "Los cielos cuentan la gloria de Dios, Y el firmamento anuncia la obra de sus manos.", "The heavens declare the glory of God. The expanse shows his handiwork."), // [16] Psalms 19:1
            Verse("Salmos 23:1", "Psalms 23:1", "Jehová es mi pastor; nada me faltará.", "Yahweh is my shepherd: I shall lack nothing."), // [17] Psalms 23:1
            Verse("Salmos 27:1", "Psalms 27:1", "Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?", "Yahweh is my light and my salvation. Whom shall I fear? Yahweh is the strength of my life. Of whom shall I be afraid?"), // [18] Psalms 27:1
            Verse("Salmos 28:7", "Psalms 28:7", "Jehová es mi fortaleza y mi escudo; En él confió mi corazón, y fui ayudado, Por lo que se gozó mi corazón, Y con mi cántico le alabaré.", "Yahweh is my strength and my shield. My heart has trusted in him, and I am helped. Therefore my heart greatly rejoices. With my song I will thank him."), // [19] Psalms 28:7
            Verse("Salmos 30:5", "Psalms 30:5", "Porque un momento será su ira, Pero su favor dura toda la vida. Por la noche durará el lloro, Y a la mañana vendrá la alegría.", "For his anger is but for a moment. His favor is for a lifetime. Weeping may stay for the night, but joy comes in the morning."), // [20] Psalms 30:5
            Verse("Salmos 32:8", "Psalms 32:8", "Te haré entender, y te enseñaré el camino en que debes andar; Sobre ti fijaré mis ojos.", "I will instruct you and teach you in the way which you shall go. I will counsel you with my eye on you."), // [21] Psalms 32:8
            Verse("Salmos 34:8", "Psalms 34:8", "Gustad, y ved que es bueno Jehová; Dichoso el hombre que confía en él.", "Oh taste and see that Yahweh is good. Blessed is the man who takes refuge in him."), // [22] Psalms 34:8
            Verse("Salmos 34:18", "Psalms 34:18", "Cercano está Jehová a los quebrantados de corazón; Y salva a los contritos de espíritu.", "Yahweh is near to those who have a broken heart, and saves those who have a crushed spirit."), // [23] Psalms 34:18
            Verse("Salmos 37:4", "Psalms 37:4", "Deléitate asimismo en Jehová, Y él te concederá las peticiones de tu corazón.", "Also delight yourself in Yahweh, and he will give you the desires of your heart."), // [24] Psalms 37:4
            Verse("Salmos 42:11", "Psalms 42:11", "¿Por qué te abates, oh alma mía, Y por qué te turbas dentro de mí? Espera en Dios; porque aún he de alabarle, Salvación mía y Dios mío.", "Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him, the saving help of my countenance, and my God."), // [25] Psalms 42:11
            Verse("Salmos 46:1", "Psalms 46:1", "Dios es nuestro amparo y fortaleza, Nuestro pronto auxilio en las tribulaciones.", "God is our refuge and strength, a very present help in trouble."), // [26] Psalms 46:1
            Verse("Salmos 46:10", "Psalms 46:10", "Estad quietos, y conoced que yo soy Dios; Seré exaltado entre las naciones; enaltecido seré en la tierra.", "“Be still, and know that I am God. I will be exalted among the nations. I will be exalted in the earth.”"), // [27] Psalms 46:10
            Verse("Salmos 51:10", "Psalms 51:10", "Crea en mí, oh Dios, un corazón limpio, Y renueva un espíritu recto dentro de mí.", "Create in me a clean heart, O God. Renew a right spirit within me."), // [28] Psalms 51:10
            Verse("Salmos 55:22", "Psalms 55:22", "Echa sobre Jehová tu carga, y él te sustentará; No dejará para siempre caído al justo.", "Cast your burden on Yahweh, and he will sustain you. He will never allow the righteous to be moved."), // [29] Psalms 55:22
            Verse("Salmos 56:3", "Psalms 56:3", "En el día que temo, Yo en ti confío.", "When I am afraid, I will put my trust in you."), // [30] Psalms 56:3
            Verse("Salmos 62:1", "Psalms 62:1", "En Dios solamente está acallada mi alma; De él viene mi salvación.", "My soul rests in God alone. My salvation is from him."), // [31] Psalms 62:1
            Verse("Salmos 73:26", "Psalms 73:26", "Mi carne y mi corazón desfallecen; Mas la roca de mi corazón y mi porción es Dios para siempre.", "My flesh and my heart fails, but God is the strength of my heart and my portion forever."), // [32] Psalms 73:26
            Verse("Salmos 90:12", "Psalms 90:12", "Enséñanos de tal modo a contar nuestros días, Que traigamos al corazón sabiduría.", "So teach us to number our days, that we may gain a heart of wisdom."), // [33] Psalms 90:12
            Verse("Salmos 91:1", "Psalms 91:1", "El que habita al abrigo del Altísimo Morará bajo la sombra del Omnipotente.", "He who dwells in the secret place of the Most High will rest in the shadow of the Almighty."), // [34] Psalms 91:1
            Verse("Salmos 91:2", "Psalms 91:2", "Diré yo a Jehová: Esperanza mía, y castillo mío; Mi Dios, en quien confiaré.", "I will say of Yahweh, “He is my refuge and my fortress; my God, in whom I trust.”"), // [35] Psalms 91:2
            Verse("Salmos 94:19", "Psalms 94:19", "En la multitud de mis pensamientos dentro de mí, Tus consolaciones alegraban mi alma.", "In the multitude of my thoughts within me, your comforts delight my soul."), // [36] Psalms 94:19
            Verse("Salmos 100:4", "Psalms 100:4", "Entrad por sus puertas con acción de gracias, Por sus atrios con alabanza; Alabadle, bendecid su nombre.", "Enter into his gates with thanksgiving, into his courts with praise. Give thanks to him, and bless his name."), // [37] Psalms 100:4
            Verse("Salmos 103:1", "Psalms 103:1", "Bendice, alma mía, a Jehová, Y bendiga todo mi ser su santo nombre.", "Praise Yahweh, my soul! All that is within me, praise his holy name!"), // [38] Psalms 103:1
            Verse("Salmos 103:2", "Psalms 103:2", "Bendice, alma mía, a Jehová, Y no olvides ninguno de sus beneficios.", "Praise Yahweh, my soul, and don’t forget all his benefits;"), // [39] Psalms 103:2
            Verse("Salmos 118:24", "Psalms 118:24", "Este es el día que hizo Jehová; Nos gozaremos y alegraremos en él.", "This is the day that Yahweh has made. We will rejoice and be glad in it!"), // [40] Psalms 118:24
            Verse("Salmos 119:105", "Psalms 119:105", "Lámpara es a mis pies tu palabra, Y lumbrera a mi camino.", "Your word is a lamp to my feet, and a light for my path."), // [41] Psalms 119:105
            Verse("Salmos 121:1", "Psalms 121:1", "Alzaré mis ojos a los montes; ¿De dónde vendrá mi socorro?", "I will lift up my eyes to the hills. Where does my help come from?"), // [42] Psalms 121:1
            Verse("Salmos 121:2", "Psalms 121:2", "Mi socorro viene de Jehová, Que hizo los cielos y la tierra.", "My help comes from Yahweh, who made heaven and earth."), // [43] Psalms 121:2
            Verse("Salmos 139:14", "Psalms 139:14", "Te alabaré; porque formidables, maravillosas son tus obras; Estoy maravillado, Y mi alma lo sabe muy bien.", "I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful. My soul knows that very well."), // [44] Psalms 139:14
            Verse("Salmos 143:8", "Psalms 143:8", "Hazme oír por la mañana tu misericordia, Porque en ti he confiado; Hazme saber el camino por donde ande, Porque a ti he elevado mi alma.", "Cause me to hear your loving kindness in the morning, for I trust in you. Cause me to know the way in which I should walk, for I lift up my soul to you."), // [45] Psalms 143:8
            Verse("Salmos 145:18", "Psalms 145:18", "Cercano está Jehová a todos los que le invocan, A todos los que le invocan de veras.", "Yahweh is near to all those who call on him, to all who call on him in truth."), // [46] Psalms 145:18
            Verse("Salmos 147:3", "Psalms 147:3", "El sana a los quebrantados de corazón, Y venda sus heridas.", "He heals the broken in heart, and binds up their wounds."), // [47] Psalms 147:3
            Verse("Proverbios 3:5", "Proverbs 3:5", "Fíate de Jehová de todo tu corazón, Y no te apoyes en tu propia prudencia.", "Trust in Yahweh with all your heart, and don’t lean on your own understanding."), // [48] Proverbs 3:5
            Verse("Proverbios 3:6", "Proverbs 3:6", "Reconócelo en todos tus caminos, Y él enderezará tus veredas.", "In all your ways acknowledge him, and he will make your paths straight."), // [49] Proverbs 3:6
            Verse("Proverbios 4:23", "Proverbs 4:23", "Sobre toda cosa guardada, guarda tu corazón; Porque de él mana la vida.", "Keep your heart with all diligence, for out of it is the wellspring of life."), // [50] Proverbs 4:23
            Verse("Proverbios 15:1", "Proverbs 15:1", "La blanda respuesta quita la ira; Mas la palabra áspera hace subir el furor.", "A gentle answer turns away wrath, but a harsh word stirs up anger."), // [51] Proverbs 15:1
            Verse("Proverbios 16:3", "Proverbs 16:3", "Encomienda a Jehová tus obras, Y tus pensamientos serán afirmados.", "Commit your deeds to Yahweh, and your plans shall succeed."), // [52] Proverbs 16:3
            Verse("Proverbios 17:17", "Proverbs 17:17", "En todo tiempo ama el amigo, Y es como un hermano en tiempo de angustia.", "A friend loves at all times; and a brother is born for adversity."), // [53] Proverbs 17:17
            Verse("Proverbios 18:10", "Proverbs 18:10", "Torre fuerte es el nombre de Jehová; A él correrá el justo, y será levantado.", "Yahweh’s name is a strong tower: the righteous run to him, and are safe."), // [54] Proverbs 18:10
            Verse("Proverbios 22:6", "Proverbs 22:6", "Instruye al niño en su camino, Y aun cuando fuere viejo no se apartará de él.", "Train up a child in the way he should go, and when he is old he will not depart from it."), // [55] Proverbs 22:6
            Verse("Proverbios 27:17", "Proverbs 27:17", "Hierro con hierro se aguza; Y así el hombre aguza el rostro de su amigo.", "Iron sharpens iron; so a man sharpens his friend’s countenance."), // [56] Proverbs 27:17
            Verse("Proverbios 31:25", "Proverbs 31:25", "Fuerza y honor son su vestidura; Y se ríe de lo por venir.", "Strength and dignity are her clothing. She laughs at the time to come."), // [57] Proverbs 31:25
            Verse("Eclesiastés 3:1", "Ecclesiastes 3:1", "Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora.", "For everything there is a season, and a time for every purpose under heaven:"), // [58] Ecclesiastes 3:1
            Verse("Isaías 12:2", "Isaiah 12:2", "He aquí Dios es salvación mía; me aseguraré y no temeré; porque mi fortaleza y mi canción es JAH Jehová, quien ha sido salvación para mí.", "Behold, God is my salvation. I will trust, and will not be afraid; for Yah, Yahweh, is my strength and song; and he has become my salvation.”"), // [59] Isaiah 12:2
            Verse("Isaías 26:3", "Isaiah 26:3", "Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado.", "You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you."), // [60] Isaiah 26:3
            Verse("Isaías 40:31", "Isaiah 40:31", "pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.", "But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint."), // [61] Isaiah 40:31
            Verse("Isaías 41:10", "Isaiah 41:10", "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.", "Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness."), // [62] Isaiah 41:10
            Verse("Isaías 43:2", "Isaiah 43:2", "Cuando pases por las aguas, yo estaré contigo; y si por los ríos, no te anegarán. Cuando pases por el fuego, no te quemarás, ni la llama arderá en ti.", "When you pass through the waters, I will be with you; and through the rivers, they will not overflow you. When you walk through the fire, you will not be burned, and flame will not scorch you."), // [63] Isaiah 43:2
            Verse("Isaías 53:5", "Isaiah 53:5", "Mas él herido fue por nuestras rebeliones, molido por nuestros pecados; el castigo de nuestra paz fue sobre él, y por su llaga fuimos nosotros curados.", "But he was pierced for our transgressions. He was crushed for our iniquities. The punishment that brought our peace was on him; and by his wounds we are healed."), // [64] Isaiah 53:5
            Verse("Isaías 55:8", "Isaiah 55:8", "Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dijo Jehová.", "“For my thoughts are not your thoughts, neither are your ways my ways,” says Yahweh."), // [65] Isaiah 55:8
            Verse("Isaías 64:8", "Isaiah 64:8", "Ahora pues, Jehová, tú eres nuestro padre; nosotros barro, y tú el que nos formaste; así que obra de tus manos somos todos nosotros.", "But now, Yahweh, you are our Father; we are the clay, and you our potter; and we all are the work of your hand."), // [66] Isaiah 64:8
            Verse("Jeremías 29:11", "Jeremiah 29:11", "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.", "For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future."), // [67] Jeremiah 29:11
            Verse("Jeremías 33:3", "Jeremiah 33:3", "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces.", "Call to me, and I will answer you, and will show you great things, and difficult, which you don’t know."), // [68] Jeremiah 33:3
            Verse("Lamentaciones 3:22", "Lamentations 3:22", "Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias.", "It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail."), // [69] Lamentations 3:22
            Verse("Lamentaciones 3:23", "Lamentations 3:23", "Nuevas son cada mañana; grande es tu fidelidad.", "They are new every morning; great is your faithfulness."), // [70] Lamentations 3:23
            Verse("Miqueas 6:8", "Micah 6:8", "Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.", "He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?"), // [71] Micah 6:8
            Verse("Nahúm 1:7", "Nahum 1:7", "Jehová es bueno, fortaleza en el día de la angustia; y conoce a los que en él confían.", "Yahweh is good, a stronghold in the day of trouble; and he knows those who take refuge in him."), // [72] Nahum 1:7
            Verse("Habacuc 3:19", "Habakkuk 3:19", "Jehová el Señor es mi fortaleza, El cual hace mis pies como de ciervas, Y en mis alturas me hace andar. Al jefe de los cantores, sobre mis instrumentos de cuerdas.", "Yahweh, the Lord, is my strength. He makes my feet like deer’s feet, and enables me to go in high places. For the music director, on my stringed instruments."), // [73] Habakkuk 3:19
            Verse("Sofonías 3:17", "Zephaniah 3:17", "Jehová está en medio de ti, poderoso, él salvará; se gozará sobre ti con alegría, callará de amor, se regocijará sobre ti con cánticos.", "Yahweh, your God, is in your midst, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing."), // [74] Zephaniah 3:17
            Verse("Mateo 5:14", "Matthew 5:14", "Vosotros sois la luz del mundo; una ciudad asentada sobre un monte no se puede esconder.", "You are the light of the world. A city located on a hill can’t be hidden."), // [75] Matthew 5:14
            Verse("Mateo 5:16", "Matthew 5:16", "Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras, y glorifiquen a vuestro Padre que está en los cielos.", "Even so, let your light shine before men; that they may see your good works, and glorify your Father who is in heaven."), // [76] Matthew 5:16
            Verse("Mateo 6:21", "Matthew 6:21", "Porque donde esté vuestro tesoro, allí estará también vuestro corazón.", "for where your treasure is, there your heart will be also."), // [77] Matthew 6:21
            Verse("Mateo 6:33", "Matthew 6:33", "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.", "But seek first God’s Kingdom, and his righteousness; and all these things will be given to you as well."), // [78] Matthew 6:33
            Verse("Mateo 6:34", "Matthew 6:34", "Así que, no os afanéis por el día de mañana, porque el día de mañana traerá su afán. Basta a cada día su propio mal.", "Therefore don’t be anxious for tomorrow, for tomorrow will be anxious for itself. Each day’s own evil is sufficient."), // [79] Matthew 6:34
            Verse("Mateo 7:7", "Matthew 7:7", "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.", "“Ask, and it will be given you. Seek, and you will find. Knock, and it will be opened for you."), // [80] Matthew 7:7
            Verse("Mateo 11:28", "Matthew 11:28", "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.", "“Come to me, all you who labor and are heavily burdened, and I will give you rest."), // [81] Matthew 11:28
            Verse("Mateo 19:26", "Matthew 19:26", "Y mirándolos Jesús, les dijo: Para los hombres esto es imposible; mas para Dios todo es posible.", "Looking at them, Jesus said, “With men this is impossible, but with God all things are possible.”"), // [82] Matthew 19:26
            Verse("Mateo 22:37", "Matthew 22:37", "Jesús le dijo: Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente.", "Jesus said to him, “‘You shall love the Lord your God with all your heart, with all your soul, and with all your mind.’"), // [83] Matthew 22:37
            Verse("Mateo 28:19", "Matthew 28:19", "Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo;", "Go, and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,"), // [84] Matthew 28:19
            Verse("Mateo 28:20", "Matthew 28:20", "enseñándoles que guarden todas las cosas que os he mandado; y he aquí yo estoy con vosotros todos los días, hasta el fin del mundo. Amén.", "teaching them to observe all things that I commanded you. Behold, I am with you always, even to the end of the age.” Amen."), // [85] Matthew 28:20
            Verse("Marcos 10:27", "Mark 10:27", "Entonces Jesús, mirándolos, dijo: Para los hombres es imposible, mas para Dios, no; porque todas las cosas son posibles para Dios.", "Jesus, looking at them, said, “With men it is impossible, but not with God, for all things are possible with God.”"), // [86] Mark 10:27
            Verse("Marcos 11:24", "Mark 11:24", "Por tanto, os digo que todo lo que pidiereis orando, creed que lo recibiréis, y os vendrá.", "Therefore I tell you, all things whatever you pray and ask for, believe that you have received them, and you shall have them."), // [87] Mark 11:24
            Verse("Marcos 12:30", "Mark 12:30", "Y amarás al Señor tu Dios con todo tu corazón, y con toda tu alma, y con toda tu mente y con todas tus fuerzas. Este es el principal mandamiento.", "you shall love the Lord your God with all your heart, and with all your soul, and with all your mind, and with all your strength.’This is the first commandment."), // [88] Mark 12:30
            Verse("Lucas 1:37", "Luke 1:37", "porque nada hay imposible para Dios.", "For everything spoken by God is possible.”"), // [89] Luke 1:37
            Verse("Lucas 6:31", "Luke 6:31", "Y como queréis que hagan los hombres con vosotros, así también haced vosotros con ellos.", "“As you would like people to do to you, do exactly so to them."), // [90] Luke 6:31
            Verse("Juan 1:1", "John 1:1", "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.", "In the beginning was the Word, and the Word was with God, and the Word was God."), // [91] John 1:1
            Verse("Juan 3:16", "John 3:16", "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", "For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life."), // [92] John 3:16
            Verse("Juan 8:12", "John 8:12", "Otra vez Jesús les habló, diciendo: Yo soy la luz del mundo; el que me sigue, no andará en tinieblas, sino que tendrá la luz de la vida.", "Again, therefore, Jesus spoke to them, saying, “I am the light of the world. He who follows me will not walk in the darkness, but will have the light of life.”"), // [93] John 8:12
            Verse("Juan 10:10", "John 10:10", "El ladrón no viene sino para hurtar y matar y destruir; yo he venido para que tengan vida, y para que la tengan en abundancia.", "The thief only comes to steal, kill, and destroy. I came that they may have life, and may have it abundantly."), // [94] John 10:10
            Verse("Juan 13:34", "John 13:34", "Un mandamiento nuevo os doy: Que os améis unos a otros; como yo os he amado, que también os améis unos a otros.", "A new commandment I give to you, that you love one another, just like I have loved you; that you also love one another."), // [95] John 13:34
            Verse("Juan 14:1", "John 14:1", "No se turbe vuestro corazón; creéis en Dios, creed también en mí.", "“Don’t let your heart be troubled. Believe in God. Believe also in me."), // [96] John 14:1
            Verse("Juan 14:6", "John 14:6", "Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.", "Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father, except through me."), // [97] John 14:6
            Verse("Juan 14:27", "John 14:27", "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.", "Peace I leave with you. My peace I give to you; not as the world gives, give I to you. Don’t let your heart be troubled, neither let it be fearful."), // [98] John 14:27
            Verse("Juan 15:5", "John 15:5", "Yo soy la vid, vosotros los pámpanos; el que permanece en mí, y yo en él, éste lleva mucho fruto; porque separados de mí nada podéis hacer.", "I am the vine. You are the branches. He who remains in me, and I in him, the same bears much fruit, for apart from me you can do nothing."), // [99] John 15:5
            Verse("Juan 16:33", "John 16:33", "Estas cosas os he hablado para que en mí tengáis paz. En el mundo tendréis aflicción; pero confiad, yo he vencido al mundo.", "I have told you these things, that in me you may have peace. In the world you have oppression; but cheer up! I have overcome the world.”"), // [100] John 16:33
            Verse("Hechos 1:8", "Acts 1:8", "pero recibiréis poder, cuando haya venido sobre vosotros el Espíritu Santo, y me seréis testigos en Jerusalén, en toda Judea, en Samaria, y hasta lo último de la tierra.", "But you will receive power when the Holy Spirit has come upon you. You will be witnesses to me in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.”"), // [101] Acts 1:8
            Verse("Romanos 5:1", "Romans 5:1", "Justificados, pues, por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo;", "Being therefore justified by faith, we have peace with God through our Lord Jesus Christ;"), // [102] Romans 5:1
            Verse("Romanos 5:8", "Romans 5:8", "Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.", "But God commends his own love toward us, in that while we were yet sinners, Christ died for us."), // [103] Romans 5:8
            Verse("Romanos 6:23", "Romans 6:23", "Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro.", "For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord."), // [104] Romans 6:23
            Verse("Romanos 8:1", "Romans 8:1", "Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, sino conforme al Espíritu.", "There is therefore now no condemnation to those who are in Christ Jesus, who don’t walk according to the flesh, but according to the Spirit."), // [105] Romans 8:1
            Verse("Romanos 8:28", "Romans 8:28", "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.", "We know that all things work together for good for those who love God, to those who are called according to his purpose."), // [106] Romans 8:28
            Verse("Romanos 8:31", "Romans 8:31", "¿Qué, pues, diremos a esto? Si Dios es por nosotros, ¿quién contra nosotros?", "What then shall we say about these things? If God is for us, who can be against us?"), // [107] Romans 8:31
            Verse("Romanos 8:38", "Romans 8:38", "Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir,", "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers,"), // [108] Romans 8:38
            Verse("Romanos 10:9", "Romans 10:9", "que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo.", "that if you will confess with your mouth that Jesus is Lord, and believe in your heart that God raised him from the dead, you will be saved."), // [109] Romans 10:9
            Verse("Romanos 12:2", "Romans 12:2", "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.", "Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God."), // [110] Romans 12:2
            Verse("Romanos 12:12", "Romans 12:12", "gozosos en la esperanza; sufridos en la tribulación; constantes en la oración;", "rejoicing in hope; enduring in troubles; continuing steadfastly in prayer;"), // [111] Romans 12:12
            Verse("Romanos 15:13", "Romans 15:13", "Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo.", "Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope, in the power of the Holy Spirit."), // [112] Romans 15:13
            Verse("1 Corintios 10:13", "1 Corinthians 10:13", "No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios, que no os dejará ser tentados más de lo que podéis resistir, sino que dará también juntamente con la tentación la salida, para que podáis soportar.", "No temptation has taken you except what is common to man. God is faithful, who will not allow you to be tempted above what you are able, but will with the temptation also make the way of escape, that you may be able to endure it."), // [113] 1 Corinthians 10:13
            Verse("1 Corintios 13:4", "1 Corinthians 13:4", "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece;", "Love is patient and is kind; love doesn’t envy. Love doesn’t brag, is not proud,"), // [114] 1 Corinthians 13:4
            Verse("1 Corintios 13:13", "1 Corinthians 13:13", "Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.", "But now faith, hope, and love remain—these three. The greatest of these is love."), // [115] 1 Corinthians 13:13
            Verse("1 Corintios 15:58", "1 Corinthians 15:58", "Así que, hermanos míos amados, estad firmes y constantes, creciendo en la obra del Señor siempre, sabiendo que vuestro trabajo en el Señor no es en vano.", "Therefore, my beloved brothers, be steadfast, immovable, always abounding in the Lord’s work, because you know that your labor is not in vain in the Lord."), // [116] 1 Corinthians 15:58
            Verse("1 Corintios 16:14", "1 Corinthians 16:14", "Todas vuestras cosas sean hechas con amor.", "Let all that you do be done in love."), // [117] 1 Corinthians 16:14
            Verse("2 Corintios 4:16", "2 Corinthians 4:16", "Por tanto, no desmayamos; antes aunque este nuestro hombre exterior se va desgastando, el interior no obstante se renueva de día en día.", "Therefore we don’t faint, but though our outward man is decaying, yet our inward man is renewed day by day."), // [118] 2 Corinthians 4:16
            Verse("2 Corintios 5:7", "2 Corinthians 5:7", "(porque por fe andamos, no por vista);", "for we walk by faith, not by sight."), // [119] 2 Corinthians 5:7
            Verse("2 Corintios 5:17", "2 Corinthians 5:17", "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.", "Therefore if anyone is in Christ, he is a new creation. The old things have passed away. Behold, all things have become new."), // [120] 2 Corinthians 5:17
            Verse("2 Corintios 9:7", "2 Corinthians 9:7", "Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.", "Let each man give according as he has determined in his heart; not grudgingly, or under compulsion; for God loves a cheerful giver."), // [121] 2 Corinthians 9:7
            Verse("2 Corintios 12:9", "2 Corinthians 12:9", "Y me ha dicho: Bástate mi gracia; porque mi poder se perfecciona en la debilidad. Por tanto, de buena gana me gloriaré más bien en mis debilidades, para que repose sobre mí el poder de Cristo.", "He has said to me, “My grace is sufficient for you, for my power is made perfect in weakness.” Most gladly therefore I will rather glory in my weaknesses, that the power of Christ may rest on me."), // [122] 2 Corinthians 12:9
            Verse("Gálatas 2:20", "Galatians 2:20", "Con Cristo estoy juntamente crucificado, y ya no vivo yo, mas vive Cristo en mí; y lo que ahora vivo en la carne, lo vivo en la fe del Hijo de Dios, el cual me amó y se entregó a sí mismo por mí.", "I have been crucified with Christ, and it is no longer I that live, but Christ living in me. That life which I now live in the flesh, I live by faith in the Son of God, who loved me, and gave himself up for me."), // [123] Galatians 2:20
            Verse("Gálatas 5:22", "Galatians 5:22", "Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe,", "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith,"), // [124] Galatians 5:22
            Verse("Gálatas 6:9", "Galatians 6:9", "No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.", "Let us not be weary in doing good, for we will reap in due season, if we don’t give up."), // [125] Galatians 6:9
            Verse("Efesios 2:8", "Ephesians 2:8", "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios;", "for by grace you have been saved through faith, and that not of yourselves; it is the gift of God,"), // [126] Ephesians 2:8
            Verse("Efesios 3:20", "Ephesians 3:20", "Y a Aquel que es poderoso para hacer todas las cosas mucho más abundantemente de lo que pedimos o entendemos, según el poder que actúa en nosotros,", "Now to him who is able to do exceedingly abundantly above all that we ask or think, according to the power that works in us,"), // [127] Ephesians 3:20
            Verse("Efesios 4:32", "Ephesians 4:32", "Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.", "And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you."), // [128] Ephesians 4:32
            Verse("Efesios 6:10", "Ephesians 6:10", "Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza.", "Finally, be strong in the Lord, and in the strength of his might."), // [129] Ephesians 6:10
            Verse("Filipenses 1:6", "Philippians 1:6", "estando persuadido de esto, que el que comenzó en vosotros la buena obra, la perfeccionará hasta el día de Jesucristo;", "being confident of this very thing, that he who began a good work in you will complete it until the day of Jesus Christ."), // [130] Philippians 1:6
            Verse("Filipenses 4:6", "Philippians 4:6", "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.", "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God."), // [131] Philippians 4:6
            Verse("Filipenses 4:7", "Philippians 4:7", "Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.", "And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus."), // [132] Philippians 4:7
            Verse("Filipenses 4:8", "Philippians 4:8", "Por lo demás, hermanos, todo lo que es verdadero, todo lo honesto, todo lo justo, todo lo puro, todo lo amable, todo lo que es de buen nombre; si hay virtud alguna, si algo digno de alabanza, en esto pensad.", "Finally, brothers, whatever things are true, whatever things are honorable, whatever things are just, whatever things are pure, whatever things are lovely, whatever things are of good report; if there is any virtue, and if there is any praise, think about these things."), // [133] Philippians 4:8
            Verse("Filipenses 4:13", "Philippians 4:13", "Todo lo puedo en Cristo que me fortalece.", "I can do all things through Christ, who strengthens me."), // [134] Philippians 4:13
            Verse("Filipenses 4:19", "Philippians 4:19", "Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús.", "My God will supply every need of yours according to his riches in glory in Christ Jesus."), // [135] Philippians 4:19
            Verse("Colosenses 3:2", "Colossians 3:2", "Poned la mira en las cosas de arriba, no en las de la tierra.", "Set your mind on the things that are above, not on the things that are on the earth."), // [136] Colossians 3:2
            Verse("Colosenses 3:15", "Colossians 3:15", "Y la paz de Dios gobierne en vuestros corazones, a la que asimismo fuisteis llamados en un solo cuerpo; y sed agradecidos.", "And let the peace of God rule in your hearts, to which also you were called in one body; and be thankful."), // [137] Colossians 3:15
            Verse("Colosenses 3:23", "Colossians 3:23", "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres;", "And whatever you do, work heartily, as for the Lord, and not for men,"), // [138] Colossians 3:23
            Verse("1 Tesalonicenses 5:16", "1 Thessalonians 5:16", "Estad siempre gozosos.", "Rejoice always."), // [139] 1 Thessalonians 5:16
            Verse("1 Tesalonicenses 5:17", "1 Thessalonians 5:17", "Orad sin cesar.", "Pray without ceasing."), // [140] 1 Thessalonians 5:17
            Verse("1 Tesalonicenses 5:18", "1 Thessalonians 5:18", "Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.", "In everything give thanks, for this is the will of God in Christ Jesus toward you."), // [141] 1 Thessalonians 5:18
            Verse("1 Timoteo 4:12", "1 Timothy 4:12", "Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.", "Let no man despise your youth; but be an example to those who believe, in word, in your way of life, in love, in spirit, in faith, and in purity."), // [142] 1 Timothy 4:12
            Verse("2 Timoteo 1:7", "2 Timothy 1:7", "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.", "For God didn’t give us a spirit of fear, but of power, love, and self-control."), // [143] 2 Timothy 1:7
            Verse("2 Timoteo 3:16", "2 Timothy 3:16", "Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia,", "Every Scripture is God-breathed and profitable for teaching, for reproof, for correction, and for instruction in righteousness,"), // [144] 2 Timothy 3:16
            Verse("Hebreos 4:12", "Hebrews 4:12", "Porque la palabra de Dios es viva y eficaz, y más cortante que toda espada de dos filos; y penetra hasta partir el alma y el espíritu, las coyunturas y los tuétanos, y discierne los pensamientos y las intenciones del corazón.", "For the word of God is living, and active, and sharper than any two-edged sword, and piercing even to the dividing of soul and spirit, of both joints and marrow, and is able to discern the thoughts and intentions of the heart."), // [145] Hebrews 4:12
            Verse("Hebreos 10:23", "Hebrews 10:23", "Mantengamos firme, sin fluctuar, la profesión de nuestra esperanza, porque fiel es el que prometió.", "let us hold fast the confession of our hope without wavering; for he who promised is faithful."), // [146] Hebrews 10:23
            Verse("Hebreos 11:1", "Hebrews 11:1", "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.", "Now faith is assurance of things hoped for, proof of things not seen."), // [147] Hebrews 11:1
            Verse("Hebreos 11:6", "Hebrews 11:6", "Pero sin fe es imposible agradar a Dios; porque es necesario que el que se acerca a Dios crea que le hay, y que es galardonador de los que le buscan.", "Without faith it is impossible to be well pleasing to him, for he who comes to God must believe that he exists, and that he is a rewarder of those who seek him."), // [148] Hebrews 11:6
            Verse("Hebreos 12:1", "Hebrews 12:1", "Por tanto, nosotros también, teniendo en derredor nuestro tan grande nube de testigos, despojémonos de todo peso y del pecado que nos asedia, y corramos con paciencia la carrera que tenemos por delante,", "Therefore let us also, seeing we are surrounded by so great a cloud of witnesses, lay aside every weight and the sin which so easily entangles us, and let us run with patience the race that is set before us,"), // [149] Hebrews 12:1
            Verse("Hebreos 12:2", "Hebrews 12:2", "puestos los ojos en Jesús, el autor y consumador de la fe, el cual por el gozo puesto delante de él sufrió la cruz, menospreciando el oprobio, y se sentó a la diestra del trono de Dios.", "looking to Jesus, the author and perfecter of faith, who for the joy that was set before him endured the cross, despising its shame, and has sat down at the right hand of the throne of God."), // [150] Hebrews 12:2
            Verse("Hebreos 13:5", "Hebrews 13:5", "Sean vuestras costumbres sin avaricia, contentos con lo que tenéis ahora; porque él dijo: No te desampararé, ni te dejaré;", "Be free from the love of money, content with such things as you have, for he has said, “I will in no way leave you, neither will I in any way forsake you.”"), // [151] Hebrews 13:5
            Verse("Hebreos 13:8", "Hebrews 13:8", "Jesucristo es el mismo ayer, y hoy, y por los siglos.", "Jesus Christ is the same yesterday, today, and forever."), // [152] Hebrews 13:8
            Verse("Santiago 1:2", "James 1:2", "Hermanos míos, tened por sumo gozo cuando os halléis en diversas pruebas,", "Count it all joy, my brothers, when you fall into various temptations,"), // [153] James 1:2
            Verse("Santiago 1:5", "James 1:5", "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.", "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him."), // [154] James 1:5
            Verse("Santiago 1:12", "James 1:12", "Bienaventurado el varón que soporta la tentación; porque cuando haya resistido la prueba, recibirá la corona de vida, que Dios ha prometido a los que le aman.", "Blessed is the man who endures temptation, for when he has been approved, he will receive the crown of life, which the Lord promised to those who love him."), // [155] James 1:12
            Verse("Santiago 1:17", "James 1:17", "Toda buena dádiva y todo don perfecto desciende de lo alto, del Padre de las luces, en el cual no hay mudanza, ni sombra de variación.", "Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom can be no variation, nor turning shadow."), // [156] James 1:17
            Verse("Santiago 4:7", "James 4:7", "Someteos, pues, a Dios; resistid al diablo, y huirá de vosotros.", "Be subject therefore to God. But resist the devil, and he will flee from you."), // [157] James 4:7
            Verse("Santiago 4:8", "James 4:8", "Acercaos a Dios, y él se acercará a vosotros. Pecadores, limpiad las manos; y vosotros los de doble ánimo, purificad vuestros corazones.", "Draw near to God, and he will draw near to you. Cleanse your hands, you sinners; and purify your hearts, you double-minded."), // [158] James 4:8
            Verse("1 Pedro 1:3", "1 Peter 1:3", "Bendito el Dios y Padre de nuestro Señor Jesucristo, que según su grande misericordia nos hizo renacer para una esperanza viva, por la resurrección de Jesucristo de los muertos,", "Blessed be the God and Father of our Lord Jesus Christ, who according to his great mercy became our father again to a living hope through the resurrection of Jesus Christ from the dead,"), // [159] 1 Peter 1:3
            Verse("1 Pedro 3:15", "1 Peter 3:15", "sino santificad a Dios el Señor en vuestros corazones, y estad siempre preparados para presentar defensa con mansedumbre y reverencia ante todo el que os demande razón de la esperanza que hay en vosotros;", "But sanctify the Lord God in your hearts; and always be ready to give an answer to everyone who asks you a reason concerning the hope that is in you, with humility and fear:"), // [160] 1 Peter 3:15
            Verse("1 Pedro 4:8", "1 Peter 4:8", "Y ante todo, tened entre vosotros ferviente amor; porque el amor cubrirá multitud de pecados.", "And above all things be earnest in your love among yourselves, for love covers a multitude of sins."), // [161] 1 Peter 4:8
            Verse("1 Pedro 5:6", "1 Peter 5:6", "Humillaos, pues, bajo la poderosa mano de Dios, para que él os exalte cuando fuere tiempo;", "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time;"), // [162] 1 Peter 5:6
            Verse("1 Pedro 5:7", "1 Peter 5:7", "echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.", "casting all your worries on him, because he cares for you."), // [163] 1 Peter 5:7
            Verse("2 Pedro 3:9", "2 Peter 3:9", "El Señor no retarda su promesa, según algunos la tienen por tardanza, sino que es paciente para con nosotros, no queriendo que ninguno perezca, sino que todos procedan al arrepentimiento.", "The Lord is not slow concerning his promise, as some count slowness; but is patient with us, not wishing that any should perish, but that all should come to repentance."), // [164] 2 Peter 3:9
            Verse("1 Juan 1:9", "1 John 1:9", "Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad.", "If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness."), // [165] 1 John 1:9
            Verse("1 Juan 3:1", "1 John 3:1", "Mirad cuál amor nos ha dado el Padre, para que seamos llamados hijos de Dios; por esto el mundo no nos conoce, porque no le conoció a él.", "See how great a love the Father has bestowed on us, that we should be called children of God! For this cause the world doesn’t know us, because it didn’t know him."), // [166] 1 John 3:1
            Verse("1 Juan 4:7", "1 John 4:7", "Amados, amémonos unos a otros; porque el amor es de Dios. Todo aquel que ama, es nacido de Dios, y conoce a Dios.", "Beloved, let us love one another, for love is of God; and everyone who loves has been born of God, and knows God."), // [167] 1 John 4:7
            Verse("1 Juan 4:8", "1 John 4:8", "El que no ama, no ha conocido a Dios; porque Dios es amor.", "He who doesn’t love doesn’t know God, for God is love."), // [168] 1 John 4:8
            Verse("1 Juan 4:18", "1 John 4:18", "En el amor no hay temor, sino que el perfecto amor echa fuera el temor; porque el temor lleva en sí castigo. De donde el que teme, no ha sido perfeccionado en el amor.", "There is no fear in love; but perfect love casts out fear, because fear has punishment. He who fears is not made perfect in love."), // [169] 1 John 4:18
            Verse("1 Juan 4:19", "1 John 4:19", "Nosotros le amamos a él, porque él nos amó primero.", "We love him, because he first loved us."), // [170] 1 John 4:19
            Verse("1 Juan 5:14", "1 John 5:14", "Y esta es la confianza que tenemos en él, que si pedimos alguna cosa conforme a su voluntad, él nos oye.", "This is the boldness which we have toward him, that, if we ask anything according to his will, he listens to us."), // [171] 1 John 5:14
            Verse("Judas 1:24", "Jude 1:24", "Y a aquel que es poderoso para guardaros sin caída, y presentaros sin mancha delante de su gloria con gran alegría,", "Now to him who is able to keep them from stumbling, and to present you faultless before the presence of his glory in great joy,"), // [172] Jude 1:24
            Verse("Apocalipsis 3:20", "Revelation 3:20", "He aquí, yo estoy a la puerta y llamo; si alguno oye mi voz y abre la puerta, entraré a él, y cenaré con él, y él conmigo.", "Behold, I stand at the door and knock. If anyone hears my voice and opens the door, then I will come in to him, and will dine with him, and he with me."), // [173] Revelation 3:20
            Verse("Apocalipsis 21:4", "Revelation 21:4", "Enjugará Dios toda lágrima de los ojos de ellos; y ya no habrá muerte, ni habrá más llanto, ni clamor, ni dolor; porque las primeras cosas pasaron.", "He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.”"), // [174] Revelation 21:4
            Verse("Apocalipsis 21:5", "Revelation 21:5", "Y el que estaba sentado en el trono dijo: He aquí, yo hago nuevas todas las cosas. Y me dijo: Escribe; porque estas palabras son fieles y verdaderas.", "He who sits on the throne said, “Behold, I am making all things new.” He said, “Write, for these words of God are faithful and true.”"), // [175] Revelation 21:5
            Verse("Isaías 9:6", "Isaiah 9:6", "Porque un niño nos es nacido, hijo nos es dado, y el principado sobre su hombro; y se llamará su nombre Admirable, Consejero, Dios Fuerte, Padre Eterno, Príncipe de Paz.", "For to us a child is born. To us a son is given; and the government will be on his shoulders. His name will be called Wonderful, Counselor, Mighty God, Everlasting Father, Prince of Peace."), // [176] Isaiah 9:6
            Verse("Mateo 28:6", "Matthew 28:6", "No está aquí, pues ha resucitado, como dijo. Venid, ved el lugar donde fue puesto el Señor.", "He is not here, for he has risen, just like he said. Come, see the place where the Lord was lying."), // [177] Matthew 28:6
            Verse("Lucas 19:10", "Luke 19:10", "Porque el Hijo del Hombre vino a buscar y a salvar lo que se había perdido.", "For the Son of Man came to seek and to save that which was lost.”"), // [178] Luke 19:10
            Verse("Juan 1:14", "John 1:14", "Y aquel Verbo fue hecho carne, y habitó entre nosotros (y vimos su gloria, gloria como del unigénito del Padre), lleno de gracia y de verdad.", "The Word became flesh, and lived among us. We saw his glory, such glory as of the one and only Son of the Father, full of grace and truth."), // [179] John 1:14
            Verse("Juan 6:35", "John 6:35", "Jesús les dijo: Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre; y el que en mí cree, no tendrá sed jamás.", "Jesus said to them, “I am the bread of life. He who comes to me will not be hungry, and he who believes in me will never be thirsty."), // [180] John 6:35
            Verse("Juan 10:11", "John 10:11", "Yo soy el buen pastor; el buen pastor su vida da por las ovejas.", "I am the good shepherd. The good shepherd lays down his life for the sheep."), // [181] John 10:11
            Verse("Juan 11:25", "John 11:25", "Le dijo Jesús: Yo soy la resurrección y la vida; el que cree en mí, aunque esté muerto, vivirá.", "Jesus said to her, “I am the resurrection and the life. He who believes in me will still live, even if he dies."), // [182] John 11:25
            Verse("Hechos 4:12", "Acts 4:12", "Y en ningún otro hay salvación; porque no hay otro nombre bajo el cielo, dado a los hombres, en que podamos ser salvos.", "There is salvation in none other, for neither is there any other name under heaven, that is given among men, by which we must be saved!”"), // [183] Acts 4:12
            Verse("Hechos 16:31", "Acts 16:31", "Ellos dijeron: Cree en el Señor Jesucristo, y serás salvo, tú y tu casa.", "They said, “Believe in the Lord Jesus Christ, and you will be saved, you and your household.”"), // [184] Acts 16:31
            Verse("Romanos 8:32", "Romans 8:32", "El que no escatimó ni a su propio Hijo, sino que lo entregó por todos nosotros, ¿cómo no nos dará también con él todas las cosas?", "He who didn’t spare his own Son, but delivered him up for us all, how would he not also with him freely give us all things?"), // [185] Romans 8:32
            Verse("2 Corintios 5:21", "2 Corinthians 5:21", "Al que no conoció pecado, por nosotros lo hizo pecado, para que nosotros fuésemos hechos justicia de Dios en él.", "For him who knew no sin he made to be sin on our behalf; so that in him we might become the righteousness of God."), // [186] 2 Corinthians 5:21
            Verse("Gálatas 6:14", "Galatians 6:14", "Pero lejos esté de mí gloriarme, sino en la cruz de nuestro Señor Jesucristo, por quien el mundo me es crucificado a mí, y yo al mundo.", "But far be it from me to boast, except in the cross of our Lord Jesus Christ, through which the world has been crucified to me, and I to the world."), // [187] Galatians 6:14
            Verse("Efesios 1:7", "Ephesians 1:7", "en quien tenemos redención por su sangre, el perdón de pecados según las riquezas de su gracia,", "in whom we have our redemption through his blood, the forgiveness of our trespasses, according to the riches of his grace,"), // [188] Ephesians 1:7
            Verse("Filipenses 2:9", "Philippians 2:9", "Por lo cual Dios también le exaltó hasta lo sumo, y le dio un nombre que es sobre todo nombre,", "Therefore God also highly exalted him, and gave to him the name which is above every name;"), // [189] Philippians 2:9
            Verse("Colosenses 1:16", "Colossians 1:16", "Porque en él fueron creadas todas las cosas, las que hay en los cielos y las que hay en la tierra, visibles e invisibles; sean tronos, sean dominios, sean principados, sean potestades; todo fue creado por medio de él y para él.", "For by him all things were created, in the heavens and on the earth, things visible and things invisible, whether thrones or dominions or principalities or powers; all things have been created through him, and for him."), // [190] Colossians 1:16
            Verse("1 Timoteo 1:15", "1 Timothy 1:15", "Palabra fiel y digna de ser recibida por todos: que Cristo Jesús vino al mundo para salvar a los pecadores, de los cuales yo soy el primero.", "The saying is faithful and worthy of all acceptance, that Christ Jesus came into the world to save sinners; of whom I am chief."), // [191] 1 Timothy 1:15
            Verse("Tito 2:11", "Titus 2:11", "Porque la gracia de Dios se ha manifestado para salvación a todos los hombres,", "For the grace of God has appeared, bringing salvation to all men,"), // [192] Titus 2:11
            Verse("Hebreos 7:25", "Hebrews 7:25", "por lo cual puede también salvar perpetuamente a los que por él se acercan a Dios, viviendo siempre para interceder por ellos.", "Therefore he is also able to save to the uttermost those who draw near to God through him, seeing that he lives forever to make intercession for them."), // [193] Hebrews 7:25
            Verse("1 Pedro 2:24", "1 Peter 2:24", "quien llevó él mismo nuestros pecados en su cuerpo sobre el madero, para que nosotros, estando muertos a los pecados, vivamos a la justicia; y por cuya herida fuisteis sanados.", "who his own self bore our sins in his body on the tree, that we, having died to sins, might live to righteousness; by whose stripes you were healed."), // [194] 1 Peter 2:24
            Verse("2 Pedro 3:18", "2 Peter 3:18", "Antes bien, creced en la gracia y el conocimiento de nuestro Señor y Salvador Jesucristo. A él sea gloria ahora y hasta el día de la eternidad. Amén.", "But grow in the grace and knowledge of our Lord and Savior Jesus Christ. To him be the glory both now and forever. Amen."), // [195] 2 Peter 3:18
            Verse("1 Juan 4:10", "1 John 4:10", "En esto consiste el amor: no en que nosotros hayamos amado a Dios, sino en que él nos amó a nosotros, y envió a su Hijo en propiciación por nuestros pecados.", "In this is love, not that we loved God, but that he loved us, and sent his Son as the atoning sacrifice for our sins."), // [196] 1 John 4:10
            Verse("Apocalipsis 1:8", "Revelation 1:8", "Yo soy el Alfa y la Omega, principio y fin, dice el Señor, el que es y que era y que ha de venir, el Todopoderoso.", "“I am the Alpha and the Omega,” says the Lord God, “who is and who was and who is to come, the Almighty.”"), // [197] Revelation 1:8
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
            views.setTextViewText(R.id.widget_verse_text, "“${text}”")
            views.setTextViewText(R.id.widget_verse_reference, reference)

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
