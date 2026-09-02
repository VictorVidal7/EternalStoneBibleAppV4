# A3 — Glosa española por lema hebreo · Paquete de revisión

_Generado por `scripts/build-hebrew-lemma-gloss-es.js` · rama `feature/hebrew-lemma-gloss-es`._
_BORRADOR para la aprobación del propietario. Nada de esto está cableado en la app (eso es P2)._

## Resumen

|                                                 |                                                                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lemas hebreos usados (total)                    | **8503**                                                                                                                                                    |
| Entradas en `assets/hebrew-lemma-gloss-es.json` | **8503** (todas, planas, ordenadas)                                                                                                                         |
| Nombres propios                                 | 2642 (2253 con forma RVR1960 confirmada en un versículo de muestra)                                                                                         |
| Lemas marcados para revisión                    | **185** (8 partículas · 10 nombres divinos · 50 términos cargados · 68 auto frecuencia media · 48 translit. a mano · 1 discrepancia RVR · 0 sin traducción) |

Procedencia de la glosa (`fullSource`):

| fuente              | lemas |
| ------------------- | ----- |
| definition_es-head  | 4552  |
| defEs-name          | 2352  |
| tbesh-map           | 696   |
| tbesh-head-es       | 471   |
| defEs-gentilic      | 220   |
| hand-fix            | 75    |
| hand-weighted       | 50    |
| hand-translit       | 46    |
| hand-name           | 19    |
| hand-divine         | 10    |
| hand-particle       | 8     |
| auto-translit       | 2     |
| definition_es-loose | 2     |

- `hand-*` — mapa curado a mano en el script (partículas, nombres divinos, términos cargados, correcciones de alta frecuencia).
- `defEs-*` — nombre / glosa condensada de `scripts/strongs-defs-es.json` (español ya cotejado).
- `tbesh-map` / `tbesh-head-es` — glosa TBESH (col. `Gloss` únicamente; col. `Meaning`/BDB nunca se lee) traducida al español.
- `definition_es-loose` — condensación permisiva del `definition_es` (red de seguridad para la cola).
- `UNTRANSLATED` — sin traducción automática fiable; ver la lista al final.

---

## 1. Partículas, nombres divinos y términos cargados (lectura atenta)

### Partícula gramatical (8)

