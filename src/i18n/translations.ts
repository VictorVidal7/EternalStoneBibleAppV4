export const translations = {
  es: {
    // Common
    loading: 'Cargando...',
    error: 'Error',
    cancel: 'Cancelar',
    close: 'Cerrar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    share: 'Compartir',
    copy: 'Copiar',
    copied: 'Copiado',
    ok: 'OK',
    change: 'Cambiar',
    previous: 'Anterior',
    next: 'Siguiente',
    to: 'para',
    tap: 'Toca',
    readMore: 'Leer más',
    readLess: 'Leer menos',
    completed: 'Completado',
    add: 'Añadir',
    range: 'Rango',
    optional: 'Opcional',
    coins: 'monedas',

    // Share Service (native share dialogs + clipboard fallback)
    shareService: {
      verseDialogTitle: 'Compartir versículo',
      versesDialogTitle: 'Compartir versículos',
      planDialogTitle: 'Compartir plan de lectura',
      achievementDialogTitle: 'Compartir logro',
      promo: '✨ Compartido desde Eternal Bible',
      planMessage:
        '📖 Plan de lectura: {{name}}\n\n{{description}}\n\n¡Únete a mí en este viaje espiritual!\n\n✨ Descarga Eternal Bible y empieza tu plan hoy.',
      achievementMessage:
        '🏆 ¡Logro desbloqueado!\n\n{{title}}\n{{description}}\n\n✨ Eternal Bible · Tu viaje espiritual',
      copiedTitle: 'Copiado',
      copiedMessage: 'El contenido se ha copiado al portapapeles',
      copyErrorMessage: 'No se pudo copiar al portapapeles',
    },

    // App Loading
    app: {
      subtitle: 'La Palabra de Dios',
      loadingBible: 'Cargando la Biblia...',
      verses: 'versículos',
      preparing: 'Preparando...',
      loadingVerse:
        '"Lámpara es a mis pies tu palabra,\ny lumbrera a mi camino"\n- Salmos 119:105',
      errorHint:
        'Si el problema persiste, cierra y vuelve a abrir la aplicación.',
      retry: 'Reintentar',
      unexpectedErrorTitle: 'Algo salió mal',
      unexpectedErrorMessage:
        'La app encontró un error inesperado. Puedes intentar de nuevo.',
      endOfBook: 'Fin del libro',
      endOfBookMessage: 'Has llegado al final de este libro',
      firstChapterMessage: 'Estás en el primer capítulo de este libro',
      emptyBookmarksHint:
        'Toca el icono de estrella al leer versiculos para guardarlos como favoritos',
      loadingProgress: 'Cargando... {{percent}}%',
    },

    // Tabs Navigation
    tabs: {
      home: 'Inicio',
      bible: 'Biblia',
      search: 'Buscar',
      achievements: 'Logros',
      favorites: 'Favoritos',
      notes: 'Notas',
      settings: 'Ajustes',
    },

    // Headers
    headers: {
      home: 'Eternal Bible',
      bible: 'La Biblia',
      search: 'Buscar en la Biblia',
      achievements: 'Mis Logros',
      favorites: 'Mis Favoritos',
      notes: 'Mis Notas',
      settings: 'Configuracion',
    },

    // Home Screen
    home: {
      title: 'Biblia Eterna',
      welcome: 'Bienvenido a Eternal Bible',
      welcomeShort: 'Bienvenido',
      subtitle: 'Inspiración Bíblica Diaria',
      journeyContinues: 'Tu viaje espiritual continúa',
      greetingMorning: 'Buenos días',
      greetingAfternoon: 'Buenas tardes',
      greetingEvening: 'Buenas noches',
      greetingNight: 'Que descanses',
      nudgeStreak: 'Llevas {{days}} días seguidos leyendo la Palabra',
      nudgeStreakOne: 'Llevas 1 día seguido leyendo la Palabra',
      nudgeContinue: 'Continúa en {{book}}',
      nudgeDaily: 'Tu versículo de hoy te espera',
      loadError: 'No se pudo cargar tu inicio.',
      level: 'Nivel',
      planDays: 'Plan de {{days}} días',
      start: 'Comenzar',
      percentCompleted: '{{percent}}% completado',
      dailyVerse: 'Versículo del Día',
      continueReading: 'Continuar Leyendo',
      continueListening: 'Continuar Escuchando',
      tapToResume: 'Toca para reanudar',
      startReading: 'Comenzar tu Viaje Bíblico',
      readFullChapter: 'Leer Capítulo Completo',
      studyVerse: 'Estudia este versículo',
      prepFromVerse: 'Estudiar en la Mesa',
      alsoIn: 'Ver también en',
      alsoToggle: 'Ver en otras versiones',
      alsoLanguageEs: 'español',
      alsoLanguageEn: 'inglés',
      alsoUnavailable: 'Este versículo no está disponible en {{version}}',
      alsoCompare: 'Comparar versiones',
      dailyToday: 'Hoy',
      dailyYesterday: 'Ayer',
      dailyPrevDay: 'Ver el verso del día anterior',
      dailyNextDay: 'Ver el día siguiente',
      dailyBackToToday: 'Volver a hoy',
      lastRead: 'Última lectura',
      readingPlans: 'Planes de Lectura',
      myPlans: 'Mis planes',
      createPlanShort: 'Crear',
      noPlansYet: 'Crea tu propio plan de lectura.',
      growTitle: 'Crece con Dios',
      exploreTitle: 'Explorar',
      progressTitle: 'Tu progreso',
      savedTitle: 'Guardados',
      viewPlan: 'Ver Plan',
      continue: 'Continuar',
      plansDescription: 'Sigue un plan estructurado para leer la Biblia',
      quickAccess: 'Acceso Rápido',
      days: 'días',
      footerQuote:
        '"Lámpara es a mis pies tu palabra, y lumbrera a mi camino."',
      footerReference: '— Salmos 119:105',
      books: 'libros',
      bibleLibrary: 'Biblioteca Bíblica',
      booksAvailable: 'libros disponibles',
      searchBook: 'Buscar libro...',
      streakDays: 'Días',
      rank: 'Rango',
      progress: 'Progreso',
      menu: {
        exploreBible: 'Explorar\nla Biblia',
        favorites: 'Mis Versículos\nFavoritos',
        readingPlan: 'Plan de\nEstudio Bíblico',
        notes: 'Mis\nNotas',
        search: 'Buscar en\nlas Escrituras',
      },
      a11y: {
        screenLabel: 'Pantalla de inicio de Eternal Stone Bible App',
        screenHint: 'Desplázate para explorar las opciones de la aplicación',
        startReadingHint: 'Toca para empezar o continuar tu lectura',
        navigateHint: 'Toca para ir a',
      },
    },

    // Bible Screen
    bible: {
      title: 'Biblia',
      oldTestament: 'Antiguo Testamento',
      newTestament: 'Nuevo Testamento',
      chapters: 'capítulos',
      chapter: 'capítulo',
      selectBook: 'Selecciona un libro para comenzar',
      selectChapter: 'Selecciona un capítulo',
      bookOf: 'Libro de',
      tapToView: 'Toca para ver los capítulos de',
      tapToRead: 'Toca para leer el capítulo',
      of: 'de',
      continueReading: 'Continuar',
      startReading: 'Comenzar',
      chaptersReadOf: '{{completed}}/{{total}} · {{percent}}%',
      chaptersReadOfA11y:
        '{{completed}} de {{total}} capítulos leídos, {{percent}} por ciento',
      chapterReadA11y: 'leído',
      chapterInProgressA11y: 'en progreso',
      continueChapterHint: 'Ir al capítulo {{chapter}}',
      noResultsFound: 'No se encontraron resultados',
      noMatchingBooks: 'No hay libros que coincidan con',
      bookNotFound: 'Libro no encontrado',
      couldNotFind: 'No se pudo encontrar',
      parameterReceived: 'Parámetro recibido',
      back: 'Volver',
      goTo: 'Ir a',
      loadingChapters: 'Cargando {{count}} capítulos...',
      couldNotLoadChapters: 'No se pudieron cargar los capítulos',
      book: 'Libro',
      notSpecified: 'No especificado',
      oldTestamentShort: 'AT',
      newTestamentShort: 'NT',
    },

    // Search Screen
    search: {
      title: 'Buscar',
      placeholder: 'Buscar en la Biblia...',
      minChars: 'Escribe al menos 3 caracteres para buscar',
      noResults: 'No se encontraron resultados',
      readyToSearch: 'Busca versículos por palabras clave',
      tryDifferent: 'Intenta con otras palabras clave',
      results: 'resultados encontrados',
      initialTitle: 'Busca en toda la Biblia',
      initialSubtitle: 'Encuentra versículos por palabras clave',
      popularSearches: 'Búsquedas populares:',
      recentSearches: 'Búsquedas recientes:',
      clearHistory: 'Borrar',
      searchFor: 'Buscar',
      removeFromHistory: 'Eliminar del historial',
      loadMore: 'Cargar más resultados',
      allBooks: 'Todos los libros',
      suggestions: ['amor', 'fe', 'esperanza', 'paz', 'salvación'],
      testament: {
        all: 'Todos',
        old: 'A. Testamento',
        new: 'N. Testamento',
      },
    },

    // Favorites Screen
    favorites: {
      title: 'Mis versiculos favoritos',
      noFavorites: 'Aun no tienes versiculos favoritos',
      noFavoritesA11y: 'No tienes versiculos favoritos',
      empty: 'No tienes favoritos',
      emptyHint:
        'Toca el icono de estrella al leer versiculos para guardarlos aqui',
      deleteTitle: 'Eliminar Favorito',
      deleteMessage: 'Estas seguro de que quieres eliminar este favorito?',
      deleteLabel: 'Eliminar favorito',
      deleteHint: 'Toca para eliminar este favorito',
      itemLabel: 'Favorito para {{book}} {{chapter}}:{{verse}}',
      itemHint: 'Toca para ir a este versiculo',
      screenLabel: 'Pantalla de favoritos',
      screenHint: 'Lista de tus versiculos favoritos',
      listLabel: 'Lista de favoritos',
      listHint: 'Desplazate para explorar tus versiculos favoritos',
      removed: 'Favorito eliminado',
      removedSuccessfully: 'Favorito eliminado exitosamente',
      versesSaved: 'Versículos guardados',
      verseSaved: 'Versículo guardado',
      listenAll: 'Escuchar tus favoritos',
      playlistLabel: 'Mis favoritos',
    },

    // Notes Screen
    notes: {
      title: 'Notas',
      empty: 'No tienes notas',
      emptyHint: 'Agrega notas personales mientras lees la Biblia',
      emptyState: 'No tienes notas guardadas',
      deleteTitle: 'Eliminar Nota',
      deleteMessage: '¿Estás seguro de que quieres eliminar esta nota?',
      deleteNote: 'Eliminar nota',
      add: 'Agregar Nota',
      note: 'Nota',
      shareImage: 'Compartir nota como imagen',
      saveNote: 'Guardar Nota',
      edit: 'Editar Nota',
      placeholder: 'Escribe tu nota aquí...',
      saved: 'Nota guardada',
      goToVerse: 'Ir al versículo',
      navigate: 'Navegar a',
      screenLabel: 'Pantalla de notas',
      screenHint: 'Lista de tus notas personales de la Biblia',
      modalTitle: 'Nota para {{book}} {{chapter}}:{{verse}}',
      newNote: 'Nueva Nota',
      countLabel: 'Notas guardadas',
      countLabelSingular: 'Nota guardada',
      searchPlaceholder: 'Buscar en tus notas...',
      sortRecent: 'Recientes',
      sortOldest: 'Antiguas',
      sortByBook: 'Por libro',
      noResults: 'Ninguna nota coincide con tu búsqueda',
    },

    bookIntro: {
      openLabel: 'Acerca de este libro',
      headerTitle: 'Acerca del libro',
      author: 'Autor',
      date: 'Fecha',
      theme: 'Tema central',
      context: 'Contexto',
      christ: 'Cristo en este libro',
      keyVerses: 'Versículos clave',
      missingMessage: 'Aún no hay introducción disponible para este libro.',
    },

    readingInsights: {
      cardTitle: 'Mi lectura',
      cardSubtitle: 'Tu actividad y constancia',
      title: 'Mi lectura',
      subtitle: 'Tu actividad de lectura',
      empty: 'Aún no hay lectura registrada',
      emptyHint: 'Lee un capítulo y vuelve para ver tu progreso',
      heatmapTitle: 'Tu actividad',
      heatmapHint: 'Versículos leídos por día (últimos meses)',
      heatmapMoodLabel: 'Tu ánimo',
      heatmapMoodA11y:
        'Ánimo por semana: {{n}} de {{total}} semanas con un registro',
      moodMonthTitle: 'Tu mes emocional',
      moodMonthDominant: 'Tu ánimo del mes',
      moodMonthDays: '{{n}} de {{total}} días registrados',
      moodMonthA11y:
        'Tu mes emocional: ánimo predominante {{mood}}, {{n}} de {{total}} días registrados',
      moodTrendTitle: 'Tu tendencia emocional',
      moodTrendSubtitle: 'Este mes frente al anterior',
      moodTrendLighter: 'Tu ánimo va en alza',
      moodTrendSteady: 'Tu ánimo se mantiene',
      moodTrendHeavier: 'Han sido días más difíciles',
      moodTrendMoreDays: '+{{n}} días',
      moodTrendFewerDays: '−{{n}} días',
      moodTrendA11y:
        'Tu tendencia emocional, este mes frente al anterior: {{direction}}',
      moodShare: 'Compartir mi ánimo',
      moodShareHint: 'Crea una imagen de tu mes emocional para compartir',
      moodCardTitle: 'Mi mes emocional',
      moodCardSubtitle: 'Últimos {{total}} días',
      moodShareEmpty: 'Aún no has registrado tu ánimo este mes',
      legendLess: 'Menos',
      legendMore: 'Más',
      streakCurrent: 'Racha actual',
      streakLongest: 'Racha más larga',
      activeDays: 'Días activos',
      thisWeek: 'Esta semana',
      lastWeek: 'Semana pasada',
      bestDay: 'Mejor día',
      totalsTitle: 'Tu recorrido',
      totalVerses: 'Versículos',
      totalChapters: 'Capítulos',
      totalBooks: 'Libros',
      booksTitle: 'Libros de la Biblia',
      booksCaption: 'Tu avance por los 66 libros de la Biblia',
      mostReadTitle: 'Libro más leído',
      chaptersUnit: 'capítulos',
      versesUnit: 'versículos',
      daysUnit: 'días',
      timeTitle: 'Tiempo en la Palabra',
      timeTotal: 'Tiempo total',
      timeWeek: 'Esta semana',
      timeBestDay: 'Mejor día',
      hourUnit: 'h',
      minuteUnit: 'min',
      lessThanMinute: '<1 min',
      listeningTitle: 'Tiempo de escucha',
      listeningHint: 'Tu tiempo oyendo la Palabra narrada',
      listeningToday: 'Hoy',
      listeningVerses: 'Versículos oídos',
      listeningDays: 'Días de escucha',
      listeningStreak: 'Racha (días)',
      weekShare: 'Compartir mi semana',
      weekShareHint: 'Comparte tu última semana como una imagen',
      weekVsTitle: 'Tu semana vs la anterior',
      weekVsHint: 'Últimos 7 días comparados con los 7 anteriores',
      weekVsVerses: 'Versículos leídos',
      weekVsReadingTime: 'Tiempo de lectura',
      weekVsListening: 'Tiempo de escucha',
      weekVsDays: 'Días activos',
      weekVsEmptyPrev: 'La semana anterior no tuvo actividad',
      weekVsA11y:
        '{{label}}: {{previous}} la semana anterior, {{current}} esta semana',
      moodTitle: 'Tu ánimo esta semana',
      moodHint: 'El sentimiento que registraste cada día',
      moodNone: 'Sin registro',
      moodDayA11y: '{{day}}: {{feeling}}',
      timeline: {
        cardTitle: 'Tu línea de tiempo',
        cardHint: 'Los hitos de tu camino en la Palabra',
        title: 'Tu línea de tiempo',
        subtitle: 'Hitos de tu camino',
        empty: 'Tus hitos aparecerán aquí',
        emptyHint:
          'Completa un libro, guarda un favorito o mantén tu racha — cada hito queda en tu línea de tiempo.',
        bookCompleted: 'Terminaste {{book}}',
        achievement: 'Logro: {{name}}',
        firstFavorite: 'Tu primer favorito · {{ref}}',
        firstNote: 'Tu primera nota · {{ref}}',
        firstHighlight: 'Tu primer subrayado · {{ref}}',
        streakRecord: 'Nueva racha récord: {{n}} días',
        devotionStreak: 'Racha de devoción: {{n}} días con Dios',
        planStarted: 'Comenzaste el plan {{plan}}',
        planCompleted: 'Completaste el plan {{plan}}',
        error: 'No se pudo cargar tu línea de tiempo',
        shareImage: 'Compartir como imagen',
        shareCount: '{{n}} hitos en tu camino',
        shareOneTitle: 'Un hito en mi camino',
        shareOneHint: 'Mantén presionado para compartir este hito',
        shareOneA11y: 'Compartir este hito como imagen',
      },
      weekCardTitle: 'Mi semana en la Palabra',
      weekCardSubtitle: 'Últimos 7 días',
      weekVersesRead: '{{n}} versículos leídos',
      weekListeningLine: '{{time}} de escucha · {{n}} versículos oídos',
      weekDaysActive: '{{n}}/7 días activos',
      weekReadingStreak: 'Racha de lectura: {{n}} días',
      weekListeningStreak: 'Racha de escucha: {{n}} días',
      weekEmpty: 'Aún no hay actividad esta semana',
    },
    journey: {
      // Home entry card + chrome
      cardTitle: 'Tu camino',
      cardSubtitle: 'Mira tu recorrido en la Palabra',
      title: 'Tu camino',
      since: 'desde el {{date}}',
      next: 'Siguiente',
      previous: 'Anterior',
      share: 'Compartir',
      shareHint: 'Comparte tu camino como una imagen',
      // Slides
      introTitle: 'Este es tu camino',
      introBody: 'Un vistazo a tu recorrido en la Palabra',
      versesReadTitle: 'Has leído',
      versesReadLabel: 'versículos',
      versesReadCaption: 'Cada uno, una semilla en tu corazón 🌱',
      chaptersBooksTitle: 'Has recorrido',
      chaptersLabel: 'capítulos',
      booksLabel: 'libros completados',
      booksReadTitle: 'Libros completados',
      booksReadCaption:
        '{{done}} de {{total}} libros de la Biblia · {{pct}}% 📚',
      mostReadTitle: 'Tu libro más leído',
      mostReadCaption: '{{time}} entre sus páginas ✨',
      streakTitle: 'Tu constancia',
      longestStreakLabel: 'racha más larga (días)',
      currentStreakLabel: 'racha actual',
      activeDaysLabel: 'días activos',
      timeTitle: 'Tiempo en la Palabra',
      timeReadLabel: 'de lectura',
      timeCaption: 'A lo largo de {{days}} días con Dios ✨',
      listeningTitle: 'Tu tiempo de escucha',
      listeningLabel: 'escuchando la Palabra',
      listeningCaption: '{{verses}} versículos escuchados 🎧',
      listeningStreakCaption:
        '{{verses}} versículos escuchados · {{streak}} días seguidos 🎧',
      favoriteBookTitle: 'Tu libro favorito',
      favoritesLabel: 'favoritos',
      favoriteBookShort: 'Libro favorito',
      engagementTitle: 'Tus huellas',
      highlightsLabel: 'resaltados',
      notesLabel: 'notas',
      moodTitle: 'Tu corazón',
      moodMostFelt: 'el ánimo que más nombraste',
      moodCheckinsLabel: 'días que escuchaste tu corazón',
      memoryTitle: 'Atesorando la Palabra',
      memorizedLabel: 'versículos en tu memoria',
      masteredLabel: 'dominados',
      retentionLabel: 'de retención',
      achievementsTitle: 'Tus logros',
      achievementsLabel: 'logros',
      levelLabel: 'Nivel {{level}}',
      pointsLabel: 'puntos',
      finaleTitle: 'Sigue tu camino',
      closingVerse: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.',
      closingReference: 'Salmos 119:105',
      shareCardTitle: 'Mi camino',
      // States
      emptyTitle: 'Tu camino apenas comienza',
      emptyBody: 'Lee, marca y memoriza para ver tu recorrido aquí.',
      emptyCta: 'Empezar a leer',
      loading: 'Preparando tu camino…',
      error: 'No pudimos preparar tu camino.',
      retry: 'Reintentar',
      shareError: 'No se pudo compartir.',
    },

    memory: {
      title: 'Memorización',
      short: 'Memoria',
      homeHint: 'Memoriza la Palabra',
      empty: 'Tu mazo está vacío',
      emptyHint:
        'Marca un versículo como favorito y agrégalo a tu mazo de memoria.',
      addedToast: 'Versículo agregado a memoria',
      removedToast: 'Versículo removido de memoria',
      alreadyInDeck: 'Ya está en tu mazo de memoria',
      addToDeck: 'Agregar a memoria',
      removeFromDeck: 'Quitar de memoria',
      practiceCta: 'Practicar {{count}} tarjetas',
      practiceCtaSingular: 'Practicar 1 tarjeta',
      noDueToday: 'No hay tarjetas pendientes',
      noDueHint: 'Vuelve más tarde — tus tarjetas regresan según su intervalo.',
      stats: {
        total: 'En tu mazo',
        due: 'Pendientes hoy',
        mastered: 'Dominadas',
      },
      box: 'Caja {{n}}',
      nextReview: 'Próxima revisión',
      mastered: 'Dominado',
      practice: {
        title: 'Práctica',
        progress: '{{current}} de {{total}}',
        reveal: 'Mostrar versículo',
        prompt: '¿Cómo te fue?',
        promptFullVerse: 'Léelo y guárdalo. ¿Qué tan bien lo conoces?',
        again: 'Otra vez',
        hard: 'Difícil',
        good: 'Bueno',
        easy: 'Fácil',
        done: '¡Sesión completa!',
        doneBody:
          'Repasaste {{count}} tarjetas. ¡Que la Palabra habite ricamente en ti!',
        doneBodySingular:
          'Repasaste 1 tarjeta. ¡Que la Palabra habite ricamente en ti!',
        doneCta: 'Volver al mazo',
        boxLabel: 'Caja {{box}}',
        maskHint: '{{percent}}% oculto',
        maskNone: 'Versículo completo',
        modeReveal: 'Revelar',
        modeFirstLetter: 'Iniciales',
        modeFill: 'Llenar',
        modeWrite: 'Escribir',
        firstLetterPrompt: 'Recita el versículo de memoria, luego revélalo.',
        fillPrompt: 'Escribe las palabras que faltan.',
        fillCheck: 'Revisar',
        fillResult: '{{correct}} de {{total}} correctas',
        writePrompt:
          'Escribe el versículo de memoria; luego revélalo para revisarte.',
        clear: 'Borrar',
        undo: 'Deshacer',
      },
      guide: {
        openLabel: 'Cómo funciona la memorización',
        title: 'Cómo funciona la memoria',
        intro:
          'Memoriza la Palabra con repetición espaciada: repasas cada versículo justo antes de olvidarlo, así se queda contigo sin agobios.',
        boxesTitle: 'Cajas 1 → 5',
        boxesBody:
          'Cada versículo vive en una caja. Cuando lo recuerdas bien sube de caja y tarda más en volver; si te cuesta, baja y vuelve pronto. En la Caja 5 está dominado.',
        maskTitle: 'Palabras ocultas',
        maskBody:
          'En las primeras cajas ves el versículo completo para aprenderlo. A medida que sube de caja se ocultan más palabras, para que lo recuerdes de memoria.',
        gradeTitle: '¿Cómo te fue?',
        gradeBody:
          'Tras revelar el versículo, calificas tu recuerdo: «Otra vez» y «Difícil» lo traen pronto; «Bueno» y «Fácil» lo espacian más. Así el repaso se ajusta a ti.',
        close: 'Entendido',
      },
      remove: {
        title: 'Quitar de memoria',
        message:
          '¿Quieres quitar este versículo de tu mazo? Perderás el progreso.',
        confirm: 'Quitar',
        cancel: 'Cancelar',
      },
      insights: {
        openLabel: 'Ver estadísticas de memoria',
        title: 'Estadísticas',
        subtitle: 'Tu progreso de memorización',
        emptyTitle: 'Aún no hay datos',
        emptyBody:
          'Agrega versículos a tu mazo para ver tus estadísticas de memorización.',
        masteryTitle: 'Dominio del mazo',
        masteredLabel: 'Dominado',
        statTotal: 'En tu mazo',
        statDue: 'Pendientes',
        statReviews: 'Repasos',
        statAvgBox: 'Caja prom.',
        distributionTitle: 'Distribución por caja',
        distributionHint: 'Caja 1 = nueva · Caja 5 = dominada',
        forecastTitle: 'Próximos 7 días',
        forecastHint: 'Tarjetas que te tocará repasar',
        today: 'Hoy',
        weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        strugglingTitle: 'Se te resisten',
        strugglingHint:
          'Versículos repasados varias veces que siguen en cajas bajas.',
        strugglingEmpty: '¡Ninguno se te resiste! Buen trabajo.',
        reviewsCount: '{{count}} repasos',
        reviewsCountSingular: '1 repaso',
        heatmapTitle: 'Actividad de repaso',
        heatmapHint: 'Repasos por día en las últimas semanas',
        heatmapEmpty:
          'Aún no has repasado ningún versículo. Tu mapa de actividad aparecerá aquí.',
        legendLess: 'Menos',
        legendMore: 'Más',
        streakCurrent: 'Racha actual',
        streakLongest: 'Racha máxima',
        activeDays: 'Días activos',
        retentionTitle: 'Retención por intervalo',
        retentionHint: '% de versículos recordados según cuánto esperaste',
        retentionEmpty:
          'Repasa versículos en días distintos para ver tu retención.',
        overallRetention: 'Retención global',
        leechesTitle: 'Más difíciles de recordar',
        leechesHint:
          'Has fallado estos varias veces — quizá vale releerlos con calma.',
        leechesEmpty: 'Ningún versículo se te atasca. ¡Excelente!',
        lapsesBadge: '{{count}} fallos',
        lapsesBadgeSingular: '1 fallo',
        calibrationTitle: 'Calibración de repaso',
        calibrationHint:
          'Ajustamos el ritmo de los versículos nuevos según tu retención real.',
        calibrationPace: 'Ritmo de versículos nuevos',
        calibrationBasis: 'Basado en {{pct}}% de retención · {{count}} repasos',
        calibrationSlower:
          'Retienes bien, así que espaciamos un poco más los versículos nuevos.',
        calibrationFaster:
          'Damos más práctica temprana a los versículos nuevos.',
        calibrationNeutral: 'Tu ritmo coincide con el estándar.',
        calibrationLearning:
          'Aún aprendemos tu ritmo. Te faltan {{count}} repasos con intervalo para calibrar.',
        calibrationLearningSingular:
          'Aún aprendemos tu ritmo. Te falta 1 repaso con intervalo para calibrar.',
        exclusiveLabel: 'Exclusivo',
        fullHistoryToggle: 'Ver historial completo',
        fullHistoryToggleOff: 'Ver últimos meses',
        fullHistoryHint:
          'Todo tu historial de repasos, no solo los últimos meses',
        byBookTitle: 'Retención por libro',
        byBookHint: 'Cómo te va en cada libro que has memorizado',
        byBookLocked: 'Se desbloquea con una ofrenda',
        monthsShort: [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ],
        trendTitle: 'Tendencia de retención',
        trendHint: 'Tu retención mes a mes, en los últimos 12 meses',
        trendLocked: 'Se desbloquea con una ofrenda',
        shareProgressButton: 'Compartir mi progreso',
        shareProgressLocked: 'Se desbloquea con una ofrenda',
        shareCardVerses: 'versículos memorizados',
        shareCardVersesSingular: 'versículo memorizado',
        shareCardRetention: 'retención',
        shareCardStreak: 'días de racha',
        shareCardStreakSingular: 'día de racha',
        shareCardFooter: 'Eternal Bible',
      },
      goal: {
        heroTitle: 'Tu racha',
        streakDays: 'Racha de {{count}} días',
        streakDaysSingular: 'Racha de 1 día',
        streakNone: 'Empieza tu racha hoy',
        dailyGoal: 'Meta diaria',
        todayCount: '{{done}}/{{goal}} hoy',
        remaining: 'Te faltan {{count}} repasos',
        remainingSingular: 'Te falta 1 repaso',
        goalMet: '¡Meta cumplida!',
        nextTarget: 'Siguiente meta: {{count}} días',
        settingsTitle: 'Meta diaria de repaso',
        settingsDesc: 'Cuántas tarjetas quieres repasar cada día',
        goalUnit: '{{count}}/día',
        saved: 'Meta actualizada',
        celebrateStreakTitle: '¡Racha de {{count}} días!',
        celebrateStreakBody:
          'Has repasado {{count}} días seguidos. ¡Que la Palabra siga habitando en ti!',
        celebrateGoalTitle: '¡Meta diaria cumplida!',
        celebrateGoalBody:
          'Completaste tus {{count}} repasos de hoy. ¡Bien hecho, buen siervo!',
        celebrateCta: '¡Amén!',
      },
    },

    // My Highlights Screen
    onboarding: {
      back: 'Atrás',
      next: 'Siguiente',
      start: 'Empezar',
      step: 'Paso {{current}} de {{total}}',
      welcome: {
        title: 'Bienvenido a Eternal Bible',
        subtitle: 'Tu compañero diario en la Palabra',
        body: 'Vamos a personalizar tu experiencia en unos pocos pasos. Podrás cambiar todo más adelante en Ajustes.',
        cta: 'Comenzar',
      },
      language: {
        title: 'Elige tu idioma',
        subtitle: 'Esto cambia el idioma de la interfaz',
      },
      version: {
        title: 'Elige tu Biblia',
        subtitle: 'Podrás cambiar de versión en cualquier momento',
      },
      theme: {
        title: 'Elige tu tema de color',
        subtitle: 'Personaliza el ambiente visual de la app',
      },
      done: {
        title: '¡Todo listo!',
        body: 'Que la palabra de Dios sea lámpara a tus pies en este camino.',
        cta: 'Empezar a leer',
      },
    },

    readerPrefs: {
      title: 'Preferencias de lectura',
      openLabel: 'Abrir preferencias de lectura',
      reset: 'Restablecer',
      font: 'Tipografía',
      fontSans: 'Sans',
      fontLegible: 'Legible',
      fontSerif: 'Serif',
      fontClassic: 'Clásica',
      fontCondensed: 'Compacta',
      fontMono: 'Máquina',
      fontSlab: 'Sólida',
      fontElegant: 'Elegante',
      fontRounded: 'Suave',
      exclusiveLabel: 'Exclusivo',
      size: 'Tamaño',
      increaseSize: 'Aumentar tamaño',
      decreaseSize: 'Reducir tamaño',
      lineSpacing: 'Interlineado',
      alignment: 'Alineación',
      alignLeft: 'Izquierda',
      alignJustify: 'Justificado',
      margin: 'Márgenes',
      marginSmall: 'Reducidos',
      marginMedium: 'Normales',
      marginLarge: 'Amplios',
      theme: 'Tema de lectura',
      themeSystem: 'Sistema',
      themePaper: 'Papel',
      themeSepia: 'Sepia',
      themeNight: 'Noche',
      themeHighContrast: 'Alto contraste',
      themeMusgo: 'Musgo',
      themeCrepusculo: 'Crepúsculo',
      themeNiebla: 'Niebla',
      audioSection: 'Audio',
      autoImmersive: 'Abrir el modo inmersivo al escuchar',
      autoImmersiveHint:
        'Al tocar Audio, la lectura inmersiva se abre sola y sigue la voz',
      sampleText:
        'En el principio creó Dios los cielos y la tierra. La tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo.',
    },

    crossRefs: {
      buttonLabel: 'Paralelos',
      title: 'Pasajes paralelos',
      emptyTitle: 'Sin paralelos',
      emptyBody: 'No encontramos referencias cruzadas para este versículo.',
      missingText: '(texto no disponible)',
      attribution: 'Referencias cruzadas: openbible.info (CC BY)',
    },

    originals: {
      buttonLabel: 'Idiomas originales',
      title: 'Idiomas originales',
      subtitle: 'Hebreo y griego, palabra por palabra',
      hebrew: 'Hebreo',
      greek: 'Griego',
      notInstalledTitle: 'Paquete no instalado',
      notInstalledBody:
        'Descarga el paquete de idiomas originales para ver el hebreo y el griego de cada versículo, con número Strong y definición.',
      download: 'Descargar (~30 MB)',
      downloading: 'Descargando…',
      importing: 'Instalando…',
      downloadError: 'No se pudo descargar el paquete. Inténtalo de nuevo.',
      empty: 'No hay datos originales para este versículo.',
      lemma: 'Forma léxica',
      definition: 'Definición',
      occurrences: 'apariciones',
      occurrencesOne: 'aparición',
      viewOccurrences: 'Ver dónde más aparece',
      openWordStudy: 'Estudio de palabra',
      definitionEnglish: 'Definición (en inglés)',
      openHint: 'Ver definición',
      attribution: 'Hebreo/griego: STEPBible (CC BY) · Léxico: Strong',
      morphologyTitle: 'Análisis morfológico',
      morphologyLocked: 'Se desbloquea con una ofrenda',
      kjvGloss: 'Traducción KJV',
      exclusiveLabel: 'Exclusivo',
    },

    wordStudy: {
      title: 'Estudio de palabra',
      subtitle: 'Cada lugar donde aparece esta palabra',
      occurrences: 'apariciones',
      occurrencesOne: 'aparición',
      inBooks: 'en {{n}} libros',
      inBooksOne: 'en 1 libro',
      distribution: 'Distribución por libro',
      firstAppearance: 'Primera aparición',
      lastAppearance: 'Última aparición',
      occurrencesHeader: 'Apariciones',
      moreOccurrences: 'Mostrando las primeras {{n}}',
      notInstalledTitle: 'Paquete no instalado',
      notInstalledBody:
        'Descarga el paquete de idiomas originales para estudiar dónde aparece cada palabra.',
      empty: 'No hay datos para esta palabra.',
      attribution: 'Hebreo/griego: STEPBible (CC BY) · Léxico: Strong',
    },

    referenceChain: {
      title: 'Hilo de referencias',
      subtitle: 'Sigue un versículo a otro',
      continueLabel: 'Continúa el hilo',
      threadEnds: 'El hilo termina aquí',
      start: 'Seguir el hilo',
    },

    constellation: {
      title: 'Constelación',
      subtitle: 'La red de conexiones del versículo',
      open: 'Ver constelación',
      legendOut: 'Apunta a',
      legendIn: 'Citado por',
      tapHint: 'Toca una estrella para verla',
      connections: '{{n}} conexiones',
      connectionsOne: '1 conexión',
      empty: 'Este versículo aún no tiene conexiones para mapear.',
      recenter: 'Centrar aquí',
      openInReader: 'Abrir en el lector',
    },

    periodRecap: {
      yearTitle: 'Tu año en la Palabra',
      quarterTitle: 'Tu trimestre en la Palabra',
      scopeYear: 'Año',
      scopeQuarter: 'Trimestre',
      quarterLabel: 'T{{q}} · {{year}}',
      versesRead: '{{n}} versículos leídos',
      activeDays: '{{n}} días de lectura',
      mastered: '{{n}} versículos dominados',
      listened: '{{n}} versículos escuchados',
      favorites: '{{n}} favoritos nuevos',
      mood: 'Tu ánimo: {{feeling}}',
      empty: 'Aún no hay actividad en este periodo',
    },

    study: {
      title: 'Modo estudio',
      subtitle: 'Conexiones del versículo',
      referencesTitle: 'Referencias',
      referencesHint: 'Pasajes a los que apunta este versículo',
      referencedByTitle: 'Referenciado por',
      referencedByHint: 'Versículos que apuntan a este',
      connections: 'Conexiones',
      empty: 'Sin conexiones',
      emptyHint: 'No encontramos referencias cruzadas para este versículo.',
      missingText: '(texto no disponible)',
      openHint: 'Abrir pasaje',
      error: 'No se pudo cargar el estudio',
    },

    prepTable: {
      title: 'Mesa de preparación',
      subtitle: 'Estudia y comparte la Palabra',
      cardTitle: 'Mesa de preparación',
      cardSubtitle: 'Reúne todo para estudiar y compartir un pasaje',
      passageLabel: 'Pasaje',
      helpsTitle: 'Lo que la app reúne',
      helpsCount: '{{n}} ayudas reunidas',
      crossRefsTitle: 'Pasajes paralelos',
      crossRefsHint:
        'Compáralos para leer el texto a la luz de toda la Escritura (Hch 17:11).',
      themesTitle: 'Temas del pasaje',
      bookIntroTitle: 'Sobre este libro',
      christTitle: 'Cristo en este pasaje',
      noHelps: 'Aún no reunimos ayudas para este pasaje.',
      notePlaceholder: 'Escribe aquí, en oración…',
      guardrail:
        'Esta es tu mesa de estudio: la app reúne el material, pero las palabras y la dirección son tuyas, delante del Señor. Examínalo todo a la luz de la Escritura (Hch 17:11; 1 Ts 5:21).',
      savedHint: 'Tus notas se guardan solo en este dispositivo.',
      exportLabel: 'Copiar bosquejo',
      copied: '¡Copiado!',
      rangeStartLabel: 'Versículo inicial',
      rangeEndLabel: 'Versículo final',
      decrease: 'Disminuir',
      increase: 'Aumentar',
      openHint: 'Abrir pasaje',
      error: 'No se pudo abrir la mesa de preparación',
      missingPassage: 'Elige un pasaje para comenzar.',
      sections: {
        context: {
          label: 'Contexto',
          prompt:
            '¿Quién escribió, a quién y por qué? ¿Dónde encaja este pasaje en el libro y en la historia de la redención?',
        },
        observation: {
          label: 'Observación',
          prompt:
            'Lee despacio. ¿Qué dice el texto? Anota palabras que se repiten, contrastes, mandatos y promesas. Aún no interpretes.',
        },
        interpretation: {
          label: 'Interpretación',
          prompt:
            '¿Qué significó para sus primeros lectores y qué significa? Deja que el pasaje hable y compáralo con los paralelos.',
        },
        bigIdea: {
          label: 'Idea central',
          prompt:
            'En una sola frase: ¿cuál es la idea dominante del pasaje? Todo el bosquejo debe servir a esta única verdad.',
        },
        christ: {
          label: 'Conexión con Cristo',
          prompt:
            '¿Cómo apunta, revela o se cumple este pasaje en Cristo? Que hable de Cristo, no de ti (Lc 24:27; 2 Co 4:5).',
        },
        application: {
          label: 'Aplicación',
          prompt:
            '¿Cómo cambia esta verdad la mente, el corazón y las manos? Sé concreto y sincero, nunca solo moralista.',
        },
        questions: {
          label: 'Preguntas para reflexionar o conversar',
          prompt:
            '¿Qué preguntas ayudan a descubrir y vivir esta verdad, a solas o en grupo?',
        },
      },
    },

    dailyLight: {
      cardTitle: 'Luz diaria',
      cardSubtitle: 'Tu devocional de hoy',
      title: 'Luz diaria',
      subtitle: 'Devocional de hoy',
      verseLabel: 'Versículo de hoy',
      reflectLabel: 'Para reflexionar',
      themeLabel: 'Tema de hoy',
      contextTitle: 'Sobre este libro',
      streak: 'Racha de {{n}} días',
      streakOne: 'Racha de 1 día',
      streakNone: 'Comienza tu racha hoy',
      readInContext: 'Leer en contexto',
      memorize: 'Memorizar',
      memorized: 'En tu mazo',
      exploreTheme: 'Explorar tema',
      error: 'No se pudo cargar la Luz de hoy',
      prompts: [
        '¿Qué te dice Dios hoy a través de este versículo?',
        '¿Cómo puedes vivir esta verdad hoy?',
        '¿Por qué cosa puedes dar gracias en este pasaje?',
        '¿Qué te invita a soltar o a confiar?',
        'Reza este versículo con tus propias palabras.',
        '¿A quién podrías animar con esta verdad?',
        '¿Qué promesa de Dios ves aquí?',
        'Quédate un momento en silencio con esta palabra.',
      ],
      applyTitle: 'Para aplicar',
      applyByTheme: {
        faith: [
          '¿En qué área de tu vida Dios te llama a confiar en lo que aún no ves?',
          '¿Qué paso de obediencia darías hoy si creyeras de verdad su promesa?',
          'Habla con Dios sobre la duda que más te cuesta entregarle.',
          '¿Qué promesa de Dios quieres sostener en tu memoria esta semana?',
          'Recuerda una ocasión en que Dios fue fiel, y deja que fortalezca tu fe hoy.',
          '¿Qué temor desaparecería si confiaras plenamente en que Dios tiene el control?',
          'Pon por escrito una cosa que vas a confiarle a Dios esta semana.',
          '¿Qué pequeño acto de confianza puedes ofrecerle hoy a Dios antes de ver el resultado?',
          'Dale gracias a Dios de antemano por aquello que aún esperas de su mano.',
        ],
        love: [
          '¿A quién pondrá Dios hoy en tu camino para amar como Él te ama?',
          '¿Hay alguien a quien te cueste amar? Pide gracia para dar el primer paso.',
          '¿Cómo has experimentado el amor de Dios esta semana?',
          '¿De qué manera concreta puedes mostrar el amor de Cristo a tu familia hoy?',
          'Pídele a Dios que llene tu corazón de su amor para darlo a otros.',
          '¿De qué forma puedes amar hoy a alguien sin esperar nada a cambio?',
          'Pídele a Dios que te ayude a ver a las personas como Él las ve.',
          '¿Qué gesto sencillo de servicio puedes hacer hoy por alguien cercano?',
          'Pídele a Dios que hoy ames de obra y en verdad, no solo de palabra (1 Juan 3:18).',
        ],
        hope: [
          '¿Qué circunstancia necesitas mirar hoy a la luz de la esperanza en Cristo?',
          '¿Dónde has puesto tu esperanza últimamente? Vuélvela a poner en Él.',
          'Da gracias por una promesa de Dios que sostiene tu esperanza.',
          '¿Qué te roba la esperanza hoy? Entrégaselo al Dios de toda esperanza.',
          'Escribe una promesa de Dios y tenla presente cuando llegue el desánimo.',
          '¿Qué esperas con anhelo que solo Dios puede darte? Tráelo a Él.',
          'Recuerda que lo mejor está por venir en Cristo, y deja que eso aligere tu día.',
          '¿Qué luz pequeña puedes agradecer hoy en medio de lo que aún esperas?',
          'Cuéntale a Dios aquello por lo que esperas, y déjalo en sus manos buenas.',
        ],
        peace: [
          '¿Qué preocupación puedes entregar a Dios ahora mismo en oración?',
          '¿Qué cambiaría en tu día si descansaras en la paz de Cristo?',
          'Respira hondo y descansa: «En paz me acostaré y dormiré» (Salmos 4:8).',
          '¿Qué pensamiento ansioso necesitas rendir a Dios en este momento?',
          'Agradece a Dios por un lugar o momento donde has hallado su paz.',
          '¿Qué relación tensa necesita hoy un paso tuyo hacia la paz?',
          'Antes de dormir, entrega a Dios lo que quedó sin resolver del día.',
          '¿Qué necesitas dejar de cargar para descansar hoy en el cuidado de Dios?',
          'Antes de empezar tu día, entrégale a Dios lo que más te inquieta.',
        ],
        strength: [
          '¿En qué debilidad necesitas hoy la fuerza de Dios, y no la tuya?',
          '¿A quién podrías pedir ayuda, reconociendo que no estás solo?',
          'Pídele a Dios fuerzas para lo que tienes por delante hoy.',
          '¿Qué carga llevas solo que podrías poner hoy en las manos de Dios?',
          'Descansa en que su poder se perfecciona en tu debilidad (2 Corintios 12:9).',
          '¿Qué tarea te parece demasiado grande? Pídele a Dios que la haga contigo.',
          'Apóyate hoy en una promesa de Dios cuando sientas que faltan las fuerzas.',
          '¿Dónde estás corriendo con tus propias fuerzas y necesitas detenerte a orar?',
          'Agradece a Dios por una manera en que te ha sostenido esta semana.',
        ],
        forgiveness: [
          '¿Hay alguien a quien necesitas perdonar, como Cristo te perdonó?',
          '¿Qué necesitas confesar y soltar delante de Dios hoy?',
          'Agradece a Dios por el perdón que tienes en Jesús.',
          '¿Hay un rencor que estás guardando? Pídele a Dios libertad para soltarlo.',
          'Recibe hoy, sin condenación, el perdón completo que Cristo ya compró.',
          'Ora por la persona que te hirió, pidiendo bien para ella.',
          '¿Te cuesta perdonarte a ti mismo? Recibe el perdón que Dios ya te dio.',
          '¿Qué primer paso, por pequeño que sea, puedes dar hoy hacia la reconciliación?',
          'Dale gracias a Cristo porque en su cruz tu deuda quedó pagada por completo.',
        ],
        wisdom: [
          '¿Qué decisión tienes por delante? Pídele a Dios sabiduría (Santiago 1:5).',
          '¿En qué consejo estás confiando más que en la Palabra de Dios?',
          '¿Qué te enseña este pasaje sobre cómo vivir sabiamente hoy?',
          '¿A quién sabio y temeroso de Dios podrías pedir consejo esta semana?',
          'Antes de decidir hoy, haz una pausa y pregunta: «Señor, ¿qué quieres tú?».',
          'Pide a Dios discernir entre lo bueno y lo mejor en lo que hoy tienes delante.',
          'Lee un proverbio y elige una sola verdad para vivir hoy.',
          '¿Qué hábito pequeño podrías cambiar hoy para vivir con más sabiduría?',
          'Pídele a Dios un corazón que ame su verdad más que tener la razón.',
        ],
        prayer: [
          '¿Qué le quieres decir a Dios ahora mismo, con tus propias palabras?',
          '¿Por quién podrías interceder hoy?',
          'Tómate un momento en silencio para escuchar a Dios.',
          '¿Qué petición has dejado de traer a Dios? Vuélvela a poner delante de Él.',
          'Da gracias por una oración que Dios ya ha respondido.',
          'Aparta cinco minutos hoy solo para estar con Dios, sin pedir nada.',
          'Convierte tu mayor preocupación de hoy en una oración concreta.',
          '¿Qué motivo de gratitud puedes convertir hoy en una oración de alabanza?',
          'Escribe una breve oración por alguien y ora por esa persona durante el día.',
        ],
        courage: [
          '¿Qué temor te está frenando? Entrégaselo a Dios.',
          '¿Qué acto de valentía te pide hoy seguir a Jesús?',
          'Recuerda una vez en que Dios estuvo contigo y dale gracias.',
          '¿Qué conversación o paso has estado evitando por miedo?',
          'Repite con calma: «Esfuérzate y sé valiente; el Señor va contigo» (Josué 1:9).',
          'Da hoy ese primer paso pequeño que has estado posponiendo.',
          '¿En qué necesitas ser valiente para hacer lo correcto, aunque cueste?',
          '¿Qué verdad necesitas creer hoy para vencer el miedo a lo que viene?',
          'Pídele a Dios valor para decir o hacer lo correcto con amor.',
        ],
        comfort: [
          '¿Dónde necesitas el consuelo de Dios hoy?',
          '¿A quién que sufre podrías consolar con el consuelo que has recibido?',
          'Derrama tu corazón delante de Dios; Él te escucha.',
          '¿Qué pérdida o dolor necesitas llevar hoy ante el Dios de toda consolación?',
          'Escríbele a alguien que sufre una palabra breve de aliento.',
          'Permítete llorar delante de Dios; Él recoge cada una de tus lágrimas (Salmos 56:8).',
          'Busca hoy la compañía de alguien que te recuerde el amor de Dios.',
          '¿Qué palabra de Dios puedes sostener cuando llegue hoy la tristeza?',
          'Acércate a Dios tal como estás; no necesitas tener las palabras perfectas.',
        ],
        joy: [
          '¿Por qué tres cosas puedes dar gracias a Dios hoy?',
          '¿Cómo puedes buscar tu gozo en el Señor y no en las circunstancias?',
          'Comparte hoy una palabra de aliento con alguien.',
          '¿Dónde puedes ver hoy una señal pequeña de la bondad de Dios?',
          'Canta o escucha una canción que levante tu corazón al Señor.',
          'Haz hoy algo, por pequeño que sea, que celebre la bondad de Dios.',
          'Da gracias en voz alta por una bendición que sueles dar por sentada.',
          '¿Qué cosa buena y sencilla de hoy puedes recibir como un regalo de Dios?',
          'Comparte tu gozo: cuéntale a alguien algo bueno que Dios ha hecho.',
        ],
        grace: [
          '¿Dónde estás intentando ganar lo que Dios ya te da por gracia?',
          '¿Cómo puedes extender a otros la gracia que has recibido?',
          'Descansa hoy en que el amor de Dios no depende de tu desempeño.',
          '¿A quién necesitas tratar con más gracia, como Dios te trata a ti?',
          'Agradece por algo bueno en tu vida que no ganaste, sino que recibiste.',
          'Recibe hoy el día como un regalo inmerecido de Dios.',
          'Ofrece una palabra amable a alguien que no «se la haya ganado».',
          '¿A quién podrías sorprender hoy con una bondad que no espera recibir?',
          'Descansa en que ya eres amado por Dios, antes de hacer nada por Él.',
        ],
        salvation: [
          '¿Has puesto tu confianza en Cristo para tu salvación?',
          '¿Con quién podrías compartir la esperanza del evangelio?',
          'Da gracias a Dios por el don de la vida eterna en Jesús.',
          '¿Recuerdas el momento o el camino por el que llegaste a confiar en Jesús?',
          'Ora por una persona que aún no conoce a Cristo.',
          'Medita en lo que Cristo pagó para darte vida, y dale gracias.',
          'Vive hoy como hijo amado y libre, no como esclavo del temor.',
          '¿Cómo cambiaría tu día si lo vivieras como alguien profundamente amado y rescatado?',
          'Dale gracias a Jesús por haber hecho por ti lo que tú no podías hacer.',
        ],
        guidance: [
          '¿En qué decisión necesitas hoy la dirección de Dios?',
          '¿Estás dispuesto a seguir el camino de Dios aunque sea distinto al tuyo?',
          'Pídele a Dios que alumbre tus pasos con su Palabra (Salmos 119:105).',
          '¿Qué próximo paso pequeño y obediente puedes dar hoy?',
          'Entrega tus planes a Dios y pídele que dirija tus pasos (Proverbios 16:9).',
          'Antes de actuar hoy, pregúntale a Dios en oración cuál es su camino.',
          'Confía en que Dios endereza tus pasos aunque no veas todo el camino.',
          '¿Qué área de tu vida necesitas poner hoy bajo la dirección de Dios?',
          'Pídele a Dios un corazón dispuesto a seguirle, aun antes de conocer el camino.',
        ],
      },
    },
    christConnections: {
      cardTitle: 'Cristo en este pasaje',
      cardSubtitle: 'Toda la Escritura habla de Él (Lucas 24:27)',
      pointsTo: 'Apunta a Cristo',
      notes: {
        'genesis-1-1':
          'En el principio Dios creó todo. Y todo fue hecho por medio de su Hijo, la Palabra eterna; sin Él nada de lo que existe llegó a ser.',
        'exodus-15-2':
          '«El Señor es mi salvación.» El nombre Jesús significa «el Señor salva»: lo que Israel cantó junto al mar se cumple en Cristo, en quien Dios nos rescata para siempre.',
        'numbers-6-24':
          'La bendición sacerdotal —que el Señor te guarde y te dé paz— se derrama plenamente en Cristo, de cuya plenitud todos recibimos gracia sobre gracia.',
        'psalms-23-1':
          '«El Señor es mi pastor.» Jesús dijo: «Yo soy el buen pastor», y dio su vida por las ovejas. El Pastor del salmo tiene rostro: es Cristo.',
        'psalms-34-18':
          'Dios está cerca de los quebrantados de corazón. En Jesús, Dios mismo se acercó y llama: «Venid a mí todos los que estáis cansados, y yo os haré descansar».',
        'isaiah-9-6':
          '«Un niño nos ha nacido, hijo nos ha sido dado... Príncipe de paz.» Esta profecía se cumple en el nacimiento de Jesús, el Salvador, Cristo el Señor.',
        'isaiah-12-2':
          '«Dios es mi salvación.» El profeta espera al Salvador que vendría; ese Salvador es Jesús, cuyo nombre mismo proclama que el Señor salva.',
        'isaiah-40-31':
          'Los que esperan en el Señor renuevan sus fuerzas. Esa fuerza tiene un nombre: Jesús invita a los cansados a venir a Él para hallar descanso.',
        'isaiah-53-5':
          '«Herido fue por nuestras rebeliones... por su llaga fuimos nosotros curados.» Siglos antes, Isaías describió la cruz: el siervo sufriente es Cristo, que llevó nuestros pecados.',
        'lamentations-3-22':
          'Las misericordias del Señor nunca se acaban. Esa fidelidad se hizo carne: la gracia y la verdad vinieron por medio de Jesucristo.',
        'lamentations-3-23':
          '«Nuevas son cada mañana; grande es tu fidelidad.» La fidelidad inmutable de Dios resplandece en Cristo, el mismo ayer, hoy y por los siglos.',
        'micah-6-8':
          'Hacer justicia, amar misericordia y caminar humildemente con Dios: lo que el Señor pide, Jesús lo vivió perfectamente. «Misericordia quiero, y no sacrificio», dijo Él.',
        'matthew-11-28':
          'Jesús mismo invita: «Venid a mí... y yo os haré descansar». El descanso del alma no es un método, sino una Persona: el Señor que carga lo que tú no puedes.',
        'matthew-28-6':
          '«No está aquí, pues ha resucitado.» La tumba vacía lo cambia todo: Cristo vive, y en Él la muerte ha sido vencida.',
        'matthew-28-19':
          'El Señor resucitado envía a hacer discípulos de todas las naciones. Toda la misión de la iglesia brota de su autoridad y de su promesa: «Yo estoy con vosotros todos los días».',
        'luke-1-37':
          '«Nada hay imposible para Dios.» Se dijo del nacimiento de Jesús: Dios mismo entró en el mundo como hombre. El Imposible se hizo niño.',
        'luke-19-10':
          '«El Hijo del Hombre vino a buscar y a salvar lo que se había perdido.» En una frase, la misión de Jesús: vino por ti.',
        'john-1-1':
          '«En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.» Jesús no es un profeta más: es Dios eterno hecho hombre.',
        'john-1-14':
          '«Aquel Verbo fue hecho carne, y habitó entre nosotros.» El Dios infinito se hizo uno de nosotros para salvarnos: este es el corazón del evangelio.',
        'john-3-16':
          'El evangelio en un versículo: el amor del Padre, el don del Hijo, y la vida eterna para todo el que cree en Jesús.',
        'john-6-35':
          '«Yo soy el pan de vida.» Lo que el alma más necesita no es una cosa, sino Cristo mismo; quien viene a Él nunca más tendrá hambre.',
        'john-8-12':
          '«Yo soy la luz del mundo.» En un mundo a oscuras, seguir a Jesús es caminar en la luz de la vida.',
        'john-10-10':
          '«Yo he venido para que tengan vida, y para que la tengan en abundancia.» Cristo no vino a quitarte la vida, sino a dártela plena.',
        'john-10-11':
          '«Yo soy el buen pastor; el buen pastor su vida da por las ovejas.» El Pastor de los salmos es Jesús, que muere por ti para llevarte a casa.',
        'john-11-25':
          '«Yo soy la resurrección y la vida.» Frente a la tumba de su amigo, Jesús no ofreció una doctrina, sino su propia persona como la victoria sobre la muerte.',
        'john-14-1':
          '«No se turbe vuestro corazón; creéis en Dios, creed también en mí.» Jesús pone la confianza en Él al nivel de la confianza en Dios: descansar en Cristo es descansar en Dios.',
        'john-14-6':
          '«Yo soy el camino, la verdad y la vida; nadie viene al Padre, sino por mí.» No uno de muchos caminos: Cristo es el único y suficiente camino a Dios.',
        'john-15-5':
          '«Yo soy la vid, vosotros los pámpanos.» Toda vida y todo fruto vienen de permanecer unidos a Jesús; separados de Él nada podemos hacer.',
        'john-16-33':
          '«En el mundo tendréis aflicción; pero confiad, yo he vencido al mundo.» La paz de Cristo no niega el dolor: descansa en su victoria.',
        'acts-4-12':
          '«En ningún otro hay salvación.» No hay otro nombre dado a los hombres en que podamos ser salvos: solo Jesús.',
        'acts-16-31':
          '«Cree en el Señor Jesucristo, y serás salvo.» La salvación no se gana: se recibe confiando en Cristo.',
        'romans-5-1':
          'Justificados por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo. La guerra terminó: la cruz hizo la paz.',
        'romans-5-8':
          '«Siendo aún pecadores, Cristo murió por nosotros.» El amor de Dios no esperó a que mejoráramos: se demostró en la cruz.',
        'romans-6-23':
          '«La paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús.» Lo que merecíamos lo cambió por lo que Él nos regala.',
        'romans-8-1':
          '«Ninguna condenación hay para los que están en Cristo Jesús.» En Él, el veredicto sobre el creyente ya no es «culpable», sino «hijo amado».',
        'romans-8-32':
          '«El que no escatimó ni a su propio Hijo... ¿cómo no nos dará también con él todas las cosas?» La cruz es la garantía de toda otra bondad de Dios.',
        'romans-10-9':
          '«Si confesares con tu boca que Jesús es el Señor, y creyeres... serás salvo.» El señorío y la resurrección de Cristo son el centro de la fe que salva.',
        '2corinthians-5-17':
          '«Si alguno está en Cristo, nueva criatura es.» Unido a Jesús no eres una versión mejorada: eres una creación nueva.',
        '2corinthians-5-21':
          '«Al que no conoció pecado, lo hizo pecado por nosotros, para que fuéramos hechos justicia de Dios en él.» El gran intercambio: nuestro pecado por su justicia.',
        'galatians-2-20':
          '«Con Cristo estoy juntamente crucificado... y vive Cristo en mí.» La vida cristiana no es imitar a Jesús desde lejos, sino que Él viva en ti por la fe.',
        'galatians-6-14':
          '«Lejos esté de mí gloriarme, sino en la cruz de nuestro Señor Jesucristo.» Lo único digno de jactancia es lo que Cristo hizo por nosotros.',
        'ephesians-1-7':
          '«En él tenemos redención por su sangre, el perdón de pecados.» El perdón no es barato ni automático: costó la sangre del Hijo.',
        'ephesians-2-8':
          '«Por gracia sois salvos por medio de la fe... es don de Dios.» La salvación es regalo, de principio a fin obra de Cristo.',
        'philippians-2-9':
          '«Dios también le exaltó hasta lo sumo, y le dio un nombre que es sobre todo nombre.» El que se humilló hasta la cruz reina hoy como Señor de todo.',
        'philippians-4-19':
          '«Mi Dios suplirá todo lo que os falta conforme a sus riquezas... en Cristo Jesús.» La provisión de Dios fluye de las riquezas que tenemos en su Hijo.',
        'colossians-1-16':
          '«Todo fue creado por medio de él y para él.» Jesús no es una criatura más: es el Creador, anterior a todo, y en Él todo subsiste.',
        '1timothy-1-15':
          '«Cristo Jesús vino al mundo para salvar a los pecadores.» Palabra fiel y digna de ser recibida: vino por los pecadores, y eso te incluye.',
        'titus-2-11':
          '«La gracia de Dios se ha manifestado para salvación a todos los hombres.» Esa gracia tiene rostro y nombre: apareció en Jesús.',
        'hebrews-7-25':
          '«Puede salvar perpetuamente a los que por él se acercan a Dios, viviendo siempre para interceder.» Cristo no solo salvó una vez: vive hoy orando por los suyos.',
        'hebrews-12-2':
          '«Puestos los ojos en Jesús, el autor y consumador de la fe.» La carrera cristiana se corre mirando a Cristo, no a uno mismo.',
        'hebrews-13-8':
          '«Jesucristo es el mismo ayer, hoy y por los siglos.» En un mundo que cambia, Él es la roca que no cambia.',
        '1peter-1-3':
          '«Nos hizo renacer para una esperanza viva, por la resurrección de Jesucristo.» Nuestra esperanza está viva porque el Señor está vivo.',
        '1peter-2-24':
          '«Llevó él mismo nuestros pecados en su cuerpo sobre el madero.» La profecía de Isaías 53 se cumple aquí: por su herida fuimos curados.',
        '2peter-3-9':
          '«El Señor es paciente, no queriendo que ninguno perezca, sino que todos procedan al arrepentimiento.» Su demora no es olvido: es misericordia que da tiempo para volver a Cristo.',
        '2peter-3-18':
          '«Creced en la gracia y el conocimiento de nuestro Señor y Salvador Jesucristo.» Esta es la meta de toda la vida cristiana, y el corazón de esta app.',
        '1john-1-9':
          '«Si confesamos nuestros pecados, él es fiel y justo para perdonarnos.» El perdón es seguro porque descansa en la sangre de Jesús, no en nuestro mérito.',
        '1john-4-7':
          '«Amémonos unos a otros, porque el amor es de Dios.» ¿Y dónde se ve ese amor? En que Dios envió a su Hijo unigénito al mundo para que vivamos por él. Amamos porque Él nos amó primero.',
        '1john-4-10':
          '«No que nosotros hayamos amado a Dios, sino que él nos amó... y envió a su Hijo en propiciación por nuestros pecados.» El amor verdadero empezó en la cruz.',
        '1john-4-19':
          '«Nosotros le amamos a él, porque él nos amó primero.» Todo amor cristiano es respuesta al amor que Cristo derramó primero.',
        'jude-1-24':
          '«A aquel que es poderoso para guardaros sin caída, y presentaros... irreprensibles.» Tu perseverancia final no descansa en tu fuerza, sino en Cristo que te sostiene.',
        'revelation-3-20':
          '«He aquí, yo estoy a la puerta y llamo.» El Señor del universo no fuerza la entrada: busca comunión contigo y espera tu respuesta.',
        'revelation-21-4':
          '«Enjugará Dios toda lágrima... ya no habrá muerte.» La obra de Cristo termina aquí: un mundo nuevo sin dolor, para siempre con Él.',
        'revelation-21-5':
          '«He aquí, yo hago nuevas todas las cosas.» El que venció la muerte tendrá la última palabra: no el fin, sino todo hecho nuevo en Cristo.',
        'isaiah-41-10':
          '«No temas, porque yo estoy contigo.» La promesa de la presencia de Dios halla su rostro en Jesús, que prometió: «He aquí, yo estoy con vosotros todos los días».',
        'jeremiah-29-11':
          'Dios tiene pensamientos de paz, de darte un futuro y una esperanza. Esa esperanza viva y segura nos es dada en Cristo, resucitado de entre los muertos.',
        'psalms-51-10':
          '«Crea en mí un corazón limpio.» Lo que David pide, Cristo lo cumple: por su sangre nos acercamos a Dios con el corazón purificado y la conciencia limpia.',
        'john-14-27':
          '«La paz os dejo, mi paz os doy.» No es una paz cualquiera, sino la paz propia de Cristo, comprada en la cruz; por eso añade: «No se turbe vuestro corazón».',
        'romans-8-28':
          'Dios hace que todo coopere para bien de los suyos, y ese bien tiene una meta: ser hechos conformes a la imagen de su Hijo. Todo nos lleva hacia Cristo.',
        'philippians-4-13':
          '«Todo lo puedo en Cristo que me fortalece.» La fuerza no es nuestra: es la de Cristo en nosotros, suficiente tanto en la abundancia como en la escasez.',
        'job-19-25':
          '«Yo sé que mi Redentor vive.» En medio del sufrimiento, Job confía en un Redentor viviente; ese Redentor es Cristo, que dijo: «Yo soy la resurrección y la vida».',
        'psalms-16-11':
          '«Me mostrarás la senda de la vida.» Pedro citó este salmo en Pentecostés referido a la resurrección de Cristo: la muerte no pudo retenerlo, y en Él hallamos la senda de la vida.',
        'psalms-27-1':
          '«Jehová es mi luz y mi salvación.» Lo que el salmista confiesa, Jesús lo declara de sí mismo: «Yo soy la luz del mundo». En Él no hay a quién temer.',
        'psalms-34-8':
          '«Gustad, y ved que es bueno Jehová.» Pedro toma estas palabras y las aplica a Cristo: «si es que habéis gustado la benignidad del Señor». Probarlo es conocerlo.',
        'proverbs-18-10':
          '«Torre fuerte es el nombre de Jehová.» Ese nombre que salva nos es dado en Jesús, «porque no hay otro nombre... en que podamos ser salvos».',
        'isaiah-26-3':
          '«Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera.» Esa paz tiene nombre: Cristo, que dijo «mi paz os doy».',
        'isaiah-43-2':
          '«Cuando pases por las aguas, yo estaré contigo.» La presencia prometida es la de Cristo, que asegura: «He aquí, yo estoy con vosotros todos los días».',
        'zephaniah-3-17':
          '«Jehová está en medio de ti, poderoso, él salvará.» Dios en medio de su pueblo para salvar: ese es Emanuel, «Dios con nosotros», Jesús.',
        'matthew-28-20':
          '«He aquí, yo estoy con vosotros todos los días, hasta el fin del mundo.» El Cristo resucitado no nos deja solos: su presencia acompaña cada día.',
        'john-13-34':
          '«Un mandamiento nuevo os doy: Que os améis unos a otros; como yo os he amado.» La medida del amor cristiano es el amor de Cristo, que se entregó por nosotros.',
        'revelation-1-8':
          '«Yo soy el Alfa y la Omega... el que es y que era y que ha de venir.» El eterno Señor del principio y del fin es Jesús, el mismo que vino y que volverá (cf. Ap 22:13).',
        'exodus-14-14':
          '«Jehová peleará por vosotros, y vosotros estaréis tranquilos.» La batalla que no podíamos ganar la ganó Cristo: en la cruz desarmó a los principados y triunfó sobre ellos.',
        'deuteronomy-31-6':
          '«No te dejará, ni te desamparará.» Esa promesa es nuestra en Cristo; por eso Hebreos la repite a los creyentes: el Señor mismo nos acompaña.',
        'joshua-1-9':
          '«Esfuérzate y sé valiente... porque Jehová tu Dios estará contigo.» El valor no nace de nosotros, sino de su presencia: el Cristo resucitado dice «yo estoy con vosotros todos los días».',
        '1samuel-16-7':
          '«Jehová mira el corazón.» Cristo conocía lo que había en el hombre; ante Él no hay máscaras, y aun así nos ama y nos llama.',
        'psalms-18-2':
          '«Jehová, roca mía y castillo mío.» Pablo dice que aquella roca que acompañó a Israel era Cristo: nuestro refugio firme tiene rostro.',
        'psalms-19-1':
          '«Los cielos cuentan la gloria de Dios.» Y esos cielos fueron hechos por medio del Hijo: en Él fueron creadas todas las cosas, y todo proclama su gloria.',
        'psalms-28-7':
          '«Jehová es mi fortaleza y mi escudo.» Esa fuerza se nos da en Cristo, que dijo: «todo lo puedo en Cristo que me fortalece».',
        'psalms-46-1':
          '«Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.» Ese amparo se acercó en Jesús, que invita: «Venid a mí... y yo os haré descansar».',
        'psalms-46-10':
          '«Estad quietos, y conoced que yo soy Dios.» El mismo que calma el alma calmó la tormenta con su voz: «Calla, enmudece», dijo Jesús, y todo se aquietó.',
        'psalms-55-22':
          '«Echa sobre Jehová tu carga, y él te sustentará.» Pedro lo repite señalando a Cristo: «echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros».',
        'psalms-103-2':
          '«Bendice, alma mía, a Jehová... él es quien perdona todas tus iniquidades.» Ese perdón pleno nos llega en Cristo, en quien tenemos redención por su sangre.',
        'psalms-118-24':
          '«Este es el día que hizo Jehová.» Es el salmo de la piedra que desecharon los edificadores y vino a ser cabeza del ángulo: Cristo, motivo de nuestro gozo.',
        'psalms-119-105':
          '«Lámpara es a mis pies tu palabra, y lumbrera a mi camino.» Esa Palabra se hizo carne: Jesús, la Palabra viva y la luz del mundo, alumbra el camino.',
        'psalms-147-3':
          '«Él sana a los quebrantados de corazón.» Jesús abrió su ministerio con esa promesa: fue ungido para sanar a los quebrantados de corazón.',
        'proverbs-3-5':
          '«Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.» Esa confianza halla su descanso en Cristo, el camino seguro al Padre.',
        'isaiah-64-8':
          '«Nosotros barro, y tú el que nos formaste.» En Cristo somos nueva creación: el Alfarero rehace en su Hijo lo que el pecado quebró.',
        'jeremiah-33-3':
          '«Clama a mí, y yo te responderé.» Jesús ensancha esa promesa: «todo lo que pidiereis al Padre en mi nombre, os lo dará».',
        'nahum-1-7':
          '«Jehová es bueno, fortaleza en el día de la angustia.» Esa fortaleza es Cristo, en quien tenemos paz en medio de la aflicción: «yo he vencido al mundo».',
        'matthew-5-14':
          '«Vosotros sois la luz del mundo.» Brillamos solo como reflejo de Aquel que es la Luz: «Yo soy la luz del mundo», dijo Jesús.',
        'matthew-6-33':
          '«Buscad primeramente el reino de Dios y su justicia.» Buscar el reino es buscar al Rey: en Cristo viene el reino, y en Él se nos da la justicia que no podíamos ganar.',
        'matthew-19-26':
          '«Para los hombres esto es imposible; mas para Dios todo es posible.» Lo dijo de la salvación: lo que el hombre no puede, lo hace Dios en Cristo, que vino a salvar a los perdidos.',
        'matthew-22-37':
          '«Amarás al Señor tu Dios con todo tu corazón.» Solo Uno cumplió perfectamente este mandamiento: Cristo, que ahora nos da su Espíritu para amar.',
        'mark-10-27':
          '«Para los hombres es imposible, mas para Dios no; porque todas las cosas son posibles para Dios.» La salvación es obra suya de principio a fin, lograda en Cristo.',
        'luke-6-31':
          '«Haced con los hombres como queréis que ellos hagan con vosotros.» Jesús no solo lo enseñó: lo vivió, entregándose por nosotros cuando nada merecíamos.',
        'acts-1-8':
          '«Me seréis testigos.» El centro del testimonio cristiano es una Persona: el Cristo resucitado, anunciado hasta lo último de la tierra.',
        'romans-8-31':
          '«Si Dios es por nosotros, ¿quién contra nosotros?» La prueba de que Dios está de nuestro lado es que entregó a su propio Hijo por nosotros.',
        'romans-8-38':
          '«Ni lo presente ni lo por venir... nos podrá separar del amor de Dios, que es en Cristo Jesús.» El amor que nos sostiene no es una idea: tiene nombre, Cristo Jesús.',
        'romans-12-2':
          '«Transformaos por medio de la renovación de vuestro entendimiento.» Esa transformación es ser conformados a la imagen de su Hijo: llegar a parecernos a Cristo.',
        'romans-15-13':
          '«El Dios de esperanza os llene de todo gozo y paz en el creer.» Toda esa esperanza descansa en Cristo resucitado, nuestra esperanza de gloria.',
        '1corinthians-10-13':
          '«Dios... dará también juntamente con la tentación la salida.» Esa salida es Cristo, que fue tentado en todo y venció, y socorre a los que son tentados.',
        '1corinthians-13-13':
          '«Y ahora permanecen la fe, la esperanza y el amor; pero el mayor de ellos es el amor.» Ese amor que todo lo soporta lo vemos en su forma más pura en la cruz de Cristo.',
        '2corinthians-4-16':
          '«El hombre interior no obstante se renueva de día en día.» Esa vida nueva es la vida de Cristo en nosotros, que ni la muerte podrá apagar.',
        '2corinthians-12-9':
          '«Bástate mi gracia; porque mi poder se perfecciona en la debilidad.» Es la voz de Cristo: su poder reposa sobre los débiles que confían en Él.',
        'galatians-5-22':
          '«El fruto del Espíritu es amor, gozo, paz...» Ese fruto es el carácter mismo de Cristo formándose en quien permanece en Él.',
        'ephesians-3-20':
          '«Aquel que es poderoso para hacer todas las cosas mucho más abundantemente.» Ese poder obra en nosotros por Cristo, según su Espíritu que mora en el creyente.',
        'ephesians-4-32':
          '«Perdonándoos unos a otros, como Dios os perdonó a vosotros en Cristo.» La medida de nuestro perdón es el perdón que recibimos en la cruz.',
        'ephesians-6-10':
          '«Fortaleceos en el Señor, y en el poder de su fuerza.» No nos pide fuerza propia, sino la suya: estar firmes en Cristo y en su victoria.',
        'philippians-1-6':
          '«El que comenzó en vosotros la buena obra, la perfeccionará.» Cristo es el autor y consumador de la fe: lo que Él empieza, Él lo termina.',
        'hebrews-4-12':
          '«La palabra de Dios es viva y eficaz.» La Palabra que escudriña el corazón es la misma que se hizo carne: Cristo, vivo y poderoso para salvar.',
        'james-1-5':
          '«Si alguno de vosotros tiene falta de sabiduría, pídala a Dios.» Y Cristo nos ha sido hecho sabiduría de Dios: en Él están escondidos todos los tesoros de la sabiduría.',
        '1john-3-1':
          '«Mirad cuál amor nos ha dado el Padre, para que seamos llamados hijos de Dios.» Ese amor se mostró enviando a su Hijo, para que vivamos por Él.',
        '1john-4-8':
          '«Dios es amor.» No lo sabemos por una definición, sino por un hecho: «en esto se mostró el amor de Dios... en que Dios envió a su Hijo» para que vivamos por Él.',
        'deuteronomy-31-8':
          '«El Señor va delante de ti; él estará contigo, no te dejará, ni te desamparará.» Esa promesa tiene rostro en Jesús, el Emanuel —Dios con nosotros— que dijo: «Yo estoy con vosotros todos los días».',
        'nehemiah-8-10':
          '«El gozo del Señor es vuestra fuerza.» Ese gozo se hizo nuestro en Cristo: «estas cosas os he hablado, para que mi gozo esté en vosotros, y vuestro gozo sea cumplido».',
        'psalms-30-5':
          '«Por la noche durará el lloro, y a la mañana vendrá la alegría.» Es la mañana de la resurrección: Jesús prometió que nuestra tristeza se convertiría en gozo que nadie nos quitará.',
        'psalms-94-19':
          '«Tus consolaciones alegraban mi alma.» Ese consuelo de Dios tomó cuerpo en Jesús, a quien Simeón abrazó como «la consolación de Israel».',
        'psalms-139-14':
          '«Formidables y maravillosas son tus obras.» Cada vida fue tejida por medio del Hijo, pues todo fue creado por Él y para Él.',
        'psalms-145-18':
          '«Cercano está el Señor a todos los que le invocan.» En Cristo esa cercanía es salvación: «todo aquel que invocare el nombre del Señor, será salvo».',
        'proverbs-3-6':
          '«Reconócelo en todos tus caminos, y él enderezará tus veredas.» El que endereza nuestro camino es Cristo, hecho por Dios nuestra sabiduría: confiar en Él es andar derecho.',
        'ecclesiastes-3-1':
          '«Todo tiene su tiempo.» El tiempo señalado llegó cuando, «venido el cumplimiento del tiempo, Dios envió a su Hijo»: en Cristo la historia halla su sentido.',
        'isaiah-55-8':
          '«Mis pensamientos no son vuestros pensamientos.» La sabiduría de Dios, tan alta sobre la nuestra, se reveló en Cristo, «sabiduría de Dios» para los que se salvan.',
        'habakkuk-3-19':
          '«El Señor es mi fortaleza.» Esa fuerza tiene un nombre: «todo lo puedo en Cristo que me fortalece», la fortaleza que nos sostiene en las alturas.',
        'matthew-5-16':
          '«Alumbre vuestra luz delante de los hombres.» Solo brillamos porque reflejamos a Aquel que dijo: «Yo soy la luz del mundo»; nuestra luz es Cristo en nosotros.',
        'matthew-7-7':
          '«Pedid, y se os dará.» Jesús nos enseña a pedir y nos da acceso al Padre: «pedid en mi nombre... para que vuestro gozo sea cumplido».',
        'romans-12-12':
          '«Gozosos en la esperanza.» Nuestra esperanza no es una idea, sino una Persona: «Cristo en vosotros, la esperanza de gloria».',
        '1corinthians-13-4':
          '«El amor es sufrido, es benigno.» Es el retrato de Cristo: pon su nombre donde dice «amor» y verás la cruz, donde Él puso su vida por nosotros.',
        '1corinthians-15-58':
          '«Vuestro trabajo en el Señor no es en vano.» No lo es porque Cristo resucitó: «primicias de los que durmieron», su victoria garantiza la nuestra.',
        '2corinthians-5-7':
          '«Por fe andamos, no por vista.» Caminamos con los ojos puestos en Jesús, «el autor y consumador de la fe», aunque aún no le veamos.',
        '2corinthians-9-7':
          '«Dios ama al dador alegre.» Damos con alegría porque primero recibimos: «¡Gracias a Dios por su don inefable!»: Cristo, el Regalo que lo dio todo.',
        'galatians-6-9':
          '«No nos cansemos de hacer bien.» Miramos a Jesús, que sufrió la cruz «para que vuestro ánimo no se canse hasta desmayar»: Él no se cansó de amarnos.',
        'philippians-4-6':
          '«Por nada estéis afanosos... presentad vuestras peticiones.» Y la paz que entonces guarda el corazón es «en Cristo Jesús»: la oración nos lleva a su paz.',
        'philippians-4-7':
          '«La paz de Dios, que sobrepasa todo entendimiento.» Esa paz tiene un nombre, porque «él es nuestra paz»: Cristo reconcilió lo que estaba separado.',
        'colossians-3-2':
          '«Poned la mira en las cosas de arriba.» Allí está el corazón del creyente, «donde está Cristo sentado a la diestra de Dios».',
        'colossians-3-15':
          '«La paz de Cristo gobierne en vuestros corazones.» No es una calma cualquiera: es la paz que Él compró y reparte, gobernando como Señor en su pueblo.',
        'colossians-3-23':
          '«Todo lo que hagáis, hacedlo de corazón, como para el Señor.» Porque en realidad servimos a Cristo: hasta el trabajo más sencillo se vuelve adoración a Él.',
        '2timothy-3-16':
          '«Toda la Escritura es inspirada por Dios.» Y toda ella habla de Cristo: Él mismo dijo que las Escrituras «son las que dan testimonio de mí».',
        'hebrews-11-1':
          '«Es, pues, la fe la certeza de lo que se espera.» Toda esa fe mira a uno solo: a Jesús, «el autor y consumador de la fe», en quien lo esperado se hace seguro.',
        'hebrews-11-6':
          '«Sin fe es imposible agradar a Dios.» Y nos acercamos a Dios por un solo camino: «Yo soy el camino», dijo Jesús; la fe que agrada al Padre se apoya en el Hijo.',
        'hebrews-12-1':
          '«Corramos con paciencia la carrera.» El versículo siguiente nos dice cómo: «puestos los ojos en Jesús», que ya corrió y venció antes que nosotros.',
        'hebrews-13-5':
          '«No te desampararé, ni te dejaré.» Es la voz del Señor que se hizo carne: «yo estoy con vosotros todos los días, hasta el fin del mundo».',
        'james-1-12':
          '«Recibirá la corona de vida.» Es la corona que Cristo promete: «Sé fiel hasta la muerte, y yo te daré la corona de la vida».',
        'james-1-17':
          '«Toda buena dádiva... desciende de lo alto.» La mayor dádiva del Padre es su Hijo: «de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito».',
        'james-4-8':
          '«Acercaos a Dios, y él se acercará a vosotros.» Podemos acercarnos con confianza porque Cristo abrió el camino: por su sangre entramos «con corazón sincero».',
        '1peter-4-8':
          '«El amor cubrirá multitud de pecados.» El amor que de veras cubre el pecado es el de Cristo, que «llevó él mismo nuestros pecados en su cuerpo sobre el madero».',
        '1peter-5-6':
          '«Humillaos... para que él os exalte a su debido tiempo.» Es el camino que Jesús recorrió primero: «se humilló a sí mismo... por lo cual Dios también le exaltó hasta lo sumo».',
        '1peter-5-7':
          '«Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.» El que cuida de ti es Cristo, que llama: «Venid a mí... y yo os haré descansar».',
        '1john-4-18':
          '«El perfecto amor echa fuera el temor.» Ese amor perfecto es Cristo: «en esto consiste el amor... en que él nos amó, y envió a su Hijo en propiciación por nuestros pecados».',
        '1john-5-14':
          '«Si pedimos alguna cosa conforme a su voluntad, él nos oye.» Tenemos esa confianza porque Cristo «vive siempre para interceder» por nosotros ante el Padre.',
        'joshua-24-15':
          '«Yo y mi casa serviremos a Jehová.» El Señor a quien servimos tiene rostro: «a Cristo el Señor servís», dice Pablo; elegirle a Él es servir al Salvador.',
        '1chronicles-16-11':
          '«Buscad a Jehová... buscad su rostro continuamente.» Ese rostro se nos descubrió en Cristo: Dios resplandeció en nuestros corazones «en la faz de Jesucristo».',
        '2chronicles-7-14':
          '«Si se humillare mi pueblo... yo perdonaré.» El perdón prometido fluye de la cruz: «si confesamos nuestros pecados, él es fiel y justo para perdonar».',
        'psalms-1-1':
          '«Bienaventurado el varón que no anduvo en consejo de malos.» El único Hombre perfectamente justo es Cristo; en Él, que «no conoció pecado», somos hechos justicia de Dios.',
        'psalms-32-8':
          '«Te enseñaré el camino en que debes andar.» Ese camino es una Persona: «Yo soy el camino», dijo Jesús; Él mismo nos guía al Padre.',
        'psalms-37-4':
          '«Deléitate asimismo en Jehová.» El mayor deleite es conocerle a Él: Pablo lo estimó todo como pérdida «por la excelencia del conocimiento de Cristo Jesús».',
        'psalms-42-11':
          '«¿Por qué te abates, oh alma mía? Espera en Dios.» A esa alma cansada Jesús dice: «Venid a mí... y yo os haré descansar»; nuestra esperanza es Él.',
        'psalms-56-3':
          '«En el día que temo, yo en ti confío.» La paz que vence el miedo la da Cristo: «mi paz os doy; no se turbe vuestro corazón, ni tenga miedo».',
        'psalms-62-1':
          '«En Dios solamente está acallada mi alma; de él viene mi salvación.» Esa salvación tiene nombre: «en ningún otro hay salvación», sino en Jesús, el único nombre que salva.',
        'psalms-73-26':
          '«Mi porción es Dios para siempre.» Tener a Dios por porción eterna es tener a Cristo, que dice: «Yo soy la resurrección y la vida».',
        'psalms-90-12':
          '«Enséñanos a contar nuestros días, que traigamos al corazón sabiduría.» La sabiduría que necesitamos nos «ha sido hecha» en Cristo, «sabiduría de Dios».',
        'psalms-91-1':
          '«El que habita al abrigo del Altísimo.» Nuestro escondedero seguro es Cristo: «vuestra vida está escondida con Cristo en Dios».',
        'psalms-100-4':
          '«Entrad por sus puertas con acción de gracias.» Entramos a la presencia del Padre por uno solo: «por medio de él... tenemos entrada... al Padre».',
        'psalms-121-2':
          '«Mi socorro viene de Jehová, que hizo los cielos y la tierra.» Ese Hacedor es Cristo: «en él fueron creadas todas las cosas»; el Creador mismo es nuestro auxilio.',
        'proverbs-15-1':
          '«La blanda respuesta quita la ira.» La mansedumbre tiene su modelo en Jesús: «aprended de mí, que soy manso y humilde de corazón».',
        'proverbs-17-17':
          '«En todo tiempo ama el amigo.» El Amigo que ama hasta el fin es Cristo: «nadie tiene mayor amor que este, que uno ponga su vida por sus amigos».',
        'matthew-6-34':
          '«No os afanéis por el día de mañana.» Podemos no afanarnos porque Otro nos cuida: «echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros».',
        'mark-11-24':
          '«Todo lo que pidiereis orando, creed que lo recibiréis.» Jesús nos abre el acceso al Padre: «todo lo que pidiereis al Padre en mi nombre, lo haré».',
        'mark-12-30':
          '«Amarás al Señor tu Dios con todo tu corazón.» Solo amamos así porque Él amó primero: «nosotros le amamos a él, porque él nos amó primero».',
        'philippians-4-8':
          '«Todo lo que es verdadero... en esto pensad.» La mente halla descanso al fijarse en Jesús, «puestos los ojos en Jesús, el autor y consumador de la fe».',
        '1thessalonians-5-17':
          '«Orad sin cesar.» Podemos hacerlo porque Cristo nunca cesa de orar: «vive siempre para interceder» por los que se acercan a Dios por Él.',
        '2timothy-1-7':
          '«No nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.» Es el Espíritu que Cristo da: «espíritu de adopción» que clama «¡Abba, Padre!», no de temor.',
        'james-4-7':
          '«Resistid al diablo, y huirá de vosotros.» Resistimos firmes porque Cristo ya venció: «para esto apareció el Hijo de Dios, para deshacer las obras del diablo».',
        '1peter-3-15':
          '«Santificad a Dios el Señor en vuestros corazones... dad razón de vuestra esperanza.» Esa esperanza es Él mismo en nosotros: «Cristo en vosotros, la esperanza de gloria».',
        'psalms-91-2':
          '«Mi esperanza y mi castillo; mi Dios, en quien confiaré.» Tenemos a quién huir: «nos acogimos a la esperanza puesta delante», ancla del alma firme y segura en Cristo.',
        'psalms-103-1':
          '«Bendice, alma mía, a Jehová... bendiga todo mi ser su santo nombre.» El nombre que sobre todo bendecimos es el de Jesús, «un nombre que es sobre todo nombre», ante quien toda rodilla se doblará.',
        'psalms-121-1':
          '«Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro?» El socorro tiene nombre: «el Señor es mi ayudador; no temeré», porque Cristo está con los suyos.',
        'psalms-143-8':
          '«Hazme oír por la mañana tu misericordia... el camino por donde ande.» Esa misericordia se mostró en la cruz: «siendo aún pecadores, Cristo murió por nosotros».',
        'proverbs-4-23':
          '«Guarda tu corazón, porque de él mana la vida.» La fuente de vida que el corazón necesita es Cristo: «de su interior correrán ríos de agua viva», dijo Jesús del Espíritu.',
        'proverbs-16-3':
          '«Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.» Quien afirma y termina la obra es Él: «el que comenzó en vosotros la buena obra, la perfeccionará» hasta el día de Cristo.',
        'proverbs-22-6':
          '«Instruye al niño en su camino.» El camino en que criamos a los hijos es el del Señor: «criadlos en disciplina y amonestación del Señor», para que conozcan a Cristo.',
        'proverbs-27-17':
          '«Hierro con hierro se aguza; así el hombre aguza... a su amigo.» Nos afilamos unos a otros para un fin: «crecer en todo en aquel que es la cabeza, esto es, Cristo».',
        'proverbs-31-25':
          '«Fuerza y honor son su vestidura; y se ríe de lo por venir.» Esa fuerza para mirar el futuro sin temor tiene una fuente: «todo lo puedo en Cristo que me fortalece».',
        'matthew-6-21':
          '«Donde esté vuestro tesoro, allí estará también vuestro corazón.» El tesoro que ancla el corazón está arriba: «buscad las cosas de arriba, donde está Cristo»; Él es nuestro tesoro.',
        '1corinthians-16-14':
          '«Todas vuestras cosas sean hechas con amor.» Amamos según un modelo nuevo: «que os améis unos a otros; como yo os he amado», dijo Jesús.',
        '1thessalonians-5-16':
          '«Estad siempre gozosos.» El gozo que permanece es el suyo: «para que mi gozo esté en vosotros, y vuestro gozo sea cumplido».',
        '1thessalonians-5-18':
          '«Dad gracias en todo.» El mismo verso lo enraíza en Cristo: es «la voluntad de Dios para con vosotros en Cristo Jesús»; en su nombre damos gracias.',
        '1timothy-4-12':
          '«Sé ejemplo de los creyentes.» Solo lo somos siguiendo al Ejemplo: «Cristo padeció por nosotros, dejándonos ejemplo, para que sigáis sus pisadas».',
        'hebrews-10-23':
          '«Mantengamos firme la profesión de nuestra esperanza, porque fiel es el que prometió.» Esa fidelidad tiene rostro: «todas las promesas de Dios son en él Sí, y en él Amén».',
        'james-1-2':
          '«Tened por sumo gozo cuando os halléis en diversas pruebas.» Podemos gozarnos porque la fe probada conduce a la gloria: nos alegramos «aunque ahora... seáis afligidos», con los ojos en Cristo.',
      },
    },
    collections: {
      title: 'Colecciones',
      subtitle: 'Tus listas de versículos',
      cardTitle: 'Colecciones',
      cardSubtitle: 'Agrupa tus versículos guardados',
      browseHint: 'Agrupa tus favoritos en listas con nombre',
      verses: 'versículos',
      empty: 'Aún no tienes colecciones',
      emptyHint:
        'Etiqueta un favorito con el icono de marcador para crear tu primera colección',
      openHint: 'Abrir colección',
      addTitle: 'Añadir a una colección',
      newPlaceholder: 'Nueva colección…',
      create: 'Crear',
      done: 'Listo',
      manage: 'Colecciones',
      addAction: 'Añadir a colección',
      removeFromCollection: 'Quitar de la colección',
      share: 'Compartir colección',
      shareImage: 'Compartir como imagen',
      shareHeader: 'Colección',
      listen: 'Escuchar la colección',
    },
    themes: {
      title: 'Explora por tema',
      subtitle: 'Pasajes por tema',
      cardTitle: 'Explora por tema',
      cardSubtitle: 'Encuentra pasajes por tema',
      browseHint: 'Elige un tema para ver sus pasajes',
      verses: 'versículos',
      openHint: 'Abrir pasaje',
      missingText: '(texto no disponible)',
      error: 'No se pudieron cargar los pasajes',
      listenAll: 'Escuchar este tema',
      list: {
        faith: {name: 'Fe', description: 'Confía en lo que aún no ves'},
        love: {name: 'Amor', description: 'El amor de Dios y al prójimo'},
        hope: {
          name: 'Esperanza',
          description: 'Esperanza firme en toda circunstancia',
        },
        peace: {name: 'Paz', description: 'Calma para el corazón ansioso'},
        strength: {
          name: 'Fortaleza',
          description: 'Fuerzas renovadas en la debilidad',
        },
        forgiveness: {name: 'Perdón', description: 'Perdonar y ser perdonado'},
        wisdom: {name: 'Sabiduría', description: 'Sabiduría para decidir bien'},
        prayer: {name: 'Oración', description: 'Acércate a Dios en oración'},
        courage: {name: 'Valor', description: 'Valor frente al temor'},
        comfort: {
          name: 'Consuelo',
          description: 'Consuelo en el dolor y la pérdida',
        },
        joy: {name: 'Gozo', description: 'Gozo y gratitud en el Señor'},
        grace: {name: 'Gracia', description: 'La gracia inmerecida de Dios'},
        salvation: {
          name: 'Salvación',
          description: 'El camino de la salvación',
        },
        guidance: {name: 'Guía', description: 'Dirección para tu camino'},
      },
    },

    feelings: {
      title: '¿Cómo te sientes hoy?',
      subtitle: 'Palabra para tu corazón',
      cardTitle: '¿Cómo te sientes?',
      cardSubtitle: 'Versículos para lo que sientes hoy',
      browseHint: 'Elige cómo te sientes y deja que la Palabra te responda',
      homePrompt: '¿Cómo te sientes hoy?',
      seeAll: 'Ver todos',
      verses: 'versículos',
      moodVerseTitle: 'Para tu ánimo de hoy',
      moodVerseHint: 'Toca para leerlo en su capítulo',
      openHint: 'Abrir pasaje',
      missingText: '(texto no disponible)',
      error: 'No se pudieron cargar los pasajes',
      listenAll: 'Escuchar estos versos',
      prayerTitle: 'Una oración breve',
      relatedTheme: 'Explora el tema: {{theme}}',
      list: {
        anxious: {
          name: 'Ansioso',
          description: 'Cuando la preocupación no te suelta',
          prayer:
            'Señor, pongo en tus manos lo que no puedo controlar. Dame tu paz que sobrepasa todo entendimiento. Amén.',
        },
        overwhelmed: {
          name: 'Abrumado',
          description: 'Cuando todo parece demasiado',
          prayer:
            'Dios mío, cuando mi corazón desmaye, llévame a la roca que es más alta que yo. Sé tú mi refugio. Amén.',
        },
        sad: {
          name: 'Triste',
          description: 'Cuando el corazón está quebrantado',
          prayer:
            'Padre, tú estás cerca de los quebrantados de corazón. Consuélame y sana mis heridas. Amén.',
        },
        tired: {
          name: 'Cansado',
          description: 'Cuando ya no te quedan fuerzas',
          prayer:
            'Jesús, vengo a ti trabajado y cargado. Dame tu descanso y renueva mis fuerzas. Amén.',
        },
        afraid: {
          name: 'Con miedo',
          description: 'Cuando el temor pesa más que la fe',
          prayer:
            'Señor, en el día que temo, yo en ti confío. Toma mi mano y dame tu valor. Amén.',
        },
        lonely: {
          name: 'Solo',
          description: 'Cuando nadie parece estar cerca',
          prayer:
            'Padre, gracias porque nunca me dejas ni me desamparas. Hazme sentir tu compañía hoy. Amén.',
        },
        guilty: {
          name: 'Culpable',
          description: 'Cuando el pasado te acusa',
          prayer:
            'Dios mío, confieso mi pecado y recibo tu perdón. Crea en mí un corazón limpio. Amén.',
        },
        angry: {
          name: 'Enojado',
          description: 'Cuando la ira quiere ganar',
          prayer:
            'Señor, calma mi enojo antes de que haga daño. Dame un corazón pronto para perdonar. Amén.',
        },
        confused: {
          name: 'Confundido',
          description: 'Cuando no sabes qué camino tomar',
          prayer:
            'Padre, no me apoyo en mi propia prudencia. Endereza tú mis pasos y guíame. Amén.',
        },
        hopeful: {
          name: 'Esperanzado',
          description: 'Cuando esperas lo que Dios hará',
          prayer:
            'Dios de esperanza, lléname de todo gozo y paz en el creer. Tus misericordias son nuevas cada mañana. Amén.',
        },
        grateful: {
          name: 'Agradecido',
          description: 'Cuando quieres dar gracias',
          prayer:
            'Padre, toda buena dádiva viene de ti. Gracias por tu fidelidad de hoy y de siempre. Amén.',
        },
        joyful: {
          name: 'Alegre',
          description: 'Cuando el gozo desborda',
          prayer:
            'Señor, este es el día que tú hiciste. Me gozaré y me alegraré en él. Amén.',
        },
      },
    },

    lectio: {
      title: 'Momento con Dios',
      subtitle: 'Lectura orante de la Palabra',
      cardTitle: 'Momento con Dios',
      cardSubtitle: 'Lee, medita, ora y contempla un pasaje',
      stepLabels: {
        lectio: 'Lee',
        meditatio: 'Medita',
        oratio: 'Ora',
        contemplatio: 'Contempla',
      },
      stepIntros: {
        lectio: 'Lee el pasaje despacio. Deja que las palabras respiren.',
        meditatio: 'Léelo otra vez. Quédate donde el corazón se detenga.',
        oratio: 'Respóndele a Dios con tus propias palabras.',
        contemplatio: 'Guarda silencio. Quédate en su presencia.',
      },
      meditationPrompts: [
        '¿Qué palabra o frase te detiene? ¿Por qué?',
        '¿Qué revela este verso del corazón de Dios?',
        'Si Dios te dijera esto hoy al oído, ¿qué cambiaría?',
        '¿Qué te invita este verso a soltar… o a abrazar?',
        '¿Dónde necesitas esta verdad esta semana?',
        'Repite lentamente la frase que más te toque, dos veces.',
      ],
      listen: 'Escuchar',
      prayerPlaceholder: 'Escribe aquí tu oración…',
      prayerHint: 'Al terminar, tu oración se guardará en tus notas.',
      timerStart: 'Comenzar el silencio',
      timerPause: 'Pausar',
      timerDone: 'El silencio terminó. Permanece un momento más si quieres.',
      minutesOption: '{{n}} min',
      next: 'Siguiente',
      back: 'Anterior',
      finish: 'Terminar',
      finishedTitle: 'Sesión completa',
      finishedMessage: 'Que su Palabra permanezca en ti el resto del día.',
      shareImage: 'Compartir como imagen',
      memorize: 'Memorizar este versículo',
      memorized: 'Añadido a tu mazo de memorización',
      memorizedAlready: 'Ya está en tu mazo de memorización',
      done: 'Listo',
      prayerSaved: 'Tu oración se guardó en tus notas',
      error: 'No se pudo cargar el pasaje',
      exitA11y: 'Salir de Momento con Dios',
    },

    guided: {
      title: 'Devoción guiada',
      subtitle: 'Un momento con Dios, paso a paso',
      cardTitle: 'Devoción guiada',
      cardSubtitle: 'Empieza por cómo está tu corazón hoy',
      breathePrompt: 'Respira hondo. ¿Cómo está tu corazón hoy?',
      revealLabel: 'Para cuando te sientes así · {{feeling}}',
      begin: 'Comenzar Momento con Dios',
      another: 'Elegir otro ánimo',
      error: 'No se pudo preparar tu devoción',
      exitA11y: 'Cerrar devoción guiada',
    },

    devotion: {
      streakTitle: 'Tu momento con Dios',
      streakDays: '{{n}} días con Dios',
      streakOneDay: '1 día con Dios',
      streakBest: 'Tu mejor racha: {{n}}',
      streakTodayDone: 'Hoy ya tuviste tu momento',
      streakTodayPending: 'Tu momento de hoy te espera',
      streakLapsed: 'Retoma tu constancia',
      streakHint: 'Abre la devoción guiada',
    },

    prophecies: {
      title: 'Hilo profético',
      subtitle: 'Cristo en las profecías',
      intro:
        'Toda la Escritura habla de Él (Lucas 24:27). Recorre, paso a paso, las profecías que anunciaron al Mesías y los pasajes donde se cumplen en el Señor Jesús.',
      begin: 'Comenzar',
      prev: 'Anterior',
      next: 'Siguiente',
      finish: 'Amén',
      done: 'Terminar',
      stepOf: 'Profecía {{n}} de {{total}}',
      progress: '{{n}} de {{total}} recorridas',
      viewIndex: 'Ver índice',
      indexTitle: 'Índice del hilo',
      viewMap: 'Ver el mapa',
      mapTitle: 'Mapa del hilo',
      mapSubtitle: 'Toda la Escritura converge en Él',
      mapHint:
        'Toca un hilo (en cualquiera de sus dos extremos) para resaltarlo y ver de qué trata.',
      shareMap: 'Compartir el mapa',
      openInWalk: 'Abrir en el recorrido',
      otTestament: 'Antiguo Testamento',
      ntTestament: 'Nuevo Testamento',
      prophecyLabel: 'Profecía',
      shadowLabel: 'Sombra',
      fulfilledIn: 'Cumplido en',
      openInReader: 'Abrir en el lector',
      share: 'Compartir',
      constellation: 'Constelación',
      study: 'Estudiar',
      memorize: 'Memorizar',
      memorized: 'En tu mazo',
      todayLabel: 'Hoy',
      todayTitle: 'Profecía de hoy',
      favorite: 'Guardar como favorita',
      unfavorite: 'Quitar de favoritas',
      filterAll: 'Todas',
      filterFavorites: 'Favoritas',
      filterQuoted: 'Citadas',
      noFavorites:
        'Aún no tienes profecías favoritas. Toca la estrella en un paso para guardarla.',
      listen: 'Escuchar',
      stopListening: 'Detener',
      walkthroughStart: 'Recorrido narrado',
      walkthroughStop: 'Detener recorrido',
      togetherCta: 'Leer el hilo en grupo',
      completedBadge: 'Hilo completado',
      shareSignature: 'Eternal Bible · Hilo profético',
      quotedBadge: 'Citado en el NT',
      sourcesTitle: 'Fuentes y método',
      sourcesHint: 'Cómo se eligieron estas profecías',
      sourcesBody:
        'Este hilo reúne profecías mesiánicas del Antiguo Testamento y su cumplimiento en Cristo. El criterio es conservador: se incluyen solo profecías que el Nuevo Testamento mismo cita como cumplidas, o de aceptación cristiana histórica amplia — nunca especulación. La fuente principal es la Escritura: cada «Cumplido en» es la palabra del propio Nuevo Testamento, y el sello «Citado en el NT» marca las que el NT cita de forma explícita. Las referencias cruzadas se apoyan además en openbible.info (CC BY). Donde una profecía abarca varios versículos, se enlaza uno representativo; abre el pasaje para leer su contexto.',
      missingText: 'Versículo no disponible',
      finishedTitle: 'Cristo, el centro de todo',
      finishedBody:
        'Has recorrido el hilo que une toda la Escritura en Él. «Escudriñad las Escrituras… ellas son las que dan testimonio de mí» (Juan 5:39).',
      whyTitle: '¿Por qué importa?',
      whyBody:
        'Que la Escritura anunciara estas cosas siglos antes y se cumplieran en Jesús no es casualidad: muestra que Dios gobierna la historia y cumple su palabra. El Señor mismo «les declaró en todas las Escrituras lo que de él decían» (Lucas 24:27, 44) y nos invita a escudriñarlas, «porque ellas son las que dan testimonio de mí» (Juan 5:39). No se trata de calcular probabilidades, sino de adorar con humildad al Dios fiel que cumple sus promesas en Cristo.',
      christHereTitle: 'Cristo en este pasaje',
      quizPlay: 'Jugar el quiz',
      quizTitle: 'Profecía y cumplimiento',
      quizSubtitle: 'Empareja cada profecía con su cumplimiento en Cristo',
      quizHint: 'Toca una profecía y luego su cumplimiento para emparejarlas.',
      quizScore: 'Aciertos',
      quizMistakes: 'Errores',
      quizRoundOf: 'Ronda {{n}}',
      quizComplete: '¡Ronda completa!',
      quizCompletePerfect: '¡Ronda perfecta! 🎉',
      quizNextRound: 'Nueva ronda',
      groups: {
        coming: 'Su venida',
        ministry: 'Su ministerio',
        passion: 'Su pasión',
        resurrection: 'Su resurrección y gloria',
        shadows: 'Sombras de Cristo',
      },
      items: {
        'gen-3-15': {
          label: 'La simiente de la mujer',
          note: 'Desde la caída, Dios promete que la simiente de la mujer herirá la cabeza de la serpiente; Cristo, nacido de mujer, vino a deshacer las obras del diablo.',
        },
        'gen-22-18': {
          label: 'Bendición a las naciones',
          note: 'En la simiente de Abraham serían benditas todas las naciones; esa simiente, dice Pablo, es Cristo.',
        },
        'gen-49-10': {
          label: 'De la tribu de Judá',
          note: 'El cetro no se apartaría de Judá hasta venir Siloh; el Señor Jesús nació de la tribu de Judá.',
        },
        'num-24-17': {
          label: 'Estrella de Jacob',
          note: 'Balaam vio de lejos una estrella que saldría de Jacob; los magos siguieron su estrella hasta el Rey nacido.',
        },
        '2sam-7-12': {
          label: 'Heredero del trono de David',
          note: 'Dios prometió a David un descendiente cuyo reino sería eterno; el ángel anunció que Jesús reinaría para siempre.',
        },
        'isa-7-14': {
          label: 'Nacido de una virgen',
          note: 'La virgen concebiría y daría a luz un hijo, Emanuel, «Dios con nosotros»: cumplido en el nacimiento de Jesús.',
        },
        'mic-5-2': {
          label: 'Nacido en Belén',
          note: 'De Belén, pequeña entre las aldeas, saldría el Señor cuyos orígenes son desde la eternidad.',
        },
        'isa-9-6': {
          label: 'Dios fuerte, Príncipe de paz',
          note: 'Un niño nos es nacido cuyo nombre es Admirable, Dios fuerte, Príncipe de paz: el Salvador, Cristo el Señor.',
        },
        'hos-11-1': {
          label: 'Llamado de Egipto',
          note: 'Como Israel fue llamado de Egipto, así fue llamado el Hijo de Dios, guardado allí en su niñez.',
        },
        'jer-31-15': {
          label: 'Llanto en Ramá',
          note: 'El llanto de Raquel por sus hijos resonó cuando Herodes mandó matar a los niños de Belén.',
        },
        'mal-3-1': {
          label: 'El mensajero del camino',
          note: 'Dios enviaría un mensajero a preparar el camino delante de Él: Juan el Bautista, voz que precedió al Señor.',
        },
        'isa-40-3': {
          label: 'Voz en el desierto',
          note: 'Una voz clamaría en el desierto: «Preparad el camino del Señor»; así predicó Juan en el desierto.',
        },
        'mal-4-5': {
          label: 'El Elías que había de venir',
          note: '«He aquí, yo os envío el profeta Elías, antes que venga el día de Jehová», promete Malaquías; Jesús mismo declaró que esa promesa se cumplió en Juan el Bautista.',
        },
        'deut-18-15': {
          label: 'Profeta como Moisés',
          note: 'Dios levantaría un profeta como Moisés, a quien oiríamos; Pedro lo proclama cumplido en Jesús.',
        },
        'isa-61-1': {
          label: 'Ungido con el Espíritu',
          note: 'El Espíritu del Señor sobre el Ungido para dar buenas nuevas a los pobres: Jesús lo leyó y dijo «hoy se ha cumplido».',
        },
        'isa-9-2': {
          label: 'Luz en Galilea',
          note: 'El pueblo que andaba en tinieblas vería gran luz; Jesús comenzó a predicar en Galilea de los gentiles.',
        },
        'isa-35-5': {
          label: 'Sana ciegos y cojos',
          note: 'Los ojos de los ciegos se abrirían y los cojos saltarían; así respondió Jesús: los ciegos ven, los cojos andan.',
        },
        'ps-78-2': {
          label: 'Habla en parábolas',
          note: 'El Mesías abriría su boca en parábolas, declarando cosas escondidas desde la fundación del mundo.',
        },
        'zech-9-9': {
          label: 'Entra montado en pollino',
          note: 'El Rey vendría humilde, montado en un pollino; así entró Jesús a Jerusalén entre aclamaciones.',
        },
        'ps-118-22': {
          label: 'La piedra rechazada',
          note: 'La piedra que desecharon los edificadores vino a ser cabeza del ángulo: Cristo, rechazado y exaltado.',
        },
        'ps-41-9': {
          label: 'Traicionado por un amigo',
          note: 'Aquel que comía pan con Él levantó contra Él su calcañar; Judas, uno de los doce, lo entregó.',
        },
        'zech-11-12': {
          label: 'Vendido por treinta piezas',
          note: 'Pesaron por su precio treinta piezas de plata, lo que Judas recibió por entregar al Señor.',
        },
        'zech-13-7': {
          label: 'Herido el pastor',
          note: 'Herido el pastor, se dispersarían las ovejas; los discípulos huyeron cuando prendieron a Jesús.',
        },
        'isa-53-7': {
          label: 'Callado ante sus acusadores',
          note: 'Como cordero llevado al matadero, enmudeció y no abrió su boca ante quienes lo acusaban.',
        },
        'isa-50-6': {
          label: 'Golpeado y escupido',
          note: 'Dio su rostro a los que lo herían y escupían; así trataron a Jesús en su juicio.',
        },
        'isa-53-5': {
          label: 'Herido por nuestras rebeliones',
          note: 'Fue herido por nuestras rebeliones, molido por nuestros pecados; por sus llagas fuimos sanados.',
        },
        'ps-22-16': {
          label: 'Manos y pies horadados',
          note: 'Horadaron sus manos y sus pies, mucho antes de que existiera la crucifixión: cumplido en la cruz.',
        },
        'ps-22-18': {
          label: 'Reparten sus vestidos',
          note: 'Repartieron entre sí sus vestidos y sobre su ropa echaron suertes, junto a la cruz.',
        },
        'ps-69-21': {
          label: 'Hiel y vinagre',
          note: 'En su sed le dieron a beber vinagre, tal como fue escrito de antemano.',
        },
        'ps-22-1': {
          label: '¿Por qué me desamparaste?',
          note: 'El clamor «Dios mío, ¿por qué me has desamparado?» fue la voz del Salmo 22 desde la cruz.',
        },
        'ps-34-20': {
          label: 'Ningún hueso quebrado',
          note: 'Él guarda todos sus huesos, ni uno será quebrado; no quebraron las piernas de Jesús en la cruz.',
        },
        'zech-12-10': {
          label: 'Mirarán al que traspasaron',
          note: 'Mirarán al que traspasaron y harán duelo; el soldado abrió su costado con la lanza.',
        },
        'isa-53-9': {
          label: 'Sepultado con los ricos',
          note: 'Se dispuso su sepultura con los ricos; José de Arimatea, hombre rico, lo puso en su propio sepulcro.',
        },
        'isa-53-12': {
          label: 'Contado con transgresores',
          note: 'Fue contado con los transgresores, crucificado entre dos malhechores, e intercedió por ellos.',
        },
        'ps-16-10': {
          label: 'No vería corrupción',
          note: 'No dejarías su alma en el Seol ni permitirías que tu Santo viera corrupción: Cristo resucitó al tercer día.',
        },
        'ps-2-7': {
          label: 'Tú eres mi Hijo',
          note: '«Mi Hijo eres tú, yo te engendré hoy»: Pablo lo aplica a la resurrección de Jesús.',
        },
        'ps-110-1': {
          label: 'Sentado a la diestra',
          note: 'El Señor dijo a su Señor: «Siéntate a mi diestra»; Cristo ascendió y se sentó a la diestra de Dios.',
        },
        'ps-68-18': {
          label: 'Subió a lo alto',
          note: 'Subiste a lo alto, llevaste cautiva la cautividad; Cristo ascendió y dio dones a los hombres.',
        },
        'dan-7-13': {
          label: 'El Hijo del Hombre',
          note: 'Vino uno como un Hijo de Hombre y le fue dado dominio eterno; Jesús se llamó así ante el sumo sacerdote.',
        },
        'isa-11-1': {
          label: 'El Renuevo de Isaí',
          note: 'Una vara saldría del tronco de Isaí, un Renuevo que llevará fruto; Pablo cita esta raíz de Isaí: Cristo, en quien esperan los gentiles.',
        },
        'jer-23-5': {
          label: 'El Renuevo justo de David',
          note: '«Levantaré a David renuevo justo, y reinará como Rey», promete Jeremías; el Señor Jesús se declara a sí mismo «la raíz y el linaje de David, la estrella resplandeciente de la mañana».',
        },
        'isa-42-1': {
          label: 'Mi siervo escogido',
          note: 'He aquí mi siervo, mi escogido en quien mi alma tiene contentamiento; Mateo lo aplica al Señor Jesús, manso y humilde.',
        },
        'isa-53-4': {
          label: 'Llevó nuestras dolencias',
          note: 'Él llevó nuestras enfermedades y sufrió nuestros dolores; así describe Mateo sus sanidades, anticipo de la cruz.',
        },
        'isa-53-3': {
          label: 'Despreciado y desechado',
          note: 'Despreciado y desechado entre los hombres; vino a lo suyo, y los suyos no le recibieron.',
        },
        'ps-69-4': {
          label: 'Aborrecido sin causa',
          note: '«Se han aumentado... los que me aborrecen sin causa», clama el salmista; Jesús mismo cita estas palabras la noche antes de morir: «Sin causa me aborrecieron».',
        },
        'deut-21-23': {
          label: 'Hecho maldición por nosotros',
          note: 'Maldito todo el que es colgado en un madero; Cristo nos redimió de la maldición, hecho por nosotros maldición.',
        },
        'ps-118-26': {
          label: 'Bendito el que viene',
          note: 'Bendito el que viene en el nombre del Señor; así lo aclamaron al entrar en Jerusalén: «¡Hosanna!».',
        },
        'ps-8-2': {
          label: 'La alabanza de los niños',
          note: 'De la boca de los niños afirmaste la alabanza; Jesús lo recordó cuando los pequeños lo aclamaban en el templo.',
        },
        'ps-16-11': {
          label: 'La senda de la vida',
          note: 'Me mostrarás la senda de la vida; Pedro lo proclama cumplido en la resurrección del Señor.',
        },
        'isa-55-3': {
          label: 'El pacto eterno, las misericordias de David',
          note: '«Haré con vosotros pacto eterno, las misericordias firmes a David», promete Isaías; Pablo lo cita en Antioquía como prueba de que Cristo resucitó para no volver más a corrupción.',
        },
        'ps-132-11': {
          label: 'El juramento a David',
          note: '«Juró Jehová a David... de tu descendencia pondré sobre tu trono»; Pedro recuerda ese juramento en Pentecostés al proclamar que Dios resucitó a Cristo para sentarlo en su trono.',
        },
        'ps-45-6': {
          label: 'Tu trono es eterno, oh Dios',
          note: 'Tu trono, oh Dios, es eterno y para siempre; Hebreos lo dice del Hijo, Dios y Rey por los siglos.',
        },
        'ps-110-4': {
          label: 'Sacerdote para siempre',
          note: 'Tú eres sacerdote para siempre según el orden de Melquisedec; Cristo es nuestro gran Sumo Sacerdote.',
        },
        'paschal-lamb': {
          label: 'El cordero de la Pascua',
          note: 'La sangre del cordero libraba de la muerte; «nuestra Pascua, que es Cristo, ya fue sacrificada por nosotros».',
        },
        'covenant-blood': {
          label: 'La sangre del pacto',
          note: 'Moisés roció al pueblo con la sangre del pacto en el Sinaí; en la Última Cena, Jesús toma la copa y dice: «esto es mi sangre del nuevo pacto, que por muchos es derramada».',
        },
        'bronze-serpent': {
          label: 'La serpiente de bronce',
          note: 'Quien miraba la serpiente levantada vivía; así el Hijo del Hombre fue levantado, para que todo aquel que en Él cree tenga vida eterna.',
        },
        isaac: {
          label: 'El cordero que Dios proveyó',
          note: 'Abraham dijo: «Dios proveerá el cordero»; Juan señaló a Jesús: «He aquí el Cordero de Dios que quita el pecado del mundo».',
        },
        manna: {
          label: 'El maná del cielo',
          note: 'Dios dio pan del cielo en el desierto; Jesús dijo: «Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre».',
        },
        rock: {
          label: 'La roca que dio agua',
          note: 'De la roca herida brotó agua para el pueblo; «y la roca era Cristo», de quien brota agua viva.',
        },
        tabernacle: {
          label: 'El tabernáculo',
          note: 'Dios habitó en medio de su pueblo en el tabernáculo; «el Verbo se hizo carne y habitó entre nosotros».',
        },
        atonement: {
          label: 'El día de la expiación',
          note: 'El sumo sacerdote entraba con sangre una vez al año; Cristo entró una vez para siempre por su propia sangre, hallando eterna redención.',
        },
        melchizedek: {
          label: 'Melquisedec, sacerdote-rey',
          note: 'Melquisedec, rey y sacerdote sin genealogía, prefigura a Cristo, sacerdote para siempre según su orden.',
        },
        firstfruits: {
          label: 'Las primicias',
          note: 'Se ofrecían las primicias de la cosecha; «Cristo ha resucitado, primicias de los que durmieron».',
        },
        jonah: {
          label: 'Jonás, tres días',
          note: 'Como Jonás estuvo tres días en el vientre del gran pez, así el Hijo del Hombre estuvo tres días en el corazón de la tierra.',
        },
        'isa-28-16': {
          label: 'La piedra angular preciosa',
          note: 'Dios pone en Sion una piedra probada, angular y preciosa; Pedro y Pablo la reconocen en Cristo, fundamento seguro: «el que creyere, no será avergonzado».',
        },
        'ps-69-9': {
          label: 'El celo por la casa de Dios',
          note: '«Me consumió el celo de tu casa», dice el salmo; sus discípulos lo recordaron cuando Jesús purificó el templo.',
        },
        'isa-49-6': {
          label: 'Luz para las naciones',
          note: 'El Siervo del Señor sería luz de las naciones y salvación hasta lo último de la tierra; en Cristo la salvación alcanza a los gentiles.',
        },
        'isa-53-1': {
          label: 'El anuncio no creído',
          note: '«¿Quién ha creído a nuestro anuncio?» Juan ve en la incredulidad ante Jesús el cumplimiento de la palabra de Isaías.',
        },
        'joel-2-32': {
          label: 'Invocar el nombre del Señor',
          note: '«Todo aquel que invocare el nombre de Jehová será salvo», dice Joel; Pablo lo aplica a Cristo, Señor de todos, generoso con cuantos le invocan.',
        },
        'amos-9-11': {
          label: 'El tabernáculo de David levantado',
          note: 'Dios prometió levantar el caído tabernáculo de David; Santiago ve la promesa cumplida en Cristo resucitado y en los gentiles que buscan al Señor.',
        },
        'ps-102-25': {
          label: 'El Creador eterno',
          note: '«Tú fundaste la tierra, y los cielos son obra de tus manos»; Hebreos dirige estas palabras al Hijo, el mismo ayer, hoy y por los siglos.',
        },
        'ps-8-6': {
          label: 'Todo bajo sus pies',
          note: 'Dios sujetó todas las cosas bajo los pies del hombre; Hebreos lo ve cumplido en Jesús, coronado de gloria, a quien todo le será sometido.',
        },
        'isa-25-8': {
          label: 'La muerte devorada para siempre',
          note: '«Destruirá a la muerte para siempre», anuncia Isaías; Pablo cita la promesa cumplida cuando lo mortal se vista de inmortalidad: «Sorbida es la muerte en victoria».',
        },
        'hos-13-14': {
          label: 'Rescatados del poder del Seol',
          note: '«Oh muerte, yo seré tu muerte», promete Oseas; junto a Isaías 25:8, Pablo retoma el mismo clamor de victoria: «¿Dónde está, oh muerte, tu aguijón?».',
        },
        'isa-65-17': {
          label: 'Cielos nuevos y tierra nueva',
          note: '«He aquí que yo creo nuevos cielos y nueva tierra», anuncia Isaías; Juan ve esa promesa cumplida —un cielo nuevo y una tierra nueva— en la visión final donde el Cordero es la luz de la ciudad de Dios.',
        },
        adam: {
          label: 'El postrer Adán',
          note: 'El primer Adán fue hecho alma viviente; «el postrer Adán, espíritu vivificante». Lo que se perdió en uno, en Cristo recibe vida.',
        },
        veil: {
          label: 'El velo del templo',
          note: 'El velo cerraba el paso al Lugar Santísimo; por su carne, Cristo abrió «un camino nuevo y vivo» hasta la presencia de Dios.',
        },
        scapegoat: {
          label: 'El macho cabrío que carga las culpas',
          note: 'El macho cabrío llevaba sobre sí todas las iniquidades a tierra inhabitada; así Cristo fue ofrecido «para llevar los pecados de muchos».',
        },
        'joshua-rest': {
          label: 'El reposo verdadero',
          note: 'Josué dio reposo en la tierra, mas no el definitivo; queda un reposo para el pueblo de Dios, en el que se entra por la fe en Jesús.',
        },
      },
    },

    bibleFacts: {
      title: '¿Sabías qué?',
      subtitle: 'Datos curiosos con respaldo bíblico',
      browseHint:
        'Geografía, números, idioma original, historia y referencias cruzadas — siempre anclados a un versículo.',
      todayLabel: 'Hoy',
      todayTitle: 'Dato del día',
      indexTitle: 'Todos los datos',
      filterAll: 'Todas',
      filterFavorites: 'Favoritas',
      favorite: 'Guardar como favorito',
      unfavorite: 'Quitar de favoritos',
      noFavorites:
        'Aún no tienes datos favoritos. Toca la estrella en una tarjeta para guardarla.',
      openInReader: 'Abrir en el lector',
      missingText: 'Versículo no disponible',
      sourcesTitle: 'Fuentes y método',
      sourcesHint: 'Cómo se eligieron estos datos',
      sourcesBody:
        'Estos datos reúnen geografía, medidas, matices del idioma original, costumbres históricas y conexiones entre pasajes. El criterio es conservador: cada dato está anclado a un versículo concreto de la Escritura — nunca especulación. Las medidas y costumbres se apoyan en el consenso de la erudición bíblica ampliamente documentada; los matices de idioma original citan la palabra hebrea o griega tal como aparece en el texto.',
      categories: {
        geography: 'Geografía',
        numbers: 'Números',
        language: 'Idioma original',
        history: 'Historia y cultura',
        crossref: 'Referencias cruzadas',
      },
      items: {
        'dead-sea': {
          label: 'El punto más bajo de la tierra',
          detail:
            'El Mar Muerto, llamado en la Biblia "Mar Salado", está a unos 430 metros bajo el nivel del mar: el punto más bajo de toda la superficie terrestre.',
        },
        'mount-hermon': {
          label: 'El pico más alto de la Biblia',
          detail:
            'El monte Hermón, en la frontera norte de Israel, se eleva a 2814 metros y tiene nieve casi todo el año; los amorreos lo llamaban Senir.',
        },
        'dan-to-beersheba': {
          label: '"De Dan a Beerseba"',
          detail:
            'Esta frase recorre la Biblia (unas 12 veces) para decir "de un extremo al otro del país" — y en línea recta son apenas unos 240 km: lo pequeña que era realmente la Tierra Prometida.',
        },
        'eleven-days': {
          label: 'Once días… que se hicieron cuarenta años',
          detail:
            'De Horeb a Cades-barnea, en la frontera de Canaán, hay solo once días de camino a pie; a Israel, por su rebeldía, el mismo trayecto le tomó cuarenta años.',
        },
        'sanctuary-shekel': {
          label: 'El siclo del santuario',
          detail:
            'El peso oficial del tabernáculo equivalía al doble de un siclo común, y la propia ley lo define con precisión: veinte geras.',
        },
        'the-cubit': {
          label: 'El codo, una medida del cuerpo',
          detail:
            'El codo (unos 45 cm, de codo a punta de dedos) fue la unidad que midió el arca de Noé, y más tarde el templo.',
        },
        'forty-days': {
          label: 'Cuarenta días, cuarenta años',
          detail:
            'El número cuarenta marca una y otra vez los tiempos de prueba en la Biblia: el diluvio, Moisés en el monte, Israel en el desierto, y el ayuno de Jesús.',
        },
        'thirty-pieces': {
          label: 'El precio de un esclavo',
          detail:
            'La ley fijaba en treinta piezas de plata el precio de un esclavo herido por un buey; fue exactamente lo que pagaron por traicionar a Jesús.',
        },
        hesed: {
          label: 'Hesed: un amor sin traducción exacta',
          detail:
            '⁦חֶסֶד⁩ (hesed) es la palabra hebrea de la misericordia fiel de Dios a su pacto; no tiene equivalente exacto en español, y se repite 26 veces seguidas en un solo salmo.',
        },
        selah: {
          label: 'Selah: una pausa que sigue siendo un misterio',
          detail:
            '⁦סֶלָה⁩ (Selah) aparece 71 veces en los Salmos como una instrucción musical o litúrgica; su significado exacto — ¿una pausa?, ¿elevar la voz? — sigue debatido por los eruditos.',
        },
        logos: {
          label: 'Logos: la Palabra que ordena el universo',
          detail:
            'λόγος (logos) era, en la filosofía griega, la razón que da orden al universo; Juan toma esa misma palabra y la aplica directamente a Cristo.',
        },
        amen: {
          label: 'Amén: la palabra que no se tradujo',
          detail:
            '⁦אָמֵן⁩ (amén), "en verdad" o "que así sea", pasó del hebreo a prácticamente todos los idiomas del mundo sin traducirse, a través de la Biblia.',
        },
        'tearing-garments': {
          label: 'Rasgar las vestiduras',
          detail:
            'En el Cercano Oriente antiguo, rasgarse la ropa era una señal pública de duelo o de indignación religiosa extrema; así reaccionó el sumo sacerdote al oír a Jesús.',
        },
        'washing-feet': {
          label: 'Lavar los pies, tarea del último siervo',
          detail:
            'Con sandalias abiertas y caminos de tierra, lavar los pies de un invitado era tarea del sirviente de más baja categoría en una casa — de ahí lo chocante del gesto de Jesús con sus discípulos.',
        },
        'unleavened-bread': {
          label: 'Pan sin tiempo para leudar',
          detail:
            'El pan de la Pascua se horneaba sin levadura porque no hubo tiempo de esperar que la masa fermentara antes de huir de Egipto a toda prisa.',
        },
        'seven-day-wedding': {
          label: 'Una boda de siete días',
          detail:
            'En Israel una boda no era una ceremonia de una tarde, sino una fiesta comunitaria que podía durar una semana entera, como la de Sansón.',
        },
        'tree-of-life': {
          label: 'Un jardín perdido, un jardín recuperado',
          detail:
            'La Biblia abre con un árbol de vida al que el ser humano pierde acceso, y cierra con ese mismo árbol, ahora accesible para siempre en la nueva creación.',
        },
        'joshua-jesus-name': {
          label: 'Josué y Jesús: el mismo nombre',
          detail:
            '"Josué" y "Jesús" son la misma palabra hebrea, Yehoshúa ("el Señor salva"), en dos formas distintas: uno llevó al pueblo a la Tierra Prometida; el otro lleva a su pueblo a la vida eterna.',
        },
        'ruth-genealogy': {
          label: 'De extranjera excluida a bisabuela de un rey',
          detail:
            'La ley excluía a los moabitas de la asamblea de Israel, pero Rut la moabita terminó siendo bisabuela del rey David — y aparece en la genealogía de Jesús.',
        },
        'jacob-israel': {
          label: 'Una noche de lucha, un nombre nuevo',
          detail:
            'Jacob luchó toda una noche junto al río Jaboc y recibió de Dios un nombre nuevo, "Israel", que terminaría siendo el de todo un pueblo.',
        },
      },
    },

    journeys: {
      title: 'Rutas bíblicas',
      subtitle: 'Las grandes rutas de la Escritura',
      intro:
        'La Biblia no solo se lee: sucedió en lugares reales. Recorre estas tres grandes rutas y toca cada parada para leer el pasaje.',
      stopsCount: '{{n}} paradas',
      progress: '{{n}} de {{total}} recorridas',
      openInReader: 'Abrir en el lector',
      missingText: 'Versículo no disponible',
      walkthroughStart: 'Recorrido narrado',
      walkthroughStop: 'Detener recorrido',
      favorite: 'Guardar como favorita',
      unfavorite: 'Quitar de favoritas',
      shareMap: 'Compartir el mapa',
      partOfThread: 'Parte del hilo profético',
      showVerse: 'Ver versículo',
      hideVerse: 'Ocultar versículo',
      routes: {
        abraham: {
          title: 'Abraham',
          subtitle: 'El padre de la fe',
          description:
            'Sigue el camino de Abraham desde su llamado en Ur hasta Beerseba, la fe que peregrina hacia una promesa que aún no veía cumplida.',
        },
        exodus: {
          title: 'El Éxodo',
          subtitle: 'De Egipto a la Tierra Prometida',
          description:
            'Sigue el camino de Israel desde la esclavitud en Egipto hasta el umbral de Canaán, apoyado en el propio itinerario que registra el libro de Números.',
        },
        exile: {
          title: 'El exilio en Babilonia',
          subtitle: 'Juicio, fidelidad y regreso',
          description:
            'Recorre la caída de Jerusalén, los años de cautiverio en Babilonia y el regreso del pueblo a su tierra.',
        },
        paul: {
          title: 'Los viajes de Pablo',
          subtitle: 'El evangelio hasta los confines del Imperio',
          description:
            'Recorre las ciudades donde Pablo predicó, plantó iglesias y fue perseguido, desde Antioquía hasta Roma.',
        },
        jesus: {
          title: 'El ministerio de Jesús',
          subtitle: 'Su vida, muerte y resurrección',
          description:
            'Camina los lugares del ministerio del Señor, desde su nacimiento en Belén hasta la tumba vacía.',
        },
      },
      items: {
        'abraham-ur': {
          label: 'El llamado de Abram',
          note: 'Dios llamó a Abram a dejar su tierra y su familia, prometiéndole una tierra, una gran nación y bendición para todos los pueblos.',
        },
        'abraham-shechem': {
          label: 'Siquem, en Canaán',
          note: 'Al llegar a la tierra prometida, Abram edificó un altar al Señor que se le había aparecido.',
        },
        'abraham-egypt': {
          label: 'Egipto',
          note: 'El hambre lo llevó a Egipto; incluso en un tropiezo de fe, Dios protegió su promesa.',
        },
        'abraham-hebron': {
          label: 'Hebrón: el pacto y la promesa',
          note: 'Abram creyó la promesa de un heredero, y Dios se la contó por justicia — el fundamento de la fe que Pablo explicaría siglos después.',
        },
        'abraham-moriah': {
          label: 'El monte Moriah',
          note: 'Dispuesto a ofrecer a su hijo Isaac, Abraham vio la provisión de Dios y llamó a aquel lugar «Jehová proveerá».',
        },
        'abraham-beersheba': {
          label: 'Beerseba: el final del camino',
          note: 'Abraham murió en buena vejez, habiendo visto solo el comienzo de una promesa que se cumpliría en sus descendientes — y, en definitiva, en Cristo.',
        },
        'exodus-rameses': {
          label: 'Ramesés, Egipto',
          note: 'Punto de partida del Éxodo: los hijos de Israel salieron de Ramesés hacia Sucot, dejando la esclavitud.',
        },
        'exodus-red-sea': {
          label: 'El Mar Rojo',
          note: 'Dios abrió camino en medio del mar; Israel lo cruzó en seco mientras el ejército de Faraón quedaba atrás.',
        },
        'exodus-sinai': {
          label: 'El Sinaí',
          note: 'En el monte Sinaí, Dios entregó la Ley a Moisés y selló su pacto con Israel.',
        },
        'exodus-kadesh': {
          label: 'Cades-barnea',
          note: 'Tras el informe de los doce espías, la incredulidad del pueblo lo condenó a errar cuarenta años por el desierto.',
        },
        'exodus-moab': {
          label: 'Llanos de Moab',
          note: 'Desde el monte Nebo, Moisés vio la tierra prometida antes de morir sin entrar en ella.',
        },
        'exodus-jordan': {
          label: 'El Jordán',
          note: 'Bajo el mando de Josué, el pueblo cruzó el Jordán en seco y entró por fin a Canaán.',
          echoNote:
            'Siglos después, en este mismo río, Jesús —cuyo nombre es la misma palabra hebrea que «Josué», el Señor salva— comenzó su propio camino hacia la salvación definitiva.',
        },
        'exile-jerusalem-fall': {
          label: 'La caída de Jerusalén',
          note: 'El ejército babilónico destruyó el templo de Salomón y llevó al pueblo cautivo — el juicio que los profetas habían anunciado.',
        },
        'exile-babylon-rivers': {
          label: 'Junto a los ríos de Babilonia',
          note: 'Lejos de su tierra, el pueblo lloró recordando a Sion — el lamento del salmo 137, uno de los más conmovedores de la Escritura.',
        },
        'exile-chebar': {
          label: 'El río Quebar',
          note: 'Allí, entre los cautivos, Ezequiel vio la visión de la gloria de Dios — Dios seguía presente aun en el exilio.',
        },
        'exile-daniel-court': {
          label: 'La corte de Babilonia',
          note: 'Daniel, fiel en un imperio pagano, fue librado del foso de los leones: Dios protege a los suyos incluso lejos de casa.',
        },
        'exile-cyrus-decree': {
          label: 'El decreto de Ciro',
          note: 'Setenta años después, Dios movió el corazón de un rey pagano para permitir el regreso del pueblo — cumpliendo su palabra por medio de Jeremías.',
        },
        'exile-return': {
          label: 'El regreso y el nuevo templo',
          note: 'Al poner los cimientos del templo, el pueblo alabó a Dios con lágrimas de alegría, recordando su fidelidad.',
        },
        'paul-antioch': {
          label: 'Antioquía de Siria',
          note: 'La iglesia de Antioquía, guiada por el Espíritu Santo, envió a Pablo y Bernabé en el primer viaje misionero.',
        },
        'paul-lystra': {
          label: 'Listra',
          note: 'Pablo sanó a un cojo de nacimiento, uno de los primeros milagros registrados de su ministerio entre los gentiles.',
        },
        'paul-jerusalem-council': {
          label: 'El Concilio de Jerusalén',
          note: 'La iglesia se reunió para resolver si los gentiles debían guardar la ley de Moisés para ser salvos.',
        },
        'paul-philippi': {
          label: 'Filipos',
          note: 'Una visión llamó a Pablo a cruzar a Macedonia; allí, encarcelado, un terremoto abrió las puertas de la prisión.',
        },
        'paul-athens': {
          label: 'Atenas',
          note: 'En el Areópago, Pablo predicó a los filósofos griegos sobre el Dios desconocido al que ellos ya adoraban sin saberlo.',
        },
        'paul-corinth': {
          label: 'Corinto',
          note: 'Pablo permaneció un año y medio enseñando la palabra de Dios en esta importante ciudad comercial.',
        },
        'paul-ephesus': {
          label: 'Éfeso',
          note: 'Durante dos años Pablo enseñó allí, de modo que toda la provincia de Asia oyó la palabra del Señor.',
        },
        'paul-rome': {
          label: 'Roma',
          note: 'Bajo custodia, Pablo predicó el reino de Dios en la capital del Imperio sin que nadie se lo impidiera.',
        },
        'jesus-bethlehem': {
          label: 'Belén',
          note: 'En la ciudad de David nació Jesús, envuelto en pañales y puesto en un pesebre.',
        },
        'jesus-jordan': {
          label: 'El Jordán',
          note: 'Juan bautizó a Jesús en el Jordán, y una voz del cielo lo declaró Hijo amado de Dios.',
          echoNote:
            'En este mismo río, Josué había guiado antes a Israel hacia la Tierra Prometida. Jesús, cuyo nombre es la misma palabra hebrea, «el Señor salva», inicia aquí su propio camino.',
        },
        'jesus-cana': {
          label: 'Caná de Galilea',
          note: 'En una boda, Jesús convirtió el agua en vino: la primera señal que manifestó su gloria.',
        },
        'jesus-capernaum': {
          label: 'Capernaúm',
          note: 'Jesús hizo de esta ciudad el centro de su ministerio en Galilea, con muchas enseñanzas y milagros.',
        },
        'jesus-caesarea-philippi': {
          label: 'Cesarea de Filipos',
          note: 'Allí Pedro confesó: «Tú eres el Cristo, el Hijo del Dios viviente».',
        },
        'jesus-jerusalem-entry': {
          label: 'Entrada a Jerusalén',
          note: 'Jesús entró en Jerusalén sobre un asno mientras la multitud aclamaba: «¡Hosanna al Hijo de David!».',
        },
        'jesus-gethsemane': {
          label: 'Getsemaní',
          note: 'En este huerto Jesús oró en agonía antes de ser entregado y arrestado.',
        },
        'jesus-golgotha': {
          label: 'El Gólgota',
          note: 'En este lugar, llamado «Calavera», Jesús fue crucificado por nuestros pecados.',
        },
        'jesus-empty-tomb': {
          label: 'La tumba vacía',
          note: '«No está aquí, pues ha resucitado, como dijo». La tumba vacía es el fundamento de la fe cristiana.',
        },
      },
    },

    constancy: {
      title: 'Tu constancia hoy',
      summary: '{{closed}} de {{total}} hoy',
      caption: 'Cierra tus anillos cada día',
      allClosed: '¡Cerraste tus anillos hoy!',
      habitReading: 'Leer',
      habitMemory: 'Memoria',
      habitDevotion: 'Devoción',
      habitMood: 'Ánimo',
      cardHint: 'Toca para ver tus hábitos del día',
      share: 'Compartir tus anillos',
      shareTitle: 'Comparte tu constancia',
      shareCardTitle: 'Mi constancia',
      shareCardSubtitle: 'Cerrando mis anillos cada día',
      shareToday: 'Hoy',
      shareStreakDay: '1 día',
      shareStreakDays: '{{n}} días',
    },

    readingGoal: {
      title: 'Meta de lectura',
      settingsTitle: 'Meta de lectura diaria',
      settingsDesc: 'Versículos por día para cerrar tu anillo de lectura',
      saved: 'Meta guardada',
    },

    prayer: {
      title: 'Diario de oración',
      subtitle: 'Lo que llevas a Dios',
      empty: 'Tu diario está vacío',
      emptyHint: 'Anota lo que quieres llevar a Dios en oración.',
      add: 'Añadir petición',
      addTitle: 'Nueva oración',
      editTitle: 'Editar oración',
      titleLabel: 'Petición',
      titlePlaceholder: '¿Qué llevas a Dios?',
      detailLabel: 'Detalle (opcional)',
      detailPlaceholder: 'Escribe más si quieres…',
      categoryLabel: 'Tipo',
      save: 'Guardar',
      cancel: 'Cancelar',
      categories: {
        praise: 'Alabanza',
        confession: 'Confesión',
        thanksgiving: 'Gratitud',
        supplication: 'Petición',
        intercession: 'Intercesión',
      },
      filterAll: 'Todas',
      activeSection: 'En oración',
      answeredSection: 'Respondidas',
      activeCount: '{{n}} en oración',
      answeredCount: '{{n}} respondidas',
      markAnswered: 'Marcar como respondida',
      answeredOn: 'Respondida el {{date}}',
      reopen: 'Reabrir',
      delete: 'Eliminar',
      deleteConfirmTitle: '¿Eliminar esta oración?',
      deleteConfirmBody: 'Se quitará de tu diario. No se puede deshacer.',
      answeredPrompt: '¿Cómo respondió Dios?',
      answeredNotePlaceholder: 'Tu testimonio (opcional)…',
      answeredCelebrate: 'Dios es fiel 🙏',
      addedToast: 'Guardado en tu diario',
      itemHint: 'Toca para ver opciones',
      streakTitle: 'Constancia en oración',
      streakDays: '{{n}} días en oración',
      streakOneDay: '1 día en oración',
      streakLapsed: 'Vuelve a la oración hoy',
      streakBest: 'Tu mejor racha: {{n}}',
      streakTodayDone: 'Hoy ya oraste',
      streakTodayPending: 'Tu oración de hoy te espera',
      streakHint: 'Abre la oración guiada',
      cardTitle: 'Oración',
      cardSubtitlePraying: '{{n}} en oración · {{a}} respondidas',
      cardSubtitleEmpty: 'Lleva tus cargas a Dios',
      openJournal: 'Mi diario de oración',
      prayNow: 'Orar ahora',
      scriptureCta: 'Orar la Escritura',
      scriptureCtaSubtitle: 'Ora versículo a versículo',
      studyToolTitle: 'Oración guiada',
      studyToolSubtitle: 'Adora, confiesa, agradece, pide',
      testimony: {
        share: 'Compartir testimonio',
        eyebrow: 'Dios fue fiel',
      },
      acts: {
        title: 'Oración guiada',
        // ACTS is an English mnemonic (Adoration·Confession·Thanksgiving·
        // Supplication) that doesn't carry into Spanish, so name the four
        // movements plainly instead (Sprint 98).
        subtitle: 'Adora · Confiesa · Agradece · Pide',
        intro:
          'Un momento para venir a Dios paso a paso: adóralo, confiésate, dale gracias y preséntale tus peticiones.',
        startQuestion: '¿Cómo quieres acercarte hoy?',
        startAdoring: 'Adorando',
        startConfessing: 'Confesando',
        begin: 'Comenzar',
        next: 'Siguiente',
        finish: 'Amén',
        stepOf: 'Paso {{n}} de {{total}}',
        adoration: {
          name: 'Adoración',
          prompt:
            'Detente y contempla quién es Dios. Alábale por su grandeza, su santidad y su amor — no solo por lo que hace, sino por quién es.',
        },
        confession: {
          name: 'Confesión',
          prompt:
            'A la luz de su santidad, trae con honestidad lo que pesa en tu corazón. Él es fiel y justo para perdonar.',
        },
        thanksgiving: {
          name: 'Gratitud',
          prompt:
            'Recuerda su bondad. Dale gracias por lo que ha hecho, grande y pequeño, en este día y en tu vida.',
        },
        supplication: {
          name: 'Súplica',
          prompt:
            'Ahora presenta tus peticiones — por ti y por otros. Él te invita a pedir con confianza.',
        },
        finishedTitle: 'Amén',
        finishedBody: 'Has venido a Dios en oración hoy. Él te escucha.',
        addToJournal: 'Guardar una petición',
        done: 'Terminar',
        missingText: 'Versículo no disponible',
      },
    },

    scripturePrayer: {
      title: 'Orar la Escritura',
      subtitle: 'Ora con las palabras que la Biblia misma registra',
      intro:
        'Estas oraciones no son un ejercicio literario: son palabras que hombres y mujeres de la Biblia dirigieron a Dios en momentos reales. Camina versículo a versículo, y haz tuya la oración con tus propias palabras si quieres.',
      disclaimer:
        'Estas son oraciones registradas en la Escritura — ejemplos para aprender de ellas, no una fórmula que debas repetir. Tu propia oración, con tus propias palabras, es igual de valiosa delante de Dios.',
      versesCount: '{{n}} versículos',
      verseProgress: 'Versículo {{n}} de {{total}}',
      begin: 'Comenzar',
      prev: 'Anterior',
      next: 'Siguiente',
      finish: 'Amén',
      missingText: 'Versículo no disponible',
      yourPrayerLabel: 'Tu oración (opcional)',
      yourPrayerPlaceholder:
        'Escribe aquí tu oración, con tus propias palabras…',
      finishedTitle: 'Gracias por orar',
      finishedBody: 'Que esta oración te acerque más al corazón de Dios.',
      saveJournalPrompt:
        '¿Quieres guardar lo que escribiste en tu diario de oración?',
      saveJournalButton: 'Guardar en el diario',
      discardButton: 'Cerrar sin guardar',
      savedToast: 'Guardado en tu diario de oración',
      done: 'Terminar',
      categories: {
        jesus: 'Oraciones de Jesús',
        canticles: 'Cánticos del Nuevo Testamento',
        paul: 'Oraciones de Pablo por las iglesias',
        psalms: 'Salmos que la Escritura titula «oración»',
        ot: 'Otras oraciones del Antiguo Testamento',
      },
      passages: {
        'lords-prayer': {
          title: 'El Padre Nuestro',
          context:
            'Jesús mismo enseñó esta oración a sus discípulos, en respuesta a su pedido: «Señor, enséñanos a orar» (Lucas 11:1).',
        },
        gethsemane: {
          title: 'Getsemaní',
          context:
            'Jesús enfrenta aquí su propia cruz, una copa que solo Él podía beber. Al orarlo, seguimos su ejemplo de someternos a la voluntad del Padre — no repetimos su circunstancia.',
        },
        magnificat: {
          title: 'El Magníficat de María',
          context:
            'María canta por un hecho histórico único: llevar al Mesías en su vientre. La iglesia ha orado este canto por siglos como alabanza por la venida de Cristo, no como testimonio personal de cada quien.',
        },
        benedictus: {
          title: 'El cántico de Zacarías',
          context:
            'Zacarías profetiza sobre su hijo Juan el Bautista y sobre la venida del Mesías. Lo oramos como alabanza por la fidelidad de Dios en cumplir sus promesas, no como palabras sobre nuestra propia vida.',
        },
        'nunc-dimittis': {
          title: 'El cántico de Simeón',
          context:
            'Simeón vio con sus propios ojos al Mesías prometido. Oramos sus palabras como gratitud por la salvación que también nosotros hemos visto en Cristo.',
        },
        'ephesians-prayer': {
          title: 'La oración de Pablo por los efesios',
          context:
            'Pablo dobla sus rodillas y pide que el amor de Cristo llene y fortalezca a los creyentes de Éfeso.',
        },
        'colossians-prayer': {
          title: 'La oración de Pablo por los colosenses',
          context:
            'Pablo pide que los creyentes de Colosas sean llenos del conocimiento de la voluntad de Dios y anden como es digno del Señor.',
        },
        'philippians-prayer': {
          title: 'La oración de Pablo por los filipenses',
          context:
            'Pablo pide que el amor de los filipenses abunde cada vez más en conocimiento y discernimiento.',
        },
        'thessalonians-prayer': {
          title: 'La oración de Pablo por los tesalonicenses',
          context:
            'Pablo pide que Dios dirija su camino de vuelta a ellos y que el Señor los haga crecer en amor.',
        },
        'psalm-51': {
          title: 'Salmo 51 — la confesión de David',
          context:
            'David clama a Dios por misericordia tras ser confrontado por el profeta Natán a causa de su pecado con Betsabé.',
        },
        'psalm-86': {
          title: 'Salmo 86 — oración de David',
          context:
            'El propio título del salmo lo llama «Oración de David»: un clamor por ayuda y misericordia en medio de la angustia.',
        },
        'psalm-90': {
          title: 'Salmo 90 — oración de Moisés',
          context:
            'El propio título del salmo lo llama «Oración de Moisés, varón de Dios»: una reflexión sobre la brevedad de la vida y la eternidad de Dios.',
        },
        'psalm-102': {
          title: 'Salmo 102 — oración del afligido',
          context:
            'El propio título lo llama «Oración del afligido cuando está angustiado». Su pedido por la restauración de Sion, la iglesia lo ha entendido cumplido en el pueblo de Dios reunido en Cristo, no en la Jerusalén física.',
        },
        'psalm-142': {
          title: 'Salmo 142 — oración de David en la cueva',
          context:
            'El propio título lo llama «Oración cuando estaba en la cueva»: David clama a Dios rodeado de peligro y sin ayuda humana.',
        },
        'nehemiah-prayer': {
          title: 'La oración de Nehemías',
          context:
            'Nehemías confiesa el pecado de su pueblo y pide el favor de Dios antes de emprender la reconstrucción de Jerusalén.',
        },
        'daniel-prayer': {
          title: 'La oración de Daniel',
          context:
            'Daniel confiesa el pecado de todo su pueblo, Israel, durante el exilio en Babilonia. Es un modelo de confesión corporal — orarlo es reconocer nuestras propias faltas y las de la iglesia, no describir literalmente nuestra situación.',
        },
        'jonah-prayer': {
          title: 'La oración de Jonás',
          context:
            'Jonás clama a Dios desde el vientre del gran pez, y Dios lo escucha y lo libra.',
        },
      },
    },

    weeklyChallenge: {
      title: 'Reto de la semana',
      masterN: 'Domina {{n}} versículos',
      masterOne: 'Domina 1 versículo',
      progress: '{{done}} / {{target}} dominados',
      focusTitle: 'Cerca de dominar',
      practice: 'Práctica: {{n}} días seguidos',
      practiceOne: 'Práctica: 1 día',
      practiceNone: 'Empieza tu racha de práctica',
      met: '¡Reto completado esta semana!',
      hint: 'Toca para practicar',
      share: 'Compartir tu reto',
      settingsTitle: 'Reto de memorización semanal',
      settingsDesc: 'Versículos para dominar cada semana',
      saved: 'Reto guardado',
      shareTitle: 'Comparte tu reto',
      shareCardTitle: 'Mi reto de la semana',
      shareMastered: 'Dominé {{n}} versículos',
      shareMasteredOne: 'Dominé 1 versículo',
      shareTarget: 'Meta: {{n}} esta semana',
      sharePractice: '{{n}} días de práctica',
      sharePracticeOne: '1 día de práctica',
    },

    auth: {
      sectionTitle: 'Cuenta',
      signInWithGoogle: 'Iniciar sesión con Google',
      signOut: 'Cerrar sesión',
      signOutConfirmTitle: 'Cerrar sesión',
      signOutConfirmMessage:
        'Cerrarás sesión de Google. Tus favoritos, notas, resaltados, marcadores y tarjetas de memoria seguirán en este dispositivo.',
      signOutConfirmCta: 'Cerrar sesión',
      signedInAs: 'Sesión iniciada como',
      notSignedIn:
        'Inicia sesión para sincronizar tus datos entre dispositivos',
      notSignedInTitle: 'Sin sesión iniciada',
      anonymousLabel: 'Invitado',
      signInError: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      signInCancelled: 'Inicio de sesión cancelado',
      signedInToast: '¡Bienvenido, {{name}}!',
      signedOutToast: 'Sesión cerrada',
      avatarA11y: 'Foto de perfil de {{name}}',
      googleLogoA11y: 'Logo de Google',
    },

    sync: {
      justNow: 'Sincronizado hace un momento',
      secondsAgo: 'Sincronizado hace {{n}}s',
      minutesAgo: 'Sincronizado hace {{n}} min',
      waiting: 'Esperando sincronización',
      syncing: 'Sincronizando {{count}} cambios…',
      syncingSingular: 'Sincronizando 1 cambio…',
      offline: 'Sin conexión',
      offlineWithQueue: 'Sin conexión — {{count}} cambios encolados',
      offlineWithQueueSingular: 'Sin conexión — 1 cambio encolado',
    },

    conflicts: {
      title: 'Conflictos pendientes',
      empty: 'Sin conflictos',
      emptyTitle: 'Todo está sincronizado',
      emptyBody:
        'Cuando dos dispositivos editen lo mismo a la vez, te lo mostraremos aquí para que elijas qué versión conservar.',
      badge: '{{count}} conflictos por resolver',
      badgeSingular: '1 conflicto por resolver',
      badgeA11y: 'Abrir conflictos pendientes',
      mine: 'Tu versión',
      theirs: 'Versión remota',
      keepMine: 'Mantener mía',
      keepTheirs: 'Mantener remota',
      merge: 'Combinar',
      mergeTitle: 'Combinar versiones',
      mergeBody:
        'Edita cada campo para combinar tu versión y la remota. Al guardar, el resultado se enviará a todos tus dispositivos.',
      mergePlaceholder: 'Edita aquí…',
      mineHint: 'Tuya',
      theirsHint: 'Remota',
      saveMerge: 'Guardar combinación',
      resolvedToast: 'Conflicto resuelto',
      resolveError: 'No se pudo resolver el conflicto. Inténtalo de nuevo.',
      migrationTitle: '¿Migrar este dispositivo?',
      migrationBody:
        'Encontramos una cuenta de Google ya registrada. Tienes {{count}} cambios locales en este dispositivo. ¿Quieres migrarlos a esa cuenta?',
      migrationYes: 'Migrar',
      migrationNo: 'Solo iniciar sesión',
      migrationDoneToast: 'Datos locales migrados a tu cuenta',
      insights: {
        title: 'Historial de conflictos',
        subtitle: 'Cómo resuelves la sincronización',
        openLabel: 'Ver historial de conflictos',
        loading: 'Cargando historial…',
        errorTitle: 'No se pudo cargar',
        errorBody:
          'No pudimos leer tu historial de conflictos. Inténtalo de nuevo.',
        retry: 'Reintentar',
        emptyTitle: 'Aún no hay conflictos',
        emptyBody:
          'Cuando resuelvas un conflicto de sincronización, aquí verás tus patrones de decisión.',
        overviewTitle: 'Resumen',
        totalLabel: '{{count}} conflictos resueltos',
        totalLabelSingular: '1 conflicto resuelto',
        verdictMine: 'Sueles quedarte con tu versión ({{pct}}%).',
        verdictTheirs: 'Sueles quedarte con la versión remota ({{pct}}%).',
        verdictMerge: 'Sueles combinar ambas versiones ({{pct}}%).',
        verdictBalanced: 'Resuelves los conflictos de forma equilibrada.',
        verdictLearning: 'Resuelve algunos conflictos más para ver tu patrón.',
        choiceTitle: 'Cómo resuelves',
        choiceHint: 'Tus elecciones al resolver',
        choiceMine: 'Mía',
        choiceTheirs: 'Remota',
        choiceMerge: 'Combinar',
        collectionTitle: 'Por tipo de dato',
        collectionHint: 'Dónde ocurren más conflictos',
        fieldTitle: 'Campos en conflicto',
        fieldHint: 'Qué campos chocan más a menudo',
        fieldEmpty: 'Sin campos registrados',
        timesBadge: '{{count}} veces',
        timesBadgeSingular: '1 vez',
        activityTitle: 'Actividad',
        activityHint: 'Conflictos resueltos por semana',
        activityNow: 'Ahora',
        collectionLabels: {
          favorites: 'Favoritos',
          notes: 'Notas',
          highlights: 'Resaltados',
          bookmarks: 'Marcadores',
          memoryCards: 'Memorización',
        },
        fieldLabels: {
          note: 'Nota',
          text: 'Texto',
          color: 'Color',
          category: 'Categoría',
          rating: 'Valoración',
          tags: 'Etiquetas',
          label: 'Etiqueta',
        },
      },
    },

    bookmarks: {
      title: 'Marcadores',
      short: 'Marcadores',
      count: 'marcadores',
      countSingular: 'marcador',
      added: 'Marcador añadido',
      addedMany: '{{n}} marcadores añadidos',
      emptyMessage: 'Aún no tienes marcadores',
      openBible: 'Abrir la Biblia',
      rename: 'Renombrar',
      renameTitle: 'Nombre del marcador',
      labelPlaceholder: 'Ej.: Sermón del domingo',
      deleteTitle: 'Eliminar marcador',
      deleteMessage: '¿Quieres quitar este marcador?',
    },

    highlights: {
      title: 'Mis Resaltados',
      short: 'Resaltados',
      count: '{{count}} versículos resaltados',
      countSingular: '{{count}} versículo resaltado',
      empty: 'Aún no tienes resaltados',
      emptyHint: 'Selecciona versículos al leer y toca Resaltar',
      noMatch: 'Ningún resaltado coincide con el filtro',
      all: 'Todos',
      searchPlaceholder: 'Buscar en tus resaltados...',
      groupByColor: 'Por color',
      listView: 'Lista',
      galleryShare: 'Compartir mis resaltados',
      galleryShareTitle: 'Comparte tus resaltados',
      galleryShareCardTitle: 'Mis versículos resaltados',
      galleryShareCount: '{{n}} versículos resaltados',
      galleryShareCountOne: '1 versículo resaltado',
      deleteTitle: 'Eliminar resaltado',
      deleteMessage: '¿Quieres quitar este resaltado?',
      removed: 'Resaltado eliminado',
      saved: 'Resaltado actualizado',
      notePlaceholder: 'Añade una nota personal...',
      category: 'Categoría',
      save: 'Guardar',
      categories: {
        promise: 'Promesa',
        prayer: 'Oración',
        commandment: 'Mandamiento',
        wisdom: 'Sabiduría',
        prophecy: 'Profecía',
        favorite: 'Favorito',
        memorize: 'Memorizar',
        study: 'Estudio',
      },
    },

    // Settings Screen
    settings: {
      title: 'Configuración',
      subtitle: 'Personaliza tu experiencia celestial',
      appearance: 'Apariencia',
      theme: 'Tema',
      themeDescription: 'Elige el tema de la aplicación',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      themeAuto: 'Auto',

      colorTheme: 'Tema de Color',
      colorThemeDescription: 'Elige el estilo visual de la aplicación',
      exclusiveThemeLabel: 'Exclusivo',
      keepAwakeTitle: 'Mantener pantalla encendida',
      keepAwakeDescription:
        'Evita que la pantalla se bloquee mientras lees, estudias, memorizas u oras.',
      colorThemeNames: {
        ocean: 'Océano',
        celestial: 'Celestial',
        forest: 'Bosque',
        sunset: 'Atardecer',
        graphite: 'Grafito',
        royal: 'Royal',
        midnight: 'Midnight',
        cafe: 'Café',
        vino: 'Vino',
        esmeralda: 'Esmeralda',
        arena: 'Arena',
        aurora: 'Aurora',
        granate: 'Granate',
        zafiro: 'Zafiro',
        turquesa: 'Turquesa',
        orquidea: 'Orquídea',
      },

      bibleVersion: 'Versión de la Biblia',
      selectVersion: 'Selecciona tu versión',
      versionDescription: 'Elige la traducción de la Biblia que prefieres',
      comingSoon: 'Próximamente',

      manageVersions: 'Gestionar versiones',
      manageVersionsDescription:
        'Descarga más traducciones para leerlas y buscarlas sin conexión.',
      manageVersionsLoading: 'Buscando versiones disponibles…',
      manageVersionsError:
        'No se pudo cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.',
      manageVersionsEmpty: 'No hay versiones nuevas para descargar.',
      manageVersionsRetry: 'Reintentar',
      versionInstalled: 'Instalada',
      versionDownload: 'Descargar',
      versionDownloading: 'Descargando…',
      versionImporting: 'Instalando…',
      versionDelete: 'Eliminar',
      versionDeleteTitle: 'Eliminar versión',
      versionDeleteMessage:
        '¿Eliminar {version}? Podrás volver a descargarla cuando quieras. Tus favoritos, notas y resaltados no se ven afectados.',
      versionDeleteConfirm: 'Eliminar',
      versionDownloadSuccess: '{version} lista para leer',
      versionDeleteSuccess: '{version} eliminada',
      versionErrorSpace:
        'No hay espacio suficiente para descargar esta versión.',
      versionErrorChecksum:
        'La descarga se dañó durante la transferencia. Inténtalo de nuevo.',
      versionErrorNetwork:
        'Error de red durante la descarga. Revisa tu conexión.',
      versionErrorGeneric: 'No se pudo descargar. Inténtalo de nuevo.',

      language: 'Idioma',
      selectLanguage: 'Selecciona tu idioma',
      languageDescription: 'Cambia el idioma de la aplicación',

      data: 'Datos',
      resetData: 'Resetear Datos de la Biblia',
      resetDescription: 'Elimina y recarga todos los versículos',
      resetTitle: 'Resetear Datos',
      resetMessage:
        '¿Estás seguro de que quieres resetear todos los datos de la Biblia? Esto borra y vuelve a cargar los 62.000+ versículos. Tus favoritos, notas y resaltados no se ven afectados. La recarga puede tardar un minuto.',
      resetConfirm: 'Resetear',
      resetSuccess: 'Datos Reseteados',
      resetSuccessMessage: 'Los versículos se han recargado correctamente.',
      resetting: 'Recargando versículos…',
      resetError: 'Error al resetear los datos.',
      exportBackup: 'Exportar copia de seguridad',
      exportBackupDescription:
        'Genera un archivo JSON con favoritos, notas, resaltados, marcadores, progreso y preferencias.',
      exporting: 'Generando copia…',
      exportError: 'No se pudo exportar la copia. Inténtalo de nuevo.',
      backupDialogTitle: 'Eternal Stone Bible · Copia de seguridad',

      about: 'Acerca de',
      version: 'Versión',
      description:
        'Una aplicación de lectura de la Biblia diseñada para acercarte a la Palabra de Dios.',
      viewGitHub: 'Ver en GitHub',
      footerText: 'Hecho con ❤️ para la gloria de Dios',
      footerVerse:
        '"Toda la Escritura es inspirada por Dios"\n- 2 Timoteo 3:16',
    },

    // Verse Reading Screen
    verse: {
      singular: 'versículo',
      plural: 'versículos',
      addFavorite: 'Favoritos',
      removeFavorite: 'Quitar de Favoritos',
      compare: 'Comparar',
      copyVerse: 'Copiar Versículo',
      shareVerse: 'Compartir Versículo',
      addNote: 'Agregar Nota',
      image: 'Imagen',
      fontSize: 'Tamaño de Letra',
      verseCopied: 'Versículo copiado al portapapeles',
      imageReady: 'Imagen preparada para compartir',
      imageShareError: 'No se pudo compartir la imagen',
      errorLoadingVerses: 'Error al cargar los versículos',
      retry: 'Reintentar',
      searchInChapter: 'Buscar en el capítulo',
      loadingVerses: 'Cargando versículos...',
      prevChapter: 'Capítulo anterior',
      nextChapter: 'Siguiente capítulo',
      distractionFreeMode: 'Modo sin distracciones',
      versesList: 'Lista de versículos',
      errorSharingVerse: 'Error al compartir el versículo',
      addedToFavorites: 'Agregado a favoritos',
      removedFromFavorites: 'Eliminado de favoritos',
      audio: 'Audio',
      pause: 'Pausar',
      immersive: 'Inmersivo',
      highlight: 'Resaltar',
      selectVersesFirst: 'Selecciona versículos primero',
      shareAsImage: 'Compartir como Imagen',
      imageVersesWord: 'versículos',
      imageStyle: 'Elige un estilo',
      imageStyleA11y: 'Estilo {{n}}',
      imageFormat: 'Formato',
      imageFormatSquare: 'Cuadrado',
      imageFormatPortrait: 'Retrato',
      imageFormatStory: 'Historia',
      imageFontSize: 'Tamaño de fuente',
      imageAlignment: 'Alineación',
      imageAlignLeft: 'Izquierda',
      imageAlignCenter: 'Centro',
      imageAlignRight: 'Derecha',
      imageFontStyle: 'Estilo de fuente',
      imageTexture: 'Textura',
      imageTextureNone: 'Ninguna',
      imageTextureDots: 'Puntos',
      imageTextureLines: 'Líneas',
      imageTextureGrain: 'Grano',
      exclusiveLabel: 'Exclusivo',
      imageSavePreset: 'Guardar estilo',
      imageStyleSaved: 'Estilo guardado',
      imageMyStyles: 'Mis estilos',
      imageDeletePreset: 'Eliminar estilo',
      verseProgress: 'Versículo {{current}} de {{total}}',
      autoPlay: 'Auto',
      closeImmersive: 'Cerrar modo inmersivo',
      increaseFontSize: 'Aumentar tamaño de letra',
      decreaseFontSize: 'Reducir tamaño de letra',
      previousVerse: 'Versículo anterior',
      nextVerse: 'Versículo siguiente',
      sideBySide: 'Mostrar la otra versión junto a esta',
      dualView: 'Doble',
      focusMode: 'Foco',
      focusModeOnToast:
        'Modo foco: se resalta el versículo del centro (o el que se está escuchando) y el resto se atenúa',
      focusModeOffToast: 'Modo foco desactivado',
      dualCompanionLabel: 'Junto a:',
      swapVersions: 'Intercambiar versiones',
      dualLayoutColumns: 'Ver en columnas a igual tamaño',
      dualLayoutStacked: 'Ver la versión acompañante debajo',
      highlightColorNames: {
        yellow: 'amarillo',
        green: 'verde',
        blue: 'azul',
        purple: 'morado',
        pink: 'rosa',
        orange: 'naranja',
        red: 'rojo',
        gray: 'gris',
      },
      highlightInColor: 'Resaltar en {{color}}',
      removeHighlight: 'Quitar resaltado',
      clearSelection: 'Limpiar selección',
      moreActions: 'Más acciones',
      listenFromHere: 'Escuchar desde aquí',
      verseA11yLabel: 'Versículo {{n}}, {{text}}',
      verseA11yHint: 'Toca dos veces para seleccionar',
      alsoSee: 'Ver también',
      alsoPanelA11y: 'Ver este versículo en otras versiones',
      alsoClose: 'Cerrar ver también',
    },

    // Audio Player
    audio: {
      sleepTimer: {
        title: 'Temporizador de sueño',
        openTimer: 'Abrir temporizador de sueño',
        stopAt: 'Detener audio en:',
        minutesShort: '{{n}} min',
        hour1: '1 hora',
        endOfChapterTitle: 'Fin del capítulo',
        endOfChapterSubtitle: 'Detener al terminar el capítulo actual',
        endOfChapterStatus: 'Se detendrá al terminar el capítulo',
        endOfBookTitle: 'Fin del libro',
        endOfBookSubtitle: 'Seguir hasta terminar el libro actual',
        endOfBookStatus: 'Se detendrá al terminar el libro',
        lessThanOne: 'Menos de 1 minuto',
        oneRemaining: '1 minuto restante',
        minutesRemaining: '{{n}} minutos restantes',
        info: 'El audio se detendrá automáticamente cuando termine el tiempo seleccionado',
        cancel: 'Cancelar',
      },
      a11y: {
        play: 'Reproducir audio',
        pause: 'Pausar audio',
        playHint: 'Reproduce o pausa la lectura del capítulo',
        nextVerse: 'Versículo siguiente',
        previousVerse: 'Versículo anterior',
        nextVerseHint: 'Salta al siguiente versículo',
        previousVerseHint: 'Vuelve al versículo anterior',
        speed: 'Velocidad de reproducción',
        expand: 'Expandir reproductor',
        expandHint: 'Abre los controles completos del reproductor',
        collapse: 'Contraer reproductor',
        close: 'Cerrar reproductor',
        autoAdvance: 'Reproducción continua',
        autoAdvanceHint:
          'Al terminar el capítulo, continúa automáticamente con el siguiente',
        readerFollow: 'El lector sigue al audio',
        readerFollowHint:
          'Cuando la reproducción continua avanza de capítulo, el lector navega con ella',
        repeatVerse: 'Repetir versículo',
        repeatVerseHint:
          'Repite en bucle el versículo actual para memorizarlo, hasta que lo desactives',
      },
      scrub: {
        preview: 'Versículo {{n}} de {{total}}',
        a11yLabel: 'Desplazamiento por versículo',
        a11yHint: 'Desliza para saltar a un versículo',
      },
      resume: {
        toast: 'Reanudado desde {{ref}}',
      },
      queue: {
        title: 'Cola de escucha',
        nowPlaying: 'Sonando ahora',
        upNextSection: 'A continuación',
        jumpHint: 'Salta la reproducción a este capítulo',
        openLabel: 'Abrir la cola de escucha',
        openHint: 'Muestra los próximos capítulos de la sesión',
        endOfCanon: 'Fin de la Biblia',
        info: 'Con la reproducción continua ∞, el audio avanza solo por estos capítulos.',
        versesMeta: '{{n}} versículos',
        minutesMeta: '~{{m}} min',
        bookmarksSection: 'Marcadores',
        bookmarkAdd: 'Guardar este verso',
        bookmarkRemove: 'Quitar el marcador de este verso',
        bookmarkJumpHint: 'Reanuda la escucha en este verso',
        bookmarkDelete: 'Eliminar marcador',
        bookmarkPinned: 'Marcador guardado: {{verse}}',
        playlistTitle: 'Lista de escucha',
        playlistUpNext: 'Siguiente en la lista',
        playlistJumpHint: 'Salta la reproducción a este verso',
        playlistEnd: 'Fin de la lista',
        playlistInfo:
          'Estás escuchando una lista de versos guardados. El audio se detiene al terminar la lista.',
        playlistQueued: 'Lista de escucha: {{label}} · {{n}} versículos',
        shuffle: 'Aleatorio',
        repeat: 'Repetir lista',
        playlistRepeats: 'La lista se repite desde el inicio',
      },
      playlistRow: 'Lista: {{label}}',
      nextChapterUp: 'Sigue: {{chapter}}',
      readerFollowToast: '∞ {{chapter}}',
      autoAdvanceOnToast:
        '∞ Avance automático: al terminar seguirá el siguiente capítulo',
      autoAdvanceOffToast:
        'Avance automático desactivado: el audio se detendrá al final del capítulo',
      readerFollowOnToast:
        '📖 El lector te llevará al capítulo que se esté escuchando',
      readerFollowOffToast:
        'El lector se quedará donde estás mientras el audio avanza',
      repeatVerseOnToast:
        '🔁 Repetir versículo: este versículo sonará en bucle para memorizarlo',
      repeatVerseOffToast:
        'Repetición desactivada: el audio seguirá con el siguiente versículo',
      immersive: {
        listen: 'Escuchar',
        listening: 'Escuchando',
        paused: 'En pausa',
        continuous: 'Continuo',
        chapterAdvanced: 'Continuando en {{chapter}}',
      },
    },

    // Premium (Sprint 50 — local feature flag)
    premium: {
      title: 'Premium',
      featureName: 'Desplazamiento por versículo',
      lockedHint: 'Arrastra la barra para saltar a cualquier versículo',
      upsellTap: 'Desbloquéalo en Ajustes',
      badge: 'PREMIUM',
      settingsTitle: 'Funciones premium',
      settingsDesc:
        'Desbloquea el desplazamiento por versículo y continuar escuchando donde lo dejaste en el reproductor de audio.',
      toggleLabel: 'Premium desbloqueado',
      unlockedToast: 'Premium activado',
      lockedToast: 'Premium desactivado',
    },

    offering: {
      badgeA11y: 'Extra — se desbloquea con una ofrenda',
      sheetTitle: 'Una ofrenda voluntaria',
      sheetIntro:
        'Algunos extras de esta app se desbloquean con una ofrenda única y voluntaria — como una ofrenda en la iglesia, no una compra. La Biblia, los planes de lectura, la oración y todo lo demás siguen siendo, y seguirán siendo siempre, completamente gratis.',
      extrasListTitle: 'Esto es lo que se desbloquea:',
      extraAudio:
        'Audio avanzado: desplázate libremente por versículo, continúa donde lo dejaste, y escucha en modo inmersivo',
      extraShareTemplates: 'Plantillas adicionales para compartir versículos',
      tierSuggested: 'Sugerido',
      legend:
        'Los montos son fijos por requisitos de la tienda de aplicaciones; cualquiera de ellos desbloquea exactamente lo mismo.\n\nSi deseas dar una cantidad distinta, el apartado de Donación está siempre abierto para sembrar lo que Dios ponga en tu corazón.',
      transparency:
        'Esta ofrenda no es deducible de impuestos. Sostiene el desarrollo y el ministerio de esta app.',
      restoreLink: 'Restaurar mi ofrenda anterior',
      restoring: 'Restaurando…',
      restoreNotFound: 'No encontramos una ofrenda anterior en esta cuenta.',
      restoreSuccess: 'Extras restaurados. ¡Gracias por tu ofrenda!',
      purchasing: 'Procesando…',
      purchaseError: 'No se pudo completar la ofrenda. Inténtalo de nuevo.',
      thankYouTitle: 'Gracias por sembrar en esta obra',
      thankYouMessage:
        'La app completa sigue siendo gratuita — este extra es solo un regalo adicional. Que Dios te bendiga.',
      close: 'Cerrar',
      settingsSectionTitle: 'Extras',
      settingsUnlockedTitle: 'Extras desbloqueados',
      settingsUnlockedDesc:
        'Gracias por tu ofrenda — ya tienes acceso a todos los extras.',
      settingsLockedTitle: 'Extras de la app',
      settingsLockedDesc:
        'Algunas funciones adicionales se pueden desbloquear con una ofrenda voluntaria.',
      settingsCta: 'Desbloquear con una ofrenda',
      devToggleLabel: 'Extras desbloqueados (solo desarrollo)',
    },

    donation: {
      sheetTitle: 'Donación',
      sheetIntro:
        'Para los hermanos y hermanas que Dios ponga en el corazón apoyar esta obra: aquí puedes dar libremente. Esto no desbloquea nada — la app completa ya es, y seguirá siendo siempre, gratuita para todos.',
      amountsHint:
        'Elige la cantidad que quieras dar. Puedes hacerlo más de una vez.',
      transparency:
        'Esta donación no es deducible de impuestos. Sostiene el desarrollo y el ministerio de esta app.',
      purchasing: 'Procesando…',
      purchaseError: 'No se pudo completar la donación. Inténtalo de nuevo.',
      thankYouTitle: 'Gracias por tu generosidad',
      thankYouMessage: 'Dios ve lo que se da desde el corazón.',
      thankYouVerse:
        'La gracia del Señor Jesucristo, el amor de Dios, y la comunión del Espíritu Santo sean con todos vosotros. Amén.',
      thankYouVerseRef: '2 Corintios 13:14',
      close: 'Cerrar',
      settingsSectionTitle: 'Donación',
      settingsDesc:
        'Si deseas apoyar el desarrollo y el ministerio de esta app con una donación libre, puedes hacerlo aquí. Nunca desbloquea nada ni es necesaria para usar la app.',
      settingsCta: 'Apoyar con una donación',
    },

    // Reading Plans
    readingPlans: {
      days: 'días',
      proverbs: {
        name: 'Sabiduría Diaria (Proverbios)',
        description: 'Un capítulo de Proverbios cada día',
      },
      psalms: {
        name: 'Salmos en {{n}} Días',
        description: 'Lee el libro de Salmos completo a tu ritmo',
      },
      gospels: {
        name: 'Los 4 Evangelios en {{n}} Días',
        description:
          'Conoce la vida de Jesús a través de los cuatro evangelios',
      },
      newTestament: {
        name: 'Nuevo Testamento en {{n}} Días',
        description: 'Lee todo el Nuevo Testamento a tu ritmo',
      },
      genesis: {
        name: 'Génesis - El Principio',
        description: 'Descubre el origen de todo en el libro de Génesis',
      },
      bibleYear: {
        name: 'Toda la Biblia en {{n}} Días',
        description:
          'Recorre toda la Escritura en {{n}} días, en orden canónico',
      },
      redemption: {
        name: 'Cristo en toda la Biblia',
        description:
          'La historia de la redención: 31 pasajes clave que apuntan a Jesús, de Génesis a Apocalipsis',
      },
      wisdom: {
        name: 'Sabiduría Diaria: Salmo y Proverbio',
        description:
          'Cada día un Salmo y un capítulo de Proverbios, para empezar o cerrar el día',
      },
      firstSteps: {
        name: 'Primeros pasos con Jesús',
        description:
          'Un camino suave de {{n}} días para nuevos creyentes y para volver a empezar',
      },
      iam: {
        name: 'Los "Yo soy" de Jesús',
        description:
          'Siete días en el Evangelio de Juan: quién es Jesús, dicho por Él mismo',
        context: [
          '«Yo soy el pan de vida.» Jesús sacia el hambre más profunda del alma.',
          '«Yo soy la luz del mundo.» Quien le sigue nunca anda en tinieblas.',
          '«Yo soy la puerta.» Solo por Él entramos a la salvación y al buen pasto.',
          '«Yo soy el buen pastor.» El Pastor que da su vida por las ovejas.',
          '«Yo soy la resurrección y la vida.» En Él, la muerte no es el final.',
          '«Yo soy el camino, la verdad y la vida.» El único camino al Padre.',
          '«Yo soy la vid verdadera.» Permanecer en Él da fruto que permanece.',
        ],
      },
      parables: {
        name: 'Las parábolas de Jesús',
        description:
          'Diez días entre las historias con que Jesús enseñó el reino de Dios',
        context: [
          '«El hijo pródigo.» El Padre corre a recibir al que vuelve: así es el corazón de Dios.',
          '«El buen samaritano.» El amor verdadero cruza la calle y se ensucia las manos por el necesitado.',
          '«El sembrador.» La misma Palabra cae en distintos corazones; pide ser buena tierra.',
          '«El trigo y la cizaña.» Dios es paciente; la separación final es suya, no nuestra.',
          '«La oveja y la moneda perdidas.» El cielo hace fiesta por un solo pecador que se arrepiente.',
          '«El siervo que no perdonó.» Perdonados de una deuda impagable, somos llamados a perdonar.',
          '«Las diez vírgenes.» Vela y prepárate: el Esposo viene a una hora que no esperas.',
          '«Los talentos.» Lo que Dios te confía es para usarlo con fidelidad, no para esconderlo.',
          '«El fariseo y el publicano.» Dios resiste al orgulloso y justifica al humilde que pide misericordia.',
          '«La gran cena.» La invitación de Dios es amplia; no la dejes para después.',
        ],
      },
      miracles: {
        name: 'Los milagros de Jesús',
        description: 'Diez días ante las señales con que Jesús mostró quién es',
        context: [
          '«Agua en vino.» Su primera señal: la abundancia y el gozo que Jesús trae.',
          '«Calma la tempestad.» El viento y el mar le obedecen; también tu tormenta.',
          '«Alimenta a los cinco mil.» En sus manos, lo poco basta y sobra.',
          '«Camina sobre el mar.» «No temáis; yo soy.» Su presencia sostiene en lo imposible.',
          '«La hija de Jairo.» Ni la enfermedad ni la muerte detienen su poder y su ternura.',
          '«Sana al ciego de nacimiento.» El que abre los ojos del cuerpo abre también los del alma.',
          '«El hijo de la viuda de Naín.» Movido a compasión, devuelve la vida y el consuelo.',
          '«Sana al paralítico.» Primero perdona el pecado y luego sana: tiene autoridad para ambas cosas.',
          '«Los diez leprosos.» Diez son limpiados; solo uno vuelve a dar gracias. ¿Y tú?',
          '«Resucita a Lázaro.» «Yo soy la resurrección y la vida»: la muerte no tiene la última palabra.',
        ],
      },
      namesOfGod: {
        name: 'Los nombres de Dios',
        description:
          'Siete días conociendo a Dios por los nombres con que se revela',
        context: [
          '«Jehová proveerá» (Jehová-jireh). En el monte, Dios provee el cordero: anuncio del Cordero que Él daría.',
          '«YO SOY EL QUE SOY.» El Dios eterno, que se basta a sí mismo, se da a conocer y envía.',
          '«Jehová es mi bandera» (Jehová-nisi). La victoria del pueblo está en el Señor, no en su propia fuerza.',
          '«Jehová es mi pastor» (Jehová-roi). El que cuida, guía y restaura: nada nos faltará a su lado.',
          '«Jehová es paz» (Jehová-salom). Donde Dios habla, el temor cede: Él es nuestra paz.',
          '«Jehová que sana» (Jehová-rafa). El que sanó las aguas amargas sigue siendo el Dios que sana.',
          '«El Altísimo, mi refugio» (Elyón). Quien habita al abrigo del Altísimo descansa seguro bajo su sombra.',
        ],
      },
      fruitOfSpirit: {
        name: 'El fruto del Espíritu',
        description:
          'Nueve días por el fruto que el Espíritu cultiva en el creyente (Gálatas 5:22-23)',
        context: [
          'Amor: «El amor es sufrido, es benigno.» El primer fruto es el retrato de Cristo: amar como Él nos amó.',
          'Gozo: «Regocijaos en el Señor siempre.» Un gozo que no depende de las circunstancias, sino del Señor.',
          'Paz: «La paz os dejo, mi paz os doy.» No como la da el mundo: la paz que Cristo mismo nos deja.',
          'Paciencia: «Tened paciencia hasta la venida del Señor.» Como el labrador que espera el fruto, confiando en Dios.',
          'Benignidad: «Sed benignos unos con otros, como Dios os perdonó.» La amabilidad que nace de haber sido perdonados.',
          'Bondad: «No seas vencido de lo malo, sino vence con el bien el mal.» La bondad activa que devuelve bien por mal.',
          'Fidelidad: «Bien, buen siervo y fiel.» Ser fiel en lo poco es agradar al Señor que volverá.',
          'Mansedumbre: «Aprended de mí, que soy manso y humilde de corazón.» La gentileza de Cristo, que da descanso al alma.',
          'Templanza: «Todo aquel que lucha, de todo se abstiene.» El dominio propio que corre para ganar el premio incorruptible.',
        ],
      },
      heroesOfFaith: {
        name: 'Los héroes de la fe',
        description:
          'Ocho días entre los testigos de la fe de Hebreos 11, de Abel a Cristo',
        context: [
          'Abel: «Por la fe ofreció un más excelente sacrificio.» El primero en adorar de corazón; su sangre clama, pero la de Cristo habla mejor.',
          'Noé: «Por la fe preparó el arca.» Creyó a Dios contra toda evidencia y halló gracia para la salvación de su casa.',
          'Abraham llamado: «Por la fe salió sin saber a dónde iba.» Dejó tierra y parentela confiando solo en la promesa de Dios.',
          'Abraham e Isaac: «Por la fe ofreció a Isaac.» En el monte, una sombra del Padre que no escatimó a su propio Hijo.',
          'Moisés y el mar: «Por la fe pasaron el Mar Rojo.» Donde no había camino, Dios abrió uno: la salvación es del Señor.',
          'Josué y Jericó: «Por la fe cayeron los muros de Jericó.» La victoria vino por confiar y obedecer, no por la espada.',
          'Los testigos: «Una nube tan grande de testigos.» Todos murieron en fe, esperando algo mejor: al Cristo prometido.',
          'Puestos los ojos en Jesús: «Mirando a Jesús, el autor y consumador de la fe.» Toda esta fe mira a Él, la meta de la carrera.',
        ],
      },
      propheticThread: {
        name: 'El hilo profético',
        description:
          'El Antiguo y el Nuevo Testamento, capítulo a capítulo: recorre cada profecía y su cumplimiento en Cristo',
        context: [
          'La simiente de la mujer: Desde la caída, Dios promete que la simiente de la mujer herirá la cabeza de la serpiente; Cristo, nacido de mujer, vino a deshacer las obras del diablo.',
          'Bendición a las naciones: En la simiente de Abraham serían benditas todas las naciones; esa simiente, dice Pablo, es Cristo.',
          'De la tribu de Judá: El cetro no se apartaría de Judá hasta venir Siloh; el Señor Jesús nació de la tribu de Judá.',
          'Estrella de Jacob: Balaam vio de lejos una estrella que saldría de Jacob; los magos siguieron su estrella hasta el Rey nacido.',
          'Heredero del trono de David: Dios prometió a David un descendiente cuyo reino sería eterno; el ángel anunció que Jesús reinaría para siempre.',
          'Nacido de una virgen: La virgen concebiría y daría a luz un hijo, Emanuel, «Dios con nosotros»: cumplido en el nacimiento de Jesús.',
          'Nacido en Belén: De Belén, pequeña entre las aldeas, saldría el Señor cuyos orígenes son desde la eternidad.',
          'Dios fuerte, Príncipe de paz: Un niño nos es nacido cuyo nombre es Admirable, Dios fuerte, Príncipe de paz: el Salvador, Cristo el Señor.',
          'Llamado de Egipto: Como Israel fue llamado de Egipto, así fue llamado el Hijo de Dios, guardado allí en su niñez.',
          'Llanto en Ramá: El llanto de Raquel por sus hijos resonó cuando Herodes mandó matar a los niños de Belén.',
          'El Renuevo de Isaí: Una vara saldría del tronco de Isaí, un Renuevo que llevará fruto; Pablo cita esta raíz de Isaí: Cristo, en quien esperan los gentiles.',
          'El Renuevo justo de David: «Levantaré a David renuevo justo, y reinará como Rey», promete Jeremías; el Señor Jesús se declara a sí mismo «la raíz y el linaje de David, la estrella resplandeciente de la mañana».',
          'El mensajero del camino: Dios enviaría un mensajero a preparar el camino delante de Él: Juan el Bautista, voz que precedió al Señor.',
          'Voz en el desierto: Una voz clamaría en el desierto: «Preparad el camino del Señor»; así predicó Juan en el desierto.',
          'El Elías que había de venir: «He aquí, yo os envío el profeta Elías, antes que venga el día de Jehová», promete Malaquías; Jesús mismo declaró que esa promesa se cumplió en Juan el Bautista.',
          'Profeta como Moisés: Dios levantaría un profeta como Moisés, a quien oiríamos; Pedro lo proclama cumplido en Jesús.',
          'Ungido con el Espíritu: El Espíritu del Señor sobre el Ungido para dar buenas nuevas a los pobres: Jesús lo leyó y dijo «hoy se ha cumplido».',
          'Luz en Galilea: El pueblo que andaba en tinieblas vería gran luz; Jesús comenzó a predicar en Galilea de los gentiles.',
          'Sana ciegos y cojos: Los ojos de los ciegos se abrirían y los cojos saltarían; así respondió Jesús: los ciegos ven, los cojos andan.',
          'Habla en parábolas: El Mesías abriría su boca en parábolas, declarando cosas escondidas desde la fundación del mundo.',
          'Entra montado en pollino: El Rey vendría humilde, montado en un pollino; así entró Jesús a Jerusalén entre aclamaciones.',
          'Mi siervo escogido: He aquí mi siervo, mi escogido en quien mi alma tiene contentamiento; Mateo lo aplica al Señor Jesús, manso y humilde.',
          'Llevó nuestras dolencias: Él llevó nuestras enfermedades y sufrió nuestros dolores; así describe Mateo sus sanidades, anticipo de la cruz.',
          'La piedra rechazada: La piedra que desecharon los edificadores vino a ser cabeza del ángulo: Cristo, rechazado y exaltado. · Bendito el que viene: Bendito el que viene en el nombre del Señor; así lo aclamaron al entrar en Jerusalén: «¡Hosanna!».',
          'La alabanza de los niños: De la boca de los niños afirmaste la alabanza; Jesús lo recordó cuando los pequeños lo aclamaban en el templo.',
          'La piedra angular preciosa: Dios pone en Sion una piedra probada, angular y preciosa; Pedro y Pablo la reconocen en Cristo, fundamento seguro: «el que creyere, no será avergonzado».',
          'El celo por la casa de Dios: «Me consumió el celo de tu casa», dice el salmo; sus discípulos lo recordaron cuando Jesús purificó el templo.',
          'Luz para las naciones: El Siervo del Señor sería luz de las naciones y salvación hasta lo último de la tierra; en Cristo la salvación alcanza a los gentiles.',
          'Despreciado y desechado: Despreciado y desechado entre los hombres; vino a lo suyo, y los suyos no le recibieron.',
          'Aborrecido sin causa: «Se han aumentado... los que me aborrecen sin causa», clama el salmista; Jesús mismo cita estas palabras la noche antes de morir: «Sin causa me aborrecieron».',
          'El anuncio no creído: «¿Quién ha creído a nuestro anuncio?» Juan ve en la incredulidad ante Jesús el cumplimiento de la palabra de Isaías.',
          'Traicionado por un amigo: Aquel que comía pan con Él levantó contra Él su calcañar; Judas, uno de los doce, lo entregó.',
          'Vendido por treinta piezas: Pesaron por su precio treinta piezas de plata, lo que Judas recibió por entregar al Señor.',
          'Herido el pastor: Herido el pastor, se dispersarían las ovejas; los discípulos huyeron cuando prendieron a Jesús.',
          'Callado ante sus acusadores: Como cordero llevado al matadero, enmudeció y no abrió su boca ante quienes lo acusaban.',
          'Golpeado y escupido: Dio su rostro a los que lo herían y escupían; así trataron a Jesús en su juicio.',
          'Herido por nuestras rebeliones: Fue herido por nuestras rebeliones, molido por nuestros pecados; por sus llagas fuimos sanados.',
          'Manos y pies horadados: Horadaron sus manos y sus pies, mucho antes de que existiera la crucifixión: cumplido en la cruz.',
          'Reparten sus vestidos: Repartieron entre sí sus vestidos y sobre su ropa echaron suertes, junto a la cruz.',
          'Hiel y vinagre: En su sed le dieron a beber vinagre, tal como fue escrito de antemano.',
          '¿Por qué me desamparaste?: El clamor «Dios mío, ¿por qué me has desamparado?» fue la voz del Salmo 22 desde la cruz.',
          'Ningún hueso quebrado: Él guarda todos sus huesos, ni uno será quebrado; no quebraron las piernas de Jesús en la cruz.',
          'Mirarán al que traspasaron: Mirarán al que traspasaron y harán duelo; el soldado abrió su costado con la lanza.',
          'Sepultado con los ricos: Se dispuso su sepultura con los ricos; José de Arimatea, hombre rico, lo puso en su propio sepulcro.',
          'Contado con transgresores: Fue contado con los transgresores, crucificado entre dos malhechores, e intercedió por ellos.',
          'Hecho maldición por nosotros: Maldito todo el que es colgado en un madero; Cristo nos redimió de la maldición, hecho por nosotros maldición.',
          'El pacto eterno, las misericordias de David: «Haré con vosotros pacto eterno, las misericordias firmes a David», promete Isaías; Pablo lo cita en Antioquía como prueba de que Cristo resucitó para no volver más a corrupción.',
          'No vería corrupción: No dejarías su alma en el Seol ni permitirías que tu Santo viera corrupción: Cristo resucitó al tercer día. · La senda de la vida: Me mostrarás la senda de la vida; Pedro lo proclama cumplido en la resurrección del Señor.',
          'El juramento a David: «Juró Jehová a David... de tu descendencia pondré sobre tu trono»; Pedro recuerda ese juramento en Pentecostés al proclamar que Dios resucitó a Cristo para sentarlo en su trono.',
          'Tú eres mi Hijo: «Mi Hijo eres tú, yo te engendré hoy»: Pablo lo aplica a la resurrección de Jesús.',
          'Sentado a la diestra: El Señor dijo a su Señor: «Siéntate a mi diestra»; Cristo ascendió y se sentó a la diestra de Dios.',
          'Subió a lo alto: Subiste a lo alto, llevaste cautiva la cautividad; Cristo ascendió y dio dones a los hombres.',
          'Tu trono es eterno, oh Dios: Tu trono, oh Dios, es eterno y para siempre; Hebreos lo dice del Hijo, Dios y Rey por los siglos.',
          'Sacerdote para siempre: Tú eres sacerdote para siempre según el orden de Melquisedec; Cristo es nuestro gran Sumo Sacerdote.',
          'El Hijo del Hombre: Vino uno como un Hijo de Hombre y le fue dado dominio eterno; Jesús se llamó así ante el sumo sacerdote.',
          'Invocar el nombre del Señor: «Todo aquel que invocare el nombre de Jehová será salvo», dice Joel; Pablo lo aplica a Cristo, Señor de todos, generoso con cuantos le invocan.',
          'El tabernáculo de David levantado: Dios prometió levantar el caído tabernáculo de David; Santiago ve la promesa cumplida en Cristo resucitado y en los gentiles que buscan al Señor.',
          'El Creador eterno: «Tú fundaste la tierra, y los cielos son obra de tus manos»; Hebreos dirige estas palabras al Hijo, el mismo ayer, hoy y por los siglos.',
          'Todo bajo sus pies: Dios sujetó todas las cosas bajo los pies del hombre; Hebreos lo ve cumplido en Jesús, coronado de gloria, a quien todo le será sometido.',
          'La muerte devorada para siempre: «Destruirá a la muerte para siempre», anuncia Isaías; Pablo cita la promesa cumplida cuando lo mortal se vista de inmortalidad: «Sorbida es la muerte en victoria».',
          'Rescatados del poder del Seol: «Oh muerte, yo seré tu muerte», promete Oseas; junto a Isaías 25:8, Pablo retoma el mismo clamor de victoria: «¿Dónde está, oh muerte, tu aguijón?».',
          'Cielos nuevos y tierra nueva: «He aquí que yo creo nuevos cielos y nueva tierra», anuncia Isaías; Juan ve esa promesa cumplida —un cielo nuevo y una tierra nueva— en la visión final donde el Cordero es la luz de la ciudad de Dios.',
          'El cordero de la Pascua: La sangre del cordero libraba de la muerte; «nuestra Pascua, que es Cristo, ya fue sacrificada por nosotros».',
          'La sangre del pacto: Moisés roció al pueblo con la sangre del pacto en el Sinaí; en la Última Cena, Jesús toma la copa y dice: «esto es mi sangre del nuevo pacto, que por muchos es derramada».',
          'La serpiente de bronce: Quien miraba la serpiente levantada vivía; así el Hijo del Hombre fue levantado, para que todo aquel que en Él cree tenga vida eterna.',
          'El cordero que Dios proveyó: Abraham dijo: «Dios proveerá el cordero»; Juan señaló a Jesús: «He aquí el Cordero de Dios que quita el pecado del mundo».',
          'El maná del cielo: Dios dio pan del cielo en el desierto; Jesús dijo: «Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre».',
          'La roca que dio agua: De la roca herida brotó agua para el pueblo; «y la roca era Cristo», de quien brota agua viva.',
          'El tabernáculo: Dios habitó en medio de su pueblo en el tabernáculo; «el Verbo se hizo carne y habitó entre nosotros».',
          'El día de la expiación: El sumo sacerdote entraba con sangre una vez al año; Cristo entró una vez para siempre por su propia sangre, hallando eterna redención.',
          'Melquisedec, sacerdote-rey: Melquisedec, rey y sacerdote sin genealogía, prefigura a Cristo, sacerdote para siempre según su orden.',
          'Las primicias: Se ofrecían las primicias de la cosecha; «Cristo ha resucitado, primicias de los que durmieron».',
          'Jonás, tres días: Como Jonás estuvo tres días en el vientre del gran pez, así el Hijo del Hombre estuvo tres días en el corazón de la tierra.',
          'El postrer Adán: El primer Adán fue hecho alma viviente; «el postrer Adán, espíritu vivificante». Lo que se perdió en uno, en Cristo recibe vida.',
          'El velo del templo: El velo cerraba el paso al Lugar Santísimo; por su carne, Cristo abrió «un camino nuevo y vivo» hasta la presencia de Dios.',
          'El macho cabrío que carga las culpas: El macho cabrío llevaba sobre sí todas las iniquidades a tierra inhabitada; así Cristo fue ofrecido «para llevar los pecados de muchos».',
          'El reposo verdadero: Josué dio reposo en la tierra, mas no el definitivo; queda un reposo para el pueblo de Dios, en el que se entra por la fe en Jesús.',
        ],
      },
    },

    // Reading Plan Screen
    readingPlan: {
      changePlanTitle: 'Cambiar Plan de Lectura',
      changePlanMessage:
        '¿Estás seguro de que quieres cambiar tu plan de lectura actual? Tu progreso en el plan actual se guardará.',
      noPlanSelectedTitle: 'No hay plan seleccionado',
      noPlanSelectedMessage:
        'Por favor, selecciona un plan de lectura primero.',
      duration: 'Duración',
      days: 'días',
      currentPlanHint: 'Este es tu plan actual',
      selectPlanHint: 'Toca para seleccionar este plan',
      selected: 'Seleccionado',
      durationText: 'Duración',
      progress: 'Progreso',
      daysCompleted: 'días completados',
      dayLabel: 'Día',
      continueReading: 'Continuar Lectura',
      startPlan: 'Comenzar Plan',
      startContinueHint: 'Toca para comenzar o continuar tu plan de lectura',
      availablePlans: 'Planes de Lectura Disponibles',
      listLabel: 'Lista de planes de lectura',
      dayAutoCompleted: '✅ Día {{day}} de "{{plan}}" completado',
      todaySection: 'Hoy te toca',
      readDay: 'Leer',
      listenDay: 'Escuchar este día',
      chapterReadHint: 'Capítulo leído',
      paceNotStarted: 'Empieza hoy — el Día 1 te espera',
      paceOnTrack: 'Vas al día 🙌',
      paceAhead: 'Llevas {{n}} días de ventaja',
      paceAheadOne: 'Llevas 1 día de ventaja',
      paceBehind: 'Te esperan {{n}} días — a tu ritmo, sin prisa',
      paceBehindOne: 'Te espera 1 día — a tu ritmo, sin prisa',
      catchUpTitle: 'Ponte al día',
      catchUpToday: 'Para ponerte al día: {{readings}}',
      catchUpFinish: 'A un día por jornada desde hoy, terminas el {{date}}',
      planCompleted: '¡Plan completado!',
      planCompletedShort: '¡Completado! 🎉',
      planCompletedMessage:
        'Terminaste «{{plan}}». Que su Palabra siga habitando en ti.',
      planCompletedCta: 'Amén',
      planNextUp: 'Día {{day}} · {{readings}}',
      playlistDayLabel: 'Día {{day}} · {{plan}}',
      durationPickerLabel: 'Duración del plan',
      durationPickerHint:
        'El mismo contenido, a tu ritmo. Se puede ajustar solo antes de empezar.',
      durationPickerDays: '{{n}} días',
      durationPickerPace: '≈{{n}} capítulos por día',
      restartPlan: 'Reiniciar plan',
      restartPlanConfirm:
        'Esto borra los días marcados para volver a empezar desde el Día 1. Tu logro de haberlo completado antes se conserva.',
      restartPlanConfirmInProgress:
        'Esto borra tus días marcados hasta ahora para volver a empezar desde el Día 1.',
      planRestarted: 'Plan reiniciado — ¡Día 1 te espera!',
    },

    // Daily Verse Notifications
    notifications: {
      title: 'Notificaciones',
      dailyVerse: 'Versículo del día',
      dailyVerseDesc: 'Recibe el versículo del día a la hora que elijas',
      time: 'Hora del recordatorio',
      enabled: 'Recordatorio diario activado',
      disabled: 'Recordatorio diario desactivado',
      memoryReminder: 'Recordatorio de repaso',
      memoryReminderDesc: 'Te recordamos repasar tus versículos cada día',
      memoryReminderEnabled: 'Recordatorio de repaso activado',
      memoryReminderDisabled: 'Recordatorio de repaso desactivado',
      prayerReminderTitle: 'Recordatorio de oración',
      prayerReminder: 'Recordatorio de oración',
      prayerReminderDesc:
        'Una invitación gentil a orar cada día, a la hora que elijas',
      prayerReminderEnabled: 'Recordatorio de oración activado',
      prayerReminderDisabled: 'Recordatorio de oración desactivado',
      devotionReminderTitle: 'Recordatorio de devoción',
      devotionReminder: 'Tiempo en la Palabra',
      devotionReminderDesc:
        'Una invitación gentil a pasar tiempo en la Palabra cada día, a la hora que elijas',
      devotionReminderEnabled: 'Recordatorio de devoción activado',
      devotionReminderDisabled: 'Recordatorio de devoción desactivado',
      prophecyReminderTitle: 'Profecía del día',
      prophecyReminder: 'Profecía del día',
      prophecyReminderDesc:
        'Recibe cada día un paso del hilo profético que anuncia a Cristo, a la hora que elijas',
      prophecyReminderEnabled: 'Recordatorio de profecía activado',
      prophecyReminderDisabled: 'Recordatorio de profecía desactivado',
      permissionDeniedTitle: 'Permiso necesario',
      permissionDeniedMessage:
        'Para recibir el versículo diario, activa las notificaciones de la app en los ajustes del sistema.',
    },

    // Achievements System
    achievements: {
      title: 'Mis Logros',
      yourAchievements: 'Tus Logros',
      yourStats: 'Tus Estadísticas',
      loading: 'Cargando logros...',
      unlocked: 'Desbloqueado',
      locked: 'Bloqueado',
      viewAll: 'Ver Todos',
      filterAll: 'Todos',
      unlockTitle: '¡Logro Desbloqueado!',
      unlockMessage: 'Has desbloqueado:',
      pointsEarned: 'Has ganado',
      points: 'puntos',
      awesome: '¡Genial!',
      viewAchievements: 'Ver Logros',
      ok: 'OK',
      readingRegistered: 'Lectura Registrada',
      readingStats:
        'Has leído {{verses}} versículos en total.\nNivel {{level}} - {{points}} puntos\n\nSigue leyendo para desbloquear más logros!',
      testButton: 'Prueba los Logros',
      testDescription:
        'Toca aquí para simular la lectura de 10 versículos y ver cómo funciona el sistema de logros',
      simulateReading: 'Simular Lectura',
      errorTracking: 'Hubo un problema al registrar la lectura',
      level: 'Nivel',
      to: 'para',
      current: 'actual',
      longest: 'máxima',
      versesRead: 'Versículos leídos',
      chaptersRead: 'Capítulos',
      booksCompleted: 'Libros completados',
      readingTime: 'Tiempo de lectura',
      currentStreak: 'Racha actual',
      longestStreak: 'Racha máxima',
      totalPoints: 'Puntos totales',
      pointsNeeded: 'puntos para',
      pts: 'pts',
      achievementsUnlocked: 'Desbloqueados',
      almostThere: 'A punto de lograrse',
      almostThereA11y:
        '{{name}}: {{current}} de {{requirement}} para desbloquear',
      almostThereHint: 'Toca para ver de qué se trata',
      viewMyTitles: 'Mis títulos',
      viewMyTitlesA11y: 'Ver mis insignias y títulos equipables',
      shareTitle: 'Compartir logro',
      shareUnlockedLabel: 'Logro desbloqueado',
      shareLongPressA11y: 'Mantén pulsado para compartir este logro',
      nextMilestone: 'Próximo hito',
      nextMilestoneA11y:
        'Próximo hito: {{name}}, {{current}} de {{requirement}}. Ver logros.',
      categories: {
        reading: 'Lectura',
        streak: 'Rachas',
        chapters: 'Capítulos',
        books: 'Libros',
        highlights: 'Destacados',
        notes: 'Notas',
        search: 'Búsqueda',
        time: 'Tiempo',
        special: 'Especiales',
      },
      rarities: {
        common: 'Común',
        uncommon: 'Poco común',
        rare: 'Raro',
        epic: 'Épico',
        legendary: 'Legendario',
      },
      tiers: {
        bronze: 'Bronce',
        silver: 'Plata',
        gold: 'Oro',
        platinum: 'Platino',
        diamond: 'Diamante',
      },
      inProgress: 'En progreso',
      legend: 'Leyenda',
      noCategoryAchievements: 'No hay logros en esta categoría',
      definitions: {
        first_verse: {
          name: 'Primeros Pasos',
          description: 'Lee tu primer versículo',
        },
        verses_10: {
          name: 'Lector Dedicado',
          description: 'Lee 10 versículos',
        },
        verses_100: {
          name: 'Estudiante Diligente',
          description: 'Lee 100 versículos',
        },
        verses_500: {
          name: 'Lector Devoto',
          description: 'Lee 500 versículos',
        },
        verses_1000: {
          name: 'Maestro de la Palabra',
          description: 'Lee 1000 versículos',
        },
        verses_5000: {
          name: 'Erudito Bíblico',
          description: 'Lee 5000 versículos',
        },
        streak_3: {
          name: 'Compromiso Iniciado',
          description: 'Lee 3 días seguidos',
        },
        streak_7: {
          name: 'Semana Constante',
          description: 'Lee 7 días seguidos',
        },
        streak_30: {
          name: 'Mes Victorioso',
          description: 'Lee 30 días seguidos',
        },
        streak_100: {
          name: 'Disciplina Inquebrantable',
          description: 'Lee 100 días seguidos',
        },
        streak_365: {
          name: 'Año de Dedicación',
          description: 'Lee 365 días seguidos',
        },
        first_chapter: {
          name: 'Primer Capítulo',
          description: 'Completa tu primer capítulo',
        },
        chapters_10: {
          name: 'Explorador de Capítulos',
          description: 'Completa 10 capítulos',
        },
        chapters_50: {
          name: 'Viajero de la Palabra',
          description: 'Completa 50 capítulos',
        },
        chapters_150: {
          name: 'Conquistador de Capítulos',
          description: 'Completa 150 capítulos',
        },
        first_book: {
          name: 'Primer Libro',
          description: 'Completa tu primer libro de la Biblia',
        },
        books_5: {
          name: 'Pentateuco Leído',
          description: 'Completa 5 libros',
        },
        books_27: {
          name: 'Nuevo Testamento Completo',
          description: 'Completa los 27 libros del NT',
        },
        books_39: {
          name: 'Antiguo Testamento Completo',
          description: 'Completa los 39 libros del AT',
        },
        books_66: {
          name: '¡Biblia Completa!',
          description: 'Completa los 66 libros de la Biblia',
        },
        first_highlight: {
          name: 'Primera Marca',
          description: 'Crea tu primer resaltado',
        },
        highlights_25: {
          name: 'Coleccionista de Tesoros',
          description: 'Crea 25 resaltados',
        },
        highlights_100: {
          name: 'Archivista de Verdades',
          description: 'Crea 100 resaltados',
        },
        first_note: {
          name: 'Primera Reflexión',
          description: 'Escribe tu primera nota',
        },
        notes_50: {
          name: 'Diario Espiritual',
          description: 'Escribe 50 notas',
        },
        first_search: {
          name: 'Buscador de la Verdad',
          description: 'Realiza tu primera búsqueda',
        },
        searches_50: {
          name: 'Investigador Diligente',
          description: 'Realiza 50 búsquedas',
        },
        time_60: {
          name: 'Una Hora de Lectura',
          description: 'Lee durante 60 minutos acumulados',
        },
        time_300: {
          name: 'Cinco Horas de Estudio',
          description: 'Lee durante 5 horas acumuladas',
        },
        time_1000: {
          name: 'Estudiante Consagrado',
          description: 'Lee durante 1000 minutos',
        },
        psalms_complete: {
          name: 'Salmista',
          description: 'Completa el libro de Salmos',
        },
        proverbs_complete: {
          name: 'Sabio',
          description: 'Completa el libro de Proverbios',
        },
        gospels_complete: {
          name: 'Evangelista',
          description: 'Completa los 4 evangelios',
        },
        early_bird: {
          name: 'Madrugador',
          description: 'Lee antes de las 6 AM',
        },
        night_owl: {
          name: 'Ave Nocturna',
          description: 'Lee después de las 11 PM',
        },
        prophetic_thread: {
          name: 'Cristo en toda la Escritura',
          description: 'Recorre todo el hilo profético',
        },
        bible_routes: {
          name: 'Viajero de la Palabra',
          description: 'Explora todas las paradas de todas las rutas bíblicas',
        },
        kids_first_story: {
          name: 'Primera historia',
          description: 'Completa tu primera historia de la Biblia para niños',
        },
        kids_stories_complete: {
          name: 'Narrador de historias',
          description: 'Completa todas las historias de la Biblia para niños',
        },
      },
    },

    // Empty States
    emptyStates: {
      noFavorites: {
        title: 'Sin favoritos aun',
        message:
          'Guarda tus versiculos favoritos para acceder a ellos rapidamente',
        action: 'Explorar la Biblia',
      },
      noNotes: {
        title: 'Sin notas todavía',
        message: 'Crea notas personales para reflexionar sobre tu lectura',
        action: 'Empezar a leer',
      },
      noHighlights: {
        title: 'Sin resaltados',
        message: 'Resalta versículos importantes mientras lees',
        action: 'Abrir Biblia',
      },
      noSearchResults: {
        title: 'Sin resultados',
        message: 'Intenta con otras palabras clave o términos',
        action: 'Limpiar búsqueda',
      },
      noAchievements: {
        title: 'Sin logros desbloqueados',
        message: 'Lee la Biblia diariamente para desbloquear logros',
        action: 'Ver desafíos',
      },
      noReadingPlan: {
        title: 'Sin plan de lectura activo',
        message: 'Elige un plan para guiar tu lectura diaria',
        action: 'Explorar planes',
      },
      noBookmarks: {
        title: 'Sin marcadores aún',
        message:
          'Marca versículos mientras lees para volver fácilmente a ellos',
        action: 'Abrir la Biblia',
      },
    },

    // Version Comparison (V5.1)
    versionComparison: {
      title: 'Comparación de Versiones',
      selectVersions: 'Seleccionar Versiones',
      addVersion: 'Agregar',
      removeVersion: 'Quitar',
      compareButton: 'Comparar',
      saveComparison: 'Guardar Comparación',
      savedComparisons: 'Comparaciones Guardadas',
      analysis: 'Análisis de Diferencias',
      similarity: 'Similaridad',
      commonWords: 'Palabras comunes',
      uniqueWords: 'Palabras únicas',
      highlightDifferences: 'Resaltar diferencias',
      contrastSameLangHint:
        'Funciona mejor entre versiones del mismo idioma (KJV ↔ WEB)',
      shareImage: 'Compartir como imagen',
      shareAllImage: 'Compartir todas',
      observations: 'Observaciones',
      verse: 'Verso',
      words: 'palabras',
      verseOmitted:
        'Este versículo no aparece en {{version}} (omitido en el texto crítico).',
      selectVerse: 'Seleccionar Versículo',
      multiSelectMode: 'Múltiple',
      simpleMode: 'Simple',
      versesSelected: 'versículos seleccionados',
      clearSelection: 'Limpiar',
      applySelection: 'Aplicar Selección',
      noComparisons: 'No tienes comparaciones guardadas',
      comparisonName: 'Nombre de la comparación',
      notes: 'Notas',
      saveSuccess: 'Comparación guardada',
      deleteConfirm: '¿Eliminar esta comparación?',
      loadComparison: 'Cargar',
      maxVersionsWarning: 'Solo puedes comparar hasta 4 versiones a la vez',
      loadComparisonsError: 'No se pudieron cargar las comparaciones guardadas',
      nameRequired: 'Por favor ingresa un nombre para la comparación',
      updateSuccess: 'Comparación actualizada correctamente',
      saveError: 'No se pudo guardar la comparación',
      invalidData: 'Datos de comparación inválidos',
      noVersionsSelected: 'No hay versiones seleccionadas en esta comparación',
      noValidVersions: 'La comparación no contiene versiones válidas',
      loadedComparison: 'Cargada: {{name}}',
      untitledComparison: 'Comparación',
      loadError: 'Error al cargar la comparación',
      deleteTitle: 'Eliminar comparación',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      deleteSuccess: 'Comparación eliminada',
      deleteError: 'No se pudo eliminar la comparación',
      editComparison: 'Editar Comparación',
      update: 'Actualizar',
      save: 'Guardar',
      minVersionsError: 'Se necesitan al menos 2 versiones para comparar',
      insightVerySimilar: 'Las versiones son muy similares en este verso',
      insightMinorDiff: 'Las versiones tienen diferencias menores',
      insightSignificantDiff: 'Las versiones tienen diferencias significativas',
      insightWordDiff:
        'Diferencia de {{count}} palabras entre la versión más corta y más larga',
      insightUniqueWords: '{{count}} palabras únicas encontradas',
      versionDescriptions: {
        rvr1960: 'Versión tradicional más utilizada en español',
        nvi: 'Traducción moderna y fácil de entender',
        lbla: 'Traducción literal muy precisa',
        dhh: 'Lenguaje contemporáneo y accesible',
        kjv: 'Traducción clásica en inglés',
        nlt: 'Inglés moderno y fácil de leer',
        local: 'Versión local cargada en memoria',
      },
    },

    // Badge System (V5.1)
    badgeSystem: {
      title: 'Insignias y Títulos',
      collectionTitle: 'Colección de Logros',
      myBadges: 'Mis Insignias',
      myTitles: 'Mis Títulos',
      allBadges: 'Todas las Insignias',
      equip: 'Equipar',
      unequip: 'Desequipar',
      equipped: 'Equipada',
      equippedTitle: 'Título equipado',
      unlockedToast: '🏆 ¡Insignia desbloqueada: {{name}}!',
      noTitles: 'Aún no has desbloqueado ningún título',
      noTitlesDescription: 'Completa logros para obtener títulos especiales',
      viewAllAchievements: 'Ver todos los logros',
      viewAllAchievementsA11y: 'Ir a la pantalla de logros',
      shareTitleAction: 'Compartir título',
      shareEarnedLabel: 'Título obtenido',
      shareTitleA11y: 'Compartir este título como imagen',
      unlock: 'Desbloquear',
      locked: 'Bloqueada',
      unlocked: 'Desbloqueados',
      completed: 'Completado',
      all: 'Todos',
      rarity: {
        common: 'Común',
        rare: 'Rara',
        epic: 'Épica',
        legendary: 'Legendaria',
        mythic: 'Mítica',
      },
      progress: 'Progreso',
      requirements: 'Requisitos',
      reward: 'Recompensa',
      category: {
        reading: 'Lectura',
        streak: 'Racha',
        chapters: 'Capítulos',
        books: 'Libros',
        special: 'Especial',
        completion: 'Completación',
        knowledge: 'Conocimiento',
        social: 'Social',
      },
      // Badge names and descriptions
      badges: {
        first_verse: {
          name: 'Primera Lectura',
          description: 'Lee tu primer verso',
        },
        hundred_verses: {
          name: 'Lector Dedicado',
          description: 'Lee 100 versos',
        },
        thousand_verses: {
          name: 'Estudiante de la Palabra',
          description: 'Lee 1,000 versos',
        },
        five_thousand_verses: {
          name: 'Maestro de las Escrituras',
          description: 'Lee 5,000 versos',
        },
        week_streak: {
          name: 'Constancia Semanal',
          description: 'Mantén una racha de 7 días',
        },
        month_streak: {
          name: 'Fidelidad Mensual',
          description: 'Mantén una racha de 30 días',
        },
        hundred_day_streak: {
          name: 'Centurión de la Fe',
          description: 'Mantén una racha de 100 días',
        },
        year_streak: {
          name: 'Guardián del Pacto',
          description: 'Mantén una racha de 365 días',
        },
        first_book: {
          name: 'Primer Libro Completado',
          description: 'Completa tu primer libro de la Biblia',
        },
        new_testament: {
          name: 'Testigo del Nuevo Pacto',
          description: 'Completa todo el Nuevo Testamento',
        },
        old_testament: {
          name: 'Guardián de la Ley',
          description: 'Completa todo el Antiguo Testamento',
        },
        full_bible: {
          name: 'Conocedor de la Palabra',
          description: 'Completa toda la Biblia',
        },
        quiz_master: {
          name: 'Maestro del Conocimiento',
          description: 'Responde correctamente 50 preguntas',
        },
        memory_verse_10: {
          name: 'Mente Iluminada',
          description: 'Memoriza 10 versos',
        },
        memory_verse_50: {
          name: 'Tesoro Viviente',
          description: 'Memoriza 50 versos',
        },
        midnight_reader: {
          name: 'Vigilia Nocturna',
          description: 'Lee entre la medianoche y las 3 AM',
        },
        early_bird: {
          name: 'Madrugador de Dios',
          description: 'Lee antes de las 6 AM durante 7 días',
        },
        share_master: {
          name: 'Evangelizador Digital',
          description: 'Comparte 25 versos',
        },
        christmas_special: {
          name: 'Estrella de Belén',
          description: 'Lee en Navidad',
        },
      },
      // Title names and descriptions
      titles: {
        title_reader: {
          name: 'Lector Devoto',
          description: 'Has demostrado dedicación a la lectura',
          prefix: 'Lector',
        },
        title_scholar: {
          name: 'Estudiante de las Escrituras',
          description: 'Tu conocimiento de la Palabra es notable',
          prefix: 'Estudiante',
        },
        title_master: {
          name: 'Maestro de la Palabra',
          description: 'Dominas las Escrituras',
          prefix: 'Maestro',
        },
        title_faithful: {
          name: 'El Fiel',
          description: 'Tu constancia es admirable',
          suffix: 'el Fiel',
        },
        title_centurion: {
          name: 'Centurión de la Fe',
          description: '100 días de devoción inquebrantable',
          prefix: 'Centurión',
        },
        title_guardian: {
          name: 'Guardián del Pacto',
          description: 'Un año de compromiso espiritual',
          prefix: 'Guardián',
        },
        title_witness: {
          name: 'Testigo del Nuevo Pacto',
          description: 'Has completado el Nuevo Testamento',
          prefix: 'Testigo',
        },
        title_lawkeeper: {
          name: 'Guardián de la Ley',
          description: 'Has completado el Antiguo Testamento',
          prefix: 'Guardián',
          suffix: 'de la Ley',
        },
        title_wordbearer: {
          name: 'Portador de la Palabra',
          description: 'Has leído toda la Biblia',
          prefix: 'Portador',
          suffix: 'de la Palabra',
        },
        title_illuminated: {
          name: 'El Iluminado',
          description: 'Tu mente guarda la Palabra',
          suffix: 'el Iluminado',
        },
        title_treasure: {
          name: 'Tesoro Viviente',
          description: 'La Palabra vive en tu corazón',
          prefix: 'Tesoro Viviente',
        },
        title_earlybird: {
          name: 'Madrugador de Dios',
          description: 'Inicias el día con la Palabra',
          prefix: 'Madrugador',
        },
        title_star: {
          name: 'Estrella de Belén',
          description: 'Celebraste a Cristo en Su nacimiento',
          prefix: 'Estrella',
          suffix: 'de Belén',
        },
      },
    },

    // Mission System (V5.1)
    missions: {
      // Daily missions
      daily: {
        lector_diario: {
          title: 'Lector Diario',
          description: 'Lee al menos 10 versículos hoy',
        },
        reflexion_personal: {
          title: 'Reflexión Personal',
          description: 'Agrega 1 nota a un versículo',
        },
        estudioso: {
          title: 'Estudioso',
          description: 'Completa 1 capítulo completo',
        },
        compartir_palabra: {
          title: 'Compartir la Palabra',
          description: 'Comparte 1 versículo con alguien',
        },
      },
      // Weekly missions
      weekly: {
        lector_dedicado: {
          title: 'Lector Dedicado',
          description: 'Lee 50 versículos esta semana',
        },
        guerrero_fin_semana: {
          title: 'Guerrero del Fin de Semana',
          description: 'Lee ambos días del fin de semana',
        },
        maestro_organizador: {
          title: 'Maestro Organizador',
          description: 'Agrega 10 resaltados esta semana',
        },
        evangelista: {
          title: 'Evangelista',
          description: 'Comparte 5 versículos esta semana',
        },
      },
      // Special missions
      special: {
        explorando: 'Explorando',
        lee_cualquier: 'Lee cualquier capítulo de',
      },
      // Reward names
      rewards: {
        puntos: 'Puntos',
        badge_lector_semanal: 'Badge: Lector Semanal',
        badge_evangelista: 'Badge: Evangelista',
      },
    },

    // Widgets (V5.1)
    widgets: {
      title: 'Widgets',
      subtitle: 'El verso del día, fijo en tu pantalla de inicio',
      verseOfDay: 'Verso del Día',
      verseOfDayDesc:
        'Inspiración diaria directamente en tu pantalla de inicio',
      howToUse: 'Cómo añadirlo a tu pantalla de inicio',
      howToUseSteps: {
        step1: 'Mantén presionada un área vacía de tu pantalla de inicio',
        step2: 'Toca "Widgets"',
        step3: 'Busca "Eternal Bible" en la lista',
        step4: 'Mantén presionado el widget y arrástralo a tu pantalla',
        step5: '¡Listo! El verso del día te acompañará cada mañana',
      },
      note: 'El widget se actualiza una vez al día y se adapta al tema claro u oscuro de tu teléfono.',
    },

    // Settings V5.1 Section
    settingsV51: {
      title: 'Funcionalidades',
      widgets: 'Widgets',
      widgetsDesc: 'Vista previa de widgets para pantalla de inicio',
      versionComparison: 'Comparación de Versiones',
      versionComparisonDesc: 'Compara versículos en diferentes traducciones',
      badges: 'Insignias y Títulos',
      badgesDesc: 'Sistema de logros con insignias coleccionables',
    },
    // 🤝 "Juntos sin servidor" — shared reading plans (Sprint 107)
    together: {
      shareTitle: 'Leer en grupo',
      shareIntro:
        'Invita a otros a leer este plan contigo. Cada quien lo sigue en su propio dispositivo, con su progreso privado — sin cuentas ni servidores.',
      startsOn: 'Empieza el',
      today: 'Hoy',
      groupNameLabel: 'Nombre del grupo (opcional)',
      groupNamePlaceholder: 'Ej: Familia, Célula, 3.º B',
      yourCode: 'Código',
      share: 'Compartir invitación',
      copyLink: 'Copiar enlace',
      copyCode: 'Copiar código',
      copied: 'Copiado',
      inviteMessage:
        '📖 Te invito a leer juntos: {{plan}}, empezando el {{date}}.\n\nÁbrelo en Eternal Bible:\n{{link}}\n\n¿No te abre el enlace? Usa el código {{code}} en Ajustes → Unirme a un grupo.',
      importTitle: 'Unirte a un grupo',
      invitedTo: 'Te invitaron a leer juntos',
      willStart: 'Comienza el {{date}}',
      withGroup: 'con {{group}}',
      privateProgress:
        'Tu progreso es privado y queda en tu dispositivo. Puedes salir cuando quieras.',
      join: 'Unirme y empezar',
      joinedToast: '¡Listo! Encontrarás el plan en tu inicio.',
      enterCode: 'Unirme a un grupo',
      enterCodeIntro:
        'Ingresa el código que te compartieron para leer un plan en grupo.',
      enterCodePlaceholder: 'EB1-…',
      continueLabel: 'Continuar',
      codeInvalid: 'Ese código no es válido. Revisa que esté completo.',
      codeUnknownPlan:
        'Ese plan no existe en esta versión de la app. Actualízala e inténtalo de nuevo.',
      linkInvalid: 'No pudimos leer esa invitación.',
      linkVersion:
        'Esta invitación es de una versión más nueva. Actualiza la app.',
      readingWith: 'Leyendo con {{group}}',
      readingTogether: 'Leyendo en grupo',
      leaveGroup: 'Salir del grupo',
      joinFeatureDesc:
        'Lee un plan con tu familia o grupo, cada quien en su app',
      shareCustomTitle: 'Compartir mi plan',
      shareCustomIntro:
        'Comparte tu plan por enlace. Quien lo reciba lo lee en su propia app, a su ritmo.',
      shareCustomMessage:
        '📖 Te comparto un plan de lectura que armé: {{plan}}.\n\nÁbrelo en Eternal Bible:\n{{link}}\n\n¿No te abre el enlace? Copia este mensaje y pégalo en Ajustes → Unirme a un grupo.',
      customLinkNote: 'Se comparte por enlace (no tiene código corto).',
      customInvitedTo: 'Te compartieron un plan',
      customMeta: '{{days}} días · {{chapters}} capítulos',
      importPlan: 'Importar y empezar',
      importedToast: '¡Plan importado! Lo encontrarás en tu inicio.',
      pasteOrCodeIntro:
        'Pega el enlace o ingresa el código que te compartieron.',
      pasteOrCodePlaceholder: 'Enlace o EB1-…',
      pasteDetected: 'Pegar invitación copiada',
      deletePlan: 'Eliminar plan',
      deletePlanConfirm:
        'Se quitará de tus planes. Podrás volver a importarlo o crearlo de nuevo.',
      planDeleted: 'Plan eliminado',
      shareStudyTitle: 'Compartir este estudio',
      shareStudyIntro:
        'Comparte tu bosquejo por enlace. Quien lo reciba lo verá como estudio navegable (solo lectura), en su propio idioma.',
      shareStudyMessage:
        '📖 Te comparto un estudio de {{passage}}.\n\nÁbrelo en Eternal Bible:\n{{link}}\n\n¿No te abre el enlace? Copia este mensaje y pégalo en Ajustes → Unirme a un grupo.',
      shareStudy: 'Compartir estudio',
    },
    sharedStudy: {
      title: 'Estudio compartido',
      banner: 'Te lo compartió alguien · solo lectura',
      by: 'Compartido por {{who}}',
      invalid: 'No pudimos abrir este estudio.',
      empty:
        'Este estudio no trae notas. Abre el pasaje en tu Mesa para estudiarlo.',
      openInPrep: 'Abrir en mi Mesa',
      teacherNote: 'Nota del autor',
    },
    devotionalShared: {
      title: 'Devocional compartido',
      banner: 'Te lo compartió alguien · solo lectura',
      invalid: 'No pudimos abrir este devocional.',
      todayLabel: 'Hoy',
      dayN: 'Día {{n}}',
      daysMeta: 'Devocional · {{n}} días',
      startsOn: 'Comienza el {{date}}',
      finished: 'Este devocional terminó',
      allDays: 'Todos los días',
    },
    devotionalBuilder: {
      entryTitle: 'Crear un devocional',
      entryDesc: 'Arma un versículo por día y compártelo con tu grupo',
      title: 'Crear un devocional',
      intro:
        'Elige un versículo (y una nota corta opcional) para cada día. Comparte el enlace: con una fecha de inicio, todos verán el mismo cada día.',
      nameLabel: 'Título',
      namePlaceholder: 'Ej: Una semana en los Salmos',
      startLabel: 'Comienza',
      startToday: 'Hoy',
      daysLabel: 'Días',
      noDays: 'Aún no has añadido días.',
      addDay: 'Añadir día',
      pickVerse: 'Elige un versículo',
      chapter: 'Capítulo',
      verse: 'Versículo',
      notePlaceholder: 'Nota corta (opcional)',
      removeDay: 'Quitar día',
      dayN: 'Día {{n}}',
      changeBook: 'Cambiar libro',
      addThisDay: 'Añadir',
      share: 'Compartir devocional',
      needOneDay: 'Añade al menos un día con un versículo.',
      shareMessage:
        '🗓️ Te comparto un devocional: {{title}}\n\nÁbrelo en Eternal Bible:\n{{link}}',
    },
    planBuilder: {
      title: 'Crear un plan',
      cardTitle: 'Crear un plan',
      cardSubtitle: 'Arma tu propio plan de lectura',
      intro:
        'Arma tu propio plan: elige pasajes y un ritmo, y la app reparte los capítulos por días.',
      nameLabel: 'Nombre del plan',
      namePlaceholder: 'Ej: Juan en una semana',
      passagesLabel: 'Pasajes',
      addPassage: 'Añadir pasaje',
      noPassages: 'Aún no has añadido pasajes.',
      pickBook: 'Elige un libro',
      changeBook: 'Cambiar libro',
      fromChapter: 'Desde el capítulo',
      toChapter: 'Hasta el capítulo',
      addThisPassage: 'Añadir pasaje',
      paceLabel: 'Ritmo',
      pacePerDay: 'Capítulos por día',
      paceTotalDays: 'Número de días',
      previewEmpty: 'Añade pasajes para ver el plan',
      preview: '{{days}} días · {{chapters}} capítulos',
      create: 'Crear y empezar',
      editTitle: 'Editar plan',
      save: 'Guardar cambios',
      updated: '¡Plan actualizado!',
      needNameAndPassage: 'Ponle un nombre y añade al menos un pasaje.',
      created: '¡Plan creado!',
      removePassage: 'Quitar pasaje',
    },

    kids: {
      cardTitle: 'Biblia para niños',
      cardSubtitle: 'Historias para leer y contar',
      title: 'Biblia para niños',
      subtitle: 'Historias de la Biblia, paso a paso',
      intro:
        'Estas historias están pensadas para que un niño las lea solo, o para que un adulto se las lea en voz alta. Cada escena viene de un versículo real — tócalo para escucharlo o verlo tal como está escrito.',
      scenesCount: '{{n}} escenas',
      completed: 'Completada',
      sceneOf: 'Escena {{n}} de {{total}}',
      listen: 'Escuchar',
      stopListening: 'Detener',
      showVerse: 'Ver el versículo',
      hideVerse: 'Ocultar versículo',
      missingVerse: 'Versículo no disponible',
      next: 'Siguiente',
      previous: 'Anterior',
      listenAll: 'Escuchar todo',
      listenAllHint:
        'Consejo: "Escuchar todo" narra toda la historia seguida, sin que tengas que tocar nada.',
      quiz: {
        start: 'Comenzar el reto',
        question: 'Pregunta {{n}} de {{total}}',
        correct: '¡Correcto!',
        wrong: 'Casi — inténtalo de nuevo',
        retry: 'Intentar de nuevo',
        score: '{{n}} de {{total}} estrellas',
        finish: 'Terminar',
      },
      teach: {
        title: 'Para enseñar',
        readFull: 'Lectura completa',
        contextTitle: 'Contexto',
        talkTitle: 'Para conversar',
        openInReader: 'Abrir en el lector',
      },
      plan: {
        cardTitle: 'Plan de 10 días',
        cardSubtitle: 'Una historia cada día',
        title: 'Plan de 10 días',
        subtitle: 'Una historia bíblica cada día',
        intro:
          'Lee o escucha una historia distinta cada día durante 10 días. Puedes adelantarte o ir a tu ritmo — no hay ninguna prisa.',
        dayLabel: 'Día {{n}}',
        today: 'Hoy',
        completed: 'Completada',
        progress: '{{done}} de {{total}} días',
        goToToday: 'Ir a la historia de hoy',
        paceNotStarted: 'Empieza hoy — el Día 1 te espera',
        paceOnTrack: 'Vas al día 🙌',
        paceAhead: 'Llevas {{n}} días de ventaja',
        paceAheadOne: 'Llevas 1 día de ventaja',
        paceBehind: 'Te esperan {{n}} días — a tu ritmo, sin prisa',
        paceBehindOne: 'Te espera 1 día — a tu ritmo, sin prisa',
        paceComplete: '¡Completaste las 10 historias! 🎉',
      },
      stories: {
        creation: {
          title: 'La Creación',
          subtitle: 'Dios hizo todas las cosas',
          refLabel: 'Génesis 1–2',
          teachContext:
            'Génesis 1 y 2 narran cómo Dios creó el universo en seis días y descansó el séptimo. No es un mito entre otros: es el fundamento de toda la Biblia — Dios como creador de todo lo que existe, y las personas hechas a su imagen.',
          teachQuestions: [
            '¿Qué parte de la Creación te parece más asombrosa? ¿Por qué?',
            '¿Qué significa que Dios nos hizo "a su imagen"?',
            '¿Por qué crees que Dios descansó el séptimo día, si Él no se cansa?',
          ],
          scenes: {
            'creation-1': {
              text: 'Antes de que existiera el sol, la luna o cualquier estrella, todo estaba oscuro y vacío. Entonces Dios habló: «Sea la luz». Y la luz apareció, solo porque Dios lo dijo. Así comenzó todo: con la palabra de Dios.',
            },
            'creation-2': {
              text: 'Dios separó las aguas de arriba de las aguas de abajo, y puso un gran espacio entre ellas: el cielo. Todavía no había plantas, ni animales, ni personas — solo cielo, agua y la palabra poderosa de Dios haciendo lugar para lo que vendría.',
            },
            'creation-3': {
              text: 'Dios juntó las aguas en un solo lugar y apareció la tierra seca. Después mandó a la tierra producir plantas: árboles, hierba y semillas de todo tipo, cada una según su especie. El mundo empezó a llenarse de verde.',
            },
            'creation-4': {
              text: 'Dios puso dos grandes luces en el cielo: el sol para gobernar el día y la luna para gobernar la noche. También hizo las estrellas. Desde entonces, el día y la noche siguen el orden que Dios estableció aquel día.',
            },
            'creation-5': {
              text: 'Dios llenó el mar de peces y el cielo de aves de toda clase. Los bendijo y les dijo que se multiplicaran. Por primera vez, el mundo se llenó de movimiento: aletas nadando y alas volando.',
            },
            'creation-6': {
              text: 'Por último, Dios hizo a los animales de la tierra, y luego creó al hombre y a la mujer a su propia imagen. Les dio la tarea de cuidar todo lo que Él había hecho. Dios miró todo lo creado y vio que era bueno en gran manera.',
            },
            'creation-7': {
              text: 'El día séptimo, Dios descansó de toda la obra que había hecho. No porque estuviera cansado, sino para bendecir ese día y apartarlo como especial. Así terminó la semana de la Creación.',
            },
          },
          quiz: {
            'creation-q1': {
              question: '¿Qué dijo Dios primero, según la Biblia?',
              options: [
                '«Sea la luz»',
                '«Hágase el mar»',
                '«Hagamos al hombre»',
              ],
            },
            'creation-q2': {
              question: '¿Qué hizo Dios el día séptimo?',
              options: [
                'Creó a los animales',
                'Descansó',
                'Hizo el sol y la luna',
              ],
            },
            'creation-q3': {
              question: '¿A imagen de quién hizo Dios al hombre?',
              options: [
                'A imagen de los ángeles',
                'A imagen de los animales',
                'A imagen de Dios mismo',
              ],
            },
          },
        },
        noah: {
          title: 'Noé y el arca',
          subtitle: 'Dios cumple su promesa',
          refLabel: 'Génesis 6–9',
          teachContext:
            'La maldad había llenado la tierra, y Dios decidió comenzar de nuevo a través de una sola familia fiel. El diluvio es a la vez un relato de juicio y de la fidelidad de Dios: Él salva a quien confía en Él y sella su promesa con una señal visible en el cielo.',
          teachQuestions: [
            '¿Por qué crees que Noé obedeció a Dios aunque nadie más lo hacía?',
            '¿Qué significa el arcoíris como promesa de Dios?',
            '¿Qué cosas nos pide Dios hoy que quizás parezcan difíciles de obedecer, como construir el arca le pareció a Noé?',
          ],
          scenes: {
            'noah-1': {
              text: 'Dios vio que la tierra se había llenado de maldad y decidió mandar un diluvio. Pero le dijo a Noé, un hombre justo, que construyera un arca de madera, con aposentos por dentro y por fuera, para salvar a su familia.',
            },
            'noah-2': {
              text: 'Dios le dijo a Noé que llevara al arca una pareja de cada tipo de animal, para que la vida siguiera después del diluvio. Noé obedeció exactamente lo que Dios le había mandado, y los animales entraron al arca de dos en dos.',
            },
            'noah-3': {
              text: 'Cuando todos estuvieron dentro, comenzó a llover. La lluvia cayó sobre la tierra durante cuarenta días y cuarenta noches, y las aguas subieron hasta cubrir toda la tierra. El arca flotó segura sobre las aguas.',
            },
            'noah-4': {
              text: 'Después de mucho tiempo, las aguas empezaron a bajar. El arca reposó sobre los montes de Ararat. La tierra que antes estaba cubierta de agua comenzó, poco a poco, a asomarse de nuevo.',
            },
            'noah-5': {
              text: 'Noé soltó una paloma para ver si la tierra ya estaba seca. La paloma regresó al arca trayendo en su pico una hoja de olivo recién cortada. Así Noé supo que las aguas habían disminuido sobre la tierra.',
            },
            'noah-6': {
              text: 'Cuando todos salieron del arca, Dios puso su arco —el arcoíris— en las nubes como señal de su promesa: nunca más destruiría la tierra con un diluvio. Cada vez que aparece un arcoíris, recuerda esa promesa de Dios.',
            },
          },
          quiz: {
            'noah-q1': {
              question: '¿De qué le mandó Dios a Noé construir el arca?',
              options: ['Madera de gofer', 'Piedra', 'Barro'],
            },
            'noah-q2': {
              question: '¿Qué trajo la paloma en su pico?',
              options: ['Una piedra', 'Una hoja de olivo', 'Un pez'],
            },
            'noah-q3': {
              question: '¿Qué puso Dios en las nubes como señal de su promesa?',
              options: ['Una estrella', 'Un arcoíris', 'Una paloma'],
            },
          },
        },
        joseph: {
          title: 'José y sus hermanos',
          subtitle: 'Dios encamina todo a bien',
          refLabel: 'Génesis 37–45',
          teachContext:
            'La historia de José muestra cómo Dios puede traer bien incluso de la traición y la injusticia, sin que eso signifique que el mal hecho por sus hermanos estuvo bien. El perdón de José a quienes lo dañaron es el punto culminante de todo el relato.',
          teachQuestions: [
            '¿Por qué crees que los hermanos de José le tuvieron envidia?',
            '¿Cómo pudo José perdonar a quienes le hicieron tanto daño?',
            '¿Alguna vez algo malo que te pasó terminó ayudando a otras personas, como con José?',
          ],
          scenes: {
            'joseph-1': {
              text: 'José era uno de los doce hijos de Jacob, y su padre lo amaba de manera especial. Sus hermanos, celosos porque José tenía sueños en los que ellos se inclinaban ante él, comenzaron a mirarlo con envidia y sin poder hablarle con paz.',
            },
            'joseph-2': {
              text: 'Un día, lejos de su padre, los hermanos de José lo vendieron a unos mercaderes que pasaban camino a Egipto. Le dijeron a su padre que un animal salvaje lo había matado, pero en verdad José había sido llevado como esclavo.',
            },
            'joseph-3': {
              text: 'En Egipto, José fue vendido como sirviente, y hasta injustamente puesto en la cárcel. Pero la Biblia dice que Jehová estaba con José: le dio éxito en todo lo que hacía, incluso en los momentos más difíciles.',
            },
            'joseph-4': {
              text: 'Dios le dio a José la capacidad de explicar el significado de un sueño del faraón: vendrían siete años de mucha comida y luego siete años de hambre. El faraón puso a José a cargo de todo Egipto para preparar el país.',
            },
            'joseph-5': {
              text: 'Cuando el hambre llegó, los hermanos de José viajaron a Egipto a comprar alimento, sin saber que el gobernador que tenían delante era el mismo hermano que habían vendido años atrás. José los reconoció, pero ellos a él no.',
            },
            'joseph-6': {
              text: 'Finalmente, José se dio a conocer a sus hermanos. Aunque le habían hecho mucho daño, les dijo que no se entristecieran: Dios lo había enviado a Egipto antes que ellos, para preservar la vida de muchas personas.',
            },
          },
          quiz: {
            'joseph-q1': {
              question: '¿Qué le hicieron los hermanos de José?',
              options: [
                'Lo vendieron a unos mercaderes',
                'Lo coronaron rey',
                'Lo escondieron en su casa',
              ],
            },
            'joseph-q2': {
              question: '¿Quién estaba con José en Egipto?',
              options: ['Nadie lo ayudaba', 'Jehová', 'Solo el faraón'],
            },
            'joseph-q3': {
              question: '¿Qué les dijo José a sus hermanos al final?',
              options: [
                'Que se fueran para siempre',
                'Que no se entristecieran, Dios lo había encaminado a bien',
                'Que nunca los perdonaría',
              ],
            },
          },
        },
        moses: {
          title: 'Moisés y la salida de Egipto',
          subtitle: 'Dios libera a su pueblo',
          refLabel: 'Éxodo 2–14',
          teachContext:
            'El Éxodo es el gran acto liberador de Dios en el Antiguo Testamento: saca a Israel de la esclavitud en Egipto para llevarlo a ser su pueblo. Es también la historia detrás de la Pascua, que después Jesús cumpliría de una manera aún mayor.',
          teachQuestions: [
            '¿Por qué crees que Moisés tuvo miedo cuando Dios lo llamó?',
            '¿Qué te muestra esta historia sobre el poder de Dios?',
            '¿De qué maneras Dios "abre camino" hoy para su pueblo, aunque no sea partiendo un mar?',
          ],
          scenes: {
            'moses-1': {
              text: 'Cuando nació Moisés, el faraón había ordenado matar a todos los bebés varones hebreos. Su madre lo escondió en una canasta y la puso a flotar entre los juncos del río Nilo, confiando en que Dios cuidaría de su hijo.',
            },
            'moses-2': {
              text: 'Ya de adulto, Moisés cuidaba ovejas en el desierto cuando vio algo extraño: una zarza que ardía en llamas, pero no se consumía. Cuando se acercó a mirar, Dios lo llamó desde el fuego y le habló.',
            },
            'moses-3': {
              text: 'Dios envió a Moisés a hablar con el faraón de Egipto. Moisés y su hermano Aarón le dijeron: «Así ha dicho Jehová Dios de Israel: Deja ir a mi pueblo». Pero el faraón se negó una y otra vez.',
            },
            'moses-4': {
              text: 'Antes de la última plaga, Dios le dio instrucciones a Israel para poner sangre en las puertas de sus casas: esa sangre sería la señal para que la muerte pasara de largo esa noche. Así comenzó la fiesta de la Pascua.',
            },
            'moses-5': {
              text: 'El faraón por fin dejó salir al pueblo, pero luego cambió de opinión y los persiguió hasta el Mar Rojo. Moisés extendió su mano sobre el mar, y Dios abrió un camino en seco en medio de las aguas.',
            },
            'moses-6': {
              text: 'Israel cruzó el mar en seco, con las aguas como una pared a cada lado. Cuando el ejército egipcio trató de seguirlos, las aguas volvieron a su lugar. El pueblo vio el gran poder de Dios y confió en Él.',
            },
          },
          quiz: {
            'moses-q1': {
              question: '¿Dónde pusieron al bebé Moisés para protegerlo?',
              options: [
                'En una canasta en el río',
                'En un palacio',
                'En una cueva escondida',
              ],
            },
            'moses-q2': {
              question: '¿Cómo se le apareció Dios a Moisés?',
              options: [
                'En un sueño',
                'En una zarza que ardía y no se consumía',
                'Dentro de una nube de humo',
              ],
            },
            'moses-q3': {
              question: '¿Qué pasó con el mar cuando Moisés extendió su mano?',
              options: [
                'Se abrió en dos',
                'Se congeló por completo',
                'Se puso más profundo',
              ],
            },
          },
        },
        'david-goliath': {
          title: 'David y Goliat',
          subtitle: 'La fe vence al gigante',
          refLabel: '1 Samuel 17',
          teachContext:
            'David era todavía un joven pastor cuando enfrentó al gigante filisteo Goliat. El relato no celebra la valentía de David como una hazaña personal, sino su confianza en que Dios pelearía por Israel — la misma confianza que un niño puede tener hoy frente a sus propios "gigantes".',
          teachQuestions: [
            '¿Por qué crees que nadie más en el ejército de Israel quiso enfrentar a Goliat?',
            '¿En qué confiaba David para no tener miedo?',
            '¿Cuáles son los "gigantes" que tú enfrentas, y en quién puedes confiar como David confió en Dios?',
          ],
          scenes: {
            'david-goliath-1': {
              text: 'Un gigante filisteo llamado Goliat salió del campamento enemigo y desafió al ejército de Israel: pidió que alguien peleara contra él uno a uno. Todos los soldados de Israel, incluido el rey Saúl, tuvieron mucho miedo.',
            },
            'david-goliath-2': {
              text: 'David era un joven pastor que cuidaba las ovejas de su padre. Cuando llegó al campamento a llevarle comida a sus hermanos, escuchó el desafío de Goliat y contó cómo, siendo pastor, ya había rescatado ovejas de leones y osos.',
            },
            'david-goliath-3': {
              text: 'David no quiso usar la armadura pesada del rey Saúl. En su lugar, tomó su cayado, su honda, y escogió cinco piedras lisas de un arroyo, guardándolas en su bolsa de pastor. Así se acercó al filisteo.',
            },
            'david-goliath-4': {
              text: 'Goliat se burló de David por ser tan joven. Pero David le respondió: «Tú vienes a mí con espada y lanza, mas yo vengo a ti en el nombre de Jehová de los ejércitos». David sabía que la batalla era de Dios.',
            },
            'david-goliath-5': {
              text: 'David corrió hacia Goliat, tomó una piedra de su bolsa, la lanzó con su honda y golpeó al gigante en la frente. Goliat cayó, y todo el ejército filisteo huyó al ver lo que Dios había hecho a través de David.',
            },
          },
          quiz: {
            'david-goliath-q1': {
              question: '¿Cuántas piedras lisas tomó David del arroyo?',
              options: ['Tres', 'Cinco', 'Diez'],
            },
            'david-goliath-q2': {
              question: '¿En el nombre de quién dijo David que venía a pelear?',
              options: [
                'En su propia fuerza',
                'En el nombre de Jehová de los ejércitos',
                'En el nombre del rey Saúl',
              ],
            },
            'david-goliath-q3': {
              question: '¿Qué usó David para vencer a Goliat?',
              options: [
                'Una espada',
                'Una honda y una piedra',
                'Un arco y flechas',
              ],
            },
          },
        },
        'daniel-lions': {
          title: 'Daniel en el foso de los leones',
          subtitle: 'Fiel aunque sea peligroso',
          refLabel: 'Daniel 6',
          teachContext:
            'Daniel era un extranjero fiel a Dios que servía en el gobierno de Babilonia. Cuando una ley injusta lo puso en peligro por orar, Daniel no dejó de hacerlo — y Dios lo protegió de una manera visible para todos, incluido el rey.',
          teachQuestions: [
            '¿Por qué Daniel siguió orando aunque sabía que era peligroso?',
            '¿Qué significa ser fiel a Dios incluso cuando cuesta algo?',
            '¿Has tenido que elegir entre hacer lo correcto o lo más fácil? ¿Qué pasó?',
          ],
          scenes: {
            'daniel-lions-1': {
              text: 'Daniel era un hombre fiel a Dios que servía como uno de los altos funcionarios del rey en Babilonia. Su honestidad y sabiduría eran tan grandes que el rey pensaba ponerlo por encima de todo el reino.',
            },
            'daniel-lions-2': {
              text: 'Algunos hombres, celosos de Daniel, convencieron al rey de firmar una ley: durante treinta días, nadie podía orar a nadie excepto al rey, bajo pena de ser echado al foso de los leones. Sabían que Daniel oraba a Dios cada día.',
            },
            'daniel-lions-3': {
              text: 'Cuando Daniel supo de la nueva ley, siguió orando a Dios tres veces al día, tal como siempre lo había hecho, con las ventanas de su casa abiertas hacia Jerusalén, sin esconderse ni tener miedo.',
            },
            'daniel-lions-4': {
              text: 'Los hombres que odiaban a Daniel lo acusaron ante el rey, y aunque el rey no quería, la ley debía cumplirse. Daniel fue llevado y echado al foso de los leones esa misma noche.',
            },
            'daniel-lions-5': {
              text: 'A la mañana siguiente, el rey corrió angustiado hasta el foso y llamó a Daniel. Daniel respondió que su Dios había enviado un ángel que cerró la boca de los leones, y que no había sufrido ningún daño.',
            },
          },
          quiz: {
            'daniel-lions-q1': {
              question: '¿Cuántas veces al día oraba Daniel?',
              options: [
                'Una vez',
                'Tres veces',
                'Nunca dejaba de orar en voz alta',
              ],
            },
            'daniel-lions-q2': {
              question: '¿A dónde llevaron a Daniel por seguir orando?',
              options: [
                'Al foso de los leones',
                'A una cárcel común',
                'Lejos del reino',
              ],
            },
            'daniel-lions-q3': {
              question: '¿Quién cerró la boca de los leones?',
              options: [
                'El propio rey',
                'El ángel de Dios',
                'Los guardias del palacio',
              ],
            },
          },
        },
        jonah: {
          title: 'Jonás y el gran pez',
          subtitle: 'Nadie escapa del amor de Dios',
          refLabel: 'Jonás 1–3',
          teachContext:
            'Dios envió a Jonás a predicar a Nínive, una ciudad enemiga de Israel, y Jonás intentó huir en la dirección contraria. La historia muestra tanto la paciencia de Dios con Jonás como su compasión por una ciudad entera que no conocía a Dios.',
          teachQuestions: [
            '¿Por qué crees que Jonás no quería ir a Nínive?',
            '¿Qué aprendió Jonás dentro del gran pez?',
            '¿Alguna vez intentaste "huir" de algo que sabías que Dios te pedía hacer?',
          ],
          scenes: {
            'jonah-1': {
              text: 'Dios le dijo a Jonás que fuera a la ciudad de Nínive a predicar contra su maldad. Pero Jonás no quería ir: se levantó y tomó un barco en dirección contraria, tratando de huir de la presencia de Dios.',
            },
            'jonah-2': {
              text: 'Mientras el barco navegaba, Jehová envió una tormenta tan fuerte que los marineros temieron que el barco se hundiera. Jonás les dijo que lo tomaran y lo echaran al mar, porque sabía que la tormenta era por su causa.',
            },
            'jonah-3': {
              text: 'Cuando echaron a Jonás al mar, Jehová tenía preparado un gran pez que se lo tragó. Jonás estuvo dentro del pez tres días y tres noches, y desde allí clamó a Dios en oración.',
            },
            'jonah-4': {
              text: 'Jonás oró a Jehová su Dios desde el vientre del pez, y Dios lo escuchó. El pez lo vomitó en tierra firme, y Dios volvió a hablarle: «Levántate y ve a Nínive, aquella gran ciudad, y proclama en ella el mensaje que yo te diré».',
            },
            'jonah-5': {
              text: 'Esta vez Jonás obedeció y predicó en Nínive. Sorprendentemente, la gente de la ciudad creyó a Dios, se arrepintió de su maldad, y Dios, viendo su cambio, decidió no destruir la ciudad.',
            },
          },
          quiz: {
            'jonah-q1': {
              question: '¿Qué hizo Jonás cuando Dios le pidió ir a Nínive?',
              options: [
                'Obedeció enseguida',
                'Huyó en un barco hacia otro lugar',
                'Se escondió en su casa',
              ],
            },
            'jonah-q2': {
              question: '¿Qué preparó Jehová para Jonás en el mar?',
              options: [
                'Un gran pez',
                'Una balsa de madera',
                'Una isla cercana',
              ],
            },
            'jonah-q3': {
              question:
                '¿Qué hizo la gente de Nínive al escuchar el mensaje de Jonás?',
              options: [
                'Se rieron de él',
                'Creyeron a Dios y se arrepintieron',
                'Echaron a Jonás de la ciudad',
              ],
            },
          },
        },
        'jesus-birth': {
          title: 'El nacimiento de Jesús',
          subtitle: 'Dios se hizo uno de nosotros',
          refLabel: 'Lucas 2:1-20',
          teachContext:
            'Lucas narra el nacimiento de Jesús con detalles sencillos y humildes: un censo, un pesebre, unos pastores. El contraste entre la grandeza del anuncio angélico y la pobreza del lugar de nacimiento muestra cómo Dios eligió venir al mundo.',
          teachQuestions: [
            '¿Por qué crees que Jesús nació en un lugar tan humilde como un pesebre?',
            '¿Por qué los ángeles anunciaron primero la noticia a unos pastores, y no a reyes o líderes importantes?',
            '¿Qué sentirías si hubieras sido uno de los pastores esa noche?',
          ],
          scenes: {
            'jesus-birth-1': {
              text: 'Un censo obligó a José a viajar con María, su esposa, desde Nazaret hasta Belén, la ciudad de David, porque José era de su familia. María estaba a punto de dar a luz cuando llegaron.',
            },
            'jesus-birth-2': {
              text: 'En Belén, María dio a luz a su hijo primogénito. Lo envolvió en pañales y lo acostó en un pesebre, porque no había lugar para ellos en el mesón. Así nació Jesús, en el lugar más sencillo.',
            },
            'jesus-birth-3': {
              text: 'Esa misma noche, unos pastores cuidaban sus rebaños en el campo cuando un ángel se les apareció. «No temáis —les dijo—, os ha nacido hoy, en la ciudad de David, un Salvador, que es Cristo el Señor».',
            },
            'jesus-birth-4': {
              text: 'Los pastores fueron enseguida a Belén y encontraron todo tal como el ángel les había dicho: a María, a José, y al niño acostado en el pesebre. Vieron con sus propios ojos lo que Dios había anunciado.',
            },
            'jesus-birth-5': {
              text: 'Después de ver al niño, los pastores contaron a todos lo que los ángeles les habían dicho sobre Él. Luego volvieron a sus campos glorificando y alabando a Dios por todo lo que habían visto y oído.',
            },
          },
          quiz: {
            'jesus-birth-q1': {
              question: '¿Dónde nació Jesús?',
              options: [
                'En un palacio',
                'En un pesebre en Belén',
                'Dentro del templo',
              ],
            },
            'jesus-birth-q2': {
              question: '¿Quién les anunció la buena noticia a los pastores?',
              options: ['Un ángel', 'Un rey', 'Un profeta anciano'],
            },
            'jesus-birth-q3': {
              question: '¿Qué hicieron los pastores después de ver al niño?',
              options: [
                'Guardaron silencio sobre todo',
                'Volvieron glorificando y alabando a Dios',
                'Se fueron tristes a sus casas',
              ],
            },
          },
        },
        'good-samaritan': {
          title: 'El buen samaritano',
          subtitle: '¿Quién es mi prójimo?',
          refLabel: 'Lucas 10:25-37',
          teachContext:
            'Jesús contó esta parábola en respuesta a la pregunta «¿quién es mi prójimo?». Los samaritanos y los judíos no se llevaban bien en esa época, así que elegir a un samaritano como el héroe de la historia sorprendió a quienes lo escuchaban.',
          teachQuestions: [
            '¿Por qué crees que el sacerdote y el levita no ayudaron al hombre herido?',
            '¿Por qué fue sorprendente que el samaritano sí ayudara?',
            '¿Quién podría ser tu "prójimo" hoy, alguien que necesita tu ayuda aunque no lo conozcas bien?',
          ],
          scenes: {
            'good-samaritan-1': {
              text: 'Un maestro de la ley le preguntó a Jesús qué debía hacer para amar a su prójimo, y luego le preguntó: «¿Y quién es mi prójimo?». Jesús respondió contando una historia.',
            },
            'good-samaritan-2': {
              text: 'Un hombre bajaba por el camino de Jerusalén a Jericó cuando cayó en manos de ladrones. Le quitaron todo lo que tenía, lo hirieron y lo dejaron medio muerto junto al camino.',
            },
            'good-samaritan-3': {
              text: 'Por ese mismo camino pasaron primero un sacerdote y luego un levita, dos hombres que servían en el templo. Ambos vieron al hombre herido, pero los dos pasaron de largo por el otro lado del camino, sin detenerse a ayudar.',
            },
            'good-samaritan-4': {
              text: 'Después pasó un samaritano — alguien de un pueblo que no se llevaba bien con los judíos. Al ver al hombre herido, sintió compasión: se acercó, vendó sus heridas y lo cuidó, aunque no lo conocía de nada.',
            },
            'good-samaritan-5': {
              text: 'El samaritano incluso pagó para que cuidaran al hombre herido en una posada hasta que se recuperara. Jesús preguntó: «¿Cuál de estos tres fue el prójimo?». Y dijo: «Ve, y haz tú lo mismo».',
            },
          },
          quiz: {
            'good-samaritan-q1': {
              question:
                'En la historia, ¿quiénes pasaron de largo sin ayudar al hombre herido?',
              options: [
                'Un sacerdote y un levita',
                'Dos samaritanos',
                'Dos niños del pueblo',
              ],
            },
            'good-samaritan-q2': {
              question: '¿Quién se detuvo a ayudar al hombre herido?',
              options: ['Un sacerdote', 'Un samaritano', 'Un levita'],
            },
            'good-samaritan-q3': {
              question: '¿Qué le dijo Jesús a quien había hecho la pregunta?',
              options: [
                'Ve y haz tú lo mismo',
                'Olvídalo, no importa',
                'Espera a que otro ayude',
              ],
            },
          },
        },
        resurrection: {
          title: '¡Jesús vive!',
          subtitle: 'La tumba está vacía',
          refLabel: 'Mateo 27:57–28:10',
          teachContext:
            'La resurrección de Jesús es el centro de la fe cristiana: no quedó en la tumba, sino que se levantó de entre los muertos al tercer día, tal como Él mismo había dicho. Este relato se cuenta con sobriedad y fidelidad al texto, sin añadir detalles gráficos que el texto no describe.',
          teachQuestions: [
            '¿Por qué crees que las mujeres fueron las primeras en enterarse de que Jesús había resucitado?',
            '¿Qué significa para ti que Jesús esté vivo hoy?',
            '¿Por qué el ángel les dijo a las mujeres que fueran a contarlo a los demás?',
          ],
          scenes: {
            'resurrection-1': {
              text: 'Después de morir en la cruz, el cuerpo de Jesús fue envuelto y puesto en una tumba nueva, tallada en roca. Sellaron la entrada con una gran piedra, y sus seguidores quedaron tristes, sin entender todavía lo que vendría después.',
            },
            'resurrection-2': {
              text: 'Al amanecer del primer día de la semana, dos mujeres que seguían a Jesús fueron a visitar la tumba. No sabían lo que iban a encontrar, pero querían estar cerca del lugar donde habían dejado a su Señor.',
            },
            'resurrection-3': {
              text: 'Cuando llegaron, un ángel apareció y les dijo: «No temáis vosotras; porque yo sé que buscáis a Jesús, el que fue crucificado. No está aquí, pues ha resucitado, como dijo». La tumba estaba vacía.',
            },
            'resurrection-4': {
              text: 'Las mujeres salieron del sepulcro con temor y gran gozo a la vez, y corrieron a contarlo a los discípulos. En el camino, el propio Jesús les salió al encuentro y las saludó — ¡estaba realmente vivo!',
            },
            'resurrection-5': {
              text: 'Jesús les dijo: «No temáis; id, dad las nuevas a mis hermanos». Las mujeres fueron las primeras en anunciar la noticia más importante de la historia: Jesús había resucitado, tal como lo había prometido.',
            },
          },
          quiz: {
            'resurrection-q1': {
              question: '¿Qué le dijo el ángel a las mujeres en la tumba?',
              options: [
                'No está aquí, ha resucitado',
                'Vuelvan mañana',
                'No pueden pasar por aquí',
              ],
            },
            'resurrection-q2': {
              question: '¿Cómo se sintieron las mujeres al salir del sepulcro?',
              options: [
                'Con temor y gran gozo a la vez',
                'Enojadas',
                'Sin sentir nada especial',
              ],
            },
            'resurrection-q3': {
              question: '¿Qué les dijo Jesús a las mujeres que hicieran?',
              options: [
                'Que se escondieran',
                'Que fueran a contarlo a los discípulos',
                'Que se quedaran calladas para siempre',
              ],
            },
          },
        },
      },
    },
  },

  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    copy: 'Copy',
    copied: 'Copied',
    ok: 'OK',
    change: 'Change',
    previous: 'Previous',
    next: 'Next',
    to: 'to',
    tap: 'Tap',
    readMore: 'Read more',
    readLess: 'Read less',
    completed: 'Completed',
    add: 'Add',
    range: 'Range',
    optional: 'Optional',
    coins: 'coins',

    // Share Service (native share dialogs + clipboard fallback)
    shareService: {
      verseDialogTitle: 'Share verse',
      versesDialogTitle: 'Share verses',
      planDialogTitle: 'Share reading plan',
      achievementDialogTitle: 'Share achievement',
      promo: '✨ Shared from Eternal Bible',
      planMessage:
        '📖 Reading plan: {{name}}\n\n{{description}}\n\nJoin me on this spiritual journey!\n\n✨ Download Eternal Bible and start your plan today.',
      achievementMessage:
        '🏆 Achievement unlocked!\n\n{{title}}\n{{description}}\n\n✨ Eternal Bible · Your spiritual journey',
      copiedTitle: 'Copied',
      copiedMessage: 'The content was copied to the clipboard',
      copyErrorMessage: 'Could not copy to the clipboard',
    },

    // App Loading
    app: {
      subtitle: 'The Word of God',
      loadingBible: 'Loading the Bible...',
      verses: 'verses',
      preparing: 'Preparing...',
      loadingVerse:
        '"Your word is a lamp to my feet\nand a light to my path"\n- Psalm 119:105',
      errorHint: 'If the problem persists, close and reopen the application.',
      retry: 'Retry',
      unexpectedErrorTitle: 'Something went wrong',
      unexpectedErrorMessage:
        'The app ran into an unexpected error. You can try again.',
      endOfBook: 'End of book',
      endOfBookMessage: 'You have reached the end of this book',
      firstChapterMessage: 'You are at the first chapter of this book',
      emptyBookmarksHint:
        'Tap the star icon while reading verses to save them as favorites',
      loadingProgress: 'Loading... {{percent}}%',
    },

    // Tabs Navigation
    tabs: {
      home: 'Home',
      bible: 'Bible',
      search: 'Search',
      achievements: 'Achievements',
      favorites: 'Favorites',
      notes: 'Notes',
      settings: 'Settings',
    },

    // Headers
    headers: {
      home: 'Eternal Bible',
      bible: 'The Bible',
      search: 'Search the Bible',
      achievements: 'My Achievements',
      favorites: 'My Favorites',
      notes: 'My Notes',
      settings: 'Settings',
    },

    // Home Screen
    home: {
      title: 'Eternal Bible',
      welcome: 'Welcome to Eternal Bible',
      welcomeShort: 'Welcome',
      subtitle: 'Daily Biblical Inspiration',
      journeyContinues: 'Your spiritual journey continues',
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      greetingNight: 'Rest well',
      nudgeStreak: "You're on a {{days}}-day reading streak",
      nudgeStreakOne: "You're on a 1-day reading streak",
      nudgeContinue: 'Continue in {{book}}',
      nudgeDaily: "Today's verse is waiting for you",
      loadError: "We couldn't load your home screen.",
      level: 'Level',
      planDays: '{{days}}-day Plan',
      start: 'Start',
      percentCompleted: '{{percent}}% completed',
      dailyVerse: 'Verse of the Day',
      continueReading: 'Continue Reading',
      continueListening: 'Continue Listening',
      tapToResume: 'Tap to resume',
      startReading: 'Start Your Bible Journey',
      readFullChapter: 'Read Full Chapter',
      studyVerse: 'Study this verse',
      prepFromVerse: 'Study at the Prep Table',
      alsoIn: 'See it in',
      alsoToggle: 'See it in other versions',
      alsoLanguageEs: 'Spanish',
      alsoLanguageEn: 'English',
      alsoUnavailable: "This verse isn't available in {{version}}",
      alsoCompare: 'Compare versions',
      dailyToday: 'Today',
      dailyYesterday: 'Yesterday',
      dailyPrevDay: "See the previous day's verse",
      dailyNextDay: 'See the next day',
      dailyBackToToday: 'Back to today',
      lastRead: 'Last read',
      readingPlans: 'Reading Plans',
      myPlans: 'My plans',
      createPlanShort: 'Create',
      noPlansYet: 'Create your own reading plan.',
      growTitle: 'Grow with God',
      exploreTitle: 'Explore',
      progressTitle: 'Your progress',
      savedTitle: 'Saved',
      viewPlan: 'View Plan',
      continue: 'Continue',
      plansDescription: 'Follow a structured plan to read the Bible',
      quickAccess: 'Quick Access',
      days: 'days',
      footerQuote:
        '"Thy word is a lamp unto my feet, and a light unto my path."',
      footerReference: '— Psalm 119:105',
      books: 'books',
      bibleLibrary: 'Bible Library',
      booksAvailable: 'books available',
      searchBook: 'Search book...',
      streakDays: 'Days',
      rank: 'Rank',
      progress: 'Progress',
      menu: {
        exploreBible: 'Explore\nthe Bible',
        favorites: 'My Favorite\nVerses',
        readingPlan: 'Bible Study\nPlan',
        notes: 'My\nNotes',
        search: 'Search the\nScriptures',
      },
      a11y: {
        screenLabel: 'Eternal Stone Bible App home screen',
        screenHint: "Scroll to explore the app's options",
        startReadingHint: 'Tap to start or continue your reading',
        navigateHint: 'Tap to go to',
      },
    },

    // Bible Screen
    bible: {
      title: 'Bible',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      chapters: 'chapters',
      chapter: 'chapter',
      selectBook: 'Select a book to start',
      selectChapter: 'Select a chapter',
      bookOf: 'Book of',
      tapToView: 'Tap to view chapters of',
      tapToRead: 'Tap to read chapter',
      of: 'of',
      continueReading: 'Continue',
      startReading: 'Start',
      chaptersReadOf: '{{completed}}/{{total}} · {{percent}}%',
      chaptersReadOfA11y:
        '{{completed}} of {{total}} chapters read, {{percent}} percent',
      chapterReadA11y: 'read',
      chapterInProgressA11y: 'in progress',
      continueChapterHint: 'Go to chapter {{chapter}}',
      noResultsFound: 'No results found',
      noMatchingBooks: 'No books match',
      bookNotFound: 'Book not found',
      couldNotFind: 'Could not find',
      parameterReceived: 'Parameter received',
      back: 'Back',
      goTo: 'Go to',
      loadingChapters: 'Loading {{count}} chapters...',
      couldNotLoadChapters: 'Could not load chapters',
      book: 'Book',
      notSpecified: 'Not specified',
      oldTestamentShort: 'OT',
      newTestamentShort: 'NT',
    },

    // Search Screen
    search: {
      title: 'Search',
      placeholder: 'Search the Bible...',
      minChars: 'Type at least 3 characters to search',
      noResults: 'No results found',
      readyToSearch: 'Search verses by keywords',
      tryDifferent: 'Try different keywords',
      results: 'results found',
      initialTitle: 'Search the entire Bible',
      initialSubtitle: 'Find verses by keywords',
      popularSearches: 'Popular searches:',
      recentSearches: 'Recent searches:',
      clearHistory: 'Clear',
      searchFor: 'Search',
      removeFromHistory: 'Remove from history',
      loadMore: 'Load more results',
      allBooks: 'All books',
      suggestions: ['love', 'faith', 'hope', 'peace', 'salvation'],
      testament: {
        all: 'All',
        old: 'O. Testament',
        new: 'N. Testament',
      },
    },

    // Favorites Screen
    favorites: {
      title: 'My favorite verses',
      noFavorites: "You don't have any favorite verses yet",
      noFavoritesA11y: "You don't have any favorite verses",
      empty: 'No favorites yet',
      emptyHint: 'Tap the star icon while reading verses to save them here',
      deleteTitle: 'Delete Favorite',
      deleteMessage: 'Are you sure you want to delete this favorite?',
      deleteLabel: 'Delete favorite',
      deleteHint: 'Tap to delete this favorite',
      itemLabel: 'Favorite for {{book}} {{chapter}}:{{verse}}',
      itemHint: 'Tap to go to this verse',
      screenLabel: 'Favorites screen',
      screenHint: 'List of your favorite verses',
      listLabel: 'Favorites list',
      listHint: 'Scroll to explore your favorite verses',
      removed: 'Favorite removed',
      removedSuccessfully: 'Favorite removed successfully',
      versesSaved: 'Verses saved',
      verseSaved: 'Verse saved',
      listenAll: 'Listen to your favorites',
      playlistLabel: 'My favorites',
    },

    // Notes Screen
    notes: {
      title: 'Notes',
      empty: 'No notes yet',
      emptyHint: 'Add personal notes while reading the Bible',
      emptyState: 'You have no saved notes',
      deleteTitle: 'Delete Note',
      deleteMessage: 'Are you sure you want to delete this note?',
      deleteNote: 'Delete note',
      add: 'Add Note',
      note: 'Note',
      shareImage: 'Share note as image',
      saveNote: 'Save Note',
      edit: 'Edit Note',
      placeholder: 'Write your note here...',
      saved: 'Note saved',
      goToVerse: 'Go to verse',
      navigate: 'Navigate to',
      screenLabel: 'Notes screen',
      screenHint: 'List of your personal Bible notes',
      modalTitle: 'Note for {{book}} {{chapter}}:{{verse}}',
      newNote: 'New Note',
      countLabel: 'Notes saved',
      countLabelSingular: 'Note saved',
      searchPlaceholder: 'Search your notes...',
      sortRecent: 'Recent',
      sortOldest: 'Oldest',
      sortByBook: 'By book',
      noResults: 'No notes match your search',
    },

    readingInsights: {
      cardTitle: 'My reading',
      cardSubtitle: 'Your activity and consistency',
      title: 'My reading',
      subtitle: 'Your reading activity',
      empty: 'No reading recorded yet',
      emptyHint: 'Read a chapter and come back to see your progress',
      heatmapTitle: 'Your activity',
      heatmapHint: 'Verses read per day (recent months)',
      heatmapMoodLabel: 'Your mood',
      heatmapMoodA11y: 'Mood by week: {{n}} of {{total}} weeks with a check-in',
      moodMonthTitle: 'Your emotional month',
      moodMonthDominant: 'Your mood this month',
      moodMonthDays: '{{n}} of {{total}} days logged',
      moodMonthA11y:
        'Your emotional month: prevailing mood {{mood}}, {{n}} of {{total}} days logged',
      moodTrendTitle: 'Your emotional trend',
      moodTrendSubtitle: 'This month vs last',
      moodTrendLighter: 'Your spirit is lifting',
      moodTrendSteady: 'Your spirit is steady',
      moodTrendHeavier: 'These have been harder days',
      moodTrendMoreDays: '+{{n}} days',
      moodTrendFewerDays: '−{{n}} days',
      moodTrendA11y: 'Your emotional trend, this month vs last: {{direction}}',
      moodShare: 'Share my mood',
      moodShareHint: 'Create an image of your emotional month to share',
      moodCardTitle: 'My emotional month',
      moodCardSubtitle: 'Last {{total}} days',
      moodShareEmpty: "You haven't logged your mood this month yet",
      legendLess: 'Less',
      legendMore: 'More',
      streakCurrent: 'Current streak',
      streakLongest: 'Longest streak',
      activeDays: 'Active days',
      thisWeek: 'This week',
      lastWeek: 'Last week',
      bestDay: 'Best day',
      totalsTitle: 'Your journey',
      totalVerses: 'Verses',
      totalChapters: 'Chapters',
      totalBooks: 'Books',
      booksTitle: 'Books of the Bible',
      booksCaption: 'Your progress through all 66 books',
      mostReadTitle: 'Most-read book',
      chaptersUnit: 'chapters',
      versesUnit: 'verses',
      daysUnit: 'days',
      timeTitle: 'Time in the Word',
      timeTotal: 'Total time',
      timeWeek: 'This week',
      timeBestDay: 'Best day',
      listeningTitle: 'Listening time',
      listeningHint: 'Your time hearing the Word narrated',
      listeningToday: 'Today',
      listeningVerses: 'Verses heard',
      listeningDays: 'Listening days',
      listeningStreak: 'Streak (days)',
      weekShare: 'Share my week',
      weekShareHint: 'Share your last week as an image',
      weekVsTitle: 'This week vs last week',
      weekVsHint: 'Last 7 days compared with the 7 before',
      weekVsVerses: 'Verses read',
      weekVsReadingTime: 'Reading time',
      weekVsListening: 'Listening time',
      weekVsDays: 'Active days',
      weekVsEmptyPrev: 'The week before had no activity',
      weekVsA11y:
        '{{label}}: {{previous}} the week before, {{current}} this week',
      moodTitle: 'Your mood this week',
      moodHint: 'The feeling you checked in each day',
      moodNone: 'No check-in',
      moodDayA11y: '{{day}}: {{feeling}}',
      timeline: {
        cardTitle: 'Your timeline',
        cardHint: 'The milestones of your walk in the Word',
        title: 'Your timeline',
        subtitle: 'Milestones of your walk',
        empty: 'Your milestones will appear here',
        emptyHint:
          'Finish a book, save a favorite or keep your streak — every milestone lands on your timeline.',
        bookCompleted: 'You finished {{book}}',
        achievement: 'Achievement: {{name}}',
        firstFavorite: 'Your first favorite · {{ref}}',
        firstNote: 'Your first note · {{ref}}',
        firstHighlight: 'Your first highlight · {{ref}}',
        streakRecord: 'New record streak: {{n}} days',
        devotionStreak: 'Devotion streak: {{n}} days with God',
        planStarted: 'You started the plan {{plan}}',
        planCompleted: 'You completed the plan {{plan}}',
        error: 'Could not load your timeline',
        shareImage: 'Share as image',
        shareCount: '{{n}} milestones on your walk',
        shareOneTitle: 'A milestone in my walk',
        shareOneHint: 'Long-press to share this milestone',
        shareOneA11y: 'Share this milestone as an image',
      },
      weekCardTitle: 'My week in the Word',
      weekCardSubtitle: 'Last 7 days',
      weekVersesRead: '{{n}} verses read',
      weekListeningLine: '{{time}} listening · {{n}} verses heard',
      weekDaysActive: '{{n}}/7 active days',
      weekReadingStreak: 'Reading streak: {{n}} days',
      weekListeningStreak: 'Listening streak: {{n}} days',
      weekEmpty: 'No activity yet this week',
      hourUnit: 'h',
      minuteUnit: 'm',
      lessThanMinute: '<1m',
    },
    journey: {
      // Home entry card + chrome
      cardTitle: 'Your journey',
      cardSubtitle: 'See your path through the Word',
      title: 'Your journey',
      since: 'since {{date}}',
      next: 'Next',
      previous: 'Previous',
      share: 'Share',
      shareHint: 'Share your journey as an image',
      // Slides
      introTitle: 'This is your journey',
      introBody: 'A look at your path through the Word',
      versesReadTitle: 'You have read',
      versesReadLabel: 'verses',
      versesReadCaption: 'Each one a seed in your heart 🌱',
      chaptersBooksTitle: 'You have journeyed',
      chaptersLabel: 'chapters',
      booksLabel: 'books completed',
      booksReadTitle: 'Books completed',
      booksReadCaption:
        '{{done}} of {{total}} books of the Bible · {{pct}}% 📚',
      mostReadTitle: 'Your most-read book',
      mostReadCaption: '{{time}} in its pages ✨',
      streakTitle: 'Your consistency',
      longestStreakLabel: 'longest streak (days)',
      currentStreakLabel: 'current streak',
      activeDaysLabel: 'active days',
      timeTitle: 'Time in the Word',
      timeReadLabel: 'of reading',
      timeCaption: 'Across {{days}} days with God ✨',
      listeningTitle: 'Your listening time',
      listeningLabel: 'listening to the Word',
      listeningCaption: '{{verses}} verses heard 🎧',
      listeningStreakCaption:
        '{{verses}} verses heard · {{streak}} days in a row 🎧',
      favoriteBookTitle: 'Your favorite book',
      favoritesLabel: 'favorites',
      favoriteBookShort: 'Favorite book',
      engagementTitle: 'Your marks',
      highlightsLabel: 'highlights',
      notesLabel: 'notes',
      moodTitle: 'Your heart',
      moodMostFelt: 'the feeling you named most',
      moodCheckinsLabel: 'days you listened to your heart',
      memoryTitle: 'Treasuring the Word',
      memorizedLabel: 'verses in your memory',
      masteredLabel: 'mastered',
      retentionLabel: 'retention',
      achievementsTitle: 'Your achievements',
      achievementsLabel: 'achievements',
      levelLabel: 'Level {{level}}',
      pointsLabel: 'points',
      finaleTitle: 'Keep walking your path',
      closingVerse:
        'Thy word is a lamp unto my feet, and a light unto my path.',
      closingReference: 'Psalm 119:105',
      shareCardTitle: 'My journey',
      // States
      emptyTitle: 'Your journey is just beginning',
      emptyBody: 'Read, save and memorize to see your path here.',
      emptyCta: 'Start reading',
      loading: 'Preparing your journey…',
      error: 'We could not prepare your journey.',
      retry: 'Retry',
      shareError: 'Could not share.',
    },

    memory: {
      title: 'Memorization',
      short: 'Memory',
      homeHint: 'Memorize the Word',
      empty: 'Your deck is empty',
      emptyHint:
        'Favorite a verse and add it to your memory deck to get started.',
      addedToast: 'Verse added to memory',
      removedToast: 'Verse removed from memory',
      alreadyInDeck: 'Already in your memory deck',
      addToDeck: 'Add to memory',
      removeFromDeck: 'Remove from memory',
      practiceCta: 'Practice {{count}} cards',
      practiceCtaSingular: 'Practice 1 card',
      noDueToday: 'No cards due',
      noDueHint:
        'Come back later — cards return on their own scheduled interval.',
      stats: {
        total: 'In your deck',
        due: 'Due today',
        mastered: 'Mastered',
      },
      box: 'Box {{n}}',
      nextReview: 'Next review',
      mastered: 'Mastered',
      practice: {
        title: 'Practice',
        progress: '{{current}} of {{total}}',
        reveal: 'Show verse',
        prompt: 'How did you do?',
        promptFullVerse: 'Read it and keep it. How well do you know it?',
        again: 'Again',
        hard: 'Hard',
        good: 'Good',
        easy: 'Easy',
        done: 'Session complete!',
        doneBody:
          'You reviewed {{count}} cards. May the Word dwell in you richly!',
        doneBodySingular:
          'You reviewed 1 card. May the Word dwell in you richly!',
        doneCta: 'Back to deck',
        boxLabel: 'Box {{box}}',
        maskHint: '{{percent}}% hidden',
        maskNone: 'Full verse',
        modeReveal: 'Reveal',
        modeFirstLetter: 'First letter',
        modeFill: 'Fill in',
        modeWrite: 'Write',
        firstLetterPrompt: 'Recite the verse from memory, then reveal it.',
        fillPrompt: 'Type the missing words.',
        fillCheck: 'Check',
        fillResult: '{{correct}} of {{total}} correct',
        writePrompt:
          'Write the verse from memory, then reveal it to check yourself.',
        clear: 'Clear',
        undo: 'Undo',
      },
      guide: {
        openLabel: 'How memorization works',
        title: 'How memorization works',
        intro:
          'Memorize the Word with spaced repetition: you review each verse just before you would forget it, so it stays with you without strain.',
        boxesTitle: 'Boxes 1 → 5',
        boxesBody:
          'Each verse lives in a box. Recall it well and it moves up a box and comes back less often; struggle and it moves down and returns soon. In Box 5 it is mastered.',
        maskTitle: 'Hidden words',
        maskBody:
          'In the early boxes you see the full verse to learn it. As it climbs the boxes, more words are hidden so you recall it from memory.',
        gradeTitle: 'How did it go?',
        gradeBody:
          'After revealing the verse, you rate your recall: "Again" and "Hard" bring it back soon; "Good" and "Easy" space it out further. The review adapts to you.',
        close: 'Got it',
      },
      remove: {
        title: 'Remove from memory',
        message:
          'Remove this verse from your deck? You will lose your progress.',
        confirm: 'Remove',
        cancel: 'Cancel',
      },
      insights: {
        openLabel: 'View memory insights',
        title: 'Insights',
        subtitle: 'Your memorization progress',
        emptyTitle: 'No data yet',
        emptyBody: 'Add verses to your deck to see your memorization insights.',
        masteryTitle: 'Deck mastery',
        masteredLabel: 'Mastered',
        statTotal: 'In your deck',
        statDue: 'Due',
        statReviews: 'Reviews',
        statAvgBox: 'Avg. box',
        distributionTitle: 'Box distribution',
        distributionHint: 'Box 1 = new · Box 5 = mastered',
        forecastTitle: 'Next 7 days',
        forecastHint: 'Cards coming up for review',
        today: 'Today',
        weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        strugglingTitle: 'Tripping you up',
        strugglingHint: 'Verses you keep reviewing that stay in low boxes.',
        strugglingEmpty: "Nothing's tripping you up. Great work!",
        reviewsCount: '{{count}} reviews',
        reviewsCountSingular: '1 review',
        heatmapTitle: 'Review activity',
        heatmapHint: 'Reviews per day over recent weeks',
        heatmapEmpty:
          "You haven't reviewed any verses yet. Your activity map will appear here.",
        legendLess: 'Less',
        legendMore: 'More',
        streakCurrent: 'Current streak',
        streakLongest: 'Best streak',
        activeDays: 'Active days',
        retentionTitle: 'Retention by interval',
        retentionHint: '% of verses recalled by how long you waited',
        retentionEmpty:
          'Review verses on different days to see your retention.',
        overallRetention: 'Overall retention',
        leechesTitle: 'Hardest to remember',
        leechesHint:
          "You've missed these a few times — maybe re-read them slowly.",
        leechesEmpty: 'No verses are sticking. Excellent!',
        lapsesBadge: '{{count}} lapses',
        lapsesBadgeSingular: '1 lapse',
        calibrationTitle: 'Scheduling calibration',
        calibrationHint:
          'We tune how new verses are paced from your real retention.',
        calibrationPace: 'New-verse pace',
        calibrationBasis: 'Based on {{pct}}% retention · {{count}} reviews',
        calibrationSlower:
          'You retain well, so we space new verses out a little more.',
        calibrationFaster: 'We give new verses a bit more early practice.',
        calibrationNeutral: 'Your pace matches the standard.',
        calibrationLearning:
          'Still learning your pace. {{count}} more spaced reviews to calibrate.',
        calibrationLearningSingular:
          'Still learning your pace. 1 more spaced review to calibrate.',
        exclusiveLabel: 'Exclusive',
        fullHistoryToggle: 'View full history',
        fullHistoryToggleOff: 'View recent months',
        fullHistoryHint: 'Your entire review history, not just recent months',
        byBookTitle: 'Retention by book',
        byBookHint: 'How you’re doing in each book you’ve memorized',
        byBookLocked: 'Unlocked with an offering',
        monthsShort: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
        trendTitle: 'Retention trend',
        trendHint: 'Your retention month by month, over the last 12 months',
        trendLocked: 'Unlocked with an offering',
        shareProgressButton: 'Share my progress',
        shareProgressLocked: 'Unlocked with an offering',
        shareCardVerses: 'verses memorized',
        shareCardVersesSingular: 'verse memorized',
        shareCardRetention: 'retention',
        shareCardStreak: 'day streak',
        shareCardStreakSingular: 'day streak',
        shareCardFooter: 'Eternal Bible',
      },
      goal: {
        heroTitle: 'Your streak',
        streakDays: '{{count}}-day streak',
        streakDaysSingular: '1-day streak',
        streakNone: 'Start your streak today',
        dailyGoal: 'Daily goal',
        todayCount: '{{done}}/{{goal}} today',
        remaining: '{{count}} reviews to go',
        remainingSingular: '1 review to go',
        goalMet: 'Goal reached!',
        nextTarget: 'Next milestone: {{count}} days',
        settingsTitle: 'Daily review goal',
        settingsDesc: 'How many cards you want to review each day',
        goalUnit: '{{count}}/day',
        saved: 'Goal updated',
        celebrateStreakTitle: '{{count}}-day streak!',
        celebrateStreakBody:
          "You've reviewed {{count}} days in a row. May the Word keep dwelling in you!",
        celebrateGoalTitle: 'Daily goal reached!',
        celebrateGoalBody:
          'You finished your {{count}} reviews today. Well done, good servant!',
        celebrateCta: 'Amen!',
      },
    },

    bookIntro: {
      openLabel: 'About this book',
      headerTitle: 'About the book',
      author: 'Author',
      date: 'Date',
      theme: 'Central theme',
      context: 'Context',
      christ: 'Christ in this book',
      keyVerses: 'Key verses',
      missingMessage: 'No introduction is available for this book yet.',
    },

    onboarding: {
      back: 'Back',
      next: 'Next',
      start: 'Get started',
      step: 'Step {{current}} of {{total}}',
      welcome: {
        title: 'Welcome to Eternal Bible',
        subtitle: 'Your daily companion in the Word',
        body: "Let's set up your experience in a few quick steps. You can change everything later from Settings.",
        cta: 'Get started',
      },
      language: {
        title: 'Choose your language',
        subtitle: 'This changes the interface language',
      },
      version: {
        title: 'Choose your Bible',
        subtitle: 'You can switch versions at any time',
      },
      theme: {
        title: 'Pick a color theme',
        subtitle: 'Set the visual mood for the app',
      },
      done: {
        title: 'All set!',
        body: 'May the Word of God be a lamp to your feet on this journey.',
        cta: 'Start reading',
      },
    },

    readerPrefs: {
      title: 'Reading preferences',
      openLabel: 'Open reading preferences',
      reset: 'Reset',
      font: 'Typeface',
      fontSans: 'Sans',
      fontLegible: 'Legible',
      fontSerif: 'Serif',
      fontClassic: 'Classic',
      fontCondensed: 'Compact',
      fontMono: 'Mono',
      fontSlab: 'Bold Serif',
      fontElegant: 'Elegant',
      fontRounded: 'Soft',
      exclusiveLabel: 'Exclusive',
      size: 'Size',
      increaseSize: 'Increase size',
      decreaseSize: 'Decrease size',
      lineSpacing: 'Line spacing',
      alignment: 'Alignment',
      alignLeft: 'Left',
      alignJustify: 'Justified',
      margin: 'Margins',
      marginSmall: 'Compact',
      marginMedium: 'Standard',
      marginLarge: 'Spacious',
      theme: 'Reading theme',
      themeSystem: 'System',
      themePaper: 'Paper',
      themeSepia: 'Sepia',
      themeNight: 'Night',
      themeHighContrast: 'High contrast',
      themeMusgo: 'Moss',
      themeCrepusculo: 'Twilight',
      themeNiebla: 'Mist',
      audioSection: 'Audio',
      autoImmersive: 'Open immersive mode when listening',
      autoImmersiveHint:
        'Tapping Audio opens the immersive reader, following the voice',
      sampleText:
        'In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon the face of the deep.',
    },

    crossRefs: {
      buttonLabel: 'Parallels',
      title: 'Parallel passages',
      emptyTitle: 'No parallels',
      emptyBody: "We couldn't find cross-references for this verse.",
      missingText: '(text not available)',
      attribution: 'Cross-references: openbible.info (CC BY)',
    },

    originals: {
      buttonLabel: 'Original languages',
      title: 'Original languages',
      subtitle: 'Hebrew & Greek, word by word',
      hebrew: 'Hebrew',
      greek: 'Greek',
      notInstalledTitle: 'Pack not installed',
      notInstalledBody:
        'Download the original-languages pack to see the Hebrew and Greek behind every verse, with Strong’s number and definition.',
      download: 'Download (~30 MB)',
      downloading: 'Downloading…',
      importing: 'Installing…',
      downloadError: 'Could not download the pack. Please try again.',
      empty: 'No original-language data for this verse.',
      lemma: 'Dictionary form',
      definition: 'Definition',
      occurrences: 'occurrences',
      occurrencesOne: 'occurrence',
      viewOccurrences: 'See where else it appears',
      openWordStudy: 'Word study',
      definitionEnglish: 'Definition (English)',
      openHint: 'View definition',
      attribution: 'Hebrew/Greek: STEPBible (CC BY) · Lexicon: Strong’s',
      morphologyTitle: 'Morphological analysis',
      morphologyLocked: 'Unlocked with an offering',
      kjvGloss: 'KJV translation',
      exclusiveLabel: 'Exclusive',
    },

    wordStudy: {
      title: 'Word study',
      subtitle: 'Every place this word appears',
      occurrences: 'occurrences',
      occurrencesOne: 'occurrence',
      inBooks: 'in {{n}} books',
      inBooksOne: 'in 1 book',
      distribution: 'Distribution by book',
      firstAppearance: 'First appearance',
      lastAppearance: 'Last appearance',
      occurrencesHeader: 'Occurrences',
      moreOccurrences: 'Showing the first {{n}}',
      notInstalledTitle: 'Pack not installed',
      notInstalledBody:
        'Download the original-languages pack to study where each word appears.',
      empty: 'No data for this word.',
      attribution: 'Hebrew/Greek: STEPBible (CC BY) · Lexicon: Strong’s',
    },

    referenceChain: {
      title: 'Reference thread',
      subtitle: 'Follow one verse to another',
      continueLabel: 'Continue the thread',
      threadEnds: 'The thread ends here',
      start: 'Follow the thread',
    },

    constellation: {
      title: 'Constellation',
      subtitle: "The verse's web of connections",
      open: 'View constellation',
      legendOut: 'Points to',
      legendIn: 'Cited by',
      tapHint: 'Tap a star to reveal it',
      connections: '{{n}} connections',
      connectionsOne: '1 connection',
      empty: 'This verse has no connections to map yet.',
      recenter: 'Center here',
      openInReader: 'Open in reader',
    },

    periodRecap: {
      yearTitle: 'Your year in the Word',
      quarterTitle: 'Your quarter in the Word',
      scopeYear: 'Year',
      scopeQuarter: 'Quarter',
      quarterLabel: 'Q{{q}} · {{year}}',
      versesRead: '{{n}} verses read',
      activeDays: '{{n}} reading days',
      mastered: '{{n}} verses mastered',
      listened: '{{n}} verses heard',
      favorites: '{{n}} new favorites',
      mood: 'Your mood: {{feeling}}',
      empty: 'No activity in this period yet',
    },

    study: {
      title: 'Study mode',
      subtitle: 'Verse connections',
      referencesTitle: 'References',
      referencesHint: 'Passages this verse points to',
      referencedByTitle: 'Referenced by',
      referencedByHint: 'Verses that point to this one',
      connections: 'Connections',
      empty: 'No connections',
      emptyHint: "We couldn't find cross-references for this verse.",
      missingText: '(text not available)',
      openHint: 'Open passage',
      error: 'Could not load study',
    },

    prepTable: {
      title: 'Preparation table',
      subtitle: 'Study and share the Word',
      cardTitle: 'Preparation table',
      cardSubtitle: 'Gather everything to study and share a passage',
      passageLabel: 'Passage',
      helpsTitle: 'What the app gathers',
      helpsCount: '{{n}} helps gathered',
      crossRefsTitle: 'Parallel passages',
      crossRefsHint:
        'Compare them to read the text in light of all Scripture (Acts 17:11).',
      themesTitle: 'Passage themes',
      bookIntroTitle: 'About this book',
      christTitle: 'Christ in this passage',
      noHelps: "We haven't gathered helps for this passage yet.",
      notePlaceholder: 'Write here, in prayer…',
      guardrail:
        'This is your study table: the app gathers the material, but the words and the direction are yours, before the Lord. Examine everything in light of Scripture (Acts 17:11; 1 Thess 5:21).',
      savedHint: 'Your notes are saved on this device only.',
      exportLabel: 'Copy outline',
      copied: 'Copied!',
      rangeStartLabel: 'First verse',
      rangeEndLabel: 'Last verse',
      decrease: 'Decrease',
      increase: 'Increase',
      openHint: 'Open passage',
      error: 'Could not open the preparation table',
      missingPassage: 'Choose a passage to begin.',
      sections: {
        context: {
          label: 'Context',
          prompt:
            'Who wrote it, to whom, and why? Where does this passage sit in the book and in the story of redemption?',
        },
        observation: {
          label: 'Observation',
          prompt:
            "Read slowly. What does the text say? Note repeated words, contrasts, commands and promises. Don't interpret yet.",
        },
        interpretation: {
          label: 'Interpretation',
          prompt:
            'What did it mean to its first readers, and what does it mean? Let the passage speak, and compare the parallels.',
        },
        bigIdea: {
          label: 'Big idea',
          prompt:
            "In one sentence: what is the passage's single dominant thought? The whole outline should serve this one truth.",
        },
        christ: {
          label: 'Connection to Christ',
          prompt:
            'How does this passage point to, reveal, or find fulfillment in Christ? Let it speak of Christ, not of you (Luke 24:27; 2 Cor 4:5).',
        },
        application: {
          label: 'Application',
          prompt:
            'How does this truth change the mind, the heart and the hands? Be concrete and honest, never merely moralistic.',
        },
        questions: {
          label: 'Questions to reflect on or discuss',
          prompt:
            'What questions help you discover and live this truth, alone or in a group?',
        },
      },
    },

    dailyLight: {
      cardTitle: 'Daily Light',
      cardSubtitle: 'Your devotional for today',
      title: 'Daily Light',
      subtitle: "Today's devotional",
      verseLabel: "Today's verse",
      reflectLabel: 'Reflect',
      themeLabel: "Today's theme",
      contextTitle: 'About this book',
      streak: '{{n}}-day streak',
      streakOne: '1-day streak',
      streakNone: 'Start your streak today',
      readInContext: 'Read in context',
      memorize: 'Memorize',
      memorized: 'In your deck',
      exploreTheme: 'Explore theme',
      error: "Couldn't load today's Light",
      prompts: [
        'What is God saying to you through this verse today?',
        'How can you live out this truth today?',
        'What can you give thanks for in this passage?',
        'What is it inviting you to release, or to trust?',
        'Pray this verse back to God in your own words.',
        'Who could you encourage with this truth?',
        'What promise of God do you see here?',
        'Sit quietly with this word for a moment.',
      ],
      applyTitle: 'To apply',
      applyByTheme: {
        faith: [
          'In what area of your life is God calling you to trust what you cannot yet see?',
          'What step of obedience would you take today if you truly believed His promise?',
          'Talk with God about the doubt you find hardest to hand over.',
          'What promise of God do you want to hold in your memory this week?',
          'Recall a time God was faithful, and let it strengthen your faith today.',
          'What fear would fade if you fully trusted that God is in control?',
          'Write down one thing you will entrust to God this week.',
          'What small act of trust can you offer God today, before you see the outcome?',
          'Thank God in advance for what you are still waiting to receive from His hand.',
        ],
        love: [
          'Who will God place in your path today to love as He loves you?',
          'Is there someone you find hard to love? Ask for grace to take the first step.',
          'How have you experienced the love of God this week?',
          'In what concrete way could you show the love of Christ to your family today?',
          'Ask God to fill your heart with His love so you can give it to others.',
          'In what way can you love someone today expecting nothing in return?',
          'Ask God to help you see people the way He sees them.',
          'What simple act of service can you do today for someone close to you?',
          'Ask God to help you love today in deed and truth, not only in word (1 John 3:18).',
        ],
        hope: [
          'What circumstance do you need to see today in the light of hope in Christ?',
          'Where have you been placing your hope lately? Set it again on Him.',
          'Give thanks for a promise of God that holds up your hope.',
          'What is stealing your hope today? Hand it to the God of all hope.',
          'Write down a promise of God to keep close when discouragement comes.',
          'What do you long for that only God can give? Bring it to Him.',
          'Remember that the best is yet to come in Christ, and let it lighten your day.',
          'What small light can you give thanks for today, in the middle of what you still await?',
          'Tell God what you are hoping for, and leave it in His good hands.',
        ],
        peace: [
          'What worry can you hand to God in prayer right now?',
          'What would change in your day if you rested in the peace of Christ?',
          'Breathe deeply and rest: "I will both lay me down in peace, and sleep" (Psalm 4:8).',
          'What anxious thought do you need to surrender to God right now?',
          'Thank God for a place or moment where you have found His peace.',
          'What strained relationship needs a step from you toward peace today?',
          'Before sleep, hand God whatever was left unresolved in your day.',
          'What do you need to stop carrying so you can rest today in God’s care?',
          'Before your day begins, hand God the thing that unsettles you most.',
        ],
        strength: [
          "In what weakness do you need God's strength today, not your own?",
          'Whom could you ask for help, admitting you are not alone?',
          'Ask God for strength for what lies ahead of you today.',
          'What burden are you carrying alone that you could place in God’s hands today?',
          'Rest in the truth that His power is made perfect in weakness (2 Corinthians 12:9).',
          'What task feels too big? Ask God to do it with you.',
          'Lean on a promise of God today when your strength runs low.',
          'Where are you running on your own strength and need to stop and pray?',
          'Thank God for one way He has held you up this week.',
        ],
        forgiveness: [
          'Is there someone you need to forgive, as Christ forgave you?',
          'What do you need to confess and let go before God today?',
          'Thank God for the forgiveness you have in Jesus.',
          'Is there a grudge you are holding? Ask God for freedom to release it.',
          'Receive today, without condemnation, the full forgiveness Christ has already bought.',
          'Pray for the person who hurt you, asking good for them.',
          'Do you struggle to forgive yourself? Receive the forgiveness God already gave.',
          'What first step, however small, can you take today toward reconciliation?',
          'Thank Christ that at His cross your debt was paid in full.',
        ],
        wisdom: [
          'What decision is before you? Ask God for wisdom (James 1:5).',
          'What counsel are you trusting more than the Word of God?',
          'What does this passage teach you about living wisely today?',
          'Whom that is wise and God-fearing could you ask for counsel this week?',
          'Before you decide today, pause and ask: "Lord, what do You want?"',
          'Ask God to discern between the good and the best in what is before you today.',
          'Read a proverb and choose one truth to live out today.',
          'What small habit could you change today to live more wisely?',
          'Ask God for a heart that loves His truth more than being right.',
        ],
        prayer: [
          'What do you want to say to God right now, in your own words?',
          'Whom could you intercede for today?',
          'Take a quiet moment to listen to God.',
          'What request have you stopped bringing to God? Set it before Him again.',
          'Give thanks for a prayer God has already answered.',
          'Set aside five minutes today just to be with God, asking for nothing.',
          'Turn your biggest worry today into one concrete prayer.',
          'What reason for gratitude can you turn into a prayer of praise today?',
          'Write a short prayer for someone, and pray for them through the day.',
        ],
        courage: [
          'What fear is holding you back? Hand it over to God.',
          'What act of courage is following Jesus asking of you today?',
          'Remember a time God was with you, and give Him thanks.',
          'What conversation or step have you been avoiding out of fear?',
          'Say it calmly: "Be strong and courageous; the Lord goes with you" (Joshua 1:9).',
          'Take that first small step today that you have been putting off.',
          'Where do you need courage to do the right thing, even when it costs?',
          'What truth do you need to believe today to overcome the fear of what lies ahead?',
          'Ask God for courage to say or do the right thing in love.',
        ],
        comfort: [
          'Where do you need the comfort of God today?',
          'Who that is hurting could you comfort with the comfort you have received?',
          'Pour out your heart before God; He hears you.',
          'What loss or pain do you need to bring today to the God of all comfort?',
          'Write someone who is hurting a short word of encouragement.',
          'Let yourself weep before God; He keeps every one of your tears (Psalm 56:8).',
          'Seek out today the company of someone who reminds you of God’s love.',
          'What word of God can you hold on to when sorrow comes today?',
          'Come to God just as you are; you do not need the perfect words.',
        ],
        joy: [
          'What three things can you thank God for today?',
          'How can you seek your joy in the Lord and not in circumstances?',
          'Share a word of encouragement with someone today.',
          'Where can you notice a small sign of God’s goodness today?',
          'Sing or listen to a song that lifts your heart to the Lord.',
          'Do something today, however small, that celebrates the goodness of God.',
          'Give thanks aloud for a blessing you usually take for granted.',
          'What good and simple thing today can you receive as a gift from God?',
          'Share your joy: tell someone something good God has done.',
        ],
        grace: [
          'Where are you trying to earn what God already gives you by grace?',
          'How can you extend to others the grace you have received?',
          "Rest today in the truth that God's love does not depend on your performance.",
          'Whom do you need to treat with more grace, as God treats you?',
          'Give thanks for something good in your life you did not earn, but received.',
          'Receive today as an undeserved gift from God.',
          'Offer a kind word to someone who has not “earned” it.',
          'Whom could you surprise today with a kindness they do not expect?',
          'Rest in being already loved by God, before you do anything for Him.',
        ],
        salvation: [
          'Have you placed your trust in Christ for your salvation?',
          'With whom could you share the hope of the gospel?',
          'Thank God for the gift of eternal life in Jesus.',
          'Do you remember the moment or the path by which you came to trust Jesus?',
          'Pray for one person who does not yet know Christ.',
          'Meditate on what Christ paid to give you life, and thank Him.',
          'Live today as a beloved, free child, not a slave to fear.',
          'How would your day change if you lived it as someone deeply loved and rescued?',
          'Thank Jesus for doing for you what you could never do for yourself.',
        ],
        guidance: [
          "In what decision do you need God's direction today?",
          "Are you willing to follow God's way even when it differs from yours?",
          'Ask God to light your steps with His Word (Psalm 119:105).',
          'What next small step of obedience can you take today?',
          'Commit your plans to God and ask Him to direct your steps (Proverbs 16:9).',
          'Before you act today, ask God in prayer what His way is.',
          'Trust that God straightens your steps even when you cannot see the whole path.',
          'What area of your life do you need to place under God’s direction today?',
          'Ask God for a heart willing to follow Him, even before you know the way.',
        ],
      },
    },
    christConnections: {
      cardTitle: 'Christ in this passage',
      cardSubtitle: 'All of Scripture speaks of Him (Luke 24:27)',
      pointsTo: 'Points to Christ',
      notes: {
        'genesis-1-1':
          'In the beginning God created everything. And all things were made through His Son, the eternal Word; without Him nothing that exists came to be.',
        'exodus-15-2':
          '"The LORD is my salvation." The name Jesus means "the LORD saves": what Israel sang by the sea is fulfilled in Christ, in whom God rescues us forever.',
        'numbers-6-24':
          'The priestly blessing—that the LORD keep you and give you peace—is poured out fully in Christ, of whose fullness we have all received grace upon grace.',
        'psalms-23-1':
          '"The LORD is my shepherd." Jesus said, "I am the good shepherd," and laid down His life for the sheep. The Shepherd of the psalm has a face: He is Christ.',
        'psalms-34-18':
          'God is near to the brokenhearted. In Jesus, God Himself drew near and calls: "Come to me, all who are weary, and I will give you rest."',
        'isaiah-9-6':
          '"For unto us a child is born, unto us a son is given... Prince of Peace." This prophecy is fulfilled in the birth of Jesus, the Savior, Christ the Lord.',
        'isaiah-12-2':
          '"God is my salvation." The prophet waits for the Savior to come; that Savior is Jesus, whose very name proclaims that the LORD saves.',
        'isaiah-40-31':
          'Those who wait on the LORD renew their strength. That strength has a name: Jesus invites the weary to come to Him and find rest.',
        'isaiah-53-5':
          '"He was wounded for our transgressions... and by his stripes we are healed." Centuries early, Isaiah described the cross: the suffering Servant is Christ, who bore our sins.',
        'lamentations-3-22':
          "The LORD's mercies never come to an end. That faithfulness became flesh: grace and truth came through Jesus Christ.",
        'lamentations-3-23':
          '"They are new every morning; great is your faithfulness." The unchanging faithfulness of God shines in Christ, the same yesterday, today, and forever.',
        'micah-6-8':
          'To do justice, love mercy, and walk humbly with God: what the LORD requires, Jesus lived perfectly. "I desire mercy, and not sacrifice," He said.',
        'matthew-11-28':
          'Jesus Himself invites: "Come to me... and I will give you rest." Rest for the soul is not a method but a Person: the Lord who carries what you cannot.',
        'matthew-28-6':
          '"He is not here, for he is risen." The empty tomb changes everything: Christ is alive, and in Him death has been defeated.',
        'matthew-28-19':
          'The risen Lord sends us to make disciples of all nations. The whole mission of the church flows from His authority and His promise: "I am with you always."',
        'luke-1-37':
          '"For with God nothing shall be impossible." It was said of the birth of Jesus: God Himself entered the world as a man. The Impossible became a child.',
        'luke-19-10':
          '"The Son of Man came to seek and to save that which was lost." In one sentence, the mission of Jesus: He came for you.',
        'john-1-1':
          '"In the beginning was the Word, and the Word was with God, and the Word was God." Jesus is no mere prophet: He is the eternal God made man.',
        'john-1-14':
          '"And the Word was made flesh, and dwelt among us." The infinite God became one of us to save us: this is the heart of the gospel.',
        'john-3-16':
          'The gospel in one verse: the love of the Father, the gift of the Son, and eternal life for everyone who believes in Jesus.',
        'john-6-35':
          '"I am the bread of life." What the soul needs most is not a thing but Christ Himself; whoever comes to Him will never hunger again.',
        'john-8-12':
          '"I am the light of the world." In a world in darkness, to follow Jesus is to walk in the light of life.',
        'john-10-10':
          '"I am come that they might have life, and that they might have it more abundantly." Christ did not come to take your life, but to give it in full.',
        'john-10-11':
          '"I am the good shepherd: the good shepherd giveth his life for the sheep." The Shepherd of the psalms is Jesus, who dies for you to bring you home.',
        'john-11-25':
          '"I am the resurrection, and the life." At His friend\'s tomb, Jesus offered not a doctrine but His own person as the victory over death.',
        'john-14-1':
          '"Let not your heart be troubled: ye believe in God, believe also in me." Jesus sets trust in Him on the level of trust in God: to rest in Christ is to rest in God.',
        'john-14-6':
          '"I am the way, the truth, and the life: no man cometh unto the Father, but by me." Not one of many paths: Christ is the only and sufficient way to God.',
        'john-15-5':
          '"I am the vine, ye are the branches." All life and fruit come from abiding in Jesus; apart from Him we can do nothing.',
        'john-16-33':
          '"In the world ye shall have tribulation: but be of good cheer; I have overcome the world." The peace of Christ does not deny pain: it rests in His victory.',
        'acts-4-12':
          '"Neither is there salvation in any other." There is no other name given among men by which we must be saved: only Jesus.',
        'acts-16-31':
          '"Believe on the Lord Jesus Christ, and thou shalt be saved." Salvation is not earned: it is received by trusting in Christ.',
        'romans-5-1':
          'Being justified by faith, we have peace with God through our Lord Jesus Christ. The war is over: the cross made peace.',
        'romans-5-8':
          '"While we were yet sinners, Christ died for us." God\'s love did not wait for us to improve: it was proven at the cross.',
        'romans-6-23':
          '"The wages of sin is death; but the gift of God is eternal life through Jesus Christ." He traded what we deserved for what He freely gives.',
        'romans-8-1':
          '"There is therefore now no condemnation to them which are in Christ Jesus." In Him, the verdict over the believer is no longer "guilty" but "beloved child."',
        'romans-8-32':
          '"He that spared not his own Son... how shall he not with him also freely give us all things?" The cross is the guarantee of every other goodness of God.',
        'romans-10-9':
          '"If thou shalt confess with thy mouth the Lord Jesus, and shalt believe... thou shalt be saved." The lordship and resurrection of Christ are the center of saving faith.',
        '2corinthians-5-17':
          '"If any man be in Christ, he is a new creature." Joined to Jesus, you are not an improved version: you are a new creation.',
        '2corinthians-5-21':
          '"He hath made him to be sin for us... that we might be made the righteousness of God in him." The great exchange: our sin for His righteousness.',
        'galatians-2-20':
          '"I am crucified with Christ... Christ liveth in me." The Christian life is not imitating Jesus from afar, but Christ living in you by faith.',
        'galatians-6-14':
          '"God forbid that I should glory, save in the cross of our Lord Jesus Christ." The only thing worth boasting in is what Christ did for us.',
        'ephesians-1-7':
          '"In whom we have redemption through his blood, the forgiveness of sins." Forgiveness is neither cheap nor automatic: it cost the blood of the Son.',
        'ephesians-2-8':
          '"For by grace are ye saved through faith... it is the gift of God." Salvation is a gift, from start to finish the work of Christ.',
        'philippians-2-9':
          '"God also hath highly exalted him, and given him a name which is above every name." The One who humbled Himself to the cross now reigns as Lord of all.',
        'philippians-4-19':
          '"My God shall supply all your need according to his riches... by Christ Jesus." God\'s provision flows from the riches we have in His Son.',
        'colossians-1-16':
          '"All things were created by him, and for him." Jesus is no mere creature: He is the Creator, before all things, and in Him all things hold together.',
        '1timothy-1-15':
          '"Christ Jesus came into the world to save sinners." A faithful saying, worthy of all acceptance: He came for sinners, and that includes you.',
        'titus-2-11':
          '"The grace of God that bringeth salvation hath appeared to all men." That grace has a face and a name: it appeared in Jesus.',
        'hebrews-7-25':
          '"He is able also to save them to the uttermost... seeing he ever liveth to make intercession." Christ did not just save once: He lives today praying for His own.',
        'hebrews-12-2':
          '"Looking unto Jesus the author and finisher of our faith." The Christian race is run looking to Christ, not to oneself.',
        'hebrews-13-8':
          '"Jesus Christ the same yesterday, and to day, and for ever." In a world that changes, He is the rock that does not change.',
        '1peter-1-3':
          '"Begotten us again unto a lively hope by the resurrection of Jesus Christ." Our hope is alive because the Lord is alive.',
        '1peter-2-24':
          '"Who his own self bare our sins in his own body on the tree." The prophecy of Isaiah 53 is fulfilled here: by His stripes we were healed.',
        '2peter-3-9':
          '"The Lord is... longsuffering, not willing that any should perish, but that all should come to repentance." His delay is not forgetfulness: it is mercy giving time to turn to Christ.',
        '2peter-3-18':
          '"Grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ." This is the goal of the whole Christian life—and the heart of this app.',
        '1john-1-9':
          '"If we confess our sins, he is faithful and just to forgive us." Forgiveness is sure because it rests on the blood of Jesus, not on our merit.',
        '1john-4-7':
          '"Let us love one another: for love is of God." And where is that love seen? In that God sent his only Son into the world that we might live through him. We love because He first loved us.',
        '1john-4-10':
          '"Not that we loved God, but that he loved us, and sent his Son to be the propitiation for our sins." True love began at the cross.',
        '1john-4-19':
          '"We love him, because he first loved us." All Christian love is a response to the love Christ poured out first.',
        'jude-1-24':
          '"Unto him that is able to keep you from falling, and to present you faultless..." Your final perseverance rests not on your strength but on Christ who holds you.',
        'revelation-3-20':
          '"Behold, I stand at the door, and knock." The Lord of the universe does not force His way in: He seeks fellowship with you and waits for your answer.',
        'revelation-21-4':
          '"God shall wipe away all tears... and there shall be no more death." The work of Christ ends here: a new world without pain, forever with Him.',
        'revelation-21-5':
          '"Behold, I make all things new." The One who conquered death will have the last word: not the end, but everything made new in Christ.',
        'isaiah-41-10':
          '"Fear not, for I am with you." The promise of God\'s presence finds its face in Jesus, who said: "Lo, I am with you always, even unto the end of the world."',
        'jeremiah-29-11':
          'God has thoughts of peace, to give you a future and a hope. That living, certain hope is given to us in Christ, raised from the dead.',
        'psalms-51-10':
          '"Create in me a clean heart." What David asks, Christ fulfills: by His blood we draw near to God with a purified heart and a cleansed conscience.',
        'john-14-27':
          '"Peace I leave with you, my peace I give unto you." Not just any peace, but Christ\'s own peace, bought at the cross — so He adds: "Let not your heart be troubled."',
        'romans-8-28':
          'God works all things together for good for His people, and that good has a goal: to be conformed to the image of His Son. Everything leads us toward Christ.',
        'philippians-4-13':
          '"I can do all things through Christ who strengthens me." The strength is not our own: it is Christ\'s in us, enough in plenty and in want alike.',
        'job-19-25':
          '"I know that my Redeemer lives." In the depths of suffering, Job trusts in a living Redeemer; that Redeemer is Christ, who said: "I am the resurrection and the life."',
        'psalms-16-11':
          '"You will show me the path of life." Peter quoted this psalm at Pentecost of Christ\'s resurrection: death could not hold Him, and in Him we find the path of life.',
        'psalms-27-1':
          '"The LORD is my light and my salvation." What the psalmist confesses, Jesus declares of Himself: "I am the light of the world." In Him there is no one to fear.',
        'psalms-34-8':
          '"O taste and see that the LORD is good." Peter takes these words and applies them to Christ: "if so be ye have tasted that the Lord is gracious." To taste Him is to know Him.',
        'proverbs-18-10':
          '"The name of the LORD is a strong tower." That saving name is given to us in Jesus, "for there is none other name... whereby we must be saved."',
        'isaiah-26-3':
          '"You will keep him in perfect peace, whose mind is stayed on You." That peace has a name: Christ, who said, "my peace I give unto you."',
        'isaiah-43-2':
          '"When you pass through the waters, I will be with you." The promised presence is Christ\'s, who assures us: "Lo, I am with you always."',
        'zephaniah-3-17':
          '"The LORD your God in the midst of you is mighty; He will save." God in the midst of His people to save: that is Immanuel, "God with us," Jesus.',
        'matthew-28-20':
          '"Lo, I am with you always, even unto the end of the world." The risen Christ does not leave us alone: His presence goes with us every single day.',
        'john-13-34':
          '"A new commandment I give unto you, That ye love one another; as I have loved you." The measure of Christian love is the love of Christ, who gave Himself for us.',
        'revelation-1-8':
          '"I am Alpha and Omega... which is, and which was, and which is to come." The eternal Lord of the beginning and the end is Jesus, who came and who will return (cf. Rev 22:13).',
        'exodus-14-14':
          '"The LORD shall fight for you, and ye shall hold your peace." The battle we could not win, Christ won: at the cross He disarmed the powers and triumphed over them.',
        'deuteronomy-31-6':
          '"He will not fail thee, nor forsake thee." That promise is ours in Christ; Hebrews repeats it to believers, for the Lord Himself goes with us.',
        'joshua-1-9':
          '"Be strong and of a good courage... for the LORD thy God is with thee." Courage is not from us but from His presence: the risen Christ says, "I am with you always."',
        '1samuel-16-7':
          '"The LORD looketh on the heart." Christ knew what was in man; before Him there are no masks, and still He loves us and calls us.',
        'psalms-18-2':
          '"The LORD is my rock, and my fortress." Paul says the rock that followed Israel was Christ: our sure refuge has a face.',
        'psalms-19-1':
          '"The heavens declare the glory of God." And those heavens were made through the Son: in Him all things were created, and everything proclaims His glory.',
        'psalms-28-7':
          '"The LORD is my strength and my shield." That strength is given to us in Christ, who said, "I can do all things through Christ which strengtheneth me."',
        'psalms-46-1':
          '"God is our refuge and strength, a very present help in trouble." That refuge drew near in Jesus, who invites: "Come unto me... and I will give you rest."',
        'psalms-46-10':
          '"Be still, and know that I am God." The One who stills the soul stilled the storm with His voice: "Peace, be still," said Jesus, and all grew calm.',
        'psalms-55-22':
          '"Cast thy burden upon the LORD, and he shall sustain thee." Peter echoes it pointing to Christ: "casting all your care upon him; for he careth for you."',
        'psalms-103-2':
          '"Bless the LORD, O my soul... who forgiveth all thine iniquities." That full forgiveness reaches us in Christ, in whom we have redemption through His blood.',
        'psalms-118-24':
          '"This is the day which the LORD hath made." It is the psalm of the stone the builders rejected, become the head of the corner: Christ, the cause of our joy.',
        'psalms-119-105':
          '"Thy word is a lamp unto my feet, and a light unto my path." That Word became flesh: Jesus, the living Word and the light of the world, lights the way.',
        'psalms-147-3':
          '"He healeth the broken in heart." Jesus opened His ministry with that promise: He was anointed to heal the brokenhearted.',
        'proverbs-3-5':
          '"Trust in the LORD with all thine heart; and lean not unto thine own understanding." That trust finds its rest in Christ, the sure way to the Father.',
        'isaiah-64-8':
          '"We are the clay, and thou our potter." In Christ we are a new creation: the Potter remakes in His Son what sin had broken.',
        'jeremiah-33-3':
          '"Call unto me, and I will answer thee." Jesus widens that promise: "whatsoever ye shall ask the Father in my name, he will give it you."',
        'nahum-1-7':
          '"The LORD is good, a strong hold in the day of trouble." That stronghold is Christ, in whom we have peace amid affliction: "I have overcome the world."',
        'matthew-5-14':
          '"Ye are the light of the world." We shine only as a reflection of the One who is the Light: "I am the light of the world," said Jesus.',
        'matthew-6-33':
          '"Seek ye first the kingdom of God, and his righteousness." To seek the kingdom is to seek the King: in Christ the kingdom comes, and in Him the righteousness we could not earn is given.',
        'matthew-19-26':
          '"With men this is impossible; but with God all things are possible." He said it of salvation: what man cannot do, God does in Christ, who came to save the lost.',
        'matthew-22-37':
          '"Thou shalt love the Lord thy God with all thy heart." Only One kept this command perfectly: Christ, who now gives us His Spirit to love.',
        'mark-10-27':
          '"With men it is impossible, but not with God: for with God all things are possible." Salvation is His work from first to last, accomplished in Christ.',
        'luke-6-31':
          '"As ye would that men should do to you, do ye also to them likewise." Jesus not only taught it: He lived it, giving Himself for us when we deserved nothing.',
        'acts-1-8':
          '"Ye shall be witnesses unto me." The heart of Christian witness is a Person: the risen Christ, proclaimed to the ends of the earth.',
        'romans-8-31':
          '"If God be for us, who can be against us?" The proof that God is on our side is that He gave His own Son for us.',
        'romans-8-38':
          '"Neither things present, nor things to come... shall be able to separate us from the love of God, which is in Christ Jesus." The love that holds us is no idea: its name is Christ Jesus.',
        'romans-12-2':
          '"Be ye transformed by the renewing of your mind." That transformation is being conformed to the image of His Son: growing to look like Christ.',
        'romans-15-13':
          '"Now the God of hope fill you with all joy and peace in believing." All that hope rests on the risen Christ, our hope of glory.',
        '1corinthians-10-13':
          '"God... will with the temptation also make a way to escape." That way of escape is Christ, who was tempted in every way yet overcame, and helps those who are tempted.',
        '1corinthians-13-13':
          '"And now abideth faith, hope, charity... but the greatest of these is charity." That love which bears all things we see in its purest form at the cross of Christ.',
        '2corinthians-4-16':
          '"The inward man is renewed day by day." That new life is the life of Christ in us, which not even death can put out.',
        '2corinthians-12-9':
          '"My grace is sufficient for thee: for my strength is made perfect in weakness." It is the voice of Christ: His power rests upon the weak who trust in Him.',
        'galatians-5-22':
          '"The fruit of the Spirit is love, joy, peace..." That fruit is the very character of Christ being formed in those who abide in Him.',
        'ephesians-3-20':
          '"Him that is able to do exceeding abundantly above all that we ask or think." That power works in us through Christ, by His Spirit dwelling in the believer.',
        'ephesians-4-32':
          '"Forgiving one another, even as God for Christ’s sake hath forgiven you." The measure of our forgiving is the forgiveness we received at the cross.',
        'ephesians-6-10':
          '"Be strong in the Lord, and in the power of his might." He asks not for our own strength but His: to stand firm in Christ and in His victory.',
        'philippians-1-6':
          '"He which hath begun a good work in you will perform it." Christ is the author and finisher of faith: what He begins, He completes.',
        'hebrews-4-12':
          '"The word of God is quick, and powerful." The Word that searches the heart is the same that became flesh: Christ, living and mighty to save.',
        'james-1-5':
          '"If any of you lack wisdom, let him ask of God." And Christ is made unto us wisdom from God: in Him are hidden all the treasures of wisdom.',
        '1john-3-1':
          '"Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God." That love was shown by sending His Son, that we might live through Him.',
        '1john-4-8':
          '"God is love." We know it not by a definition but by an act: "In this was manifested the love of God... that God sent his only begotten Son" that we might live through Him.',
        'deuteronomy-31-8':
          '"The LORD goes before you; He will be with you, He will not leave you nor forsake you." That promise has a face in Jesus, Immanuel—God with us—who said, "I am with you always."',
        'nehemiah-8-10':
          '"The joy of the LORD is your strength." That joy became ours in Christ: "These things I have spoken to you, that my joy may be in you, and your joy may be full."',
        'psalms-30-5':
          '"Weeping may endure for a night, but joy comes in the morning." It is resurrection morning: Jesus promised that our sorrow would turn into joy that no one can take away.',
        'psalms-94-19':
          '"Your comforts delight my soul." That comfort of God took on a body in Jesus, whom Simeon embraced as "the consolation of Israel."',
        'psalms-139-14':
          '"I am fearfully and wonderfully made." Every life was woven through the Son, for all things were created through Him and for Him.',
        'psalms-145-18':
          '"The LORD is near to all who call upon Him." In Christ that nearness is salvation: "everyone who calls on the name of the Lord will be saved."',
        'proverbs-3-6':
          '"In all your ways acknowledge Him, and He will make your paths straight." The one who straightens our path is Christ, made unto us wisdom from God: to trust Him is to walk straight.',
        'ecclesiastes-3-1':
          '"To everything there is a season." The appointed time came when, "in the fullness of time, God sent forth His Son": in Christ history finds its meaning.',
        'isaiah-55-8':
          '"My thoughts are not your thoughts." The wisdom of God, so far above ours, was revealed in Christ, "the wisdom of God" to those who are saved.',
        'habakkuk-3-19':
          '"The Lord GOD is my strength." That strength has a name: "I can do all things through Christ who strengthens me," the strength that holds us on the heights.',
        'matthew-5-16':
          '"Let your light shine before men." We shine only by reflecting the One who said, "I am the light of the world"; our light is Christ within us.',
        'matthew-7-7':
          '"Ask, and it will be given to you." Jesus teaches us to ask and gives us access to the Father: "ask in my name... that your joy may be full."',
        'romans-12-12':
          '"Rejoicing in hope." Our hope is not an idea but a Person: "Christ in you, the hope of glory."',
        '1corinthians-13-4':
          '"Love is patient, love is kind." It is the portrait of Christ: put His name where it says "love" and you will see the cross, where He laid down His life for us.',
        '1corinthians-15-58':
          '"Your labor in the Lord is not in vain." It is not, because Christ is risen, "the firstfruits of those who have fallen asleep": His victory secures ours.',
        '2corinthians-5-7':
          '"We walk by faith, not by sight." We walk with our eyes fixed on Jesus, "the author and finisher of faith," even while we do not yet see Him.',
        '2corinthians-9-7':
          '"God loves a cheerful giver." We give cheerfully because we first received: "Thanks be to God for His indescribable gift!"—Christ, the Gift who gave all.',
        'galatians-6-9':
          '"Let us not grow weary in doing good." We look to Jesus, who "endured the cross... lest you grow weary and lose heart": He never tired of loving us.',
        'philippians-4-6':
          '"Be anxious for nothing... present your requests." And the peace that then guards the heart is "in Christ Jesus": prayer brings us to His peace.',
        'philippians-4-7':
          '"The peace of God, which surpasses all understanding." That peace has a name, for "He Himself is our peace": Christ reconciled what was divided.',
        'colossians-3-2':
          '"Set your mind on things above." There the believer’s heart rests, "where Christ is, seated at the right hand of God."',
        'colossians-3-15':
          '"Let the peace of Christ rule in your hearts." It is no ordinary calm: it is the peace He bought and shares, ruling as Lord among His people.',
        'colossians-3-23':
          '"Whatever you do, do it heartily, as for the Lord." For in truth we serve Christ: even the humblest work becomes worship offered to Him.',
        '2timothy-3-16':
          '"All Scripture is breathed out by God." And all of it speaks of Christ: He Himself said the Scriptures "are they which testify of me."',
        'hebrews-11-1':
          '"Faith is the assurance of things hoped for." All that faith looks to one alone: Jesus, "the author and finisher of faith," in whom what is hoped for becomes sure.',
        'hebrews-11-6':
          '"Without faith it is impossible to please God." And we come to God by one road: "I am the way," said Jesus; the faith that pleases the Father rests on the Son.',
        'hebrews-12-1':
          '"Let us run with endurance the race." The next verse tells us how: "looking unto Jesus," who ran and won before us.',
        'hebrews-13-5':
          '"I will never leave you nor forsake you." It is the voice of the Lord who became flesh: "I am with you always, even to the end of the age."',
        'james-1-12':
          '"He will receive the crown of life." It is the crown Christ promises: "Be faithful unto death, and I will give you the crown of life."',
        'james-1-17':
          '"Every good gift... comes down from above." The Father’s greatest gift is His Son: "God so loved the world that He gave His only begotten Son."',
        'james-4-8':
          '"Draw near to God, and He will draw near to you." We can draw near with confidence because Christ opened the way: through His blood we enter "with a true heart."',
        '1peter-4-8':
          '"Love covers a multitude of sins." The love that truly covers sin is Christ’s, who "Himself bore our sins in His body on the tree."',
        '1peter-5-6':
          '"Humble yourselves... that He may exalt you in due time." It is the path Jesus walked first: "He humbled Himself... therefore God has highly exalted Him."',
        '1peter-5-7':
          '"Casting all your care upon Him, for He cares for you." The One who cares for you is Christ, who calls: "Come to me... and I will give you rest."',
        '1john-4-18':
          '"Perfect love casts out fear." That perfect love is Christ: "in this is love... that He loved us and sent His Son to be the propitiation for our sins."',
        '1john-5-14':
          '"If we ask anything according to His will, He hears us." We have that confidence because Christ "ever lives to make intercession" for us before the Father.',
        'joshua-24-15':
          '"As for me and my house, we will serve the LORD." The Lord we serve has a face: "you serve the Lord Christ," says Paul — to choose Him is to serve the Savior.',
        '1chronicles-16-11':
          '"Seek the LORD... seek his face continually." That face was unveiled in Christ: God shone in our hearts "in the face of Jesus Christ."',
        '2chronicles-7-14':
          '"If my people humble themselves... I will forgive." The promised pardon flows from the cross: "if we confess our sins, he is faithful and just to forgive."',
        'psalms-1-1':
          '"Blessed is the man who walks not in the counsel of the wicked." The one perfectly righteous Man is Christ; in Him "who knew no sin" we are made the righteousness of God.',
        'psalms-32-8':
          '"I will teach you the way you should go." That way is a Person: "I am the way," said Jesus; He himself leads us to the Father.',
        'psalms-37-4':
          '"Delight yourself in the LORD." The greatest delight is to know Him: Paul counted all things loss "for the surpassing worth of knowing Christ Jesus."',
        'psalms-42-11':
          '"Why are you cast down, O my soul? Hope in God." To that weary soul Jesus says, "Come to me... and I will give you rest"; our hope is Him.',
        'psalms-56-3':
          '"When I am afraid, I put my trust in you." The peace that conquers fear is Christ\'s: "my peace I give to you; let not your heart be troubled or afraid."',
        'psalms-62-1':
          '"For God alone my soul waits; from him comes my salvation." That salvation has a name: "there is salvation in no one else" but Jesus, the only name that saves.',
        'psalms-73-26':
          '"God is my portion forever." To have God as our eternal portion is to have Christ, who says, "I am the resurrection and the life."',
        'psalms-90-12':
          '"Teach us to number our days, that we may get a heart of wisdom." The wisdom we need has been "made unto us" in Christ, "the wisdom of God."',
        'psalms-91-1':
          '"He who dwells in the shelter of the Most High." Our safe hiding place is Christ: "your life is hidden with Christ in God."',
        'psalms-100-4':
          '"Enter his gates with thanksgiving." We enter the Father\'s presence through one alone: "through him... we have access... to the Father."',
        'psalms-121-2':
          '"My help comes from the LORD, who made heaven and earth." That Maker is Christ: "by him all things were created"; the Creator himself is our help.',
        'proverbs-15-1':
          '"A soft answer turns away wrath." Gentleness has its model in Jesus: "learn from me, for I am gentle and lowly in heart."',
        'proverbs-17-17':
          '"A friend loves at all times." The Friend who loves to the end is Christ: "greater love has no one than this, that he lay down his life for his friends."',
        'matthew-6-34':
          '"Do not be anxious about tomorrow." We can lay anxiety down because Another cares for us: "casting all your care on him, for he cares for you."',
        'mark-11-24':
          '"Whatever you ask in prayer, believe that you have received it." Jesus opens our access to the Father: "whatever you ask the Father in my name, I will do it."',
        'mark-12-30':
          '"Love the Lord your God with all your heart." We love like this only because He loved first: "we love him, because he first loved us."',
        'philippians-4-8':
          '"Whatever is true... think about these things." The mind finds its rest fixed on Jesus, "looking to Jesus, the author and finisher of our faith."',
        '1thessalonians-5-17':
          '"Pray without ceasing." We can, because Christ never ceases to pray: He "ever lives to make intercession" for those who come to God through Him.',
        '2timothy-1-7':
          '"God gave us a spirit not of fear, but of power and love and self-control." It is the Spirit Christ gives: "the Spirit of adoption" who cries "Abba, Father," not of fear.',
        'james-4-7':
          '"Resist the devil, and he will flee from you." We stand firm because Christ already won: "the Son of God appeared to destroy the works of the devil."',
        '1peter-3-15':
          '"Honor Christ the Lord as holy... give a reason for the hope that is in you." That hope is Himself in us: "Christ in you, the hope of glory."',
        'psalms-91-2':
          '"My refuge and my fortress, my God, in whom I trust." We have One to flee to: we have "fled for refuge to lay hold of the hope set before us" — an anchor of the soul, sure and steadfast in Christ.',
        'psalms-103-1':
          '"Bless the LORD, O my soul... bless his holy name." The name we bless above all is Jesus\' — "a name that is above every name," before whom every knee will bow.',
        'psalms-121-1':
          '"I lift up my eyes to the hills. From where does my help come?" The help has a name: "the Lord is my helper; I will not fear," for Christ is with His own.',
        'psalms-143-8':
          '"Let me hear of your steadfast love in the morning... the way I should go." That love was shown at the cross: "while we were still sinners, Christ died for us."',
        'proverbs-4-23':
          '"Keep your heart, for from it flow the springs of life." The spring of life the heart needs is Christ: "out of his heart will flow rivers of living water," Jesus said of the Spirit.',
        'proverbs-16-3':
          '"Commit your works to the LORD, and your plans will be established." The One who establishes and finishes the work is He: "he who began a good work in you will complete it" at the day of Christ.',
        'proverbs-22-6':
          '"Train up a child in the way he should go." The way we raise children is the Lord\'s: "bring them up in the discipline and instruction of the Lord," that they may know Christ.',
        'proverbs-27-17':
          '"Iron sharpens iron; so one man sharpens another." We sharpen one another toward one end: to "grow up... into him who is the head, Christ."',
        'proverbs-31-25':
          '"Strength and dignity are her clothing, and she laughs at the time to come." Such strength to face the future without fear has one source: "I can do all things through Christ who strengthens me."',
        'matthew-6-21':
          '"Where your treasure is, there your heart will be also." The treasure that anchors the heart is above: "seek the things that are above, where Christ is"; He is our treasure.',
        '1corinthians-16-14':
          '"Let all that you do be done in love." We love by a new pattern: "love one another; as I have loved you," said Jesus.',
        '1thessalonians-5-16':
          '"Rejoice always." The joy that remains is His: "that my joy may be in you, and that your joy may be full."',
        '1thessalonians-5-18':
          '"Give thanks in all circumstances." The verse itself roots it in Christ: it is "the will of God in Christ Jesus for you"; in His name we give thanks.',
        '1timothy-4-12':
          '"Be an example to the believers." We are so only by following the Example: "Christ suffered for you, leaving you an example, that you should follow in his steps."',
        'hebrews-10-23':
          '"Hold fast the confession of our hope, for he who promised is faithful." That faithfulness has a face: "all the promises of God find their Yes in him."',
        'james-1-2':
          '"Count it all joy when you meet trials." We can rejoice because tested faith leads to glory: we rejoice "though now... grieved by trials," looking to Christ.',
      },
    },
    collections: {
      title: 'Collections',
      subtitle: 'Your verse lists',
      cardTitle: 'Collections',
      cardSubtitle: 'Group your saved verses',
      browseHint: 'Group your favorites into named lists',
      verses: 'verses',
      empty: 'No collections yet',
      emptyHint:
        'Tag a favorite with the bookmark icon to create your first collection',
      openHint: 'Open collection',
      addTitle: 'Add to a collection',
      newPlaceholder: 'New collection…',
      create: 'Create',
      done: 'Done',
      manage: 'Collections',
      addAction: 'Add to collection',
      removeFromCollection: 'Remove from collection',
      share: 'Share collection',
      shareImage: 'Share as image',
      shareHeader: 'Collection',
      listen: 'Listen to the collection',
    },
    themes: {
      title: 'Explore by Theme',
      subtitle: 'Passages by topic',
      cardTitle: 'Explore by Theme',
      cardSubtitle: 'Find passages by topic',
      browseHint: 'Pick a theme to see its passages',
      verses: 'verses',
      openHint: 'Open passage',
      missingText: '(text not available)',
      error: 'Could not load the passages',
      listenAll: 'Listen to this theme',
      list: {
        faith: {name: 'Faith', description: 'Trust in what you cannot yet see'},
        love: {name: 'Love', description: "God's love and loving others"},
        hope: {name: 'Hope', description: 'Steadfast hope in every season'},
        peace: {name: 'Peace', description: 'Calm for an anxious heart'},
        strength: {
          name: 'Strength',
          description: 'Renewed strength in weakness',
        },
        forgiveness: {
          name: 'Forgiveness',
          description: 'Forgiving and being forgiven',
        },
        wisdom: {name: 'Wisdom', description: 'Wisdom for living well'},
        prayer: {name: 'Prayer', description: 'Drawing near to God in prayer'},
        courage: {name: 'Courage', description: 'Courage in the face of fear'},
        comfort: {name: 'Comfort', description: 'Comfort in grief and loss'},
        joy: {name: 'Joy', description: 'Joy and gratitude in the Lord'},
        grace: {name: 'Grace', description: "God's unmerited grace"},
        salvation: {name: 'Salvation', description: 'The way of salvation'},
        guidance: {name: 'Guidance', description: 'Direction for your path'},
      },
    },

    feelings: {
      title: 'How are you feeling today?',
      subtitle: 'A word for your heart',
      cardTitle: 'How are you feeling?',
      cardSubtitle: 'Verses for what you feel today',
      browseHint: 'Pick how you feel and let the Word answer',
      homePrompt: 'How are you feeling today?',
      seeAll: 'See all',
      verses: 'verses',
      moodVerseTitle: 'For your mood today',
      moodVerseHint: 'Tap to read it in its chapter',
      openHint: 'Open passage',
      missingText: '(text not available)',
      error: 'Could not load the passages',
      listenAll: 'Listen to these verses',
      prayerTitle: 'A short prayer',
      relatedTheme: 'Explore the theme: {{theme}}',
      list: {
        anxious: {
          name: 'Anxious',
          description: "When worry won't let go",
          prayer:
            'Lord, I place in your hands what I cannot control. Give me your peace that passes all understanding. Amen.',
        },
        overwhelmed: {
          name: 'Overwhelmed',
          description: 'When everything feels like too much',
          prayer:
            'My God, when my heart is faint, lead me to the rock that is higher than I. Be my refuge. Amen.',
        },
        sad: {
          name: 'Sad',
          description: 'When your heart is broken',
          prayer:
            'Father, you are near to the brokenhearted. Comfort me and heal my wounds. Amen.',
        },
        tired: {
          name: 'Tired',
          description: 'When you have no strength left',
          prayer:
            'Jesus, I come to you weary and burdened. Give me your rest and renew my strength. Amen.',
        },
        afraid: {
          name: 'Afraid',
          description: 'When fear weighs more than faith',
          prayer:
            'Lord, when I am afraid, I put my trust in you. Take my hand and give me your courage. Amen.',
        },
        lonely: {
          name: 'Lonely',
          description: 'When no one seems near',
          prayer:
            'Father, thank you that you never leave me nor forsake me. Let me feel your presence today. Amen.',
        },
        guilty: {
          name: 'Guilty',
          description: 'When the past accuses you',
          prayer:
            'My God, I confess my sin and receive your forgiveness. Create in me a clean heart. Amen.',
        },
        angry: {
          name: 'Angry',
          description: 'When anger wants to win',
          prayer:
            'Lord, calm my anger before it does harm. Give me a heart quick to forgive. Amen.',
        },
        confused: {
          name: 'Confused',
          description: "When you don't know which way to go",
          prayer:
            'Father, I will not lean on my own understanding. Make my paths straight and guide me. Amen.',
        },
        hopeful: {
          name: 'Hopeful',
          description: 'When you await what God will do',
          prayer:
            'God of hope, fill me with all joy and peace in believing. Your mercies are new every morning. Amen.',
        },
        grateful: {
          name: 'Grateful',
          description: 'When you want to give thanks',
          prayer:
            'Father, every good gift comes from you. Thank you for your faithfulness, today and always. Amen.',
        },
        joyful: {
          name: 'Joyful',
          description: 'When joy overflows',
          prayer:
            'Lord, this is the day that you have made. I will rejoice and be glad in it. Amen.',
        },
      },
    },

    lectio: {
      title: 'Moment with God',
      subtitle: 'Praying the Word',
      cardTitle: 'Moment with God',
      cardSubtitle: 'Read, meditate, pray and contemplate a passage',
      stepLabels: {
        lectio: 'Read',
        meditatio: 'Meditate',
        oratio: 'Pray',
        contemplatio: 'Contemplate',
      },
      stepIntros: {
        lectio: 'Read the passage slowly. Let the words breathe.',
        meditatio: 'Read it again. Stay where your heart pauses.',
        oratio: 'Answer God in your own words.',
        contemplatio: 'Keep silence. Rest in His presence.',
      },
      meditationPrompts: [
        'Which word or phrase stops you? Why?',
        "What does this verse reveal about God's heart?",
        'If God whispered this to you today, what would change?',
        'What does this verse invite you to release… or to embrace?',
        'Where do you need this truth this week?',
        'Slowly repeat the phrase that touches you most, twice.',
      ],
      listen: 'Listen',
      prayerPlaceholder: 'Write your prayer here…',
      prayerHint: 'When you finish, your prayer is saved to your notes.',
      timerStart: 'Begin the silence',
      timerPause: 'Pause',
      timerDone: 'The silence has ended. Stay a moment longer if you wish.',
      minutesOption: '{{n}} min',
      next: 'Next',
      back: 'Back',
      finish: 'Finish',
      finishedTitle: 'Session complete',
      finishedMessage: 'May His Word remain in you the rest of the day.',
      shareImage: 'Share as image',
      memorize: 'Memorize this verse',
      memorized: 'Added to your memory deck',
      memorizedAlready: 'Already in your memory deck',
      done: 'Done',
      prayerSaved: 'Your prayer was saved to your notes',
      error: 'Could not load the passage',
      exitA11y: 'Exit Moment with God',
    },

    guided: {
      title: 'Guided devotion',
      subtitle: 'A moment with God, step by step',
      cardTitle: 'Guided devotion',
      cardSubtitle: 'Begin with how your heart is today',
      breathePrompt: 'Take a deep breath. How is your heart today?',
      revealLabel: 'For when you feel like this · {{feeling}}',
      begin: 'Begin your Moment with God',
      another: 'Choose another feeling',
      error: 'Could not prepare your devotion',
      exitA11y: 'Close guided devotion',
    },

    devotion: {
      streakTitle: 'Your time with God',
      streakDays: '{{n}} days with God',
      streakOneDay: '1 day with God',
      streakBest: 'Your best: {{n}}',
      streakTodayDone: "You've had your moment today",
      streakTodayPending: "Today's moment awaits",
      streakLapsed: 'Pick your walk back up',
      streakHint: 'Open the guided devotion',
    },

    prophecies: {
      title: 'Prophetic thread',
      subtitle: 'Christ in the prophecies',
      intro:
        'All of Scripture speaks of Him (Luke 24:27). Walk, step by step, through the prophecies that foretold the Messiah and the passages where they are fulfilled in the Lord Jesus.',
      begin: 'Begin',
      prev: 'Previous',
      next: 'Next',
      finish: 'Amen',
      done: 'Done',
      stepOf: 'Prophecy {{n}} of {{total}}',
      progress: '{{n}} of {{total}} explored',
      viewIndex: 'View index',
      indexTitle: 'Thread index',
      viewMap: 'View the map',
      mapTitle: 'Thread map',
      mapSubtitle: 'All Scripture converges on Him',
      mapHint:
        'Tap a thread (at either end) to highlight it and see what it is.',
      shareMap: 'Share the map',
      openInWalk: 'Open in the walk',
      otTestament: 'Old Testament',
      ntTestament: 'New Testament',
      prophecyLabel: 'Prophecy',
      shadowLabel: 'Shadow',
      fulfilledIn: 'Fulfilled in',
      openInReader: 'Open in reader',
      share: 'Share',
      constellation: 'Constellation',
      study: 'Study',
      memorize: 'Memorize',
      memorized: 'In your deck',
      todayLabel: 'Today',
      todayTitle: "Today's prophecy",
      favorite: 'Save as favorite',
      unfavorite: 'Remove from favorites',
      filterAll: 'All',
      filterFavorites: 'Favorites',
      filterQuoted: 'Quoted',
      noFavorites:
        'No favorite prophecies yet. Tap the star on a step to save one.',
      listen: 'Listen',
      stopListening: 'Stop',
      walkthroughStart: 'Narrated walkthrough',
      walkthroughStop: 'Stop walkthrough',
      togetherCta: 'Read the thread together',
      completedBadge: 'Thread complete',
      shareSignature: 'Eternal Bible · Prophetic thread',
      quotedBadge: 'Cited in the NT',
      sourcesTitle: 'Sources & method',
      sourcesHint: 'How these prophecies were chosen',
      sourcesBody:
        'This thread gathers Old-Testament messianic prophecies and their fulfillment in Christ. The criterion is conservative: only prophecies the New Testament itself cites as fulfilled, or broadly held by the historic church — never speculation. The primary source is Scripture: each "Fulfilled in" is the New Testament\'s own word, and the "Cited in the NT" badge marks the ones the NT quotes explicitly. Cross-references also draw on openbible.info (CC BY). Where a prophecy spans several verses, one representative verse is linked; open the passage to read its context.',
      missingText: 'Verse unavailable',
      finishedTitle: 'Christ, the center of it all',
      finishedBody:
        'You have walked the thread that unites all of Scripture in Him. "Search the Scriptures… they are the ones that testify of Me" (John 5:39).',
      whyTitle: 'Why it matters',
      whyBody:
        'That Scripture announced these things centuries beforehand and they were fulfilled in Jesus is no accident: it shows that God rules history and keeps His word. The Lord Himself "expounded unto them in all the scriptures the things concerning himself" (Luke 24:27, 44) and invites us to search them, "for they are they which testify of me" (John 5:39). This is not about counting odds, but about humbly worshiping the faithful God who keeps His promises in Christ.',
      christHereTitle: 'Christ in this passage',
      quizPlay: 'Play the quiz',
      quizTitle: 'Prophecy and fulfillment',
      quizSubtitle: 'Match each prophecy with its fulfillment in Christ',
      quizHint: 'Tap a prophecy, then its fulfillment, to pair them.',
      quizScore: 'Correct',
      quizMistakes: 'Mistakes',
      quizRoundOf: 'Round {{n}}',
      quizComplete: 'Round complete!',
      quizCompletePerfect: 'Perfect round! 🎉',
      quizNextRound: 'New round',
      groups: {
        coming: 'His coming',
        ministry: 'His ministry',
        passion: 'His passion',
        resurrection: 'His resurrection and glory',
        shadows: 'Shadows of Christ',
      },
      items: {
        'gen-3-15': {
          label: 'The seed of the woman',
          note: "From the fall, God promises the woman's seed will crush the serpent's head; Christ, born of a woman, came to undo the works of the devil.",
        },
        'gen-22-18': {
          label: 'Blessing to the nations',
          note: "In Abraham's seed all nations would be blessed; that seed, Paul says, is Christ.",
        },
        'gen-49-10': {
          label: 'From the tribe of Judah',
          note: "The scepter would not depart from Judah until Shiloh came; the Lord Jesus was born of Judah's tribe.",
        },
        'num-24-17': {
          label: 'A star out of Jacob',
          note: 'Balaam saw from afar a star rising out of Jacob; the magi followed His star to the newborn King.',
        },
        '2sam-7-12': {
          label: "Heir to David's throne",
          note: 'God promised David an offspring whose kingdom would be everlasting; the angel said Jesus would reign forever.',
        },
        'isa-7-14': {
          label: 'Born of a virgin',
          note: 'The virgin would conceive and bear a son, Immanuel, "God with us": fulfilled in the birth of Jesus.',
        },
        'mic-5-2': {
          label: 'Born in Bethlehem',
          note: 'From Bethlehem, small among the towns, would come the One whose origins are from eternity.',
        },
        'isa-9-6': {
          label: 'Mighty God, Prince of Peace',
          note: 'A child is born whose name is Wonderful, Mighty God, Prince of Peace: the Savior, Christ the Lord.',
        },
        'hos-11-1': {
          label: 'Out of Egypt',
          note: 'As Israel was called out of Egypt, so was the Son of God, kept there in His childhood.',
        },
        'jer-31-15': {
          label: 'Weeping in Ramah',
          note: "Rachel's weeping for her children was heard when Herod killed the little ones of Bethlehem.",
        },
        'mal-3-1': {
          label: 'The messenger of the way',
          note: 'God would send a messenger to prepare the way before Him: John the Baptist, who came before the Lord.',
        },
        'isa-40-3': {
          label: 'A voice in the wilderness',
          note: 'A voice would cry in the wilderness, "Prepare the way of the Lord"; so John preached in the desert.',
        },
        'mal-4-5': {
          label: 'The Elijah who was to come',
          note: '"Behold, I will send you Elijah the prophet before the great and terrible day of the LORD comes," Malachi promises; Jesus himself declared that this promise was fulfilled in John the Baptist.',
        },
        'deut-18-15': {
          label: 'A prophet like Moses',
          note: 'God would raise a prophet like Moses, to whom we must listen; Peter proclaims Him fulfilled in Jesus.',
        },
        'isa-61-1': {
          label: 'Anointed with the Spirit',
          note: 'The Spirit of the Lord upon the Anointed to bring good news to the poor: Jesus read it and said "today this is fulfilled."',
        },
        'isa-9-2': {
          label: 'Light in Galilee',
          note: 'The people walking in darkness would see a great light; Jesus began to preach in Galilee of the Gentiles.',
        },
        'isa-35-5': {
          label: 'Heals the blind and lame',
          note: 'The eyes of the blind would open and the lame leap; so Jesus answered: the blind see, the lame walk.',
        },
        'ps-78-2': {
          label: 'Speaks in parables',
          note: 'The Messiah would open His mouth in parables, uttering things hidden since the foundation of the world.',
        },
        'zech-9-9': {
          label: 'Riding on a donkey',
          note: 'The King would come humble, riding on a colt; so Jesus entered Jerusalem amid praises.',
        },
        'ps-118-22': {
          label: 'The rejected stone',
          note: 'The stone the builders rejected became the cornerstone: Christ, rejected and exalted.',
        },
        'ps-41-9': {
          label: 'Betrayed by a friend',
          note: 'He who ate bread with Him lifted his heel against Him; Judas, one of the twelve, betrayed Him.',
        },
        'zech-11-12': {
          label: 'Sold for thirty pieces',
          note: 'They weighed out thirty pieces of silver as His price, what Judas received for betraying the Lord.',
        },
        'zech-13-7': {
          label: 'The shepherd struck',
          note: 'Strike the shepherd and the sheep scatter; the disciples fled when Jesus was seized.',
        },
        'isa-53-7': {
          label: 'Silent before His accusers',
          note: 'Like a lamb led to the slaughter, He was silent and did not open His mouth before His accusers.',
        },
        'isa-50-6': {
          label: 'Struck and spat upon',
          note: 'He gave His face to those who struck and spat at Him; so Jesus was treated at His trial.',
        },
        'isa-53-5': {
          label: 'Wounded for our sins',
          note: 'He was pierced for our transgressions, crushed for our iniquities; by His wounds we are healed.',
        },
        'ps-22-16': {
          label: 'Hands and feet pierced',
          note: 'They pierced His hands and feet, long before crucifixion existed: fulfilled at the cross.',
        },
        'ps-22-18': {
          label: 'They divide His garments',
          note: 'They divided His garments and cast lots for His clothing, beside the cross.',
        },
        'ps-69-21': {
          label: 'Gall and vinegar',
          note: 'In His thirst they gave Him vinegar to drink, just as was written beforehand.',
        },
        'ps-22-1': {
          label: 'Why have You forsaken me?',
          note: 'The cry "My God, why have You forsaken me?" was the voice of Psalm 22 from the cross.',
        },
        'ps-34-20': {
          label: 'Not a bone broken',
          note: "He keeps all His bones; not one is broken — they did not break Jesus' legs on the cross.",
        },
        'zech-12-10': {
          label: 'They look on the pierced One',
          note: 'They would look on the One they pierced and mourn; the soldier opened His side with a spear.',
        },
        'isa-53-9': {
          label: 'Buried with the rich',
          note: 'His grave was assigned with the rich; Joseph of Arimathea, a rich man, laid Him in his own tomb.',
        },
        'isa-53-12': {
          label: 'Numbered with transgressors',
          note: 'He was counted among the transgressors, crucified between two criminals, and interceded for them.',
        },
        'ps-16-10': {
          label: 'He would not see decay',
          note: 'You will not abandon His soul to Sheol nor let Your Holy One see corruption: Christ rose on the third day.',
        },
        'ps-2-7': {
          label: 'You are My Son',
          note: '"You are My Son, today I have begotten You": Paul applies it to the resurrection of Jesus.',
        },
        'ps-110-1': {
          label: "Seated at God's right hand",
          note: 'The Lord said to my Lord, "Sit at My right hand"; Christ ascended and sat at the right hand of God.',
        },
        'ps-68-18': {
          label: 'Ascended on high',
          note: 'You ascended on high, leading captivity captive; Christ ascended and gave gifts to men.',
        },
        'dan-7-13': {
          label: 'The Son of Man',
          note: 'One like a Son of Man came and was given everlasting dominion; Jesus called Himself so before the high priest.',
        },
        'isa-11-1': {
          label: 'The Branch of Jesse',
          note: 'A shoot would come from the stump of Jesse, a Branch bearing fruit; Paul cites this root of Jesse: Christ, in whom the Gentiles hope.',
        },
        'jer-23-5': {
          label: "David's righteous Branch",
          note: '"I will raise up for David a righteous Branch, and he shall reign as King," Jeremiah promises; the Lord Jesus declares himself "the root and the descendant of David, the bright morning star."',
        },
        'isa-42-1': {
          label: 'My chosen servant',
          note: 'Behold My servant, My chosen in whom My soul delights; Matthew applies it to the Lord Jesus, gentle and humble.',
        },
        'isa-53-4': {
          label: 'He bore our sicknesses',
          note: 'He took up our infirmities and bore our diseases; so Matthew describes His healings, a foretaste of the cross.',
        },
        'isa-53-3': {
          label: 'Despised and rejected',
          note: 'Despised and rejected by men; He came to His own, and His own did not receive Him.',
        },
        'ps-69-4': {
          label: 'Hated without a cause',
          note: 'Those who hate me without cause are more than the hairs of my head, the psalmist cries; Jesus himself quotes these words the night before He died: "They hated me without a cause."',
        },
        'deut-21-23': {
          label: 'Made a curse for us',
          note: 'Cursed is everyone hanged on a tree; Christ redeemed us from the curse, becoming a curse for us.',
        },
        'ps-118-26': {
          label: 'Blessed is He who comes',
          note: 'Blessed is He who comes in the name of the Lord; so they hailed Him entering Jerusalem: "Hosanna!"',
        },
        'ps-8-2': {
          label: 'The praise of children',
          note: 'Out of the mouth of children You ordained praise; Jesus recalled it as the little ones acclaimed Him in the temple.',
        },
        'ps-16-11': {
          label: 'The path of life',
          note: 'You will show Me the path of life; Peter proclaims it fulfilled in the resurrection of the Lord.',
        },
        'isa-55-3': {
          label: 'The everlasting covenant, the sure mercies of David',
          note: '"I will make with you an everlasting covenant, my steadfast, sure love for David," Isaiah promises; Paul quotes it at Antioch as proof that Christ was raised, never again to see corruption.',
        },
        'ps-132-11': {
          label: 'The oath to David',
          note: '"The LORD swore to David... one of the sons of your body I will set on your throne"; Peter recalls that oath at Pentecost, proclaiming that God raised up Christ to sit on his throne.',
        },
        'ps-45-6': {
          label: 'Your throne is forever, O God',
          note: 'Your throne, O God, is forever and ever; Hebrews says it of the Son, God and King through the ages.',
        },
        'ps-110-4': {
          label: 'A priest forever',
          note: 'You are a priest forever after the order of Melchizedek; Christ is our great High Priest.',
        },
        'paschal-lamb': {
          label: 'The Passover lamb',
          note: "The lamb's blood spared from death; 'Christ, our Passover, has been sacrificed for us.'",
        },
        'covenant-blood': {
          label: 'The blood of the covenant',
          note: 'Moses sprinkled the people with the blood of the covenant at Sinai; at the Last Supper, Jesus took the cup and said, "this is my blood of the new covenant, poured out for many."',
        },
        'bronze-serpent': {
          label: 'The bronze serpent',
          note: 'Whoever looked at the lifted serpent lived; so the Son of Man was lifted up, that whoever believes in Him may have eternal life.',
        },
        isaac: {
          label: 'The lamb God provided',
          note: 'Abraham said, "God will provide the lamb"; John pointed to Jesus: "Behold the Lamb of God who takes away the sin of the world."',
        },
        manna: {
          label: 'The manna from heaven',
          note: 'God gave bread from heaven in the wilderness; Jesus said, "I am the bread of life; whoever comes to Me will never hunger."',
        },
        rock: {
          label: 'The rock that gave water',
          note: 'From the struck rock water flowed for the people; "and the Rock was Christ," from whom living water flows.',
        },
        tabernacle: {
          label: 'The tabernacle',
          note: 'God dwelt among His people in the tabernacle; "the Word became flesh and dwelt among us."',
        },
        atonement: {
          label: 'The Day of Atonement',
          note: 'The high priest entered with blood once a year; Christ entered once for all by His own blood, obtaining eternal redemption.',
        },
        melchizedek: {
          label: 'Melchizedek, priest-king',
          note: 'Melchizedek, king and priest without genealogy, prefigures Christ, a priest forever after his order.',
        },
        firstfruits: {
          label: 'The firstfruits',
          note: 'The firstfruits of the harvest were offered; "Christ has been raised, the firstfruits of those who have fallen asleep."',
        },
        jonah: {
          label: 'Jonah, three days',
          note: 'As Jonah was three days in the belly of the great fish, so the Son of Man was three days in the heart of the earth.',
        },
        'isa-28-16': {
          label: 'The precious cornerstone',
          note: 'God lays in Zion a tried, precious cornerstone; Peter and Paul find it in Christ, the sure foundation: "he that believeth shall not be confounded."',
        },
        'ps-69-9': {
          label: "Zeal for God's house",
          note: '"The zeal of thine house hath eaten me up," says the psalm; His disciples remembered it when Jesus cleansed the temple.',
        },
        'isa-49-6': {
          label: 'A light to the nations',
          note: 'The Servant of the LORD would be a light to the nations, salvation to the ends of the earth; in Christ that salvation reaches the Gentiles.',
        },
        'isa-53-1': {
          label: 'The report not believed',
          note: '"Who hath believed our report?" John sees the unbelief toward Jesus as the fulfillment of what Isaiah foretold.',
        },
        'joel-2-32': {
          label: 'Calling on the name of the Lord',
          note: 'Joel says, "Whosoever shall call on the name of the LORD shall be saved"; Paul applies it to Christ, Lord of all, rich to all who call on Him.',
        },
        'amos-9-11': {
          label: "David's fallen tent raised",
          note: 'God promised to raise up the fallen tent of David; James sees the promise fulfilled in the risen Christ and in the Gentiles who seek the Lord.',
        },
        'ps-102-25': {
          label: 'The eternal Creator',
          note: '"Thou hast laid the foundation of the earth, and the heavens are the work of thine hands"; Hebrews speaks these words to the Son, the same yesterday, today, and forever.',
        },
        'ps-8-6': {
          label: 'All things under His feet',
          note: 'God put all things under the feet of man; Hebrews sees it fulfilled in Jesus, crowned with glory, to whom all things will be subjected.',
        },
        'isa-25-8': {
          label: 'Death swallowed up forever',
          note: '"He will swallow up death forever," Isaiah announces; Paul quotes this promise fulfilled when the mortal puts on immortality: "Death is swallowed up in victory."',
        },
        'hos-13-14': {
          label: 'Ransomed from the power of Sheol',
          note: '"O Death, I will be your plague," Hosea promises; alongside Isaiah 25:8, Paul takes up the same cry of victory: "O death, where is your sting?"',
        },
        'isa-65-17': {
          label: 'New heavens and a new earth',
          note: '"Behold, I create new heavens and a new earth," Isaiah declares; John sees that promise fulfilled — a new heaven and a new earth — in the final vision where the Lamb is the light of the city of God.',
        },
        adam: {
          label: 'The last Adam',
          note: 'The first Adam was made a living soul; "the last Adam was made a quickening spirit." What was lost in one is made alive in Christ.',
        },
        veil: {
          label: 'The temple veil',
          note: 'The veil shut off the Most Holy Place; through His flesh Christ opened "a new and living way" into the presence of God.',
        },
        scapegoat: {
          label: 'The goat that carries away sin',
          note: 'The goat bore all their iniquities into an uninhabited land; so Christ was offered "to bear the sins of many."',
        },
        'joshua-rest': {
          label: 'The true rest',
          note: 'Joshua gave rest in the land, but not the final one; there remains a rest for the people of God, entered by faith in Jesus.',
        },
      },
    },

    bibleFacts: {
      title: 'Did you know?',
      subtitle: 'Interesting facts, biblically grounded',
      browseHint:
        'Geography, numbers, original language, history and cross-references — always anchored to a verse.',
      todayLabel: 'Today',
      todayTitle: "Today's fact",
      indexTitle: 'All facts',
      filterAll: 'All',
      filterFavorites: 'Favorites',
      favorite: 'Save as favorite',
      unfavorite: 'Remove from favorites',
      noFavorites: 'No favorite facts yet. Tap the star on a card to save one.',
      openInReader: 'Open in reader',
      missingText: 'Verse unavailable',
      sourcesTitle: 'Sources & method',
      sourcesHint: 'How these facts were chosen',
      sourcesBody:
        'These facts gather geography, measurements, original-language nuances, historical customs and connections between passages. The criterion is conservative: every fact is anchored to a specific verse of Scripture — never speculation. Measurements and customs draw on the broadly documented consensus of biblical scholarship; original-language notes quote the Hebrew or Greek word as it appears in the text.',
      categories: {
        geography: 'Geography',
        numbers: 'Numbers',
        language: 'Original language',
        history: 'History & culture',
        crossref: 'Cross-references',
      },
      items: {
        'dead-sea': {
          label: "Earth's lowest point",
          detail:
            'The Dead Sea, called the "Salt Sea" in Scripture, sits about 430 meters below sea level — the lowest point on the entire surface of the earth.',
        },
        'mount-hermon': {
          label: "Scripture's highest peak",
          detail:
            "Mount Hermon, on Israel's northern border, rises to 2,814 meters and carries snow nearly year-round; the Amorites called it Senir.",
        },
        'dan-to-beersheba': {
          label: '"From Dan to Beersheba"',
          detail:
            'This phrase runs through Scripture (about 12 times) meaning "from one end of the land to the other" — and in a straight line it\'s barely 240 km: how small the Promised Land really was.',
        },
        'eleven-days': {
          label: 'Eleven days… that became forty years',
          detail:
            "From Horeb to Kadesh-barnea, at Canaan's border, is only an eleven days' walk; for Israel, because of its rebellion, that same trip took forty years.",
        },
        'sanctuary-shekel': {
          label: 'The sanctuary shekel',
          detail:
            "The tabernacle's official weight was double a common shekel, and the law itself defines it precisely: twenty gerahs.",
        },
        'the-cubit': {
          label: 'The cubit, a measure of the body',
          detail:
            "The cubit (about 45 cm, elbow to fingertip) was the unit that measured Noah's ark, and later the temple.",
        },
        'forty-days': {
          label: 'Forty days, forty years',
          detail:
            "The number forty marks periods of testing again and again in Scripture: the flood, Moses on the mountain, Israel in the wilderness, and Jesus' fast.",
        },
        'thirty-pieces': {
          label: "A slave's price",
          detail:
            'The law set thirty pieces of silver as the price of a slave gored by an ox; it was exactly what was paid to betray Jesus.',
        },
        hesed: {
          label: 'Hesed: a love with no exact translation',
          detail:
            "⁦חֶסֶד⁩ (hesed) is the Hebrew word for God's faithful, covenant-keeping love; it has no exact equivalent in English, and repeats 26 times in a row in a single psalm.",
        },
        selah: {
          label: 'Selah: a pause still shrouded in mystery',
          detail:
            '⁦סֶלָה⁩ (Selah) appears 71 times in the Psalms as a musical or liturgical instruction; its exact meaning — a pause? a raising of the voice? — is still debated by scholars.',
        },
        logos: {
          label: 'Logos: the Word that orders the universe',
          detail:
            'λόγος (logos), in Greek philosophy, named the reason that gives order to the universe; John takes that very word and applies it directly to Christ.',
        },
        amen: {
          label: "Amen: the word that wasn't translated",
          detail:
            '⁦אָמֵן⁩ (amen), "truly" or "so be it," passed from Hebrew into nearly every language on earth untranslated, through the Bible.',
        },
        'tearing-garments': {
          label: "Tearing one's garments",
          detail:
            'In the ancient Near East, tearing your clothes was a public sign of mourning or extreme religious outrage; that is how the high priest reacted on hearing Jesus.',
        },
        'washing-feet': {
          label: "Washing feet, the lowest servant's job",
          detail:
            "With open sandals and dusty roads, washing a guest's feet was the job of the lowest-ranking servant in a household — hence how shocking Jesus' gesture with His disciples was.",
        },
        'unleavened-bread': {
          label: 'Bread with no time to rise',
          detail:
            'Passover bread was baked without yeast because there was no time to wait for the dough to rise before fleeing Egypt in haste.',
        },
        'seven-day-wedding': {
          label: 'A seven-day wedding',
          detail:
            "In Israel a wedding wasn't a one-afternoon ceremony but a community feast that could last a full week, like Samson's.",
        },
        'tree-of-life': {
          label: 'A garden lost, a garden regained',
          detail:
            'Scripture opens with a tree of life humanity loses access to, and closes with that same tree, now accessible forever in the new creation.',
        },
        'joshua-jesus-name': {
          label: 'Joshua and Jesus: the same name',
          detail:
            '"Joshua" and "Jesus" are the same Hebrew name, Yehoshua ("the Lord saves"), in two different forms: one led the people into the Promised Land; the other leads His people into eternal life.',
        },
        'ruth-genealogy': {
          label: "From excluded foreigner to a king's great-grandmother",
          detail:
            "The law excluded Moabites from Israel's assembly, yet Ruth the Moabite became King David's great-grandmother — and appears in the genealogy of Jesus.",
        },
        'jacob-israel': {
          label: 'A night of wrestling, a new name',
          detail:
            'Jacob wrestled all night by the river Jabbok and received from God a new name, "Israel," which would become the name of an entire people.',
        },
      },
    },

    journeys: {
      title: 'Bible routes',
      subtitle: 'The great routes of Scripture',
      intro:
        "The Bible isn't just read: it happened in real places. Walk these three great routes and tap each stop to read the passage.",
      stopsCount: '{{n}} stops',
      progress: '{{n}} of {{total}} explored',
      openInReader: 'Open in reader',
      missingText: 'Verse unavailable',
      walkthroughStart: 'Narrated walkthrough',
      walkthroughStop: 'Stop walkthrough',
      favorite: 'Save as favorite',
      unfavorite: 'Remove from favorites',
      shareMap: 'Share the map',
      partOfThread: 'Part of the prophetic thread',
      showVerse: 'Show verse',
      hideVerse: 'Hide verse',
      routes: {
        abraham: {
          title: 'Abraham',
          subtitle: 'The father of faith',
          description:
            "Follow Abraham's path from his call in Ur to Beersheba — faith journeying toward a promise he did not yet see fulfilled.",
        },
        exodus: {
          title: 'The Exodus',
          subtitle: 'From Egypt to the Promised Land',
          description:
            "Follow Israel's path from slavery in Egypt to the edge of Canaan, following the very itinerary recorded in the book of Numbers.",
        },
        exile: {
          title: 'The Babylonian exile',
          subtitle: 'Judgment, faithfulness, and return',
          description:
            "Walk through the fall of Jerusalem, the years of captivity in Babylon, and the people's return to their land.",
        },
        paul: {
          title: "Paul's journeys",
          subtitle: 'The gospel to the ends of the empire',
          description:
            'Walk the cities where Paul preached, planted churches, and was persecuted, from Antioch to Rome.',
        },
        jesus: {
          title: 'The ministry of Jesus',
          subtitle: 'His life, death, and resurrection',
          description:
            "Walk the places of the Lord's ministry, from His birth in Bethlehem to the empty tomb.",
        },
      },
      items: {
        'abraham-ur': {
          label: "Abram's call",
          note: 'God called Abram to leave his land and his family, promising him a land, a great nation, and blessing for all peoples.',
        },
        'abraham-shechem': {
          label: 'Shechem, in Canaan',
          note: 'On arriving in the promised land, Abram built an altar to the LORD who had appeared to him.',
        },
        'abraham-egypt': {
          label: 'Egypt',
          note: 'Famine drove him to Egypt; even in a stumble of faith, God protected His promise.',
        },
        'abraham-hebron': {
          label: 'Hebron: the covenant and the promise',
          note: 'Abram believed the promise of an heir, and God counted it to him as righteousness — the foundation of the faith Paul would explain centuries later.',
        },
        'abraham-moriah': {
          label: 'Mount Moriah',
          note: "Ready to offer his son Isaac, Abraham saw God's provision and called that place 'The LORD Will Provide.'",
        },
        'abraham-beersheba': {
          label: 'Beersheba: the end of the road',
          note: 'Abraham died in a good old age, having seen only the beginning of a promise that would be fulfilled in his descendants — and, ultimately, in Christ.',
        },
        'exodus-rameses': {
          label: 'Rameses, Egypt',
          note: 'The Exodus began here: the children of Israel set out from Rameses toward Succoth, leaving slavery behind.',
        },
        'exodus-red-sea': {
          label: 'The Red Sea',
          note: "God made a way through the sea; Israel crossed on dry ground while Pharaoh's army was left behind.",
        },
        'exodus-sinai': {
          label: 'Mount Sinai',
          note: 'At Mount Sinai, God gave the Law to Moses and sealed His covenant with Israel.',
        },
        'exodus-kadesh': {
          label: 'Kadesh-barnea',
          note: "After the twelve spies' report, the people's unbelief condemned them to wander the wilderness forty years.",
        },
        'exodus-moab': {
          label: 'The plains of Moab',
          note: 'From Mount Nebo, Moses saw the promised land before dying without entering it.',
        },
        'exodus-jordan': {
          label: 'The Jordan River',
          note: 'Under Joshua’s leadership, the people crossed the Jordan on dry ground and finally entered Canaan.',
          echoNote:
            "Centuries later, at this same river, Jesus — whose name is the same Hebrew word as 'Joshua,' the LORD saves — began His own path toward ultimate salvation.",
        },
        'exile-jerusalem-fall': {
          label: 'The fall of Jerusalem',
          note: 'The Babylonian army destroyed Solomon’s temple and carried the people into captivity — the judgment the prophets had announced.',
        },
        'exile-babylon-rivers': {
          label: 'By the rivers of Babylon',
          note: 'Far from their land, the people wept remembering Zion — the lament of Psalm 137, one of the most moving in all Scripture.',
        },
        'exile-chebar': {
          label: 'The Chebar River',
          note: 'There, among the exiles, Ezekiel saw the vision of God’s glory — God was still present even in exile.',
        },
        'exile-daniel-court': {
          label: 'The court of Babylon',
          note: "Daniel, faithful in a pagan empire, was delivered from the lions' den: God protects His own even far from home.",
        },
        'exile-cyrus-decree': {
          label: 'The decree of Cyrus',
          note: "Seventy years later, God moved the heart of a pagan king to allow the people's return — fulfilling His word through Jeremiah.",
        },
        'exile-return': {
          label: 'The return and the new temple',
          note: 'At the laying of the temple’s foundation, the people praised God with tears of joy, remembering His faithfulness.',
        },
        'paul-antioch': {
          label: 'Antioch of Syria',
          note: 'The church at Antioch, led by the Holy Spirit, sent out Paul and Barnabas on the first missionary journey.',
        },
        'paul-lystra': {
          label: 'Lystra',
          note: 'Paul healed a man lame from birth, one of the first recorded miracles of his ministry among the Gentiles.',
        },
        'paul-jerusalem-council': {
          label: 'The Jerusalem Council',
          note: 'The church met to settle whether Gentiles had to keep the law of Moses to be saved.',
        },
        'paul-philippi': {
          label: 'Philippi',
          note: 'A vision called Paul across to Macedonia; there, imprisoned, an earthquake threw open the prison doors.',
        },
        'paul-athens': {
          label: 'Athens',
          note: 'At the Areopagus, Paul preached to the Greek philosophers about the unknown God they already worshiped without knowing it.',
        },
        'paul-corinth': {
          label: 'Corinth',
          note: 'Paul stayed a year and a half teaching the word of God in this major trading city.',
        },
        'paul-ephesus': {
          label: 'Ephesus',
          note: 'For two years Paul taught there, so that the whole province of Asia heard the word of the Lord.',
        },
        'paul-rome': {
          label: 'Rome',
          note: 'Under guard, Paul preached the kingdom of God in the capital of the empire, with no one stopping him.',
        },
        'jesus-bethlehem': {
          label: 'Bethlehem',
          note: 'In the city of David, Jesus was born, wrapped in cloths and laid in a manger.',
        },
        'jesus-jordan': {
          label: 'The Jordan River',
          note: "John baptized Jesus in the Jordan, and a voice from heaven declared Him God's beloved Son.",
          echoNote:
            "At this same river, Joshua had once led Israel toward the Promised Land. Jesus, whose name is the same Hebrew word, 'the LORD saves,' begins His own path here.",
        },
        'jesus-cana': {
          label: 'Cana of Galilee',
          note: 'At a wedding, Jesus turned water into wine: the first sign that revealed His glory.',
        },
        'jesus-capernaum': {
          label: 'Capernaum',
          note: 'Jesus made this town the center of His Galilean ministry, with many teachings and miracles.',
        },
        'jesus-caesarea-philippi': {
          label: 'Caesarea Philippi',
          note: "There Peter confessed: 'You are the Christ, the Son of the living God.'",
        },
        'jesus-jerusalem-entry': {
          label: 'Entry into Jerusalem',
          note: "Jesus entered Jerusalem on a donkey while the crowd shouted, 'Hosanna to the Son of David!'",
        },
        'jesus-gethsemane': {
          label: 'Gethsemane',
          note: 'In this garden Jesus prayed in agony before being betrayed and arrested.',
        },
        'jesus-golgotha': {
          label: 'Golgotha',
          note: "At this place, called 'the Skull,' Jesus was crucified for our sins.",
        },
        'jesus-empty-tomb': {
          label: 'The empty tomb',
          note: "'He is not here, for He has risen, just as He said.' The empty tomb is the foundation of the Christian faith.",
        },
      },
    },

    constancy: {
      title: 'Your constancy today',
      summary: '{{closed}} of {{total}} today',
      caption: 'Close your rings each day',
      allClosed: 'You closed your rings today!',
      habitReading: 'Read',
      habitMemory: 'Memory',
      habitDevotion: 'Devotion',
      habitMood: 'Mood',
      cardHint: "Tap to see today's habits",
      share: 'Share your rings',
      shareTitle: 'Share your constancy',
      shareCardTitle: 'My constancy',
      shareCardSubtitle: 'Closing my rings each day',
      shareToday: 'Today',
      shareStreakDay: '1 day',
      shareStreakDays: '{{n}} days',
    },

    readingGoal: {
      title: 'Reading goal',
      settingsTitle: 'Daily reading goal',
      settingsDesc: 'Verses a day to close your reading ring',
      saved: 'Goal saved',
    },

    prayer: {
      title: 'Prayer journal',
      subtitle: 'What you bring to God',
      empty: 'Your journal is empty',
      emptyHint: 'Write down what you want to bring to God in prayer.',
      add: 'Add a prayer',
      addTitle: 'New prayer',
      editTitle: 'Edit prayer',
      titleLabel: 'Prayer',
      titlePlaceholder: 'What are you bringing to God?',
      detailLabel: 'Detail (optional)',
      detailPlaceholder: 'Write more if you wish…',
      categoryLabel: 'Type',
      save: 'Save',
      cancel: 'Cancel',
      categories: {
        praise: 'Praise',
        confession: 'Confession',
        thanksgiving: 'Thanksgiving',
        supplication: 'Supplication',
        intercession: 'Intercession',
      },
      filterAll: 'All',
      activeSection: 'Praying',
      answeredSection: 'Answered',
      activeCount: '{{n}} praying',
      answeredCount: '{{n}} answered',
      markAnswered: 'Mark as answered',
      answeredOn: 'Answered on {{date}}',
      reopen: 'Reopen',
      delete: 'Delete',
      deleteConfirmTitle: 'Delete this prayer?',
      deleteConfirmBody:
        "It will be removed from your journal. This can't be undone.",
      answeredPrompt: 'How did God answer?',
      answeredNotePlaceholder: 'Your testimony (optional)…',
      answeredCelebrate: 'God is faithful 🙏',
      addedToast: 'Saved to your journal',
      itemHint: 'Tap for options',
      streakTitle: 'Prayer constancy',
      streakDays: '{{n}} days in prayer',
      streakOneDay: '1 day in prayer',
      streakLapsed: 'Return to prayer today',
      streakBest: 'Your best streak: {{n}}',
      streakTodayDone: 'You prayed today',
      streakTodayPending: "Today's prayer awaits you",
      streakHint: 'Open guided prayer',
      cardTitle: 'Prayer',
      cardSubtitlePraying: '{{n}} praying · {{a}} answered',
      cardSubtitleEmpty: 'Bring your burdens to God',
      openJournal: 'My prayer journal',
      prayNow: 'Pray now',
      scriptureCta: 'Pray the Scripture',
      scriptureCtaSubtitle: 'Pray verse by verse',
      studyToolTitle: 'Guided prayer',
      studyToolSubtitle: 'Adore, confess, give thanks, ask',
      testimony: {
        share: 'Share testimony',
        eyebrow: 'God was faithful',
      },
      acts: {
        title: 'Guided prayer',
        subtitle: 'The ACTS path',
        intro:
          'A moment to come to God step by step: adore Him, confess, give thanks, and bring Him your requests.',
        startQuestion: 'How do you want to draw near today?',
        startAdoring: 'Adoring',
        startConfessing: 'Confessing',
        begin: 'Begin',
        next: 'Next',
        finish: 'Amen',
        stepOf: 'Step {{n}} of {{total}}',
        adoration: {
          name: 'Adoration',
          prompt:
            'Pause and behold who God is. Praise Him for His greatness, His holiness and His love — not only for what He does, but for who He is.',
        },
        confession: {
          name: 'Confession',
          prompt:
            'In the light of His holiness, honestly bring what weighs on your heart. He is faithful and just to forgive.',
        },
        thanksgiving: {
          name: 'Thanksgiving',
          prompt:
            'Remember His goodness. Thank Him for what He has done, great and small, today and in your life.',
        },
        supplication: {
          name: 'Supplication',
          prompt:
            'Now bring your requests — for yourself and for others. He invites you to ask with confidence.',
        },
        finishedTitle: 'Amen',
        finishedBody: 'You have come to God in prayer today. He hears you.',
        addToJournal: 'Save a prayer request',
        done: 'Done',
        missingText: 'Verse unavailable',
      },
    },

    scripturePrayer: {
      title: 'Pray the Scripture',
      subtitle: 'Pray with the words Scripture itself records',
      intro:
        "These prayers aren't a literary exercise: they're words real people in the Bible spoke to God in real moments. Walk through them verse by verse, and make the prayer your own, in your own words, if you'd like.",
      disclaimer:
        'These are prayers recorded in Scripture — examples to learn from, not a formula to repeat. Your own prayer, in your own words, is just as valuable before God.',
      versesCount: '{{n}} verses',
      verseProgress: 'Verse {{n}} of {{total}}',
      begin: 'Begin',
      prev: 'Previous',
      next: 'Next',
      finish: 'Amen',
      missingText: 'Verse unavailable',
      yourPrayerLabel: 'Your prayer (optional)',
      yourPrayerPlaceholder: 'Write your own prayer here, in your own words…',
      finishedTitle: 'Thank you for praying',
      finishedBody: 'May this prayer draw you closer to the heart of God.',
      saveJournalPrompt:
        'Would you like to save what you wrote to your prayer journal?',
      saveJournalButton: 'Save to journal',
      discardButton: 'Close without saving',
      savedToast: 'Saved to your prayer journal',
      done: 'Done',
      categories: {
        jesus: 'Prayers of Jesus',
        canticles: 'New Testament canticles',
        paul: "Paul's prayers for the churches",
        psalms: 'Psalms Scripture itself titles "a prayer"',
        ot: 'Other prayers of the Old Testament',
      },
      passages: {
        'lords-prayer': {
          title: "The Lord's Prayer",
          context:
            'Jesus Himself taught this prayer to His disciples, in response to their request: "Lord, teach us to pray" (Luke 11:1).',
        },
        gethsemane: {
          title: 'Gethsemane',
          context:
            "Jesus faces His own cross here, a cup only He could drink. In praying it, we follow His example of submitting to the Father's will — not repeating His circumstance.",
        },
        magnificat: {
          title: "Mary's Magnificat",
          context:
            "Mary sings over a unique historical event: carrying the Messiah in her womb. The church has prayed this song for centuries as praise for Christ's coming, not as anyone's personal testimony.",
        },
        benedictus: {
          title: "Zechariah's song",
          context:
            "Zechariah prophesies about his son John the Baptist and the coming Messiah. We pray it as praise for God's faithfulness in keeping His promises, not as words about our own life.",
        },
        'nunc-dimittis': {
          title: "Simeon's song",
          context:
            'Simeon saw the promised Messiah with his own eyes. We pray his words as gratitude for the salvation we too have seen in Christ.',
        },
        'ephesians-prayer': {
          title: "Paul's prayer for the Ephesians",
          context:
            "Paul bows his knees and asks that Christ's love fill and strengthen the believers in Ephesus.",
        },
        'colossians-prayer': {
          title: "Paul's prayer for the Colossians",
          context:
            "Paul asks that the believers in Colossae be filled with the knowledge of God's will and walk worthy of the Lord.",
        },
        'philippians-prayer': {
          title: "Paul's prayer for the Philippians",
          context:
            "Paul asks that the Philippians' love abound more and more in knowledge and discernment.",
        },
        'thessalonians-prayer': {
          title: "Paul's prayer for the Thessalonians",
          context:
            'Paul asks that God direct his way back to them and that the Lord make them grow in love.',
        },
        'psalm-51': {
          title: "Psalm 51 — David's confession",
          context:
            'David cries out for mercy after being confronted by the prophet Nathan over his sin with Bathsheba.',
        },
        'psalm-86': {
          title: 'Psalm 86 — a prayer of David',
          context:
            'The psalm\'s own title calls it "A Prayer of David": a cry for help and mercy in the midst of distress.',
        },
        'psalm-90': {
          title: 'Psalm 90 — a prayer of Moses',
          context:
            "The psalm's own title calls it \"A Prayer of Moses, the man of God\": a reflection on life's brevity and God's eternity.",
        },
        'psalm-102': {
          title: 'Psalm 102 — a prayer of the afflicted',
          context:
            'Its own title calls it "A Prayer of the afflicted, when he is overwhelmed." Its plea for Zion\'s restoration, the church has understood as fulfilled in God\'s people gathered in Christ, not in the physical city of Jerusalem.',
        },
        'psalm-142': {
          title: "Psalm 142 — David's prayer in the cave",
          context:
            'Its own title calls it "A prayer when he was in the cave": David cries out to God, surrounded by danger with no human help.',
        },
        'nehemiah-prayer': {
          title: "Nehemiah's prayer",
          context:
            "Nehemiah confesses his people's sin and asks for God's favor before undertaking the rebuilding of Jerusalem.",
        },
        'daniel-prayer': {
          title: "Daniel's prayer",
          context:
            "Daniel confesses the sin of his whole people, Israel, during the exile in Babylon. It's a model of corporate confession — praying it means acknowledging our own failures and the church's, not literally describing our situation.",
        },
        'jonah-prayer': {
          title: "Jonah's prayer",
          context:
            'Jonah cries out to God from the belly of the great fish, and God hears him and delivers him.',
        },
      },
    },

    weeklyChallenge: {
      title: "This week's challenge",
      masterN: 'Master {{n}} verses',
      masterOne: 'Master 1 verse',
      progress: '{{done}} / {{target}} mastered',
      focusTitle: 'Close to mastery',
      practice: 'Practice: {{n}} days in a row',
      practiceOne: 'Practice: 1 day',
      practiceNone: 'Start your practice streak',
      met: 'Challenge complete this week!',
      hint: 'Tap to practice',
      share: 'Share your challenge',
      settingsTitle: 'Weekly memorization challenge',
      settingsDesc: 'Verses to master each week',
      saved: 'Challenge saved',
      shareTitle: 'Share your challenge',
      shareCardTitle: 'My weekly challenge',
      shareMastered: 'I mastered {{n}} verses',
      shareMasteredOne: 'I mastered 1 verse',
      shareTarget: 'Goal: {{n}} this week',
      sharePractice: '{{n}} days of practice',
      sharePracticeOne: '1 day of practice',
    },

    auth: {
      sectionTitle: 'Account',
      signInWithGoogle: 'Sign in with Google',
      signOut: 'Sign out',
      signOutConfirmTitle: 'Sign out',
      signOutConfirmMessage:
        'You will be signed out of Google. Your favorites, notes, highlights, bookmarks and memory cards will remain on this device.',
      signOutConfirmCta: 'Sign out',
      signedInAs: 'Signed in as',
      notSignedIn: 'Sign in to sync your data across devices',
      notSignedInTitle: 'Not signed in',
      anonymousLabel: 'Guest',
      signInError: 'Could not sign in. Please try again.',
      signInCancelled: 'Sign-in cancelled',
      signedInToast: 'Welcome, {{name}}!',
      signedOutToast: 'Signed out',
      avatarA11y: 'Profile picture of {{name}}',
      googleLogoA11y: 'Google logo',
    },

    sync: {
      justNow: 'Synced just now',
      secondsAgo: 'Synced {{n}}s ago',
      minutesAgo: 'Synced {{n}} min ago',
      waiting: 'Waiting to sync',
      syncing: 'Syncing {{count}} changes…',
      syncingSingular: 'Syncing 1 change…',
      offline: 'Offline',
      offlineWithQueue: 'Offline — {{count}} changes queued',
      offlineWithQueueSingular: 'Offline — 1 change queued',
    },

    conflicts: {
      title: 'Pending conflicts',
      empty: 'No conflicts',
      emptyTitle: 'Everything is in sync',
      emptyBody:
        "When two devices edit the same item at the same time, we'll show it here so you can pick which version to keep.",
      badge: '{{count}} conflicts to resolve',
      badgeSingular: '1 conflict to resolve',
      badgeA11y: 'Open pending conflicts',
      mine: 'Your version',
      theirs: 'Remote version',
      keepMine: 'Keep mine',
      keepTheirs: 'Keep theirs',
      merge: 'Merge',
      mergeTitle: 'Merge versions',
      mergeBody:
        'Edit each field to combine your version and the remote one. On save, the result will be sent to all your devices.',
      mergePlaceholder: 'Edit here…',
      mineHint: 'Yours',
      theirsHint: 'Remote',
      saveMerge: 'Save merge',
      resolvedToast: 'Conflict resolved',
      resolveError: 'Could not resolve the conflict. Please try again.',
      migrationTitle: 'Migrate this device?',
      migrationBody:
        'We found an existing Google account. You have {{count}} local changes on this device. Do you want to migrate them to that account?',
      migrationYes: 'Migrate',
      migrationNo: 'Just sign in',
      migrationDoneToast: 'Local data migrated to your account',
      insights: {
        title: 'Conflict history',
        subtitle: 'How you resolve sync conflicts',
        openLabel: 'View conflict history',
        loading: 'Loading history…',
        errorTitle: "Couldn't load",
        errorBody: "We couldn't read your conflict history. Please try again.",
        retry: 'Retry',
        emptyTitle: 'No conflicts yet',
        emptyBody:
          'Once you resolve a sync conflict, your decision patterns will show up here.',
        overviewTitle: 'Overview',
        totalLabel: '{{count}} conflicts resolved',
        totalLabelSingular: '1 conflict resolved',
        verdictMine: 'You usually keep your version ({{pct}}%).',
        verdictTheirs: 'You usually keep the remote version ({{pct}}%).',
        verdictMerge: 'You usually merge both versions ({{pct}}%).',
        verdictBalanced: 'You resolve conflicts in a balanced way.',
        verdictLearning: 'Resolve a few more conflicts to see your pattern.',
        choiceTitle: 'How you resolve',
        choiceHint: 'Your choices when resolving',
        choiceMine: 'Mine',
        choiceTheirs: 'Theirs',
        choiceMerge: 'Merge',
        collectionTitle: 'By data type',
        collectionHint: 'Where conflicts happen most',
        fieldTitle: 'Fields in conflict',
        fieldHint: 'Which fields clash most often',
        fieldEmpty: 'No fields recorded',
        timesBadge: '{{count}} times',
        timesBadgeSingular: 'once',
        activityTitle: 'Activity',
        activityHint: 'Conflicts resolved per week',
        activityNow: 'Now',
        collectionLabels: {
          favorites: 'Favorites',
          notes: 'Notes',
          highlights: 'Highlights',
          bookmarks: 'Bookmarks',
          memoryCards: 'Memorization',
        },
        fieldLabels: {
          note: 'Note',
          text: 'Text',
          color: 'Color',
          category: 'Category',
          rating: 'Rating',
          tags: 'Tags',
          label: 'Label',
        },
      },
    },

    bookmarks: {
      title: 'Bookmarks',
      short: 'Bookmarks',
      count: 'bookmarks',
      countSingular: 'bookmark',
      added: 'Bookmark added',
      addedMany: '{{n}} bookmarks added',
      emptyMessage: 'No bookmarks yet',
      openBible: 'Open the Bible',
      rename: 'Rename',
      renameTitle: 'Bookmark name',
      labelPlaceholder: 'e.g. Sunday sermon',
      deleteTitle: 'Delete bookmark',
      deleteMessage: 'Remove this bookmark?',
    },

    // My Highlights Screen
    highlights: {
      title: 'My Highlights',
      short: 'Highlights',
      count: '{{count}} highlighted verses',
      countSingular: '{{count}} highlighted verse',
      empty: 'No highlights yet',
      emptyHint: 'Select verses while reading and tap Highlight',
      noMatch: 'No highlights match this filter',
      all: 'All',
      searchPlaceholder: 'Search your highlights...',
      groupByColor: 'By color',
      listView: 'List',
      galleryShare: 'Share my highlights',
      galleryShareTitle: 'Share your highlights',
      galleryShareCardTitle: 'My highlighted verses',
      galleryShareCount: '{{n}} highlighted verses',
      galleryShareCountOne: '1 highlighted verse',
      deleteTitle: 'Remove highlight',
      deleteMessage: 'Remove this highlight?',
      removed: 'Highlight removed',
      saved: 'Highlight updated',
      notePlaceholder: 'Add a personal note...',
      category: 'Category',
      save: 'Save',
      categories: {
        promise: 'Promise',
        prayer: 'Prayer',
        commandment: 'Commandment',
        wisdom: 'Wisdom',
        prophecy: 'Prophecy',
        favorite: 'Favorite',
        memorize: 'Memorize',
        study: 'Study',
      },
    },

    // Settings Screen
    settings: {
      title: 'Settings',
      subtitle: 'Personalize your celestial experience',
      appearance: 'Appearance',
      theme: 'Theme',
      themeDescription: 'Choose the app theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeAuto: 'Auto',

      colorTheme: 'Color Theme',
      colorThemeDescription: 'Choose the visual style of the app',
      exclusiveThemeLabel: 'Exclusive',
      keepAwakeTitle: 'Keep screen on',
      keepAwakeDescription:
        'Stop the screen from locking while you read, study, memorize or pray.',
      colorThemeNames: {
        ocean: 'Ocean',
        celestial: 'Celestial',
        forest: 'Forest',
        sunset: 'Sunset',
        graphite: 'Graphite',
        royal: 'Royal',
        midnight: 'Midnight',
        cafe: 'Café',
        vino: 'Wine',
        esmeralda: 'Emerald',
        arena: 'Sand',
        aurora: 'Aurora',
        granate: 'Garnet',
        zafiro: 'Sapphire',
        turquesa: 'Turquoise',
        orquidea: 'Orchid',
      },

      bibleVersion: 'Bible Version',
      selectVersion: 'Select your version',
      versionDescription: 'Choose your preferred Bible translation',
      comingSoon: 'Coming Soon',

      manageVersions: 'Manage versions',
      manageVersionsDescription:
        'Download more translations to read and search them offline.',
      manageVersionsLoading: 'Looking for available versions…',
      manageVersionsError:
        'Couldn’t load the catalog. Check your connection and try again.',
      manageVersionsEmpty: 'No new versions to download.',
      manageVersionsRetry: 'Retry',
      versionInstalled: 'Installed',
      versionDownload: 'Download',
      versionDownloading: 'Downloading…',
      versionImporting: 'Installing…',
      versionDelete: 'Remove',
      versionDeleteTitle: 'Remove version',
      versionDeleteMessage:
        'Remove {version}? You can download it again anytime. Your favorites, notes and highlights are unaffected.',
      versionDeleteConfirm: 'Remove',
      versionDownloadSuccess: '{version} ready to read',
      versionDeleteSuccess: '{version} removed',
      versionErrorSpace: 'Not enough space to download this version.',
      versionErrorChecksum:
        'The download was corrupted in transfer. Please try again.',
      versionErrorNetwork:
        'Network error during download. Check your connection.',
      versionErrorGeneric: 'Download failed. Please try again.',

      language: 'Language',
      selectLanguage: 'Select your language',
      languageDescription: 'Change the app language',

      data: 'Data',
      resetData: 'Reset Bible Data',
      resetDescription: 'Delete and reload all verses',
      resetTitle: 'Reset Data',
      resetMessage:
        'Are you sure you want to reset all Bible data? This deletes and reloads the 62,000+ verses. Your favorites, notes and highlights are not affected. The reload may take a minute.',
      resetConfirm: 'Reset',
      resetSuccess: 'Data Reset',
      resetSuccessMessage: 'Verses have been reloaded successfully.',
      resetting: 'Reloading verses…',
      resetError: 'Error resetting data.',
      exportBackup: 'Export backup',
      exportBackupDescription:
        'Generate a JSON file with favorites, notes, highlights, bookmarks, progress and preferences.',
      exporting: 'Generating backup…',
      exportError: 'Backup export failed. Please try again.',
      backupDialogTitle: 'Eternal Stone Bible · Backup',

      about: 'About',
      version: 'Version',
      description:
        "A Bible reading app designed to bring you closer to God's Word.",
      viewGitHub: 'View on GitHub',
      footerText: 'Made with ❤️ for the glory of God',
      footerVerse: '"All Scripture is God-breathed"\n- 2 Timothy 3:16',
    },

    // Verse Reading Screen
    verse: {
      singular: 'verse',
      plural: 'verses',
      addFavorite: 'Favorite',
      removeFavorite: 'Remove from Favorites',
      compare: 'Compare',
      copyVerse: 'Copy Verse',
      shareVerse: 'Share Verse',
      addNote: 'Add Note',
      image: 'Image',
      fontSize: 'Font Size',
      verseCopied: 'Verse copied to clipboard',
      imageReady: 'Image ready to share',
      imageShareError: 'Unable to share image',
      errorLoadingVerses: 'Error loading verses',
      retry: 'Retry',
      searchInChapter: 'Search in chapter',
      loadingVerses: 'Loading verses...',
      prevChapter: 'Previous chapter',
      nextChapter: 'Next chapter',
      distractionFreeMode: 'Distraction-free mode',
      versesList: 'Verses list',
      errorSharingVerse: 'Error sharing verse',
      addedToFavorites: 'Added to favorites',
      removedFromFavorites: 'Removed from favorites',
      audio: 'Audio',
      pause: 'Pause',
      immersive: 'Immersive',
      highlight: 'Highlight',
      selectVersesFirst: 'Select verses first',
      shareAsImage: 'Share as Image',
      imageVersesWord: 'verses',
      imageStyle: 'Choose a style',
      imageStyleA11y: 'Style {{n}}',
      imageFormat: 'Format',
      imageFormatSquare: 'Square',
      imageFormatPortrait: 'Portrait',
      imageFormatStory: 'Story',
      imageFontSize: 'Font size',
      imageAlignment: 'Alignment',
      imageAlignLeft: 'Left',
      imageAlignCenter: 'Center',
      imageAlignRight: 'Right',
      imageFontStyle: 'Font style',
      imageTexture: 'Texture',
      imageTextureNone: 'None',
      imageTextureDots: 'Dots',
      imageTextureLines: 'Lines',
      imageTextureGrain: 'Grain',
      exclusiveLabel: 'Exclusive',
      imageSavePreset: 'Save style',
      imageStyleSaved: 'Style saved',
      imageMyStyles: 'My styles',
      imageDeletePreset: 'Delete style',
      verseProgress: 'Verse {{current}} of {{total}}',
      autoPlay: 'Auto',
      closeImmersive: 'Close immersive mode',
      increaseFontSize: 'Increase font size',
      decreaseFontSize: 'Decrease font size',
      previousVerse: 'Previous verse',
      nextVerse: 'Next verse',
      sideBySide: 'Show the other version alongside',
      dualView: 'Dual',
      focusMode: 'Focus',
      focusModeOnToast:
        'Focus mode: the centered verse (or the one being read aloud) stands out, the rest dims',
      focusModeOffToast: 'Focus mode off',
      dualCompanionLabel: 'Alongside:',
      swapVersions: 'Swap versions',
      dualLayoutColumns: 'Show as equal-size columns',
      dualLayoutStacked: 'Show the companion below',
      highlightColorNames: {
        yellow: 'yellow',
        green: 'green',
        blue: 'blue',
        purple: 'purple',
        pink: 'pink',
        orange: 'orange',
        red: 'red',
        gray: 'gray',
      },
      highlightInColor: 'Highlight in {{color}}',
      removeHighlight: 'Remove highlight',
      clearSelection: 'Clear selection',
      moreActions: 'More actions',
      listenFromHere: 'Listen from here',
      verseA11yLabel: 'Verse {{n}}, {{text}}',
      verseA11yHint: 'Double tap to select',
      alsoSee: 'See also',
      alsoPanelA11y: 'See this verse in other versions',
      alsoClose: 'Close see also',
    },

    // Audio Player
    audio: {
      sleepTimer: {
        title: 'Sleep timer',
        openTimer: 'Open sleep timer',
        stopAt: 'Stop audio in:',
        minutesShort: '{{n}} min',
        hour1: '1 hour',
        endOfChapterTitle: 'End of chapter',
        endOfChapterSubtitle: 'Stop when the current chapter ends',
        endOfChapterStatus: 'Will stop at the end of the chapter',
        endOfBookTitle: 'End of book',
        endOfBookSubtitle: 'Keep going until the current book ends',
        endOfBookStatus: 'Will stop at the end of the book',
        lessThanOne: 'Less than 1 minute',
        oneRemaining: '1 minute remaining',
        minutesRemaining: '{{n}} minutes remaining',
        info: 'Audio will stop automatically when the selected time ends',
        cancel: 'Cancel',
      },
      a11y: {
        play: 'Play audio',
        pause: 'Pause audio',
        playHint: 'Plays or pauses the chapter narration',
        nextVerse: 'Next verse',
        previousVerse: 'Previous verse',
        nextVerseHint: 'Jumps to the next verse',
        previousVerseHint: 'Returns to the previous verse',
        speed: 'Playback speed',
        expand: 'Expand player',
        expandHint: 'Opens the full player controls',
        collapse: 'Collapse player',
        close: 'Close player',
        autoAdvance: 'Continuous playback',
        autoAdvanceHint:
          'When the chapter ends, automatically continue with the next one',
        readerFollow: 'Reader follows audio',
        readerFollowHint:
          'When continuous playback advances to the next chapter, the reader navigates with it',
        repeatVerse: 'Repeat verse',
        repeatVerseHint:
          'Loops the current verse so you can memorize it, until you turn it off',
      },
      scrub: {
        preview: 'Verse {{n}} of {{total}}',
        a11yLabel: 'Verse scrubber',
        a11yHint: 'Drag to jump to a verse',
      },
      resume: {
        toast: 'Resumed from {{ref}}',
      },
      queue: {
        title: 'Listening queue',
        nowPlaying: 'Now playing',
        upNextSection: 'Up next',
        jumpHint: 'Jump playback to this chapter',
        openLabel: 'Open the listening queue',
        openHint: 'Shows the upcoming chapters of this session',
        endOfCanon: 'End of the Bible',
        info: 'With continuous playback ∞, audio rolls through these chapters on its own.',
        versesMeta: '{{n}} verses',
        minutesMeta: '~{{m}} min',
        bookmarksSection: 'Bookmarks',
        bookmarkAdd: 'Bookmark this verse',
        bookmarkRemove: 'Remove the bookmark on this verse',
        bookmarkJumpHint: 'Resume listening at this verse',
        bookmarkDelete: 'Delete bookmark',
        bookmarkPinned: 'Bookmark saved: {{verse}}',
        playlistTitle: 'Listening list',
        playlistUpNext: 'Next on the list',
        playlistJumpHint: 'Jump playback to this verse',
        playlistEnd: 'End of the list',
        playlistInfo:
          'You are listening to a list of saved verses. Audio stops when the list ends.',
        playlistQueued: 'Listening list: {{label}} · {{n}} verses',
        shuffle: 'Shuffle',
        repeat: 'Repeat list',
        playlistRepeats: 'The list repeats from the start',
      },
      playlistRow: 'List: {{label}}',
      nextChapterUp: 'Up next: {{chapter}}',
      readerFollowToast: '∞ {{chapter}}',
      autoAdvanceOnToast:
        '∞ Auto-advance: audio will continue into the next chapter',
      autoAdvanceOffToast:
        'Auto-advance off: audio stops at the end of this chapter',
      readerFollowOnToast:
        '📖 The reader will follow the audio into each chapter',
      readerFollowOffToast: 'The reader stays put while the audio moves on',
      repeatVerseOnToast:
        '🔁 Repeat verse: this verse will loop so you can memorize it',
      repeatVerseOffToast:
        'Repeat off: audio will continue with the next verse',
      immersive: {
        listen: 'Listen',
        listening: 'Listening',
        paused: 'Paused',
        continuous: 'Continuous',
        chapterAdvanced: 'Now reading {{chapter}}',
      },
    },

    // Premium (Sprint 50 — local feature flag)
    premium: {
      title: 'Premium',
      featureName: 'Verse scrubbing',
      lockedHint: 'Drag the bar to jump to any verse',
      upsellTap: 'Unlock it in Settings',
      badge: 'PREMIUM',
      settingsTitle: 'Premium features',
      settingsDesc:
        'Unlock verse scrubbing and resume-where-you-left-off in the audio player.',
      toggleLabel: 'Premium unlocked',
      unlockedToast: 'Premium enabled',
      lockedToast: 'Premium disabled',
    },

    offering: {
      badgeA11y: 'Extra — unlocked with an offering',
      sheetTitle: 'A voluntary offering',
      sheetIntro:
        'Some extras in this app unlock with a single, voluntary offering — like an offering at church, not a purchase. The Bible, reading plans, prayer, and everything else stay, and will always stay, completely free.',
      extrasListTitle: "Here's what unlocks:",
      extraAudio:
        'Advanced audio: scrub freely by verse, resume where you left off, and listen in immersive mode',
      extraShareTemplates: 'Additional verse-sharing templates',
      tierSuggested: 'Suggested',
      legend:
        "The amounts are fixed by app-store requirements; any of them unlocks exactly the same thing.\n\nIf you'd like to give a different amount, the Donation section is always open to sow whatever God places on your heart.",
      transparency:
        'This offering is not tax-deductible. It sustains the development and ministry of this app.',
      restoreLink: 'Restore my previous offering',
      restoring: 'Restoring…',
      restoreNotFound: "We couldn't find a previous offering on this account.",
      restoreSuccess: 'Extras restored. Thank you for your offering!',
      purchasing: 'Processing…',
      purchaseError: "The offering couldn't be completed. Please try again.",
      thankYouTitle: 'Thank you for sowing into this work',
      thankYouMessage:
        'The full app stays free — this extra is just an added gift. God bless you.',
      close: 'Close',
      settingsSectionTitle: 'Extras',
      settingsUnlockedTitle: 'Extras unlocked',
      settingsUnlockedDesc:
        'Thank you for your offering — you now have access to every extra.',
      settingsLockedTitle: 'App extras',
      settingsLockedDesc:
        'Some additional features can be unlocked with a voluntary offering.',
      settingsCta: 'Unlock with an offering',
      devToggleLabel: 'Extras unlocked (dev only)',
    },

    donation: {
      sheetTitle: 'Donation',
      sheetIntro:
        'For brothers and sisters God places it on their heart to support this work: here you can give freely. This unlocks nothing — the full app already is, and will always be, free for everyone.',
      amountsHint:
        "Choose the amount you'd like to give. You can do it more than once.",
      transparency:
        "This donation is not tax-deductible. It sustains this app's development and ministry.",
      purchasing: 'Processing…',
      purchaseError: "The donation couldn't be completed. Please try again.",
      thankYouTitle: 'Thank you for your generosity',
      thankYouMessage: 'God sees what is given from the heart.',
      thankYouVerse:
        'The grace of the Lord Jesus Christ, the love of God, and the fellowship of the Holy Spirit, be with you all. Amen.',
      thankYouVerseRef: '2 Corinthians 13:14',
      close: 'Close',
      settingsSectionTitle: 'Donation',
      settingsDesc:
        "If you'd like to support this app's development and ministry with a free-will donation, you can do it here. It never unlocks anything and is never required to use the app.",
      settingsCta: 'Support with a donation',
    },

    // Reading Plans
    readingPlans: {
      days: 'days',
      proverbs: {
        name: 'Daily Wisdom (Proverbs)',
        description: 'One chapter of Proverbs each day',
      },
      psalms: {
        name: 'Psalms in {{n}} Days',
        description: 'Read the entire book of Psalms at your own pace',
      },
      gospels: {
        name: 'The 4 Gospels in {{n}} Days',
        description: 'Get to know the life of Jesus through the four gospels',
      },
      newTestament: {
        name: 'New Testament in {{n}} Days',
        description: 'Read the entire New Testament at your own pace',
      },
      genesis: {
        name: 'Genesis - The Beginning',
        description: 'Discover the origin of everything in the book of Genesis',
      },
      bibleYear: {
        name: 'The Whole Bible in {{n}} Days',
        description:
          'Journey through all of Scripture in {{n}} days, in canonical order',
      },
      redemption: {
        name: 'Christ in All of Scripture',
        description:
          'The story of redemption: 31 key passages that point to Jesus, from Genesis to Revelation',
      },
      wisdom: {
        name: 'Daily Wisdom: a Psalm and a Proverb',
        description:
          'A Psalm and a chapter of Proverbs each day, to begin or end your day',
      },
      firstSteps: {
        name: 'First Steps with Jesus',
        description:
          'A gentle {{n}}-day path for new believers and for beginning again',
      },
      iam: {
        name: 'The "I Am" Sayings of Jesus',
        description:
          'Seven days in the Gospel of John: who Jesus is, in His own words',
        context: [
          '"I am the bread of life." Jesus satisfies the deepest hunger of the soul.',
          '"I am the light of the world." Whoever follows Him never walks in darkness.',
          '"I am the door." Only through Him do we enter salvation and good pasture.',
          '"I am the good shepherd." The Shepherd who lays down His life for the sheep.',
          '"I am the resurrection and the life." In Him, death is not the end.',
          '"I am the way, the truth, and the life." The only way to the Father.',
          '"I am the true vine." Abiding in Him bears fruit that lasts.',
        ],
      },
      parables: {
        name: 'The Parables of Jesus',
        description:
          'Ten days among the stories Jesus used to teach the kingdom of God',
        context: [
          '"The prodigal son." The Father runs to welcome the one who returns — that is the heart of God.',
          '"The good Samaritan." Real love crosses the road and gets its hands dirty for the one in need.',
          '"The sower." The same Word falls on different hearts; ask to be good soil.',
          '"The wheat and the tares." God is patient; the final separation is His to make, not ours.',
          '"The lost sheep and coin." Heaven rejoices over one sinner who repents.',
          '"The unforgiving servant." Forgiven an unpayable debt, we are called to forgive.',
          '"The ten virgins." Watch and be ready: the Bridegroom comes at an hour you do not expect.',
          '"The talents." What God entrusts to you is to be used faithfully, not buried.',
          '"The Pharisee and the tax collector." God resists the proud and justifies the humble who cries for mercy.',
          '"The great banquet." God’s invitation is wide; do not put it off.',
        ],
      },
      miracles: {
        name: 'The Miracles of Jesus',
        description:
          'Ten days before the signs by which Jesus showed who He is',
        context: [
          '"Water into wine." His first sign: the abundance and joy that Jesus brings.',
          '"Calming the storm." Wind and sea obey Him — and so will your storm.',
          '"Feeding the five thousand." In His hands, a little is more than enough.',
          '"Walking on the water." "Be not afraid; it is I." His presence holds us in the impossible.',
          '"Jairus’ daughter." Neither sickness nor death stops His power and tenderness.',
          '"Healing the man born blind." The One who opens the body’s eyes opens the soul’s as well.',
          '"The widow’s son at Nain." Moved with compassion, He gives back life and comfort.',
          '"Healing the paralytic." First He forgives the sin, then heals — He has authority for both.',
          '"The ten lepers." Ten are cleansed; only one returns to give thanks. And you?',
          '"Raising Lazarus." "I am the resurrection and the life": death does not have the last word.',
        ],
      },
      namesOfGod: {
        name: 'The Names of God',
        description:
          'Seven days knowing God by the names through which He reveals Himself',
        context: [
          '"The LORD will provide" (Jehovah-jireh). On the mountain God provides the lamb — a sign of the Lamb He would give.',
          '"I AM THAT I AM." The eternal, self-sufficient God makes Himself known and sends.',
          '"The LORD is my banner" (Jehovah-nissi). The people’s victory is in the Lord, not in their own strength.',
          '"The LORD is my shepherd" (Jehovah-rohi). The One who tends, guides and restores: at His side we lack nothing.',
          '"The LORD is peace" (Jehovah-shalom). Where God speaks, fear gives way: He is our peace.',
          '"The LORD who heals" (Jehovah-rapha). The One who healed the bitter waters is still the God who heals.',
          '"The Most High, my refuge" (Elyon). Whoever dwells in the shelter of the Most High rests safe in His shadow.',
        ],
      },
      fruitOfSpirit: {
        name: 'The Fruit of the Spirit',
        description:
          'Nine days through the fruit the Spirit grows in the believer (Galatians 5:22-23)',
        context: [
          'Love: "Love is patient, love is kind." The first fruit is a portrait of Christ: to love as He loved us.',
          'Joy: "Rejoice in the Lord always." A joy that rests not on circumstances but on the Lord.',
          'Peace: "Peace I leave with you, my peace I give to you." Not as the world gives: the peace Christ Himself leaves us.',
          'Patience: "Be patient until the coming of the Lord." Like the farmer who waits for the fruit, trusting God.',
          'Kindness: "Be kind to one another, as God forgave you." The kindness born of having been forgiven.',
          'Goodness: "Do not be overcome by evil, but overcome evil with good." The active goodness that returns good for evil.',
          'Faithfulness: "Well done, good and faithful servant." To be faithful in little is to please the Lord who will return.',
          'Gentleness: "Learn from me, for I am gentle and lowly in heart." The gentleness of Christ, who gives rest to the soul.',
          'Self-control: "Everyone who competes exercises self-control in all things." The self-control that runs to win the imperishable prize.',
        ],
      },
      heroesOfFaith: {
        name: 'Heroes of the Faith',
        description:
          'Eight days among the witnesses of faith in Hebrews 11, from Abel to Christ',
        context: [
          'Abel: "By faith he offered a more excellent sacrifice." The first to worship from the heart; his blood cries out, but Christ’s speaks better things.',
          'Noah: "By faith he prepared an ark." He believed God against all evidence and found grace for the saving of his house.',
          'Abraham called: "By faith he went out, not knowing where he was going." He left land and kindred, trusting God’s promise alone.',
          'Abraham and Isaac: "By faith he offered up Isaac." On the mountain, a shadow of the Father who did not spare His own Son.',
          'Moses and the sea: "By faith they passed through the Red Sea." Where there was no way, God made one: salvation belongs to the Lord.',
          'Joshua and Jericho: "By faith the walls of Jericho fell." The victory came by trusting and obeying, not by the sword.',
          'The witnesses: "So great a cloud of witnesses." They all died in faith, awaiting something better: the promised Christ.',
          'Looking to Jesus: "Looking unto Jesus, the author and finisher of faith." All this faith looks to Him, the goal of the race.',
        ],
      },
      propheticThread: {
        name: 'The Prophetic Thread',
        description:
          'The Old and New Testaments, chapter by chapter: walk through every prophecy and its fulfillment in Christ',
        context: [
          "The seed of the woman: From the fall, God promises the woman's seed will crush the serpent's head; Christ, born of a woman, came to undo the works of the devil.",
          "Blessing to the nations: In Abraham's seed all nations would be blessed; that seed, Paul says, is Christ.",
          "From the tribe of Judah: The scepter would not depart from Judah until Shiloh came; the Lord Jesus was born of Judah's tribe.",
          'A star out of Jacob: Balaam saw from afar a star rising out of Jacob; the magi followed His star to the newborn King.',
          "Heir to David's throne: God promised David an offspring whose kingdom would be everlasting; the angel said Jesus would reign forever.",
          'Born of a virgin: The virgin would conceive and bear a son, Immanuel, "God with us": fulfilled in the birth of Jesus.',
          'Born in Bethlehem: From Bethlehem, small among the towns, would come the One whose origins are from eternity.',
          'Mighty God, Prince of Peace: A child is born whose name is Wonderful, Mighty God, Prince of Peace: the Savior, Christ the Lord.',
          'Out of Egypt: As Israel was called out of Egypt, so was the Son of God, kept there in His childhood.',
          "Weeping in Ramah: Rachel's weeping for her children was heard when Herod killed the little ones of Bethlehem.",
          'The Branch of Jesse: A shoot would come from the stump of Jesse, a Branch bearing fruit; Paul cites this root of Jesse: Christ, in whom the Gentiles hope.',
          'David\'s righteous Branch: "I will raise up for David a righteous Branch, and he shall reign as King," Jeremiah promises; the Lord Jesus declares himself "the root and the descendant of David, the bright morning star."',
          'The messenger of the way: God would send a messenger to prepare the way before Him: John the Baptist, who came before the Lord.',
          'A voice in the wilderness: A voice would cry in the wilderness, "Prepare the way of the Lord"; so John preached in the desert.',
          'The Elijah who was to come: "Behold, I will send you Elijah the prophet before the great and terrible day of the LORD comes," Malachi promises; Jesus himself declared that this promise was fulfilled in John the Baptist.',
          'A prophet like Moses: God would raise a prophet like Moses, to whom we must listen; Peter proclaims Him fulfilled in Jesus.',
          'Anointed with the Spirit: The Spirit of the Lord upon the Anointed to bring good news to the poor: Jesus read it and said "today this is fulfilled."',
          'Light in Galilee: The people walking in darkness would see a great light; Jesus began to preach in Galilee of the Gentiles.',
          'Heals the blind and lame: The eyes of the blind would open and the lame leap; so Jesus answered: the blind see, the lame walk.',
          'Speaks in parables: The Messiah would open His mouth in parables, uttering things hidden since the foundation of the world.',
          'Riding on a donkey: The King would come humble, riding on a colt; so Jesus entered Jerusalem amid praises.',
          'My chosen servant: Behold My servant, My chosen in whom My soul delights; Matthew applies it to the Lord Jesus, gentle and humble.',
          'He bore our sicknesses: He took up our infirmities and bore our diseases; so Matthew describes His healings, a foretaste of the cross.',
          'The rejected stone: The stone the builders rejected became the cornerstone: Christ, rejected and exalted. · Blessed is He who comes: Blessed is He who comes in the name of the Lord; so they hailed Him entering Jerusalem: "Hosanna!"',
          'The praise of children: Out of the mouth of children You ordained praise; Jesus recalled it as the little ones acclaimed Him in the temple.',
          'The precious cornerstone: God lays in Zion a tried, precious cornerstone; Peter and Paul find it in Christ, the sure foundation: "he that believeth shall not be confounded."',
          'Zeal for God\'s house: "The zeal of thine house hath eaten me up," says the psalm; His disciples remembered it when Jesus cleansed the temple.',
          'A light to the nations: The Servant of the LORD would be a light to the nations, salvation to the ends of the earth; in Christ that salvation reaches the Gentiles.',
          'Despised and rejected: Despised and rejected by men; He came to His own, and His own did not receive Him.',
          'Hated without a cause: Those who hate me without cause are more than the hairs of my head, the psalmist cries; Jesus himself quotes these words the night before He died: "They hated me without a cause."',
          'The report not believed: "Who hath believed our report?" John sees the unbelief toward Jesus as the fulfillment of what Isaiah foretold.',
          'Betrayed by a friend: He who ate bread with Him lifted his heel against Him; Judas, one of the twelve, betrayed Him.',
          'Sold for thirty pieces: They weighed out thirty pieces of silver as His price, what Judas received for betraying the Lord.',
          'The shepherd struck: Strike the shepherd and the sheep scatter; the disciples fled when Jesus was seized.',
          'Silent before His accusers: Like a lamb led to the slaughter, He was silent and did not open His mouth before His accusers.',
          'Struck and spat upon: He gave His face to those who struck and spat at Him; so Jesus was treated at His trial.',
          'Wounded for our sins: He was pierced for our transgressions, crushed for our iniquities; by His wounds we are healed.',
          'Hands and feet pierced: They pierced His hands and feet, long before crucifixion existed: fulfilled at the cross.',
          'They divide His garments: They divided His garments and cast lots for His clothing, beside the cross.',
          'Gall and vinegar: In His thirst they gave Him vinegar to drink, just as was written beforehand.',
          'Why have You forsaken me?: The cry "My God, why have You forsaken me?" was the voice of Psalm 22 from the cross.',
          "Not a bone broken: He keeps all His bones; not one is broken — they did not break Jesus' legs on the cross.",
          'They look on the pierced One: They would look on the One they pierced and mourn; the soldier opened His side with a spear.',
          'Buried with the rich: His grave was assigned with the rich; Joseph of Arimathea, a rich man, laid Him in his own tomb.',
          'Numbered with transgressors: He was counted among the transgressors, crucified between two criminals, and interceded for them.',
          'Made a curse for us: Cursed is everyone hanged on a tree; Christ redeemed us from the curse, becoming a curse for us.',
          'The everlasting covenant, the sure mercies of David: "I will make with you an everlasting covenant, my steadfast, sure love for David," Isaiah promises; Paul quotes it at Antioch as proof that Christ was raised, never again to see corruption.',
          'He would not see decay: You will not abandon His soul to Sheol nor let Your Holy One see corruption: Christ rose on the third day. · The path of life: You will show Me the path of life; Peter proclaims it fulfilled in the resurrection of the Lord.',
          'The oath to David: "The LORD swore to David... one of the sons of your body I will set on your throne"; Peter recalls that oath at Pentecost, proclaiming that God raised up Christ to sit on his throne.',
          'You are My Son: "You are My Son, today I have begotten You": Paul applies it to the resurrection of Jesus.',
          'Seated at God\'s right hand: The Lord said to my Lord, "Sit at My right hand"; Christ ascended and sat at the right hand of God.',
          'Ascended on high: You ascended on high, leading captivity captive; Christ ascended and gave gifts to men.',
          'Your throne is forever, O God: Your throne, O God, is forever and ever; Hebrews says it of the Son, God and King through the ages.',
          'A priest forever: You are a priest forever after the order of Melchizedek; Christ is our great High Priest.',
          'The Son of Man: One like a Son of Man came and was given everlasting dominion; Jesus called Himself so before the high priest.',
          'Calling on the name of the Lord: Joel says, "Whosoever shall call on the name of the LORD shall be saved"; Paul applies it to Christ, Lord of all, rich to all who call on Him.',
          "David's fallen tent raised: God promised to raise up the fallen tent of David; James sees the promise fulfilled in the risen Christ and in the Gentiles who seek the Lord.",
          'The eternal Creator: "Thou hast laid the foundation of the earth, and the heavens are the work of thine hands"; Hebrews speaks these words to the Son, the same yesterday, today, and forever.',
          'All things under His feet: God put all things under the feet of man; Hebrews sees it fulfilled in Jesus, crowned with glory, to whom all things will be subjected.',
          'Death swallowed up forever: "He will swallow up death forever," Isaiah announces; Paul quotes this promise fulfilled when the mortal puts on immortality: "Death is swallowed up in victory."',
          'Ransomed from the power of Sheol: "O Death, I will be your plague," Hosea promises; alongside Isaiah 25:8, Paul takes up the same cry of victory: "O death, where is your sting?"',
          'New heavens and a new earth: "Behold, I create new heavens and a new earth," Isaiah declares; John sees that promise fulfilled — a new heaven and a new earth — in the final vision where the Lamb is the light of the city of God.',
          "The Passover lamb: The lamb's blood spared from death; 'Christ, our Passover, has been sacrificed for us.'",
          'The blood of the covenant: Moses sprinkled the people with the blood of the covenant at Sinai; at the Last Supper, Jesus took the cup and said, "this is my blood of the new covenant, poured out for many."',
          'The bronze serpent: Whoever looked at the lifted serpent lived; so the Son of Man was lifted up, that whoever believes in Him may have eternal life.',
          'The lamb God provided: Abraham said, "God will provide the lamb"; John pointed to Jesus: "Behold the Lamb of God who takes away the sin of the world."',
          'The manna from heaven: God gave bread from heaven in the wilderness; Jesus said, "I am the bread of life; whoever comes to Me will never hunger."',
          'The rock that gave water: From the struck rock water flowed for the people; "and the Rock was Christ," from whom living water flows.',
          'The tabernacle: God dwelt among His people in the tabernacle; "the Word became flesh and dwelt among us."',
          'The Day of Atonement: The high priest entered with blood once a year; Christ entered once for all by His own blood, obtaining eternal redemption.',
          'Melchizedek, priest-king: Melchizedek, king and priest without genealogy, prefigures Christ, a priest forever after his order.',
          'The firstfruits: The firstfruits of the harvest were offered; "Christ has been raised, the firstfruits of those who have fallen asleep."',
          'Jonah, three days: As Jonah was three days in the belly of the great fish, so the Son of Man was three days in the heart of the earth.',
          'The last Adam: The first Adam was made a living soul; "the last Adam was made a quickening spirit." What was lost in one is made alive in Christ.',
          'The temple veil: The veil shut off the Most Holy Place; through His flesh Christ opened "a new and living way" into the presence of God.',
          'The goat that carries away sin: The goat bore all their iniquities into an uninhabited land; so Christ was offered "to bear the sins of many."',
          'The true rest: Joshua gave rest in the land, but not the final one; there remains a rest for the people of God, entered by faith in Jesus.',
        ],
      },
    },

    // Reading Plan Screen
    readingPlan: {
      changePlanTitle: 'Change Reading Plan',
      changePlanMessage:
        'Are you sure you want to change your current reading plan? Your progress in the current plan will be saved.',
      noPlanSelectedTitle: 'No plan selected',
      noPlanSelectedMessage: 'Please select a reading plan first.',
      duration: 'Duration',
      days: 'days',
      currentPlanHint: 'This is your current plan',
      selectPlanHint: 'Tap to select this plan',
      selected: 'Selected',
      durationText: 'Duration',
      progress: 'Progress',
      daysCompleted: 'days completed',
      dayLabel: 'Day',
      continueReading: 'Continue Reading',
      startPlan: 'Start Plan',
      startContinueHint: 'Tap to start or continue your reading plan',
      availablePlans: 'Available Reading Plans',
      listLabel: 'Reading plans list',
      dayAutoCompleted: '✅ Day {{day}} of "{{plan}}" completed',
      todaySection: 'Up today',
      readDay: 'Read',
      listenDay: 'Listen to this day',
      chapterReadHint: 'Chapter read',
      paceNotStarted: 'Start today — Day 1 awaits',
      paceOnTrack: "You're on track 🙌",
      paceAhead: "You're {{n}} days ahead",
      paceAheadOne: "You're 1 day ahead",
      paceBehind: '{{n}} days to catch up — at your pace, no rush',
      paceBehindOne: '1 day to catch up — at your pace, no rush',
      catchUpTitle: 'Catch up',
      catchUpToday: 'To get current: {{readings}}',
      catchUpFinish: 'At one day per day from today, you finish {{date}}',
      planCompleted: 'Plan completed!',
      planCompletedShort: 'Completed! 🎉',
      planCompletedMessage:
        'You finished "{{plan}}". May His Word keep dwelling in you.',
      planCompletedCta: 'Amen',
      planNextUp: 'Day {{day}} · {{readings}}',
      playlistDayLabel: 'Day {{day}} · {{plan}}',
      durationPickerLabel: 'Plan duration',
      durationPickerHint:
        'Same content, your pace. Only adjustable before you start.',
      durationPickerDays: '{{n}} days',
      durationPickerPace: '≈{{n}} chapters per day',
      restartPlan: 'Restart plan',
      restartPlanConfirm:
        "This clears your marked days so you can start over from Day 1. You'll keep credit for finishing it before.",
      restartPlanConfirmInProgress:
        'This clears your marked days so far so you can start over from Day 1.',
      planRestarted: 'Plan restarted — Day 1 awaits!',
    },

    // Daily Verse Notifications
    notifications: {
      title: 'Notifications',
      dailyVerse: 'Verse of the day',
      dailyVerseDesc: 'Receive the verse of the day at the time you choose',
      time: 'Reminder time',
      enabled: 'Daily reminder turned on',
      disabled: 'Daily reminder turned off',
      memoryReminder: 'Review reminder',
      memoryReminderDesc: 'A daily nudge to review your memory verses',
      memoryReminderEnabled: 'Review reminder turned on',
      memoryReminderDisabled: 'Review reminder turned off',
      prayerReminderTitle: 'Prayer reminder',
      prayerReminder: 'Prayer reminder',
      prayerReminderDesc:
        'A gentle daily invitation to pray, at the time you choose',
      prayerReminderEnabled: 'Prayer reminder turned on',
      prayerReminderDisabled: 'Prayer reminder turned off',
      devotionReminderTitle: 'Devotion reminder',
      devotionReminder: 'Time in the Word',
      devotionReminderDesc:
        'A gentle daily invitation to spend time in the Word, at the time you choose',
      devotionReminderEnabled: 'Devotion reminder turned on',
      devotionReminderDisabled: 'Devotion reminder turned off',
      prophecyReminderTitle: 'Prophecy of the day',
      prophecyReminder: 'Prophecy of the day',
      prophecyReminderDesc:
        'Receive a step of the prophetic thread that points to Christ each day, at the time you choose',
      prophecyReminderEnabled: 'Prophecy reminder turned on',
      prophecyReminderDisabled: 'Prophecy reminder turned off',
      permissionDeniedTitle: 'Permission needed',
      permissionDeniedMessage:
        'To receive the daily verse, enable notifications for the app in your system settings.',
    },

    // Achievements System
    achievements: {
      title: 'My Achievements',
      yourAchievements: 'Your Achievements',
      yourStats: 'Your Statistics',
      loading: 'Loading achievements...',
      unlocked: 'Unlocked',
      locked: 'Locked',
      viewAll: 'View All',
      filterAll: 'All',
      unlockTitle: 'Achievement Unlocked!',
      unlockMessage: 'You unlocked:',
      pointsEarned: 'You earned',
      points: 'points',
      awesome: 'Awesome!',
      viewAchievements: 'View Achievements',
      ok: 'OK',
      readingRegistered: 'Reading Registered',
      readingStats:
        'You have read {{verses}} verses in total.\nLevel {{level}} - {{points}} points\n\nKeep reading to unlock more achievements!',
      testButton: 'Try Achievements',
      testDescription:
        'Tap here to simulate reading 10 verses and see how the achievement system works',
      simulateReading: 'Simulate Reading',
      errorTracking: 'There was a problem registering the reading',
      level: 'Level',
      to: 'to',
      current: 'current',
      longest: 'longest',
      versesRead: 'Verses read',
      chaptersRead: 'Chapters',
      booksCompleted: 'Books completed',
      readingTime: 'Reading time',
      currentStreak: 'Current streak',
      longestStreak: 'Longest streak',
      totalPoints: 'Total points',
      pointsNeeded: 'points to',
      pts: 'pts',
      achievementsUnlocked: 'Unlocked',
      almostThere: 'Almost there',
      almostThereA11y: '{{name}}: {{current}} of {{requirement}} to unlock',
      almostThereHint: 'Tap to see what it takes',
      viewMyTitles: 'My titles',
      viewMyTitlesA11y: 'View my badges and equippable titles',
      shareTitle: 'Share achievement',
      shareUnlockedLabel: 'Achievement unlocked',
      shareLongPressA11y: 'Long-press to share this achievement',
      nextMilestone: 'Next milestone',
      nextMilestoneA11y:
        'Next milestone: {{name}}, {{current}} of {{requirement}}. View achievements.',
      categories: {
        reading: 'Reading',
        streak: 'Streaks',
        chapters: 'Chapters',
        books: 'Books',
        highlights: 'Highlights',
        notes: 'Notes',
        search: 'Search',
        time: 'Time',
        special: 'Special',
      },
      rarities: {
        common: 'Common',
        uncommon: 'Uncommon',
        rare: 'Rare',
        epic: 'Epic',
        legendary: 'Legendary',
      },
      tiers: {
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
        diamond: 'Diamond',
      },
      inProgress: 'In progress',
      legend: 'Legend',
      noCategoryAchievements: 'No achievements in this category',
      definitions: {
        first_verse: {
          name: 'First Steps',
          description: 'Read your first verse',
        },
        verses_10: {
          name: 'Dedicated Reader',
          description: 'Read 10 verses',
        },
        verses_100: {
          name: 'Diligent Student',
          description: 'Read 100 verses',
        },
        verses_500: {
          name: 'Devoted Reader',
          description: 'Read 500 verses',
        },
        verses_1000: {
          name: 'Word Master',
          description: 'Read 1000 verses',
        },
        verses_5000: {
          name: 'Biblical Scholar',
          description: 'Read 5000 verses',
        },
        streak_3: {
          name: 'Commitment Started',
          description: 'Read 3 days in a row',
        },
        streak_7: {
          name: 'Steady Week',
          description: 'Read 7 days in a row',
        },
        streak_30: {
          name: 'Victorious Month',
          description: 'Read 30 days in a row',
        },
        streak_100: {
          name: 'Unbreakable Discipline',
          description: 'Read 100 days in a row',
        },
        streak_365: {
          name: 'Year of Dedication',
          description: 'Read 365 days in a row',
        },
        first_chapter: {
          name: 'First Chapter',
          description: 'Complete your first chapter',
        },
        chapters_10: {
          name: 'Chapter Explorer',
          description: 'Complete 10 chapters',
        },
        chapters_50: {
          name: 'Word Traveler',
          description: 'Complete 50 chapters',
        },
        chapters_150: {
          name: 'Chapter Conqueror',
          description: 'Complete 150 chapters',
        },
        first_book: {
          name: 'First Book',
          description: 'Complete your first book of the Bible',
        },
        books_5: {
          name: 'Pentateuch Read',
          description: 'Complete 5 books',
        },
        books_27: {
          name: 'New Testament Complete',
          description: 'Complete all 27 NT books',
        },
        books_39: {
          name: 'Old Testament Complete',
          description: 'Complete all 39 OT books',
        },
        books_66: {
          name: 'Complete Bible!',
          description: 'Complete all 66 books of the Bible',
        },
        first_highlight: {
          name: 'First Mark',
          description: 'Create your first highlight',
        },
        highlights_25: {
          name: 'Treasure Collector',
          description: 'Create 25 highlights',
        },
        highlights_100: {
          name: 'Truth Archivist',
          description: 'Create 100 highlights',
        },
        first_note: {
          name: 'First Reflection',
          description: 'Write your first note',
        },
        notes_50: {
          name: 'Spiritual Journal',
          description: 'Write 50 notes',
        },
        first_search: {
          name: 'Truth Seeker',
          description: 'Perform your first search',
        },
        searches_50: {
          name: 'Diligent Investigator',
          description: 'Perform 50 searches',
        },
        time_60: {
          name: 'One Hour of Reading',
          description: 'Read for 60 accumulated minutes',
        },
        time_300: {
          name: 'Five Hours of Study',
          description: 'Read for 5 accumulated hours',
        },
        time_1000: {
          name: 'Dedicated Student',
          description: 'Read for 1000 minutes',
        },
        psalms_complete: {
          name: 'Psalmist',
          description: 'Complete the book of Psalms',
        },
        proverbs_complete: {
          name: 'Wise One',
          description: 'Complete the book of Proverbs',
        },
        gospels_complete: {
          name: 'Evangelist',
          description: 'Complete the 4 gospels',
        },
        early_bird: {
          name: 'Early Bird',
          description: 'Read before 6 AM',
        },
        night_owl: {
          name: 'Night Owl',
          description: 'Read after 11 PM',
        },
        prophetic_thread: {
          name: 'Christ in All Scripture',
          description: 'Walk the whole prophetic thread',
        },
        bible_routes: {
          name: 'Traveler of the Word',
          description: 'Explore every stop on every Bible route',
        },
        kids_first_story: {
          name: 'First Story',
          description: 'Complete your first Bible story for kids',
        },
        kids_stories_complete: {
          name: 'Storyteller',
          description: 'Complete every Bible story for kids',
        },
      },
    },

    // Empty States
    emptyStates: {
      noFavorites: {
        title: 'No favorites yet',
        message: 'Save your favorite verses to access them quickly',
        action: 'Explore the Bible',
      },
      noNotes: {
        title: 'No notes yet',
        message: 'Add your reflections and thoughts while reading',
        action: 'Start reading',
      },
      noHighlights: {
        title: 'No highlights',
        message: 'Highlight important verses while reading',
        action: 'Open Bible',
      },
      noSearchResults: {
        title: 'No results',
        message: 'Try different keywords or terms',
        action: 'Clear search',
      },
      noAchievements: {
        title: 'No achievements unlocked',
        message: 'Read the Bible daily to unlock achievements',
        action: 'View challenges',
      },
      noReadingPlan: {
        title: 'No active reading plan',
        message: 'Choose a plan to guide your daily reading',
        action: 'Explore plans',
      },
      noBookmarks: {
        title: 'No bookmarks yet',
        message: 'Bookmark verses while reading to come back to them later',
        action: 'Open the Bible',
      },
    },

    // Version Comparison (V5.1)
    versionComparison: {
      title: 'Version Comparison',
      selectVersions: 'Select Versions',
      addVersion: 'Add',
      removeVersion: 'Remove',
      compareButton: 'Compare',
      saveComparison: 'Save Comparison',
      savedComparisons: 'Saved Comparisons',
      analysis: 'Difference Analysis',
      similarity: 'Similarity',
      commonWords: 'Common words',
      uniqueWords: 'Unique words',
      highlightDifferences: 'Highlight differences',
      contrastSameLangHint:
        'Works best between versions in the same language (KJV ↔ WEB)',
      shareImage: 'Share as image',
      shareAllImage: 'Share all',
      observations: 'Observations',
      verse: 'Verse',
      words: 'words',
      verseOmitted:
        "This verse isn't in {{version}} (omitted in the critical text).",
      selectVerse: 'Select Verse',
      multiSelectMode: 'Multiple',
      simpleMode: 'Simple',
      versesSelected: 'verses selected',
      clearSelection: 'Clear',
      applySelection: 'Apply Selection',
      noComparisons: 'You have no saved comparisons',
      comparisonName: 'Comparison name',
      notes: 'Notes',
      saveSuccess: 'Comparison saved',
      deleteConfirm: 'Delete this comparison?',
      loadComparison: 'Load',
      maxVersionsWarning: 'You can only compare up to 4 versions at once',
      loadComparisonsError: 'Could not load saved comparisons',
      nameRequired: 'Please enter a name for the comparison',
      updateSuccess: 'Comparison updated successfully',
      saveError: 'Could not save the comparison',
      invalidData: 'Invalid comparison data',
      noVersionsSelected: 'No versions selected in this comparison',
      noValidVersions: 'The comparison contains no valid versions',
      loadedComparison: 'Loaded: {{name}}',
      untitledComparison: 'Comparison',
      loadError: 'Error loading the comparison',
      deleteTitle: 'Delete comparison',
      cancel: 'Cancel',
      delete: 'Delete',
      deleteSuccess: 'Comparison deleted',
      deleteError: 'Could not delete the comparison',
      editComparison: 'Edit Comparison',
      update: 'Update',
      save: 'Save',
      minVersionsError: 'At least 2 versions are needed to compare',
      insightVerySimilar: 'The versions are very similar in this verse',
      insightMinorDiff: 'The versions have minor differences',
      insightSignificantDiff: 'The versions have significant differences',
      insightWordDiff:
        'Difference of {{count}} words between the shortest and longest version',
      insightUniqueWords: '{{count}} unique words found',
      versionDescriptions: {
        rvr1960: 'The most widely used traditional Spanish version',
        nvi: 'Modern, easy-to-understand translation',
        lbla: 'Very precise literal translation',
        dhh: 'Contemporary, accessible language',
        kjv: 'Classic English translation',
        nlt: 'Modern, easy-to-read English',
        local: 'Local version loaded in memory',
      },
    },

    // Badge System (V5.1)
    badgeSystem: {
      title: 'Badges and Titles',
      collectionTitle: 'Achievement Collection',
      myBadges: 'My Badges',
      myTitles: 'My Titles',
      allBadges: 'All Badges',
      equip: 'Equip',
      unequip: 'Unequip',
      equipped: 'Equipped',
      equippedTitle: 'Equipped title',
      unlockedToast: '🏆 Badge unlocked: {{name}}!',
      noTitles: "You haven't unlocked any titles yet",
      noTitlesDescription: 'Complete achievements to earn special titles',
      viewAllAchievements: 'View all achievements',
      viewAllAchievementsA11y: 'Go to the achievements screen',
      shareTitleAction: 'Share title',
      shareEarnedLabel: 'Title earned',
      shareTitleA11y: 'Share this title as an image',
      unlock: 'Unlock',
      locked: 'Locked',
      unlocked: 'Unlocked',
      completed: 'Completed',
      all: 'All',
      rarity: {
        common: 'Common',
        rare: 'Rare',
        epic: 'Epic',
        legendary: 'Legendary',
        mythic: 'Mythic',
      },
      progress: 'Progress',
      requirements: 'Requirements',
      reward: 'Reward',
      category: {
        reading: 'Reading',
        streak: 'Streak',
        chapters: 'Chapters',
        books: 'Books',
        special: 'Special',
        completion: 'Completion',
        knowledge: 'Knowledge',
        social: 'Social',
      },
      // Badge names and descriptions
      badges: {
        first_verse: {
          name: 'First Read',
          description: 'Read your first verse',
        },
        hundred_verses: {
          name: 'Dedicated Reader',
          description: 'Read 100 verses',
        },
        thousand_verses: {
          name: 'Word Student',
          description: 'Read 1,000 verses',
        },
        five_thousand_verses: {
          name: 'Scripture Master',
          description: 'Read 5,000 verses',
        },
        week_streak: {
          name: 'Weekly Consistency',
          description: 'Maintain a 7-day streak',
        },
        month_streak: {
          name: 'Monthly Faithfulness',
          description: 'Maintain a 30-day streak',
        },
        hundred_day_streak: {
          name: 'Faith Centurion',
          description: 'Maintain a 100-day streak',
        },
        year_streak: {
          name: 'Covenant Guardian',
          description: 'Maintain a 365-day streak',
        },
        first_book: {
          name: 'First Book Completed',
          description: 'Complete your first Bible book',
        },
        new_testament: {
          name: 'New Covenant Witness',
          description: 'Complete the entire New Testament',
        },
        old_testament: {
          name: 'Law Guardian',
          description: 'Complete the entire Old Testament',
        },
        full_bible: {
          name: 'Word Knower',
          description: 'Complete the entire Bible',
        },
        quiz_master: {
          name: 'Knowledge Master',
          description: 'Answer 50 questions correctly',
        },
        memory_verse_10: {
          name: 'Enlightened Mind',
          description: 'Memorize 10 verses',
        },
        memory_verse_50: {
          name: 'Living Treasure',
          description: 'Memorize 50 verses',
        },
        midnight_reader: {
          name: 'Midnight Vigil',
          description: 'Read between midnight and 3 AM',
        },
        early_bird: {
          name: "God's Early Riser",
          description: 'Read before 6 AM for 7 days',
        },
        share_master: {
          name: 'Digital Evangelist',
          description: 'Share 25 verses',
        },
        christmas_special: {
          name: 'Star of Bethlehem',
          description: 'Read on Christmas',
        },
      },
      // Title names and descriptions
      titles: {
        title_reader: {
          name: 'Devout Reader',
          description: 'You have shown dedication to reading',
          prefix: 'Reader',
        },
        title_scholar: {
          name: 'Scripture Student',
          description: 'Your knowledge of the Word is notable',
          prefix: 'Student',
        },
        title_master: {
          name: 'Word Master',
          description: 'You master the Scriptures',
          prefix: 'Master',
        },
        title_faithful: {
          name: 'The Faithful',
          description: 'Your consistency is admirable',
          suffix: 'the Faithful',
        },
        title_centurion: {
          name: 'Faith Centurion',
          description: '100 days of unwavering devotion',
          prefix: 'Centurion',
        },
        title_guardian: {
          name: 'Covenant Guardian',
          description: 'One year of spiritual commitment',
          prefix: 'Guardian',
        },
        title_witness: {
          name: 'New Covenant Witness',
          description: 'You have completed the New Testament',
          prefix: 'Witness',
        },
        title_lawkeeper: {
          name: 'Law Guardian',
          description: 'You have completed the Old Testament',
          prefix: 'Guardian',
          suffix: 'of the Law',
        },
        title_wordbearer: {
          name: 'Word Bearer',
          description: 'You have read the entire Bible',
          prefix: 'Bearer',
          suffix: 'of the Word',
        },
        title_illuminated: {
          name: 'The Enlightened',
          description: 'Your mind holds the Word',
          suffix: 'the Enlightened',
        },
        title_treasure: {
          name: 'Living Treasure',
          description: 'The Word lives in your heart',
          prefix: 'Living Treasure',
        },
        title_earlybird: {
          name: "God's Early Riser",
          description: 'You start the day with the Word',
          prefix: 'Early Riser',
        },
        title_star: {
          name: 'Star of Bethlehem',
          description: 'You celebrated Christ on His birth',
          prefix: 'Star',
          suffix: 'of Bethlehem',
        },
      },
    },

    // Mission System (V5.1)
    missions: {
      // Daily missions
      daily: {
        lector_diario: {
          title: 'Daily Reader',
          description: 'Read at least 10 verses today',
        },
        reflexion_personal: {
          title: 'Personal Reflection',
          description: 'Add 1 note to a verse',
        },
        estudioso: {
          title: 'Scholar',
          description: 'Complete 1 full chapter',
        },
        compartir_palabra: {
          title: 'Share the Word',
          description: 'Share 1 verse with someone',
        },
      },
      // Weekly missions
      weekly: {
        lector_dedicado: {
          title: 'Dedicated Reader',
          description: 'Read 50 verses this week',
        },
        guerrero_fin_semana: {
          title: 'Weekend Warrior',
          description: 'Read both weekend days',
        },
        maestro_organizador: {
          title: 'Master Organizer',
          description: 'Add 10 highlights this week',
        },
        evangelista: {
          title: 'Evangelist',
          description: 'Share 5 verses this week',
        },
      },
      // Special missions
      special: {
        explorando: 'Exploring',
        lee_cualquier: 'Read any chapter of',
      },
      // Reward names
      rewards: {
        puntos: 'Points',
        badge_lector_semanal: 'Badge: Weekly Reader',
        badge_evangelista: 'Badge: Evangelist',
      },
    },

    // Widgets (V5.1)
    widgets: {
      title: 'Widgets',
      subtitle: 'The daily verse, pinned to your home screen',
      verseOfDay: 'Verse of the Day',
      verseOfDayDesc: 'Daily inspiration directly on your home screen',
      howToUse: 'How to add it to your home screen',
      howToUseSteps: {
        step1: 'Long-press an empty spot on your home screen',
        step2: 'Tap "Widgets"',
        step3: 'Find "Eternal Bible" in the list',
        step4: 'Press and hold the widget, then drag it to your screen',
        step5: 'Done! The daily verse will greet you each morning',
      },
      note: "The widget refreshes once a day and adapts to your phone's light or dark theme.",
    },

    // Settings V5.1 Section
    settingsV51: {
      title: 'Features',
      widgets: 'Widgets',
      widgetsDesc: 'Home screen widgets preview',
      versionComparison: 'Version Comparison',
      versionComparisonDesc: 'Compare verses in different translations',
      badges: 'Badges and Titles',
      badgesDesc: 'Achievement system with collectible badges',
    },
    // 🤝 "Together without a server" — shared reading plans (Sprint 107)
    together: {
      shareTitle: 'Read together',
      shareIntro:
        'Invite others to read this plan with you. Everyone follows it on their own device, with private progress — no accounts, no servers.',
      startsOn: 'Starts on',
      today: 'Today',
      groupNameLabel: 'Group name (optional)',
      groupNamePlaceholder: 'e.g. Family, Small group, Grade 3B',
      yourCode: 'Code',
      share: 'Share invitation',
      copyLink: 'Copy link',
      copyCode: 'Copy code',
      copied: 'Copied',
      inviteMessage:
        "📖 Let's read together: {{plan}}, starting {{date}}.\n\nOpen it in Eternal Bible:\n{{link}}\n\nLink not opening? Use code {{code}} in Settings → Join a group.",
      importTitle: 'Join a group',
      invitedTo: "You're invited to read together",
      willStart: 'Starts {{date}}',
      withGroup: 'with {{group}}',
      privateProgress:
        'Your progress is private and stays on your device. You can leave anytime.',
      join: 'Join and start',
      joinedToast: "Done! You'll find the plan on your home screen.",
      enterCode: 'Join a group',
      enterCodeIntro:
        'Enter the code someone shared with you to read a plan together.',
      enterCodePlaceholder: 'EB1-…',
      continueLabel: 'Continue',
      codeInvalid: "That code isn't valid. Check that it's complete.",
      codeUnknownPlan:
        "That plan doesn't exist in this version of the app. Please update and try again.",
      linkInvalid: "We couldn't read that invitation.",
      linkVersion:
        'This invitation is from a newer version. Please update the app.',
      readingWith: 'Reading with {{group}}',
      readingTogether: 'Reading together',
      leaveGroup: 'Leave group',
      joinFeatureDesc:
        'Read a plan with your family or group, each in their app',
      shareCustomTitle: 'Share my plan',
      shareCustomIntro:
        'Share your plan by link. Whoever gets it reads it in their own app, at their own pace.',
      shareCustomMessage:
        "📖 Here's a reading plan I made: {{plan}}.\n\nOpen it in Eternal Bible:\n{{link}}\n\nLink not opening? Copy this message and paste it in Settings → Join a group.",
      customLinkNote: 'Shared by link (no short code).',
      customInvitedTo: 'A plan was shared with you',
      customMeta: '{{days}} days · {{chapters}} chapters',
      importPlan: 'Import and start',
      importedToast: "Plan imported! You'll find it on your home screen.",
      pasteOrCodeIntro: 'Paste the link or enter the code you were given.',
      pasteOrCodePlaceholder: 'Link or EB1-…',
      pasteDetected: 'Paste copied invitation',
      deletePlan: 'Delete plan',
      deletePlanConfirm:
        'It will be removed from your plans. You can import or create it again.',
      planDeleted: 'Plan deleted',
      shareStudyTitle: 'Share this study',
      shareStudyIntro:
        'Share your outline by link. Whoever gets it sees a navigable, read-only study, in their own language.',
      shareStudyMessage:
        '📖 Here is a study of {{passage}} I made.\n\nOpen it in Eternal Bible:\n{{link}}\n\nLink not opening? Copy this message and paste it in Settings → Join a group.',
      shareStudy: 'Share study',
    },
    sharedStudy: {
      title: 'Shared study',
      banner: 'Shared with you · read-only',
      by: 'Shared by {{who}}',
      invalid: "We couldn't open this study.",
      empty:
        'This study has no notes. Open the passage in your Prep Table to study it.',
      openInPrep: 'Open in my Prep Table',
      teacherNote: "Author's note",
    },
    devotionalShared: {
      title: 'Shared devotional',
      banner: 'Shared with you · read-only',
      invalid: "We couldn't open this devotional.",
      todayLabel: 'Today',
      dayN: 'Day {{n}}',
      daysMeta: 'Devotional · {{n}} days',
      startsOn: 'Starts {{date}}',
      finished: 'This devotional has ended',
      allDays: 'All days',
    },
    devotionalBuilder: {
      entryTitle: 'Create a devotional',
      entryDesc: 'Bake a verse-a-day calendar and share it with your group',
      title: 'Create a devotional',
      intro:
        'Pick a verse (and an optional short note) for each day. Share the link: with a start date, everyone sees the same verse each day.',
      nameLabel: 'Title',
      namePlaceholder: 'E.g. A week in the Psalms',
      startLabel: 'Starts',
      startToday: 'Today',
      daysLabel: 'Days',
      noDays: "You haven't added any days yet.",
      addDay: 'Add day',
      pickVerse: 'Pick a verse',
      chapter: 'Chapter',
      verse: 'Verse',
      notePlaceholder: 'Short note (optional)',
      removeDay: 'Remove day',
      dayN: 'Day {{n}}',
      changeBook: 'Change book',
      addThisDay: 'Add',
      share: 'Share devotional',
      needOneDay: 'Add at least one day with a verse.',
      shareMessage:
        '🗓️ A devotional for you: {{title}}\n\nOpen it in Eternal Bible:\n{{link}}',
    },
    planBuilder: {
      title: 'Create a plan',
      cardTitle: 'Create a plan',
      cardSubtitle: 'Build your own reading plan',
      intro:
        'Build your own plan: pick passages and a pace, and the app spreads the chapters across days.',
      nameLabel: 'Plan name',
      namePlaceholder: 'e.g. John in a week',
      passagesLabel: 'Passages',
      addPassage: 'Add passage',
      noPassages: 'No passages added yet.',
      pickBook: 'Choose a book',
      changeBook: 'Change book',
      fromChapter: 'From chapter',
      toChapter: 'To chapter',
      addThisPassage: 'Add passage',
      paceLabel: 'Pace',
      pacePerDay: 'Chapters per day',
      paceTotalDays: 'Number of days',
      previewEmpty: 'Add passages to preview the plan',
      preview: '{{days}} days · {{chapters}} chapters',
      create: 'Create and start',
      editTitle: 'Edit plan',
      save: 'Save changes',
      updated: 'Plan updated!',
      needNameAndPassage: 'Give it a name and add at least one passage.',
      created: 'Plan created!',
      removePassage: 'Remove passage',
    },

    kids: {
      cardTitle: 'Bible for Kids',
      cardSubtitle: 'Stories to read and tell',
      title: 'Bible for Kids',
      subtitle: 'Bible stories, step by step',
      intro:
        'These stories are made so a child can read them alone, or so an adult can read them aloud. Each scene comes from a real verse — tap it to hear it or see it exactly as written.',
      scenesCount: '{{n}} scenes',
      completed: 'Completed',
      sceneOf: 'Scene {{n}} of {{total}}',
      listen: 'Listen',
      stopListening: 'Stop',
      showVerse: 'Show the verse',
      hideVerse: 'Hide verse',
      missingVerse: 'Verse not available',
      next: 'Next',
      previous: 'Previous',
      listenAll: 'Listen to all',
      listenAllHint:
        'Tip: "Listen to all" narrates the whole story in a row, hands-free.',
      quiz: {
        start: 'Start the challenge',
        question: 'Question {{n}} of {{total}}',
        correct: 'Correct!',
        wrong: 'Almost — try again',
        retry: 'Try again',
        score: '{{n}} of {{total}} stars',
        finish: 'Finish',
      },
      teach: {
        title: 'For teaching',
        readFull: 'Full reading',
        contextTitle: 'Context',
        talkTitle: 'To talk about',
        openInReader: 'Open in the reader',
      },
      plan: {
        cardTitle: '10-Day Plan',
        cardSubtitle: 'One story a day',
        title: '10-Day Plan',
        subtitle: 'One Bible story a day',
        intro:
          'Read or listen to a different story every day for 10 days. You can go ahead or take your time — there is no rush.',
        dayLabel: 'Day {{n}}',
        today: 'Today',
        completed: 'Completed',
        progress: '{{done}} of {{total}} days',
        goToToday: "Go to today's story",
        paceNotStarted: 'Start today — Day 1 awaits',
        paceOnTrack: "You're on track 🙌",
        paceAhead: "You're {{n}} days ahead",
        paceAheadOne: "You're 1 day ahead",
        paceBehind: '{{n}} days to catch up — at your pace, no rush',
        paceBehindOne: '1 day to catch up — at your pace, no rush',
        paceComplete: 'You finished all 10 stories! 🎉',
      },
      stories: {
        creation: {
          title: 'Creation',
          subtitle: 'God made everything',
          refLabel: 'Genesis 1–2',
          teachContext:
            'Genesis 1 and 2 tell how God created the universe in six days and rested on the seventh. This is not one myth among others: it is the foundation of the whole Bible — God as creator of everything that exists, and people made in his image.',
          teachQuestions: [
            'Which part of Creation seems most amazing to you? Why?',
            'What does it mean that God made us "in his image"?',
            'Why do you think God rested on the seventh day, if he never gets tired?',
          ],
          scenes: {
            'creation-1': {
              text: 'Before the sun, the moon, or any star existed, everything was dark and empty. Then God spoke: "Let there be light." And light appeared, simply because God said so. That is how everything began: with the word of God.',
            },
            'creation-2': {
              text: 'God separated the waters above from the waters below, and put a wide space between them: the sky. There were still no plants, animals, or people — only sky, water, and the powerful word of God making room for what was coming.',
            },
            'creation-3': {
              text: 'God gathered the waters into one place, and dry land appeared. Then he commanded the land to produce plants: trees, grass, and seeds of every kind, each according to its kind. The world began to fill with green.',
            },
            'creation-4': {
              text: 'God placed two great lights in the sky: the sun to rule the day and the moon to rule the night. He also made the stars. Ever since, day and night have followed the order God set that day.',
            },
            'creation-5': {
              text: 'God filled the sea with fish and the sky with birds of every kind. He blessed them and told them to multiply. For the first time, the world was full of movement: fins swimming and wings flying.',
            },
            'creation-6': {
              text: 'Finally, God made the animals of the earth, and then created man and woman in his own image. He gave them the task of caring for everything he had made. God looked at all he had created and saw that it was very good.',
            },
            'creation-7': {
              text: 'On the seventh day, God rested from all the work he had done. Not because he was tired, but to bless that day and set it apart as special. That is how the week of Creation ended.',
            },
          },
          quiz: {
            'creation-q1': {
              question: 'What did God say first, according to the Bible?',
              options: [
                '"Let there be light"',
                '"Let there be sea"',
                '"Let us make man"',
              ],
            },
            'creation-q2': {
              question: 'What did God do on the seventh day?',
              options: [
                'He made the animals',
                'He rested',
                'He made the sun and moon',
              ],
            },
            'creation-q3': {
              question: 'In whose image did God make man?',
              options: [
                "In the angels' image",
                "In the animals' image",
                "In God's own image",
              ],
            },
          },
        },
        noah: {
          title: 'Noah and the Ark',
          subtitle: 'God keeps his promise',
          refLabel: 'Genesis 6–9',
          teachContext:
            "Wickedness had filled the earth, and God chose to start again through one faithful family. The flood is both a story of judgment and of God's faithfulness: he saves those who trust him and seals his promise with a visible sign in the sky.",
          teachQuestions: [
            'Why do you think Noah obeyed God even though no one else did?',
            "What does the rainbow mean as God's promise?",
            'What things does God ask of us today that might feel as hard as building the ark felt to Noah?',
          ],
          scenes: {
            'noah-1': {
              text: 'God saw that the earth had become full of wickedness, and decided to send a flood. But he told Noah, a righteous man, to build an ark of wood, with rooms inside and out, to save his family.',
            },
            'noah-2': {
              text: 'God told Noah to bring a pair of every kind of animal into the ark, so life could continue after the flood. Noah did exactly what God had commanded him, and the animals came into the ark two by two.',
            },
            'noah-3': {
              text: 'When everyone was inside, it began to rain. Rain fell on the earth for forty days and forty nights, and the waters rose until they covered the whole earth. The ark floated safely on the waters.',
            },
            'noah-4': {
              text: 'After a long time, the waters began to go down. The ark came to rest on the mountains of Ararat. The land that had been covered by water slowly began to appear again.',
            },
            'noah-5': {
              text: 'Noah sent out a dove to see if the earth was dry yet. The dove came back to the ark carrying a freshly picked olive leaf in its beak. That is how Noah knew the waters had gone down on the earth.',
            },
            'noah-6': {
              text: 'When everyone left the ark, God set his bow — the rainbow — in the clouds as a sign of his promise: he would never again destroy the earth with a flood. Every time a rainbow appears, it recalls that promise of God.',
            },
          },
          quiz: {
            'noah-q1': {
              question: 'What did God tell Noah to build the ark from?',
              options: ['Gopher wood', 'Stone', 'Clay'],
            },
            'noah-q2': {
              question: 'What did the dove bring back in its beak?',
              options: ['A stone', 'An olive leaf', 'A fish'],
            },
            'noah-q3': {
              question:
                'What did God set in the clouds as a sign of his promise?',
              options: ['A star', 'A rainbow', 'A dove'],
            },
          },
        },
        joseph: {
          title: 'Joseph and His Brothers',
          subtitle: 'God turns it for good',
          refLabel: 'Genesis 37–45',
          teachContext:
            "Joseph's story shows how God can bring good even out of betrayal and injustice, without that meaning the wrong done by his brothers was somehow right. Joseph's forgiveness of those who hurt him is the high point of the whole account.",
          teachQuestions: [
            "Why do you think Joseph's brothers were jealous of him?",
            'How was Joseph able to forgive the ones who hurt him so badly?',
            'Has something bad that happened to you ever ended up helping other people, like it did with Joseph?',
          ],
          scenes: {
            'joseph-1': {
              text: "Joseph was one of Jacob's twelve sons, and his father loved him in a special way. His brothers grew jealous because Joseph had dreams in which they bowed down to him, and they could no longer speak to him peacefully.",
            },
            'joseph-2': {
              text: "One day, far from their father, Joseph's brothers sold him to traders passing by on their way to Egypt. They told their father a wild animal had killed him, but in truth Joseph had been carried off as a slave.",
            },
            'joseph-3': {
              text: 'In Egypt, Joseph was sold as a servant, and even unjustly thrown into prison. But the Bible says the LORD was with Joseph: he gave him success in everything he did, even in the hardest moments.',
            },
            'joseph-4': {
              text: 'God gave Joseph the ability to explain the meaning of a dream Pharaoh had: seven years of plenty would come, followed by seven years of famine. Pharaoh put Joseph in charge of all Egypt to prepare the land.',
            },
            'joseph-5': {
              text: "When the famine came, Joseph's brothers traveled to Egypt to buy grain, not knowing that the governor standing before them was the very brother they had sold years earlier. Joseph recognized them, but they did not recognize him.",
            },
            'joseph-6': {
              text: 'Finally, Joseph revealed himself to his brothers. Even though they had hurt him deeply, he told them not to be distressed: God had sent him ahead of them to Egypt to preserve the lives of many people.',
            },
          },
          quiz: {
            'joseph-q1': {
              question: "What did Joseph's brothers do to him?",
              options: [
                'Sold him to traders',
                'Crowned him king',
                'Hid him in their house',
              ],
            },
            'joseph-q2': {
              question: 'Who was with Joseph in Egypt?',
              options: ['No one helped him', 'The LORD', 'Only Pharaoh'],
            },
            'joseph-q3': {
              question: 'What did Joseph tell his brothers in the end?',
              options: [
                'To leave forever',
                'Not to be distressed — God turned it for good',
                'That he would never forgive them',
              ],
            },
          },
        },
        moses: {
          title: 'Moses and the Exodus',
          subtitle: 'God sets his people free',
          refLabel: 'Exodus 2–14',
          teachContext:
            "The Exodus is God's great act of deliverance in the Old Testament: he brings Israel out of slavery in Egypt to become his people. It is also the story behind the Passover, which Jesus would later fulfill in an even greater way.",
          teachQuestions: [
            'Why do you think Moses was afraid when God called him?',
            "What does this story show you about God's power?",
            'In what ways does God "make a way" today for his people, even without parting a sea?',
          ],
          scenes: {
            'moses-1': {
              text: 'When Moses was born, Pharaoh had ordered every Hebrew baby boy to be killed. His mother hid him in a basket and set it afloat among the reeds of the Nile River, trusting that God would watch over her son.',
            },
            'moses-2': {
              text: 'As an adult, Moses was tending sheep in the desert when he saw something strange: a bush that was on fire but was not burning up. When he went closer to look, God called to him out of the fire and spoke to him.',
            },
            'moses-3': {
              text: 'God sent Moses to speak with Pharaoh of Egypt. Moses and his brother Aaron told him: "Thus says the LORD God of Israel: Let my people go." But Pharaoh refused, again and again.',
            },
            'moses-4': {
              text: 'Before the final plague, God gave Israel instructions to put blood on the doorposts of their houses: that blood would be the sign for death to pass over that night. That is how the Passover began.',
            },
            'moses-5': {
              text: 'Pharaoh finally let the people go, but then changed his mind and chased after them to the Red Sea. Moses stretched out his hand over the sea, and God opened a dry path through the middle of the waters.',
            },
            'moses-6': {
              text: 'Israel crossed the sea on dry ground, with the waters like a wall on each side. When the Egyptian army tried to follow, the waters returned to their place. The people saw the great power of God and trusted him.',
            },
          },
          quiz: {
            'moses-q1': {
              question: 'Where did they place baby Moses to keep him safe?',
              options: [
                'In a basket on the river',
                'In a palace',
                'In a hidden cave',
              ],
            },
            'moses-q2': {
              question: 'How did God appear to Moses?',
              options: [
                'In a dream',
                'In a bush that burned but was not consumed',
                'Inside a cloud of smoke',
              ],
            },
            'moses-q3': {
              question:
                'What happened to the sea when Moses stretched out his hand?',
              options: [
                'It split in two',
                'It froze solid',
                'It became deeper',
              ],
            },
          },
        },
        'david-goliath': {
          title: 'David and Goliath',
          subtitle: 'Faith defeats the giant',
          refLabel: '1 Samuel 17',
          teachContext:
            'David was still a young shepherd when he faced the Philistine giant Goliath. The story does not celebrate David\'s courage as a personal feat, but his trust that God would fight for Israel — the same trust a child can have today facing their own "giants."',
          teachQuestions: [
            "Why do you think no one else in Israel's army wanted to face Goliath?",
            "What was David trusting in so he wasn't afraid?",
            'What are the "giants" you face, and who can you trust the way David trusted God?',
          ],
          scenes: {
            'david-goliath-1': {
              text: "A Philistine giant named Goliath came out of the enemy camp and challenged Israel's army: he asked for someone to fight him one on one. Every soldier in Israel, including King Saul, was very afraid.",
            },
            'david-goliath-2': {
              text: "David was a young shepherd who cared for his father's sheep. When he arrived at the camp to bring food to his brothers, he heard Goliath's challenge and told how, as a shepherd, he had already rescued sheep from lions and bears.",
            },
            'david-goliath-3': {
              text: "David chose not to wear King Saul's heavy armor. Instead, he took his staff, his sling, and chose five smooth stones from a stream, placing them in his shepherd's bag. That is how he approached the Philistine.",
            },
            'david-goliath-4': {
              text: 'Goliath mocked David for being so young. But David answered him: "You come to me with sword and spear, but I come to you in the name of the LORD of hosts." David knew the battle belonged to God.',
            },
            'david-goliath-5': {
              text: 'David ran toward Goliath, took a stone from his bag, slung it, and struck the giant on the forehead. Goliath fell, and the whole Philistine army fled when they saw what God had done through David.',
            },
          },
          quiz: {
            'david-goliath-q1': {
              question:
                'How many smooth stones did David take from the stream?',
              options: ['Three', 'Five', 'Ten'],
            },
            'david-goliath-q2': {
              question: 'In whose name did David say he came to fight?',
              options: [
                'In his own strength',
                'In the name of the LORD of hosts',
                'In the name of King Saul',
              ],
            },
            'david-goliath-q3': {
              question: 'What did David use to defeat Goliath?',
              options: ['A sword', 'A sling and a stone', 'A bow and arrows'],
            },
          },
        },
        'daniel-lions': {
          title: "Daniel in the Lions' Den",
          subtitle: "Faithful even when it's dangerous",
          refLabel: 'Daniel 6',
          teachContext:
            'Daniel was a foreigner faithful to God who served in the government of Babylon. When an unjust law put him in danger for praying, Daniel did not stop — and God protected him in a way everyone could see, including the king.',
          teachQuestions: [
            'Why did Daniel keep praying even though he knew it was dangerous?',
            'What does it mean to be faithful to God even when it costs something?',
            "Have you ever had to choose between doing what's right and what's easy? What happened?",
          ],
          scenes: {
            'daniel-lions-1': {
              text: "Daniel was a man faithful to God who served as one of the king's highest officials in Babylon. His honesty and wisdom were so great that the king planned to put him in charge of the whole kingdom.",
            },
            'daniel-lions-2': {
              text: "Some men, jealous of Daniel, convinced the king to sign a law: for thirty days, no one could pray to anyone except the king, on penalty of being thrown into the lions' den. They knew Daniel prayed to God every day.",
            },
            'daniel-lions-3': {
              text: 'When Daniel learned of the new law, he kept praying to God three times a day, just as he always had, with the windows of his house open toward Jerusalem, without hiding or being afraid.',
            },
            'daniel-lions-4': {
              text: "The men who hated Daniel accused him before the king, and even though the king did not want to, the law had to be carried out. Daniel was taken and thrown into the lions' den that very night.",
            },
            'daniel-lions-5': {
              text: "The next morning, the king ran anxiously to the den and called out to Daniel. Daniel answered that his God had sent an angel who had shut the lions' mouths, and that he had not been harmed at all.",
            },
          },
          quiz: {
            'daniel-lions-q1': {
              question: 'How many times a day did Daniel pray?',
              options: ['Once', 'Three times', 'He never prayed out loud'],
            },
            'daniel-lions-q2': {
              question: 'Where was Daniel taken for continuing to pray?',
              options: [
                "To the lions' den",
                'To an ordinary prison',
                'Far away from the kingdom',
              ],
            },
            'daniel-lions-q3': {
              question: "Who shut the lions' mouths?",
              options: ['The king himself', "God's angel", 'The palace guards'],
            },
          },
        },
        jonah: {
          title: 'Jonah and the Great Fish',
          subtitle: "No one escapes God's love",
          refLabel: 'Jonah 1–3',
          teachContext:
            "God sent Jonah to preach to Nineveh, a city that was Israel's enemy, and Jonah tried to run the opposite way. The story shows both God's patience with Jonah and his compassion for an entire city that did not know him.",
          teachQuestions: [
            "Why do you think Jonah didn't want to go to Nineveh?",
            'What did Jonah learn inside the great fish?',
            'Have you ever tried to "run away" from something you knew God was asking you to do?',
          ],
          scenes: {
            'jonah-1': {
              text: 'God told Jonah to go to the city of Nineveh and preach against its wickedness. But Jonah did not want to go: he got up and boarded a ship heading the opposite direction, trying to flee from the presence of the LORD.',
            },
            'jonah-2': {
              text: 'While the ship was sailing, the LORD sent such a strong storm that the sailors feared the ship would sink. Jonah told them to pick him up and throw him into the sea, because he knew the storm was because of him.',
            },
            'jonah-3': {
              text: 'When they threw Jonah into the sea, the LORD had a great fish ready that swallowed him. Jonah was inside the fish for three days and three nights, and from there he cried out to God in prayer.',
            },
            'jonah-4': {
              text: 'Jonah prayed to the LORD his God from inside the fish, and God heard him. The fish vomited him out onto dry land, and God spoke to him again: "Get up and go to Nineveh, that great city, and proclaim to it the message I give you."',
            },
            'jonah-5': {
              text: 'This time Jonah obeyed and preached in Nineveh. Surprisingly, the people of the city believed God, turned away from their wickedness, and God, seeing their change, decided not to destroy the city.',
            },
          },
          quiz: {
            'jonah-q1': {
              question:
                'What did Jonah do when God asked him to go to Nineveh?',
              options: [
                'He obeyed right away',
                'He fled on a ship in the other direction',
                'He hid in his house',
              ],
            },
            'jonah-q2': {
              question: 'What did the LORD have ready for Jonah in the sea?',
              options: ['A great fish', 'A wooden raft', 'A nearby island'],
            },
            'jonah-q3': {
              question:
                "What did the people of Nineveh do when they heard Jonah's message?",
              options: [
                'They laughed at him',
                'They believed God and turned from their wickedness',
                'They drove Jonah out of the city',
              ],
            },
          },
        },
        'jesus-birth': {
          title: 'The Birth of Jesus',
          subtitle: 'God became one of us',
          refLabel: 'Luke 2:1-20',
          teachContext:
            "Luke tells the birth of Jesus with simple, humble details: a census, a manger, some shepherds. The contrast between the greatness of the angels' announcement and the poverty of the birthplace shows how God chose to come into the world.",
          teachQuestions: [
            'Why do you think Jesus was born in such a humble place as a manger?',
            'Why do you think the angels announced the news first to shepherds, rather than to kings or important leaders?',
            'How would you have felt if you had been one of the shepherds that night?',
          ],
          scenes: {
            'jesus-birth-1': {
              text: "A census required Joseph to travel with Mary, his wife, from Nazareth to Bethlehem, the city of David, because Joseph was from David's family. Mary was about to give birth when they arrived.",
            },
            'jesus-birth-2': {
              text: 'In Bethlehem, Mary gave birth to her firstborn son. She wrapped him in cloths and laid him in a manger, because there was no room for them at the inn. That is how Jesus was born, in the simplest of places.',
            },
            'jesus-birth-3': {
              text: 'That same night, some shepherds were watching their flocks in the fields when an angel appeared to them. "Do not be afraid," he said, "for unto you is born this day, in the city of David, a Savior, who is Christ the Lord."',
            },
            'jesus-birth-4': {
              text: 'The shepherds hurried to Bethlehem and found everything just as the angel had told them: Mary, Joseph, and the baby lying in the manger. They saw with their own eyes what God had announced.',
            },
            'jesus-birth-5': {
              text: 'After seeing the child, the shepherds told everyone what the angels had said about him. Then they went back to their fields, glorifying and praising God for all they had seen and heard.',
            },
          },
          quiz: {
            'jesus-birth-q1': {
              question: 'Where was Jesus born?',
              options: [
                'In a palace',
                'In a manger in Bethlehem',
                'Inside the temple',
              ],
            },
            'jesus-birth-q2': {
              question: 'Who announced the good news to the shepherds?',
              options: ['An angel', 'A king', 'An elderly prophet'],
            },
            'jesus-birth-q3': {
              question: 'What did the shepherds do after seeing the child?',
              options: [
                'They kept quiet about everything',
                'They went back glorifying and praising God',
                'They went home sad',
              ],
            },
          },
        },
        'good-samaritan': {
          title: 'The Good Samaritan',
          subtitle: 'Who is my neighbor?',
          refLabel: 'Luke 10:25-37',
          teachContext:
            'Jesus told this parable in answer to the question "who is my neighbor?" Samaritans and Jews did not get along in that time, so choosing a Samaritan as the hero of the story surprised those who heard it.',
          teachQuestions: [
            "Why do you think the priest and the Levite didn't help the injured man?",
            'Why was it surprising that the Samaritan was the one who helped?',
            'Who could be your "neighbor" today — someone who needs your help even if you don\'t know them well?',
          ],
          scenes: {
            'good-samaritan-1': {
              text: 'An expert in the law asked Jesus what he needed to do to love his neighbor, and then asked him, "And who is my neighbor?" Jesus answered by telling a story.',
            },
            'good-samaritan-2': {
              text: 'A man was going down the road from Jerusalem to Jericho when he fell into the hands of robbers. They stripped him of everything he had, beat him, and left him half dead beside the road.',
            },
            'good-samaritan-3': {
              text: 'A priest and then a Levite — two men who served at the temple — came down that same road. Both saw the injured man, but they passed by on the other side of the road without stopping to help.',
            },
            'good-samaritan-4': {
              text: 'Then a Samaritan came by — someone from a people who did not get along with the Jews. When he saw the injured man, he felt compassion: he came near, bandaged his wounds, and took care of him, even though he did not know him at all.',
            },
            'good-samaritan-5': {
              text: 'The Samaritan even paid to have the injured man cared for at an inn until he recovered. Jesus asked, "Which of these three was a neighbor?" And he said, "Go, and do likewise."',
            },
          },
          quiz: {
            'good-samaritan-q1': {
              question:
                'In the story, who passed by without helping the injured man?',
              options: [
                'A priest and a Levite',
                'Two Samaritans',
                'Two children from the village',
              ],
            },
            'good-samaritan-q2': {
              question: 'Who stopped to help the injured man?',
              options: ['A priest', 'A Samaritan', 'A Levite'],
            },
            'good-samaritan-q3': {
              question:
                'What did Jesus tell the man who had asked the question?',
              options: [
                'Go and do likewise',
                "Forget it, it doesn't matter",
                'Wait for someone else to help',
              ],
            },
          },
        },
        resurrection: {
          title: 'Jesus Is Alive!',
          subtitle: 'The tomb is empty',
          refLabel: 'Matthew 27:57–28:10',
          teachContext:
            "Jesus' resurrection is the center of the Christian faith: he did not remain in the tomb, but rose from the dead on the third day, just as he himself had said. This account is told soberly and faithfully to the text, without adding graphic details the text does not describe.",
          teachQuestions: [
            'Why do you think the women were the first to learn Jesus had risen?',
            'What does it mean to you that Jesus is alive today?',
            'Why did the angel tell the women to go tell the others?',
          ],
          scenes: {
            'resurrection-1': {
              text: "After dying on the cross, Jesus' body was wrapped and placed in a new tomb cut into rock. They sealed the entrance with a large stone, and his followers were left sad, not yet understanding what would come next.",
            },
            'resurrection-2': {
              text: 'At dawn on the first day of the week, two women who followed Jesus went to visit the tomb. They did not know what they would find, but they wanted to be near the place where they had left their Lord.',
            },
            'resurrection-3': {
              text: 'When they arrived, an angel appeared and said to them, "Do not be afraid, for I know that you seek Jesus, who was crucified. He is not here, for he has risen, just as he said." The tomb was empty.',
            },
            'resurrection-4': {
              text: 'The women left the tomb with fear and great joy at the same time, and ran to tell the disciples. On the way, Jesus himself met them and greeted them — he was truly alive!',
            },
            'resurrection-5': {
              text: 'Jesus told them, "Do not be afraid; go, tell my brothers the news." The women were the first to announce the most important news in history: Jesus had risen, just as he had promised.',
            },
          },
          quiz: {
            'resurrection-q1': {
              question: 'What did the angel tell the women at the tomb?',
              options: [
                'He is not here, he has risen',
                'Come back tomorrow',
                'You cannot come through here',
              ],
            },
            'resurrection-q2': {
              question: 'How did the women feel as they left the tomb?',
              options: [
                'With fear and great joy at once',
                'Angry',
                "They didn't feel anything special",
              ],
            },
            'resurrection-q3': {
              question: 'What did Jesus tell the women to do?',
              options: ['Hide', 'Go tell the disciples', 'Stay silent forever'],
            },
          },
        },
      },
    },
  },
};

export type Language = 'es' | 'en';
export type TranslationKeys = typeof translations.es;
