/**
 * 📖 BOOK INTROS
 *
 * Devotional / educational summary of each of the 66 canonical books.
 * Surfaced by the "Acerca de este libro" / "About this book" screen
 * reached from the chapter-grid header. Each entry carries author,
 * approximate date, central theme, historical context, and 2-3 key
 * verses that deep-link into the reader.
 *
 * Content is kept concise (1-3 sentences per field) so the screen
 * stays scannable and doesn't bloat the JS bundle excessively. All
 * dates are traditional / conservative scholarly estimates so the
 * app remains useful to a broad readership.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface BookIntro {
  author: string;
  date: string;
  theme: string;
  context: string;
  keyVerses: string[]; // e.g. ["1:1", "3:16"]
  /**
   * "Cristo en este libro" — one faithful sentence on how the WHOLE book
   * points to, reveals or is fulfilled in Christ (Lucas 24:27). Conservative,
   * widely-held readings only — the book-level lens that complements the
   * verse-level christConnections. Guarded by bookIntros.test (all 66 books).
   */
  christ: string;
}

export interface LocalizedBookIntro {
  es: BookIntro;
  en: BookIntro;
}

/** Keyed by `BIBLE_BOOKS.id` (1 = Genesis, 66 = Revelation). */
export const BOOK_INTROS: Record<number, LocalizedBookIntro> = {
  // ============================================================ PENTATEUCH
  1: {
    es: {
      author: 'Moisés (tradicional)',
      date: 'c. 1446-1406 a.C.',
      theme:
        'Los comienzos: la creación del mundo, la caída del hombre, el diluvio, y el llamado de Abraham que da origen al pueblo de Dios.',
      context:
        'Génesis narra desde la creación hasta el final del periodo patriarcal (Abraham, Isaac, Jacob, José), preparando el escenario para el éxodo. Es el libro fundacional sobre el origen del cosmos y del pueblo escogido.',
      keyVerses: ['1:1', '3:15', '12:3', '50:20'],
      christ:
        'El protoevangelio (3:15) promete la simiente que aplastará a la serpiente; las promesas a Abraham hallan su «sí» en Cristo (Gá 3:16).',
    },
    en: {
      author: 'Moses (traditional)',
      date: 'c. 1446-1406 BC',
      theme:
        'Beginnings: the creation of the world, the fall of man, the flood, and the call of Abraham that births the people of God.',
      context:
        'Genesis spans from creation to the end of the patriarchal era (Abraham, Isaac, Jacob, Joseph), setting the stage for the Exodus. It is the foundational book on the origin of the cosmos and of the chosen people.',
      keyVerses: ['1:1', '3:15', '12:3', '50:20'],
      christ:
        'The protoevangelium (3:15) promises the seed who will crush the serpent; the promises to Abraham find their Yes in Christ (Gal 3:16).',
    },
  },
  2: {
    es: {
      author: 'Moisés (tradicional)',
      date: 'c. 1446-1406 a.C.',
      theme:
        'La redención de Israel de la esclavitud en Egipto y el pacto en el Sinaí que los constituye como nación santa.',
      context:
        'Tras 400 años en Egipto, Dios levanta a Moisés para liberar a su pueblo mediante diez plagas y el cruce del Mar Rojo. En el Sinaí entrega los Diez Mandamientos y las instrucciones para el tabernáculo.',
      keyVerses: ['3:14', '12:13', '20:1-3', '34:6-7'],
      christ:
        'El cordero pascual, el éxodo y el maná anuncian a Cristo, «nuestra Pascua», que nos saca de la esclavitud del pecado (1 Co 5:7).',
    },
    en: {
      author: 'Moses (traditional)',
      date: 'c. 1446-1406 BC',
      theme:
        "Israel's redemption from slavery in Egypt and the Sinai covenant that constitutes them as a holy nation.",
      context:
        'After 400 years in Egypt, God raises Moses to free his people through ten plagues and the crossing of the Red Sea. At Sinai he delivers the Ten Commandments and the tabernacle instructions.',
      keyVerses: ['3:14', '12:13', '20:1-3', '34:6-7'],
      christ:
        'The Passover lamb, the exodus and the manna foreshadow Christ, «our Passover», who frees us from slavery to sin (1 Cor 5:7).',
    },
  },
  3: {
    es: {
      author: 'Moisés',
      date: 'c. 1446-1406 a.C.',
      theme:
        'La santidad de Dios y cómo un pueblo pecador puede acercarse a Él mediante el sacrificio y la pureza ritual.',
      context:
        'Manual sacerdotal para los levitas y todo Israel. Detalla los cinco sacrificios, las festividades anuales, las leyes de pureza y el Día de la Expiación. Cristo cumple todo este sistema en Hebreos.',
      keyVerses: ['11:44', '16:30', '17:11', '19:18'],
      christ:
        'Cada sacrificio y el Día de la Expiación apuntan al sacrificio único de Cristo, nuestro sumo sacerdote (Heb 9-10).',
    },
    en: {
      author: 'Moses',
      date: 'c. 1446-1406 BC',
      theme:
        "God's holiness and how a sinful people can draw near to him through sacrifice and ritual purity.",
      context:
        'A priestly handbook for the Levites and all Israel. It details the five sacrifices, the annual feasts, purity laws and the Day of Atonement. Christ fulfills this whole system in Hebrews.',
      keyVerses: ['11:44', '16:30', '17:11', '19:18'],
      christ:
        'Every sacrifice and the Day of Atonement point to the once-for-all sacrifice of Christ, our high priest (Heb 9-10).',
    },
  },
  4: {
    es: {
      author: 'Moisés',
      date: 'c. 1446-1406 a.C.',
      theme:
        'Las cuarenta años de peregrinación de Israel en el desierto, marcadas por la incredulidad y la fidelidad de Dios.',
      context:
        'Sigue dos censos del pueblo (de ahí su nombre) y la transición de la generación incrédula a la nueva generación que entrará a la tierra prometida.',
      keyVerses: ['6:24-26', '14:18', '21:9', '23:19'],
      christ:
        'La serpiente de bronce levantada en el desierto prefigura a Cristo levantado en la cruz para que todo el que cree viva (Jn 3:14-15).',
    },
    en: {
      author: 'Moses',
      date: 'c. 1446-1406 BC',
      theme:
        "Israel's forty years of wilderness wandering, marked by unbelief and by God's faithfulness.",
      context:
        'It follows two censuses of the people (hence the name) and the transition from the unbelieving generation to the new generation that will enter the promised land.',
      keyVerses: ['6:24-26', '14:18', '21:9', '23:19'],
      christ:
        'The bronze serpent lifted in the wilderness foreshadows Christ lifted on the cross so all who believe may live (John 3:14-15).',
    },
  },
  5: {
    es: {
      author: 'Moisés (con un epílogo posterior)',
      date: 'c. 1406 a.C.',
      theme:
        'La renovación del pacto en las llanuras de Moab antes de entrar a Canaán: amar a Dios con todo el corazón y obedecerlo.',
      context:
        'Consta de tres discursos de Moisés a la nueva generación. Contiene el Shemá (6:4-5), citado por Jesús como el primer mandamiento. Cierra con la muerte de Moisés.',
      keyVerses: ['6:4-5', '8:3', '18:15', '30:19'],
      christ:
        'Moisés anuncia un Profeta como él a quien hay que oír: Jesús, el Profeta mayor que Moisés (Hch 3:22).',
    },
    en: {
      author: 'Moses (with a later epilogue)',
      date: 'c. 1406 BC',
      theme:
        'Renewal of the covenant on the plains of Moab before entering Canaan: love God with all your heart and obey him.',
      context:
        "Three sermons from Moses to the new generation. It contains the Shema (6:4-5), cited by Jesus as the greatest commandment. It closes with Moses' death.",
      keyVerses: ['6:4-5', '8:3', '18:15', '30:19'],
      christ:
        'Moses foretells a Prophet like himself to whom we must listen: Jesus, the Prophet greater than Moses (Acts 3:22).',
    },
  },

  // ============================================================ HISTORICAL
  6: {
    es: {
      author: 'Josué (tradicional), con material posterior',
      date: 'c. 1405-1380 a.C.',
      theme:
        'La conquista y reparto de la tierra prometida bajo el liderazgo de Josué, sucesor de Moisés.',
      context:
        'Tres secciones: conquista (caps. 1-12), reparto entre las tribus (13-22), y el discurso final de Josué llamando al pueblo a servir solo a Yahvé.',
      keyVerses: ['1:8-9', '6:20', '24:15'],
      christ:
        'Josué (mismo nombre que «Jesús») introduce al pueblo en el reposo de la tierra, sombra del reposo eterno que da Cristo (Heb 4:8-9).',
    },
    en: {
      author: 'Joshua (traditional), with later material',
      date: 'c. 1405-1380 BC',
      theme:
        "Conquest and division of the promised land under Joshua's leadership as Moses' successor.",
      context:
        "Three sections: conquest (chs. 1-12), division among the tribes (13-22), and Joshua's farewell speech calling the people to serve Yahweh alone.",
      keyVerses: ['1:8-9', '6:20', '24:15'],
      christ:
        'Joshua (the same name as «Jesus») leads the people into the rest of the land, a shadow of the eternal rest Christ gives (Heb 4:8-9).',
    },
  },
  7: {
    es: {
      author: 'Anónimo (Samuel, tradicional)',
      date: 'c. 1043 a.C. (eventos: c. 1380-1050 a.C.)',
      theme:
        'El ciclo recurrente de apostasía, opresión, clamor y liberación a través de los jueces que Dios levanta.',
      context:
        'Cubre el periodo entre Josué y la monarquía. Doce jueces (Otoniel, Aod, Débora, Gedeón, Sansón, etc.) son levantados por Dios pero el pueblo cae una y otra vez en idolatría.',
      keyVerses: ['2:16', '6:12', '21:25'],
      christ:
        'El ciclo de pecado y liberación clama por un Salvador perfecto y un Rey justo: Cristo, el Libertador definitivo.',
    },
    en: {
      author: 'Anonymous (Samuel, traditional)',
      date: 'c. 1043 BC (events: c. 1380-1050 BC)',
      theme:
        'The recurring cycle of apostasy, oppression, crying out, and deliverance through the judges God raises up.',
      context:
        'Covers the period between Joshua and the monarchy. Twelve judges (Othniel, Ehud, Deborah, Gideon, Samson, etc.) are raised up, yet the people fall into idolatry again and again.',
      keyVerses: ['2:16', '6:12', '21:25'],
      christ:
        'The cycle of sin and rescue cries out for a perfect Savior and a righteous King: Christ, the final Deliverer.',
    },
  },
  8: {
    es: {
      author: 'Anónimo (Samuel, tradicional)',
      date: 'c. 1030-1010 a.C.',
      theme:
        'La fidelidad redentora de Dios narrada a través de una moabita que se incorpora al linaje de David y de Cristo.',
      context:
        'En la época de los jueces, Rut deja Moab para seguir a su suegra Noemí y al Dios de Israel. Booz, el pariente redentor, la toma por esposa y son bisabuelos del rey David.',
      keyVerses: ['1:16', '4:14'],
      christ:
        'El pariente redentor que rescata a Rut prefigura a Cristo, nuestro Redentor que nos hace suyos; y de su linaje vienen David y Jesús.',
    },
    en: {
      author: 'Anonymous (Samuel, traditional)',
      date: 'c. 1030-1010 BC',
      theme:
        "God's redeeming faithfulness told through a Moabitess woven into David's and Christ's lineage.",
      context:
        "In the era of the judges, Ruth leaves Moab to follow her mother-in-law Naomi and Israel's God. Boaz, the kinsman-redeemer, marries her — they become King David's great-grandparents.",
      keyVerses: ['1:16', '4:14'],
      christ:
        'The kinsman-redeemer who rescues Ruth foreshadows Christ, our Redeemer who makes us his own; and from her line come David and Jesus.',
    },
  },
  9: {
    es: {
      author: 'Samuel, Natán y Gad (tradicional)',
      date: 'c. 1050-960 a.C.',
      theme:
        'La transición de los jueces a la monarquía: Samuel, Saúl y el ascenso del joven David.',
      context:
        'Cubre los reinados del último juez (Samuel), el primer rey rechazado (Saúl), y el rey según el corazón de Dios (David), unido a Jonatán por un pacto de amistad.',
      keyVerses: ['15:22', '16:7', '17:45'],
      christ:
        'El ungimiento de David como rey según el corazón de Dios anticipa al Ungido, el Hijo de David: Cristo (Mt 1:1).',
    },
    en: {
      author: 'Samuel, Nathan and Gad (traditional)',
      date: 'c. 1050-960 BC',
      theme:
        "Transition from judges to monarchy: Samuel, Saul and the young David's rise.",
      context:
        "Covers the last judge (Samuel), the first rejected king (Saul), and the king after God's own heart (David), bound to Jonathan by a covenant of friendship.",
      keyVerses: ['15:22', '16:7', '17:45'],
      christ:
        "David's anointing as the king after God's heart anticipates the Anointed One, the Son of David: Christ (Matt 1:1).",
    },
  },
  10: {
    es: {
      author: 'Compilador anónimo',
      date: 'c. 960-930 a.C.',
      theme:
        'El reinado completo de David: sus victorias, su pecado con Betsabé, y el pacto eterno de un descendiente que reinará para siempre.',
      context:
        'Continuación natural de 1 Samuel. Dios promete a David una dinastía perpetua (cap. 7), promesa cumplida en Cristo, hijo de David.',
      keyVerses: ['7:12-13', '7:16', '22:31'],
      christ:
        'El pacto davídico promete un trono eterno (7:12-16), cumplido en Cristo, el Hijo de David que reina para siempre (Lc 1:32-33).',
    },
    en: {
      author: 'Anonymous compiler',
      date: 'c. 960-930 BC',
      theme:
        "David's full reign: his victories, his sin with Bathsheba, and the eternal covenant of a descendant who will reign forever.",
      context:
        'Natural continuation of 1 Samuel. God promises David a perpetual dynasty (ch. 7), a promise fulfilled in Christ, son of David.',
      keyVerses: ['7:12-13', '7:16', '22:31'],
      christ:
        'The Davidic covenant promises an everlasting throne (7:12-16), fulfilled in Christ, the Son of David who reigns forever (Luke 1:32-33).',
    },
  },
  11: {
    es: {
      author: 'Compilador anónimo (tradicional: Jeremías)',
      date: 'c. 561-538 a.C.',
      theme:
        'La gloria del reino de Salomón seguida por la división en dos reinos y el descenso hacia el exilio.',
      context:
        'Empieza con la sucesión de Salomón y la construcción del templo, y termina con la caída de Israel (722 a.C.) y el cautiverio de Judá en Babilonia (586 a.C.).',
      keyVerses: ['3:9', '8:27', '18:21'],
      christ:
        'El templo de Salomón y su sabiduría señalan a Cristo, «mayor que Salomón» y el verdadero templo donde mora Dios (Mt 12:42; Jn 2:19-21).',
    },
    en: {
      author: 'Anonymous compiler (traditional: Jeremiah)',
      date: 'c. 561-538 BC',
      theme:
        "Solomon's glorious reign followed by the kingdom's division in two and the descent into exile.",
      context:
        "Opens with Solomon's accession and the temple's construction; closes with Israel's fall (722 BC) and Judah's Babylonian captivity (586 BC).",
      keyVerses: ['3:9', '8:27', '18:21'],
      christ:
        "Solomon's temple and wisdom point to Christ, «greater than Solomon» and the true temple where God dwells (Matt 12:42; John 2:19-21).",
    },
  },
  12: {
    es: {
      author: 'Compilador anónimo (tradicional: Jeremías)',
      date: 'c. 561-538 a.C.',
      theme:
        'El descenso paralelo de los dos reinos: Israel cae primero a Asiria, Judá luego a Babilonia.',
      context:
        'Documenta los ministerios de Elías y Eliseo, y los reinados que llevaron al exilio. Concluye con Joaquín liberado de la prisión en Babilonia, una señal de esperanza.',
      keyVerses: ['17:13', '23:25', '25:21'],
      christ:
        'El fracaso de los reyes y el exilio muestran la necesidad de un Rey fiel: Cristo, que nunca quebranta el pacto.',
    },
    en: {
      author: 'Anonymous compiler (traditional: Jeremiah)',
      date: 'c. 561-538 BC',
      theme:
        'Parallel decline of the two kingdoms: Israel falls first to Assyria, then Judah to Babylon.',
      context:
        'Records the ministries of Elijah and Elisha and the reigns that led to exile. Closes with Jehoiachin freed from a Babylonian prison — a sign of hope.',
      keyVerses: ['17:13', '23:25', '25:21'],
      christ:
        'The failure of the kings and the exile show the need for a faithful King: Christ, who never breaks the covenant.',
    },
  },
  13: {
    es: {
      author: 'Esdras (tradicional)',
      date: 'c. 450-430 a.C.',
      theme:
        'La historia de Israel reenfocada desde una perspectiva sacerdotal y post-exílica, destacando el linaje real de David.',
      context:
        'Empieza con Adán y termina con la muerte de David. Resalta las genealogías, el culto en el templo y la promesa mesiánica para animar a los repatriados.',
      keyVerses: ['16:34', '17:11-14', '29:11'],
      christ:
        'La historia se relee en torno al trono de David y la adoración, apuntando al Hijo de David, Cristo, cuyo reino no tendrá fin.',
    },
    en: {
      author: 'Ezra (traditional)',
      date: 'c. 450-430 BC',
      theme:
        "Israel's history retold from a priestly, post-exilic angle, highlighting David's royal line.",
      context:
        "Spans from Adam to David's death. It foregrounds genealogies, temple worship and the messianic promise to encourage the returned exiles.",
      keyVerses: ['16:34', '17:11-14', '29:11'],
      christ:
        "History is retold around David's throne and worship, pointing to the Son of David, Christ, whose kingdom will have no end.",
    },
  },
  14: {
    es: {
      author: 'Esdras (tradicional)',
      date: 'c. 450-430 a.C.',
      theme:
        'El reino de Judá visto a través del lente del templo, mostrando que la prosperidad depende de la fidelidad al pacto.',
      context:
        'Continúa 1 Crónicas desde Salomón hasta el edicto de Ciro que permite el regreso del exilio. Cierra con esperanza: la diáspora puede volver.',
      keyVerses: ['7:14', '20:15', '36:23'],
      christ:
        'El templo y los avivamientos anticipan a Cristo, que limpia el templo y se ofrece como el lugar del encuentro con Dios.',
    },
    en: {
      author: 'Ezra (traditional)',
      date: 'c. 450-430 BC',
      theme:
        'The kingdom of Judah seen through the temple lens, showing that prosperity hinges on covenant faithfulness.',
      context:
        'Continues 1 Chronicles from Solomon to the edict of Cyrus that allows the return from exile. It closes with hope: the diaspora can come home.',
      keyVerses: ['7:14', '20:15', '36:23'],
      christ:
        'The temple and the revivals anticipate Christ, who cleanses the temple and offers himself as the place of meeting with God.',
    },
  },
  15: {
    es: {
      author: 'Esdras',
      date: 'c. 457-444 a.C.',
      theme:
        'El regreso del exilio, la reconstrucción del templo y la reforma espiritual liderada por el escriba Esdras.',
      context:
        'Dos olas de retorno: la primera bajo Zorobabel reconstruye el templo (caps. 1-6); la segunda bajo Esdras restaura la enseñanza de la Ley (7-10).',
      keyVerses: ['1:3', '7:10', '9:6'],
      christ:
        'La restauración del templo tras el exilio prefigura la obra de Cristo que reedifica y reúne a su pueblo.',
    },
    en: {
      author: 'Ezra',
      date: 'c. 457-444 BC',
      theme:
        'The return from exile, the rebuilding of the temple, and the spiritual reform led by Ezra the scribe.',
      context:
        'Two waves of return: the first under Zerubbabel rebuilds the temple (chs. 1-6); the second under Ezra restores teaching of the Law (7-10).',
      keyVerses: ['1:3', '7:10', '9:6'],
      christ:
        "The restoration of the temple after exile foreshadows Christ's work of rebuilding and gathering his people.",
    },
  },
  16: {
    es: {
      author: 'Nehemías (con compilación de Esdras)',
      date: 'c. 445-420 a.C.',
      theme:
        'La reconstrucción del muro de Jerusalén y la renovación del pacto bajo el liderazgo de un copero convertido en gobernador.',
      context:
        'Nehemías abandona la corte persa para reconstruir el muro en 52 días pese a la oposición. Esdras lee la Ley y el pueblo se compromete de nuevo a obedecer.',
      keyVerses: ['1:11', '4:14', '8:10'],
      christ:
        'Nehemías reconstruye los muros; Cristo edifica y guarda a su pueblo, haciéndolos ciudad de Dios.',
    },
    en: {
      author: 'Nehemiah (with Ezra compilation)',
      date: 'c. 445-420 BC',
      theme:
        "Rebuilding Jerusalem's wall and renewing the covenant under the leadership of a cupbearer turned governor.",
      context:
        'Nehemiah leaves the Persian court to rebuild the wall in 52 days despite opposition. Ezra reads the Law and the people recommit to obedience.',
      keyVerses: ['1:11', '4:14', '8:10'],
      christ:
        'Nehemiah rebuilds the walls; Christ builds and guards his people, making them the city of God.',
    },
  },
  17: {
    es: {
      author: 'Anónimo (tradicional: Mardoqueo)',
      date: 'c. 470-460 a.C.',
      theme:
        'La providencia silenciosa de Dios que preserva a su pueblo de la aniquilación a través de una reina judía en Persia.',
      context:
        'No se nombra a Dios explícitamente en todo el libro, pero su mano se ve en cada giro. Funda la fiesta de Purim que los judíos siguen celebrando.',
      keyVerses: ['4:14', '4:16', '7:3-4'],
      christ:
        'Dios obra de forma oculta para salvar a su pueblo de la destrucción, como en la cruz obra para salvar a los suyos por medio de Cristo.',
    },
    en: {
      author: 'Anonymous (traditional: Mordecai)',
      date: 'c. 470-460 BC',
      theme:
        "God's silent providence preserving his people from annihilation through a Jewish queen in Persia.",
      context:
        'God is never named explicitly in the book, yet his hand is seen at every turn. It founds the feast of Purim, which Jews still celebrate.',
      keyVerses: ['4:14', '4:16', '7:3-4'],
      christ:
        'God works unseen to save his people from destruction, as at the cross he works to save his own through Christ.',
    },
  },

  // ============================================================ POETRY / WISDOM
  18: {
    es: {
      author: 'Anónimo (tal vez Moisés o un sabio del periodo patriarcal)',
      date: 'Eventos: c. 2000 a.C.; composición: incierta',
      theme:
        'El problema del sufrimiento del justo: ¿por qué le pasan cosas terribles a un hombre íntegro? Dios responde mostrando su soberanía y misterio.',
      context:
        'Job pierde todo en un día. Tres amigos intentan explicar su sufrimiento con teología insuficiente. Al final, Dios mismo responde desde la tempestad sin "justificarse".',
      keyVerses: ['1:21', '19:25', '42:5-6'],
      christ:
        'El clamor de Job por un mediador y su confesión «yo sé que mi Redentor vive» (19:25) hallan respuesta en Cristo.',
    },
    en: {
      author: 'Anonymous (perhaps Moses or a patriarch-era sage)',
      date: 'Events: c. 2000 BC; composition: uncertain',
      theme:
        'The problem of the righteous sufferer: why do terrible things happen to a man of integrity? God answers by showing his sovereignty and his mystery.',
      context:
        'Job loses everything in a day. Three friends try to explain his suffering with inadequate theology. In the end, God himself answers from the whirlwind without "justifying" himself.',
      keyVerses: ['1:21', '19:25', '42:5-6'],
      christ:
        "Job's cry for a mediator and his confession «I know that my Redeemer lives» (19:25) find their answer in Christ.",
    },
  },
  19: {
    es: {
      author: 'David y otros (Asaf, Coré, Salomón, Moisés)',
      date: 'c. 1410-450 a.C.',
      theme:
        'Cantos de adoración, lamento, alabanza, sabiduría y profecía mesiánica para cada estación del alma.',
      context:
        '150 salmos agrupados en cinco libros que reflejan el Pentateuco. Cubren toda emoción humana llevada ante Dios, desde la desesperación hasta el éxtasis.',
      keyVerses: ['23:1', '46:10', '51:10', '119:105'],
      christ:
        'Los salmos cantan al Rey ungido, al pastor y al que sufre: muchos son citados de Jesús (Sal 22, 110, 118), que es su cumplimiento.',
    },
    en: {
      author: 'David and others (Asaph, Korah, Solomon, Moses)',
      date: 'c. 1410-450 BC',
      theme:
        'Songs of worship, lament, praise, wisdom and messianic prophecy for every season of the soul.',
      context:
        '150 psalms grouped into five books that mirror the Pentateuch. They cover every human emotion brought before God, from despair to ecstasy.',
      keyVerses: ['23:1', '46:10', '51:10', '119:105'],
      christ:
        'The Psalms sing of the anointed King, the Shepherd and the Sufferer: many are quoted of Jesus (Ps 22, 110, 118), who is their fulfillment.',
    },
  },
  20: {
    es: {
      author: 'Salomón (principalmente), Agur, Lemuel',
      date: 'c. 970-700 a.C.',
      theme:
        'La sabiduría práctica para vivir bien: el temor de Jehová es el principio del conocimiento, y la sabiduría es el árbol de vida.',
      context:
        'Colección de proverbios cortos sobre trabajo, palabras, dinero, amistad, familia y carácter. Personifica la Sabiduría como mujer que llama desde las plazas.',
      keyVerses: ['1:7', '3:5-6', '16:9', '22:6'],
      christ:
        'La Sabiduría que clama y da vida halla su plenitud en Cristo, «hecho por Dios sabiduría» para nosotros (1 Co 1:30).',
    },
    en: {
      author: 'Solomon (mainly), Agur, Lemuel',
      date: 'c. 970-700 BC',
      theme:
        'Practical wisdom for living well: the fear of the Lord is the beginning of knowledge, and wisdom is a tree of life.',
      context:
        'A collection of short proverbs on work, speech, money, friendship, family and character. It personifies Wisdom as a woman calling from the streets.',
      keyVerses: ['1:7', '3:5-6', '16:9', '22:6'],
      christ:
        'The Wisdom that calls and gives life finds its fullness in Christ, «made unto us wisdom from God» (1 Cor 1:30).',
    },
  },
  21: {
    es: {
      author: 'Salomón (tradicional)',
      date: 'c. 940 a.C.',
      theme:
        'La vanidad de la vida "debajo del sol" sin Dios: todo es niebla. La conclusión: teme a Dios y guarda sus mandamientos.',
      context:
        'Filosófico y existencial. Un rey sabio explora el placer, la riqueza, el trabajo y la sabiduría como respuestas al sentido de la vida, y los encuentra a todos insuficientes.',
      keyVerses: ['1:2', '3:1', '12:13'],
      christ:
        'El vacío de todo «bajo el sol» señala la necesidad de Aquel que da sentido eterno: la vida hallada en Cristo.',
    },
    en: {
      author: 'Solomon (traditional)',
      date: 'c. 940 BC',
      theme:
        'The vanity of life "under the sun" without God: everything is mist. The conclusion: fear God and keep his commandments.',
      context:
        'Philosophical and existential. A wise king explores pleasure, wealth, work and wisdom as answers to the meaning of life — and finds them all insufficient.',
      keyVerses: ['1:2', '3:1', '12:13'],
      christ:
        'The emptiness of all «under the sun» points to the need for the One who gives eternal meaning: the life found in Christ.',
    },
  },
  22: {
    es: {
      author: 'Salomón (tradicional)',
      date: 'c. 970-960 a.C.',
      theme:
        'El amor matrimonial celebrado como bueno y santo; tradicionalmente leído también como alegoría del amor entre Cristo y la Iglesia.',
      context:
        'Diálogo poético entre el amado y la amada (con un coro). El libro vindica la dignidad y belleza del amor humano dentro del pacto.',
      keyVerses: ['2:4', '6:3', '8:6-7'],
      christ:
        'El amor entre los esposos es figura del amor de Cristo por su iglesia, su amada esposa (Ef 5:25-32).',
    },
    en: {
      author: 'Solomon (traditional)',
      date: 'c. 970-960 BC',
      theme:
        "Marital love celebrated as good and holy; traditionally also read as an allegory of Christ's love for the Church.",
      context:
        'A poetic dialogue between the lover and the beloved (with a chorus). The book vindicates the dignity and beauty of human love within the covenant.',
      keyVerses: ['2:4', '6:3', '8:6-7'],
      christ:
        'The love between the spouses pictures the love of Christ for his church, his beloved bride (Eph 5:25-32).',
    },
  },

  // ============================================================ MAJOR PROPHETS
  23: {
    es: {
      author: 'Isaías',
      date: 'c. 740-680 a.C.',
      theme:
        'El juicio y la salvación de Yahvé: las advertencias contra el pecado de Judá seguidas de las promesas más claras del AT sobre el Mesías sufriente.',
      context:
        'Profetizó durante los reinados de Uzías, Jotam, Acaz y Ezequías. Su libro tiene dos grandes secciones: juicio (1-39) y consuelo (40-66, incluyendo los Cantos del Siervo).',
      keyVerses: ['6:8', '7:14', '53:5-6', '55:6-7'],
      christ:
        'El siervo sufriente (cap. 53) y el niño que nace «Dios fuerte» (9:6) describen a Cristo con asombrosa claridad siglos antes.',
    },
    en: {
      author: 'Isaiah',
      date: 'c. 740-680 BC',
      theme:
        "Yahweh's judgment and salvation: warnings against Judah's sin followed by the clearest OT promises of the suffering Messiah.",
      context:
        'Prophesied during the reigns of Uzziah, Jotham, Ahaz and Hezekiah. His book has two great sections: judgment (1-39) and comfort (40-66, including the Servant Songs).',
      keyVerses: ['6:8', '7:14', '53:5-6', '55:6-7'],
      christ:
        'The suffering servant (ch. 53) and the child born «Mighty God» (9:6) describe Christ with stunning clarity centuries beforehand.',
    },
  },
  24: {
    es: {
      author: 'Jeremías',
      date: 'c. 626-585 a.C.',
      theme:
        'El "profeta llorón" anuncia la inminente caída de Jerusalén y la promesa de un nuevo pacto escrito en el corazón.',
      context:
        'Sirvió 40 años durante el colapso de Judá. Fue rechazado, encarcelado y exiliado a Egipto. Su mensaje fue duro pero su esperanza profunda.',
      keyVerses: ['1:5', '29:11', '31:33', '33:3'],
      christ:
        'Jeremías anuncia el nuevo pacto (31:31-34) que Cristo sella con su sangre (Lc 22:20).',
    },
    en: {
      author: 'Jeremiah',
      date: 'c. 626-585 BC',
      theme:
        "The 'weeping prophet' announces Jerusalem's imminent fall and the promise of a new covenant written on the heart.",
      context:
        "He served 40 years through Judah's collapse. He was rejected, imprisoned and exiled to Egypt. His message was hard, but his hope ran deep.",
      keyVerses: ['1:5', '29:11', '31:33', '33:3'],
      christ:
        'Jeremiah announces the new covenant (31:31-34) that Christ seals with his blood (Luke 22:20).',
    },
  },
  25: {
    es: {
      author: 'Jeremías (tradicional)',
      date: 'c. 586 a.C.',
      theme:
        'Cinco lamentos por Jerusalén destruida: dolor profundo entretejido con la confianza en las misericordias diarias de Dios.',
      context:
        'Acrósticos hebreos que reflejan la devastación tras la conquista babilónica. El capítulo 3 es el corazón del libro.',
      keyVerses: ['3:22-23', '5:21'],
      christ:
        'En medio del juicio brillan las misericordias «nuevas cada mañana» (3:22-23), fieles en Cristo, el mismo ayer, hoy y siempre.',
    },
    en: {
      author: 'Jeremiah (traditional)',
      date: 'c. 586 BC',
      theme:
        "Five laments over a ruined Jerusalem: deep grief woven with trust in God's daily mercies.",
      context:
        'Hebrew acrostics reflecting the devastation after the Babylonian conquest. Chapter 3 is the heart of the book.',
      keyVerses: ['3:22-23', '5:21'],
      christ:
        'Amid judgment shine the mercies «new every morning» (3:22-23), faithful in Christ, the same yesterday, today and forever.',
    },
  },
  26: {
    es: {
      author: 'Ezequiel',
      date: 'c. 593-571 a.C.',
      theme:
        'La gloria de Dios que se aparta del templo profanado y vuelve a un templo restaurado y un pueblo renovado.',
      context:
        'Sacerdote-profeta entre los exiliados en Babilonia. Sus visiones (ruedas, valle de huesos secos, templo restaurado) son icónicas. Habla de un corazón nuevo (36:26).',
      keyVerses: ['11:19', '18:23', '36:26', '37:14'],
      christ:
        'La promesa de un corazón nuevo y un pastor como David (34, 36) se cumple en Cristo, el buen Pastor que da su Espíritu.',
    },
    en: {
      author: 'Ezekiel',
      date: 'c. 593-571 BC',
      theme:
        "God's glory leaving the defiled temple and returning to a restored temple and renewed people.",
      context:
        'Priest-prophet among the Babylonian exiles. His visions (wheels, valley of dry bones, restored temple) are iconic. He speaks of a new heart (36:26).',
      keyVerses: ['11:19', '18:23', '36:26', '37:14'],
      christ:
        'The promise of a new heart and a shepherd like David (34, 36) is fulfilled in Christ, the good Shepherd who gives his Spirit.',
    },
  },
  27: {
    es: {
      author: 'Daniel',
      date: 'c. 605-530 a.C.',
      theme:
        'La soberanía de Dios sobre las naciones: los imperios suben y caen, pero su reino dura para siempre.',
      context:
        'Daniel sirve en las cortes de Babilonia y Persia. Mitad narrativa (caps. 1-6: horno de fuego, foso de leones), mitad apocalíptica (7-12: visiones del futuro).',
      keyVerses: ['2:21', '3:17-18', '7:13-14'],
      christ:
        'El «Hijo del Hombre» que recibe un reino eterno (7:13-14) es el título que Jesús toma para sí.',
    },
    en: {
      author: 'Daniel',
      date: 'c. 605-530 BC',
      theme:
        "God's sovereignty over the nations: empires rise and fall, but his kingdom endures forever.",
      context:
        "Daniel serves in the courts of Babylon and Persia. Half narrative (chs. 1-6: fiery furnace, lions' den), half apocalyptic (7-12: visions of the future).",
      keyVerses: ['2:21', '3:17-18', '7:13-14'],
      christ:
        'The «Son of Man» who receives an everlasting kingdom (7:13-14) is the title Jesus takes for himself.',
    },
  },

  // ============================================================ MINOR PROPHETS
  28: {
    es: {
      author: 'Oseas',
      date: 'c. 755-715 a.C.',
      theme:
        'El amor inquebrantable de Dios por Israel infiel, dramatizado en el matrimonio de Oseas con Gomer, una mujer infiel.',
      context:
        'Profetizó al reino del norte antes de su caída ante Asiria. Su vida personal se convierte en parábola viviente del amor pactual de Dios.',
      keyVerses: ['6:6', '11:8', '14:4'],
      christ:
        'El amor fiel que rescata a la esposa infiel retrata a Cristo, que ama y compra a su pueblo descarriado.',
    },
    en: {
      author: 'Hosea',
      date: 'c. 755-715 BC',
      theme:
        "God's unbreakable love for unfaithful Israel, dramatized in Hosea's marriage to Gomer, an unfaithful woman.",
      context:
        "He prophesied to the northern kingdom before its fall to Assyria. His personal life becomes a living parable of God's covenantal love.",
      keyVerses: ['6:6', '11:8', '14:4'],
      christ:
        'The faithful love that rescues the unfaithful wife portrays Christ, who loves and buys back his wayward people.',
    },
  },
  29: {
    es: {
      author: 'Joel',
      date: 'incierta (c. 835-400 a.C.)',
      theme:
        'El día de Jehová: una plaga de langostas anuncia un juicio mayor, pero también la promesa del derramamiento del Espíritu.',
      context:
        'Joel ve una invasión de langostas como advertencia del juicio venidero. Su profecía del Espíritu derramado se cumple en Pentecostés (Hechos 2).',
      keyVerses: ['2:13', '2:28-29', '3:14'],
      christ:
        'La promesa del Espíritu derramado «sobre toda carne» (2:28) se cumple en Pentecostés por la obra de Cristo (Hch 2:16-21).',
    },
    en: {
      author: 'Joel',
      date: 'uncertain (c. 835-400 BC)',
      theme:
        'The day of the Lord: a locust plague heralds greater judgment, but also the promise of the Spirit poured out.',
      context:
        'Joel sees a locust invasion as a warning of coming judgment. His prophecy of the outpoured Spirit is fulfilled at Pentecost (Acts 2).',
      keyVerses: ['2:13', '2:28-29', '3:14'],
      christ:
        "The promise of the Spirit poured out «on all flesh» (2:28) is fulfilled at Pentecost through Christ's work (Acts 2:16-21).",
    },
  },
  30: {
    es: {
      author: 'Amós',
      date: 'c. 760-750 a.C.',
      theme:
        'La justicia social como demanda no negociable de Dios: la religiosidad sin compasión por los pobres es abominación.',
      context:
        'Pastor de Tecoa enviado al próspero reino del norte. Atacó la complacencia de los ricos y la corrupción de la adoración.',
      keyVerses: ['5:24', '8:11'],
      christ:
        'El clamor por justicia y la promesa de levantar «el tabernáculo caído de David» (9:11) apuntan al reino de Cristo (Hch 15:16).',
    },
    en: {
      author: 'Amos',
      date: 'c. 760-750 BC',
      theme:
        "Social justice as God's non-negotiable demand: religiosity without compassion for the poor is an abomination.",
      context:
        'A shepherd from Tekoa sent to the prosperous northern kingdom. He attacked the complacency of the rich and the corruption of worship.',
      keyVerses: ['5:24', '8:11'],
      christ:
        "The cry for justice and the promise to raise «David's fallen tent» (9:11) point to Christ's kingdom (Acts 15:16).",
    },
  },
  31: {
    es: {
      author: 'Abdías',
      date: 'c. 586 a.C.',
      theme:
        'El juicio contra Edom (descendiente de Esaú) por celebrar la caída de Jerusalén y la promesa de restauración para Judá.',
      context:
        'Libro más corto del AT (21 versículos). Edom traicionó a su hermano Judá durante la invasión babilónica.',
      keyVerses: ['1:15', '1:17'],
      christ:
        'El juicio sobre el orgullo y la promesa de que «el reino será de Jehová» anuncian el reino de Cristo que prevalece.',
    },
    en: {
      author: 'Obadiah',
      date: 'c. 586 BC',
      theme:
        "Judgment on Edom (Esau's descendants) for celebrating Jerusalem's fall, and a promise of restoration for Judah.",
      context:
        'The shortest OT book (21 verses). Edom betrayed its brother Judah during the Babylonian invasion.',
      keyVerses: ['1:15', '1:17'],
      christ:
        "The judgment on pride and the promise that «the kingdom shall be the LORD's» announce Christ's prevailing kingdom.",
    },
  },
  32: {
    es: {
      author: 'Jonás',
      date: 'c. 760 a.C.',
      theme:
        'El alcance universal del amor de Dios: incluso Nínive, capital de la cruel Asiria, puede arrepentirse y ser perdonada.',
      context:
        'El profeta huye de su llamado y es tragado por un gran pez. Eventualmente predica a Nínive, que se arrepiente. Jonás se enoja porque Dios es misericordioso.',
      keyVerses: ['2:9', '4:2', '4:11'],
      christ:
        'Tres días en el vientre del pez son la «señal de Jonás» que Jesús aplica a su muerte y resurrección (Mt 12:40).',
    },
    en: {
      author: 'Jonah',
      date: 'c. 760 BC',
      theme:
        "The universal reach of God's love: even Nineveh, capital of cruel Assyria, can repent and be forgiven.",
      context:
        'The prophet flees his calling and is swallowed by a great fish. He eventually preaches to Nineveh, which repents. Jonah resents that God is merciful.',
      keyVerses: ['2:9', '4:2', '4:11'],
      christ:
        'Three days in the fish are the «sign of Jonah» that Jesus applies to his death and resurrection (Matt 12:40).',
    },
  },
  33: {
    es: {
      author: 'Miqueas',
      date: 'c. 735-700 a.C.',
      theme:
        'El juicio contra la injusticia social y la promesa del Mesías que nacerá en Belén.',
      context:
        'Contemporáneo de Isaías. Profetizó tanto al reino del norte como al sur. Contiene la profecía del lugar de nacimiento del Mesías (5:2).',
      keyVerses: ['5:2', '6:8'],
      christ:
        'Anuncia que de Belén saldrá el gobernante eterno (5:2), cumplido en el nacimiento de Jesús (Mt 2:5-6).',
    },
    en: {
      author: 'Micah',
      date: 'c. 735-700 BC',
      theme:
        'Judgment on social injustice and the promise of the Messiah who will be born in Bethlehem.',
      context:
        "Contemporary of Isaiah. He prophesied to both the northern and southern kingdoms. Contains the prophecy of the Messiah's birthplace (5:2).",
      keyVerses: ['5:2', '6:8'],
      christ:
        "It foretells that from Bethlehem will come the eternal ruler (5:2), fulfilled in Jesus' birth (Matt 2:5-6).",
    },
  },
  34: {
    es: {
      author: 'Nahúm',
      date: 'c. 663-612 a.C.',
      theme:
        'La caída de Nínive: 150 años después del arrepentimiento bajo Jonás, Asiria vuelve a la crueldad y Dios la juzga.',
      context:
        'Mensaje de consuelo para Judá oprimida por Asiria. Nínive caería ante Babilonia en el 612 a.C.',
      keyVerses: ['1:3', '1:7'],
      christ:
        'El juicio sobre Nínive declara que Dios es justo; en Cristo se encuentran la justicia y la misericordia.',
    },
    en: {
      author: 'Nahum',
      date: 'c. 663-612 BC',
      theme:
        'The fall of Nineveh: 150 years after the repentance under Jonah, Assyria returns to cruelty and God judges it.',
      context:
        'A message of comfort to Judah, oppressed by Assyria. Nineveh would fall to Babylon in 612 BC.',
      keyVerses: ['1:3', '1:7'],
      christ:
        'The judgment on Nineveh declares that God is just; in Christ justice and mercy meet.',
    },
  },
  35: {
    es: {
      author: 'Habacuc',
      date: 'c. 612-589 a.C.',
      theme:
        'El diálogo del profeta con Dios: ¿por qué usas a los babilonios malvados como vara de juicio? El justo por su fe vivirá.',
      context:
        'Único libro profético que es enteramente un diálogo con Dios sobre el problema del mal. Cierra con un cántico de confianza.',
      keyVerses: ['2:4', '3:17-18'],
      christ:
        '«El justo por su fe vivirá» (2:4) es el corazón del evangelio que Pablo cita (Ro 1:17): vida por la fe en Cristo.',
    },
    en: {
      author: 'Habakkuk',
      date: 'c. 612-589 BC',
      theme:
        "The prophet's dialogue with God: why do you use the wicked Babylonians as a rod of judgment? The righteous will live by faith.",
      context:
        'The only prophetic book that is entirely a dialogue with God about the problem of evil. It closes with a song of trust.',
      keyVerses: ['2:4', '3:17-18'],
      christ:
        '«The righteous shall live by his faith» (2:4) is the heart of the gospel Paul quotes (Rom 1:17): life by faith in Christ.',
    },
  },
  36: {
    es: {
      author: 'Sofonías',
      date: 'c. 635-625 a.C.',
      theme:
        'El día de Jehová como juicio universal seguido por la restauración del remanente fiel.',
      context:
        'Profetizó bajo Josías. Su esperanza final culmina en una declaración asombrosa: Dios se regocijará sobre su pueblo con cánticos (3:17).',
      keyVerses: ['2:3', '3:17'],
      christ:
        'El Dios que «se gozará sobre ti con cánticos» (3:17) muestra el corazón de Cristo, el Salvador que se regocija en rescatar a los suyos.',
    },
    en: {
      author: 'Zephaniah',
      date: 'c. 635-625 BC',
      theme:
        'The day of the Lord as universal judgment followed by the restoration of a faithful remnant.',
      context:
        'He prophesied under Josiah. His final hope crests in a startling declaration: God will rejoice over his people with singing (3:17).',
      keyVerses: ['2:3', '3:17'],
      christ:
        'The God who «will rejoice over you with singing» (3:17) reveals the heart of Christ, the Savior who delights to rescue his own.',
    },
  },
  37: {
    es: {
      author: 'Hageo',
      date: 'c. 520 a.C.',
      theme:
        'Reanudar la reconstrucción del templo después del exilio: pone primero el reino de Dios.',
      context:
        'Los repatriados habían pausado el templo por 16 años para construir sus propias casas. Hageo los exhorta y la obra se completa en cuatro años.',
      keyVerses: ['1:5', '2:9'],
      christ:
        'La promesa de llenar el templo de gloria (2:7-9) apunta a Cristo, cuya presencia honra la casa de Dios.',
    },
    en: {
      author: 'Haggai',
      date: 'c. 520 BC',
      theme:
        "Resume rebuilding the temple after the exile: put God's kingdom first.",
      context:
        'The returnees had paused the temple for 16 years to build their own houses. Haggai stirs them up and the work is completed in four years.',
      keyVerses: ['1:5', '2:9'],
      christ:
        'The promise to fill the temple with glory (2:7-9) points to Christ, whose presence honors the house of God.',
    },
  },
  38: {
    es: {
      author: 'Zacarías',
      date: 'c. 520-480 a.C.',
      theme:
        'Visiones nocturnas y profecías mesiánicas que animan a reconstruir el templo y miran al Rey humilde que viene.',
      context:
        'Contemporáneo de Hageo. Contiene profecías muy específicas del Mesías: el Rey en burrito (9:9), vendido por 30 piezas (11:12), traspasado (12:10).',
      keyVerses: ['4:6', '9:9', '12:10'],
      christ:
        'El Rey humilde que entra «montado sobre asno» (9:9) y el traspasado a quien mirarán (12:10) son Cristo (Mt 21:5; Jn 19:37).',
    },
    en: {
      author: 'Zechariah',
      date: 'c. 520-480 BC',
      theme:
        'Night visions and messianic prophecies that encourage temple rebuilding and look to the humble King who is coming.',
      context:
        'Contemporary of Haggai. Contains highly specific messianic prophecies: the King on a donkey (9:9), sold for 30 pieces (11:12), pierced (12:10).',
      keyVerses: ['4:6', '9:9', '12:10'],
      christ:
        'The humble King who enters «on a donkey» (9:9) and the pierced one they will look on (12:10) are Christ (Matt 21:5; John 19:37).',
    },
  },
  39: {
    es: {
      author: 'Malaquías',
      date: 'c. 430 a.C.',
      theme:
        'La última palabra profética del AT: el pueblo da a Dios sobras y se aleja; Dios promete enviar al mensajero antes del día grande.',
      context:
        'Cierra el AT con un diálogo entre Dios y su pueblo apático. Anuncia a Juan el Bautista como precursor (4:5) — luego siguen 400 años de silencio.',
      keyVerses: ['3:6', '3:10', '4:2'],
      christ:
        'Promete al mensajero que prepara el camino y al «Sol de justicia» (4:2): Juan el Bautista y Cristo (Mt 11:10).',
    },
    en: {
      author: 'Malachi',
      date: 'c. 430 BC',
      theme:
        "The OT's last prophetic word: the people give God leftovers and drift; God promises to send a messenger before the great day.",
      context:
        'Closes the OT with a dialogue between God and his apathetic people. It announces John the Baptist as forerunner (4:5) — then 400 years of silence.',
      keyVerses: ['3:6', '3:10', '4:2'],
      christ:
        'It promises the messenger who prepares the way and the «Sun of righteousness» (4:2): John the Baptist and Christ (Matt 11:10).',
    },
  },

  // ============================================================ GOSPELS
  40: {
    es: {
      author: 'Mateo (Leví), apóstol y antiguo recaudador',
      date: 'c. 50-70 d.C.',
      theme:
        'Jesús es el Mesías-Rey prometido en el AT: Hijo de David, Hijo de Abraham, cumplimiento de la Ley y los Profetas.',
      context:
        'Evangelio orientado a lectores judíos. Cita el AT más que cualquier otro Evangelio. Organizado en cinco grandes discursos que recuerdan el Pentateuco.',
      keyVerses: ['1:23', '5:17', '16:16', '28:19-20'],
      christ:
        'Presenta a Jesús como el Mesías Rey, hijo de David e hijo de Abraham, que cumple la ley y los profetas.',
    },
    en: {
      author: 'Matthew (Levi), apostle and former tax collector',
      date: 'c. AD 50-70',
      theme:
        'Jesus is the OT-promised Messiah-King: Son of David, Son of Abraham, fulfillment of the Law and the Prophets.',
      context:
        'Gospel aimed at Jewish readers. It quotes the OT more than any other Gospel. Organized around five great discourses that echo the Pentateuch.',
      keyVerses: ['1:23', '5:17', '16:16', '28:19-20'],
      christ:
        'It presents Jesus as the Messiah King, son of David and son of Abraham, who fulfills the Law and the Prophets.',
    },
  },
  41: {
    es: {
      author: 'Juan Marcos (asistente de Pedro y Pablo)',
      date: 'c. 50-60 d.C.',
      theme:
        'Jesús es el Siervo Sufriente en acción: el Evangelio más corto y rápido, lleno de "inmediatamente".',
      context:
        'Probablemente refleja los recuerdos de Pedro. Escrito para creyentes romanos. Enfatiza lo que Jesús hizo más que lo que enseñó.',
      keyVerses: ['1:15', '8:34-35', '10:45'],
      christ:
        'Muestra a Jesús como el Siervo que obra con poder y «vino para dar su vida en rescate por muchos» (10:45).',
    },
    en: {
      author: 'John Mark (assistant to Peter and Paul)',
      date: 'c. AD 50-60',
      theme:
        "Jesus is the Suffering Servant in action: the shortest, fastest Gospel, packed with 'immediately'.",
      context:
        "Likely reflects Peter's memories. Written for Roman believers. It emphasizes what Jesus did more than what he taught.",
      keyVerses: ['1:15', '8:34-35', '10:45'],
      christ:
        'It shows Jesus as the Servant who works in power and «came to give his life as a ransom for many» (10:45).',
    },
  },
  42: {
    es: {
      author: 'Lucas, médico y compañero de Pablo',
      date: 'c. 60-62 d.C.',
      theme:
        'Jesús es el Salvador del mundo entero: Evangelio para gentiles que muestra la compasión universal de Cristo.',
      context:
        'Lucas-Hechos forma una historia en dos volúmenes. Lucas investiga cuidadosamente las fuentes. Da especial atención a mujeres, pobres y marginados.',
      keyVerses: ['1:1-4', '4:18-19', '19:10', '24:46-47'],
      christ:
        'Retrata a Jesús como el Salvador del mundo que «vino a buscar y a salvar lo que se había perdido» (19:10).',
    },
    en: {
      author: 'Luke, physician and companion of Paul',
      date: 'c. AD 60-62',
      theme:
        "Jesus is the Savior of the whole world: a Gospel for Gentiles showing Christ's universal compassion.",
      context:
        'Luke-Acts is a two-volume history. Luke carefully investigates his sources. He gives special attention to women, the poor and the marginalized.',
      keyVerses: ['1:1-4', '4:18-19', '19:10', '24:46-47'],
      christ:
        'It portrays Jesus as the Savior of the world who «came to seek and to save the lost» (19:10).',
    },
  },
  43: {
    es: {
      author: 'Juan, el apóstol amado',
      date: 'c. 85-95 d.C.',
      theme:
        'Jesús es Dios encarnado: siete "Yo soy", siete señales, todos diseñados para que creas y tengas vida en su nombre.',
      context:
        'Evangelio teológico y meditativo. Selecciona pocos eventos pero los profundiza. Cierra con un propósito explícito: "para que creáis" (20:31).',
      keyVerses: ['1:14', '3:16', '14:6', '20:31'],
      christ:
        'Declara que Jesús es el Verbo eterno hecho carne, el Hijo de Dios, para que creyendo tengamos vida en su nombre (20:31).',
    },
    en: {
      author: 'John, the beloved apostle',
      date: 'c. AD 85-95',
      theme:
        "Jesus is God incarnate: seven 'I am' sayings, seven signs, all designed so that you may believe and have life in his name.",
      context:
        "A theological, meditative Gospel. It selects fewer events but goes deeper into each. It closes with an explicit purpose: 'that you may believe' (20:31).",
      keyVerses: ['1:14', '3:16', '14:6', '20:31'],
      christ:
        'It declares that Jesus is the eternal Word made flesh, the Son of God, that by believing we may have life in his name (20:31).',
    },
  },

  // ============================================================ ACTS
  44: {
    es: {
      author: 'Lucas',
      date: 'c. 62 d.C.',
      theme:
        'La expansión del Evangelio desde Jerusalén hasta Roma por el poder del Espíritu Santo a través de los apóstoles.',
      context:
        'Hechos cubre 30 años de historia de la iglesia primitiva. La primera mitad sigue a Pedro; la segunda a Pablo en tres viajes misioneros más su llegada a Roma.',
      keyVerses: ['1:8', '2:38', '4:12', '16:31'],
      christ:
        'El Cristo resucitado y ascendido envía su Espíritu y, por su iglesia, lleva el evangelio «hasta lo último de la tierra» (1:8).',
    },
    en: {
      author: 'Luke',
      date: 'c. AD 62',
      theme:
        "The gospel's expansion from Jerusalem to Rome through the Holy Spirit's power working through the apostles.",
      context:
        'Acts covers 30 years of early-church history. The first half follows Peter; the second follows Paul through three missionary journeys plus his arrival in Rome.',
      keyVerses: ['1:8', '2:38', '4:12', '16:31'],
      christ:
        'The risen and ascended Christ sends his Spirit and, through his church, carries the gospel «to the ends of the earth» (1:8).',
    },
  },

  // ============================================================ PAULINE EPISTLES
  45: {
    es: {
      author: 'Pablo',
      date: 'c. 57 d.C.',
      theme:
        'El Evangelio expuesto sistemáticamente: el justo por la fe vivirá. La salvación por gracia mediante la fe en Cristo.',
      context:
        'La carta más extensa y teológica de Pablo, escrita a una iglesia que no había visitado. Se considera el manifiesto del Evangelio.',
      keyVerses: ['1:16-17', '3:23-24', '8:28', '12:1-2'],
      christ:
        'Expone el evangelio: todos pecaron, pero somos justificados gratuitamente por la fe en Cristo y su sangre (3:23-24).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 57',
      theme:
        'The gospel systematically explained: the righteous will live by faith. Salvation by grace through faith in Christ.',
      context:
        "Paul's longest and most theological letter, written to a church he had never visited. Widely regarded as the gospel's manifesto.",
      keyVerses: ['1:16-17', '3:23-24', '8:28', '12:1-2'],
      christ:
        'It expounds the gospel: all have sinned, yet we are justified freely by faith in Christ and his blood (3:23-24).',
    },
  },
  46: {
    es: {
      author: 'Pablo',
      date: 'c. 55 d.C.',
      theme:
        'Corrección a una iglesia carismática pero carnal: cómo manejar divisiones, dones, libertad cristiana y matrimonio.',
      context:
        'Corinto era una ciudad portuaria cosmopolita y moralmente laxa. Pablo aborda problemas concretos uno por uno. El capítulo 13 (el amor) es famoso.',
      keyVerses: ['13:13', '15:3-4', '15:58'],
      christ:
        'Centra la vida de la iglesia en «Cristo crucificado» (2:2) y proclama su resurrección como primicias (cap. 15).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 55',
      theme:
        'Correction for a gifted but carnal church: how to handle divisions, gifts, Christian liberty and marriage.',
      context:
        'Corinth was a cosmopolitan, morally lax port city. Paul addresses concrete problems one by one. Chapter 13 (love) is famous.',
      keyVerses: ['13:13', '15:3-4', '15:58'],
      christ:
        "It centers the church's life on «Christ crucified» (2:2) and proclaims his resurrection as the firstfruits (ch. 15).",
    },
  },
  47: {
    es: {
      author: 'Pablo',
      date: 'c. 56 d.C.',
      theme:
        'Defensa apostólica de Pablo y revelación íntima de su ministerio: el poder de Dios se perfecciona en la debilidad.',
      context:
        'La carta más personal de Pablo. Defiende su apostolado frente a falsos maestros. Habla de su "aguijón en la carne" y de Cristo como su suficiencia.',
      keyVerses: ['4:7', '5:17', '12:9'],
      christ:
        'El poder de Cristo se perfecciona en la debilidad (12:9); por Él, siendo rico, se hizo pobre para enriquecernos (8:9).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 56',
      theme:
        "Paul's apostolic defense and an intimate window into his ministry: God's power is perfected in weakness.",
      context:
        "Paul's most personal letter. He defends his apostleship against false teachers. He speaks of his 'thorn in the flesh' and of Christ as his sufficiency.",
      keyVerses: ['4:7', '5:17', '12:9'],
      christ:
        "Christ's power is made perfect in weakness (12:9); though rich, he became poor to make us rich (8:9).",
    },
  },
  48: {
    es: {
      author: 'Pablo',
      date: 'c. 49 d.C.',
      theme:
        'Defensa apasionada de la salvación por la fe sola, contra los judaizantes que querían imponer la circuncisión.',
      context:
        'Probablemente la primera carta de Pablo. Argumenta que añadir cualquier cosa al Evangelio lo destruye. Cierra con el fruto del Espíritu (5:22-23).',
      keyVerses: ['2:20', '3:13', '5:22-23'],
      christ:
        'Defiende que somos justificados por la fe en Cristo, no por la ley: «con Cristo estoy juntamente crucificado» (2:20).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 49',
      theme:
        'A passionate defense of salvation by faith alone, against the Judaizers who wanted to impose circumcision.',
      context:
        "Likely Paul's earliest letter. He argues that adding anything to the gospel destroys it. It closes with the fruit of the Spirit (5:22-23).",
      keyVerses: ['2:20', '3:13', '5:22-23'],
      christ:
        'It defends justification by faith in Christ, not the law: «I have been crucified with Christ» (2:20).',
    },
  },
  49: {
    es: {
      author: 'Pablo',
      date: 'c. 60-62 d.C.',
      theme:
        'La iglesia como Cuerpo de Cristo: una visión cósmica del plan de Dios para unir todo en Cristo.',
      context:
        'Escrita desde la prisión. Mitad doctrinal (cap. 1-3), mitad práctica (4-6). Termina con la armadura de Dios (6:10-18).',
      keyVerses: ['2:8-9', '4:1', '6:10-12'],
      christ:
        'Celebra las riquezas que tenemos «en Cristo»: escogidos, redimidos, sellados y unidos como un cuerpo bajo su cabeza.',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 60-62',
      theme:
        "The church as the body of Christ: a cosmic vision of God's plan to unite all things in Christ.",
      context:
        'Written from prison. Half doctrinal (chs. 1-3), half practical (4-6). It ends with the armor of God (6:10-18).',
      keyVerses: ['2:8-9', '4:1', '6:10-12'],
      christ:
        'It celebrates the riches we have «in Christ»: chosen, redeemed, sealed and united as one body under his headship.',
    },
  },
  50: {
    es: {
      author: 'Pablo',
      date: 'c. 60-62 d.C.',
      theme:
        'El gozo en cualquier circunstancia: una carta de gratitud y aliento desde una celda romana.',
      context:
        'Pablo escribe a una iglesia que le envió ayuda. La palabra "gozo" aparece 16 veces. Contiene el himno de la humillación de Cristo (2:5-11).',
      keyVerses: ['1:21', '2:5-11', '4:6-7', '4:13'],
      christ:
        'Exalta el camino de Cristo, que se humilló hasta la cruz y fue exaltado sobre todo nombre (2:5-11): nuestro gozo es Él.',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 60-62',
      theme:
        'Joy in every circumstance: a letter of gratitude and encouragement from a Roman cell.',
      context:
        "Paul writes to a church that sent him help. The word 'joy' appears 16 times. It contains the hymn of Christ's humiliation (2:5-11).",
      keyVerses: ['1:21', '2:5-11', '4:6-7', '4:13'],
      christ:
        'It exalts the way of Christ, who humbled himself to the cross and was exalted above every name (2:5-11): our joy is him.',
    },
  },
  51: {
    es: {
      author: 'Pablo',
      date: 'c. 60-62 d.C.',
      theme:
        'La preeminencia de Cristo sobre todas las cosas: en Él habita corporalmente toda la plenitud de la Deidad.',
      context:
        'Combate el sincretismo religioso que minimizaba a Cristo. Presenta el retrato más alto de Cristo en el NT.',
      keyVerses: ['1:15-20', '2:9-10', '3:1-3'],
      christ:
        'Proclama la supremacía de Cristo: en Él habita toda la plenitud, todo fue creado por Él y en Él tenemos redención (1:15-20).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 60-62',
      theme:
        "Christ's preeminence over all things: in him the whole fullness of deity dwells bodily.",
      context:
        "He combats religious syncretism that minimized Christ. Presents the NT's loftiest portrait of Christ.",
      keyVerses: ['1:15-20', '2:9-10', '3:1-3'],
      christ:
        'It proclaims the supremacy of Christ: in him all fullness dwells, all was created through him, and in him we have redemption (1:15-20).',
    },
  },
  52: {
    es: {
      author: 'Pablo',
      date: 'c. 51 d.C.',
      theme:
        'Vivir con la esperanza de la segunda venida de Cristo: aliento para nuevos creyentes en medio de persecución.',
      context:
        'Una de las cartas más tempranas de Pablo, escrita pocos meses después de fundar la iglesia. La segunda venida se menciona en cada capítulo.',
      keyVerses: ['4:13-18', '5:16-18'],
      christ:
        'Anima a vivir esperando el regreso de Cristo, que rescata a los suyos y los reúne consigo (4:16-17).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 51',
      theme:
        "Living in light of Christ's second coming: encouragement to new believers under persecution.",
      context:
        "One of Paul's earliest letters, written a few months after planting the church. The second coming is mentioned in every chapter.",
      keyVerses: ['4:13-18', '5:16-18'],
      christ:
        "It encourages living in hope of Christ's return, who rescues his own and gathers them to himself (4:16-17).",
    },
  },
  53: {
    es: {
      author: 'Pablo',
      date: 'c. 51-52 d.C.',
      theme:
        'Corrige malentendidos sobre la segunda venida: el día del Señor no ha llegado todavía y el "hombre de pecado" debe ser revelado primero.',
      context:
        'Tras 1 Tesalonicenses, algunos abandonaron el trabajo creyendo que Cristo regresaría inmediatamente. Pablo los corrige.',
      keyVerses: ['2:3-4', '3:10'],
      christ:
        'Afirma la venida gloriosa de Cristo y llama a permanecer firmes mientras tanto, sostenidos por Él.',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 51-52',
      theme:
        "Corrects misunderstandings about the second coming: the day of the Lord has not yet come; the 'man of sin' must be revealed first.",
      context:
        'After 1 Thessalonians, some had quit working in the belief that Christ would return immediately. Paul corrects them.',
      keyVerses: ['2:3-4', '3:10'],
      christ:
        "It affirms Christ's glorious coming and calls believers to stand firm meanwhile, upheld by him.",
    },
  },
  54: {
    es: {
      author: 'Pablo',
      date: 'c. 62-66 d.C.',
      theme:
        'Manual para pastores: cómo conducir la iglesia, qué cualidades requerir de líderes, cómo enfrentar falsos maestros.',
      context:
        'Primera de las cartas pastorales. Timoteo era hijo espiritual de Pablo y pastor en Éfeso.',
      keyVerses: ['1:15', '2:5', '4:12', '6:6'],
      christ:
        'Resume el evangelio: «Cristo Jesús vino al mundo para salvar a los pecadores» (1:15), único mediador entre Dios y los hombres (2:5).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 62-66',
      theme:
        'A manual for pastors: how to lead the church, what qualities to require in leaders, how to face false teachers.',
      context:
        "The first of the Pastoral Epistles. Timothy was Paul's spiritual son and a pastor in Ephesus.",
      keyVerses: ['1:15', '2:5', '4:12', '6:6'],
      christ:
        'It sums up the gospel: «Christ Jesus came into the world to save sinners» (1:15), the one mediator between God and men (2:5).',
    },
  },
  55: {
    es: {
      author: 'Pablo',
      date: 'c. 66-67 d.C.',
      theme:
        'Las últimas palabras de Pablo antes de su martirio: persevera, predica la Palabra, pelea la buena batalla.',
      context:
        'Carta final, escrita desde una prisión romana esperando ejecución. Pablo sabe que el fin está cerca.',
      keyVerses: ['3:16-17', '4:7-8'],
      christ:
        'Cristo «quitó la muerte y sacó a luz la vida» (1:10); su evangelio merece toda fidelidad hasta el fin.',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 66-67',
      theme:
        "Paul's last words before martyrdom: persevere, preach the Word, fight the good fight.",
      context:
        "Paul's final letter, written from a Roman prison while awaiting execution. He knows the end is near.",
      keyVerses: ['3:16-17', '4:7-8'],
      christ:
        'Christ «abolished death and brought life to light» (1:10); his gospel is worth all faithfulness to the end.',
    },
  },
  56: {
    es: {
      author: 'Pablo',
      date: 'c. 62-66 d.C.',
      theme:
        'Cómo establecer iglesias maduras: ordenar ancianos, enseñar sana doctrina, hacer buenas obras.',
      context:
        'Tito ministraba en Creta. La carta es breve pero densa en aplicaciones prácticas.',
      keyVerses: ['2:11-14', '3:5'],
      christ:
        'La gracia de Dios «se ha manifestado para salvación» en Cristo, que se dio por nosotros para purificar un pueblo suyo (2:11-14).',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 62-66',
      theme:
        'How to establish mature churches: appoint elders, teach sound doctrine, do good works.',
      context:
        'Titus was ministering in Crete. The letter is short but dense with practical application.',
      keyVerses: ['2:11-14', '3:5'],
      christ:
        'The grace of God «has appeared for salvation» in Christ, who gave himself for us to purify a people of his own (2:11-14).',
    },
  },
  57: {
    es: {
      author: 'Pablo',
      date: 'c. 60 d.C.',
      theme:
        'Carta personal pidiendo recibir a Onésimo, esclavo fugitivo, como hermano en Cristo y no como esclavo.',
      context:
        'La epístola más corta de Pablo. Onésimo había robado a Filemón y huido; conoció a Pablo en prisión y se convirtió. Pablo lo envía de vuelta.',
      keyVerses: ['1:15-16', '1:18'],
      christ:
        'La intercesión de Pablo por Onésimo, recibiéndolo como a sí mismo, es un cuadro vivo de cómo Cristo nos reconcilia con el Padre.',
    },
    en: {
      author: 'Paul',
      date: 'c. AD 60',
      theme:
        'A personal letter pleading for Onesimus, a runaway slave, to be received as a brother in Christ and not as a slave.',
      context:
        "Paul's shortest letter. Onesimus had stolen from Philemon and fled; he met Paul in prison and was converted. Paul sends him back.",
      keyVerses: ['1:15-16', '1:18'],
      christ:
        "Paul's intercession for Onesimus, receiving him as himself, is a living picture of how Christ reconciles us to the Father.",
    },
  },

  // ============================================================ HEBREWS & GENERAL EPISTLES
  58: {
    es: {
      author: 'Anónimo (propuestas: Pablo, Bernabé, Apolos, Priscila)',
      date: 'c. 60-70 d.C.',
      theme:
        'Cristo es superior a todo lo del AT: a los ángeles, a Moisés, al sacerdocio levítico, al pacto antiguo. Mantened la fe.',
      context:
        'Carta a cristianos judíos tentados a abandonar la fe y volver al judaísmo. Argumenta la superioridad definitiva de Cristo.',
      keyVerses: ['1:3', '4:12', '11:1', '12:1-2'],
      christ:
        'Muestra a Cristo superior a todo: mejor que los ángeles, Moisés y los sacerdotes; nuestro sumo sacerdote y sacrificio perfecto.',
    },
    en: {
      author: 'Anonymous (proposed: Paul, Barnabas, Apollos, Priscilla)',
      date: 'c. AD 60-70',
      theme:
        'Christ is superior to everything from the OT: angels, Moses, the Levitical priesthood, the old covenant. Hold the faith.',
      context:
        "A letter to Jewish Christians tempted to abandon the faith and return to Judaism. It argues Christ's definitive superiority.",
      keyVerses: ['1:3', '4:12', '11:1', '12:1-2'],
      christ:
        'It shows Christ superior to all: better than the angels, Moses and the priests; our perfect high priest and sacrifice.',
    },
  },
  59: {
    es: {
      author: 'Santiago, hermano del Señor',
      date: 'c. 45-50 d.C.',
      theme:
        'La fe verdadera se demuestra en las obras: una fe que no produce vida transformada está muerta.',
      context:
        'Probablemente el primer libro del NT escrito. Práctico y sapiencial, eco de los Proverbios y del Sermón del Monte.',
      keyVerses: ['1:22', '2:17', '5:16'],
      christ:
        'La fe viva en «nuestro glorioso Señor Jesucristo» (2:1) se demuestra en obras de amor y en paciencia.',
    },
    en: {
      author: "James, the Lord's brother",
      date: 'c. AD 45-50',
      theme:
        'Genuine faith is shown by works: a faith that does not produce transformed life is dead.',
      context:
        'Likely the earliest NT book written. Practical and wisdom-flavored, echoing Proverbs and the Sermon on the Mount.',
      keyVerses: ['1:22', '2:17', '5:16'],
      christ:
        'Living faith in «our glorious Lord Jesus Christ» (2:1) is shown in works of love and in patience.',
    },
  },
  60: {
    es: {
      author: 'Pedro, apóstol',
      date: 'c. 62-64 d.C.',
      theme:
        'Esperanza viva en medio del sufrimiento: somos peregrinos y extranjeros con una herencia incorruptible.',
      context:
        'Escrita a creyentes dispersos enfrentando persecución. Pedro los anima recordándoles la esperanza eterna.',
      keyVerses: ['1:3', '2:9', '5:7'],
      christ:
        'Anima a los que sufren a poner su esperanza en Cristo, que llevó nuestros pecados en la cruz y resucitó (2:24; 1:3).',
    },
    en: {
      author: 'Peter, apostle',
      date: 'c. AD 62-64',
      theme:
        'Living hope in the midst of suffering: we are pilgrims and strangers with an incorruptible inheritance.',
      context:
        'Written to scattered believers facing persecution. Peter encourages them by recalling their eternal hope.',
      keyVerses: ['1:3', '2:9', '5:7'],
      christ:
        'It encourages the suffering to set their hope on Christ, who bore our sins on the cross and rose again (2:24; 1:3).',
    },
  },
  61: {
    es: {
      author: 'Pedro',
      date: 'c. 65-67 d.C.',
      theme:
        'Advertencia contra los falsos maestros y exhortación a crecer en el conocimiento de Cristo antes de la segunda venida.',
      context:
        'Última carta de Pedro, escrita poco antes de su martirio. Anticipa que algunos torcerán las cartas de Pablo (3:16).',
      keyVerses: ['1:3', '3:9', '3:18'],
      christ:
        'Llama a crecer «en la gracia y el conocimiento de nuestro Señor y Salvador Jesucristo» (3:18) y a esperar su venida.',
    },
    en: {
      author: 'Peter',
      date: 'c. AD 65-67',
      theme:
        'Warning against false teachers and exhortation to grow in the knowledge of Christ before the second coming.',
      context:
        "Peter's last letter, written shortly before his martyrdom. He anticipates that some will twist Paul's letters (3:16).",
      keyVerses: ['1:3', '3:9', '3:18'],
      christ:
        'It calls believers to grow «in the grace and knowledge of our Lord and Savior Jesus Christ» (3:18) and to await his coming.',
    },
  },
  62: {
    es: {
      author: 'Juan, el apóstol',
      date: 'c. 85-95 d.C.',
      theme:
        'Pruebas de fe genuina: amar a los hermanos, andar en la luz, y confesar que Jesús es el Cristo.',
      context:
        'Escrita contra el gnosticismo incipiente que negaba la encarnación. Asegura a los creyentes que pueden saber que tienen vida eterna.',
      keyVerses: ['1:9', '4:7-8', '5:13'],
      christ:
        'Asegura la vida eterna a quienes creen en el Hijo de Dios, Cristo, propiciación por nuestros pecados (5:13; 4:10).',
    },
    en: {
      author: 'John, the apostle',
      date: 'c. AD 85-95',
      theme:
        'Tests of genuine faith: love the brothers, walk in the light, and confess that Jesus is the Christ.',
      context:
        'Written against incipient Gnosticism that denied the incarnation. It assures believers they can know they have eternal life.',
      keyVerses: ['1:9', '4:7-8', '5:13'],
      christ:
        'It assures eternal life to those who believe in the Son of God, Christ, the propitiation for our sins (5:13; 4:10).',
    },
  },
  63: {
    es: {
      author: 'Juan',
      date: 'c. 85-95 d.C.',
      theme:
        'Aviso a una iglesia ("la señora elegida") sobre falsos maestros itinerantes que niegan la encarnación.',
      context:
        'Breve carta de 13 versículos. Llama a la verdad y al amor en equilibrio.',
      keyVerses: ['1:6', '1:9'],
      christ:
        'Llama a permanecer en la verdad y el amor, en «la doctrina de Cristo» que tiene al Padre y al Hijo (v.9).',
    },
    en: {
      author: 'John',
      date: 'c. AD 85-95',
      theme:
        "A warning to a church ('the elect lady') about itinerant false teachers who deny the incarnation.",
      context:
        'A short 13-verse letter. It calls for truth and love in balance.',
      keyVerses: ['1:6', '1:9'],
      christ:
        'It calls believers to abide in truth and love, in «the doctrine of Christ» that holds both Father and Son (v.9).',
    },
  },
  64: {
    es: {
      author: 'Juan',
      date: 'c. 85-95 d.C.',
      theme:
        'Carta personal a Gayo, elogiando su hospitalidad con misioneros itinerantes y advirtiendo contra el dominante Diótrefes.',
      context:
        '14 versículos. Muestra la dinámica de iglesias caseras y la hospitalidad cristiana.',
      keyVerses: ['1:4', '1:11'],
      christ:
        'Anima a andar en la verdad y a recibir a los hermanos por amor al Nombre de Cristo (v.7).',
    },
    en: {
      author: 'John',
      date: 'c. AD 85-95',
      theme:
        'A personal letter to Gaius commending his hospitality toward traveling missionaries and warning against the domineering Diotrephes.',
      context:
        '14 verses. It shows the dynamics of house churches and Christian hospitality.',
      keyVerses: ['1:4', '1:11'],
      christ:
        "It encourages walking in the truth and welcoming the brothers for the sake of Christ's Name (v.7).",
    },
  },
  65: {
    es: {
      author: 'Judas, hermano de Santiago (y de Jesús)',
      date: 'c. 65-80 d.C.',
      theme:
        'Llamado a contender ardientemente por la fe contra apóstatas infiltrados en la iglesia.',
      context:
        'Una carta urgente. Cita tradiciones extrabíblicas (Enoc, Asunción de Moisés) para ilustrar el juicio.',
      keyVerses: ['1:3', '1:24-25'],
      christ:
        'Exhorta a contender por la fe y a descansar en Aquel «poderoso para guardaros sin caída» (v.24): Cristo.',
    },
    en: {
      author: 'Jude, brother of James (and Jesus)',
      date: 'c. AD 65-80',
      theme:
        'A call to earnestly contend for the faith against apostates infiltrating the church.',
      context:
        'An urgent letter. It cites extra-biblical traditions (Enoch, the Assumption of Moses) to illustrate judgment.',
      keyVerses: ['1:3', '1:24-25'],
      christ:
        'It urges contending for the faith and resting in the One «able to keep you from stumbling» (v.24): Christ.',
    },
  },

  // ============================================================ REVELATION
  66: {
    es: {
      author: 'Juan, el apóstol',
      date: 'c. 95 d.C.',
      theme:
        'La revelación de Jesucristo: el Cordero que fue inmolado triunfa al final sobre el mal y trae cielos nuevos y tierra nueva.',
      context:
        'Escrita en la isla de Patmos durante el exilio. Apocalíptica densa en simbolismo del AT. Ánimo para iglesias perseguidas bajo Roma.',
      keyVerses: ['1:7-8', '5:9-10', '21:1-4', '22:20'],
      christ:
        'Revela a Jesucristo glorificado, el Cordero que fue inmolado y el Rey que vence, que hace «nuevas todas las cosas» (21:5).',
    },
    en: {
      author: 'John, the apostle',
      date: 'c. AD 95',
      theme:
        'The revelation of Jesus Christ: the Lamb who was slain triumphs in the end over evil and brings a new heaven and new earth.',
      context:
        'Written on the island of Patmos during exile. Apocalyptic, dense with OT symbolism. Comfort for churches persecuted under Rome.',
      keyVerses: ['1:7-8', '5:9-10', '21:1-4', '22:20'],
      christ:
        'It reveals the glorified Jesus Christ, the Lamb who was slain and the King who conquers, who makes «all things new» (21:5).',
    },
  },
};

/** Returns the localized intro for a book id, or null if unknown. */
export function getBookIntro(
  bookId: number,
  language: 'es' | 'en',
): BookIntro | null {
  const entry = BOOK_INTROS[bookId];
  if (!entry) return null;
  return entry[language];
}