| Strong | translit | ocurr. | glosa propuesta                      | TBESH (EN) | definition_es (extracto)                                     | nota                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | -------- | -----: | ------------------------------------ | ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H853   | et       |  10928 | **introduce el complemento directo** | [Obj.]     | al parecer contraído de H226 (אוֹת) en el sentido demostrat… | ʾet: RVR1960 no lo traduce (no tiene forma en español). Opciones: «(objeto directo)» · «marca de OD» · «—» (omitir del interlineal) · dejar el gloss_en actual. Es la palabra MÁS frecuente del AT (~10.9k), así que también es una decisión de UI: la glosa propuesta (32 car.) se muestra bajo UNA palabra hebrea y podría envolver / desbordar la lista de palabras — la media de las glosas es ~9 car. |
| H5921  | al       |   5754 | **sobre / encima / contra**          | upon       | encima, sobre, por encima de, o contra (aunque siempre en e… | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |
| H413   | el       |   5509 | **a / hacia**                        | to(wards)  | cerca, con o entre; a menudo, en general, a/hacia            | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |
| H834   | a.sher   |   5496 | **que / el cual**                    | which      | quien, el cual, lo que, que; también (como adverbio y conju… | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |
| H3605  | kol      |   5412 | **todo / cada / cualquiera**         | all        | o (Jeremías 33:8) כּוֹל; de H3634 (כָּלַל); propiamente, el… | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |
| H559   | a.mar    |   5306 | **decir**                            | to say     | decir (usado con gran amplitud)                              | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |
| H3588  | ki       |   4482 | **porque / que / cuando**            | for        | (por implicación) muy ampliamente usado como conjunción o a… | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |
| H1961  | ha.yah   |   3559 | **ser / estar / haber / suceder**    | to be      | existir, es decir, ser o llegar a ser, acontecer (siempre e… | partícula gramatical polisémica — sin equivalente 1:1                                                                                                                                                                                                                                                                                                                                                      |

### Nombre / título divino (10)

| Strong | translit  | ocurr. | glosa propuesta         | TBESH (EN) | definition_es (extracto)                                     | nota                                                                                                                                                                                                                                                           |
| ------ | --------- | -----: | ----------------------- | ---------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H3068  | ye.ho.vah |   6516 | **Jehová**              | LORD       | Jehová, el nombre nacional judío de Dios                     | YHWH → «Jehová» (decisión 2, NO «Yahvé»). Nota: el overlay por-ocurrencia existente `hebrew-gloss-es-v1.json` imprime «a Yahvé» en Sal 136:1 pos. 2 (previo a esta decisión) y gana en ese versículo por ser tier 2 — conviene alinearlo en una pasada futura. |
| H430   | e.lo.him  |   2600 | **Dios**                | God        | dioses en el sentido ordinario; pero usado específicamente…  | plural; RVR1960 usa «dioses» para dioses falsos y, raras veces, «jueces». ~2.6k ocurrencias.                                                                                                                                                                   |
| H136   | a.do.nai  |    440 | **Señor**               | Lord       | el Señor (usado como nombre propio de Dios únicamente)       | nombre / título divino — debe reflejar RVR1960                                                                                                                                                                                                                 |
| H3069  | ye.ho.vih |    306 | **Jehová**              | YHWH/God   | Jehová (el nombre divino; vocalizado como «Dios» cuando sig… | aparece casi siempre en la pareja «Señor Jehová» (H136 + H3069); por palabra, H3069 imprime «Jehová».                                                                                                                                                          |
| H410   | el        |    241 | **Dios**                | god        | fuerza; como adjetivo, poderoso; especialmente el Todopoder… | RVR1960 casi siempre «Dios»; unas pocas veces «poderoso».                                                                                                                                                                                                      |
| H426   | e.lah     |     95 | **Dios**                | god        | Dios (arameo)                                                | nombre / título divino — debe reflejar RVR1960                                                                                                                                                                                                                 |
| H433   | e.lo.ah   |     57 | **Dios**                | god        | una deidad o la Deidad; Dios                                 | nombre / título divino — debe reflejar RVR1960                                                                                                                                                                                                                 |
| H5945  | el.yon    |     53 | **Altísimo / superior** | Most High  | una elevación, es decir, (adj.) alto (comparativo); como tí… | ~mitad título divino «Altísimo», ~mitad adjetivo común «de arriba / superior» (puerta, estanque…).                                                                                                                                                             |
| H3050  | yah       |     48 | **JAH**                 | LORD       | Jah, el nombre sagrado                                       | RVR1960 imprime «JAH» (Sal 68:4) pero «Jehová» dentro de compuestos / Éx 15:2.                                                                                                                                                                                 |
| H7706  | shad.day  |     48 | **Todopoderoso**        | Almighty   | el Todopoderoso                                              | RVR1960 alterna «Todopoderoso» (Gn 17:1) y «Omnipotente» (Gn 28:3; 35:11).                                                                                                                                                                                     |

### Término teológicamente cargado (50)

| Strong | translit   | ocurr. | glosa propuesta                         | TBESH (EN)             | definition_es (extracto)                                     | nota                                                                                                                  |
| ------ | ---------- | -----: | --------------------------------------- | ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| H1697  | da.var     |   1439 | **palabra / asunto / cosa**             | word                   | una palabra; por implicación, un asunto (del que se habla)…  | término teológicamente cargado — lectura atenta                                                                       |
| H8085  | sha.ma     |   1159 | **oír / escuchar / obedecer**           | to hear: hear          | oír con entendimiento (a menudo con implicación de atención… | término teológicamente cargado — lectura atenta                                                                       |
| H3045  | ya.da      |    945 | **conocer / saber**                     | to know                | conocer (propiamente, averiguar viendo); usado en una gran…  | término teológicamente cargado — lectura atenta                                                                       |
| H5315  | ne.phesh   |    754 | **alma / vida / ser**                   | soul                   | de H5314 (נָפַשׁ); propiamente, una criatura que respira, e… | término teológicamente cargado — lectura atenta                                                                       |
| H7451  | ra         |    661 | **malo / mal / calamidad**              | bad: harmful           | malo o (como sustantivo) mal (natural o moral)               | término teológicamente cargado — lectura atenta                                                                       |
| H3820  | lev        |    595 | **corazón / mente**                     | heart                  | el corazón; también usado (figurativamente) muy ampliamente… | término teológicamente cargado — lectura atenta                                                                       |
| H120   | a.dam      |    550 | **hombre / ser humano**                 | man                    | rojizo, es decir, un ser humano (un individuo o la especie,… | término teológicamente cargado — lectura atenta                                                                       |
| H2896  | tov        |    538 | **bueno / bien**                        | good                   | bueno (como adjetivo) en el sentido más amplio; usado asimi… | término teológicamente cargado — lectura atenta                                                                       |
| H6635  | tsa.va     |    484 | **ejército / hueste**                   | army                   | una masa de personas (o figurativamente, de cosas), especia… | la palabra es «ejército»; el título «Jehová de los ejércitos» es H3068 + H6635.                                       |
| H6944  | qo.desh    |    469 | **santidad / lo santo**                 | holiness               | un lugar o cosa sagrada; raramente en abstracto, santidad    | término teológicamente cargado — lectura atenta                                                                       |
| H4941  | mish.pat   |    422 | **juicio / derecho / ordenanza**        | justice: judgement     | de H8199 (שָׁפַט); propiamente, un veredicto (favorable o d… | término teológicamente cargado — lectura atenta                                                                       |
| H7307  | ru.ach     |    378 | **espíritu / viento / aliento**         | spirit                 | viento; por semejanza, aliento, es decir, una exhalación pe… | término teológicamente cargado — lectura atenta                                                                       |
| H3372  | ya.re      |    315 | **temer / reverenciar**                 | to fear                | temer; moralmente, reverenciar; causativamente, atemorizar   | término teológicamente cargado — lectura atenta                                                                       |
| H2403  | chat.ta.ah |    295 | **pecado / ofrenda por el pecado**      | sin                    | una ofensa (a veces pecaminosidad habitual), y su pena, oca… | término teológicamente cargado — lectura atenta                                                                       |
| H5647  | a.vad      |    288 | **servir / trabajar / labrar**          | to serve               | trabajar (en cualquier sentido); por implicación, servir, l… | término teológicamente cargado — lectura atenta                                                                       |
| H1285  | be.rit     |    284 | **pacto**                               | covenant               | un pacto (porque se hacía pasando entre trozos de carne)     | término teológicamente cargado — lectura atenta                                                                       |
| H3824  | le.vav     |    252 | **corazón / mente**                     | heart                  | el corazón (como el órgano más interior);                    | término teológicamente cargado — lectura atenta                                                                       |
| H2617  | che.sed    |    247 | **misericordia / amor leal**            | kindness               | bondad/misericordia; por implicación (hacia Dios) piedad; r… | hesed: RVR1960 mayormente «misericordia»; tb «bondad / favor». Compuesto propuesto para reflejar el sentido de pacto. |
| H2398  | cha.ta     |    238 | **pecar / errar el blanco**             | to sin                 | una raíz primitiva; propiamente, errar el blanco; de ahí (f… | término teológicamente cargado — lectura atenta                                                                       |
| H7965  | sha.lom    |    237 | **paz / bienestar**                     | peace                  | a salvo, es decir, (figurativamente) bien, feliz, amistoso;… | término teológicamente cargado — lectura atenta                                                                       |
| H5771  | a.van      |    231 | **iniquidad / culpa**                   | iniquity: crime        | perversidad, es decir, mal (moral); iniquidad                | término teológicamente cargado — lectura atenta                                                                       |
| H2233  | ze.ra      |    229 | **simiente / descendencia**             | seed                   | semilla / simiente; figurativamente, fruto, planta, tiempo…  | zera: lit. «semilla»; incluye la descendencia (y la simiente mesiánica, Gn 3:15).                                     |
| H127   | a.da.mah   |    225 | **tierra / suelo**                      | land: soil             | suelo / tierra (por su rojez general)                        | término teológicamente cargado — lectura atenta                                                                       |
| H8451  | to.rah     |    219 | **ley / instrucción**                   | instruction            | un precepto o estatuto, especialmente el Decálogo o el Pent… | término teológicamente cargado — lectura atenta                                                                       |
| H4397  | ma.le.akh  |    214 | **mensajero / ángel**                   | messenger              | un mensajero; específicamente, de Dios, es decir, un ángel…  | término teológicamente cargado — lectura atenta                                                                       |
| H6662  | tsad.diq   |    206 | **justo**                               | righteous              | justo                                                        | término teológicamente cargado — lectura atenta                                                                       |
| H3467  | ya.sah     |    205 | **salvar / librar**                     | to save                | una raíz primitiva; propiamente, estar abierto, amplio o li… | término teológicamente cargado — lectura atenta                                                                       |
| H8199  | sha.phat   |    202 | **juzgar / gobernar**                   | to judge               | juzgar, es decir, pronunciar sentencia (a favor o en contra… | término teológicamente cargado — lectura atenta                                                                       |
| H3519  | ka.vod     |    200 | **gloria / honra**                      | glory                  | raramente כָּבֹד; de H3513 (כָּבַד); propiamente, peso, per… | término teológicamente cargado — lectura atenta                                                                       |
| H7223  | ri.shon    |    181 | **primero / anterior**                  | first                  | primero, en lugar, tiempo o rango (como adjetivo o sustanti… | término teológicamente cargado — lectura atenta                                                                       |
| H7812  | sha.chah   |    172 | **postrarse / adorar**                  | to bow                 | abatir(se), es decir, postrarse (especialmente reflexivo, e… | término teológicamente cargado — lectura atenta                                                                       |
| H6942  | qa.dash    |    171 | **santificar / consagrar**              | to consecrate: consec… | ser (causativamente, hacer, declarar u observar como) limpi… | término teológicamente cargado — lectura atenta                                                                       |
| H6666  | tse.da.qah |    157 | **justicia / rectitud**                 | righteousness          | rectitud (en abstracto), subjetivamente (rectitud), objetiv… | término teológicamente cargado — lectura atenta                                                                       |
| H6664  | tse.deq    |    119 | **justicia / rectitud**                 | righteousness          | lo justo (natural, moral o legal); también (en abstracto) e… | término teológicamente cargado — lectura atenta                                                                       |
| H5162  | na.cham    |    108 | **consolar / arrepentirse**             | to be sorry: comfort   | una raíz primitiva; propiamente, suspirar, es decir, respir… | najam: nifal «arrepentirse / compadecerse», piel «consolar» — dos sentidos casi iguales en frecuencia.                |
| H539   | a.man      |    105 | **creer / confiar / ser fiel**          | be faithful            | una raíz primitiva; propiamente, edificar o sostener; criar… | término teológicamente cargado — lectura atenta                                                                       |
| H1350  | ga.al      |    104 | **redimir / rescatar**                  | to redeem: redeem      | ser el pariente más cercano (y como tal redimir la propieda… | término teológicamente cargado — lectura atenta                                                                       |
| H3722  | ki.pher    |    102 | **expiar / hacer expiación**            | to atone               | cubrir (específicamente con betún); figurativamente, expiar… | término teológicamente cargado — lectura atenta                                                                       |
| H6588  | pe.sah     |     93 | **transgresión / rebelión**             | transgression          | una rebelión (nacional, moral o religiosa); transgresión     | término teológicamente cargado — lectura atenta                                                                       |
| H3444  | ye.shu.ah  |     78 | **salvación / liberación**              | salvation              | algo salvado, es decir, (en abstracto) liberación; de ahí,…  | término teológicamente cargado — lectura atenta                                                                       |
| H2580  | chen       |     69 | **gracia / favor**                      | favor                  | gracia, es decir, subjetiva (bondad, favor) u objetiva (her… | término teológicamente cargado — lectura atenta                                                                       |
| H7522  | ra.tson    |     56 | **voluntad / beneplácito / favor**      | acceptance             | deleite (especialmente como mostrado); buena voluntad, favor | término teológicamente cargado — lectura atenta                                                                       |
| H1254  | ba.ra      |     55 | **crear**                               | to create              | (en sentido absoluto) crear; (matizado) talar (un bosque),…  | término teológicamente cargado — lectura atenta                                                                       |
| H530   | e.mu.nah   |     49 | **fidelidad / fe**                      | faithfulness           | o (abreviado) אֱמֻנָה; femenino de H529 (אֵמוּן); literalme… | término teológicamente cargado — lectura atenta                                                                       |
| H7355  | ra.cham    |     47 | **compadecerse / amar**                 | to have compassion     | acariciar; por implicación, amar, especialmente compadecerse | término teológicamente cargado — lectura atenta                                                                       |
| H7356  | ra.cha.mim |     45 | **misericordia / compasión / entrañas** | compassion             | compasión (en plural); por extensión, el vientre (como que…  | término teológicamente cargado — lectura atenta                                                                       |
| H6663  | tsa.daq    |     41 | **ser justo / justificar**              | to justify             | ser (causativamente, hacer) justo (en sentido moral o foren… | término teológicamente cargado — lectura atenta                                                                       |
| H4899  | ma.shi.ach |     39 | **ungido**                              | anointed               | ungido; usualmente una persona consagrada (como rey, sacerd… | mashiaj: «ungido»; el NT lo toma como «Mesías / Cristo».                                                              |
| H3468  | ye.sah     |     36 | **salvación / liberación**              | salvation              | libertad, liberación, prosperidad, salvación                 | término teológicamente cargado — lectura atenta                                                                       |
| H1353  | ge.ul.lah  |     14 | **redención / rescate**                 | redemption             | redención (incluyendo el derecho y el objeto); por implicac… | término teológicamente cargado — lectura atenta                                                                       |

---

## 2. Lemas teológicamente cargados / de frecuencia media (133)

`conf.` = confianza: **alta** (mapa a mano) · media (auto de `definition_es`) · baja (auto de TBESH / condensación permisiva).

| Strong | translit   | ocurr. | glosa propuesta                         | fuente        | conf. | definition_es (extracto)                                               |
| ------ | ---------- | -----: | --------------------------------------- | ------------- | ----- | ---------------------------------------------------------------------- |
| H853   | et         |  10928 | **introduce el complemento directo**    | hand-particle | alta  | al parecer contraído de H226 (אוֹת) en el sentido demostrativo de ent… |
| H5921  | al         |   5754 | **sobre / encima / contra**             | hand-particle | alta  | encima, sobre, por encima de, o contra (aunque siempre en esta última… |
| H413   | el         |   5509 | **a / hacia**                           | hand-particle | alta  | cerca, con o entre; a menudo, en general, a/hacia                      |
| H834   | a.sher     |   5496 | **que / el cual**                       | hand-particle | alta  | quien, el cual, lo que, que; también (como adverbio y conjunción) cua… |
| H3605  | kol        |   5412 | **todo / cada / cualquiera**            | hand-particle | alta  | o (Jeremías 33:8) כּוֹל; de H3634 (כָּלַל); propiamente, el todo; de…  |
| H559   | a.mar      |   5306 | **decir**                               | hand-particle | alta  | decir (usado con gran amplitud)                                        |
| H3588  | ki         |   4482 | **porque / que / cuando**               | hand-particle | alta  | (por implicación) muy ampliamente usado como conjunción o adverbio re… |
| H1961  | ha.yah     |   3559 | **ser / estar / haber / suceder**       | hand-particle | alta  | existir, es decir, ser o llegar a ser, acontecer (siempre enfático, y… |
| H430   | e.lo.him   |   2600 | **Dios**                                | hand-divine   | alta  | dioses en el sentido ordinario; pero usado específicamente (así en pl… |
| H376   | ish        |   1662 | **hombre**                              | tbesh-map     | media | un hombre como individuo o persona varón; a menudo usado como complem… |
| H1697  | da.var     |   1439 | **palabra / asunto / cosa**             | hand-weighted | alta  | una palabra; por implicación, un asunto (del que se habla) o cosa; ad… |
| H7200  | ra.ah      |   1299 | **ver**                                 | tbesh-map     | media | ver, literal o figurativamente (en numerosas aplicaciones, directas e… |
| H4480  | min        |   1187 | **de / desde**                          | tbesh-head-es | baja  | o מִנִּי; o מִנֵּי; (plural constructo) (Isaías 30:11); por H4482 (מֵ… |
| H8085  | sha.ma     |   1159 | **oír / escuchar / obedecer**           | hand-weighted | alta  | oír con entendimiento (a menudo con implicación de atención, obedienc… |
| H3427  | ya.shav    |   1079 | **habitar**                             | tbesh-map     | media | una raíz primitiva; propiamente, sentarse (específicamente como juez,… |
| H518   | im         |   1067 | **si**                                  | tbesh-head-es | baja  | usado muy ampliamente como demostrativo, ¡he aquí!; interrogativo, ¿a… |
| H3045  | ya.da      |    945 | **conocer / saber**                     | hand-weighted | alta  | conocer (propiamente, averiguar viendo); usado en una gran variedad d… |
| H1571  | gam        |    769 | **también**                             | tbesh-head-es | baja  | por contracción de una raíz en desuso que significa reunir; propiamen… |
| H5315  | ne.phesh   |    754 | **alma / vida / ser**                   | hand-weighted | alta  | de H5314 (נָפַשׁ); propiamente, una criatura que respira, es decir, a… |
| H7451  | ra         |    661 | **malo / mal / calamidad**              | hand-weighted | alta  | malo o (como sustantivo) mal (natural o moral)                         |
| H3820  | lev        |    595 | **corazón / mente**                     | hand-weighted | alta  | el corazón; también usado (figurativamente) muy ampliamente para los…  |
| H120   | a.dam      |    550 | **hombre / ser humano**                 | hand-weighted | alta  | rojizo, es decir, un ser humano (un individuo o la especie, la humani… |
| H2896  | tov        |    538 | **bueno / bien**                        | hand-weighted | alta  | bueno (como adjetivo) en el sentido más amplio; usado asimismo como s… |
| H505   | e.leph     |    505 | **mil**                                 | tbesh-map     | media | de ahí (siendo la cabeza del buey la primera letra del alfabeto, y es… |
| H6635  | tsa.va     |    484 | **ejército / hueste**                   | hand-weighted | alta  | una masa de personas (o figurativamente, de cosas), especialmente org… |
| H6944  | qo.desh    |    469 | **santidad / lo santo**                 | hand-weighted | alta  | un lugar o cosa sagrada; raramente en abstracto, santidad              |
| H8104  | sha.mar    |    468 | **guardar**                             | tbesh-head-es | baja  | una raíz primitiva; propiamente, cercar alrededor (como con espinos),… |
| H4672  | ma.tsa     |    455 | **hallar**                              | tbesh-map     | media | una raíz primitiva; propiamente, salir al encuentro de, es decir, apa… |
| H136   | a.do.nai   |    440 | **Señor**                               | hand-divine   | alta  | el Señor (usado como nombre propio de Dios únicamente)                 |
| H4941  | mish.pat   |    422 | **juicio / derecho / ordenanza**        | hand-weighted | alta  | de H8199 (שָׁפַט); propiamente, un veredicto (favorable o desfavorabl… |
| H7307  | ru.ach     |    378 | **espíritu / viento / aliento**         | hand-weighted | alta  | viento; por semejanza, aliento, es decir, una exhalación perceptible…  |
| H5046  | na.gad     |    369 | **contar**                              | tbesh-map     | media | una raíz primitiva; propiamente, ponerse al frente, es decir, destaca… |
| H1768  | di         |    345 | **que / aquel**                         | tbesh-head-es | baja  | que, usado como conjunción relativa, y especialmente (con preposición… |
| H6030  | a.nah      |    330 | **responder**                           | tbesh-head-es | baja  | una raíz primitiva; propiamente, fijar la vista o (en general) atende… |
| H3372  | ya.re      |    315 | **temer / reverenciar**                 | hand-weighted | alta  | temer; moralmente, reverenciar; causativamente, atemorizar             |
| H3966  | me.od      |    300 | **mucho**                               | tbesh-head-es | baja  | de la misma raíz que H181 (אוּד); propiamente, vehemencia, es decir,…  |
| H2403  | chat.ta.ah |    295 | **pecado / ofrenda por el pecado**      | hand-weighted | alta  | una ofensa (a veces pecaminosidad habitual), y su pena, ocasión, sacr… |
| H5647  | a.vad      |    288 | **servir / trabajar / labrar**          | hand-weighted | alta  | trabajar (en cualquier sentido); por implicación, servir, labrar, (ca… |
| H1285  | be.rit     |    284 | **pacto**                               | hand-weighted | alta  | un pacto (porque se hacía pasando entre trozos de carne)               |
| H3824  | le.vav     |    252 | **corazón / mente**                     | hand-weighted | alta  | el corazón (como el órgano más interior);                              |
| H2617  | che.sed    |    247 | **misericordia / amor leal**            | hand-weighted | alta  | bondad/misericordia; por implicación (hacia Dios) piedad; raramente (… |
| H410   | el         |    241 | **Dios**                                | hand-divine   | alta  | fuerza; como adjetivo, poderoso; especialmente el Todopoderoso (pero…  |
| H2398  | cha.ta     |    238 | **pecar / errar el blanco**             | hand-weighted | alta  | una raíz primitiva; propiamente, errar el blanco; de ahí (figurativa…  |
| H7965  | sha.lom    |    237 | **paz / bienestar**                     | hand-weighted | alta  | a salvo, es decir, (figurativamente) bien, feliz, amistoso; también (… |
| H5771  | a.van      |    231 | **iniquidad / culpa**                   | hand-weighted | alta  | perversidad, es decir, mal (moral); iniquidad                          |
| H2233  | ze.ra      |    229 | **simiente / descendencia**             | hand-weighted | alta  | semilla / simiente; figurativamente, fruto, planta, tiempo de siembra… |
| H127   | a.da.mah   |    225 | **tierra / suelo**                      | hand-weighted | alta  | suelo / tierra (por su rojez general)                                  |
| H4150  | mo.ed      |    223 | **reunión / asamblea**                  | tbesh-head-es | baja  | o מֹעֵד; o (femenino) מוֹעָדָה; (2 Crónicas 8:13), de H3259 (יָעַד);…  |
| H5159  | na.cha.lah |    222 | **heredad / herencia**                  | tbesh-head-es | baja  | de H5157 (נָחַל) (en su sentido usual); propiamente, algo heredado, e… |
| H8451  | to.rah     |    219 | **ley / instrucción**                   | hand-weighted | alta  | un precepto o estatuto, especialmente el Decálogo o el Pentateuco; la… |
| H3559  | kun        |    217 | **establecer / afirmar**                | tbesh-head-es | baja  | una raíz primitiva; propiamente, estar erguido (es decir, en pie perp… |
| H4397  | ma.le.akh  |    214 | **mensajero / ángel**                   | hand-weighted | alta  | un mensajero; específicamente, de Dios, es decir, un ángel (también u… |
| H6662  | tsad.diq   |    206 | **justo**                               | hand-weighted | alta  | justo                                                                  |
| H3467  | ya.sah     |    205 | **salvar / librar**                     | hand-weighted | alta  | una raíz primitiva; propiamente, estar abierto, amplio o libre, es de… |
| H8199  | sha.phat   |    202 | **juzgar / gobernar**                   | hand-weighted | alta  | juzgar, es decir, pronunciar sentencia (a favor o en contra); por imp… |
| H3519  | ka.vod     |    200 | **gloria / honra**                      | hand-weighted | alta  | raramente כָּבֹד; de H3513 (כָּבַד); propiamente, peso, pero solo fig… |
| H3201  | ya.khol    |    194 | **poder**                               | tbesh-head-es | baja  | poder, literalmente (poder, podía) o moralmente (tener permitido)      |
| H929   | be.he.mah  |    190 | **animal**                              | tbesh-map     | media | de una raíz en desuso (probablemente con el sentido de ser mudo); pro… |
| H352   | a.yil      |    187 | **carnero**                             | tbesh-map     | media | de la misma raíz que H193 (אוּל); propiamente, fuerza; de ahí, cualqu… |
| H5612  | se.pher    |    186 | **rollo**                               | tbesh-map     | media | o (femenino) סִפְרָה; (Salmo 56:8), de H5608 (סָפַר); propiamente, es… |
| H6     | a.vad      |    184 | **perecer**                             | tbesh-head-es | baja  | una raíz primitiva; propiamente, extraviarse, es decir, perderse; por… |
| H1241  | ba.qar     |    183 | **ganado**                              | tbesh-map     | media | ganado vacuno o un animal de la familia bovina de cualquier sexo (com… |
| H7223  | ri.shon    |    181 | **primero / anterior**                  | hand-weighted | alta  | primero, en lugar, tiempo o rango (como adjetivo o sustantivo)         |
| H7812  | sha.chah   |    172 | **postrarse / adorar**                  | hand-weighted | alta  | abatir(se), es decir, postrarse (especialmente reflexivo, en homenaje… |
| H977   | ba.char    |    171 | **escoger**                             | tbesh-head-es | baja  | una raíz primitiva; propiamente, probar, es decir, (por implicación)…  |
| H6942  | qa.dash    |    171 | **santificar / consagrar**              | hand-weighted | alta  | ser (causativamente, hacer, declarar u observar como) limpio/santo (c… |
| H1755  | dor        |    167 | **generación**                          | tbesh-head-es | baja  | o (abreviado) דֹּר; de H1752 (דּוּר); propiamente, una revolución de…  |
| H1875  | da.rash    |    164 | **buscar**                              | tbesh-map     | media | una raíz primitiva; propiamente, pisar o frecuentar; usualmente, segu… |
| H2351  | chuts      |    164 | **afuera / fuera**                      | tbesh-head-es | baja  | o (abreviado) חֻץ; de una raíz en desuso que significa separar; propi… |
| H389   | akh        |    161 | **ciertamente**                         | tbesh-head-es | baja  | una partícula de afirmación, ciertamente; de ahí (por limitación) sol… |
| H5608  | sa.phar    |    159 | **recontar / relatar**                  | tbesh-head-es | baja  | una raíz primitiva; propiamente, hacer una marca como cuenta o regist… |
| H6666  | tse.da.qah |    157 | **justicia / rectitud**                 | hand-weighted | alta  | rectitud (en abstracto), subjetivamente (rectitud), objetivamente (ju… |
| H3680  | ka.sah     |    152 | **cubrir**                              | tbesh-head-es | baja  | una raíz primitiva; propiamente, rellenar, es decir, llenar huecos; p… |
| H5060  | na.ga      |    150 | **tocar**                               | tbesh-head-es | baja  | una raíz primitiva; propiamente, tocar, es decir, poner la mano sobre… |
| H5265  | na.sa      |    146 | **partir / ponerse en marcha**          | tbesh-head-es | baja  | una raíz primitiva; propiamente, arrancar, especialmente las estacas…  |
| H2490  | cha.lal    |    143 | **profanar / comenzar**                 | tbesh-head-es | baja  | una raíz primitiva (compárese H2470 (חָלָה)); también denominativo (d… |
| H2583  | cha.nah    |    143 | **campamento / acampar**                | tbesh-head-es | baja  | una raíz primitiva (compárese H2603 (חָנַן)); propiamente, inclinarse… |
| H7604  | sha.ar     |    133 | **quedar / permanecer**                 | tbesh-head-es | baja  | una raíz primitiva; propiamente, hincharse, es decir, ser (causativam… |
| H7931  | sha.khan   |    129 | **habitar**                             | tbesh-map     | media | residir o permanecer de forma estable (literal o figuradamente); morar |
| H954   | bush       |    127 | **avergonzarse**                        | tbesh-head-es | baja  | una raíz primitiva; propiamente, palidecer, es decir, por implicación… |
| H3581  | ko.ach     |    126 | **fuerza**                              | tbesh-map     | media | vigor, literalmente (fuerza, en buen o mal sentido) o figurativamente… |
| H2803  | cha.shav   |    124 | **idear / tramar**                      | tbesh-head-es | baja  | una raíz primitiva; propiamente, trenzar o entrelazar, es decir, (lit… |
| H982   | ba.tach    |    120 | **confiar**                             | tbesh-head-es | baja  | una raíz primitiva; propiamente, refugiarse (pero no tan precipitadam… |
| H6664  | tse.deq    |    119 | **justicia / rectitud**                 | hand-weighted | alta  | lo justo (natural, moral o legal); también (en abstracto) equidad o (… |
| H3847  | la.vash    |    110 | **vestir**                              | tbesh-head-es | baja  | o לָבֵשׁ; una raíz primitiva; propiamente, envolver alrededor, es dec… |
| H5162  | na.cham    |    108 | **consolar / arrepentirse**             | hand-weighted | alta  | una raíz primitiva; propiamente, suspirar, es decir, respirar fuertem… |
| H7489  | ra.a       |    107 | **ser malo**                            | tbesh-head-es | baja  | una raíz primitiva; propiamente, estropear (literalmente, rompiendo e… |
| H539   | a.man      |    105 | **creer / confiar / ser fiel**          | hand-weighted | alta  | una raíz primitiva; propiamente, edificar o sostener; criar como padr… |
| H1350  | ga.al      |    104 | **redimir / rescatar**                  | hand-weighted | alta  | ser el pariente más cercano (y como tal redimir la propiedad de un pa… |
| H8548  | ta.mid     |    104 | **continuamente**                       | tbesh-head-es | baja  | de una raíz en desuso que significa extender; propiamente, continuida… |
| H3722  | ki.pher    |    102 | **expiar / hacer expiación**            | hand-weighted | alta  | cubrir (específicamente con betún); figurativamente, expiar o perdona… |
| H3282  | ya.an      |     99 | **porque**                              | tbesh-head-es | baja  | de una raíz en desuso que significa prestar atención; propiamente, at… |
| H1481  | gur        |     97 | **peregrinar / morar**                  | tbesh-head-es | baja  | una raíz primitiva; propiamente, apartarse del camino (para alojarse…  |
| H426   | e.lah      |     95 | **Dios**                                | hand-divine   | alta  | Dios (arameo)                                                          |
| H4422  | ma.lat     |     95 | **escapar / huida**                     | tbesh-head-es | baja  | una raíz primitiva; propiamente, ser liso, es decir, (por implicación… |
| H6588  | pe.sah     |     93 | **transgresión / rebelión**             | hand-weighted | alta  | una rebelión (nacional, moral o religiosa); transgresión               |
| H1616  | ger        |     92 | **forastero / peregrino**               | tbesh-head-es | baja  | o (en forma plena) geyr; de H1481 (גּוּר); propiamente, un huésped; p… |
| H6285  | pe.ah      |     86 | **lado / costado**                      | tbesh-head-es | baja  | femenino de H6311 (פֹּה); propiamente, boca en sentido figurado, es d… |
| H3925  | la.mad     |     85 | **aprender**                            | tbesh-head-es | baja  | una raíz primitiva; propiamente, aguijonear, es decir, (por implicaci… |
| H1167  | ba.al      |     84 | **amo / señor**                         | tbesh-head-es | baja  | un señor / dueño; de ahí, un esposo, o (figurativamente) propietario…  |
| H4376  | ma.khar    |     80 | **vender**                              | tbesh-map     | media | vender, literalmente (como mercancía, una hija en matrimonio, en escl… |
| H226   | ot         |     79 | **señal**                               | tbesh-head-es | baja  | una señal (literal o figurada), como bandera, faro, monumento, presag… |
| H2603  | cha.nan    |     78 | **tener piedad**                        | tbesh-head-es | baja  | una raíz primitiva (compárese H2583 (חָנָה)); propiamente, inclinarse… |
| H3444  | ye.shu.ah  |     78 | **salvación / liberación**              | hand-weighted | alta  | algo salvado, es decir, (en abstracto) liberación; de ahí, ayuda, vic… |
| H1486  | go.ral     |     77 | **asignado**                            | tbesh-head-es | baja  | o (abreviado) גֹּרָל; de una raíz en desuso que significa ser áspero…  |
| H2470  | cha.lah    |     75 | **debilitarse**                         | tbesh-head-es | baja  | una raíz primitiva; propiamente, ser frotado o desgastado; de ahí (fi… |
| H2654  | cha.phets  |     74 | **deleitarse en**                       | tbesh-head-es | baja  | una raíz primitiva; propiamente, inclinarse a; por implicación (liter… |
| H6381  | pa.la      |     71 | **maravilla / prodigio**                | tbesh-head-es | baja  | una raíz primitiva; propiamente, quizá separar, es decir, distinguir…  |
| H2580  | chen       |     69 | **gracia / favor**                      | hand-weighted | alta  | gracia, es decir, subjetiva (bondad, favor) u objetiva (hermosura)     |
| H4116  | ma.har     |     68 | **apresurar**                           | tbesh-head-es | baja  | una raíz primitiva; propiamente, ser líquido o fluir fácilmente, es d… |
| H7378  | riv        |     67 | **contender**                           | tbesh-head-es | baja  | o רוּב; una raíz primitiva; propiamente, lanzar, es decir, forcejear;… |
| H7495  | ra.pah     |     67 | **sanar**                               | tbesh-map     | media | o רָפָה; una raíz primitiva; propiamente, remendar (cosiendo), es dec… |
| H2308  | cha.dal    |     58 | **cesar**                               | tbesh-head-es | baja  | una raíz primitiva; propiamente, estar flácido, es decir, (por implic… |
| H2342  | chul       |     58 | **torcer**                              | tbesh-head-es | baja  | o חִיל; una raíz primitiva; propiamente, torcer o girar (de manera ci… |
| H433   | e.lo.ah    |     57 | **Dios**                                | hand-divine   | alta  | una deidad o la Deidad; Dios                                           |
| H7703  | sha.dad    |     57 | **ruina**                               | tbesh-head-es | baja  | una raíz primitiva; propiamente, ser corpulento, es decir, (figurativ… |
| H7522  | ra.tson    |     56 | **voluntad / beneplácito / favor**      | hand-weighted | alta  | deleite (especialmente como mostrado); buena voluntad, favor           |
| H1254  | ba.ra      |     55 | **crear**                               | hand-weighted | alta  | (en sentido absoluto) crear; (matizado) talar (un bosque), selecciona… |
| H1692  | da.vaq     |     54 | **hender / adherirse**                  | tbesh-head-es | baja  | una raíz primitiva; propiamente, golpear, es decir, adherirse o pegar… |
| H8040  | se.mo.l    |     54 | **izquierda**                           | tbesh-head-es | baja  | una palabra primitiva (quizá más bien de la misma raíz que H8071 (שִׂ… |
| H4682  | mats.tsah  |     53 | **pan sin levadura**                    | tbesh-head-es | baja  | de H4711 (מָצַץ) en el sentido de devorar ávidamente por la dulzura;…  |
| H5945  | el.yon     |     53 | **Altísimo / superior**                 | hand-divine   | alta  | una elevación, es decir, (adj.) alto (comparativo); como título, el A… |
| H4058  | ma.dad     |     51 | **medida / medir**                      | tbesh-head-es | baja  | una raíz primitiva; propiamente, estirar; por implicación, medir (com… |
| H3119  | yo.mam     |     50 | **de día**                              | tbesh-head-es | baja  | de día; diariamente                                                    |
| H3332  | ya.tsaq    |     50 | **derramar**                            | tbesh-map     | media | raíz primitiva; propiamente, derramar (transitivo o intransitivo); po… |
| H530   | e.mu.nah   |     49 | **fidelidad / fe**                      | hand-weighted | alta  | o (abreviado) אֱמֻנָה; femenino de H529 (אֵמוּן); literalmente firmez… |
| H7706  | shad.day   |     48 | **Todopoderoso**                        | hand-divine   | alta  | el Todopoderoso                                                        |
| H7355  | ra.cham    |     47 | **compadecerse / amar**                 | hand-weighted | alta  | acariciar; por implicación, amar, especialmente compadecerse           |
| H7356  | ra.cha.mim |     45 | **misericordia / compasión / entrañas** | hand-weighted | alta  | compasión (en plural); por extensión, el vientre (como que abriga al…  |
| H6663  | tsa.daq    |     41 | **ser justo / justificar**              | hand-weighted | alta  | ser (causativamente, hacer) justo (en sentido moral o forense)         |
| H4899  | ma.shi.ach |     39 | **ungido**                              | hand-weighted | alta  | ungido; usualmente una persona consagrada (como rey, sacerdote o sant… |
| H3468  | ye.sah     |     36 | **salvación / liberación**              | hand-weighted | alta  | libertad, liberación, prosperidad, salvación                           |
| H1353  | ge.ul.lah  |     14 | **redención / rescate**                 | hand-weighted | alta  | redención (incluyendo el derecho y el objeto); por implicación, paren… |

---

## 3. Nombres propios — ortografía RVR1960 (2642)

`RVR1960 (BD)` = forma realmente impresa por RVR1960 en un versículo de muestra donde aparece el lema (búsqueda sin acentos contra `assets/bible-seed.db`). Vacío = no confirmado en la muestra (no implica que la propuesta sea incorrecta). ⚠️ = la BD imprime una forma distinta — revisar.

| Strong | translit                 | TBESH (EN)             | propuesta (RVR1960)                 | RVR1960 (BD)       | ocurr. |
| ------ | ------------------------ | ---------------------- | ----------------------------------- | ------------------ | -----: |
| H3068  | ye.ho.vah                | LORD                   | **Jehová**                          |                    |   6516 |
| H3478  | yis.ra.el                | Israel                 | **Israel**                          | Israel             |   2505 |
| H1732  | da.vid                   | David                  | **David**                           | David              |   1000 |
| H3063  | ye.hu.dah                | Judah                  | **Judá**                            | Judá               |    819 |
| H4872  | mo.sheh                  | Moses                  | **Moisés**                          | Moisés             |    765 |
| H3389  | ye.ru.sha.laim           | Jerusalem              | **Jerusalén**                       | Jerusalén          |    643 |
| H4714  | mits.ra.yim              | Egypt                  | **Egipto**                          | Egipto             |    641 |
| H7586  | sha.ul                   | Saul                   | **Saúl**                            | Saúl               |    401 |
| H3290  | ya.a.qov                 | Jacob                  | **Jacob**                           | Jacob              |    350 |
| H175   | a.ha.ron                 | Aaron                  | **Aarón**                           | Aarón              |    347 |
| H3069  | ye.ho.vih                | YHWH/God               | **Jehová**                          |                    |    306 |
| H3881  | le.viy.yi                | Levi                   | **levita**                          | levita             |    291 |
| H8010  | she.lo.moh               | Solomon                | **Salomón**                         | Salomón            |    291 |
| H6430  | pe.lish.ti               | Philistine             | **filisteo**                        | filisteos          |    287 |
| H6547  | par.oh                   | Pharaoh                | **Faraón**                          | Faraón             |    274 |
| H894   | ba.vel                   | Babylon                | **Babilonia**                       | Babilonia          |    262 |
| H3091  | ye.ho.shu.a              | Joshua                 | **Josué**                           | Josué              |    218 |
| H3130  | yo.seph                  | Joseph                 | **José**                            | José               |    213 |
| H3383  | yar.den                  | Jordan                 | **Jordán**                          | Jordán             |    182 |
| H4124  | mo.av                    | Moab                   | **Moab**                            | Moab               |    181 |
| H669   | eph.ra.yim               | Ephraim                | **Efraín**                          | Efraín             |    180 |
| H85    | av.ra.ham                | Abraham                | **Abraham**                         | Abraham            |    175 |
| H1144  | bin.ya.min               | Benjamin               | **Benjamín**                        | Benjamín           |    166 |
| H6726  | tsiy.yon                 | Zion                   | **Sion**                            | Sion               |    154 |
| H804   | ash.shur                 | Assyria                | **Asiria**                          | Asiria             |    151 |
| H3414  | yir.me.yah               | Jeremiah               | **Jeremías**                        | Jeremías           |    147 |
| H4519  | me.nash.sheh             | Manasseh               | **Manasés**                         | Manasés            |    146 |
| H3097  | yo.av                    | Joab                   | **Joab**                            | Joab               |    144 |
| H758   | a.ram                    | Aram                   | **Aram / Siria**                    | Aram               |    143 |
| H1008  | bet-el                   | Bethel                 | **Bet-el**                          | Bet-el             |    142 |
| H8050  | she.mu.el                | Samuel                 | **Samuel**                          | Samuel             |    140 |
| H1568  | gil.ad                   | Gilead                 | **Galaad**                          | Galaad             |    134 |
| H2396  | chiz.qiy.yah             | Hezekiah               | **Ezequías**                        | Ezequías           |    127 |
| H5045  | ne.gev                   | Negeb                  | **Neguev / sur**                    | Neguev             |    112 |
| H53    | a.vi.sha.lom             | Absalom                | **Absalón**                         | Absalón            |    110 |
| H8111  | sho.me.ron               | Samaria                | **Samaria**                         | Samaria            |    109 |
| H3327  | yits.chaq                | Isaac                  | **Isaac**                           | Isaac              |    108 |
| H5983  | am.mon                   | Ammon                  | **Amón**                            | Amón               |    106 |
| H3379  | ya.rov.am                | Jeroboam               | **Jeroboam**                        | Jeroboam           |    104 |
| H123   | e.dom                    | Edom                   | **Edom**                            | Edom               |     99 |
| H6215  | e.sav                    | Esau                   | **Esaú**                            | Esaú               |     97 |
| H3667  | ke.na.an                 | Canaan                 | **Canaán**                          | Canaán             |     94 |
| H256   | ach.av                   | Ahab                   | **Acab**                            | Acab               |     93 |
| H567   | e.mo.ri                  | Amorite                | **amorreo**                         | amorreo            |     87 |
| H3092  | ye.ho.sha.phat           | Jehoshaphat            | **Josafat**                         | Josafat            |     84 |
| H1035  | bet le.chem              | Bethlehem              | **Belén**                           | Belén              |     82 |
| H1168  | ba.al                    | Baal                   | **Baal**                            | baal               |     82 |
| H3083  | ye.ho.na.tan             | Jonathan               | **Jonatán**                         | Jonatán            |     82 |
| H3778  | kas.di                   | Chaldea                | **caldeo**                          | caldeos            |     80 |
| H3064  | ye.hu.di                 | Jew                    | **judío**                           | judíos             |     75 |
| H3669  | ke.na.a.ni               | Canaanitess            | **cananeo**                         | cananeos           |     73 |
| H499   | el.a.zar                 | Eleazar                | **Eleazar**                         | Eleazar            |     72 |
| H1410  | gad                      | Gad                    | **Gad**                             | Gad                |     72 |
| H7205  | re.u.ven                 | Reuben                 | **Rubén**                           | Rubén              |     72 |
| H452   | e.liy.yah                | Elijah                 | **Elías**                           | Elías              |     71 |
| H2275  | chev.ron                 | Hebron                 | **Hebrón**                          | Hebrón             |     71 |
| H3844  | le.va.non                | Lebanon                | **Líbano**                          | Líbano             |     71 |
| H1835  | dan                      | Dan                    | **Dan**                             | Dan                |     70 |
| H4713  | mits.ri                  | Egyptian               | **egipcio**                         | egipcios           |     70 |
| H884   | be.er she.va             | Beersheba              | **Beerseba**                        | Beerseba           |     68 |
| H40    | a.vi.me.lekh             | Abimelech              | **Abimelec**                        | Abimelec           |     66 |
| H7585  | she.ol                   | hell: Sheol            | **Seol**                            | Seol               |     66 |
| H2975  | ye.or                    | Nile                   | **Nilo / río**                      | río                |     65 |
| H74    | av.ner                   | Abner                  | **Abner**                           | Abner              |     63 |
| H6667  | tsid.qiy.yah             | Zedekiah               | **Sedequías**                       | Sedequías          |     63 |
| H7927  | she.khem                 | Shechem                | **Siquem**                          | Siquem             |     63 |
| H87    | av.ram                   | Abram                  | **Abram**                           | Abram              |     61 |
| H1109  | bil.am                   | Balaam                 | **Balaam**                          | Balaam             |     61 |
| H6160  | a.ra.vah                 | Arabah                 | **Arabá / llanura**                 | Arabá              |     61 |
| H1316  | ba.shan                  | Bashan                 | **Basán**                           | Basán              |     60 |
| H4782  | mor.de.khay              | Mordecai               | **Mardoqueo**                       | Mardoqueo          |     60 |
| H5019  | ne.vu.khad.nets.tsar     | Nebuchadnezzar         | **Nabucodonosor**                   | Nabucodonosor      |     60 |
| H3878  | le.vi                    | Levi                   | **Leví**                            | Leví               |     59 |
| H4080  | mid.yan                  | Midian                 | **Madián**                          | Madián             |     59 |
| H347   | iy.yov                   | Job                    | **Job**                             | Job                |     58 |
| H477   | e.li.sah                 | Elisha                 | **Eliseo**                          | Eliseo             |     58 |
| H609   | a.sa                     | Asa                    | **Asa**                             | Asa                |     58 |
| H3058  | ye.hu                    | Jehu                   | **Jehú**                            | Jehú               |     58 |
| H1841  | da.niy.yel               | Daniel                 | **Daniel**                          | Daniel             |     57 |
| H3405  | ye.ri.cho                | Jericho                | **Jericó**                          | Jericó             |     57 |
| H635   | es.ter                   | Esther                 | **Ester**                           | Ester              |     55 |
| H3837  | la.van                   | Laban                  | **Labán**                           | Labán              |     55 |
| H2001  | ha.man                   | Haman                  | **Amán**                            | Amán               |     54 |
| H2977  | yo.shiy.yah              | Josiah                 | **Josías**                          | Josías             |     53 |
| H6659  | tsa.doq                  | Zadok                  | **Sadoc**                           | Sadoc              |     53 |
| H3077  | ye.ho.ya.da              | Jehoiada               | **Joiada**                          | Joiada             |     51 |
| H5321  | naph.ta.li               | Naphtali               | **Neftalí**                         | Neftalí            |     51 |
| H1130  | ben-ha.dad               | Ben-hadad              | **Ben-adad**                        | Ben-adad           |     50 |
| H7346  | re.chav.am               | Rehoboam               | **Roboam**                          | Roboam             |     50 |
| H2850  | chit.ti                  | Hittite                | **heteo**                           | heteos             |     48 |
| H3050  | yah                      | LORD                   | **JAH**                             |                    |     48 |
| H3458  | yish.ma.el               | Ishmael                | **Ismael**                          | Ismael             |     48 |
| H5838  | a.zar.yah                | Azariah                | **Azarías**                         | Azarías            |     48 |
| H3101  | yo.ash                   | Joash                  | **Joás**                            | Joás               |     47 |
| H7354  | ra.chel                  | Rachel                 | **Raquel**                          | Raquel             |     47 |
| H5146  | no.ach                   | Noah                   | **Noé**                             | Noé                |     46 |
| H1390  | giv.ah                   | Gibeah                 | **Guibeá**                          |                    |     45 |
| H1834  | dam.me.seq               | Damascus               | **Damasco**                         | Damasco            |     45 |
| H2074  | ze.vu.lun                | Zebulun                | **Zabulón**                         | Zabulón            |     45 |
| H8095  | shim.on                  | Simeon                 | **Simeón**                          | Simeón             |     44 |
| H836   | a.sher                   | Asher                  | **Aser**                            | Aser               |     43 |
| H1111  | ba.laq                   | Balak                  | **Balac**                           | Balac              |     43 |
| H2148  | ze.khar.yah              | Zechariah              | **Zacarías**                        | Zacarías           |     43 |
| H3485  | yis.sa.s.khar            | Issachar               | **Isacar**                          | Isacar             |     43 |
| H8096  | shim.i                   | Shimei                 | **Simei**                           | Simei              |     43 |
| H1053  | bet she.mesh             | Beth-shemesh           | **Bet-semes**                       | Bet-semes          |     42 |
| H1141  | be.na.yah                | Benaiah                | **Benaía**                          | Benaía             |     42 |
| H3129  | yo.na.tan                | Jonathan               | **Jonatán**                         | Jonatán            |     42 |
| H3448  | yi.shay                  | Jesse                  | **Isaí**                            | Isaí               |     42 |
| H6865  | tsor                     | Tyre                   | **Tiro**                            | Tiro               |     42 |
| H271   | a.chaz                   | Ahaz                   | **Acaz**                            | Acaz               |     41 |
| H2983  | ye.vu.si                 | Jebusite               | **jebuseo**                         | jebuseo            |     41 |
| H5416  | na.tan                   | Nathan                 | **Natán**                           | Natán              |     41 |
| H8098  | she.ma.yah               | Shemaiah               | **Semaías**                         | Semaías            |     41 |
| H558   | a.mats.yah               | Amaziah                | **Amasías**                         | Amasías            |     40 |
| H842   | a.she.rah                | Asherah                | **Asera**                           | Asera              |     40 |
| H1537  | gil.gal                  | Gilgal                 | **Gilgal**                          | Gilgal             |     40 |
| H4709  | mits.pah                 | Mizpah                 | **Mizpa**                           | Mizpa              |     40 |
| H5654  | o.ved e.dom              | Obed-edom              | **Obed-edom**                       | Obed-edom          |     40 |
| H5857  | ay                       | Ai                     | **Hai**                             | Hai                |     40 |
| H223   | u.riy.yah                | Uriah                  | **Urías**                           | Urías              |     39 |
| H1439  | gid.on                   | Gideon                 | **Gedeón**                          | Gedeón             |     39 |
| H3470  | ye.sha.yah               | Jeshaiah               | **Isaías**                          | Isaías             |     39 |
| H5467  | se.dom                   | Sodom                  | **Sodoma**                          | Sodoma             |     39 |
| H6002  | a.ma.leq                 | Amalek                 | **Amalec**                          | Amalec             |     39 |
| H7157  | qir.yat ye.a.rim         | Kiriath-jearim         | **Quiriat-jearim / Quiriat**        | Quiriat-jearim     |     39 |
| H8165  | se.ir                    | (Mount) Seir           | **Seir**                            | Seir               |     39 |
| H2809  | chesh.bon                | Heshbon                | **Hesbón**                          | Hesbón             |     38 |
| H8123  | shim.shon                | Samson                 | **Sansón**                          | Sansón             |     38 |
| H8283  | sa.rah                   | Sarah                  | **Sara**                            | Sarai              |     38 |
| H274   | a.chaz.yah               | Ahaziah                | **Ocozías**                         | Ocozías            |     37 |
| H1391  | giv.on                   | Gibeon                 | **Gabaón**                          | Gabaón             |     37 |
| H3079  | ye.ho.ya.qim             | Jehoiakim              | **Joacim**                          | Joacim             |     37 |
| H5511  | si.chon                  | Sihon                  | **Sehón**                           | Sehón              |     37 |
| H3157  | yiz.re.el                | Jezreel                | **Jezreel**                         | Jezreel            |     36 |
| H4847  | me.ra.ri                 | Merari                 | **Merari**                          | Merari             |     36 |
| H7414  | ra.mah                   | Ramah                  | **Ramá**                            | Ramá               |     36 |
| H2574  | cha.mat                  | Hamath                 | **Hamat**                           | Hamat              |     35 |
| H3612  | ka.lev                   | Caleb                  | **Caleb**                           | Caleb              |     35 |
| H5514  | si.nay                   | Sinai                  | **Sinaí**                           | Sinaí              |     35 |
| H623   | a.saph                   | Asaph                  | **Asaf**                            | Asaf               |     34 |
| H2518  | chil.qiy.yah             | Hilkiah                | **Hilcías**                         | Hilcías            |     34 |
| H3812  | le.ah                    | Leah                   | **Lea**                             | Lea                |     34 |
| H5680  | iv.ri                    | Hebrew                 | **hebreo**                          | hebreo             |     34 |
| H3876  | lot                      | Lot                    | **Lot**                             | Lot                |     33 |
| H4318  | mi.khah                  | Micah                  | **Micaía**                          | Micaía             |     33 |
| H5941  | e.li                     | Eli                    | **Elí**                             | Elí                |     33 |
| H1436  | ge.dal.yah               | Gedaliah               | **Gedalías**                        | Gedalías           |     32 |
| H1661  | gat                      | Gath                   | **Gat**                             | Gat                |     32 |
| H6955  | qe.hat                   | Kohath                 | **Coat**                            | Coat               |     32 |
| H7262  | rav.sha.qeh              | Rabshakeh              | **Rabsaces**                        | Rabsaces           |     32 |
| H7887  | shi.loh                  | Shiloh                 | **Silo**                            | Silo               |     32 |
| H325   | a.chash.ve.rosh          | Ahasuerus              | **Asuero**                          | Asuero             |     31 |
| H5020  | ne.vu.khad.nets.tsar     | Nebuchadnezzar         | **Nabucodonosor**                   | Nabucodonosor      |     31 |
| H54    | ev.ya.tar                | Abiathar               | **Abiatar**                         | Abiatar            |     30 |
| H3316  | yiph.tach                | Iphtah                 | **Jefté**                           | Jefté              |     30 |
| H5126  | nun                      | Nun                    | **Nun / Non**                       | Nun                |     30 |
| H7259  | riv.qah                  | Rebekah                | **Rebeca**                          | Rebeca             |     30 |
| H2608  | cha.nan.yah              | Hananiah               | **Hananías**                        | Hananías           |     29 |
| H3088  | ye.ho.ram                | Jehoram                | **Joram**                           | Joram              |     29 |
| H3442  | ye.shu.a                 | Jeshua                 | **Jesúa**                           | Jesúa              |     29 |
| H3568  | kush                     | Cush                   | **Cus**                             | Cus                |     29 |
| H550   | am.non                   | Amnon                  | **Amnón**                           | Amnón              |     28 |
| H1032  | bet cho.ron              | Beth-horon             | **Bet-horón**                       | Bet-horón          |     28 |
| H1201  | ba.sah                   | Baasha                 | **Baasa**                           | Baasa              |     28 |
| H5665  | a.ved ne.go              | Abednego               | **Abed-nego**                       | Abed-nego          |     28 |
| H5867  | e.lam                    | Elam                   | **Elam**                            | Elam               |     28 |
| H6539  | pa.ras                   | Persia                 | **Persia**                          | Persia             |     28 |
| H8659  | tar.shish                | Tarshish               | **Tarsis**                          | Tarsis             |     28 |
| H5818  | uz.ziy.yah               | Uzziah                 | **Uzías**                           | Uzías              |     27 |
| H7967  | shal.lum                 | Shallum                | **Salum**                           | Salum              |     27 |
| H138   | a.do.niy.yah             | Adonijah               | **Adonías**                         | Adonías            |     26 |
| H1263  | ba.rukh                  | Baruch                 | **Baruc**                           | Baruc              |     26 |
| H3390  | ye.ru.sha.lem            | Jerusalem              | **Jerusalén**                       | Jerusalén          |     26 |
| H3569  | ku.shi                   | Ethiopian              | **cusita**                          | cusita             |     26 |
| H6870  | tse.ru.yah               | Zeruiah                | **Sarvia**                          | Sarvia             |     26 |
| H7141  | qo.rach                  | Korah                  | **Coré**                            | Coré               |     26 |
| H29    | a.viy.yah                | Abijah                 | **Abías**                           | Abías              |     25 |
| H52    | a.vi.shay                | Abishai                | **Abisai**                          | Abisai             |     25 |
| H769   | ar.non                   | Arnon                  | **el Arnón**                        | Arnón              |     25 |
| H895   | ba.vel                   | Babylon                | **Babilonia**                       | Babilonia          |     25 |
| H2340  | chiv.vi                  | Hivite                 | **heveo**                           | heveo              |     25 |
| H4918  | me.shul.lam              | Meshullam              | **Mesulam**                         | Mesulam            |     25 |
| H5028  | ne.vat                   | Nebat                  | **Nabat**                           | Nabat              |     25 |
| H6372  | pin.chas                 | Phinehas               | **Finees**                          | Finees             |     25 |
| H7497  | re.pha.im                | (Valley of) Rephaim    | **gigante**                         | gigantes           |     25 |
| H8559  | ta.mar                   | Tamar                  | **Tamar**                           | Tamar              |     25 |
| H281   | a.chiy.yah               | Ahijah                 | **Ahías**                           | Ahías              |     24 |
| H1162  | bo.az                    | Boaz                   | **Booz**                            | Booz               |     24 |
| H1840  | da.niy.yel               | Daniel                 | **Daniel**                          | Daniel             |     24 |
| H3003  | ya.vesh                  | Jabesh (Gilead)        | **Jabes**                           | Jabes              |     24 |
| H3147  | yo.tam                   | Jotham                 | **Jotam**                           | Jotam              |     24 |
| H3923  | la.khish                 | Lachish                | **Laquis**                          | Laquis             |     24 |
| H6214  | a.sa.h.el                | Asahel                 | **Asael**                           | Asael              |     24 |
| H2371  | cha.za.el                | Hazael                 | **Hazael**                          | Hazael             |     23 |
| H4601  | ma.a.khah                | Maacah                 | **Maaca**                           | Maaca              |     23 |
| H4641  | ma.a.se.yah              | Maaseiah               | **Maasías**                         | Maasías            |     23 |
| H6522  | pe.riz.zi                | Perizzite              | **ferezeo**                         | ferezeo            |     23 |
| H7614  | she.va                   | Sheba                  | **Seba**                            | Seba               |     23 |
| H348   | i.ze.vel                 | Jezebel                | **Jezabel**                         | Jezabel            |     22 |
| H378   | ish-bo.shet              | Ish-bosheth            | **Is-boset**                        | Is-boset           |     22 |
| H2438  | chi.ram                  | Hiram                  | **Hiram / Hirom**                   | Hiram              |     22 |
| H3110  | yo.cha.nan               | Johanan                | **Johanán**                         | Johanán            |     22 |
| H3760  | kar.mel                  | Carmel                 | **Carmelo**                         | Carmelo            |     22 |
| H4353  | ma.khir                  | Machir                 | **Maquir**                          | Maquir             |     22 |
| H5022  | na.vot                   | Naboth                 | **Nabot**                           | Nabot              |     22 |
| H5037  | na.val                   | Nabal                  | **Nabal**                           | Nabal              |     22 |
| H5747  | og                       | Og                     | **Og**                              |                    |     22 |
| H5830  | ez.ra                    | Ezra                   | **Esdras**                          | Esdras             |     22 |
| H6138  | eq.ron                   | Ekron                  | **Ecrón**                           | Ecrón              |     22 |
| H6721  | tsi.don                  | Sidon                  | **Sidón**                           | Sidón              |     22 |
| H7418  | ra.mot                   | Ramoth                 | **Ramot-néguev / Ramat**            |                    |     22 |
| H385   | i.ta.mar                 | Ithamar                | **Itamar**                          | Itamar             |     21 |
| H397   | a.khish                  | Achish                 | **Aquis**                           | Aquis              |     21 |
| H446   | e.li.av                  | Eliab                  | **Eliab**                           | Eliab              |     21 |
| H511   | el.qa.nah                | Elkanah                | **Elcana**                          | Elcana             |     21 |
| H2216  | ze.rub.ba.vel            | Zerubbabel             | **Zorobabel**                       | Zorobabel          |     21 |
| H2226  | ze.rach                  | Zerah                  | **Zera**                            | Zera               |     21 |
| H4321  | mi.kha.ye.hu             | Micaiah                | **Micaías**                         | Micaías            |     21 |
| H5281  | no.o.mi                  | Naomi                  | **Noemí**                           | Noemí              |     21 |
| H5516  | sis.ra                   | Sisera                 | **Sísara**                          | Sísara             |     21 |
| H5804  | az.zah                   | Gaza                   | **Gaza**                            | Gaza               |     21 |
| H5984  | am.mo.ni                 | Meunite                | **amonita**                         | amonitas           |     21 |
| H7027  | qish                     | Kish                   | **Cis**                             | Cis                |     21 |
| H7800  | shu.shan                 | Susa                   | **Susa**                            | Susa               |     21 |
| H296   | a.chi.qam                | Ahikam                 | **Ahicam**                          | Ahicam             |     20 |
| H302   | a.chi.to.phel            | Ahithophel             | **Ahitofel**                        | Ahitofel           |     20 |
| H1339  | bat-she.va               | Bathsheba              | **Betsabé**                         | Betsabé            |     20 |
| H3059  | ye.ho.a.chaz             | Jehoahaz               | **Joacaz**                          | Joacaz             |     20 |
| H3141  | yo.ram                   | Joram                  | **Joram**                           | Joram              |     20 |
| H5070  | na.dav                   | Nadab                  | **Nadab**                           | Nadab              |     20 |
| H5418  | ne.tan.yah               | Nethaniah              | **Netanías**                        | Netanías           |     20 |
| H5662  | o.vad.yah                | Obadiah                | **Abdías**                          | Abdías             |     20 |
| H6947  | qa.desh bar.ne.a         | Kadesh-barnea          | **Cades-barnea**                    | Cades-barnea       |     20 |
| H8219  | she.phe.lah              | Shephelah              | **Sefela / llanura**                | Sefela             |     20 |
| H8304  | se.ra.yah                | Seraiah                | **Seraías**                         | Seraías            |     20 |
| H1387  | ge.va                    | Geba                   | **Geba**                            | Geba               |     19 |
| H3100  | yo.el                    | Joel                   | **Joel**                            | Joel               |     19 |
| H3124  | yo.nah                   | Jonah                  | **Jonás**                           | Jonás              |     19 |
| H6017  | a.mo.rah                 | Gomorrah               | **Gomorra**                         | Gomorra            |     19 |
| H7014  | qa.yin                   | Kenite                 | **Caín**                            | Caín               |     19 |
| H1052  | bet she.an               | Beth-shean             | **Bet-seán / Bet**                  | Bet-seán           |     18 |
| H1648  | ge.re.shon               | Gershon                | **Gersón / Gersom**                 | Gersón             |     18 |
| H2674  | cha.tsor                 | Hazor                  | **Hazor**                           | Hazor              |     18 |
| H2696  | chets.ron                | Hezron                 | **Hezrón**                          | Hezrón             |     18 |
| H2900  | to.viy.yah               | Tobijah                | **Tobías**                          | Tobías             |     18 |
| H3841  | liv.nah                  | Libnah                 | **Libna**                           | Libna              |     18 |
| H4324  | mi.khal                  | Michal                 | **Mical**                           | Mical              |     18 |
| H4495  | ma.no.ach                | Manoah                 | **Manoa**                           | Manoa              |     18 |
| H4648  | me.phi.vo.shet           | Mephibosheth           | **Mefiboset**                       |                    |     18 |
| H5152  | na.chor                  | Nahor                  | **Nacor**                           | Nacor              |     18 |
| H5523  | suk.kot                  | Succoth                | **Sucot**                           | Sucot              |     18 |
| H6018  | om.ri                    | Omri                   | **Omri**                            | Omri               |     18 |
| H6578  | pe.rat                   | Euphrates              | **Perat**                           |                    |     18 |
| H6946  | qa.desh                  | Kadesh                 | **Cades**                           | Cades              |     18 |
| H7084  | qe.i.lah                 | Keilah                 | **Keila**                           | Keila              |     18 |
| H7153  | qir.yat ar.ba            | Kiriath-arba           | **Quiriat-arba / Quiriat**          | Quiriat-arba       |     18 |
| H7206  | re.u.ve.ni               | Reubenite              | **rubenita**                        | rubenitas          |     18 |
| H8656  | tir.tsah                 | Tirzah                 | **Tirsa**                           | Tirsa              |     18 |
| H26    | a.vi.ga.yil              | Abigail                | **Abigail / Abigal**                | Abigail            |     17 |
| H475   | el.ya.shiv               | Eliashib               | **Eliasib**                         | Eliasib            |     17 |
| H476   | e.li.sha.ma              | Elishama               | **Elisama**                         | Elisama            |     17 |
| H526   | a.mon                    | Amon                   | **Amón**                            | Amón               |     17 |
| H795   | ash.dod                  | Ashdod                 | **Asdod**                           | Asdod              |     17 |
| H2722  | cho.rev                  | Horeb                  | **Horeb**                           | Horeb              |     17 |
| H3060  | ye.ho.ash                | Jehoash                | **Joás**                            | Joás               |     17 |
| H5210  | nin.veh                  | Nineveh                | **Nínive**                          | Nínive             |     17 |
| H5411  | na.tin                   | temple servant         | **los netineos**                    |                    |     17 |
| H6271  | a.tal.yah                | Athaliah               | **Atalía**                          | Atalía             |     17 |
| H8035  | shem                     | Shem                   | **Sem**                             | Sem                |     17 |
| H8297  | sa.ray                   | Sarai                  | **Sarai**                           | Sarai              |     17 |
| H288   | a.chi.me.lekh            | Ahimelech              | **Ahimelec**                        | Ahimelec           |     16 |
| H425   | e.lah                    | Elah                   | **Ela**                             | Ela                |     16 |
| H568   | a.mar.yah                | Amariah                | **Amarías**                         | Amarías            |     16 |
| H1425  | ga.di                    | Gad                    | **gadita**                          | gaditas            |     16 |
| H1954  | ho.she.a                 | Hoshea                 | **Oseas**                           | Oseas              |     16 |
| H1968  | he.man                   | Heman                  | **Hemán**                           | Hemán              |     16 |
| H2526  | cham                     | Ham                    | **Cam**                             | Cam                |     16 |
| H2585  | cha.nokh                 | Enoch                  | **Enoc**                            | Enoc               |     16 |
| H3312  | ye.phun.neh              | Jephunneh              | **Jefone**                          | Jefone             |     16 |
| H4074  | ma.day                   | Madai                  | **Media**                           | Media              |     16 |
| H4125  | mo.a.vi                  | Moabite                | **moabita**                         | moabitas           |     16 |
| H4441  | mal.kiy.yah              | Malchijah              | **Malquías**                        | Malquías           |     16 |
| H4983  | mat.tan.yah              | Mattaniah              | **Matanías**                        | Matanías           |     16 |
| H5018  | ne.vu.zar.a.dan          | Nebuzaradan            | **Nabuzaradán**                     | Nabuzaradán        |     16 |
| H5139  | na.zir                   | Nazirite               | **apartado**                        | apartado           |     16 |
| H5283  | na.a.man                 | Naaman                 | **Naamán**                          | Naamán             |     16 |
| H5369  | ner                      | Ner                    | **Ner**                             | Ner                |     16 |
| H5731  | e.den                    | Eden                   | **Edén**                            | Edén               |     16 |
| H5816  | uz.zi.el                 | Uzziel                 | **Uziel**                           | Uziel              |     16 |
| H6021  | a.ma.sa                  | Amasa                  | **Amasa**                           | Amasa              |     16 |
| H6177  | a.ro.er                  | Aroer                  | **Aroer**                           | Aroer              |     16 |
| H6717  | tsi.va                   | Ziba                   | **Siba**                            | Siba               |     16 |
| H6722  | tsi.do.ni                | Sidonian               | **sidonio**                         | sidonios           |     16 |
| H7417  | rim.mon                  | Rimmon                 | **Rimón**                           | Rimón              |     16 |
| H285   | a.chi.tuv                | Ahitub                 | **Ahitob**                          | Ahitob             |     15 |
| H290   | a.chi.ma.ats             | Ahimaaz                | **Ahimaas**                         | Ahimaas            |     15 |
| H464   | e.li.phaz                | Eliphaz                | **Elifaz**                          | Elifaz             |     15 |
| H783   | ar.tach.shash.ta         | Artaxerxes             | **Artajerjes**                      | Artajerjes         |     15 |
| H1137  | ba.ni                    | Bani                   | **Bani**                            | Bani               |     15 |
| H1145  | ben-y.mi.ni              | Benjaminite            | **benjamita**                       | benjamita          |     15 |
| H1507  | ge.zer                   | Gezer                  | **Gezer**                           | Gezer              |     15 |
| H1657  | go.shen                  | Goshen                 | **Gosén**                           | Gosén              |     15 |
| H1868  | dar.ya.vesh              | Darius                 | **Darío**                           | Darío              |     15 |
| H2174  | zim.ri                   | Zimri                  | **Zimri**                           | Zimri              |     15 |
| H2354  | chur                     | Hur                    | **Hur**                             | Hur                |     15 |
| H2811  | cha.shav.yah             | Hashabiah              | **Hasabías**                        | Hasabías           |     15 |
| H3566  | ko.resh                  | Cyrus                  | **Ciro**                            | Ciro               |     15 |
| H4813  | mir.yam                  | Miriam                 | **Miriam**                          |                    |     15 |
| H5677  | e.ver                    | Eber                   | **Heber**                           | Heber              |     15 |
| H6068  | a.na.tot                 | Anathoth               | **Anatot**                          | Anatot             |     15 |
| H6557  | pe.rets                  | Perez                  | **Fares**                           | Fares              |     15 |
| H6860  | tsiq.lag                 | Ziklag                 | **Siclag**                          | Siclag             |     15 |
| H6956  | qo.ha.ti                 | Kohathite              | **coatita**                         | coatitas           |     15 |
| H7237  | rab.bah                  | Rabbah                 | **Rabá**                            | Rabá               |     15 |
| H461   | e.li.e.zer               | Eliezer                | **Eliezer**                         | Eliezer            |     14 |
| H1007  | bet a.ven                | Beth-aven              | **Bet-avén**                        | Bet-avén           |     14 |
| H1106  | be.la                    | Bela                   | **Bela**                            | Bela               |     14 |
| H1688  | de.vir                   | Debir                  | **Debir**                           | Debir              |     14 |
| H2365  | chu.shay                 | Hushai                 | **Husai**                           | Husai              |     14 |
| H2845  | chet                     | Heth                   | **Het**                             | Het                |     14 |
| H3038  | ye.du.tun                | Jeduthun               | **Jedutún**                         | Jedutún            |     14 |
| H3171  | ye.chi.el                | Jehiel                 | **Jehiel**                          | Jehiel             |     14 |
| H3378  | ye.rub.ba.al             | Jerubbaal              | **Jerobaal**                        | Jerobaal           |     14 |
| H4336  | me.shakh                 | Meshach                | **Mesac**                           | Mesac              |     14 |
| H5417  | ne.tan.el                | Nethanel               | **Natanael**                        | Natanael           |     14 |
| H5798  | uz.za                    | (Garden of) Uzza       | **Uza**                             | Uza                |     14 |
| H6019  | am.ram                   | Amram                  | **Amram**                           | Amram              |     14 |
| H6085  | eph.ron                  | Ephron                 | **Efrón**                           | Efrón              |     14 |
| H6100  | ets.yon ge.ver           | Ezion-geber            | **Ezión-geber**                     | Ezión-geber        |     14 |
| H6583  | pash.chur                | Pashhur                | **Pasur**                           | Pasur              |     14 |
| H7143  | qa.re.ach                | Kareah                 | **Carea**                           | Carea              |     14 |
| H7715  | shad.rakh                | Shadrach               | **Sadrac**                          | Sadrac             |     14 |
| H211   | o.phir                   | Ophir                  | **Ofir**                            | Ofir               |     13 |
| H531   | a.mots                   | Amoz                   | **Amoz**                            | Amoz               |     13 |
| H1301  | ba.raq                   | Barak                  | **Barac**                           | Barac              |     13 |
| H1647  | ge.re.shom               | Gershom                | **Gersón**                          | Gersón             |     13 |
| H1649  | ge.re.shun.ni            | Gershonite             | **gersonita**                       | gersonitas         |     13 |
| H1712  | da.gon                   | Dagon                  | **Dagón**                           | Dagón              |     13 |
| H2011  | hin.nom                  | (Topheth of) Hinnom    | **Hinom**                           | Hinom              |     13 |
| H2361  | chu.ram                  | Hiram                  | **Hiram**                           | Hiram              |     13 |
| H2544  | cha.mor                  | Hamor                  | **Hamor**                           | Hamor              |     13 |
| H2584  | chan.nah                 | Hannah                 | **Ana**                             | Ana                |     13 |
| H2768  | cher.mon                 | (Mount) Hermon         | **Hermón**                          | Hermón             |     13 |
| H3158  | yiz.re.e.li              | Jezreel                | **jezreelita**                      | jezreelita         |     13 |
| H3270  | ya.a.zer                 | Jazer                  | **Jaazer / Jazer**                  | Jazer              |     13 |
| H3273  | ye.i.el                  | Jeiel                  | **Jeiel**                           | Jeiel              |     13 |
| H3406  | ye.ri.mot                | Jerimoth               | **Jerimot / Jeremot**               | Jerimot            |     13 |
| H4266  | ma.cha.na.yim            | Mahanaim               | **Mahanaim**                        | Mahanaim           |     13 |
| H4317  | mi.kha.el                | Michael                | **Miguel**                          | Miguel             |     13 |
| H5015  | ne.vo                    | Nebo                   | **Nebo**                            | Nebo               |     13 |
| H5576  | san.che.riv              | Sennacherib            | **Senaquerib**                      | Senaquerib         |     13 |
| H5700  | eg.lon                   | Eglon                  | **Eglón**                           | Eglón              |     13 |
| H5992  | am.mi.na.dav             | Amminadab              | **Aminadab**                        | Aminadab           |     13 |
| H7394  | re.khav                  | Rechab                 | **Recab**                           | Recab              |     13 |
| H7425  | re.mal.ya.hu             | Remaliah               | **Remalías**                        | Remalías           |     13 |
| H8203  | she.phat.yah             | Shephatiah             | **Sefatías**                        | Sefatías           |     13 |
| H8646  | te.rach                  | Terah                  | **Taré**                            | Taré               |     13 |
| H30    | a.vi.hu                  | Abihu                  | **Abiú**                            | Abiú               |     12 |
| H41    | a.vi.na.dav              | Abinadab               | **Abinadab**                        | Abinadab           |     12 |
| H62    | a.vel bet-ma.a.khah      | Abel-beth-maachah      | **Abel-bet-maaca**                  | Abel-bet-maaca     |     12 |
| H121   | a.dam                    | Adam                   | **Adán**                            | Adán               |     12 |
| H471   | el.ya.qim                | Eliakim                | **Eliaquim**                        | Eliaquim           |     12 |
| H771   | or.nan                   | Ornan                  | **Ornán**                           | Ornán              |     12 |
| H831   | ash.qe.lon               | Ashkelon               | **Ascalón**                         | Ascalón            |     12 |
| H1187  | ba.al pe.or              | Baal of Peor           | **Baal-peor**                       | Baal-peor          |     12 |
| H1271  | bar.zil.lay              | Barzillai              | **Barzilai**                        | Barzilai           |     12 |
| H1522  | ge.cha.zi                | Gehazi                 | **Giezi**                           | Giezi              |     12 |
| H1904  | ha.gar                   | Hagar                  | **Agar**                            | Agar               |     12 |
| H1908  | ha.dad                   | Hadad                  | **Hadad**                           | Hadad              |     12 |
| H1928  | ha.dar.e.zer             | Hadarezer              | **Hadad-ezer**                      | Hadad-ezer         |     12 |
| H2023  | hor                      | (Mount) Hor            | **Hor**                             | Hor                |     12 |
| H2078  | ze.vach                  | Zebah                  | **Zeba**                            | Zeba               |     12 |
| H2147  | zikh.ri                  | Zichri                 | **Zicri**                           | Zicri              |     12 |
| H2605  | cha.nan                  | Hanan                  | **Hanán**                           | Hanán              |     12 |
| H2771  | cha.ran                  | Haran                  | **Harán**                           | Harán              |     12 |
| H4023  | me.gid.don               | Megiddo                | **Meguido**                         | Meguido            |     12 |
| H4249  | mach.li                  | Mahli                  | **Mahli**                           | Mahli              |     12 |
| H5663  | e.ved me.lekh            | Ebed-melech            | **Ebed-melec**                      | Ebed-melec         |     12 |
| H5872  | en ge.di                 | Engedi                 | **En-gadi**                         | En-gadi            |     12 |
| H6003  | a.ma.le.qi               | Amalekite              | **amalecita**                       | amalecitas         |     12 |
| H6034  | a.nah                    | Anah                   | **Aná**                             | Ana                |     12 |
| H6252  | ash.ta.rot               | Ashtaroth              | **Astarot**                         | Astarot            |     12 |
| H6355  | pa.chat mo.av            | Pahath-moab            | **Pahat-moab**                      | Pahat-moab         |     12 |
| H6678  | tso.va                   | Zobah                  | **Soba**                            | Soba               |     12 |
| H6759  | tsal.mun.na              | Zalmunna               | **Zalmuna**                         | Zalmuna            |     12 |
| H6938  | qe.dar                   | Kedar                  | **Cedar**                           | Cedar              |     12 |
| H6943  | qe.desh                  | Kedesh                 | **Cedes**                           | Cedes              |     12 |
| H7017  | qe.ni                    | Kenite                 | **ceneo**                           | ceneos             |     12 |
| H7327  | rut                      | Ruth                   | **Rut**                             | Rut                |     12 |
| H8407  | tig.lat pil.e.ser        | Tiglath-pileser        | **Tiglat-pileser / Tilgat**         | Tiglat-pileser     |     12 |
| H8553  | tim.nah                  | Timnah                 | **Timna**                           | Timnat             |     12 |
| H48    | a.vi.ram                 | Abiram                 | **Abiram**                          | Abiram             |     11 |
| H130   | e.do.mi                  | Edomite                | **edomita**                         | edomita            |     11 |
| H453   | e.li.hu                  | Elihu                  | **Eliú**                            | Eliú               |     11 |
| H761   | a.ram.mi                 | Aramean                | **arameo**                          | arameo             |     11 |
| H1090  | bil.hah                  | Bilhah                 | **Bilha**                           | Bilha              |     11 |
| H1283  | be.ri.ah                 | Beriah                 | **Bería**                           | Bería              |     11 |
| H1296  | be.rekh.yah              | Berechiah              | **Berequías**                       | Berequías          |     11 |
| H1569  | gil.a.di                 | Gileadite              | **galaadita**                       | galaaditas         |     11 |
| H1719  | de.dan                   | Dedan                  | **Dedán**                           | Dedán              |     11 |
| H1769  | di.von                   | Dibon                  | **Dibón**                           | Dibón              |     11 |
| H2268  | che.ver                  | Heber                  | **Heber**                           | Heber              |     11 |
| H2292  | chag.gay                 | Haggai                 | **Hageo**                           | Hageo              |     11 |
| H2586  | cha.nun                  | Hanun                  | **Hanún**                           | Hanún              |     11 |
| H2607  | cha.na.ni                | Hanani                 | **Hanani**                          | Hanani             |     11 |
| H2766  | cha.rim                  | Harim                  | **Harim**                           | Harim              |     11 |
| H3048  | ye.da.yah                | Jedaiah                | **Jedaías**                         | Jedaías            |     11 |
| H3076  | ye.ho.cha.nan            | Johanan                | **Johanán**                         | Johanán            |     11 |
| H3098  | yo.ach                   | Joah                   | **Joa**                             | Joa                |     11 |
| H3107  | yo.za.vad                | Jozacar                | **Jozabad**                         | Jozabad            |     11 |
| H3120  | ya.van                   | Javan                  | **Javán**                           | Javán              |     11 |
| H3315  | ye.phet                  | Japheth                | **Jafet**                           | Jafet              |     11 |
| H3929  | le.mekh                  | Lamech                 | **Lamec**                           | Lamec              |     11 |
| H4363  | mikh.mas                 | Michmash               | **Micmas**                          | Micmas             |     11 |
| H4435  | mil.kah                  | Milcah                 | **Milca**                           | Milca              |     11 |
| H4809  | me.ri.vah                | Meribah                | **Meriba**                          | Meriba             |     11 |
| H5200  | ne.to.pha.ti             | Netophathite           | **netofatita**                      | netofatita         |     11 |
| H5813  | uz.zi                    | Uzzi                   | **Uzi**                             | Uzi                |     11 |
| H6290  | pa.ran                   | Paran                  | **Parán**                           | Parán              |     11 |
| H6307  | pad.dan                  | Paddan                 | **Padán / Padán-aram**              | Padan-aram         |     11 |
| H6492  | pe.qach                  | Pekah                  | **Peka**                            | Peka               |     11 |
| H6765  | tse.loph.chad            | Zelophehad             | **Zelofehad**                       | Zelofehad          |     11 |
| H6939  | qid.ron                  | Kidron                 | **Cedrón**                          | Cedrón             |     11 |
| H7073  | qe.naz                   | Kenaz                  | **Quenaz**                          |                    |     11 |
| H7247  | riv.lah                  | Riblah                 | **Ribla**                           | Ribla              |     11 |
| H7467  | re.u.el                  | Reuel                  | **Reuel**                           | Reuel              |     11 |
| H7526  | re.tsin                  | Rezin                  | **Rezín**                           | Rezín              |     11 |
| H8487  | te.man                   | Teman                  | **Temán**                           | Temán              |     11 |
| H357   | ay.ya.lon                | Aijalon                | **Ajalón**                          | Ajalón             |     10 |
| H447   | e.li.el                  | Eliel                  | **Eliel**                           | Eliel              |     10 |
| H564   | im.mer                   | Immer                  | **Imer**                            | Imer               |     10 |
| H672   | eph.ra.tah               | Ephrathah              | **Efrata**                          | Efrata             |     10 |
| H1160  | be.or                    | Beor                   | **Beor**                            | Beor               |     10 |
| H1177  | ba.al cha.nan            | Baal-hanan             | **Baal-hanán**                      | Baal-hanán         |     10 |
| H1328  | be.tu.el                 | Bethuel                | **Betuel**                          | Betuel             |     10 |
| H1463  | gog                      | Gog                    | **Gog**                             | Gog                |     10 |
| H1642  | ge.rar                   | Gerar                  | **Gerar**                           | Gerar              |     10 |
| H1663  | git.ti                   | Gittite                | **geteo**                           | geteo              |     10 |
| H1683  | de.bo.rah                | Deborah                | **Débora**                          | Débora             |     10 |
| H1867  | dar.ya.vesh              | Darius                 | **Darío**                           | Darío              |     10 |
| H1885  | da.tan                   | Dathan                 | **Datán**                           | Datán              |     10 |
| H2060  | vash.ti                  | Vashti                 | **Vasti**                           | Vasti              |     10 |
| H2128  | ziph                     | Ziph                   | **Zif**                             | Zif                |     10 |
| H2139  | zak.kur                  | Zaccur                 | **Zacur**                           | Zacur              |     10 |
| H3062  | ye.hu.da.i               | Jew                    | **judaíta**                         |                    |     10 |
| H3078  | ye.ho.ya.khin            | Jehoiachin             | **Joaquín**                         | Joaquín            |     10 |
| H3395  | ye.ro.cham               | Jeroham                | **Jeroham**                         | Jeroham            |     10 |
| H3774  | ke.re.ti                 | Cherethite             | **cereteo**                         | cereteos           |     10 |
| H4444  | mal.ki.shu.a             | Malchi-shua            | **Malquisúa**                       | Malquisúa          |     10 |
| H4471  | mam.re                   | Mamre                  | **Mamre**                           | Mamre              |     10 |
| H5176  | na.chash                 | Nahash                 | **Nahas**                           | Nahas              |     10 |
| H5177  | nach.shon                | Nahshon                | **Naasón**                          | Naasón             |     10 |
| H5374  | ne.riy.yah               | Neriah                 | **Nerías**                          | Nerías             |     10 |
| H5571  | san.val.lat              | Sanballat              | **Sanbalat**                        | Sanbalat           |     10 |
| H5714  | id.do                    | Iddo                   | **Iddo**                            | Iddo               |     10 |
| H5744  | o.ved                    | Obed                   | **Obed**                            | Obed               |     10 |
| H5989  | am.mi.hud                | Ammihud                | **Amiud**                           | Amiud              |     10 |
| H6147  | er                       | Er                     | **Er**                              |                    |     10 |
| H6790  | tsin                     | Zin                    | **Zin**                             | Zin                |     10 |
| H6820  | tso.ar                   | Zoar                   | **Zoar**                            | Zoar               |     10 |
| H6846  | tse.phan.yah             | Zephaniah              | **Sofonías**                        | Sofonías           |     10 |
| H6881  | tsor.ah                  | Zorah                  | **Zora**                            | Zora               |     10 |
| H6914  | qiv.rot hat.ta.a.vah     | Kibroth-hattaavah      | **Kibrot-hataava**                  | Kibrot-hataava     |     10 |
| H7025  | qir che.re.s             | Kir-hareseth           | **Kir-hareset / Kir**               | Kir-hareset        |     10 |
| H7158  | qir.yat san.nah          | Kiriath-sannah         | **Quiriat-sana / Quiriat**          | Quiriat-sana       |     10 |
| H7340  | re.chov                  | Rehob                  | **Rehob**                           | Rehob              |     10 |
| H7652  | she.va                   | Sheba                  | **Seba**                            | Seba               |     10 |
| H7935  | she.khan.yah             | Shecaniah              | **Secanías**                        | Secanías           |     10 |
| H8018  | she.lem.yah              | Shelemiah              | **Selemías**                        | Selemías           |     10 |
| H8396  | ta.vor                   | (Mount) Tabor          | **Tabor**                           | Tabor              |     10 |
| H164   | e.hud                    | Ehud                   | **Aod**                             | Aod                |      9 |
| H454   | el.ye.ho.e.nay           | Eliehoenai             | **Elioenai**                        | Elioenai           |      9 |
| H467   | e.li.phe.let             | Eliphelet              | **Elifelet**                        | Elifelet           |      9 |
| H663   | a.pheq                   | Aphek                  | **Afec**                            | Afec               |      9 |
| H728   | a.rav.nah                | Araunah                | **Arauna**                          | Arauna             |      9 |
| H775   | ar.pakh.shad             | Arpachshad             | **Arfaxad**                         | Arfaxad            |      9 |
| H863   | it.tay                   | Ittai                  | **Itai**                            | Itai               |      9 |
| H883   | be.er la.chay ro.i       | Beer-lahai-roi         | **Beer-lahai-roi**                  |                    |      9 |
| H1196  | ba.a.nah                 | Baanah                 | **Baana**                           | Baana              |      9 |
| H1212  | be.tsal.el               | Bezalel                | **Bezaleel**                        | Bezaleel           |      9 |
| H1603  | ga.al                    | Gaal                   | **Gaal**                            | Gaal               |      9 |
| H1617  | ge.ra                    | Gera                   | **Gera**                            | Gera               |      9 |
| H1650  | ge.shur                  | Geshur                 | **Gesur**                           | Gesur              |      9 |
| H1909  | ha.dad.e.zer             | Hadadezer              | **Hadad-ezer**                      | Hadad-ezer         |      9 |
| H2069  | ze.vad.yah               | Zebadiah               | **Zebadías**                        | Zebadías           |      9 |
| H2660  | che.pher                 | Hepher                 | **Hefer**                           | Hefer              |      9 |
| H2767  | chor.mah                 | Hormah                 | **Horma**                           | Horma              |      9 |
| H3096  | ya.hats                  | Jahaz                  | **Jahaza**                          | Jahaza             |      9 |
| H3103  | yo.vav                   | Jobab                  | **Jobab**                           | Jobab              |      9 |
| H3266  | ye.ush                   | Jeush                  | **Jeús**                            | Jeús               |      9 |
| H3324  | yits.har                 | Izhar                  | **Izhar**                           | Izhar              |      9 |
| H3500  | ye.ter                   | Jether                 | **Jeter**                           | Jeter              |      9 |
| H3503  | yit.ro                   | Jethro                 | **Jetro**                           | Jetro              |      9 |
| H4719  | maq.qe.dah               | Makkedah               | **Maceda**                          | Maceda             |      9 |
| H4902  | me.shekh                 | Meshech                | **Mesec**                           | Mesec              |      9 |
| H5371  | ne.re.gal shar.e.tser    | Nergal-sar-ezer        | **Nergal-sarezer**                  | Nergal-sarezer     |      9 |
| H5718  | a.da.yah                 | Adaiah                 | **Adaía**                           | Adaía              |      9 |
| H6061  | a.naq                    | Anak                   | **Anac**                            | Anac               |      9 |
| H6062  | a.na.qi                  | Anakite                | **anaceo**                          | anaceos            |      9 |
| H6163  | a.ra.vi                  | Arab                   | **árabe**                           | árabes             |      9 |
| H6439  | pe.nu.el                 | Peniel                 | **Penuel / Peniel**                 | Peniel             |      9 |
| H7597  | she.al.ti.el             | Shealtiel              | **Salatiel**                        | Salatiel           |      9 |
| H7644  | shev.na                  | Shebna                 | **Sebna**                           | Sebna              |      9 |
| H7732  | sho.val                  | Shobal                 | **Sobal**                           | Sobal              |      9 |
| H7974  | she.lach                 | Shelah                 | **Sala**                            | Sala               |      9 |
| H8352  | shet                     | Seth                   | **Set**                             | Set                |      9 |
| H8612  | to.phet                  | Topheth                | **Tofet**                           | Tofet              |      9 |
| H90    | a.gag                    | Agag                   | **Agag**                            | Agag               |      8 |
| H143   | a.dar                    | Adar                   | **Adar**                            | Adar               |      8 |
| H154   | ed.re.i                  | Edrei                  | **Edrei**                           | Edrei              |      8 |
| H173   | o.ho.li.va.mah           | Oholibamah             | **Aholibama**                       | Aholibama          |      8 |
| H209   | o.nan                    | Onan                   | **Onán**                            | Onán               |      8 |
| H221   | u.ri                     | Uri                    | **Uri**                             | Uri                |      8 |
| H359   | e.lat                    | Elath                  | **Elot / Elat**                     | Elat               |      8 |
| H763   | a.ram na.ha.ra.yim       | Mesopotamia            | **Aram de**                         |                    |      8 |
| H1020  | bet hay.shi.mot          | Beth-jeshimoth         | **Bet-jesimot**                     | Bet-jesimot        |      8 |
| H1022  | bet hal.lach.mi          | Bethlehemite           | **belemita**                        |                    |      8 |
| H1037  | bet mil.lo               | Beth-millo             | **Bet-Milo**                        |                    |      8 |
| H1047  | bet pe.or                | Beth-peor              | **Bet-peor**                        | Bet-peor           |      8 |
| H1049  | bet tsur                 | Beth-zur               | **Bet-sur**                         | Bet-sur            |      8 |
| H1075  | bikh.ri                  | Bichri                 | **Bicri**                           | Bicri              |      8 |
| H1096  | be.le.te.shats.tsar      | Belteshazzar           | **Beltsasar**                       | Beltsasar          |      8 |
| H1176  | ba.al ze.vuv             | Baal-zebub             | **Baal-zebub**                      | Baal-zebub         |      8 |
| H1186  | ba.al me.on              | Baal-meon              | **Baal-meón**                       | Baal-meón          |      8 |
| H1188  | ba.al pe.ra.tsim         | Baal-perazim           | **Baal-perazim**                    | Baal-perazim       |      8 |
| H1224  | bots.rah                 | Bozrah                 | **Bosra**                           | Bosra              |      8 |
| H1393  | giv.o.ni                 | Gibeonite              | **gabaonita**                       | gabaonitas         |      8 |
| H1533  | gil.bo.a                 | Gilboa                 | **Gilboa**                          | Gilboa             |      8 |
| H1667  | gat-rim.mon              | Gath-rimmon            | **Gat-rimón**                       | Gat-rimón          |      8 |
| H1783  | di.nah                   | Dinah                  | **Dina**                            | Dina               |      8 |
| H1893  | he.vel                   | Abel                   | **Abel**                            | Abel               |      8 |
| H2066  | za.vad                   | Zabad                  | **Zabad**                           | Zabad              |      8 |
| H2334  | chau.vot ya.ir           | Havvoth-jair           | **las aldeas de Jair**              |                    |      8 |
| H2705  | cha.tsar shu.al          | Hazar-shual            | **Hazar-sual**                      | Hazar-sual         |      8 |
| H2971  | ya.ir                    | Jair                   | **Jair**                            | Jair               |      8 |
| H2985  | ya.vin                   | Jabin                  | **Jabín**                           | Jabín              |      8 |
| H3082  | ye.ho.na.dav             | Jonadab                | **Jonadab**                         | Jonadab            |      8 |
| H3087  | ye.ho.tsa.daq            | Jehozadak              | **Josadac**                         | Josadac            |      8 |
| H3189  | ya.chat                  | Jahath                 | **Jahat**                           | Jahat              |      8 |
| H3199  | ya.khin                  | Jachin                 | **Jaquín**                          | Jaquín             |      8 |
| H3396  | ye.rach.me.el            | Jerahmeel              | **Jerameel**                        | Jerameel           |      8 |
| H3459  | yish.ma.e.li             | Ishmaelite             | **ismaelita**                       | ismaelitas         |      8 |
| H3479  | yis.ra.el                | Israel                 | **Israel**                          | Israel             |      8 |
| H3529  | ke.var                   | Chebar                 | **Quebar**                          | Quebar             |      8 |
| H3567  | ko.resh                  | Cyrus                  | **Ciro**                            | Ciro               |      8 |
| H3573  | ku.shan rish.a.ta.yim    | Cushan-rishathaim      | **Cusan-risataim**                  | Cusan-risataim     |      8 |
| H3645  | ke.mosh                  | Chemosh                | **Quemos**                          | Quemos             |      8 |
| H3756  | kar.mi                   | Carmi                  | **Carmi**                           | Carmi              |      8 |
| H3779  | kas.day                  | Chaldean               | **caldeo**                          | caldeos            |      8 |
| H3794  | kit.ti                   | Kittim                 | **quiteo**                          |                    |      8 |
| H3810  | lo de.var                | Lo-debar               | **Lodebar**                         | Lodebar            |      8 |
| H3870  | luz                      | Luz                    | **Luz**                             | Luz                |      8 |
| H4122  | ma.her sha.lal chash baz | Maher-shalal-hash-baz  | **Maher-salal-hasbaz**              | Maher-salal-hasbaz |      8 |
| H4187  | mu.shi                   | Mushi                  | **Musi**                            | Musi               |      8 |
| H4432  | mo.lekh                  | Molech                 | **Moloc**                           | Moloc              |      8 |
| H4505  | me.na.chem               | Menahem                | **Manahem**                         | Manahem            |      8 |
| H4584  | ma.on                    | Maon                   | **Maón**                            | Maón               |      8 |
| H4602  | ma.a.kha.ti              | Maacathite             | **maacateo**                        | maacateos          |      8 |
| H4993  | mat.tit.yah              | Mattithiah             | **Matatías**                        | Matatías           |      8 |
| H5166  | ne.chem.yah              | Nehemiah               | **Nehemías**                        | Nehemías           |      8 |
| H5224  | ne.kho                   | Neco                   | **Necao**                           | Necao              |      8 |
| H5658  | av.don                   | Abdon                  | **Abdón**                           | Abdón              |      8 |
| H5711  | a.dah                    | Adah                   | **Ada**                             | Ada                |      8 |
| H5725  | a.dul.lam                | Adullam                | **Adulam**                          | Adulam             |      8 |
| H5780  | uts                      | Uz                     | **Uz**                              |                    |      8 |
| H5820  | az.ma.vet                | Azmaveth               | **Azmavet**                         | Azmavet            |      8 |
| H5858  | e.val                    | Obal                   | **Ebal**                            | Ebal               |      8 |
| H5883  | en ro.gel                | En-rogel               | **En-rogel**                        |                    |      8 |
| H5899  | ir hat.t.ma.rim          | Ir-hatmarim            | **Ir-hatemarim**                    |                    |      8 |
| H6084  | oph.rah                  | Ophrah                 | **Ofra**                            | Ofra               |      8 |
| H6126  | aq.quv                   | Akkub                  | **Acub**                            | Acub               |      8 |
| H6222  | a.sa.yah                 | Asaiah                 | **Asaías**                          | Asaías             |      8 |
| H6305  | pe.da.yah                | Pedaiah                | **Pedaías**                         | Pedaías            |      8 |
| H6429  | pe.le.shet               | Philistia              | **Filistea**                        | Filistea           |      8 |
| H6449  | pis.gah                  | Pisgah                 | **Pisga**                           | Pisga              |      8 |
| H6649  | tsiv.on                  | Zibeon                 | **Zibeón**                          | Zibeón             |      8 |
| H6934  | qad.mi.el                | Kadmiel                | **Cadmiel**                         | Cadmiel            |      8 |
| H7145  | qor.chi                  | Korahite               | **coreíta**                         | coreítas           |      8 |
| H7348  | re.chum                  | Rehum                  | **Rehum**                           | Rehum              |      8 |
| H7755  | s.vo.khoh                | Socoh                  | **Soco**                            | Soco               |      8 |
| H7767  | shu.nam.mit              | Shunammites            | **sunamita**                        | sunamita           |      8 |
| H7956  | she.lah                  | Shelah                 | **Sela**                            | Sela               |      8 |
| H8019  | she.lo.mit               | Shelomith              | **Selomit**                         | Selomit            |      8 |
| H8152  | shin.ar                  | Shinar                 | **Sinar**                           | Sinar              |      8 |
| H8202  | sha.phat                 | Shaphat                | **Safat**                           | Safat              |      8 |
| H8274  | she.re.ve.yah            | Sherebiah              | **Serebías**                        | Serebías           |      8 |
| H8370  | she.tar bo.ze.nay        | Shethar-bozenai        | **Setar-boznai**                    | Setar-boznai       |      8 |
| H8422  | tu.val                   | Tubal                  | **Tubal**                           | Tubal              |      8 |
| H8489  | te.ma.ni                 | Temanite               | **temanita**                        | temanitas          |      8 |
| H44    | a.vi.e.zer               | Abiezer                | **Abiezer**                         | Abiezer            |      7 |
| H224   | u.rim                    | Urim                   | **Urim**                            | Urim               |      7 |
| H293   | a.chi.no.am              | Ahinoam                | **Ahinoam**                         | Ahinoam            |      7 |
| H356   | e.lon                    | Elon                   | **Elón**                            | Elón               |      7 |
| H387   | e.tan                    | Ethan                  | **Etán**                            | Etán               |      7 |
| H494   | el.na.tan                | Elnathan               | **Elnatán**                         | Elnatán            |      7 |
| H583   | e.nosh                   | Enosh                  | **Enós**                            | Enós               |      7 |
| H682   | a.tsel                   | Azel                   | **Azal**                            | Azal               |      7 |
| H746   | ar.yokh                  | Arioch                 | **Arioc**                           | Arioc              |      7 |
| H847   | esh.ta.ol                | Eshtaol                | **Estaol**                          | Estaol             |      7 |
| H1113  | be.le.shats.tsar         | Belshazzar             | **Belsasar**                        | Belsasar           |      7 |
| H1131  | bin.nuy                  | Binnui                 | **Binúi**                           | Binúi              |      7 |
| H1315  | bos.mat                  | Basemath               | **Basemat**                         | Basemat            |      7 |
| H1446  | ge.dor                   | Gedor                  | **Gedor**                           | Gedor              |      7 |
| H1622  | gir.ga.shi               | Girgashite             | **gergeseo**                        | gergeseo           |      7 |
| H1756  | dor                      | Dor                    | **Dor**                             | Dor                |      7 |
| H1787  | di.shon                  | Dishon                 | **Disón**                           | Disón              |      7 |
| H1806  | de.la.yah                | Delaiah                | **Delaía**                          | Delaía             |      7 |
| H2039  | ha.ran                   | Haran                  | **Harán**                           | Harán              |      7 |
| H2153  | zil.pah                  | Zilpah                 | **Zilpa**                           | Zilpa              |      7 |
| H2341  | cha.vi.lah               | Havilah                | **Havila**                          | Havila             |      7 |
| H2999  | yab.boq                  | Jabbok                 | **Jaboc**                           | Jaboc              |      7 |
| H3061  | ye.hud                   | Judah                  | **Judá**                            | Judá               |      7 |
| H3122  | yo.na.dav                | Jonadab                | **Jonadab**                         | Jonadab            |      7 |
| H3204  | ye.khon.yah              | Jeconiah               | **Jeconías**                        | Jeconías           |      7 |
| H3382  | ye.red                   | Jared                  | **Jared**                           | Jared              |      7 |
| H3412  | yar.mut                  | Jarmuth                | **Jarmut**                          | Jarmut             |      7 |
| H3449  | yish.shiy.yah            | Isshiah                | **Isías**                           | Isías              |      7 |
| H3672  | kin.n.rot                | (Sea of) Chinnereth    | **Cineret**                         | Cineret            |      7 |
| H3761  | kar.me.li                | Carmelite              | **carmelita**                       | carmelita          |      7 |
| H3877  | lo.tan                   | Lotan                  | **Lotán**                           | Lotán              |      7 |
| H3919  | la.yish                  | Laish                  | **Lais**                            | Lais               |      7 |
| H3936  | la.dan                   | Ladan                  | **Laadán**                          | Laadán             |      7 |
| H4084  | mid.ya.ni                | Midianite              | **madianita**                       | madianitas         |      7 |
| H4111  | ma.ha.lal.el             | Mahalalel              | **Mahalaleel**                      | Mahalaleel         |      7 |
| H4332  | mi.sha.el                | Mishael                | **Misael**                          | Misael             |      7 |
| H4409  | mal.lukh                 | Malluch                | **Maluc**                           | Maluc              |      7 |
| H4762  | mar.e.shah               | Mareshah               | **Maresa**                          | Maresa             |      7 |
| H4812  | me.ra.vot                | Meraioth               | **Meraiot**                         | Meraiot            |      7 |
| H5297  | noph                     | Memphis                | **Nof**                             |                    |      7 |
| H5825  | a.ze.qah                 | Azekah                 | **Azeca**                           | Azeca              |      7 |
| H5907  | akh.bor                  | Achbor                 | **Acbor**                           | Acbor              |      7 |
| H5986  | a.mos                    | Amos                   | **Amós**                            | Amós               |      7 |
| H6159  | o.rev                    | Oreb                   | **Oreb**                            | Oreb               |      7 |
| H6274  | ot.ni.el                 | Othniel                | **Otoniel**                         | Otoniel            |      7 |
| H6301  | pe.da.h.tsur             | Pedahzur               | **Pedasur**                         | Pedasur            |      7 |
| H6316  | put                      | Put                    | **Fut**                             | Fut                |      7 |
| H6367  | pi ha.chi.rot            | Pi-hahiroth            | **Pi-hahirot**                      | Pi-hahirot         |      7 |
| H6389  | pe.leg                   | Peleg                  | **Peleg**                           | Peleg              |      7 |
| H6432  | pe.le.ti                 | Pelethite              | **correo**                          |                    |      7 |
| H6701  | tsu.ri.shad.day          | Zurishaddai            | **Zurisadai**                       | Zurisadai          |      7 |
| H6814  | tso.an                   | Zoan                   | **Zoán**                            | Zoán               |      7 |
| H6834  | tsip.por                 | Zippor                 | **Zipor**                           | Zipor              |      7 |
| H7156  | qir.ya.ta.yim            | Kiriathaim             | **Quiriataim**                      | quiriataim         |      7 |
| H7410  | ram                      | Ram                    | **Ram**                             | Ram                |      7 |
| H7645  | she.van.yah              | Shebaniah              | **Sebanías**                        | Sebanías           |      7 |
| H7895  | shi.shaq                 | Shishak                | **Sisac**                           | Sisac              |      7 |
| H8048  | sham.mah                 | Shammah                | **Sama**                            | Sama               |      7 |
| H8289  | sha.ron                  | Lasharon               | **Sarón**                           | Sarón              |      7 |
| H8471  | tach.pan.ches            | Tahpanhes              | **Tafnes**                          | Tafnes             |      7 |
| H8590  | ta.a.nakh                | Taanach                | **Taanac**                          | Taanac             |      7 |
| H8620  | te.qo.a                  | Tekoa                  | **Tecoa**                           | Tecoa              |      7 |
| H8621  | te.qo.i                  | Tekoa                  | **tecoíta**                         | tecoíta            |      7 |
| H32    | a.vi.ha.yil              | Abihail                | **Abihail / Abicail**               | Abihail            |      6 |
| H33    | a.vi ha.ez.ri            | Abiezrite              | **abiezrita**                       |                    |      6 |
| H65    | a.vel me.cho.lah         | Abel-meholah           | **Abel-mehola**                     | Abel-mehola        |      6 |
| H72    | e.ven ha.e.zer           | Ebenezer               | **Eben-ezer**                       | Eben-ezer          |      6 |
| H137   | a.do.ni-ve.zeq           | Adoni-bezek            | **Adoni-bézec**                     | Adoni-bezec        |      6 |
| H172   | o.ho.li.vah              | Oholibah               | **Aholibá**                         | Aholiba            |      6 |
| H283   | ach.yo                   | Ahio                   | **Ahío**                            | Ahío               |      6 |
| H295   | a.chi.e.zer              | Ahiezer                | **Ahiezer**                         | Ahiezer            |      6 |
| H345   | ay.yah                   | Aiah                   | **Ajá**                             | Aja                |      6 |
| H362   | e.lim                    | Elim                   | **Elim**                            | Elim               |      6 |
| H458   | e.li.me.lekh             | Elimelech              | **Elimelec**                        | Elimelec           |      6 |
| H460   | el.ya.saph               | Eliasaph               | **Eliasaf**                         | Eliasaf            |      6 |
| H469   | e.li.tsa.phan            | Elizaphan              | **Elizafán / Elzafán**              | Elzafán            |      6 |
| H501   | el.a.sah                 | Eleasah                | **Elasa**                           | Elasa              |      6 |
| H634   | e.sar-chad.don           | Esarhaddon             | **Esar-hadón**                      | Esar-hadón         |      6 |
| H740   | a.ri.el                  | Ariel                  | **Ariel**                           | Ariel              |      6 |
| H757   | ar.ki                    | Archite                | **arquita**                         | arquitas           |      6 |
| H774   | ar.pad                   | Arpad                  | **Arfad**                           | Arfad              |      6 |
| H812   | esh.kol                  | Eshcol                 | **Escol**                           | Escol              |      6 |
| H851   | esh.te.mo.a              | Eshtemoa               | **Estemoa / Estemo**                | Estemoa            |      6 |
| H881   | be.e.rot                 | Beeroth                | **Beerot**                          | Beerot             |      6 |
| H893   | be.vay                   | Bebai                  | **Bebai**                           | Bebai              |      6 |
| H902   | big.vay                  | Bigvai                 | **Bigvai**                          | Bigvai             |      6 |
| H1026  | bet ha.a.ra.vah          | Beth-arabah            | **Bet-ha-Arabá**                    |                    |      6 |
| H1031  | bet chog.lah             | Beth-hoglah            | **Bet-Hogla**                       | Bet-hogla          |      6 |
| H1043  | bet a.nat                | Beth-anath             | **Bet-Anat**                        | Bet-anat           |      6 |
| H1142  | be.ne ya.a.qan           | Bene-jaakan            | **Bene-jaacán**                     | Bene-jaacán        |      6 |
| H1171  | ba.al gad                | Baal-gad               | **Baal-gad**                        | Baal-gad           |      6 |
| H1173  | ba.a.lah                 | (Mount) Baalah         | **Baalá**                           | Baala              |      6 |
| H1189  | ba.al tse.phon           | Baal-zephon            | **Baal-zefón**                      | Baal-zefón         |      6 |
| H1405  | gib.b.ton                | Gibbethon              | **Gibetón**                         | Gibetón            |      6 |
| H1521  | gi.chon                  | Gihon                  | **Gihón**                           | Gihón              |      6 |
| H1551  | ga.lil                   | Galilee                | **Galil**                           | Galilea            |      6 |
| H1555  | gol.yat                  | Goliath                | **Goliat**                          | Goliat             |      6 |
| H1586  | go.mer                   | Gomer                  | **Gomer**                           | Gomer              |      6 |
| H1651  | ge.shu.ri                | Geshurite              | **gesurita**                        | gesuritas          |      6 |
| H1807  | de.li.lah                | Delilah                | **Dalila**                          | Dalila             |      6 |
| H1905  | hag.ri                   | Hagri                  | **agareno**                         | agarenos           |      6 |
| H2062  | ze.ev                    | Zeeb                   | **Zeeb**                            | Zeeb               |      6 |
| H2067  | zav.di                   | Zabdi                  | **Zabdi**                           | Zabdi              |      6 |
| H2083  | ze.vul                   | Zebul                  | **Zebul**                           | Zebul              |      6 |
| H2227  | zar.chi                  | Zerahite               | **zaraíta**                         |                    |      6 |
| H2276  | chev.ro.ni               | Hebronite              | **hebronita**                       | hebronitas         |      6 |
| H2698  | cha.tse.rot              | Hazeroth               | **Hazerot**                         | Hazerot            |      6 |
| H2704  | cha.tsar e.nan           | Hazar-enan             | **Hazar-enán**                      | Hazar-enán         |      6 |
| H2752  | cho.ri                   | Horite                 | **horeo**                           | horeos             |      6 |
| H3043  | ye.di.a.el               | Jediael                | **Jediael**                         | Jediael            |      6 |
| H3166  | ya.cha.zi.el             | Jahaziel               | **Jahaziel**                        | Jahaziel           |      6 |
| H3226  | ya.min                   | Jamin                  | **Jamín**                           | Jamín              |      6 |
| H3278  | ya.el                    | Jael                   | **Jael**                            | Jael               |      6 |
| H3355  | yoq.tan                  | Joktan                 | **Joctán**                          | Joctán             |      6 |
| H3882  | liv.ya.tan               | Leviathan              | **leviatán**                        | Leviatán           |      6 |
| H4375  | makh.pe.lah              | Machpelah              | **Macpela**                         | Macpela            |      6 |
| H4407  | mil.lo                   | Millo                  | **Milo**                            | Milo               |      6 |
| H4708  | mits.peh                 | Mizpeh                 | **Mizpa**                           | Mizpa              |      6 |
| H4807  | me.riv ba.al             | Merib-baal             | **Merib-baal**                      | Merib-baal         |      6 |
| H4822  | me.re.mot                | Meremoth               | **Meremot**                         | Meremot            |      6 |
| H4968  | me.tu.she.lach           | Methuselah             | **Matusalén**                       | Matusalén          |      6 |
| H5011  | nov                      | Nob                    | **Nob**                             | Nob                |      6 |
| H5121  | na.vit                   | Naioth                 | **Naiot**                           | Naiot              |      6 |
| H5512  | sin                      | Pelusium               | **Sin**                             | Sin                |      6 |
| H5543  | sal.lu                   | Sallu                  | **Salú / Salai**                    | Salu               |      6 |
| H5617  | se.phar.va.yim           | Sepharvaim             | **sefarvitas**                      |                    |      6 |
| H5651  | e.ved                    | Ebed                   | **Ebed**                            | Ebed               |      6 |
| H5832  | a.zar.el                 | Azarel                 | **Azarel**                          |                    |      6 |
| H5840  | az.ri.qam                | Azrikam                | **Azricam**                         | Azricam            |      6 |
| H5873  | en gan.nim               | En-gannim              | **En-ganim**                        | En-ganim           |      6 |
| H5874  | en-dor                   | En-dor                 | **Endor**                           | Endor              |      6 |
| H5896  | i.ra                     | Ira                    | **Ira**                             | Ira                |      6 |
| H5912  | a.khan                   | Achan                  | **Acán**                            | Acán               |      6 |
| H5988  | am.mi.el                 | Ammiel                 | **Amiel**                           | Amiel              |      6 |
| H6144  | ar                       | Ar                     | **Ar**                              |                    |      6 |
| H6152  | a.rav                    | Arabia                 | **Arabia**                          | Arabia             |      6 |
| H6319  | po.ti phe.ra             | Potiphera              | **Potifera**                        | Potifera           |      6 |
| H6540  | pa.ras                   | Persia                 | **Persia**                          | Persia             |      6 |
| H6551  | par.osh                  | Parosh                 | **Paros**                           | Paros              |      6 |
| H6976  | qots                     | Koz                    | **Cos**                             | Cos                |      6 |
| H7018  | qe.nan                   | Kenan                  | **Cainán**                          | Cainán             |      6 |
| H7028  | qi.shon                  | Kishon                 | **Cisón**                           | Cisón              |      6 |
| H7249  | rav-sa.ris               | Rab-saris              | **Rabsaris**                        | Rabsaris           |      6 |
| H7552  | re.qem                   | Rekem                  | **Requem**                          | Requem             |      6 |
| H7619  | she.vu.el                | Shebuel                | **Sebuel / Subael**                 | Sebuel             |      6 |
| H7643  | se.vam                   | Sebam                  | **Sebam / Sibma**                   | Sebam              |      6 |
| H7793  | shur                     | Shur                   | **Shur**                            | Shur               |      6 |
| H7888  | shi.lo.ni                | Shilonite              | **silonita**                        | silonita           |      6 |
| H8060  | sham.may                 | Shammai                | **Samai**                           | Samai              |      6 |
| H8439  | to.la                    | Tola                   | **Tola**                            | Tola               |      6 |
| H8480  | ta.chat                  | Tahath                 | **Tahat**                           | Tahat              |      6 |
| H8526  | tal.may                  | Talmai                 | **Talmai**                          | Talmai             |      6 |
| H8555  | tim.na                   | Timna                  | **Timna**                           | Timna              |      6 |
| H8556  | tim.nat che.res          | Timnath-heres          | **Timnat-heres**                    |                    |      6 |
| H8599  | tap.pu.ach               | Tappuah                | **Tapúah**                          |                    |      6 |
| H8664  | tish.bi                  | Tishbite               | **tisbita**                         | tisbita            |      6 |
| H11    | a.vad.don                | Abaddon                | **Abadón**                          | Abadón             |      5 |
| H27    | a.vi.dan                 | Abidan                 | **Abidán**                          | Abidán             |      5 |
| H38    | a.viy.yam                | Abijam                 | **Abiam**                           | Abiam              |      5 |
| H49    | a.vi.shag                | Abishag                | **Abisag**                          | Abisag             |      5 |
| H50    | a.vi.shu.a               | Abishua                | **Abisúa**                          | Abisúa             |      5 |
| H91    | a.ga.gi                  | Agagite                | **agagueo**                         | agagueo            |      5 |
| H126   | ad.mah                   | Admah                  | **Adma**                            | Adma               |      5 |
| H170   | o.ho.lah                 | Oholah                 | **Aholá**                           | Ahola              |      5 |
| H171   | o.ho.li.av               | Oholiab                | **Aholiab**                         | Aholiab            |      5 |
| H207   | o.no                     | Ono                    | **Ono**                             | Ono                |      5 |
| H218   | ur                       | Ur                     | **Ur**                              |                    |      5 |
| H266   | a.cho.chi                | Ahohite                | **ahohíta**                         | ahohíta            |      5 |
| H286   | a.chi.lud                | Ahilud                 | **Ahilud**                          | Ahilud             |      5 |
| H299   | a.chi.ra                 | Ahira                  | **Ahira**                           | Ahira              |      5 |
| H333   | a.ter                    | Ater                   | **Ater**                            | Ater               |      5 |
| H468   | e.li.tsur                | Elizur                 | **Elizur**                          | Elizur             |      5 |
| H500   | el.a.le                  | Elealeh                | **Eleale**                          | Eleale             |      5 |
| H673   | eph.ra.ti                | Ephraimite             | **efrateo**                         | efrateo            |      5 |
| H687   | e.tser                   | Ezer                   | **Ezer**                            | Ezer               |      5 |
| H709   | ar.gov                   | Argob                  | **Argob**                           | Argob              |      5 |
| H796   | ash.do.di                | Ashdod                 | **asdodeo**                         | asdodeo            |      5 |
| H886   | be.e.ro.ti               | Beerothite             | **beerotita**                       | beerotita          |      5 |
| H980   | ba.chu.rim               | Bahurim                | **Bahurim**                         | Bahurim            |      5 |
| H1071  | be.kher                  | Becher                 | **Bequer**                          | Bequer             |      5 |
| H1085  | bil.dad                  | Bildad                 | **Bildad**                          | Bildad             |      5 |
| H1221  | be.tser                  | Bezer                  | **Bezer**                           |                    |      5 |
| H1231  | buq.qi                   | Bukki                  | **Buqui**                           | Buqui              |      5 |
| H1441  | gid.o.ni                 | Gideoni                | **Gedeoni**                         | Gedeoni            |      5 |
| H1470  | go.zan                   | Gozan                  | **Gozán**                           | Gozán              |      5 |
| H1583  | gam.li.el                | Gamaliel               | **Gamaliel**                        | Gamaliel           |      5 |
| H1587  | ge.mar.yah               | Gemariah               | **Gemarías**                        | Gemarías           |      5 |
| H1673  | do.eg                    | Doeg                   | **Doeg**                            | Doeg               |      5 |
| H1734  | do.do                    | Dodo                   | **Dodo**                            | Dodo               |      5 |
| H1789  | di.shan                  | Dishan                 | **Disán**                           | Disán              |      5 |
| H1839  | da.ni                    | Danite                 | **danita**                          |                    |      5 |
| H1941  | ho.diy.yah               | Hodiah                 | **Hodías**                          | Hodías             |      5 |
| H2043  | ha.ra.ri                 | Hararite               | **hararita**                        |                    |      5 |
| H2182  | za.no.ach                | Zanoah                 | **Zanoa**                           | Zanoa              |      5 |
| H2228  | ze.rach.yah              | Zerahiah               | **Zeraías**                         | Zeraías            |      5 |
| H2294  | chag.git                 | Haggith                | **Haguit**                          | Haguit             |      5 |
| H2407  | chat.tush                | Hattush                | **Hatús**                           | Hatús              |      5 |
| H2497  | che.lon                  | Helon                  | **Helón**                           | Helón              |      5 |
| H2503  | che.lets                 | Helez                  | **Heles**                           | Heles              |      5 |
| H2621  | cho.sah                  | Hosah                  | **Hosa**                            | Hosa               |      5 |
| H2652  | choph.ni                 | Hophni                 | **Ofni**                            | Ofni               |      5 |
| H2815  | chash.shuv               | Hasshub                | **Hasub**                           | Hasub              |      5 |
| H2828  | cha.shum                 | Hashum                 | **Hasum**                           | Hasum              |      5 |
| H2843  | chu.sha.ti               | Hushathite             | **husatita**                        | husatita           |      5 |
| H2929  | tal.mon                  | Talmon                 | **Talmón**                          | Talmón             |      5 |
| H2970  | ya.a.zan.yah             | Jaazaniah              | **Jaazanías**                       | Jaazanías          |      5 |
| H3111  | yo.ya.da                 | Joiada                 | **Joiada**                          | Joiada             |      5 |
| H3114  | yo.ya.riv                | Joiarib                | **Joiarib**                         | Joiarib            |      5 |
| H3136  | yo.tsa.daq               | Jozadak                | **Josadac**                         | Josadac            |      5 |
| H3232  | yim.nah                  | Imnah                  | **Imna**                            | Imna               |      5 |
| H3309  | ya.phi.a                 | Japhia                 | **Jafía**                           | Jafía              |      5 |
| H3469  | yish.i                   | Ishi                   | **Isi**                             | Isi                |      5 |
| H3481  | yis.r.e.li               | Ishmaelite             | **israelita**                       | israelita          |      5 |
| H3505  | yit.ri                   | Ithrite                | **itrita**                          | itrita             |      5 |
| H3540  | ke.dor.la.o.mer          | Chedorlaomer           | **Quedorlaomer**                    |                    |      5 |
| H3668  | ke.na.a.nah              | Chenaanah              | **Quenaana**                        | Quenaana           |      5 |
| H3845  | liv.ni                   | Libni                  | **Libni**                           | Libni              |      5 |
| H3865  | lud                      | Lud                    | **Lud**                             | Lud                |      5 |
| H4076  | ma.day                   | Mede                   | **Media**                           | Media              |      5 |
| H4099  | me.da.ta                 | Hammedatha             | **Medata**                          |                    |      5 |
| H4162  | mo.tsa                   | Moza                   | **Mosa**                            | Mosa               |      5 |
| H4244  | mach.lah                 | Mahlah                 | **Maala**                           | Maala              |      5 |
| H4311  | me.de.va                 | Medeba                 | **Medeba**                          | Medeba             |      5 |
| H4506  | ma.na.chat               | Manahathite            | **Manahat**                         | Manahat            |      5 |
| H4532  | mas.sah                  | Massah                 | **Masah**                           | Masah              |      5 |
| H4693  | ma.tsor                  | Egypt                  | **Egipto**                          | Egipto             |      5 |
| H4785  | ma.rah                   | Marah                  | **Mara**                            | Mara               |      5 |
| H4996  | no                       | Thebes                 | **No**                              |                    |      5 |
| H5032  | ne.va.vot                | Nebaioth               | **Nebaiot**                         | Nebaiot            |      5 |
| H5184  | na.chat                  | Nahath                 | **Nahat**                           | Nahat              |      5 |
| H5250  | nim.shi                  | Nimshi                 | **Nimsi**                           | Nimsi              |      5 |
| H5279  | na.a.mah                 | Naamah                 | **Naama**                           | Naama              |      5 |
| H5682  | a.va.rim                 | Abarim                 | **Abarim**                          | Abarim             |      5 |
| H5829  | e.zer                    | Ezer                   | **Ezer**                            | Ezer               |      5 |
| H5862  | e.tam                    | Etam                   | **Etam**                            | Etam               |      5 |
| H5871  | a.yin                    | Ain                    | **Aín**                             | Ain                |      5 |
| H5881  | e.nan                    | Enan                   | **Enán**                            | Enán               |      5 |
| H5891  | e.phah                   | Ephah                  | **Efa**                             | Efa                |      5 |
| H5911  | a.khor                   | (Valley of) Achor      | **Acor**                            | Acor               |      5 |
| H5915  | akh.sah                  | Achsah                 | **Acsa**                            | Acsa               |      5 |
| H5918  | okh.ran                  | Ochran                 | **Ocrán**                           | Ocrán              |      5 |
| H5996  | am.mi.shad.day           | Ammishaddai            | **Amisadai**                        | Amisadai           |      5 |
| H6022  | a.ma.say                 | Amasai                 | **Amasai**                          | Amasai             |      5 |
| H6069  | an.to.ti                 | Anathoth               | **anatotita**                       | anatotita          |      5 |
| H6077  | o.phel                   | Ophel                  | **Ofel**                            | Ofel               |      5 |
| H6166  | a.rad                    | Arad                   | **Arad**                            | Arad               |      5 |
| H6295  | pag.i.el                 | Pagiel                 | **Pagiel**                          | Pagiel             |      5 |
| H6396  | pal.lu                   | Pallu                  | **Falú**                            | Falú               |      5 |
| H6410  | pe.lat.yah               | Pelatiah               | **Pelatías**                        | Pelatías           |      5 |
| H6465  | pe.or                    | Peor                   | **Peor**                            | Peor               |      5 |
| H6553  | pir.a.to.ni              | Pirathon               | **piratonita**                      | piratonita         |      5 |
| H6624  | pat.ros                  | Pathros                | **Patros**                          | Patros             |      5 |
| H6636  | tse.vo.im                | Zeboiim                | **Zeboim / Zebijim**                | Zeboim             |      5 |
| H6686  | tsu.ar                   | Zuar                   | **Zuar**                            | Zuar               |      5 |
| H6698  | tsur                     | Zur                    | **Zur**                             | Zur                |      5 |
| H6714  | tso.char                 | Zohar                  | **Zohar**                           | Zohar              |      5 |
| H6876  | tso.ri                   | Tyrian                 | **tirio**                           | tirios             |      5 |
| H7024  | qir                      | Kir                    | **Kir**                             | Kir                |      5 |
| H7343  | ra.chav                  | Rahab                  | **Rahab**                           | Rahab              |      5 |
| H7345  | re.chav.yah              | Rehabiah               | **Rehabías**                        | Rehabías           |      5 |
| H7397  | re.kha.vi                | Rechabite              | **Reca**                            | Reca               |      5 |
| H7466  | re.u                     | Reu                    | **Reu**                             | Reu                |      5 |
| H7484  | ra.mah                   | Raamah                 | **Raama**                           | Raama              |      5 |
| H7486  | ra.me.ses                | Rameses                | **Ramesés / Raamses**               | Ramesés            |      5 |
| H7508  | re.phi.dim               | Rephidim               | **Refidim**                         | Refidim            |      5 |
| H7509  | re.pha.yah               | Rephaiah               | **Refaías**                         | Refaías            |      5 |
| H7707  | she.de.ur                | Shedeur                | **Sedeur**                          | Sedeur             |      5 |
| H7747  | shu.chi                  | Shuhite                | **suhita**                          | suhita             |      5 |
| H7851  | shit.tim                 | Shittim                | **Sitim**                           | Sitim              |      5 |
| H8017  | she.lu.mi.el             | Shelumiel              | **Selumiel**                        | Selumiel           |      5 |
| H8051  | sham.mu.a                | Shammua                | **Samúa**                           | Samúa              |      5 |
| H8087  | she.ma                   | Shema                  | **Sema**                            | Sema               |      5 |
| H8092  | shim.ah, shim.a          | Shimea                 | **Sima**                            |                    |      5 |
| H8106  | she.mer                  | Shemer                 | **Semer**                           | Semer              |      5 |
| H8110  | shim.ron                 | Shimron                | **Simrón**                          | Simrón             |      5 |
| H8286  | se.rug                   | Serug                  | **Serug**                           | Serug              |      5 |
| H8348  | she.shan                 | Sheshan                | **Sesán**                           | Sesán              |      5 |
| H8485  | te.ma                    | Tema                   | **Tema**                            | Tema               |      5 |
| H8583  | to.u                     | Toi                    | **Toú / Toi**                       | Toi                |      5 |
| H8660  | tir.sha.ta               | governor               | **Tirsata**                         |                    |      5 |
| H42    | a.vi.no.am               | Abinoam                | **Abinoam**                         | Abinoam            |      4 |
| H88    | o.vot                    | Oboth                  | **Obot**                            | Obot               |      4 |
| H139   | a.do.ni-tse.deq          | Adoni-zedek            | **Adoni-sedec**                     |                    |      4 |
| H192   | e.vil me.ro.dakh         | Evil-merodach          | **Evil-merodac**                    | Evil-merodac       |      4 |
| H198   | u.lam                    | Ulam                   | **Ulam**                            | Ulam               |      4 |
| H204   | on                       | On                     | **On**                              |                    |      4 |
| H208   | o.nam                    | Onam                   | **Onam**                            | Onam               |      4 |
| H222   | u.ri.el                  | Uriel                  | **Uriel**                           | Uriel              |      4 |
| H289   | a.chi.man                | Ahiman                 | **Ahimán**                          | Ahimán             |      4 |
| H392   | akh.ziv                  | Achzib                 | **Aczib**                           | Aczib              |      4 |
| H445   | el.cha.nan               | Elhanan                | **Elhanán**                         | Elhanán            |      4 |
| H450   | el.ya.da                 | Eliada                 | **Eliada**                          | Eliada             |      4 |
| H617   | as.sir                   | Assir                  | **Asir**                            | Asir               |      4 |
| H733   | a.rach                   | Arah                   | **Ara**                             | Ara                |      4 |
| H780   | a.ra.rat                 | Ararat                 | **Ararat**                          | Ararat             |      4 |
| H798   | ash.dot hap.pis.gah      | Slopes (of Pisgah)     | **Asdot-pisga**                     |                    |      4 |
| H864   | e.tam                    | Etham                  | **Etam**                            | Etam               |      4 |
| H1012  | bet ba.rah               | Beth-barah             | **Bet-bara**                        | Bet-bara           |      4 |
| H1016  | bet-da.gon               | Beth-dagon             | **Bet-dagón**                       | Bet-dagón          |      4 |
| H1021  | bet hak.ke.rem           | Beth-haccherem         | **Bet-haquerem**                    | Bet-haquerem       |      4 |
| H1024  | bet ham.mar.ka.vot       | Beth-marcaboth         | **Bet-hamarcabot / Bet**            |                    |      4 |
| H1030  | bet hash.shim.shi        | Bethshemite            | **bet-semita**                      |                    |      4 |
| H1039  | bet nim.rah              | Beth-nimrah            | **Bet-nimra**                       | Bet-nimra          |      4 |
| H1044  | bet e.qed                | Beth-eked              | **Bet-equed**                       |                    |      4 |
| H1046  | bet pe.let               | Beth-pelet             | **Bet-pelet**                       | Bet-pelet          |      4 |
| H1050  | bet re.chov              | Beth-rehob             | **Bet-rehob**                       | Bet-rehob          |      4 |
| H1092  | bil.han                  | Bilhan                 | **Bilhán**                          | Bilhán             |      4 |
| H1120  | ba.mot                   | Bamoth                 | **Bamot / Bamot-baal**              | Bamot              |      4 |
| H1170  | ba.al be.rit             | Baal-berith            | **Baal-berit**                      | Baal-berit         |      4 |
| H1179  | ba.al cher.mon           | (Mount) Baal-hermon    | **Baal-hermón**                     | Baal-hermón        |      4 |
| H1435  | gid.del                  | Giddel                 | **Gidel**                           | Gidel              |      4 |
| H1474  | go.lan                   | Golan                  | **Golán**                           | Golán              |      4 |
| H1476  | gu.ni                    | Guni                   | **Guni**                            | Guni               |      4 |
| H1608  | ga.ash                   | Gaash                  | **Gaas**                            | Gaas               |      4 |
| H1630  | ge.ri.zim                | (Mount) Gerizim        | **Gerizim**                         | Gerizim            |      4 |
| H1654  | ge.shem                  | Geshem                 | **Gesem / Gasmu**                   | Gesem              |      4 |
| H1662  | gat-ha.che.pher          | Gath-hepher            | **Gat-hefer**                       | Gat-hefer          |      4 |
| H1845  | de.u.el                  | Deuel                  | **Deuel**                           | Deuel              |      4 |
| H1896  | he.ge                    | Hegai                  | **Hegé / Hegai**                    | Hegai              |      4 |
| H1913  | ha.do.ram                | Hadoram                | **Hadoram**                         |                    |      4 |
| H1938  | ho.dav.yah               | Hodaviah               | **Hodavías**                        | Hodavías           |      4 |
| H1996  | ha.mon gog               | Hamon-gog (Valley)     | **la multitud de Gog**              |                    |      4 |
| H2047  | ha.takh                  | Hathach                | **Hatac**                           | Hatac              |      4 |
| H2218  | ze.red                   | Zered                  | **Zered**                           | Zered              |      4 |
| H2238  | ze.resh                  | Zeresh                 | **Zeres**                           | Zeres              |      4 |
| H2240  | zat.tu                   | Zattu                  | **Zatu**                            | Zatu               |      4 |
| H2295  | chog.lah                 | Hoglah                 | **Hogla**                           | Hogla              |      4 |
| H2366  | chu.shim                 | Hushim                 | **Husim**                           | Husim              |      4 |
| H2367  | chu.sham                 | Husham                 | **Husam**                           | Husam              |      4 |
| H2582  | che.na.dad               | Henadad                | **Henadad**                         | Henadad            |      4 |
| H2601  | cha.nam.el               | Hanamel                | **Hanameel**                        | Hanameel           |      4 |
| H2606  | cha.nan.el               | (Tower of) Hananel     | **Hananeel**                        | Hananeel           |      4 |
| H2657  | cheph.tsi bah            | Hephzibah              | **Hefzi-bá**                        | Hefzi-bá           |      4 |
| H2688  | chats.tson ta.mar        | Hazazon-tamar          | **Hazezon-tamar**                   | Hazezón-tamar      |      4 |
| H2735  | chor hag.gid.gad         | Hor-haggidgad          | **Hor-gidgad**                      |                    |      4 |
| H2753  | cho.ri                   | Hori                   | **Hori**                            | Hori               |      4 |
| H2773  | cho.ro.na.yim            | Horonaim               | **Horonaim**                        | Horonaim           |      4 |
| H2897  | tov                      | Tob                    | **Tob**                             | Tob                |      4 |
| H2982  | ye.vus                   | Jebus                  | **Jebús**                           | Jebús              |      4 |
| H3065  | ye.hu.di                 | Jehudi                 | **Jehudí**                          | Jehudí             |      4 |
| H3075  | ye.ho.za.vad             | Jehozabad              | **Jozabad**                         | Jozabad            |      4 |
| H3099  | yo.a.chaz                | Joahaz                 | **Joacaz**                          | Joacaz             |      4 |
| H3113  | yo.ya.qim                | Joiakim                | **Joacim**                          |                    |      4 |
| H3169  | ye.chiz.qiy.yah          | Jehizkiah              | **Ezequías**                        | Ezequías           |      4 |
| H3229  | yim.lah                  | Imlah                  | **Imla**                            | Imla               |      4 |
| H3258  | ya.bets                  | Jabez                  | **Jabes**                           | Jabes              |      4 |
| H3281  | ya.lam                   | Jalam                  | **Jalam**                           |                    |      4 |
| H3305  | ya.pho                   | Joppa                  | **Jope**                            | Jope               |      4 |
| H3317  | yiph.tach-el             | (Valley of) Iphtahel   | **Jefte-el**                        | Jefte-el           |      4 |
| H3325  | yits.ha.ri               | Izharite               | **izharita**                        | izharitas          |      4 |
| H3370  | yoq.shan                 | Jokshan                | **Jocsán**                          | Jocsán             |      4 |
| H3440  | yish.vi                  | Ishvi                  | **Isúi**                            | Isúi               |      4 |
| H3446  | yis.chaq                 | Isaac                  | **Isaac**                           | Isaac              |      4 |
| H3484  | ye.shu.run               | Jeshurun               | **Jesurún**                         | Jesurún            |      4 |
| H3492  | yat.tir                  | Jattir                 | **Jatir**                           | Jatir              |      4 |
| H3626  | kol-cho.zeh              | Col-hozeh              | **Col-hoze**                        |                    |      4 |
| H3716  | ke.phi.rah               | Chephirah              | **Quefira**                         |                    |      4 |
| H3819  | lo ru.cha.mah            | No Mercy               | **Lo-ruhama**                       | Lo-ruhama          |      4 |
| H3850  | lod                      | Lod                    | **Lod**                             | Lod                |      4 |
| H3864  | lu.vi                    | Libyan                 | **libio**                           | libios             |      4 |
| H4029  | mig.dal-e.der            | tower of Eder          | **Migdal-edar**                     |                    |      4 |
| H4031  | ma.gog                   | Magog                  | **Magog**                           | Magog              |      4 |
| H4137  | mo.la.dah                | Moladah                | **Molada**                          | Molada             |      4 |
| H4158  | mo.pha.at                | Mephaath               | **Mefaat**                          | Mefaat             |      4 |
| H4248  | mach.lon                 | Mahlon                 | **Mahlón**                          | Mahlón             |      4 |
| H4265  | ma.cha.neh-dan           | Mahaneh-dan            | **Mahane-dan**                      |                    |      4 |
| H4314  | me za.hav                | Mezahab                | **Mezaab**                          | Mezaab             |      4 |
| H4316  | mi.kah                   | Mica                   | **Micá**                            | Micaía             |      4 |
| H4326  | miy.ya.min               | Mijamin                | **Miamín**                          |                    |      4 |
| H4442  | mal.ki-tse.deq           | Melchizedek            | **Melquisedec**                     | Melquisedec        |      4 |
| H4445  | mal.kam                  | Malcam                 | **Malcam / Milcom**                 | Milcom             |      4 |
| H4520  | me.nash.shi              | Manassite              | **manasita**                        |                    |      4 |
| H4586  | me.u.ni                  | Meunite                | **meunita**                         |                    |      4 |
| H4610  | ma.a.leh aq.rab.bim      | Akrabbim               | **Subida de los Escorpiones**       |                    |      4 |
| H4732  | miq.lot                  | Mikloth                | **Miclot**                          | Miclot             |      4 |
| H4848  | me.ra.ri                 | Merari                 | **merarita**                        | meraritas          |      4 |
| H4920  | me.she.lem.yah           | Meshelemiah            | **Meselemías**                      | Meselemías         |      4 |
| H4927  | mish.ma                  | Mishma                 | **Misma**                           | Misma              |      4 |
| H4956  | mis.r.phot ma.yim        | Misrephoth-maim        | **Misrefot-maim**                   |                    |      4 |
| H5248  | nim.rod                  | Nimrod                 | **Nimrod**                          | Nimrod             |      4 |
| H5270  | no.ah                    | Noah                   | **Noa**                             | Noa                |      4 |
| H5284  | na.a.ma.ti               | Naamathite             | **naamatita**                       | naamatita          |      4 |
| H5292  | na.a.rah                 | Naarah                 | **Naara**                           | Naarat             |      4 |
| H5298  | ne.pheg                  | Nepheg                 | **Nefeg**                           | Nefeg              |      4 |
| H5353  | ne.qo.da                 | Nekoda                 | **Necoda**                          | Necoda             |      4 |
| H5434  | se.va                    | Seba                   | **Seba**                            | Seba               |      4 |
| H5444  | sib.b.khay               | Sibbecai               | **Sibecai**                         | Sibecai            |      4 |
| H5548  | sal.khah                 | Salecah                | **Salca**                           | Salca              |      4 |
| H5554  | se.la                    | Sela                   | **Sela**                            | Sela               |      4 |
| H5570  | se.na.ah                 | Senaah                 | **Sena**                            | Senaa              |      4 |
| H5720  | a.din                    | Adin                   | **Adín**                            | Adín               |      4 |
| H5755  | iv.vah                   | Ivvah                  | **Iva / Ava**                       | Ava                |      4 |
| H5761  | av.vim                   | Avvim                  | **Avim**                            | Avim               |      4 |
| H5803  | az.gad                   | Azgad                  | **Azgad**                           | Azgad              |      4 |
| H5806  | a.zu.vah                 | Azubah                 | **Azuba**                           | Azuba              |      4 |
| H5852  | a.ta.rot                 | Ataroth                | **Atarot**                          | Atarot             |      4 |
| H5853  | at.rot ad.dar            | Ataroth-addar          | **Atarot-adar**                     | Atarot-adar        |      4 |
| H5863  | iy.ye ha.a.va.rim        | Iye-abarim             | **Ije-abarim**                      | Ije-abarim         |      4 |
| H5885  | en she.mesh              | En-shemesh             | **En-semes**                        | En-semes           |      4 |
| H5963  | al.mon div.la.ta.ye.mah  | Almon-diblathaim       | **Almón-diblataim**                 | Almón-diblataim    |      4 |
| H5964  | a.le.met                 | Alemeth                | **Alemet**                          | Alemet             |      4 |
| H6005  | im.ma.nu.el              | Immanuel               | **Emanuel**                         | Emanuel            |      4 |
| H6081  | e.pher                   | Epher                  | **Efer**                            | Efer               |      4 |
| H6228  | a.shan                   | Ashan                  | **Asán**                            | Asán               |      4 |
| H6262  | at.tay                   | Attai                  | **Atai**                            | Atai               |      4 |
| H6312  | pu.ah                    | Puah                   | **Fúa / Puva**                      | Fúa                |      4 |
| H6322  | pul                      | Pul                    | **Pul**                             | Pul                |      4 |
| H6380  | po.khe.ret tse.va.yim    | Pochereth-hazzebaim    | **Poqueret-hazebaim**               | Poqueret-hazebaim  |      4 |
| H6454  | pa.se.ach                | Paseah                 | **Paseah**                          | Paseah             |      4 |
| H6560  | pe.rets uz.za            | Perez-uzza             | **Pérez-uza**                       | Pérez-uza          |      4 |
| H6611  | pe.tach.yah              | Pethahiah              | **Petaías**                         | Petaías            |      4 |
| H6689  | tsuph                    | Zuph                   | **Zuf**                             | Zuf                |      4 |
| H6691  | tso.phar                 | Zophar                 | **Zofar**                           | Zofar              |      4 |
| H6932  | qe.de.mot                | Kedemoth               | **Cademot**                         | Cademot            |      4 |
| H6989  | qe.tu.rah                | Keturah                | **Cetura**                          | Cetura             |      4 |
| H7074  | qe.niz.zi                | Kenizzite              | **cenezeo**                         | cenezeos           |      4 |
| H7152  | qe.riy.yot               | Kerioth                | **Queriot**                         | Queriot            |      4 |
| H7154  | qir.yat ba.al            | Kiriath-baal           | **Quiriat-baal**                    | Quiriat-baal       |      4 |
| H7211  | re.a.yah                 | Reaiah                 | **Reaías**                          |                    |      4 |
| H7216  | ra.mot                   | Ramoth                 | **Ramot**                           | Ramot              |      4 |
| H7248  | rav-mag                  | Rab-mag                | **Rabmag**                          | Rabmag             |      4 |
| H7294  | ra.hav                   | Rahab monster          | **Rahab**                           | Rahab              |      4 |
| H7320  | ro.mam.ti e.zer          | Romamti-ezer           | **Romamti-ezer**                    |                    |      4 |
| H7344  | re.cho.vot               | Rehoboth               | **Rehobot**                         | Rehobot            |      4 |
| H7428  | rim.mon pe.rets          | Rimmon-perez           | **Rimón-peres**                     |                    |      4 |
| H7532  | rits.pah                 | Rizpah                 | **Rizpa**                           | Rizpa              |      4 |
| H7727  | sho.vav                  | Shobab                 | **Sobab**                           | Sobab              |      4 |
| H7803  | shu.te.lach              | Shuthelah              | **Sutela**                          | Sutela             |      4 |
| H7883  | shi.chor                 | Shihor                 | **Sihor**                           | Sihor              |      4 |
| H8007  | sal.ma                   | Salmon                 | **Salma**                           | Salma              |      4 |
| H8069  | sha.mir                  | Shamir                 | **Samir**                           | Samir              |      4 |
| H8070  | she.mi.ra.mot            | Shemiramoth            | **Semiramot**                       | Semiramot          |      4 |
| H8072  | sam.lah                  | Samlah                 | **Samla**                           | Samla              |      4 |
| H8099  | shim.o.ni                | Simeon                 | **simeonita**                       | simeonitas         |      4 |
| H8113  | shim.ri                  | Shimri                 | **Simri**                           | Simri              |      4 |
| H8114  | she.mar.yah              | Shemariah              | **Semarías**                        | Semarías           |      4 |
| H8124  | shim.shay                | Shimshai               | **Simsai**                          | Simsai             |      4 |
| H8149  | she.nir                  | Senir                  | **Senir**                           | Senir              |      4 |
| H8272  | shar.e.tser              | Sharezer               | **Sarezer**                         | Sarezer            |      4 |
| H8423  | tu.val qa.yin            | Tubal-cain             | **Tubal-caín**                      | Tubal-caín         |      4 |
| H8425  | to.gar.mah               | Togarmah               | **Togarma**                         | Togarma            |      4 |
| H8521  | tel char.sah             | Tel-harsha             | **Tel-harsa**                       | Tel-harsa          |      4 |
| H8528  | tel me.lach              | Tel-melah              | **Tel-mela**                        | Tel-mela           |      4 |
| H8674  | ta.te.nay                | Tattenai               | **Tatnai**                          | Tatnai             |      4 |
| H22    | a.vi.el                  | Abiel                  | **Abiel**                           | Abiel              |      3 |
| H43    | ev.ya.saph               | Ebiasaph               | **Ebiasaf**                         | Ebiasaf            |      3 |
| H140   | a.do.ni.qam              | Adonikam               | **Adonicam**                        | Adonicam           |      3 |
| H152   | a.de.ram.me.lekh         | Adrammelech            | **Adramelec**                       | Adramelec          |      3 |
| H163   | a.ha.va                  | Ahava                  | **Ahava**                           | Ahava              |      3 |
| H187   | u.zal                    | Uzal                   | **Uzal**                            | Uzal               |      3 |
| H201   | o.mar                    | Omar                   | **Omar**                            | Omar               |      3 |
| H294   | a.chi.sa.makh            | Ahisamach              | **Ahisamac**                        | Ahisamac           |      3 |
| H350   | i-kha.vod                | Ichabod                | **Icabod**                          | Icabod             |      3 |
| H358   | e.lon bet cha.nan        | Elonbeth-hanan         | **Elón-bet-hanán**                  |                    |      3 |
| H368   | e.mim                    | Emim                   | **emitas**                          | emitas             |      3 |
| H384   | i.ti.el                  | Ithiel                 | **Itiel**                           | Itiel              |      3 |
| H407   | akh.shaph                | Achshaph               | **Acsaf**                           | Acsaf              |      3 |
| H416   | el bet-el                | El-bethel              | **El-betel**                        |                    |      3 |
| H473   | e.li.shah                | Elishah                | **Elisa**                           | Elisa              |      3 |
| H508   | el.pa.al                 | Elpaal                 | **Elpaal**                          | Elpaal             |      3 |
| H621   | a.se.nat                 | Asenath                | **Asenat**                          | Asenat             |      3 |
| H671   | a.phar.se.khay           | governors              | **afarsaquita**                     |                    |      3 |
| H692   | ar.e.li                  | Areli                  | **Areli**                           | Areli              |      3 |
| H788   | ash.bel                  | Ashbel                 | **Asbel**                           | Asbel              |      3 |
| H813   | ash.ke.naz               | Ashkenaz               | **Askenaz**                         | Askenaz            |      3 |
| H844   | as.ri.el                 | Asriel                 | **Asriel**                          | Asriel             |      3 |
| H938   | buz                      | Buz                    | **Buz**                             | Buz                |      3 |
| H966   | be.zeq                   | Bezek                  | **Bezec**                           | Bezec              |      3 |
| H1078  | bel                      | Bel                    | **Bel**                             | Bel                |      3 |
| H1083  | bil.gah                  | Bilgah                 | **Bilga**                           | Bilga              |      3 |
| H1138  | bun.ni                   | Bunni                  | **Buni**                            | Buni               |      3 |
| H1191  | ba.a.lat                 | Baalath                | **Baalat**                          | Baalat             |      3 |
| H1195  | ba.a.na                  | Baana                  | **Baana**                           | Baana              |      3 |
| H1209  | be.tsay                  | Bezai                  | **Bezai**                           | Bezai              |      3 |
| H1229  | baq.buq.yah              | Bakbukiah              | **Bacbuquías**                      | Bacbuquías         |      3 |
| H1294  | be.ra.khah               | Beracah                | **Beraca**                          | Beraca             |      3 |
| H1308  | be.s.vor                 | Besor                  | **Besor**                           | Besor              |      3 |
| H1559  | ga.lal                   | Galal                  | **Galal**                           | Galal              |      3 |
| H1599  | gin.n.ton                | Ginnethon              | **Ginetón**                         | Ginetón            |      3 |
| H1609  | ga.tam                   | Gatam                  | **Gatam**                           | Gatam              |      3 |
| H1619  | ga.rev                   | Gareb                  | **Gareb**                           | Gareb              |      3 |
| H1705  | da.ve.rat                | Daberath               | **Daberat**                         | Daberat            |      3 |
| H1746  | du.mah                   | Dumah                  | **Duma**                            | Duma               |      3 |
| H1886  | do.tan                   | Dothan                 | **Dotán**                           | Dotán              |      3 |
| H1955  | ho.sha.yah               | Hoshaiah               | **Osaías**                          | Osaías             |      3 |
| H2012  | he.na                    | Hena                   | **Hena**                            | Hena               |      3 |
| H2075  | ze.vu.lo.ni              | Zebulunite             | **zabulonita**                      | zabulonitas        |      3 |
| H2140  | zak.kay                  | Zaccai                 | **Zacai**                           | Zacai              |      3 |
| H2155  | zim.mah                  | Zimmah                 | **Zima**                            | Zima               |      3 |
| H2249  | cha.vor                  | Habor                  | **Habor**                           | Habor              |      3 |
| H2291  | chag.gi                  | Haggi                  | **Hagui**                           | Hagui              |      3 |
| H2307  | cha.did                  | Hadid                  | **Hadid**                           | Hadid              |      3 |
| H2444  | cha.khi.lah              | Hachilah               | **Haquila**                         | Haquila            |      3 |
| H2473  | cho.lon                  | Holon                  | **Holón**                           | Holón              |      3 |
| H2477  | cha.lach                 | Halah                  | **Halah**                           | Halah              |      3 |
| H2537  | cha.mu.tal               | Hamutal                | **Hamutal**                         | Hamutal            |      3 |
| H2538  | cha.mul                  | Hamul                  | **Hamul**                           | Hamul              |      3 |
| H2650  | chup.pim                 | Huppim                 | **Hupim**                           | Hupim              |      3 |
| H2772  | cho.ro.ni                | Horonite               | **horonita**                        | horonita           |      3 |
| H2800  | cha.ro.shet              | Harosheth              | **Haroset**                         |                    |      3 |
| H2984  | yiv.char                 | Ibhar                  | **Ibhar**                           | Ibhar              |      3 |
| H2991  | yiv.le.am                | Ibleam                 | **Ibleam**                          | Ibleam             |      3 |
| H3008  | yig.al                   | Igal                   | **Igal**                            | Igal               |      3 |
| H3037  | yad.du.a                 | Jaddua                 | **Jadúa**                           | Jadúa              |      3 |
| H3156  | yiz.rach.yah             | Izrahiah               | **Izrahías**                        | Izrahías           |      3 |
| H3168  | ye.chez.qel              | Jehezkel               | **Ezequiel**                        | Ezequiel           |      3 |
| H3193  | yot.va.tah               | Jotbathah              | **Jotbata**                         | Jotbata            |      3 |
| H3195  | ye.tur                   | Jetur                  | **Jetur**                           | Jetur              |      3 |
| H3239  | ya.no.ach                | Janoah                 | **Janoa**                           | Janoa              |      3 |
| H3310  | yaph.let                 | Japhlet                | **Jaflet**                          | Jaflet             |      3 |
| H3337  | ye.tser                  | Jezer                  | **Jezer**                           | Jezer              |      3 |
| H3359  | ye.qam.yah               | Jekamiah               | **Jecamías**                        | Jecamías           |      3 |
| H3362  | yoq.ne.am                | Jokneam                | **Jocneam**                         | Jocneam            |      3 |
| H3402  | ya.riv                   | Jarib                  | **Jarib**                           | Jarib              |      3 |
| H3404  | ye.riy.yah               | Jeriah                 | **Jerías**                          | Jerías             |      3 |
| H3434  | ya.shov.am               | Jashobeam              | **Jasobeam**                        | Jasobeam           |      3 |
| H3437  | ya.shuv                  | Jashub                 | **Jasub**                           | Jasub              |      3 |
| H3506  | yit.ran                  | Ithran                 | **Itrán**                           | Itrán              |      3 |
| H3562  | ko.nan.ya.hu             | Conaniah               | **Conanías**                        | Conanías           |      3 |
| H3598  | ki.mah                   | Pleiades               | **cúmulo**                          |                    |      3 |
| H3630  | kil.yon                  | Chilion                | **Quelión**                         | Quelión            |      3 |
| H3641  | kal.neh                  | Calneh                 | **Calne / Calno**                   | Calne              |      3 |
| H3643  | kim.ham                  | Chimham                | **Quimam**                          | Quimam             |      3 |
| H3659  | kon.ya.hu                | Coniah                 | **Conías**                          | Conías             |      3 |
| H3663  | ke.nan.yah               | Chenaniah              | **Quenanías**                       | Quenanías          |      3 |
| H3731  | kaph.tor                 | Caphtor                | **Caftor**                          | Caftor             |      3 |
| H3732  | kaph.to.ri               | Caphtorim              | **caftoreo**                        | caftoreos          |      3 |
| H3751  | kar.ke.mish              | Carchemish             | **Carquemis**                       | Carquemis          |      3 |
| H3866  | lu.di                    | Ludite                 | **ludita**                          |                    |      3 |
| H3896  | le.chi                   | Lehi                   | **Lehi**                            | Lehi               |      3 |
| H4017  | miv.sam                  | Mibsam                 | **Mibsam**                          | Mibsam             |      3 |
| H4105  | me.he.tav.el             | Mehetabel              | **Mehetabel**                       | Mehetabel          |      3 |
| H4121  | ma.ha.ray                | Maharai                | **Maharai**                         | Maharai            |      3 |
| H4149  | mo.se.rah                | Moserah                | **Mosera / Moserot**                | Moserot            |      3 |
| H4176  | mo.reh                   | Moreh                  | **Moré**                            | More               |      3 |
| H4199  | miz.zah                  | Mizzah                 | **Miza**                            | Miza               |      3 |
| H4287  | ma.chat                  | Mahath                 | **Máhat**                           | Mahat              |      3 |
| H4320  | mi.kha.yah               | Micaiah                | **Micaías**                         | Micaías            |      3 |
| H4439  | mal.ki.el                | Malchiel               | **Malquiel**                        | Malquiel           |      3 |
| H4462  | me.mu.khan               | Memucan                | **Memucán**                         | Memucán            |      3 |
| H4509  | min.ya.min               | Miniamin               | **Miniamín**                        | Miniamín           |      3 |
| H4764  | me.rav                   | Merab                  | **Merab**                           | Merab              |      3 |
| H4898  | me.she.zav.el            | Meshezabel             | **Mesezabeel**                      | Mesezabeel         |      3 |
| H4977  | mat.tan                  | Mattan                 | **Matán**                           | Matán              |      3 |
| H4982  | mat.t.nay                | Mattenai               | **Matenai**                         | Matenai            |      3 |
| H5025  | no.vach                  | Nobah                  | **Noba**                            | Noba               |      3 |
| H5096  | na.ha.lal                | Nahalol                | **Nahalal / Nahalol**               |                    |      3 |
| H5161  | ne.che.la.mi             | Nehelam                | **nehelamita**                      |                    |      3 |
| H5241  | ne.mu.el                 | Nemuel                 | **Nemuel**                          | Nemuel             |      3 |
| H5294  | ne.ar.yah                | Neariah                | **Nearías**                         | Nearías            |      3 |
| H5303  | ne.phil                  | Nephilim               | **propiamente**                     |                    |      3 |
| H5305  | na.phish                 | Naphish                | **Nafis**                           | Nafis              |      3 |
| H5316  | ne.phet                  | Naphath                | **altura**                          |                    |      3 |
| H5660  | av.di                    | Abdi                   | **Abdi**                            | Abdi               |      3 |
| H5717  | a.di.el                  | Adiel                  | **Adiel**                           | Adiel              |      3 |
| H5726  | a.dul.la.mi              | Adullamite             | **adulamita**                       |                    |      3 |
| H5729  | e.den                    | Eden                   | **Edén**                            | Edén               |      3 |
| H5740  | e.der                    | Eder                   | **Eder**                            |                    |      3 |
| H5752  | o.ded                    | Oded                   | **Oded**                            |                    |      3 |
| H5809  | az.zur                   | Azzur                  | **Azur**                            | Azur               |      3 |
| H5812  | a.zaz.ya.hu              | Azaziah                | **Azazías**                         | Azazías            |      3 |
| H5831  | ez.ra                    | Ezra                   | **Esdras**                          | Esdras             |      3 |
| H5837  | az.ri.el                 | Azriel                 | **Azriel**                          | Azriel             |      3 |
| H5854  | at.rot bet yo.av         | Atroth-beth-joab       | **Atrot-bet-joab**                  | Atrot-bet-joab     |      3 |
| H5859  | iy.yon                   | Ijon                   | **Ijón**                            | Ijón               |      3 |
| H5879  | e.na.yim                 | Enaim                  | **Enaim / Enam**                    | Enaim              |      3 |
| H6042  | un.ni                    | Unni                   | **Uni**                             | Uni                |      3 |
| H6063  | a.ner                    | Aner                   | **Aner**                            | Aner               |      3 |
| H6107  | e.tsem                   | Ezem                   | **Esem**                            | Esem               |      3 |
| H6111  | ats.mon                  | Azmon                  | **Asmón**                           | Asmón              |      3 |
| H6142  | iq.qesh                  | Ikkesh                 | **Iques**                           | Iques              |      3 |
| H6253  | ash.to.ret               | Ashtoreth              | **Astarot**                         | Astarot            |      3 |
| H6369  | pi.khol                  | Phicol                 | **Ficol**                           | Ficol              |      3 |
| H6397  | pe.lo.ni                 | Pelonite               | **pelonita**                        | pelonita           |      3 |
| H6411  | pe.la.yah                | Pelaiah                | **Pelaías**                         | Pelaías            |      3 |
| H6444  | pe.nin.nah               | Peninnah               | **Penina**                          | Penina             |      3 |
| H6494  | pe.qach.yah              | Pekahiah               | **Pekaía**                          | Pekaía             |      3 |
| H6503  | par.bar                  | colonnade              | **Parbar**                          |                    |      3 |
| H6727  | tsi.ach                  | Ziha                   | **Zica**                            |                    |      3 |
| H6741  | tsil.lah                 | Zillah                 | **Zila**                            | Zila               |      3 |
| H6756  | tsal.mon                 | (Mount) Zalmon         | **Salmón**                          | Salmón             |      3 |
| H6825  | tse.pho                  | Zepho                  | **Zefo / Zefi**                     | Zefo               |      3 |
| H6855  | tsip.po.rah              | Zipporah               | **Séfora**                          | Séfora             |      3 |
| H6882  | tsor.i                   | Zorathite              | **zoratita**                        | zoratitas          |      3 |
| H6886  | tsa.re.phat              | Zarephath              | **Sarepta**                         | Sarepta            |      3 |
| H6891  | tsa.re.tan               | Zarethan               | **Saretán**                         | Saretán            |      3 |
| H6909  | qav.tse.el               | Kabzeel                | **Cabseel**                         | Cabseel            |      3 |
| H6981  | qo.re                    | Kore                   | **Coré**                            | Coré               |      3 |
| H7042  | qe.li.ta                 | Kelita                 | **Quelita**                         |                    |      3 |
| H7055  | qe.mu.el                 | Kemuel                 | **Quemuel**                         |                    |      3 |
| H7071  | qa.nah                   | Kanah                  | **Cana**                            | Caná               |      3 |
| H7678  | shab.b.tay               | Shabbethai             | **Sabetai**                         | Sabetai            |      3 |
| H7687  | se.guv                   | Segub                  | **Segub**                           | Segub              |      3 |
| H7708  | sid.dim                  | Valley                 | **Sidim**                           | Sidim              |      3 |
| H7766  | shu.nem                  | Shunem                 | **Sunem**                           | Sunem              |      3 |
| H7770  | shu.a                    | Shua                   | **Súa**                             | Súa                |      3 |
| H7928  | she.khem                 | Shechem                | **Siquem**                          | Siquem             |      3 |
| H8013  | she.lo.mot               | Shelomoth              | **Selomot**                         | Selomot            |      3 |
| H8061  | she.mi.da                | Shemida                | **Semida**                          | Semida             |      3 |
| H8093  | shim.ah                  | Shimeah                | **Sima**                            |                    |      3 |
| H8169  | sha.al.vim               | Shaalbim               | **Saalbim / Saalabín**              | Saalabín           |      3 |
| H8189  | sha.a.ra.yim             | Shaaraim               | **Saaraim**                         | Saaraim            |      3 |
| H8206  | shup.pim                 | Shuppim                | **Supim**                           | Supim              |      3 |
| H8294  | se.rach                  | Serah                  | **Sera**                            | Sera               |      3 |
| H8344  | she.shay                 | Sheshai                | **Sesai**                           | Sesai              |      3 |
| H8402  | tiv.ni                   | Tibni                  | **Tibni**                           | Tibni              |      3 |
| H8405  | te.vets                  | Thebez                 | **Tebes**                           | Tebes              |      3 |
| H8472  | tach.pe.nes              | Tahpenes               | **Tahpenes**                        | Tahpenes           |      3 |
| H8616  | tiq.vah                  | Tikvah                 | **Ticva**                           | Ticva              |      3 |
| H28    | a.vi.da                  | Abida                  | **Abida**                           | Abida              |      2 |
| H37    | a.vi.tal                 | Abital                 | **Abital**                          | Abital             |      2 |
| H39    | a.vi.ma.el               | Abimael                | **Abimael**                         | Abimael            |      2 |
| H45    | a.vi-al.von              | Abi-albon              | **Abialbón**                        |                    |      2 |
| H51    | a.vi.shur                | Abishur                | **Abisur**                          | Abisur             |      2 |
| H59    | a.vel                    | Abel                   | **Abel**                            | Abel               |      2 |
| H63    | a.vel hash.shit.tim      | Abel-shittim           | **Abel-sitim**                      | Abel-sitim         |      2 |
| H64    | a.vel ke.ra.mim          | Abel-keramim           | **Abel-keramim**                    |                    |      2 |
| H66    | a.vel ma.yim             | Abel-maim              | **Abel-maim**                       | Abel-maim          |      2 |
| H67    | a.vel mits.ra.yim        | Abel-mizraim           | **Abel-mizraim**                    | Abel-mizraim       |      2 |
| H78    | iv.tsan                  | Ibzan                  | **Ibsán**                           |                    |      2 |
| H110   | ad.be.el                 | Adbeel                 | **Adbeel**                          | Adbeel             |      2 |
| H112   | id.do                    | Iddo                   | **Iddo**                            | Iddo               |      2 |
| H131   | a.dum.mim                | Adummim                | **Adumim**                          |                    |      2 |
| H141   | a.do.ni.ram              | Adoniram               | **Adoniram**                        | Adoniram           |      2 |
| H146   | ad.dar                   | Addar                  | **Adar**                            | Adar               |      2 |
| H151   | a.do.ram                 | Adoram                 | **Adoram**                          | Adoram             |      2 |
| H161   | o.had                    | Ohad                   | **Ohad**                            | Ohad               |      2 |
| H189   | e.vi                     | Evi                    | **Evi**                             | Evi                |      2 |
| H195   | u.lay                    | Ulai                   | **el Ulai**                         | Ulai               |      2 |
| H206   | a.ven                    | (Valley of) Aven       | **Avén**                            | Avén               |      2 |
| H210   | u.phaz                   | Uphaz                  | **Ufaz**                            | Ufaz               |      2 |
| H242   | uz.zen she.e.rah         | Uzzen-sheerah          | **Uzen-seera**                      | Uzen-seera         |      2 |
| H243   | az.not ta.vor            | Aznoth-tabor           | **Aznot-tabor**                     | Aznot-tabor        |      2 |
| H244   | oz.ni                    | Ozni                   | **Ozni**                            | Ozni               |      2 |
| H277   | a.chi                    | Ahi                    | **Ahi**                             | Ahí                |      2 |
| H279   | a.chi.am                 | Ahiam                  | **Ahíam**                           | Ahíam              |      2 |
| H304   | ach.lay                  | Ahlai                  | **Aclai**                           |                    |      2 |
| H364   | el pa.ran                | El-paran               | **El-parán**                        |                    |      2 |
| H419   | el.dad                   | Eldad                  | **Eldad**                           | Eldad              |      2 |
| H420   | el.da.ah                 | Eldaah                 | **Eldaa**                           |                    |      2 |
| H438   | al.lon                   | oak                    | **Alón**                            | Alón               |      2 |
| H439   | al.lon ba.khut           | Allon-bacuth           | **Alón-bacut**                      | Alón-bacut         |      2 |
| H442   | a.lush                   | Alush                  | **Alús**                            | Alús               |      2 |
| H443   | el.za.vad                | Elzabad                | **Elzabad**                         | Elzabad            |      2 |
| H448   | e.li.a.tah               | Eliathah               | **Eliata**                          | Eliata             |      2 |
| H455   | el.yach.ba               | Eliahba                | **Eliajba**                         |                    |      2 |
| H463   | e.li.am                  | Eliam                  | **Eliam**                           | Eliam              |      2 |
| H466   | e.liph.le.hu             | Eliphelehu             | **Elifelehu**                       | Elifelehu          |      2 |
| H474   | e.li.shu.a               | Elishua                | **Elisúa**                          | Elisúa             |      2 |
| H486   | al.mo.dad                | Almodad                | **Almodad**                         | Almodad            |      2 |
| H495   | el.la.sar                | Ellasar                | **Elasar**                          | Elasar             |      2 |
| H513   | el.to.lad                | Eltolad                | **Eltolad**                         | Eltolad            |      2 |
| H514   | el.te.qe                 | Eltekeh                | **Elteque**                         | Elteque            |      2 |
| H528   | a.mon                    | Amon                   | **Amón**                            | Amón               |      2 |
| H549   | a.ma.nah                 | Amana                  | **Amana**                           | Amana              |      2 |
| H557   | am.tsi                   | Amzi                   | **Amsi**                            | Amsi               |      2 |
| H566   | im.ri                    | Imri                   | **Imri**                            | Imri               |      2 |
| H569   | am.ra.phel               | Amraphel               | **Amrafel**                         | Amrafel            |      2 |
| H573   | a.mit.tay                | Amittai                | **Amitai**                          | Amitai             |      2 |
| H649   | ap.pa.yim                | Appaim                 | **Apaim**                           | Apaim              |      2 |
| H654   | eph.lal                  | Ephlal                 | **Eflal**                           | Eflal              |      2 |
| H658   | e.phes dam.mim           | Ephes-dammim           | **Efes-damim**                      | Efes-damim         |      2 |
| H675   | ets.bon                  | Ezbon                  | **Ezbón**                           | Ezbón              |      2 |
| H683   | a.tsal.ya.hu             | Azaliah                | **Asalías**                         |                    |      2 |
| H684   | o.tsem                   | Ozem                   | **Ozem**                            | Ozem               |      2 |
| H714   | ard                      | Ard                    | **Ard**                             | Ard                |      2 |
| H719   | ar.vad                   | Arvad                  | **Arvad**                           | Arvad              |      2 |
| H721   | ar.va.di                 | Arvadite               | **arvadita**                        |                    |      2 |
| H722   | a.ro.di                  | Arodi                  | **arodita**                         | aroditas           |      2 |
| H739   | a.ri.el                  | Ariel                  | **león de Dios**                    |                    |      2 |
| H765   | a.ran                    | Aran                   | **Arán**                            | Arán               |      2 |
| H790   | esh.ban                  | Eshban                 | **Esbán**                           | Esbán              |      2 |
| H792   | esh.ba.al                | Eshbaal                | **Esbaal**                          |                    |      2 |
| H805   | a.shu.ri                 | Asshurim               | **asurita**                         |                    |      2 |
| H806   | ash.chur                 | Ashhur                 | **Asur**                            | Asur               |      2 |
| H823   | ash.nah                  | Ashnah                 | **Asna**                            |                    |      2 |
| H850   | esh.ton                  | Eshton                 | **Estón**                           | Estón              |      2 |
| H876   | be.er                    | Beer                   | **Beer**                            | Beer               |      2 |
| H879   | be.er e.lim              | Beer-elim              | **Beer-elim**                       | Beer-elim          |      2 |
| H882   | be.e.ri                  | Beeri                  | **Beeri**                           | Beeri              |      2 |
| H904   | big.tan                  | Bigthan                | **Bigtán / Bigtana**                | Bigtán             |      2 |
| H911   | be.dad                   | Bedad                  | **Bedad**                           | Bedad              |      2 |
| H917   | be.dan                   | Bedan                  | **Bedán**                           | Bedán              |      2 |
| H932   | bo.han                   | Bohan                  | **pulgar**                          |                    |      2 |
| H940   | bu.zi                    | Buzite                 | **buzita**                          | buzita             |      2 |
| H1009  | bet ar.bel               | Beth-arbel             | **Bet-arbel**                       | Bet-arbel          |      2 |
| H1010  | bet ba.al me.on          | Beth-meon              | **Bet-baal-meón**                   |                    |      2 |
| H1011  | bet bir.i                | Beth-biri              | **Bet-biri**                        |                    |      2 |
| H1013  | bet-ga.der               | Beth-gader             | **Bet-gader**                       | Bet-gader          |      2 |
| H1014  | bet ga.mul               | Beth-gamul             | **Bet-gamul**                       | Bet-gamul          |      2 |
| H1015  | bet div.la.ta.yim        | Beth-diblathaim        | **Bet-diblataim**                   | Bet-diblataim      |      2 |
| H1017  | bet ha.e.li              | Bethelite              | **betelita**                        |                    |      2 |
| H1018  | bet ha.e.tsel            | Beth-ezel              | **Bet-ezel**                        |                    |      2 |
| H1019  | bet hag.gil.gal          | Beth-gilgal            | **Bet-gilgal**                      |                    |      2 |
| H1025  | bet ha.e.meq             | Beth-emek              | **Bet-emec**                        | Bet-emec           |      2 |
| H1027  | bet ha.ram               | Beth-haram             | **Bet-arán**                        |                    |      2 |
| H1028  | bet ha.ran               | Beth-haran             | **Bet-aram**                        |                    |      2 |
| H1029  | bet hash.shit.tah        | Beth-shittah           | **Bet-sita**                        | Bet-sita           |      2 |
| H1033  | bet kar                  | Beth-car               | **Bet-car**                         | Bet-car            |      2 |
| H1034  | bet le.va.ot             | Beth-lebaoth           | **Bet-lebaot**                      | Bet-lebaot         |      2 |
| H1036  | bet le.aph.rah           | Beth-le-aphrah         | **Bet-le-afra**                     | Bet-le-afra        |      2 |
| H1040  | bet e.den                | Beth-eden              | **Bet-edén**                        | Bet-edén           |      2 |
| H1041  | bet az.ma.vet            | Beth-azmaveth          | **casa de Azmavet**                 |                    |      2 |
| H1042  | bet a.not                | Beth-anoth             | **Bet-anot**                        | Bet-anot           |      2 |
| H1048  | bet pats.tsets           | Beth-pazzez            | **Bet-paset**                       |                    |      2 |
| H1051  | bet ra.pah               | Beth-rapha             | **Bet-rafá**                        | Bet-rafa           |      2 |
| H1054  | bet tap.pu.ach           | Beth-tappuah           | **Bet-tapúa**                       | Bet-tapúa          |      2 |
| H1066  | bo.khim                  | Bochim                 | **Boquim**                          | Boquim             |      2 |
| H1074  | bo.khe.ru                | Bocheru                | **Bocru**                           | Bocru              |      2 |
| H1081  | bal.a.dan                | Baladan                | **Baladán**                         | baladán            |      2 |
| H1095  | be.le.te.shats.tsar      | Belteshazzar           | **Beltsasar**                       | Beltsasar          |      2 |
| H1114  | bil.shan                 | Bilshan                | **Bilsán**                          | Bilsán             |      2 |
| H1125  | ben-a.vi.na.dav          | Ben-Abinadab           | **Ben-abinadab**                    |                    |      2 |
| H1126  | ben-o.ni                 | Ben-oni                | **Ben-oni**                         |                    |      2 |
| H1127  | ben-ge.ver               | Ben-Geber              | **Ben-geber**                       |                    |      2 |
| H1128  | ben-de.qer               | Ben-deker              | **Ben-decar**                       |                    |      2 |
| H1132  | ben-zo.chet              | Ben-zoheth             | **Ben-zohet**                       | Ben-zohet          |      2 |
| H1133  | ben-chur                 | Ben-hur                | **Ben-hur**                         |                    |      2 |
| H1134  | ben-cha.yil              | Ben-hail               | **Ben-hail**                        | Ben-hail           |      2 |
| H1135  | ben-cha.nan              | Ben-hanan              | **Ben-hanán**                       | Ben-hanán          |      2 |
| H1139  | be.ne-b.raq              | Bene-berak             | **Bene-berac**                      | Bene-berac         |      2 |
| H1150  | bin.a                    | Binea                  | **Bina**                            | Bina               |      2 |
| H1151  | ben-am.mi                | Ben-ammi               | **Ben-ammi**                        | Ben-ammi           |      2 |
| H1153  | be.say                   | Besai                  | **Besai**                           | Besai              |      2 |
| H1174  | ba.al ha.mon             | Baal-hamon             | **Baal-hamón**                      | Baal-hamón         |      2 |
| H1175  | be.a.lot                 | Bealoth                | **Bealot**                          | Bealot             |      2 |
| H1178  | ba.al cha.tsor           | Baal-hazor             | **Baal-hazor**                      | Baal-hazor         |      2 |
| H1190  | ba.al sha.li.shah        | Baal-shalishah         | **Baal-salisa**                     | Baal-salisa        |      2 |
| H1192  | ba.a.lat be.er           | Baalath-beer           | **Baalat-beer**                     | Baalat-beer        |      2 |
| H1193  | ba.al ta.mar             | Baal-tamar             | **Baal-tamar**                      | Baal-tamar         |      2 |
| H1213  | bats.lut                 | Bazluth                | **Bazlut**                          | Bazlut             |      2 |
| H1218  | bots.qat                 | Bozkath                | **Boscat**                          | Boscat             |      2 |
| H1227  | baq.buq                  | Bakbuk                 | **Bacbuc**                          | Bacbuc             |      2 |
| H1232  | buq.qiy.yah              | Bukkiah                | **Buquías**                         | Buquías            |      2 |
| H1255  | be.ro.dakh bal.a.dan     | Merodach-baladan       | **Berodac-baladán**                 |                    |      2 |
| H1260  | be.red                   | Bered                  | **Bered**                           | Bered              |      2 |
| H1268  | be.ro.tah                | Berothah               | **Berota / Berotai**                | Berotai            |      2 |
| H1292  | ba.rakh.el               | Barachel               | **Baraquel**                        | Baraquel           |      2 |
| H1302  | bar.qos                  | Barkos                 | **Barcos**                          | Barcos             |      2 |
| H1337  | bat rab.bim              | Bath-rabbim            | **Bat-rabim**                       | Bat-rabim          |      2 |
| H1340  | bat-shu.a                | Bath-shua              | **Bat-súa**                         |                    |      2 |
| H1359  | gov                      | Gob                    | **Gob**                             | Gob                |      2 |
| H1382  | giv.li                   | Gebalite               | **gebalita**                        |                    |      2 |
| H1403  | gav.ri.el                | Gabriel                | **Gabriel**                         | Gabriel            |      2 |
| H1412  | gud.go.dah               | Gudgodah               | **Gudgoda**                         | Gudgoda            |      2 |
| H1424  | ga.di                    | Gadi                   | **Gadi**                            | Gadi               |      2 |
| H1437  | gid.dal.ti               | Giddalti               | **Gidalti**                         | Gidalti            |      2 |
| H1449  | ge.de.rah                | Gederah                | **Gedera**                          | Gedera             |      2 |
| H1450  | ge.de.rot                | Gederoth               | **Gederot**                         | Gederot            |      2 |
| H1485  | gur-ba.al                | Gurbaal                | **Gur-baal**                        | Gur-baal           |      2 |
| H1495  | ga.zez                   | Gazez                  | **Gazez**                           | Gazez              |      2 |
| H1502  | gaz.zam                  | Gazzam                 | **Gazam**                           | Gazam              |      2 |
| H1515  | ga.char                  | Gahar                  | **Gahar**                           | Gahar              |      2 |
| H1526  | gi.lo.ni                 | Gilonite               | **gilonita**                        | gilonita           |      2 |
| H1527  | gi.nat                   | Ginath                 | **Ginat**                           | Ginat              |      2 |
| H1542  | gi.loh                   | Giloh                  | **Gilo**                            | Gilo               |      2 |
| H1554  | gal.lim                  | Gallim                 | **Galim**                           | Galim              |      2 |
| H1567  | gal.ed                   | Galeed                 | **Galed**                           |                    |      2 |
| H1592  | ge.nu.vat                | Genubath               | **Genubat**                         | Genubat            |      2 |
| H1664  | git.ta.yim               | Gittaim                | **Gitaim**                          | Gitaim             |      2 |
| H1666  | ge.ter                   | Gether                 | **Geter**                           | Geter              |      2 |
| H1721  | do.da.nim                | Dodanim                | **dodanitas**                       |                    |      2 |
| H1774  | di za.hav                | Dizahab                | **Dizahab**                         | Dizahab            |      2 |
| H1775  | di.mon                   | Dibon                  | **Dimón**                           | Dimón              |      2 |
| H1838  | din.ha.vah               | Dinhabah               | **Dinhaba**                         |                    |      2 |
| H1850  | doph.qah                 | Dophkah                | **Dofca**                           | Dofca              |      2 |
| H1853  | diq.lah                  | Diklah                 | **Dicla**                           | Dicla              |      2 |
| H1874  | dar.qon                  | Darkon                 | **Darcón**                          | Darcón             |      2 |
| H1910  | ha.dad.rim.mon           | Hadad-rimmon           | **Hadad-rimón**                     |                    |      2 |
| H1912  | ho.du                    | India                  | **Hodu**                            |                    |      2 |
| H1956  | ho.tir                   | Hothir                 | **Hotir**                           | Hotir              |      2 |
| H1985  | hil.lel                  | Hillel                 | **Hilel**                           | Hilel              |      2 |
| H2068  | zav.di.el                | Zabdiel                | **Zabdiel**                         | Zabdiel            |      2 |
| H2099  | ziv                      | Ziv                    | **Ziv**                             |                    |      2 |
| H2124  | zi.za                    | Ziza                   | **Ziza**                            | Ziza               |      2 |
| H2125  | zi.zah                   | Zizah                  | **Ziza**                            |                    |      2 |
| H2130  | zi.phi                   | Ziphite                | **zifita**                          |                    |      2 |
| H2175  | zim.ran                  | Zimran                 | **Zimran**                          |                    |      2 |
| H2190  | za.a.van                 | Zaavan                 | **Zaaván**                          | Zaaván             |      2 |
| H2241  | ze.tam                   | Zetham                 | **Zetam**                           | Zetam              |      2 |
| H2246  | cho.vav                  | Hobab                  | **Hobab**                           | Hobab              |      2 |
| H2252  | cha.vay.yah              | Habaiah                | **Habaías**                         |                    |      2 |
| H2265  | cha.vaq.quq              | Habakkuk               | **Habacuc**                         | Habacuc            |      2 |
| H2286  | cha.ga.va                | Hagaba                 | **Hagaba**                          | Hagaba             |      2 |
| H2301  | cha.dad                  | Hadad                  | **Hadad**                           | Hadad              |      2 |
| H2313  | chid.de.qel              | Tigris                 | **el río Hidekel**                  | río ⚠️             |      2 |
| H2332  | chav.vah                 | Eve                    | **Eva**                             | Eva                |      2 |
| H2343  | chul                     | Hul                    | **Hul**                             | Hul                |      2 |
| H2362  | chav.ran                 | Hauran                 | **Haurán**                          | Haurán             |      2 |
| H2369  | cho.tam                  | Hotham                 | **Hotam**                           | Hotam              |      2 |
| H2387  | che.zir                  | Hezir                  | **Hezir**                           | Hezir              |      2 |
| H2410  | cha.ti.ta                | Hatita                 | **Hatita**                          | Hatita             |      2 |
| H2411  | chat.til                 | Hattil                 | **Hatil**                           | Hatil              |      2 |
| H2412  | cha.ti.pah               | Hatipha                | **Hatifa**                          | Hatifa             |      2 |
| H2431  | che.lam                  | Helam                  | **Helam**                           | Helam              |      2 |
| H2437  | chi.rah                  | Hirah                  | **Hira**                            | Hira               |      2 |
| H2446  | cha.khal.yah             | Hacaliah               | **Hacalías**                        | Hacalías           |      2 |
| H2453  | chakh.mo.ni              | Hachmonite             | **Hacmoni**                         | Hacmoni            |      2 |
| H2458  | chel.ah                  | Helah                  | **Helea**                           |                    |      2 |
| H2468  | chul.dah                 | Huldah                 | **Hulda**                           | Hulda              |      2 |
| H2469  | chel.day                 | Heldai                 | **Heldai**                          | Heldai             |      2 |
| H2507  | che.leq                  | Helek                  | **Helec**                           | Helec              |      2 |
| H2510  | cha.laq                  | (Mount) Halak          | **Halac**                           | Halac              |      2 |
| H2520  | chel.qat                 | Helkath                | **Helcat**                          | Helcat             |      2 |
| H2521  | chel.qat hats.tsu.rim    | Helkath-hazzurim       | **Helcat-hazurim**                  | Helcat-hazurim     |      2 |
| H2540  | cham.mon                 | Hammon                 | **Hamón**                           | Hamón              |      2 |
| H2575  | cham.mat                 | Hammath                | **Hamat**                           | Hamat              |      2 |
| H2576  | cham.mot dor             | Hammoth-dor            | **Hamot-dor**                       | Hamot-dor          |      2 |
| H2577  | cha.ma.ti                | Hamathite              | **hamatita**                        |                    |      2 |
| H2578  | cha.mat tso.vah          | Hamath-zobah           | **Hamat-soba**                      |                    |      2 |
| H2579  | cha.mat rab.bah          | Hamath the great       | **Hamat-rabá**                      |                    |      2 |
| H2592  | chan.ni.el               | Hanniel                | **Haniel**                          | Haniel             |      2 |
| H2675  | cha.tsor cha.dat.tah     | Hazor-hadattah         | **Hazor nueva**                     |                    |      2 |
| H2692  | cha.tsar ad.dar          | Hazar-addar            | **Hazar-adar**                      |                    |      2 |
| H2693  | cha.tsar gad.dah         | Hazar-gaddah           | **Hazar-gada**                      | Hazar-gada         |      2 |
| H2694  | cha.tsar hat.ti.khon     | Hazer-hatticon         | **Hazar-hatikón**                   |                    |      2 |
| H2695  | chets.ro                 | Hezro                  | **Hezro**                           | Hezro              |      2 |
| H2697  | chets.ro.ni              | Hezronite              | **hezronita**                       | hezronitas         |      2 |
| H2700  | cha.tsar.ma.vet          | Hazarmaveth            | **Hazarmavet**                      | Hazarmavet         |      2 |
| H2701  | cha.tsar su.sah          | Hazar-susah            | **Hazar-susa**                      | Hazar-susa         |      2 |
| H2702  | cha.tsar su.sim          | Hazar-susim            | **Hazar-susim**                     | Hazar-susim        |      2 |
| H2703  | cha.tsar e.non           | Hazar-enan             | **Hazar-enón**                      |                    |      2 |
| H2709  | cha.qu.pah               | Hakupha                | **Hacufa**                          | Hacufa             |      2 |
| H2712  | chuq.qoq                 | Hukkok                 | **Hucoc**                           | Hucoc              |      2 |
| H2726  | char.vo.na               | Harbona                | **Harbona**                         | Harbona            |      2 |
| H2732  | cha.ra.dah               | Haradah                | **Harada**                          | Harada             |      2 |
| H2733  | cha.ro.di                | Harodite               | **harodita**                        | harodita           |      2 |
| H2744  | char.chur                | Harhur                 | **Harhur**                          | Harhur             |      2 |
| H2756  | cha.riph                 | Hariph                 | **Harif**                           | Harif              |      2 |
| H2776  | che.res                  | Heres                  | **Heres**                           | Heres              |      2 |
| H2797  | char.sah                 | Harsha                 | **Harsa**                           | Harsa              |      2 |
| H2813  | cha.shav.ne.yah          | Hashabneiah            | **Hasabnías**                       | Hasabnías          |      2 |
| H2817  | cha.su.pah               | Hasupha                | **Hasufa**                          | Hasufa             |      2 |
| H2832  | chash.mo.nah             | Hashmonah              | **Hasmona**                         | Hasmona            |      2 |
| H2855  | chet.lon                 | Hethlon                | **Hetlón**                          | Hetlón             |      2 |
| H2870  | ta.ve.el                 | Tabeel                 | **Tabeel**                          | Tabeel             |      2 |
| H2884  | tab.ba.ot                | Tabbaoth               | **Tabaot**                          | Tabaot             |      2 |
| H2899  | tov a.do.niy.yah         | Tobadonijah            | **Tob-adonías**                     |                    |      2 |
| H2928  | te.lem                   | Telem                  | **Telem**                           | Telem              |      2 |
| H2995  | yav.ne.el                | Jabneel                | **Jabneel**                         | Jabneel            |      2 |
| H3011  | yog.be.hah               | Jogbehah               | **Jogbeha**                         | Jogbeha            |      2 |
| H3026  | ye.gar                   | Jegar                  | **Jegar-sahaduta**                  |                    |      2 |
| H3035  | yid.do                   | Iddo                   | **Ido**                             |                    |      2 |
| H3042  | ye.da.yah                | Jedaiah                | **Jedaías**                         | Jedaías            |      2 |
| H3047  | ya.da                    | Jada                   | **Jada**                            | Jada               |      2 |
| H3080  | ye.ho.ya.riv             | Jehoiarib              | **Joiarib**                         | Joiarib            |      2 |
| H3085  | ye.ho.ad.dah             | Jehoaddah              | **Joada**                           | Joada              |      2 |
| H3086  | ye.ho.ad.din             | Jehoaddan              | **Joadán**                          | Joadán             |      2 |
| H3090  | ye.ho.shav.at            | Jehoshabeath           | **Josabet**                         | Josabet            |      2 |
| H3094  | ye.hal.lel.el            | Jehallelel             | **Jehalelel**                       | Jehalelel          |      2 |
| H3109  | yo.ach                   | Joha                   | **Joha**                            | Joha               |      2 |
| H3115  | yo.khe.ved               | Jochebed               | **Jocabed**                         | Jocabed            |      2 |
| H3135  | yo.ash                   | Joash                  | **Joás**                            | Joás               |      2 |
| H3142  | yu.shav che.sed          | Jushab-hesed           | **Jusab-hesed**                     | Jusab-hesed        |      2 |
| H3146  | yo.sha.phat              | Joshaphat              | **Josafat**                         | Josafat            |      2 |
| H3165  | yech.diy.ya.hu           | Jehdeiah               | **Jehdías**                         |                    |      2 |
| H3172  | ye.chi.e.li              | Jehieli                | **jehielita**                       | jehielitas         |      2 |
| H3177  | yach.le.el               | Jahleel                | **Jahleel**                         | Jahleel            |      2 |
| H3183  | yach.tse.el              | Jahzeel                | **Jacseel**                         |                    |      2 |
| H3194  | yut.tah                  | Juttah                 | **Jutá**                            | Juta               |      2 |
| H3203  | ye.khol.yah              | Jecoliah               | **Jecolías**                        | Jecolías           |      2 |
| H3223  | ye.mu.el                 | Jemuel                 | **Jemuel**                          | Jemuel             |      2 |
| H3228  | ye.mi.ni                 | [Ben]jaminite          | **jeminita**                        |                    |      2 |
| H3269  | ya.a.ziy.ya.hu           | Jaaziah                | **Jaazías**                         | Jaazías            |      2 |
| H3279  | ya.a.la                  | Jaalah                 | **Jaala**                           | Jaala              |      2 |
| H3294  | ya.rah                   | Jarah                  | **Jara**                            | Jara               |      2 |
| H3296  | ya.a.re o.re.gim         | Jaare-oregim           | **Jaare-oregim**                    | Jaare-oregim       |      2 |
| H3300  | ya.a.si.el               | Jaasiel                | **Jasiel**                          |                    |      2 |
| H3356  | ya.qim                   | Jakim                  | **Jaquim**                          | Jaquim             |      2 |
| H3360  | ye.qam.am                | Jekameam               | **Jecamam**                         |                    |      2 |
| H3361  | yoq.me.am                | Jokmeam                | **Jocmeam**                         | Jocmeam            |      2 |
| H3371  | yoq.te.el                | Joktheel               | **Jocteel**                         | Jocteel            |      2 |
| H3376  | yir.iy.yah               | Irijah                 | **Jerías**                          |                    |      2 |
| H3377  | ya.rev                   | great                  | **Jareb**                           | Jareb              |      2 |
| H3388  | ye.ru.sah                | Jerusha                | **Jerusa**                          | Jerusa             |      2 |
| H3392  | ye.rach                  | Jerah                  | **Jera**                            | Jera               |      2 |
| H3397  | ye.rach.me.e.li          | Jerahmeelite           | **jerameelita**                     |                    |      2 |
| H3398  | yar.ach                  | Jarha                  | **Jarha**                           | Jarha              |      2 |
| H3429  | yo.shev bash.she.vet     | Josheb-basshebeth      | **Josebbasébet**                    |                    |      2 |
| H3430  | yish.bo b.nov            | Ishbi-benob            | **Isbi-benob**                      | Isbi-benob         |      2 |
| H3433  | ya.shu.vi le.chem        | Lehem                  | **Jasubi-lehem**                    |                    |      2 |
| H3435  | yish.baq                 | Ishbak                 | **Isbac**                           | Isbac              |      2 |
| H3436  | yosh.be.qa.shah          | Joshbekashah           | **Josbecasa**                       | Josbecasa          |      2 |
| H3438  | yish.vah                 | Ishvah                 | **Isva**                            |                    |      2 |
| H3460  | yish.ma.yah              | Ishmaiah               | **Ismaías**                         | Ismaías            |      2 |
| H3466  | ye.sha.nah               | Jeshanah               | **Jesana**                          | Jesana             |      2 |
| H3507  | yit.re.am                | Ithream                | **Itream**                          | Itream             |      2 |
| H3509  | ye.tet                   | Jetheth                | **Jetet**                           | Jetet              |      2 |
| H3521  | ka.vul                   | Cabul                  | **Cabul**                           | Cabul              |      2 |
| H3565  | kor a.shan               | Bor-ashan              | **Cor-asán**                        |                    |      2 |
| H3575  | ku.tah                   | Cuthah                 | **Cuta**                            | Cuta               |      2 |
| H3579  | ko.ze.vi                 | Cozbi                  | **Cozbi**                           | Cozbi              |      2 |
| H3613  | ka.lev eph.ra.tah        | Caleb                  | **Caleb-efrata**                    |                    |      2 |
| H3620  | ke.luv                   | Chelub                 | **Celub**                           |                    |      2 |
| H3625  | ke.lach                  | Calah                  | **Cala**                            | Cala               |      2 |
| H3633  | kal.kol                  | Calcol                 | **Calcol**                          | Calcol             |      2 |
| H3691  | kis.lev                  | Chislev                | **Quisleu**                         | Quisleu            |      2 |
| H3695  | kas.lu.chim              | Casluhim               | **Casluhim**                        | Casluhim           |      2 |
| H3696  | kis.lot ta.vor           | Chisloth-tabor         | **Quisilot-tabor**                  |                    |      2 |
| H3703  | ka.siph.ya               | Casiphia               | **Casifia**                         | Casifia            |      2 |
| H3743  | ke.ruv                   | Cherub                 | **Querub**                          | Querub             |      2 |
| H3746  | ka.ri                    | Carite                 | **guardaespaldas**                  |                    |      2 |
| H3747  | ke.rit                   | Cherith                | **Querit**                          | Querit             |      2 |
| H3763  | ke.ran                   | Cheran                 | **Querán**                          | Querán             |      2 |
| H3818  | lo am.mi                 | Not My People          | **Lo-ammi**                         | Lo-ammi            |      2 |
| H3838  | le.va.na                 | Lebanah                | **Lebana**                          | Lebana             |      2 |
| H3846  | liv.ni                   | Libnite                | **libnita**                         | libnitas           |      2 |
| H3853  | le.ha.vim                | Lehabim                | **Lehabim**                         | Lehabim            |      2 |
| H3872  | lu.chit                  | Luhith                 | **Luhit**                           | Luhit              |      2 |
| H3873  | lo.chesh                 | Hallohesh              | **Lohés**                           |                    |      2 |
| H3927  | le.mu.el                 | Lemuel                 | **Lemuel / Lemoel**                 | Lemuel             |      2 |
| H3959  | le.shem                  | Leshem                 | **Lesem**                           | Lesem              |      2 |
| H3968  | me.ah                    | (Tower of) the Hundred | **Mea**                             |                    |      2 |
| H4014  | miv.tsar                 | Mibzar                 | **Mibzar**                          | Mibzar             |      2 |
| H4025  | mag.di.el                | Magdiel                | **Magdiel**                         | Magdiel            |      2 |
| H4027  | mig.dal-el               | Migdal-el              | **Migdal-el**                       | Migdal-el          |      2 |
| H4028  | mig.dal-gad              | Migdal-gad             | **Migdal-gad**                      | Migdal-gad         |      2 |
| H4036  | ma.gor mis.sa.viv        | Terror on Every Side   | **Magor-misabib**                   | Magor-misabib      |      2 |
| H4051  | mig.ron                  | Migron                 | **Migrón**                          | Migrón             |      2 |
| H4068  | ma.don                   | Madon                  | **Madón**                           | Madón              |      2 |
| H4089  | mad.man.nah              | Madmannah              | **Madmana**                         | Madmana            |      2 |
| H4091  | me.dan                   | Medan                  | **Medán**                           | Medán              |      2 |
| H4179  | mo.riy.yah               | (Mount) Moriah         | **Moriah**                          | Moriah             |      2 |
| H4182  | mo.re.shet gat           | Moresheth-gath         | **Moréset-gat**                     | Moreset-gat        |      2 |
| H4183  | mo.rash.ti               | Moreshethite           | **morastita**                       |                    |      2 |
| H4188  | mu.shi                   | Mushite                | **musita**                          | musitas            |      2 |
| H4232  | me.chu.ya.el             | Mehujael               | **Mehujael / Mehiael**              | Mehujael           |      2 |
| H4238  | ma.cha.zi.ot             | Mahazioth              | **Mahaziot**                        | Mahaziot           |      2 |
| H4240  | me.chi.da                | Mehida                 | **Mehida**                          | Mehída             |      2 |
| H4250  | mach.li                  | Mahlite                | **mahlita**                         | mahlitas           |      2 |
| H4258  | ma.cha.lat               | Mahalath               | **Mahalat**                         | Mahalat            |      2 |
| H4259  | me.cho.la.ti             | Meholathite            | **meholatita**                      | meholatita         |      2 |
| H4271  | mach.se.yah              | Mahseiah               | **Macseías**                        |                    |      2 |
| H4308  | mat.red                  | Matred                 | **Matred**                          | Matred             |      2 |
| H4312  | me.dad                   | Medad                  | **Medad**                           | Medad              |      2 |
| H4313  | me hay.yar.qon           | Me-jarkon              | **Me-hayarcón**                     |                    |      2 |
| H4322  | mi.kha.ya.hu             | Micaiah                | **Micaías**                         | Micaías            |      2 |
| H4337  | me.sah                   | Mareshah               | **Mesa**                            | Mesa               |      2 |
| H4366  | mikh.me.tat              | Michmethath            | **Micmetat**                        | Micmetat           |      2 |
| H4413  | mal.lo.ti                | Mallothi               | **Maloti**                          | Maloti             |      2 |
| H4429  | me.lekh                  | Melech                 | **Mélec**                           | Melec              |      2 |
| H4511  | min.nit                  | Minnith                | **Minit**                           | Minit              |      2 |
| H4590  | ma.az.yah                | Maaziah                | **Maazías**                         | Maazías            |      2 |
| H4722  | maq.he.lot               | Makheloth              | **Macelot**                         | Macelot            |      2 |
| H4737  | miq.ne.ya.hu             | Mikneiah               | **Micnías**                         | Micnías            |      2 |
| H4757  | me.ro.dakh bal.a.dan     | Merodach-baladan       | **Merodac-baladán**                 | Merodac-baladán    |      2 |
| H4778  | me.red                   | Mered                  | **Mered**                           | Mered              |      2 |
| H4792  | me.rom                   | Merom                  | **Merom**                           | Merom              |      2 |
| H4810  | me.ri va.al              | Merib-baal             | **Merib-baal**                      | Merib-baal         |      2 |
| H4824  | me.ro.no.ti              | Meronothite            | **meronotita**                      | meronotita         |      2 |
| H4854  | mas.sa                   | Massa                  | **Massa**                           | Massa              |      2 |
| H4861  | mish.al                  | Mishal                 | **Miseal**                          | Miseal             |      2 |
| H4919  | me.shil.le.mot           | Meshillemoth           | **Mesilemot**                       | Mesilemot          |      2 |
| H4957  | mas.re.qah               | Masrekah               | **Masreca**                         | Masreca            |      2 |
| H4965  | me.teg ha.am.mah         | Metheg-ammah           | **Meteg-amá**                       | Meteg-ama          |      2 |
| H4967  | me.tu.sha.el             | Methushael             | **Metusael**                        | Metusael           |      2 |
| H4980  | mat.ta.nah               | Mattanah               | **Matana**                          | Matana             |      2 |
| H4989  | mit.qah                  | Mithkah                | **Mitca**                           | Mitca              |      2 |
| H4990  | mit.re.dat               | Mithredath             | **Mitrídates**                      | Mitrídates         |      2 |
| H5052  | no.gah                   | Nogah                  | **Noga**                            | Noga               |      2 |
| H5129  | no.ad.yah                | Noadiah                | **Noadías**                         | Noadías            |      2 |
| H5160  | na.cha.li.el             | Nahaliel               | **Nahaliel**                        | Nahaliel           |      2 |
| H5171  | na.cha.ray               | Naharai                | **Naharai / Nacrai**                | Naharai            |      2 |
| H5199  | ne.to.phah               | Netophah               | **Netofa**                          | Netofa             |      2 |
| H5212  | ni.san                   | Nisan                  | **Nisán**                           | Nisán              |      2 |
| H5249  | nim.rim                  | Nimrim                 | **Nimrim**                          | Nimrim             |      2 |
| H5268  | nis.rokh                 | Nisroch                | **Nisroc**                          | Nisroc             |      2 |
| H5318  | neph.to.ach              | Nephtoah               | **Neftoa**                          | Neftoa             |      2 |
| H5320  | naph.tu.chim             | Naphtuhim              | **Naftuhim**                        | Naftuhim           |      2 |
| H5335  | ne.tsi.ach               | Neziah                 | **Nesía**                           |                    |      2 |
| H5419  | ne.tan-me.lekh           | Nathan-melech          | **Netan-mélec**                     |                    |      2 |
| H5436  | se.va.i                  | Sabeans                | **sebaíta**                         |                    |      2 |
| H5454  | sav.tah                  | Sabtah                 | **Sabta / Sabtá**                   | Sabta              |      2 |
| H5455  | sav.te.kah               | Sabteca                | **Sabteca**                         | Sabteca            |      2 |
| H5479  | so.tay                   | Sotai                  | **Sotai**                           | Sotai              |      2 |
| H5482  | se.ve.neh                | Syene                  | **Sevene**                          | Sevene             |      2 |
| H5513  | si.ni                    | Sinite                 | **sinita**                          |                    |      2 |
| H5517  | si.a                     | Siaha                  | **Sia / Siaha**                     | Siaha              |      2 |
| H5524  | suk.kot be.not           | Succoth-benoth         | **cabañas de las hijas**            |                    |      2 |
| H5540  | se.led                   | Seled                  | **Séled**                           | Seled              |      2 |
| H5555  | se.la ham.mach.le.qot    | Rock of Escape         | **Sela-hamalecot**                  |                    |      2 |
| H5562  | sam.gar ne.vo            | Samgar, Nebu-sar-sekim | **Samgar-nebo**                     | Samgar-nebo        |      2 |
| H5581  | sis.may                  | Sismai                 | **Sismai**                          | Sismai             |      2 |
| H5618  | so.phe.ret               | Sophereth              | **Soferet**                         | Soferet            |      2 |
| H5624  | se.red                   | Sered                  | **Sered**                           | Sered              |      2 |
| H5653  | av.da                    | Abda                   | **Abda**                            | Abda               |      2 |
| H5664  | a.ved ne.go              | Abednego               | **Abed-nego**                       | Abed-nego          |      2 |
| H5684  | ev.ro.nah                | Abronah                | **Ebrona**                          |                    |      2 |
| H5698  | eg.lah                   | Eglah                  | **Egla**                            | Egla               |      2 |
| H5733  | ad.na                    | Adna                   | **Adna**                            | Adna               |      2 |
| H5734  | ad.nah                   | Adnah                  | **Adna**                            | Adnas              |      2 |
| H5741  | ad.ri.el                 | Adriel                 | **Adriel**                          | Adriel             |      2 |
| H5762  | a.vit                    | Avith                  | **Avit**                            | Avit               |      2 |
| H5793  | u.tay                    | Uthai                  | **Utai**                            | Utai               |      2 |
| H5817  | oz.zi.e.li               | Uzzielite              | **uzielita**                        | uzielitas          |      2 |
| H5841  | az.za.ti                 | Gaza                   | **gazita**                          |                    |      2 |
| H5855  | at.rot sho.phan          | Atroth-shophan         | **Atrot-sofán**                     |                    |      2 |
| H5864  | iy.yim                   | Iyim                   | **Ijim**                            |                    |      2 |
| H5875  | en haq.qo.re             | En-hakkore             | **En-hacoré**                       | En-hacore          |      2 |
| H5876  | en chad.dah              | En-haddah              | **En-hada**                         | En-hada            |      2 |
| H5877  | en cha.tsor              | En-hazor               | **En-hazor**                        | En-hazor           |      2 |
| H5878  | en cha.rod               | Harod                  | **En-harod**                        |                    |      2 |
| H5880  | en mish.pat              | En-mishpat             | **En-mispat**                       | En-mispat          |      2 |
| H5882  | en eg.la.yim             | Eneglaim               | **En-eglaim**                       | En-eglaim          |      2 |
| H5884  | en rim.mon               | En-rimmon              | **En-rimón**                        | En-rimón           |      2 |
| H5887  | en tap.pu.ach            | En-tappuah             | **En-tapúa**                        |                    |      2 |
| H5893  | ir                       | Ir                     | **Ir**                              |                    |      2 |
| H5897  | i.rad                    | Irad                   | **Irad**                            | Irad               |      2 |
| H5898  | ir ham.me.lach           | City of Salt           | **Irham-mélah**                     |                    |      2 |
| H5902  | i.ram                    | Iram                   | **Iram**                            | Iram               |      2 |
| H5905  | ir she.mesh              | Ir-shemesh             | **Ir-semes**                        | Ir-semes           |      2 |
| H5906  | a.yish                   | Bear                   | **la constelación de la Osa Mayor** |                    |      2 |
| H5933  | al.vah                   | Alvah                  | **Alva / Aljá**                     | Alva               |      2 |
| H5935  | al.van                   | Alvan                  | **Alván / Aljan**                   | Alván              |      2 |
| H5987  | a.moq                    | Amok                   | **Amoc**                            | Amoc               |      2 |
| H6020  | am.ra.mi                 | Amramite               | **amramita**                        | amramitas          |      2 |
| H6024  | a.nav                    | Anab                   | **Anab**                            | Anab               |      2 |
| H6043  | a.na.yah                 | Anaiah                 | **Anaías**                          | Anaías             |      2 |
| H6047  | a.na.mim                 | Anamim                 | **Anamim**                          | Anamim             |      2 |
| H6055  | a.nan.yah                | Ananiah                | **Ananías**                         | Ananías            |      2 |
| H6067  | a.nat                    | Anath                  | **Anat**                            | Anat               |      2 |
| H6139  | eq.ro.ni                 | Ekron                  | **ecronita**                        | ecronitas          |      2 |
| H6164  | ar.va.ti                 | Arbathite              | **arbatita**                        | arbatita           |      2 |
| H6179  | e.ri                     | Eri                    | **Eri**                             | Eri                |      2 |
| H6204  | or.pah                   | Orpah                  | **Orfa**                            | Orfa               |      2 |
| H6208  | ar.qi                    | Arkite                 | **arqueo**                          |                    |      2 |
| H6255  | ash.te.rot qar.na.yim    | Ashteroth-karnaim      | **Astarot-karnaim**                 |                    |      2 |
| H6278  | et qa.tsin               | Eth-kazin              | **Et-cazín**                        |                    |      2 |
| H6281  | e.ter                    | Ether                  | **Éter**                            | Eter               |      2 |
| H6303  | pa.don                   | Padon                  | **Padón**                           | Padón              |      2 |
| H6318  | po.ti.phar               | Potiphar               | **Potifar**                         | Potifar            |      2 |
| H6325  | pu.non                   | Punon                  | **Punón**                           | Punón              |      2 |
| H6364  | pi-ve.set                | Pi-beseth              | **Pi-beset**                        |                    |      2 |
| H6373  | pi.non                   | Pinon                  | **Pinón**                           | Pinón              |      2 |
| H6377  | pi.ton                   | Pithon                 | **Pitón**                           | Pitón              |      2 |
| H6404  | pe.let                   | Pelet                  | **Pelet**                           | Pelet              |      2 |
| H6406  | pal.ti                   | Palti                  | **Palti**                           | Palti              |      2 |
| H6409  | pal.ti.el                | Paltiel                | **Paltiel**                         | Paltiel            |      2 |
| H6431  | pe.let                   | Peleth                 | **Pelet**                           | Pelet              |      2 |
| H6450  | pas dam.mim              | Pas-dammim             | **Pas-damim**                       |                    |      2 |
| H6464  | pa.u                     | Pau                    | **Pau / Pai**                       | Pau                |      2 |
| H6489  | pe.qod                   | Pekod                  | **Pecod**                           | Pecod              |      2 |
| H6513  | pu.rah                   | Purah                  | **Fura**                            | Fura               |      2 |
| H6514  | pe.ru.da                 | Peruda                 | **Peruda / Perida**                 | Peruda             |      2 |
| H6604  | pe.tor                   | Pethor                 | **Petor**                           | Petor              |      2 |
| H6625  | pat.ru.si                | Pathrusim              | **patrusita**                       |                    |      2 |
| H6645  | tsiv.y.yah               | Zibiah                 | **Sibia**                           | Sibia              |      2 |
| H6650  | tse.vo.im                | Zeboim                 | **Zeboim**                          | Zeboim             |      2 |
| H6657  | tse.dad                  | Zedad                  | **Zedad**                           | Zedad              |      2 |
| H6690  | tso.phach                | Zophah                 | **Zofa**                            | Zofa               |      2 |
| H6758  | tsal.mo.nah              | Zalmonah               | **Salmona**                         |                    |      2 |
| H6762  | tse.la                   | Zela                   | **Zela**                            | Zela               |      2 |
| H6768  | tse.leq                  | Zelek                  | **Zelec**                           |                    |      2 |
| H6769  | tsil.l.tay               | Zillethai              | **Ziletai**                         | Ziletai            |      2 |
| H6786  | tse.ma.ri                | Zemarite               | **zemareo**                         | zemareo            |      2 |
| H6787  | tse.ma.ra.yim            | (Mount) Zemaraim       | **Zemaraim**                        | Zemaraim           |      2 |
| H6815  | tsa.a.nan.nim            | Zaanannim              | **Zaananim / Zaanaim**              | Zaanaim            |      2 |
| H6847  | tsoph.nat pa.ne.ach      | Zaphenath-paneah       | **Zafnat-panea**                    | Zafnat-panea       |      2 |
| H6868  | tse.re.dah               | Zeredah                | **Sereda**                          | Sereda             |      2 |
| H6890  | tse.ret hash.sha.char    | Zereth-shahar          | **Seret-hasahar**                   |                    |      2 |
| H6929  | qe.de.mah                | Kedemah                | **Cedema**                          | Cedema             |      2 |
| H6954  | qe.he.la.tah             | Kehelathah             | **Cehelata**                        |                    |      2 |
| H6964  | qo.la.yah                | Kolaiah                | **Colaías**                         | Colaías            |      2 |
| H7026  | qe.ros                   | Keros                  | **Queros**                          | Queros             |      2 |
| H7079  | qe.nat                   | Kenath                 | **Kenat**                           | Kenat              |      2 |
| H7155  | qir.yat chu.tsot         | Kiriath-huzoth         | **Cariat-husot**                    |                    |      2 |
| H7163  | qe.ren hap.pukh          | Keren-happuch          | **Keren-hapuc**                     | Keren-hapuc        |      2 |
| H7191  | qish.yon                 | Kishion                | **Quisón**                          |                    |      2 |
| H7254  | re.va                    | Reba                   | **Reba**                            | Reba               |      2 |
| H7274  | ro.ge.lim                | Rogelim                | **Rogelim**                         | Rogelim            |      2 |
| H7278  | re.gem me.lekh           | Regem-melech           | **Regem-mélec**                     | Regem-melec        |      2 |
| H7293  | ra.hav                   | Rahab                  | **fanfarrón**                       |                    |      2 |
| H7316  | ru.mah                   | Dumah                  | **Ruma**                            | Ruma               |      2 |
| H7380  | ri.vay                   | Ribai                  | **Ribai**                           | Ribai              |      2 |
| H7384  | di.phat                  | Riphath                | **Rifat**                           | Rifat              |      2 |
| H7434  | ra.mat ham.mits.peh      | Ramath-mizpeh          | **Ramat-hamispé**                   |                    |      2 |
| H7436  | ra.ma.ta.yim tso.phim    | Ramathaim-zophim       | **Ramataim-sofim**                  |                    |      2 |
| H7437  | ra.mat le.chi            | Ramath-lehi            | **Ramat-lehi**                      | Ramat-lehi         |      2 |
| H7446  | ris.sah                  | Rissah                 | **Risa**                            |                    |      2 |
| H7498  | ra.pah                   | Raphah                 | **Rafa / Rafá**                     | Rafa               |      2 |
| H7530  | re.tseph                 | Rezeph                 | **Résef**                           | Resef              |      2 |
| H7575  | rit.mah                  | Rithmah                | **Ritma**                           | Ritma              |      2 |
| H7610  | she.ar ya.shuv           | Shear-jashub           | **Searjasub**                       |                    |      2 |
| H7630  | sho.vay                  | Shobai                 | **Sobai**                           | Sobai              |      2 |
| H7724  | she.va                   | Sheva                  | **Seva**                            | Seva               |      2 |
| H7731  | sho.vakh                 | Shobach                | **Sobac**                           | Sobac              |      2 |
| H7740  | sha.veh                  | Shaveh                 | **Save**                            | Save               |      2 |
| H7744  | shu.ach                  | Shuah                  | **Súah**                            |                    |      2 |
| H7749  | shu.cha.mi               | Shuhamite              | **sujamita**                        |                    |      2 |
| H7759  | shu.lam.mit              | Shulammites            | **sulamita**                        | sulamita           |      2 |
| H7763  | sho.mer                  | Shomer                 | **Semer**                           |                    |      2 |
| H7764  | shu.ni                   | Shuni                  | **Suni**                            | Suni               |      2 |
| H7777  | shu.al                   | Shual                  | **Sual**                            | Sual               |      2 |
| H7780  | sho.phakh                | Shophach               | **Sofac**                           | Sofac              |      2 |
| H7884  | shi.chor liv.nat         | Shihor-libnath         | **Sihor-libnat**                    | Sihor-libnat       |      2 |
| H7940  | sa.khar                  | Sachar                 | **Sacar**                           | Sacar              |      2 |
| H7975  | she.lach                 | Shelah                 | **Siloé**                           | Siloé              |      2 |
| H7977  | shil.chi                 | Shilhi                 | **Silqui**                          |                    |      2 |
| H8004  | sha.lem                  | Salem                  | **Salem**                           | Salem              |      2 |
| H8006  | shil.lem                 | Shillem                | **Silem**                           | Silem              |      2 |
| H8014  | sal.may                  | Shalmai                | **Salmai**                          | Salmai             |      2 |
| H8022  | shal.man.e.ser           | Shalmaneser            | **Salmanasar**                      | Salmanasar         |      2 |
| H8026  | she.leph                 | Sheleph                | **Sélef**                           | Selef              |      2 |
| H8037  | sham.ma                  | Shammah                | **Sama**                            | Sama               |      2 |
| H8044  | sham.gar                 | Shamgar                | **Samgar**                          | Samgar             |      2 |
| H8097  | shim.i                   | Shimeite               | **simita**                          |                    |      2 |
| H8100  | shim.at                  | Shimeath               | **Simat**                           |                    |      2 |
| H8112  | shim.ron me.r.on         | Shimron-meron          | **Simrón-merón**                    | Simron-merón       |      2 |
| H8115  | shom.ra.yin              | Samaria                | **Samaria**                         | Samaria            |      2 |
| H8170  | sha.al.vo.ni             | Shaalbonite            | **saalbonita**                      | saalbonita         |      2 |
| H8174  | sha.aph                  | Shaaph                 | **Saaf**                            | Saaf               |      2 |
| H8187  | she.ar.yah               | Sheariah               | **Searías**                         | Searías            |      2 |
| H8195  | she.pho                  | Shepho                 | **Sefo**                            | Sefo               |      2 |
| H8197  | she.phu.pham             | Shephupham             | **Sefufán / Sefufam**               | Sefufam            |      2 |
| H8221  | she.pham                 | Shepham                | **Sefam**                           | Sefam              |      2 |
| H8234  | she.pher                 | (Mount) Shepher        | **Sefer**                           | Sefer              |      2 |
| H8301  | sa.rid                   | Sarid                  | **Sarid**                           | Sarid              |      2 |
| H8303  | shir.yon                 | Sirion                 | **Sirión**                          | Sirión             |      2 |
| H8310  | sar.se.khim              | Samgar, Nebu-sar-sekim | **Sarsequim**                       | Sarsequim          |      2 |
| H8339  | she.she.bats.tsar        | Sheshbazzar            | **Sesbasar**                        | Sesbasar           |      2 |
| H8340  | she.she.bats.tsar        | Sheshbazzar            | **Sesbasar**                        | Sesbasar           |      2 |
| H8347  | she.shakh                | Babylon                | **Sesac**                           | Sesac              |      2 |
| H8349  | sha.shaq                 | Shashak                | **Sasac**                           | Sasac              |      2 |
| H8387  | ta.a.nat shi.loh         | Taanath-shiloh         | **Taanat-silo**                     | Taanat-silo        |      2 |
| H8404  | tav.e.rah                | Taberah                | **Tabera**                          | Tabera             |      2 |
| H8412  | tad.mor                  | Tadmor                 | **Tadmor**                          | Tadmor             |      2 |
| H8413  | tid.al                   | Tidal                  | **Tidal**                           | Tidal              |      2 |
| H8465  | ta.chan                  | Tahan                  | **Tacán**                           |                    |      2 |
| H8483  | tach.tim chod.shi        | Kadesh                 | **Tactim-hodsi**                    |                    |      2 |
| H8494  | ti.ras                   | Tiras                  | **Tiras**                           | Tiras              |      2 |
| H8512  | tel a.viv                | Tel-abib               | **Tel-abib**                        | Tel-abib           |      2 |
| H8515  | te.las.sar               | Telassar               | **Telasar**                         | Telasar            |      2 |
| H8547  | te.mach                  | Temah                  | **Temac**                           |                    |      2 |
| H8576  | tan.chu.met              | Tanhumeth              | **Tancumet**                        |                    |      2 |
| H8607  | tiph.sach                | Tiphsah                | **Tifsa**                           | Tifsa              |      2 |
| H8640  | tir.ha.qah               | Tirhakah               | **Tirhaca**                         | Tirhaca            |      2 |
| H8657  | te.resh                  | Teresh                 | **Teres**                           | Teres              |      2 |
| H8661  | tar.tan                  | Tartan                 | **Tartán**                          | Tartán             |      2 |
| H5     | a.vag.ta                 | Abagtha                | **Abagta**                          | Abagta             |      1 |
| H21    | a.vi                     | Abi                    | **Abí**                             | Abi                |      1 |
| H23    | a.vi.a.saph              | Abiasaph               | **Abiasaf**                         | Abiasaf            |      1 |
| H31    | a.vi.hud                 | Abihud                 | **Abiud**                           | Abiud              |      1 |
| H36    | a.vi.tuv                 | Abitub                 | **Ahitob**                          |                    |      1 |
| H77    | e.vets                   | Ebez                   | **Ebes**                            |                    |      1 |
| H89    | a.ge                     | Agee                   | **Age**                             | Age                |      1 |
| H94    | a.gur                    | Agur                   | **Agur**                            | Agur               |      1 |
| H97    | eg.la.yim                | Eglaim                 | **Eglaim**                          | Eglaim             |      1 |
| H111   | a.dad                    | Hadad                  | **Adad**                            |                    |      1 |
| H114   | ad.don                   | Addon                  | **Addón**                           |                    |      1 |
| H115   | a.do.ra.yim              | Adoraim                | **Adoraim**                         | Adoraim            |      1 |
| H118   | a.dal.ya                 | Adalia                 | **Adalía**                          | Adalía             |      1 |
| H128   | a.da.mah                 | Adamah                 | **Adama**                           | Adama              |      1 |
| H129   | a.da.mi                  | Adami                  | **Adami**                           |                    |      1 |
| H133   | ad.ma.ta                 | Admatha                | **Admata**                          | Admata             |      1 |
| H135   | ad.dan                   | Addan                  | **Adán**                            |                    |      1 |
| H169   | o.hel                    | Ohel                   | **Ohel**                            | Ohel               |      1 |
| H177   | u.el                     | Uel                    | **Uel**                             | Uel                |      1 |
| H179   | o.vil                    | Obil                   | **Obil**                            | Obil               |      1 |
| H186   | u.zay                    | Uzai                   | **Uzai**                            | Uzai               |      1 |
| H203   | on                       | On                     | **On**                              |                    |      1 |
| H229   | ez.bay                   | Ezbai                  | **Ezbai**                           | Ezbai              |      1 |
| H237   | e.zel                    | Ezel                   | **Ezel**                            | Ezel               |      1 |
| H245   | a.zan.yah                | Azaniah                | **Azanías**                         | Azanías            |      1 |
| H250   | ez.ra.chi                | Ezrahite               | **ezraíta**                         | ezraíta            |      1 |
| H257   | ach.van                  | Ahban                  | **Ahbán**                           | Ahbán              |      1 |
| H261   | e.chud                   | Ehud                   | **Ehud**                            |                    |      1 |
| H265   | a.cho.ach                | Ahoah                  | **Ahoa**                            | Ahoa               |      1 |
| H267   | a.chu.may                | Ahumai                 | **Ahumai**                          | Ahumai             |      1 |
| H273   | ach.zay                  | Ahzai                  | **Ahzai**                           |                    |      1 |
| H275   | a.chuz.zam               | Ahuzzam                | **Ahuzam**                          | Ahuzam             |      1 |
| H276   | a.chuz.zat               | Ahuzzath               | **Ahuzat**                          | Ahuzat             |      1 |
| H278   | e.chi                    | Ehi                    | **Ehi**                             | Ehi                |      1 |
| H282   | a.chi.hud                | Ahihud                 | **Ahiud**                           | Ahiud              |      1 |
| H284   | a.chi.chud               | Ahihud                 | **Ahiud**                           | Ahiud              |      1 |
| H287   | a.chi.mot                | Ahimoth                | **Ahimot**                          | Ahimot             |      1 |
| H291   | ach.yan                  | Ahian                  | **Ahián**                           | Ahián              |      1 |
| H292   | a.chi.na.dav             | Ahinadab               | **Ahinadab**                        | Ahinadab           |      1 |
| H297   | a.chi.ram                | Ahiram                 | **Ahiram**                          | Ahiram             |      1 |
| H298   | a.chi.ra.mi              | Ahiramite              | **ahiramita**                       | ahiramitas         |      1 |
| H300   | a.chi.sha.char           | Ahishahar              | **Ahisahar**                        | Ahisahar           |      1 |
| H301   | a.chi.shar               | Ahishar                | **Ahisar**                          | Ahisar             |      1 |
| H303   | ach.lav                  | Ahlab                  | **Ahlab**                           | Ahlab              |      1 |
| H307   | ach.me.ta                | Ecbatana               | **Ahmeta**                          |                    |      1 |
| H308   | a.chas.bay               | Ahasbai                | **Ahasbai**                         | Ahasbai            |      1 |
| H313   | a.cher                   | Aher                   | **Aher**                            | Aher               |      1 |
| H315   | ach.rach                 | Aharah                 | **Acraj**                           |                    |      1 |
| H316   | a.char.chel              | Aharhel                | **Aharhel**                         | Aharhel            |      1 |
| H326   | a.chash.ta.ri            | Haahashtari            | **ajastarita**                      |                    |      1 |
| H372   | i.e.zer                  | Iezer                  | **Jezer**                           | Jezer              |      1 |
| H373   | i.ez.ri                  | Iezerite               | **jezrita**                         |                    |      1 |
| H379   | ish.hod                  | Ishhod                 | **Isod**                            | Isod               |      1 |
| H388   | e.ta.nim                 | Ethanim                | **Etanim**                          | Etanim             |      1 |
| H390   | ak.kad                   | Accad                  | **Acad**                            | Acad               |      1 |
| H401   | u.khal                   | worn out               | **Ucal**                            | Ucal               |      1 |
| H414   | e.la                     | Ela                    | **Ela**                             | Ela                |      1 |
| H435   | e.lul                    | Elul                   | **Elul**                            | Elul               |      1 |
| H440   | e.lo.ni                  | Elonite                | **elonita**                         | elonitas           |      1 |
| H449   | e.li.dad                 | Elidad                 | **Elidad**                          | Elidad             |      1 |
| H456   | e.li.cho.reph            | Elihoreph              | **Elihoref**                        | Elihoref           |      1 |
| H462   | e.li.e.nay               | Elienai                | **Elienai**                         | Elienai            |      1 |
| H465   | e.li.phal                | Eliphal                | **Elifal**                          | Elifal             |      1 |
| H470   | e.li.qa                  | Elika                  | **Elica**                           | Elica              |      1 |
| H472   | e.li.she.va              | Elisheba               | **Elisabet**                        | Elisabet           |      1 |
| H478   | e.li.sha.phat            | Elishaphat             | **Elisafat**                        | Elisafat           |      1 |
| H487   | al.lam.me.lekh           | Allammelech            | **Alamélec**                        | Alamelec           |      1 |
| H493   | el.na.am                 | Elnaam                 | **Elnaam**                          | Elnaam             |      1 |
| H496   | el.ad                    | Elead                  | **Elad**                            | Elad               |      1 |
| H497   | el.a.dah                 | Eleadah                | **Elada**                           | Elada              |      1 |
| H498   | el.u.zay                 | Eluzai                 | **Eluzai**                          | Eluzai             |      1 |
| H507   | e.leph                   | Haeleph                | **Elef**                            | Elef               |      1 |
| H512   | el.qo.shi                | Elkoshite              | **elcosita**                        |                    |      1 |
| H515   | el.te.qon                | Eltekon                | **Eltecón**                         | Eltecón            |      1 |
| H522   | am.mah                   | Ammah                  | **Ama**                             |                    |      1 |
| H532   | a.mi                     | Ami                    | **Ami**                             | Ami                |      1 |
| H538   | a.mam                    | Amam                   | **Amam**                            | Amam               |      1 |
| H588   | a.na.cha.rat             | Anaharath              | **Anaharat**                        | Anaharat           |      1 |
| H593   | a.ni.am                  | Aniam                  | **Aniam**                           | Aniam              |      1 |
| H619   | as.nah                   | Asnah                  | **Asena**                           | Asena              |      1 |
| H620   | os.nap.par               | Osnappar               | **Asnapar**                         | Asnapar            |      1 |
| H630   | as.pa.ta                 | Aspatha                | **Aspata**                          | Aspata             |      1 |
| H641   | e.phod                   | Ephod                  | **Efod**                            | Efod               |      1 |
| H647   | a.phi.ach                | Aphiah                 | **Afía**                            | Afía               |      1 |
| H664   | a.phe.qah                | Aphekah                | **Afeca**                           | Afeca              |      1 |
| H670   | a.pha.re.say             | Persia                 | **aferesita**                       |                    |      1 |
| H690   | a.ra                     | Ara                    | **Ara**                             | Ara                |      1 |
| H694   | a.rav                    | Arab                   | **Arab**                            | Arab               |      1 |
| H700   | a.rub.bot                | Arubboth               | **Arubot**                          | Arubot             |      1 |
| H701   | ar.bi                    | Arbite                 | **arbita**                          | arbita             |      1 |
| H715   | ar.don                   | Ardon                  | **Ardón**                           | Ardón              |      1 |
| H716   | ar.di                    | Ardite                 | **ardita**                          | arditas            |      1 |
| H720   | a.rod                    | Arod                   | **Arod**                            | Arod               |      1 |
| H725   | a.ru.mah                 | Arumah                 | **Aruma**                           | Aruma              |      1 |
| H742   | a.ri.day                 | Aridai                 | **Aridai**                          | Aridai             |      1 |
| H743   | a.ri.da.ta               | Aridatha               | **Aridata**                         | Aridata            |      1 |
| H745   | ar.yeh                   | Arieh                  | **Arié**                            | Arie               |      1 |
| H747   | a.ri.say                 | Arisai                 | **Arisai**                          | Arisai             |      1 |
| H751   | e.rekh                   | Erech                  | **Erec**                            | Erec               |      1 |
| H756   | ar.ke.vay                | Erech                  | **arquevita**                       |                    |      1 |
| H764   | ar.mo.ni                 | Armoni                 | **Armoni**                          | Armoni             |      1 |
| H767   | o.ren                    | Oren                   | **Oren**                            | Orén               |      1 |
| H770   | ar.nan                   | Arnan                  | **Arnán**                           | Arnán              |      1 |
| H777   | ar.tsa                   | Arza                   | **Arsa**                            | Arsa               |      1 |
| H789   | ash.be.li                | Ashbelite              | **asbelita**                        | asbelitas          |      1 |
| H791   | ash.be.a                 | (Beth)-ashbea          | **Asbea**                           | asbea              |      1 |
| H797   | ash.do.dit               | Ashdod                 | **Asdod**                           | Asdod              |      1 |
| H807   | a.shi.ma                 | Ashima                 | **Asima**                           | Asima              |      1 |
| H824   | esh.an                   | Eshan                  | **Esán**                            | Esán               |      1 |
| H828   | ash.pe.naz               | Ashpenaz               | **Aspenaz**                         | Aspenaz            |      1 |
| H832   | esh.qe.lo.ni             | Ashkelonite            | **ascalonita**                      |                    |      1 |
| H840   | a.sar.el                 | Asarel                 | **Asareel**                         | Asareel            |      1 |
| H841   | a.sar.e.lah              | Asharelah              | **Asarela**                         | Asarela            |      1 |
| H843   | a.she.ri                 | Asherite               | **aserita**                         |                    |      1 |
| H845   | as.ri.e.li               | Asrielite              | **asrielita**                       | asrielitas         |      1 |
| H848   | esh.ta.u.li              | Eshtaolite             | **estaolita**                       | estaolitas         |      1 |
| H856   | et.ba.al                 | Ethbaal                | **Et-baal**                         | Et-baal            |      1 |
| H867   | et.ni                    | Ethni                  | **Etni**                            | Etni               |      1 |
| H869   | et.nan                   | Ethnan                 | **Etnán**                           | Etnán              |      1 |
| H871   | a.ta.rim                 | Atharim                | **Atarim**                          | Atarim             |      1 |
| H878   | be.e.ra                  | Beera                  | **Beera**                           | Beera              |      1 |
| H880   | be.e.rah                 | Beerah                 | **Beera**                           | Beera              |      1 |
| H896   | bav.li                   | Babylonian             | **babilonio**                       |                    |      1 |
| H903   | big.ta                   | Bigtha                 | **Bigta**                           | Bigta              |      1 |
| H912   | be.de.yah                | Bedeiah                | **Bedías**                          | Bedías             |      1 |
| H920   | bid.qar                  | Bidkar                 | **Bidcar**                          | Bidcar             |      1 |
| H941   | bu.zi                    | Buzi                   | **Buzi**                            | Buzi               |      1 |
| H942   | bav.vay                  | Bavvai                 | **Bavai**                           | Bavai              |      1 |
| H945   | bul                      | Bul                    | **Bul**                             | Bul                |      1 |
| H946   | bu.nah                   | Bunah                  | **Buna**                            | Buna               |      1 |
| H949   | bo.tsets                 | Bozez                  | **Boses**                           | Boses              |      1 |
| H964   | biz.yo.te.yah            | Biziothiah             | **Bizyotia**                        |                    |      1 |
| H968   | biz.ta                   | Biztha                 | **Bizta**                           | Bizta              |      1 |
| H978   | ba.cha.ru.mi             | Baharumite             | **baharumita**                      |                    |      1 |
| H984   | be.tach                  | Betah                  | **Beta**                            | Beta               |      1 |
| H991   | be.ten                   | Beten                  | **Betén**                           | Betén              |      1 |
| H993   | be.to.nim                | Betonim                | **Betonim**                         | Betonim            |      1 |
| H1056  | ba.kah                   | (Tophet of) Baca       | **Baca**                            |                    |      1 |
| H1064  | be.kho.rat               | Becorath               | **Becorat**                         | Becorat            |      1 |
| H1076  | bakh.ri                  | Becherite              | **baquerita**                       |                    |      1 |
| H1084  | bil.gay                  | Bilgai                 | **Bilgai**                          | Bilgai             |      1 |
| H1088  | ba.lah                   | Balah                  | **Bala**                            | Bala               |      1 |
| H1108  | bal.i                    | Belaite                | **belaita**                         | belaítas           |      1 |
| H1112  | be.le.shats.tsar         | Belshazzar             | **Belsasar**                        | Belsasar           |      1 |
| H1117  | ba.mah                   | Bamah                  | **Bama**                            | Bama               |      1 |
| H1118  | bim.hal                  | Bimhal                 | **Bimhal**                          | Bimhal             |      1 |
| H1122  | ben                      | Ben                    | **Ben**                             |                    |      1 |
| H1148  | be.ni.nu                 | Beninu                 | **Beninú**                          | Beninu             |      1 |
| H1152  | be.so.de.yah             | Besodeiah              | **Besodías**                        | Besodías           |      1 |
| H1180  | ba.a.li                  | Baal                   | **Baali**                           | Baali              |      1 |
| H1182  | be.el.ya.da              | Beeliada               | **Beeliada**                        | Beeliada           |      1 |
| H1183  | be.al.yah                | Bealiah                | **Bealías**                         | Bealías            |      1 |
| H1185  | ba.a.lis                 | Baalis                 | **Baalis**                          | Baalis             |      1 |
| H1194  | be.on                    | Beon                   | **Beón**                            | Beón               |      1 |
| H1199  | ba.a.ra                  | Baara                  | **Baara**                           | Baara              |      1 |
| H1202  | ba.a.se.yah              | Baaseiah               | **Baasías**                         | Baasías            |      1 |
| H1203  | be.esh.te.rah            | Beeshterah             | **Beestera**                        | Beestera           |      1 |
| H1230  | baq.baq.qar              | Bakbakkar              | **Bacbacar**                        | Bacbacar           |      1 |
| H1256  | be.ra.yah                | Beraiah                | **Beraías**                         | Beraías            |      1 |
| H1269  | bir.zot                  | Birzaith               | **Birzot**                          |                    |      1 |
| H1273  | bar.chu.mi               | Bahurite               | **barhumita**                       | barhumita          |      1 |
| H1275  | be.ri                    | Beri                   | **Beri**                            | Beri               |      1 |
| H1276  | be.ri                    | Bichrites              | **Bicrita**                         |                    |      1 |
| H1282  | ba.ri.ach                | Bariah                 | **Baría**                           | Barías             |      1 |
| H1284  | be.ri.i                  | Beriite                | **beriita**                         |                    |      1 |
| H1286  | be.rit                   | (Baal)-berith          | **Berit**                           | Berit              |      1 |
| H1298  | be.ra                    | Bera                   | **Bera**                            | Bera               |      1 |
| H1306  | bir.sah                  | Birsha                 | **Birsa**                           | Birsa              |      1 |
| H1307  | be.ro.ti                 | Beeroth                | **berotita**                        |                    |      1 |
| H1312  | bish.lam                 | Bishlam                | **Bislam**                          | Bislam             |      1 |
| H1329  | be.tul                   | Bethul                 | **Betul**                           | Betul              |      1 |
| H1332  | bit.yah                  | Bithiah                | **Bitia**                           | Bitia              |      1 |
| H1336  | be.ter                   | cleft                  | **Beter**                           | Beter              |      1 |
| H1338  | bit.ron                  | Bithron                | **Bitrón**                          | Bitrón             |      1 |
| H1345  | ge.u.el                  | Geuel                  | **Gehuel**                          |                    |      1 |
| H1373  | gab.bay                  | men                    | **Gabai**                           | Gabai              |      1 |
| H1374  | ge.vim                   | Gebim                  | **Gebim**                           | Gebim              |      1 |
| H1380  | ge.val                   | Gebal                  | **Gebal**                           | Gebal              |      1 |
| H1381  | ge.val                   | Gebal                  | **Gebal**                           | Gebal              |      1 |
| H1388  | giv.a                    | Gibea                  | **Gibea**                           | Gibea              |      1 |
| H1394  | giv.at                   | Gibeah                 | **Gibat**                           |                    |      1 |
| H1395  | giv.a.ti                 | Gibeathite             | **gibatita**                        |                    |      1 |
| H1398  | ge.ver                   | Geber                  | **Geber**                           | Geber              |      1 |
| H1402  | gib.bar                  | Gibbar                 | **Gibar**                           | Gibar              |      1 |
| H1408  | gad                      | Fortune                | **Fortuna**                         | Fortuna            |      1 |
| H1426  | gad.di                   | Gaddi                  | **Gadi**                            | Gadi               |      1 |
| H1427  | gad.di.el                | Gaddiel                | **Gadiel**                          | Gadiel             |      1 |
| H1440  | gid.om                   | Gidom                  | **Gidom**                           | Gidom              |      1 |
| H1445  | ge.der                   | Geder                  | **Geder**                           | Geder              |      1 |
| H1451  | ge.de.ri                 | Gederite               | **gederita**                        | gederita           |      1 |
| H1452  | ge.de.ra.ti              | Gederathite            | **gederatita**                      | gederatita         |      1 |
| H1453  | ge.de.ro.ta.yim          | Gederothaim            | **Gederotaim**                      | Gederotaim         |      1 |
| H1477  | gu.ni                    | Gunite                 | **gunita**                          | gunitas            |      1 |
| H1483  | gur                      | Gur                    | **Gur**                             | Gur                |      1 |
| H1493  | gi.zo.ni                 | Gizonite               | **gizonita**                        | gizonita           |      1 |
| H1511  | giz.ri                   | Girzite                | **gerzita**                         |                    |      1 |
| H1514  | ga.cham                  | Gaham                  | **Gaham**                           | Gaham              |      1 |
| H1520  | gi.ach                   | Giah                   | **Gía**                             | Gía                |      1 |
| H1529  | ge.shan                  | Geshan                 | **Gesán**                           |                    |      1 |
| H1553  | ge.li.lot                | Geliloth               | **Gelilot**                         | Gelilot            |      1 |
| H1562  | gi.la.lay                | Gilalai                | **Gilalai**                         | Gilalai            |      1 |
| H1577  | ga.mul                   | Gamul                  | **Gamul**                           | Gamul              |      1 |
| H1579  | gim.zo                   | Gimzo                  | **Gimzo**                           | Gimzo              |      1 |
| H1582  | ge.mal.li                | Gemalli                | **Gemali**                          | Gemali             |      1 |
| H1601  | go.ah                    | Goah                   | **Goa**                             | Goa                |      1 |
| H1628  | ge.rut                   | Geruth                 | **morada**                          |                    |      1 |
| H1636  | gar.mi                   | Garmite                | **huesudo**                         |                    |      1 |
| H1658  | gish.pa                  | Gishpa                 | **Gispa**                           | Gispa              |      1 |
| H1689  | div.lah                  | Riblah                 | **Dibla**                           | Diblat             |      1 |
| H1691  | div.la.yim               | Diblaim                | **Diblaim**                         | Diblaim            |      1 |
| H1704  | div.ri                   | Dibri                  | **Dibri**                           | Dibri              |      1 |
| H1708  | dab.be.shet              | Dabbesheth             | **Dabeset**                         | Dabeset            |      1 |
| H1720  | de.da.nim                | Dedanite               | **dedanitas**                       |                    |      1 |
| H1723  | da.ha.va                 | Dehavite               | **los daveos**                      |                    |      1 |
| H1735  | do.da.va.hu              | Dodavahu               | **Dodava**                          | Dodava             |      1 |
| H1737  | do.day                   | Dodai                  | **Dodai**                           | Dodai              |      1 |
| H1757  | du.ra                    | Dura                   | **Dura**                            | Dura               |      1 |
| H1776  | di.mo.nah                | Dimonah                | **Dimona**                          | Dimona             |      1 |
| H1784  | di.nay                   | judge                  | **dineo**                           |                    |      1 |
| H1810  | dil.an                   | Dilean                 | **Dilán**                           |                    |      1 |
| H1813  | dal.phon                 | Dalphon                | **Dalfón**                          | Dalfón             |      1 |
| H1829  | dim.nah                  | Dimnah                 | **Dimna**                           | Dimna              |      1 |
| H1837  | dan.nah                  | Dannah                 | **Dana**                            | Dana               |      1 |
| H1842  | dan ya.an                | Jaan                   | **Dan-jaán**                        |                    |      1 |
| H1862  | dar.da                   | Darda                  | **Darda**                           | Darda              |      1 |
| H1873  | da.ra                    | Dara                   | **Dara**                            | Dara               |      1 |
| H1914  | hid.day                  | Hiddai                 | **Hidai**                           | Hidai              |      1 |
| H1919  | ha.das.sah               | Hadassah               | **Hadasa**                          | Hadasa             |      1 |
| H1924  | ha.dar                   | Hadar                  | **Hadar**                           | Hadar              |      1 |
| H1936  | hod                      | Hod                    | **Hod**                             | Hod                |      1 |
| H1937  | ho.de.vah                | Hodevah                | **Hodevá**                          |                    |      1 |
| H1940  | ho.diy.yah               | Hodiah                 | **judía**                           |                    |      1 |
| H1944  | ho.ham                   | Hoham                  | **Hoham**                           | Hoham              |      1 |
| H1950  | ho.mam                   | Hemam                  | **Homam**                           | Homam              |      1 |
| H1953  | ho.sha.ma                | Hoshama                | **Hosama**                          | Hosama             |      1 |
| H1967  | he.mam                   | Hemam                  | **Hemam**                           | Hemam              |      1 |
| H1987  | he.lem                   | Helem                  | **Hélem**                           | Helem              |      1 |
| H1990  | ham                      | Ham                    | **Ham**                             | Ham                |      1 |
| H1997  | ha.mo.nah                | Hamonah                | **Hamona**                          | Hamona             |      1 |
| H2024  | ha.ra                    | Hara                   | **Hara**                            | Hara               |      1 |
| H2033  | ha.ro.ri                 | Harod                  | **harorita**                        |                    |      1 |
| H2036  | ho.ram                   | Horam                  | **Horam**                           | Horam              |      1 |
| H2037  | ha.rum                   | Harum                  | **Harum**                           | Harum              |      1 |
| H2038  | har.mon                  | Harmon                 | **castillo**                        |                    |      1 |
| H2044  | ha.shem                  | Hashem                 | **Hasem**                           | Hasem              |      1 |
| H2051  | ve.dan                   | casks                  | **Vedán**                           |                    |      1 |
| H2052  | va.hev                   | Waheb                  | **Vaheb**                           |                    |      1 |
| H2055  | vay.za.ta                | Vaizatha               | **Vaizata**                         | Vaizata            |      1 |
| H2057  | van.yah                  | Vaniah                 | **Vanías**                          | Vanías             |      1 |
| H2058  | voph.si                  | Vophsi                 | **Vofsi**                           |                    |      1 |
| H2059  | vash.ni                  | second                 | **Vasni**                           | Vasni              |      1 |
| H2071  | za.vud                   | Zabud                  | **Zabud**                           | Zabud              |      1 |
| H2079  | zab.bay                  | Zabbai                 | **Zabai**                           | Zabai              |      1 |
| H2080  | ze.vi.dah                | Zebidah                | **Zebuda**                          | Zebuda             |      1 |
| H2081  | ze.vi.na                 | Zebina                 | **Zebina**                          | Zebina             |      1 |
| H2093  | za.ham                   | Zaham                  | **Zaham**                           | Zaham              |      1 |
| H2104  | zu.zim                   | Zuzim                  | **zuzitas**                         | zuzitas            |      1 |
| H2105  | zo.chet                  | Zoheth                 | **Zohet**                           | Zohet              |      1 |
| H2117  | za.za                    | Zaza                   | **Zaza**                            | Zaza               |      1 |
| H2120  | zo.che.let               | Serpent's              | **Zohélet**                         | Zohelet            |      1 |
| H2127  | zi.a                     | Zia                    | **Zía**                             | Zía                |      1 |
| H2129  | zi.phah                  | Ziphah                 | **Zifa**                            | Zifa               |      1 |
| H2133  | ze.tan                   | Zethan                 | **Zetán**                           | Zetán              |      1 |
| H2144  | ze.kher                  | Zecher                 | **Zequer**                          | Zequer             |      1 |
| H2157  | zam.zom                  | Zamzummin              | **zomzomeo**                        | zomzomeos          |      1 |
| H2160  | ze.mi.rah                | Zemirah                | **Zemira**                          | Zemira             |      1 |
| H2202  | ziph.ron                 | Ziphron                | **Zifrón**                          | Zifrón             |      1 |
| H2217  | ze.rub.ba.vel            | Zerubbabel             | **Zorobabel**                       | Zorobabel          |      1 |
| H2242  | ze.tar                   | Zethar                 | **Zetar**                           | Zetar              |      1 |
| H2262  | cha.vats.tsan.yah        | Habazziniah            | **Habazinías**                      |                    |      1 |
| H2277  | chev.ri                  | Heberite               | **heberita**                        | heberitas          |      1 |
| H2285  | cha.gav                  | Hagab                  | **Hagab**                           | Hagab              |      1 |
| H2293  | chag.giy.yah             | Haggiah                | **Haguía**                          | Haguía             |      1 |
| H2311  | chad.lay                 | Hadlai                 | **Hadlai**                          | Hadlai             |      1 |
| H2317  | chad.rakh                | Hadrach                | **Hadrac**                          | Hadrac             |      1 |
| H2321  | cho.desh                 | Hodesh                 | **Hodes**                           | Hodes              |      1 |
| H2322  | cha.da.shah              | Hadashah               | **Hadasa**                          | Hadasa             |      1 |
| H2327  | cho.vah                  | Hobah                  | **Hoba**                            | Hoba               |      1 |
| H2335  | cho.zay                  | seer                   | **Hozai**                           |                    |      1 |
| H2349  | chu.pham                 | Hupham                 | **Hufam**                           | Hufam              |      1 |
| H2350  | chu.pha.mi               | Huphamite              | **hufamita**                        | hufamitas          |      1 |
| H2359  | chu.ri                   | Huri                   | **Huri**                            | Huri               |      1 |
| H2360  | chu.ray                  | Hurai                  | **Hurai**                           | Hurai              |      1 |
| H2364  | chu.shah                 | Hushah                 | **Husa**                            | Husa               |      1 |
| H2375  | cha.zo                   | Hazo                   | **Hazo**                            | Hazo               |      1 |
| H2381  | cha.zi.el                | Haziel                 | **Haziel**                          | Haziel             |      1 |
| H2382  | cha.za.yah               | Hazaiah                | **Hazaías**                         | Hazaías            |      1 |
| H2383  | chez.yon                 | Hezion                 | **Hezión**                          | Hezión             |      1 |
| H2395  | chiz.qi                  | Hizki                  | **Hezequi**                         |                    |      1 |
| H2419  | chi.el                   | Hiel                   | **Hiel**                            | Hiel               |      1 |
| H2432  | chi.len                  | Hilen                  | **Hilén**                           | Hilén              |      1 |
| H2460  | che.lev                  | Heleb                  | **Heleb**                           | Heleb              |      1 |
| H2462  | chel.bah                 | Helbah                 | **Helba**                           | Helba              |      1 |
| H2463  | chel.bon                 | Helbon                 | **Helbón**                          | Helbón             |      1 |
| H2466  | che.led                  | Heled                  | **Heled**                           | Heled              |      1 |
| H2478  | chal.chul                | Halhul                 | **Halhul**                          | Halhul             |      1 |
| H2482  | cha.li                   | Hali                   | **Halí**                            | Halí               |      1 |
| H2494  | che.lem                  | Helem                  | **Helem**                           | Helem              |      1 |
| H2501  | che.leph                 | Heleph                 | **Hélef**                           | Helef              |      1 |
| H2516  | chel.qi                  | Helekite               | **helequita**                       | helequitas         |      1 |
| H2517  | chel.qay                 | Helkai                 | **Helcai**                          | Helcai             |      1 |
| H2533  | chem.dan                 | Hemdan                 | **Hemdán**                          | Hemdán             |      1 |
| H2536  | cham.mu.el               | Hammuel                | **Hamuel**                          | Hamuel             |      1 |
| H2539  | cha.mu.li                | Hamulite               | **hamulita**                        | hamulitas          |      1 |
| H2547  | chum.tah                 | Humtah                 | **Humta**                           | Humta              |      1 |
| H2566  | cham.ran                 | Hemdan                 | **Hamrán**                          | Hamrán             |      1 |
| H2581  | chen                     | Hen                    | **Hen**                             | Hen                |      1 |
| H2599  | cha.no.khi               | Hanochite              | **henoquita**                       |                    |      1 |
| H2609  | cha.nes                  | Hanes                  | **Hanes**                           | Hanes              |      1 |
| H2615  | chan.na.ton              | Hannathon              | **Hanatón**                         | Hanatón            |      1 |
| H2618  | che.sed                  | Hesed                  | **Quesed**                          |                    |      1 |
| H2619  | cha.sad.yah              | Hasadiah               | **Hasadías**                        | Hasadías           |      1 |
| H2641  | chas.rah                 | Hasrah                 | **Hasra**                           |                    |      1 |
| H2647  | chup.pah                 | Huppah                 | **Hupa**                            | Hupa               |      1 |
| H2662  | cheph.ri                 | Hepherite              | **heferita**                        | heferitas          |      1 |
| H2663  | cha.pha.ra.yim           | Hapharaim              | **Hafaraim**                        | Hafaraim           |      1 |
| H2736  | char.ha.yah              | Harhaiah               | **Harhaía**                         | Harhaía            |      1 |
| H2739  | cha.ru.maph              | Harumaph               | **Harumaf**                         | Harumaf            |      1 |
| H2741  | cha.ru.phi               | Haruphite              | **harufita**                        | harufita           |      1 |
| H2743  | cha.ruts                 | Haruz                  | **Haruz**                           | Haruz              |      1 |
| H2745  | char.chas                | Harhas                 | **Harhas**                          | Harhas             |      1 |
| H2765  | cho.rem                  | Horem                  | **Horem**                           | Horem              |      1 |
| H2769  | cher.mo.nim              | Hermon                 | **Hermón**                          |                    |      1 |
| H2774  | char.ne.pher             | Harnepher              | **Harnefer**                        | Harnefer           |      1 |
| H2780  | cha.reph                 | Hareph                 | **Haref**                           | Haref              |      1 |
| H2792  | che.resh                 | Heresh                 | **Heres**                           | Heres              |      1 |
| H2798  | cha.ra.shim              | (Ge)-harashim          | **artesanos**                       |                    |      1 |
| H2802  | che.ret                  | Hereth                 | **Haret**                           | Haret              |      1 |
| H2806  | chash.bad.da.nah         | Hashbaddanah           | **Hasbadana**                       | Hasbadana          |      1 |
| H2807  | cha.shu.vah              | Hashubah               | **Casuba**                          |                    |      1 |
| H2812  | cha.shav.nah             | Hashabnah              | **Hasabna**                         | Hasabna            |      1 |
| H2829  | chesh.mon                | Heshmon                | **Hesmón**                          | Hesmón             |      1 |
| H2867  | cha.tat                  | Hathath                | **Hatat**                           | Hatat              |      1 |
| H2875  | te.vach                  | Tebah                  | **Tébah**                           |                    |      1 |
| H2880  | tiv.chat                 | Tibhath                | **Tibhat**                          | Tibhat             |      1 |
| H2882  | te.val.ya.hu             | Tebaliah               | **Tebalías**                        | Tebalías           |      1 |
| H2886  | tav.rim.mon              | Tabrimmon              | **Tabrimón**                        | Tabrimón           |      1 |
| H2887  | te.vet                   | Tebeth                 | **Tebet**                           | Tebet              |      1 |
| H2888  | tab.bat                  | Tabbath                | **Tabat**                           | Tabat              |      1 |
| H2923  | te.la.im                 | Telaim                 | **Telaim**                          | Telaim             |      1 |
| H2955  | ta.phat                  | Taphath                | **Tafat**                           | Tafat              |      1 |
| H2967  | tar.pe.lay               | officials              | **tarpelita**                       |                    |      1 |
| H2972  | ya.i.ri                  | Jairite                | **jairita**                         |                    |      1 |
| H2979  | ye.a.te.ray              | Jeatherai              | **Jeaterai**                        |                    |      1 |
| H2989  | ya.val                   | Jabal                  | **Jabal**                           | Jabal              |      1 |
| H2996  | yav.neh                  | Jabneh                 | **Jabne**                           |                    |      1 |
| H2997  | yiv.ne.yah               | Ibneiah                | **Ibneías**                         | Ibneías            |      1 |
| H2998  | yiv.niy.yah              | Ibnijah                | **Ibnías**                          | Ibnías             |      1 |
| H3000  | ye.ve.rekh.ya.hu         | Jeberechiah            | **Jeberequías**                     | Jeberequías        |      1 |
| H3005  | yiv.sam                  | Ibsam                  | **Ibsam**                           |                    |      1 |
| H3012  | yig.dal.ya.hu            | Igdaliah               | **Igdalías**                        | Igdalías           |      1 |
| H3017  | ya.gur                   | Jagur                  | **Jagur**                           | Jagur              |      1 |
| H3020  | yog.li                   | Jogli                  | **Jogli**                           | Jogli              |      1 |
| H3030  | yid.a.lah                | Idalah                 | **Idala**                           | Idala              |      1 |
| H3031  | yid.bash                 | Idbash                 | **Idbas**                           |                    |      1 |
| H3036  | ya.don                   | Jadon                  | **Jadón**                           | Jadón              |      1 |
| H3040  | ye.di.dah                | Jedidah                | **Jedida**                          | Jedida             |      1 |
| H3041  | ye.did.yah               | Jedidiah               | **Jedidías**                        | Jedidías           |      1 |
| H3044  | yid.laph                 | Jidlaph                | **Idlaf**                           |                    |      1 |
| H3055  | ye.hud                   | Jehud                  | **Jehud**                           | Jehúd              |      1 |
| H3056  | yeh.day                  | Jahdai                 | **Jehdai**                          |                    |      1 |
| H3057  | ye.hu.diy.yah            | Judahite wife          | **Jehudías**                        |                    |      1 |
| H3067  | ye.hu.dit                | Judith                 | **Judit**                           | Judit              |      1 |
| H3081  | ye.hu.khal               | Jehucal                | **Jehucal**                         |                    |      1 |
| H3084  | ye.ho.seph               | Joseph                 | **José**                            | José               |      1 |
| H3089  | ye.ho.she.va             | Jehosheba              | **Josaba**                          | Josaba             |      1 |
| H3102  | yov                      | Yob                    | **Job**                             | Job                |      1 |
| H3106  | yu.val                   | Jubal                  | **Jubal**                           | Jubal              |      1 |
| H3112  | yo.ya.khin               | Jehoiachin             | **Joaquín**                         | Joaquín            |      1 |
| H3116  | yu.khal                  | Jucal                  | **Jucal**                           | Jucal              |      1 |
| H3125  | ye.va.ni                 | Greek                  | **griego**                          | griegos            |      1 |
| H3131  | yo.siph.yah              | Josiphiah              | **Josifías**                        | Josifías           |      1 |
| H3132  | yo.e.lah                 | Joelah                 | **Joela**                           | Joela              |      1 |
| H3133  | yo.ed                    | Joed                   | **Joed**                            | Joed               |      1 |
| H3134  | yo.e.zer                 | Joezer                 | **Joezer**                          | Joezer             |      1 |
| H3137  | yo.qim                   | Jokim                  | **Joacim**                          | Joacim             |      1 |
| H3139  | yo.rah                   | Jorah                  | **Jora**                            | Jora               |      1 |
| H3140  | yo.ray                   | Jorai                  | **Jorai**                           | Jorai              |      1 |
| H3143  | yo.shiv.yah              | Joshibiah              | **Josibías**                        | Josibías           |      1 |
| H3144  | yo.shah                  | Joshah                 | **Josa**                            |                    |      1 |
| H3145  | yo.shav.yah              | Joshaviah              | **Josavías**                        |                    |      1 |
| H3149  | ye.zav.el                | Jeziel                 | **Jezavel**                         |                    |      1 |
| H3150  | yiz.ziy.yah              | Izziah                 | **Izías**                           |                    |      1 |
| H3151  | ya.ziz                   | Jaziz                  | **Jaziz**                           | Jaziz              |      1 |
| H3152  | yiz.li.ah                | Izliah                 | **Jizlía**                          |                    |      1 |
| H3153  | ye.zan.yah               | Jezaniah               | **Jezanías**                        | Jezanías           |      1 |
| H3155  | yiz.rach                 | Izrahite               | **izraíta**                         | izraíta            |      1 |
| H3160  | ye.chub.bah              | Jehubbah               | **Jecuba**                          |                    |      1 |
| H3163  | yach.do                  | Jahdo                  | **Jado**                            |                    |      1 |
| H3164  | yach.di.el               | Jahdiel                | **Jadiel**                          |                    |      1 |
| H3167  | yach.ze.yah              | Jahzeiah               | **Jazías**                          |                    |      1 |
| H3170  | yach.ze.rah              | Jahzerah               | **Jazera**                          | Jazera             |      1 |
| H3174  | ye.chiy.yah              | Jehiah                 | **Jehías**                          | Jehías             |      1 |
| H3178  | yach.le.e.li             | Jahleelite             | **jahleelita**                      |                    |      1 |
| H3181  | yach.may                 | Jahmai                 | **Jahmai**                          | Jahmai             |      1 |
| H3184  | yach.tse.e.li            | Jahzeelite             | **jahzeelita**                      | jahzeelitas        |      1 |
| H3185  | yach.tsi.el              | Jahziel                | **Jahzeel**                         |                    |      1 |
| H3192  | yot.vah                  | Jotbah                 | **Jotba**                           | Jotba              |      1 |
| H3200  | ya.khi.ni                | Jachinite              | **jaquinita**                       | jaquinitas         |      1 |
| H3210  | ya.lon                   | Jalon                  | **Jalón**                           | Jalón              |      1 |
| H3224  | ye.mi.mah                | Jemimah                | **Jemima**                          | Jemima             |      1 |
| H3230  | yam.lekh                 | Jamlech                | **Jamlec**                          | Jamlec             |      1 |
| H3234  | yim.na                   | Imna                   | **Imna**                            | Imna               |      1 |
| H3236  | yim.rah                  | Imrah                  | **Imra**                            | Imra               |      1 |
| H3241  | ya.nim                   | Janim                  | **Janum**                           | Janum              |      1 |
| H3252  | yis.kah                  | Iscah                  | **Isca**                            | Isca               |      1 |
| H3253  | yis.makh.ya.hu           | Ismachiah              | **Jismaquías**                      |                    |      1 |
| H3260  | ye.di                    | Iddo                   | **Jedí**                            |                    |      1 |
| H3262  | ye.u.el                  | Jeuel                  | **Jeuel**                           | Jeuel              |      1 |
| H3263  | ye.uts                   | Jeuz                   | **Jeús**                            |                    |      1 |
| H3265  | ya.ur                    | Jair                   | **Jaur**                            |                    |      1 |
| H3268  | ya.a.zi.el               | Jaaziel                | **Jaaziel**                         | Jaaziel            |      1 |
| H3275  | ya.kan                   | Jacan                  | **Jacán**                           | Jacán              |      1 |
| H3285  | ya.a.nay                 | Janai                  | **Jaanai**                          | Jaanai             |      1 |
| H3291  | ya.a.qo.vah              | Jaakobah               | **Jacoba**                          |                    |      1 |
| H3292  | ya.a.qan                 | Akan                   | **Jaacán**                          | Jaacán             |      1 |
| H3297  | ye.a.rim                 | (Mount) Jearim         | **Jearim**                          | Jearim             |      1 |
| H3298  | ya.a.resh.yah            | Jaareshiah             | **Jaaresías**                       |                    |      1 |
| H3299  | ya.a.su                  | Jaasu                  | **Jaasú**                           |                    |      1 |
| H3301  | yiph.de.yah              | Iphdeiah               | **Ifdeías**                         |                    |      1 |
| H3311  | yaph.le.ti               | Japhletite             | **jafletita**                       | jafletitas         |      1 |
| H3339  | yits.ri                  | Izri                   | **Yizri**                           |                    |      1 |
| H3340  | yits.ri                  | Jezerite               | **jizrita**                         |                    |      1 |
| H3343  | ye.qav.tse.el            | Jekabzeel              | **Jecabseel**                       | Jecabseel          |      1 |
| H3347  | yoq.de.am                | Jokdeam                | **Jocdeam**                         | Jocdeam            |      1 |
| H3348  | ya.qeh                   | Jakeh                  | **Jaqué**                           | Jaqué              |      1 |
| H3354  | ye.qu.ti.el              | Jekuthiel              | **Jecutiel**                        | Jecutiel           |      1 |
| H3375  | yir.on                   | Yiron                  | **Irón**                            | Irón               |      1 |
| H3380  | ye.rub.be.shet           | Jerubbesheth           | **Jerobeset**                       |                    |      1 |
| H3385  | ye.ru.el                 | Jeruel                 | **Jeruel**                          | Jeruel             |      1 |
| H3386  | ya.ro.ach                | Jaroah                 | **Jaroa**                           | Jaroa              |      1 |
| H3400  | ye.ri.el                 | Jeriel                 | **Jeriel**                          | Jeriel             |      1 |
| H3403  | ye.ri.vay                | Jeribai                | **Jeribai**                         |                    |      1 |
| H3408  | ye.ri.ot                 | Jerioth                | **Jerigot**                         |                    |      1 |
| H3413  | ye.re.may                | Jeremai                | **Jeremai**                         | Jeremai            |      1 |
| H3416  | yir.pe.el                | Irpeel                 | **Irpeel**                          | Irpeel             |      1 |
| H3421  | yor.qe.am                | Jorkeam                | **Jorqueam**                        |                    |      1 |
| H3428  | ye.shev.av               | Jeshebeab              | **Jesebeab**                        | Jesebeab           |      1 |
| H3431  | yish.bach                | Ishbah                 | **Isbac**                           |                    |      1 |
| H3432  | ya.shu.vi                | Jashubite              | **jasubita**                        | jasubitas          |      1 |
| H3439  | ye.sho.cha.yah           | Jeshohaiah             | **Jesohaía**                        | Jesohaía           |      1 |
| H3441  | yish.vi                  | Ishvite                | **isvita**                          | isvitas            |      1 |
| H3443  | ye.shu.a                 | Jeshua                 | **Jesúa**                           | Jesúa              |      1 |
| H3450  | ye.shi.ma.el             | Jesimiel               | **Jesimael**                        |                    |      1 |
| H3454  | ye.shi.sah               | Jeshishai              | **Jesisai**                         | Jesisai            |      1 |
| H3457  | yish.ma                  | Ishma                  | **Isma**                            | Isma               |      1 |
| H3461  | yish.me.ray              | Ishmerai               | **Ismerai**                         | Ismerai            |      1 |
| H3464  | ya.shen                  | Jashen                 | **Jasén**                           | Jasén              |      1 |
| H3472  | yish.pah                 | Ishpah                 | **Ispa**                            | Ispa               |      1 |
| H3473  | yish.pan                 | Ishpan                 | **Ispán**                           | Ispán              |      1 |
| H3475  | ye.sher                  | Jesher                 | **Jeser**                           | Jeser              |      1 |
| H3480  | ye.sar.e.lah             | Jesharelah             | **Jesarela**                        | Jesarela           |      1 |
| H3494  | yit.lah                  | Ithlah                 | **Itla**                            |                    |      1 |
| H3495  | yit.mah                  | Ithmah                 | **Itma**                            | Itma               |      1 |
| H3496  | yat.ni.el                | Jathniel               | **Jatniel**                         | Jatniel            |      1 |
| H3497  | yit.nan                  | Ithnan                 | **Itnán**                           | Itnán              |      1 |
| H3501  | yit.ra                   | Ithra                  | **Itra**                            | Itra               |      1 |
| H3522  | kab.bon                  | Cabbon                 | **Cabón**                           | Cabón              |      1 |
| H3552  | kuv                      | Libya                  | **Cub**                             |                    |      1 |
| H3560  | kun                      | Cun                    | **Cun**                             | Cun                |      1 |
| H3570  | ku.shi                   | Cushi                  | **Cusi**                            | Cusi               |      1 |
| H3572  | ku.shan                  | Cushan                 | **Cusán**                           | Cusán              |      1 |
| H3578  | ko.ze.va                 | Cozeba                 | **Cozeba**                          | Cozeba             |      1 |
| H3580  | ke.ziv                   | Chezib                 | **Quezib**                          | Quezib             |      1 |
| H3592  | ki.don                   | Chidon                 | **Cidón**                           |                    |      1 |
| H3594  | kiy.yun                  | Kiyyun                 | **propiamente**                     |                    |      1 |
| H3609  | kil.av                   | Chileab                | **Quileab**                         | Quileab            |      1 |
| H3614  | ka.lib.bo                | Calebite               | **calebita**                        |                    |      1 |
| H3621  | ke.lu.vay                | Chelubai               | **Quelubai**                        | Quelubai           |      1 |
| H3622  | ke.lu.hay                | Cheluhi                | **Queluhai**                        |                    |      1 |
| H3636  | ke.lal                   | Chelal                 | **Celal**                           |                    |      1 |
| H3638  | kil.mad                  | Chilmad                | **Quilmad**                         | Quilmad            |      1 |
| H3656  | kan.neh                  | Canneh                 | **Cane**                            | Cane               |      1 |
| H3662  | ke.na.ni                 | Chenani                | **Quenani**                         | Quenani            |      1 |
| H3679  | kas.day                  | Chaldean               | **casdita**                         |                    |      1 |
| H3686  | ke.sil                   | Chesil                 | **Quesil**                          | Quesil             |      1 |
| H3692  | kis.lon                  | Chislon                | **Quislón**                         | Quislón            |      1 |
| H3693  | ke.sa.lon                | Chesalon               | **Quesalón**                        | Quesalón           |      1 |
| H3694  | ke.sul.lot               | Chesulloth             | **Quesulot**                        | Quesulot           |      1 |
| H3726  | ke.phar ha.am.mo.ni      | (Chephar)-ammoni       | **Cefar-haamoní**                   |                    |      1 |
| H3752  | kar.kas                  | Carkas                 | **Carcas**                          | Carcas             |      1 |
| H3757  | kar.mi                   | Carmite                | **carmita**                         | carmitas           |      1 |
| H3771  | kar.she.na               | Carshena               | **Carsena**                         | Carsena            |      1 |
| H3777  | ke.sed                   | Chesed                 | **Quesed**                          | Quesed             |      1 |
| H3798  | kit.lish                 | Chitlish               | **Quitlis**                         | Quitlis            |      1 |
| H3815  | la.el                    | Lael                   | **Lael**                            | Lael               |      1 |
| H3817  | le.um.mim                | Leummim                | **Leumim**                          | Leumim             |      1 |
| H3822  | le.va.ot                 | Lebaoth                | **Lebaot**                          | Lebaot             |      1 |
| H3829  | le.vo.nah                | Lebonah                | **Lebona**                          | Lebona             |      1 |
| H3855  | la.had                   | Lahad                  | **Lahad**                           | Lahad              |      1 |
| H3902  | lach.mi                  | Lahmi                  | **Lahmi**                           | Lahmi              |      1 |
| H3903  | lach.mas                 | Lahmam                 | **Laquemam / Laquemas**             |                    |      1 |
| H3912  | le.tu.shim               | Letushim               | **letusim**                         | Letusim            |      1 |
| H3922  | le.khah                  | Lecah                  | **Leca**                            | Leca               |      1 |
| H3935  | la.dah                   | Laadah                 | **Lada**                            |                    |      1 |
| H3941  | lap.pi.dot               | Lappidoth              | **Lapidot**                         | Lapidot            |      1 |
| H3946  | laq.qum                  | Lakkum                 | **Lacum**                           | Lacum              |      1 |
| H3949  | liq.chi                  | Likhi                  | **Lichi**                           |                    |      1 |
| H3962  | le.sah                   | Lasha                  | **Lesa**                            |                    |      1 |
| H4006  | miv.char                 | Mibhar                 | **Mibhar**                          | Mibhar             |      1 |
| H4012  | me.vun.nay               | Mebunnai               | **Mebunai**                         | Mebunai            |      1 |
| H4019  | mag.bish                 | Magbish                | **Magbis**                          | Magbis             |      1 |
| H4047  | mag.pi.ash               | Magpiash               | **Magpías**                         | Magpías            |      1 |
| H4075  | ma.da.ah                 | Mede                   | **meda**                            |                    |      1 |
| H4077  | ma.da.ah                 | Mede                   | **medo**                            |                    |      1 |
| H4081  | mid.din                  | Middin                 | **Madián**                          |                    |      1 |
| H4086  | mad.men                  | Madmen                 | **Madmén**                          | Madmén             |      1 |
| H4088  | mad.me.nah               | Madmenah               | **Madmena**                         | Madmena            |      1 |
| H4092  | me.da.ni                 | Midianite              | **madianita**                       | madianitas         |      1 |
| H4104  | me.hu.man                | Mehuman                | **Mehumán**                         | Mehumán            |      1 |
| H4140  | mo.lid                   | Molid                  | **Molid**                           | Molid              |      1 |
| H4153  | mo.ad.yah                | Moadiah                | **Moadías**                         | Moadías            |      1 |
| H4233  | ma.cha.vim               | Mahavite               | **macavita**                        |                    |      1 |
| H4235  | ma.chol                  | Mahol                  | **Mahol**                           | Mahol              |      1 |
| H4243  | me.chir                  | Mehir                  | **Mequir**                          |                    |      1 |
| H4309  | mat.ri                   | Matrite                | **Matri**                           | Matri              |      1 |
| H4331  | me.sah                   | Mesha                  | **Mesa**                            | Mesa               |      1 |
| H4333  | mi.sha.el                | Mishael                | **Misael**                          | Misael             |      1 |
| H4335  | me.shakh                 | Meshach                | **Mesac**                           | Mesac              |      1 |
| H4338  | me.sah                   | Mesha                  | **Mesa**                            | Mesa               |      1 |
| H4343  | makh.be.nah              | Machbenah              | **Macbena**                         | Macbena            |      1 |
| H4344  | makh.ban.nay             | Machbannai             | **Macbanai**                        | Macbanai           |      1 |
| H4352  | ma.khi                   | Machi                  | **Maqui**                           | Maqui              |      1 |
| H4354  | ma.khi.ri                | Machirite              | **maquirita**                       | maquiritas         |      1 |
| H4367  | makh.nad.vay             | Machnadebai            | **Macnadbai**                       |                    |      1 |
| H4368  | me.kho.nah               | Meconah                | **Mecona**                          | Mecona             |      1 |
| H4381  | mikh.ri                  | Michri                 | **Micri**                           | Micri              |      1 |
| H4382  | me.khe.ra.ti             | Mecherathite           | **mequeratita**                     | mequeratita        |      1 |
| H4389  | makh.tesh                | Mortar                 | **el Mactes**                       | Mactes             |      1 |
| H4401  | mal.a.khi                | Malachi                | **Malaquías**                       | Malaquías          |      1 |
| H4424  | me.lat.yah               | Melatiah               | **Melatías**                        | Melatías           |      1 |
| H4440  | mal.ki.e.li              | Malchielite            | **malquielita**                     | malquielitas       |      1 |
| H4443  | mal.ki.ram               | Malchiram              | **Malquiram**                       | Malquiram          |      1 |
| H4447  | mo.le.khet               | Hammolecheth           | **Molequet**                        |                    |      1 |
| H4450  | mi.la.lay                | Milalai                | **Milalai**                         | Milalai            |      1 |
| H4507  | me.ni                    | Destiny                | **el Distribuidor**                 |                    |      1 |
| H4508  | min.ni                   | Minni                  | **Miní**                            | Mini               |      1 |
| H4558  | mis.par                  | Mispar                 | **Mispar**                          | Mispar             |      1 |
| H4559  | mis.pe.ret               | Mispereth              | **Mispéret**                        | Misperet           |      1 |
| H4572  | ma.a.day                 | Maadai                 | **Maadai**                          |                    |      1 |
| H4573  | ma.a.de.yah              | Maadiah                | **Maadías**                         | Maadías            |      1 |
| H4582  | ma.okh                   | Maoch                  | **Maoc**                            | Maoc               |      1 |
| H4587  | me.o.no.tay              | Meonothai              | **Meonotai**                        | Meonotai           |      1 |
| H4597  | ma.ay                    | Maai                   | **Maai**                            | Maai               |      1 |
| H4619  | ma.ats                   | Maaz                   | **Maaz**                            | Maaz               |      1 |
| H4632  | me.a.rah                 | Mearah                 | **Meara**                           |                    |      1 |
| H4638  | ma.a.rat                 | Maarath                | **Maarat**                          | Maarat             |      1 |
| H4640  | ma.a.say                 | Maasai                 | **Maasai**                          |                    |      1 |
| H4644  | moph                     | Memphis                | **Menfis**                          | Menfis             |      1 |
| H4649  | mup.pim                  | Muppim                 | **Mupim**                           | Mupim              |      1 |
| H4677  | me.tso.va.yah            | Mezobaite              | **Mesobaía**                        |                    |      1 |
| H4681  | mo.tsah                  | Mozah                  | **Mosa**                            |                    |      1 |
| H4706  | mits.ar                  | (Mount) Mizar          | **Mizar**                           | Mizar              |      1 |
| H4739  | ma.qats                  | Makaz                  | **Macaz**                           | Macaz              |      1 |
| H4755  | ma.ra                    | Mara                   | **Mara**                            | Mara               |      1 |
| H4781  | me.ro.dakh               | Merodach               | **Merodac**                         | Merodac            |      1 |
| H4789  | me.roz                   | Meroz                  | **Meroz**                           | Meroz              |      1 |
| H4796  | ma.rot                   | Maroth                 | **Marot**                           | Marot              |      1 |
| H4811  | me.ra.yah                | Meraiah                | **Meraías**                         | Meraías            |      1 |
| H4821  | mir.mah                  | Mirmah                 | **Mirma**                           | Mirma              |      1 |
| H4825  | me.res                   | Meres                  | **Meres**                           | Meres              |      1 |
| H4826  | mar.se.na                | Marsena                | **Marsena**                         | Marsena            |      1 |
| H4831  | mar.a.lah                | Mareal                 | **Marala**                          | Marala             |      1 |
| H4850  | me.ra.ta.yim             | Merathaim              | **Merataim**                        | Merataim           |      1 |
| H4851  | mash                     | Mash                   | **Mas**                             | Mas                |      1 |
| H4852  | me.sah                   | Mesha                  | **Mesa**                            | Mesa               |      1 |
| H4873  | mo.sheh                  | Moses                  | **Moisés**                          | Moisés             |      1 |
| H4877  | me.sho.vav               | Meshobab               | **Mesobab**                         | Mesobab            |      1 |
| H4913  | ma.shal                  | Mashal                 | **Masal**                           | Masal              |      1 |
| H4921  | me.shil.le.mit           | Meshillemith           | **Mesilemit**                       | Mesilemit          |      1 |
| H4922  | me.shul.le.met           | Meshullemeth           | **Mesulemet**                       | Mesulemet          |      1 |
| H4925  | mish.man.nah             | Mishmannah             | **Mismana**                         | Mismana            |      1 |
| H4936  | mish.am                  | Misham                 | **Misam**                           | Misam              |      1 |
| H4954  | mish.ra.i                | Mishraite              | **misraíta**                        | misraítas          |      1 |
| H4981  | mit.ni                   | Mithnite               | **mitnita**                         | mitnita            |      1 |
| H4992  | mat.tat.tah              | Mattattah              | **Matata**                          | Matata             |      1 |
| H5021  | ne.vu.shaz.ban           | Nebushazban            | **Nebusazbán**                      |                    |      1 |
| H5026  | niv.chaz                 | Nibhaz                 | **Nibhaz**                          | Nibhaz             |      1 |
| H5041  | ne.val.lat               | Neballat               | **Nebalat**                         | Nebalat            |      1 |
| H5044  | niv.shan                 | Nibshan                | **Nibsán**                          | Nibsán             |      1 |
| H5072  | ne.dav.yah               | Nedabiah               | **Nedabías**                        | Nedabías           |      1 |
| H5109  | no.vay                   | Nebai                  | **Nebai**                           | Nebai              |      1 |
| H5113  | nod                      | Nod                    | **Nod**                             | Nod                |      1 |
| H5114  | no.dav                   | Nodab                  | **Nodab**                           | Nodab              |      1 |
| H5119  | no.chah                  | Nohah                  | **Noca**                            |                    |      1 |
| H5147  | nach.bi                  | Nahbi                  | **Nahbi**                           | Nahbi              |      1 |
| H5149  | ne.chum                  | Nehum                  | **Nehum**                           | Nehum              |      1 |
| H5151  | na.chum                  | Nahum                  | **Nahúm**                           | Nahum              |      1 |
| H5163  | na.cham                  | Naham                  | **Naham**                           | Naham              |      1 |
| H5167  | na.cha.ma.ni             | Nahamani               | **Nahamani**                        | Nahamani           |      1 |
| H5179  | ne.chush.ta              | Nehushta               | **Nehusta**                         | Nehusta            |      1 |
| H5180  | ne.chush.tan             | Nehushtan              | **algo hecho de cobre**             |                    |      1 |
| H5196  | ne.ta.im                 | Netaim                 | **Netaim**                          |                    |      1 |
| H5225  | na.khon                  | Nacon                  | **Nacón**                           | Nacón              |      1 |
| H5242  | ne.mu.e.li               | Nemuelite              | **nemuelita**                       | nemuelitas         |      1 |
| H5247  | nim.rah                  | Nimrah                 | **Nimra**                           | Nimra              |      1 |
| H5269  | ne.ah                    | Neah                   | **Nea**                             | Nea                |      1 |
| H5272  | ne.i.el                  | Neiel                  | **Neiel**                           | Neiel              |      1 |
| H5277  | na.am                    | Naam                   | **Naam**                            | Naam               |      1 |
| H5280  | na.a.mi                  | Naamite                | **naamanita**                       |                    |      1 |
| H5293  | na.a.ray                 | Naarai                 | **Naarai**                          | Naarai             |      1 |
| H5295  | na.a.ran                 | Naaran                 | **Naarán**                          | Naarán             |      1 |
| H5300  | ne.phush.sim             | Nephushesim            | **Nefusesim**                       |                    |      1 |
| H5302  | no.phach                 | Nophah                 | **Nofa**                            | Nofa               |      1 |
| H5304  | ne.phi.sim               | Nephisim               | **Nefusim**                         | Nefusim            |      1 |
| H5334  | ne.tsiv                  | Nezib                  | **Nesib**                           |                    |      1 |
| H5346  | ne.qev                   | (Adami)-nekeb          | **Necob**                           |                    |      1 |
| H5370  | ne.re.gal                | Nergal                 | **Nergal**                          | Nergal             |      1 |
| H5453  | siv.ra.yim               | Sibraim                | **Sibraim**                         | Sibraim            |      1 |
| H5471  | so                       | So                     | **So**                              |                    |      1 |
| H5476  | so.di                    | Sodi                   | **Sodi**                            | Sodi               |      1 |
| H5477  | su.ach                   | Suah                   | **Súah**                            |                    |      1 |
| H5485  | su.si                    | Susi                   | **Susi**                            | Susi               |      1 |
| H5489  | suph                     | Suph                   | **el mar de**                       |                    |      1 |
| H5495  | sur                      | Sur                    | **Sur**                             | Sur                |      1 |
| H5510  | si.van                   | Sivan                  | **Siván**                           | Siván              |      1 |
| H5515  | si.nim                   | Syene                  | **Sinim**                           | Sinim              |      1 |
| H5525  | suk.ki                   | Sukkiim                | **sucita**                          |                    |      1 |
| H5527  | se.kha.khah              | Secacah                | **Secaca**                          | Secaca             |      1 |
| H5538  | sil.la                   | Silla                  | **Sila**                            | Sila               |      1 |
| H5565  | se.makh.ya.hu            | Semachiah              | **Semaquías**                       |                    |      1 |
| H5573  | se.neh                   | Seneh                  | **Sene**                            | Sene               |      1 |
| H5574  | se.nu.ah                 | Hassenuah              | **Senúa**                           | Senúa              |      1 |
| H5578  | san.san.nah              | Sansannah              | **Sansana**                         | Sansana            |      1 |
| H5593  | saph                     | Saph                   | **Saf**                             | Saf                |      1 |
| H5598  | sip.pay                  | Sippai                 | **Sipai**                           | Sipai              |      1 |
| H5611  | se.phar                  | Sephar                 | **Sefar**                           | Sefar              |      1 |
| H5614  | se.pha.rad               | Sepharad               | **Sefarad**                         | Sefarad            |      1 |
| H5616  | se.phar.vi               | Sepharvaim             | **sefarvita**                       |                    |      1 |
| H5623  | sar.gon                  | Sargon                 | **Sargón**                          | Sargón             |      1 |
| H5625  | sar.di                   | Seredite               | **serédita**                        | sereditas          |      1 |
| H5626  | si.rah                   | Sirah                  | **Sira**                            | Sira               |      1 |
| H5639  | se.tur                   | Sethur                 | **Setur**                           | Setur              |      1 |
| H5644  | sit.ri                   | Sithri                 | **Sitri**                           | Sitri              |      1 |
| H5655  | av.de.el                 | Abdeel                 | **Abdeel**                          | Abdeel             |      1 |
| H5661  | av.di.el                 | Abdiel                 | **Abdiel**                          | Abdiel             |      1 |
| H5681  | iv.ri                    | Ibri                   | **Ibri**                            | Ibri               |      1 |
| H5683  | ev.ron                   | Ebron                  | **Ebrón**                           |                    |      1 |
| H5721  | a.di.na                  | Adina                  | **Adina**                           | Adina              |      1 |
| H5722  | a.di.no                  | wielded                | **su lanza**                        |                    |      1 |
| H5723  | a.di.ta.yim              | Adithaim               | **Aditaim**                         | Aditaim            |      1 |
| H5724  | ad.lay                   | Adlai                  | **Adlai**                           | Adlai              |      1 |
| H5735  | a.de.a.dah               | Adadah                 | **Adada**                           | Adada              |      1 |
| H5738  | e.der                    | Eder                   | **Éder**                            |                    |      1 |
| H5745  | o.val                    | Obal                   | **Obal**                            | Obal               |      1 |
| H5778  | o.phay                   | Ephai                  | **Efai**                            | Efai               |      1 |
| H5802  | az.buq                   | Azbuk                  | **Azbuc**                           | Azbuc              |      1 |
| H5811  | a.zaz                    | Azaz                   | **Azaz**                            | Azaz               |      1 |
| H5814  | uz.ziy.ya                | Uzzia                  | **Uzías**                           | Uzías              |      1 |
| H5815  | a.zi.el                  | Aziel                  | **Aziel**                           | Aziel              |      1 |
| H5819  | a.zi.za                  | Aziza                  | **Aziza**                           | Aziza              |      1 |
| H5821  | az.zan                   | Azzan                  | **Azán**                            | Azán               |      1 |
| H5834  | ez.rah                   | Ezrah                  | **Ezra**                            |                    |      1 |
| H5836  | ez.ri                    | Ezri                   | **Ezri**                            | Ezri               |      1 |
| H5839  | a.zar.yah                | Azariah                | **Azarías**                         | Azarías            |      1 |
| H5851  | a.ta.rah                 | Atarah                 | **Atara**                           | Atara              |      1 |
| H5866  | i.lay                    | Ilai                   | **Ilai**                            | Ilai               |      1 |
| H5900  | i.ru                     | Iru                    | **Iru**                             | Iru                |      1 |
| H5901  | i.ri                     | Iri                    | **Iri**                             | Iri                |      1 |
| H5910  | ak.ko                    | Acco                   | **Aco**                             | Aco                |      1 |
| H5917  | a.khar                   | Achan                  | **Acar**                            |                    |      1 |
| H5925  | ul.la                    | Ulla                   | **Ula**                             | Ula                |      1 |
| H5960  | al.mon                   | Almon                  | **Almón**                           | Almón              |      1 |
| H5962  | al.mi                    | Elamite                | **elamita**                         | elamitas           |      1 |
| H5981  | um.mah                   | Ummah                  | **Umá**                             | Uma                |      1 |
| H5990  | am.mi.za.vad             | Ammizabad              | **Amizabad**                        |                    |      1 |
| H6000  | a.mal                    | Amal                   | **Amal**                            | Amal               |      1 |
| H6007  | a.mas.yah                | Amasiah                | **Amasías**                         | Amasías            |      1 |
| H6008  | am.ad                    | Amad                   | **Amad**                            | Amad               |      1 |
| H6023  | a.mash.say               | Amashsai               | **Amasai**                          | Amasai             |      1 |
| H6036  | a.nuv                    | Anub                   | **Anub**                            | Anub               |      1 |
| H6044  | a.nim                    | Anim                   | **Anim**                            | Anim               |      1 |
| H6046  | a.nem                    | Anem                   | **Anem**                            | Anem               |      1 |
| H6048  | a.nam.me.lekh            | Anammelech             | **Anamélec**                        | Anamelec           |      1 |
| H6052  | a.nan                    | Anan                   | **Anán**                            | Anán               |      1 |
| H6054  | a.na.ni                  | Anani                  | **Anani**                           | Anani              |      1 |
| H6070  | an.to.tiy.yah            | Anthothijah            | **Antotías**                        |                    |      1 |
| H6078  | oph.ni                   | Ophni                  | **ofnita**                          |                    |      1 |
| H6130  | a.qan                    | Akan                   | **Acán**                            | Acán               |      1 |
| H6134  | e.qer                    | Eker                   | **Equer**                           | Equer              |      1 |
| H6180  | e.ri                     | Erite                  | **erita**                           | eritas             |      1 |
| H6197  | e.ran                    | Eran                   | **Erán**                            | Erán               |      1 |
| H6198  | e.ra.ni                  | Eranite                | **eranita**                         | eranitas           |      1 |
| H6200  | a.ro.e.ri                | Aroerite               | **aroerita**                        | aroerita           |      1 |
| H6220  | ash.vat                  | Ashvath                | **Asvat**                           | Asvat              |      1 |
| H6221  | a.si.el                  | Asiel                  | **Asiel**                           | Asiel              |      1 |
| H6230  | e.seq                    | Esek                   | **contienda**                       |                    |      1 |
| H6232  | e.sheq                   | Eshek                  | **Esec**                            | Esec               |      1 |
| H6254  | ash.te.ra.ti             | Ashterathite           | **astarotita**                      | astarotita         |      1 |
| H6265  | a.ta.yah                 | Athaiah                | **Atías**                           |                    |      1 |
| H6269  | a.takh                   | Athach                 | **Atac**                            | Atac               |      1 |
| H6270  | at.lay                   | Athlai                 | **Atlai**                           | Atlai              |      1 |
| H6273  | ot.ni                    | Othni                  | **Otni**                            | Otni               |      1 |
| H6300  | pe.dah.el                | Pedahel                | **Pedael**                          | Pedael             |      1 |
| H6317  | pu.ti.el                 | Putiel                 | **Futiel**                          | Futiel             |      1 |
| H6324  | pu.ni                    | Punite                 | **punita**                          |                    |      1 |
| H6326  | pu.ah                    | Puah                   | **Fúa**                             | Fúa                |      1 |
| H6334  | po.ra.ta                 | Poratha                | **Porata**                          | Porata             |      1 |
| H6336  | pu.ti                    | Puthite                | **putita**                          |                    |      1 |
| H6376  | pi.shon                  | Pishon                 | **Pisón**                           | Pisón              |      1 |
| H6384  | pal.lu.i                 | Palluite               | **faluita**                         | faluitas           |      1 |
| H6394  | pil.dash                 | Pildash                | **Pildas**                          | Pildas             |      1 |
| H6401  | pil.ach                  | Pilha                  | **Pilha**                           | Pilha              |      1 |
| H6407  | pal.ti                   | Paltite                | **paltita**                         | paltita            |      1 |
| H6408  | pil.tay                  | Piltai                 | **Piltai**                          | Piltai             |      1 |
| H6420  | pa.lal                   | Palal                  | **Palal**                           | Palal              |      1 |
| H6421  | pe.lal.yah               | Pelaliah               | **Pelaías**                         |                    |      1 |
| H6457  | pa.sakh                  | Pasach                 | **Pasac**                           | Pasac              |      1 |
| H6462  | pis.pah                  | Pispa                  | **Pispa**                           | Pispa              |      1 |
| H6469  | pe.ul.l.tay              | Peullethai             | **Peultai**                         | Peultai            |      1 |
| H6474  | pa.a.ray                 | Paarai                 | **Paarai**                          | Paarai             |      1 |
| H6483  | pits.tsets               | Happizzez              | **Piseces**                         |                    |      1 |
| H6502  | pir.am                   | Piram                  | **Piream**                          | Piream             |      1 |
| H6511  | pa.rah                   | Parah                  | **Fara**                            |                    |      1 |
| H6515  | pa.ru.ach                | Paruah                 | **Parúa**                           | Parúa              |      1 |
| H6516  | par.va.yim               | Parvaim                | **Parvaim**                         | Parvaim            |      1 |
| H6534  | par.mash.ta              | Parmashta              | **Parmasta**                        | Parmasta           |      1 |
| H6535  | par.nakh                 | Parnach                | **Parnac**                          | Parnac             |      1 |
| H6542  | par.si                   | Persian                | **persa**                           | persa              |      1 |
| H6543  | par.si                   | Persian                | **persa**                           | persa              |      1 |
| H6548  | par.oh choph.ra          | (Pharaoh)-hophra       | **Faraón-hofra**                    |                    |      1 |
| H6552  | pir.a.ton                | Pirathon               | **Piratón**                         | Piratón            |      1 |
| H6554  | par.par                  | Pharpar                | **Farfar**                          | Farfar             |      1 |
| H6558  | par.tsi                  | Perezite               | **parsita**                         |                    |      1 |
| H6559  | pe.ra.tsim               | (Mount) Perazim        | **Perazim**                         | Perazim            |      1 |
| H6570  | pe.resh                  | Peresh                 | **Peres**                           | Peres              |      1 |
| H6577  | par.shan.da.ta           | Parshandatha           | **Parsandata**                      | Parsandata         |      1 |
| H6602  | pe.tu.el                 | Pethuel                | **Petuel**                          | Petuel             |      1 |
| H6619  | pi.tom                   | Pithom                 | **Pitón**                           | Pitón              |      1 |
| H6630  | tsa.a.nan                | Zaanan                 | **Zaanán**                          | Zaanán             |      1 |
| H6637  | tso.ve.vah               | Zobebah                | **Hazobeba**                        |                    |      1 |
| H6644  | tsiv.ya                  | Zibia                  | **Sibia**                           | Sibia              |      1 |
| H6661  | tsid.dim                 | Ziddim                 | **Sidim**                           | Sidim              |      1 |
| H6700  | tsu.ri.el                | Zuriel                 | **Zuriel**                          | Zuriel             |      1 |
| H6730  | tsi.or                   | Zior                   | **Sior**                            | Sior               |      1 |
| H6732  | tsits                    | Ziz                    | **Sis**                             | Sis                |      1 |
| H6753  | tse.lel.po.ni            | Hazzelelponi           | **Hazelelponi**                     |                    |      1 |
| H6764  | tsa.laph                 | Zalaph                 | **Zalaf**                           |                    |      1 |
| H6766  | tsel.tsach               | Zelzah                 | **Zelza**                           |                    |      1 |
| H6799  | tse.nan                  | Zenan                  | **Zenán**                           | Zenán              |      1 |
| H6811  | tsa.ir                   | Zair                   | **Zoar**                            |                    |      1 |
| H6827  | tse.phon                 | Zephon                 | **Zefón**                           | Zefón              |      1 |
| H6829  | tsa.phon                 | Zaphon                 | **Zafón**                           | Zafón              |      1 |
| H6831  | tse.pho.ni               | Zephonite              | **zefonita**                        | zefonitas          |      1 |
| H6837  | tsiph.yon                | Ziphion                | **Zifión**                          | Zifión             |      1 |
| H6839  | tso.phim                 | Zophim                 | **Zofim**                           | Zofim              |      1 |
| H6857  | tse.phat                 | Zephath                | **Zefat**                           |                    |      1 |
| H6859  | tse.pha.tah              | Zephathah              | **Sefata**                          | Sefata             |      1 |
| H6863  | tser                     | Zer                    | **Zer**                             | Zer                |      1 |
| H6871  | tse.ru.ah                | Zeruah                 | **Zerúa**                           | Zerúa              |      1 |
| H6874  | tse.ri                   | Zeri                   | **Zeri**                            | Zeri               |      1 |
| H6888  | tse.re.rah               | Zererah                | **Sererá**                          |                    |      1 |
| H6889  | tse.ret                  | Zereth                 | **Seret**                           |                    |      1 |
| H6911  | qiv.tsa.yim              | Kibzaim                | **Kibsaim**                         | Kibsaim            |      1 |
| H6935  | qad.mo.ni                | Kadmonite              | **cadmoneo**                        | cadmoneos          |      1 |
| H6970  | qo.a                     | Koa                    | **Coa**                             | Coa                |      1 |
| H6984  | qu.sha.ya.hu             | Kushaiah               | **Cusaía**                          | Cusaías            |      1 |
| H6997  | qa.tan                   | Hakkatan               | **Catán**                           |                    |      1 |
| H7003  | qit.ron                  | Kitron                 | **Quitrón**                         | Quitrón            |      1 |
| H7005  | qat.tat                  | Kattath                | **Catat**                           | Catat              |      1 |
| H7016  | qi.nah                   | Kinah                  | **Cina**                            | Cina               |      1 |
| H7029  | qi.shi                   | Kishi                  | **Cisi**                            |                    |      1 |
| H7040  | qal.lay                  | Kallai                 | **Calai**                           | Calai              |      1 |
| H7041  | qe.la.yah                | Kelaiah                | **Kelaía**                          | Kelaía             |      1 |
| H7056  | qa.mon                   | Kamon                  | **Camón**                           | Camón              |      1 |
| H7103  | qe.tsi.ah                | Keziah                 | **Cesia**                           | Cesia              |      1 |
| H7104  | qe.tsits                 | (Emek)-keziz           | **Keziz**                           |                    |      1 |
| H7173  | qar.qa                   | Karka                  | **Carca**                           | Carca              |      1 |
| H7174  | qar.qor                  | Karkor                 | **Carcor**                          | Carcor             |      1 |
| H7177  | qar.tah                  | Kartah                 | **Carta**                           | Carta              |      1 |
| H7178  | qar.tan                  | Kartan                 | **Cartán**                          | Cartán             |      1 |
| H7204  | ro.eh                    | Haroeh                 | **Roé**                             |                    |      1 |
| H7208  | re.u.mah                 | Reumah                 | **Reúma**                           | Reuma              |      1 |
| H7220  | rosh                     | Rosh                   | **Ros**                             | Ros                |      1 |
| H7245  | rab.bit                  | Rabbith                | **Rabit**                           | Rabit              |      1 |
| H7276  | re.gem                   | Regem                  | **Regem**                           | Regem              |      1 |
| H7288  | rad.day                  | Raddai                 | **Radai**                           | Radai              |      1 |
| H7303  | ro.ha.gah                | Rohgah                 | **Rohga**                           | Rohga              |      1 |
| H7331  | re.zon                   | Rezon                  | **Rezón**                           | Rezón              |      1 |
| H7357  | ra.cham                  | Raham                  | **Racam**                           |                    |      1 |
| H7403  | ra.khal                  | Racal                  | **Racal**                           | Racal              |      1 |
| H7421  | ram.mi                   | Syrian                 | **ramita**                          |                    |      1 |
| H7422  | ram.yah                  | Ramiah                 | **Ramías**                          |                    |      1 |
| H7432  | re.met                   | Remeth                 | **Remet**                           | Remet              |      1 |
| H7433  | ra.mot gi.l.ad           | Ramoth (Gilead)        | **Ramot de Galaad**                 |                    |      1 |
| H7435  | ra.ma.ti                 | Ramathite              | **ramatita**                        | ramatita           |      1 |
| H7441  | rin.nah                  | Rinnah                 | **Rina**                            | Rina               |      1 |
| H7449  | re.sen                   | Resen                  | **Resén**                           | Resén              |      1 |
| H7472  | re.i                     | Rei                    | **Rei**                             | Rei                |      1 |
| H7480  | re.e.la.yah              | Reelaiah               | **Reelaía**                         | Reelaías           |      1 |
| H7485  | ra.am.yah                | Raamiah                | **Raamías**                         | Raamías            |      1 |
| H7501  | re.pha.el                | Rephael                | **Refael**                          |                    |      1 |
| H7505  | ra.phu                   | Raphu                  | **Rafú**                            | Rafú               |      1 |
| H7506  | re.phach                 | Rephah                 | **Refa**                            | Refa               |      1 |
| H7525  | rits.ya                  | Rizia                  | **Rizía**                           |                    |      1 |
| H7542  | raq.qon                  | Rakkon                 | **Racón**                           | Racón              |      1 |
| H7557  | raq.qat                  | Rakkath                | **Racat**                           | Racat              |      1 |
| H7566  | re.sheph                 | Resheph                | **Resef**                           | Resef              |      1 |
| H7587  | sha.u.li                 | Shaulite               | **saulita**                         | saulitas           |      1 |
| H7594  | she.al                   | Sheal                  | **Seal**                            | Seal               |      1 |
| H7598  | she.al.ti.el             | Shealtiel              | **Salatiel**                        | Salatiel           |      1 |
| H7609  | she.e.rah                | Sheerah                | **Seera**                           | Seera              |      1 |
| H7615  | she.va.i                 | Sabean                 | **sabeo**                           | sabeos             |      1 |
| H7627  | she.vat                  | Shebat                 | **Sebat**                           | Sebat              |      1 |
| H7629  | sho.vi                   | Shobi                  | **Sobi**                            | Sobi               |      1 |
| H7634  | shov.yah                 | Sachia                 | **Sobías**                          |                    |      1 |
| H7656  | shiv.ah                  | Shibah                 | **Seba**                            | Seba               |      1 |
| H7669  | she.ver                  | Sheber                 | **Séber**                           | Seber              |      1 |
| H7671  | she.va.rim               | Shebarim               | **Sebarim**                         | Sebarim            |      1 |
| H7681  | sha.geh                  | Shagee                 | **Sagé**                            | Sage               |      1 |
| H7692  | shig.ga.von              | Shiggaion              | **propiamente**                     |                    |      1 |
| H7714  | shad.rakh                | Shadrach               | **Sadrac**                          | Sadrac             |      1 |
| H7719  | sho.ham                  | Shoham                 | **Soham**                           | Soham              |      1 |
| H7733  | sho.veq                  | Shobek                 | **Sobec**                           | Sobec              |      1 |
| H7746  | shu.chah                 | Shuhah                 | **Súah**                            |                    |      1 |
| H7748  | shu.cham                 | Shuham                 | **Suham**                           | Suham              |      1 |
| H7756  | su.kha.ti                | Sucathites             | **sucatita**                        |                    |      1 |
| H7765  | shu.ni                   | Shunite                | **sunita**                          | sunitas            |      1 |
| H7772  | sho.a                    | Shoa                   | **Soa**                             | Soa                |      1 |
| H7774  | shu.a                    | Shua                   | **Súa**                             | Súa                |      1 |
| H7781  | shu.pha.mi               | Shuphamite             | **supamita**                        |                    |      1 |
| H7796  | s.vo.req                 | (Valley of) Sorek      | **Sorec**                           | Sorec              |      1 |
| H7798  | shav.sah                 | Shavsha                | **Savsa**                           | Savsa              |      1 |
| H7801  | shu.shan.khi             | Susa                   | **susanquita**                      |                    |      1 |
| H7831  | sha.cha.tsi.mah          | Shahazumah             | **Sahazuma**                        |                    |      1 |
| H7841  | she.char.yah             | Shehariah              | **Secarías**                        |                    |      1 |
| H7842  | sha.cha.ra.yim           | Shaharaim              | **Saharaim**                        | Saharaim           |      1 |
| H7856  | sit.nah                  | Sitnah                 | **Sitna**                           | Sitna              |      1 |
| H7861  | shit.ray                 | Shitrai                | **Sitrai**                          | Sitrai             |      1 |
| H7865  | si.on                    | (Mount) Sirion         | **Sion**                            | Sion               |      1 |
| H7866  | shi.on                   | Shion                  | **Sihón**                           | Sihón              |      1 |
| H7877  | shi.za                   | Shiza                  | **Siza**                            | Siza               |      1 |
| H7886  | shi.loh                  | tribute                | **Siloh**                           | Siloh              |      1 |
| H7889  | shi.mon                  | Shimon                 | **Simón**                           | Simón              |      1 |
| H7894  | shi.sah                  | Shisha                 | **Sisa**                            | Sisa               |      1 |
| H7906  | se.khu                   | Secu                   | **Secu**                            | Secú               |      1 |
| H7930  | shikh.mi                 | Shechemite             | **siquemita**                       | siquemitas         |      1 |
| H7942  | shik.k.ron               | Shikkeron              | **Sicrón**                          | Sicrón             |      1 |
| H7968  | shal.lun                 | Shallum                | **Salún**                           |                    |      1 |
| H7978  | shil.chim                | Shilhim                | **Silhim**                          | Silhim             |      1 |
| H7996  | shal.le.khet             | Shallecheth            | **Salequet**                        | Salequet           |      1 |
| H8009  | sal.mah                  | Salmon                 | **Salma**                           |                    |      1 |
| H8012  | sal.mon                  | Salmon                 | **Salmón**                          | Salmón             |      1 |
| H8015  | she.lo.mi                | Shelomi                | **Selomi**                          | Selomi             |      1 |
| H8016  | shil.le.mi               | Shillemite             | **silemita**                        | silemitas          |      1 |
| H8020  | shal.man                 | Shalman                | **Salmán**                          | Salmán             |      1 |
| H8023  | shi.lo.ni                | Shilonite              | **Siloni**                          | Siloni             |      1 |
| H8024  | she.la.ni                | Shelanite              | **selanita**                        |                    |      1 |
| H8028  | she.lesh                 | Shelesh                | **Seles**                           | Seles              |      1 |
| H8030  | shil.shah                | Shilshah               | **Silsa**                           | Silsa              |      1 |
| H8031  | sha.li.shah              | Shalishah              | **Salisa**                          | Salisa             |      1 |
| H8038  | shem.e.ver               | Shemeber               | **Semeber**                         | Semeber            |      1 |
| H8039  | shim.ah                  | Shimeah                | **Simá**                            |                    |      1 |
| H8043  | shim.am                  | Shimeam                | **Simam**                           |                    |      1 |
| H8049  | sham.hut                 | Shamhuth               | **Samhut**                          | Samhut             |      1 |
| H8054  | sham.mot                 | Shammoth               | **Samot**                           | Samot              |      1 |
| H8062  | she.mi.da.i              | Shemidaite             | **semidaíta**                       | semidaítas         |      1 |
| H8090  | she.ma                   | Shema                  | **Sema**                            | Sema               |      1 |
| H8091  | sha.ma                   | Shama                  | **Sama**                            | Sama               |      1 |
| H8094  | she.ma.ah                | Shemaah                | **Semaa**                           | Semaa              |      1 |
| H8101  | shim.a.ti                | Shimeathite            | **simatita**                        |                    |      1 |
| H8116  | shim.rit                 | Shimrith               | **Simrit**                          | Simrit             |      1 |
| H8117  | shim.ro.ni               | Shimronite             | **simronita**                       | simronitas         |      1 |
| H8118  | sho.m.ro.ni              | Samaritan              | **samaritano**                      |                    |      1 |
| H8119  | shim.rat                 | Shimrath               | **Simrat**                          | Simrat             |      1 |
| H8125  | sham.she.ray             | Shamsherai             | **Samserai**                        | Samserai           |      1 |
| H8126  | shu.ma.ti                | Shumathite             | **sumatita**                        | sumatitas          |      1 |
| H8129  | shen                     | Shen                   | **Sen**                             | Sen                |      1 |
| H8134  | shin.av                  | Shinab                 | **Sinab**                           | Sinab              |      1 |
| H8137  | shen.ats.tsar            | Shenazzar              | **Senasar**                         |                    |      1 |
| H8167  | se.i.rah                 | Seirah                 | **Seirat**                          | Seirat             |      1 |
| H8171  | sha.a.lim                | Shaalim                | **Saalim**                          | Saalim             |      1 |
| H8188  | se.o.rim                 | Seorim                 | **Seorim**                          | Seorim             |      1 |
| H8190  | sha.ash.gaz              | Shaashgaz              | **Saasgaz**                         | Saasgaz            |      1 |
| H8204  | shiph.tan                | Shiphtan               | **Siftán**                          | Siftán             |      1 |
| H8208  | sha.phir                 | Shaphir                | **Safir**                           | Safir              |      1 |
| H8223  | sha.pham                 | Shapham                | **Safam**                           |                    |      1 |
| H8224  | siph.mot                 | Siphmoth               | **Sifmot**                          | Sifmot             |      1 |
| H8225  | shiph.mi                 | Shiphmite              | **sifmita**                         | sifmita            |      1 |
| H8230  | shiph.i                  | Shiphi                 | **Sifi**                            | Sifi               |      1 |
| H8236  | shiph.rah                | Shiphrah               | **Sifra**                           | Sifra              |      1 |
| H8287  | sha.ru.chen              | Sharuhen               | **Saruhén**                         | Saruhén            |      1 |
| H8290  | sha.ro.ni                | Sharonite              | **saronita**                        | saronita           |      1 |
| H8298  | sha.ray                  | Sharai                 | **Sarai**                           | Sarai              |      1 |
| H8315  | sa.raph                  | Saraph                 | **Saraf**                           | Saraf              |      1 |
| H8325  | sha.rar                  | Sharar                 | **Sarar**                           | Sarar              |      1 |
| H8329  | she.resh                 | Sheresh                | **Seres**                           | Seres              |      1 |
| H8343  | sha.shay                 | Shashai                | **Sasai**                           | Sasai              |      1 |
| H8364  | shu.tal.chi              | Shuthelahite           | **sutalhita**                       |                    |      1 |
| H8369  | she.tar                  | Shethar                | **Setar**                           | Setar              |      1 |
| H8390  | ta.a.re.a                | Tarea                  | **Taarea**                          |                    |      1 |
| H8430  | to.ach                   | Toah                   | **Toa**                             | Toa                |      1 |
| H8434  | to.lad                   | Tolad                  | **Tolad**                           | Tolad              |      1 |
| H8436  | tu.lon                   | Tilon                  | **Tilón**                           | Tilón              |      1 |
| H8440  | to.la.i                  | Tolaite                | **tolaíta**                         | tolaítas           |      1 |
| H8459  | to.chu                   | Tohu                   | **Tohu**                            | Tohu               |      1 |
| H8461  | tach.ke.mo.ni            | Tahchemonite           | **Tacmoni**                         | tacmonita          |      1 |
| H8468  | te.chin.nah              | Tehinnah               | **Tehina**                          | Tehina             |      1 |
| H8470  | ta.cha.ni                | Tahanite               | **tahanita**                        | tahanitas          |      1 |
| H8475  | tach.re.a                | Tahrea                 | **Tarea**                           | Tarea              |      1 |
| H8477  | ta.chash                 | Tahash                 | **Tahas**                           | Tahas              |      1 |
| H8488  | te.me.ni                 | Temeni                 | **Temeni**                          | Temeni             |      1 |
| H8491  | ti.tsi                   | Tizite                 | **tizita**                          | tizita             |      1 |
| H8493  | tir.ya                   | Tiria                  | **Tiría**                           | Tirías             |      1 |
| H8507  | to.khen                  | Tochen                 | **Tocén**                           |                    |      1 |
| H8520  | te.lach                  | Telah                  | **Télah**                           | Telah              |      1 |
| H8542  | tam.muz                  | Tammuz                 | **Tamuz**                           |                    |      1 |
| H8554  | tim.ni                   | Timnite                | **timnateo**                        | timnateo           |      1 |
| H8603  | to.phel                  | Tophel                 | **Tofel**                           | Tofel              |      1 |
| H8613  | toph.teh                 | burning-place          | **Tofet**                           | Tofet              |      1 |
| H8634  | tar.a.lah                | Taralah                | **Tarala**                          | Tarala             |      1 |
| H8647  | tir.cha.nah              | Tirhanah               | **Tirhana**                         | Tirhana            |      1 |
| H8654  | tir.a.ti                 | Tirathite              | **tiratita**                        |                    |      1 |
| H8662  | tar.taq                  | Tartak                 | **Tartac**                          | Tartac             |      1 |

---

## 4. Sin traducción automática fiable (0) — ninguno

Todos los lemas recibieron una glosa española (a mano, de `definition_es`, o del mapa TBESH→ES).

---

## 5. El grueso mecánico

Las ~7595 glosas restantes (vocabulario concreto, no marcadas) están en `DOCS/drafts/hebrew-lemma-gloss-es-review.csv` — una fila por lema, con `final_gloss`, `final_source`, `definition_es` y `dominant_gloss_share` en columnas contiguas para revisión por muestreo.
