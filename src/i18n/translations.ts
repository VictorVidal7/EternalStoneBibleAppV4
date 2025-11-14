export const translations = {
  es: {
    // Common
    loading: 'Cargando...',
    error: 'Error',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    share: 'Compartir',
    copied: 'Copiado',
    ok: 'OK',

    // Tabs Navigation
    tabs: {
      home: 'Inicio',
      bible: 'Biblia',
      search: 'Buscar',
      achievements: 'Logros',
      bookmarks: 'Favoritos',
      notes: 'Notas',
      settings: 'Ajustes',
    },

    // Headers
    headers: {
      home: 'Eternal Bible',
      bible: 'La Biblia',
      search: 'Buscar en la Biblia',
      achievements: 'Mis Logros',
      bookmarks: 'Mis Favoritos',
      notes: 'Mis Notas',
      settings: 'Configuración',
    },

    // Home Screen
    home: {
      welcome: 'Bienvenido a Eternal Bible',
      subtitle: 'Que la Palabra de Dios ilumine tu día',
      dailyVerse: 'Versículo del Día',
      continueReading: 'Continuar Leyendo',
      readFullChapter: 'Leer Capítulo Completo',
      lastRead: 'Última lectura',
      readingPlans: 'Planes de Lectura',
      viewPlan: 'Ver Plan',
      continue: 'Continuar',
      plansDescription: 'Sigue un plan estructurado para leer la Biblia',
      quickAccess: 'Acceso Rápido',
      days: 'días',
      footerQuote: '"Tu palabra es verdad" - Juan 17:17',
      books: 'libros',
    },

    // Bible Screen
    bible: {
      title: 'Biblia',
      oldTestament: 'Antiguo Testamento',
      newTestament: 'Nuevo Testamento',
      chapters: 'capítulos',
      chapter: 'capítulo',
      selectBook: 'Selecciona un libro para comenzar',
      bookOf: 'Libro de',
      tapToView: 'Toca para ver los capítulos de',
      tapToRead: 'Toca para leer el capítulo',
      of: 'de',
    },

    // Search Screen
    search: {
      title: 'Buscar',
      placeholder: 'Buscar en la Biblia...',
      minChars: 'Escribe al menos 3 caracteres para buscar',
      noResults: 'No se encontraron resultados',
      tryDifferent: 'Intenta con otras palabras clave',
      results: 'resultados encontrados',
      initialTitle: 'Busca en toda la Biblia',
      initialSubtitle: 'Encuentra versículos por palabras clave',
      popularSearches: 'Búsquedas populares:',
      suggestions: ['amor', 'fe', 'esperanza', 'paz', 'salvación'],
      testament: {
        all: 'Todos',
        old: 'A. Testamento',
        new: 'N. Testamento',
      },
    },

    // Bookmarks Screen
    bookmarks: {
      title: 'Favoritos',
      empty: 'No tienes favoritos',
      emptyHint: 'Toca el ícono de estrella al leer versículos para guardarlos aquí',
      deleteTitle: 'Eliminar Favorito',
      deleteMessage: '¿Estás seguro de que quieres eliminar este favorito?',
    },

    // Notes Screen
    notes: {
      title: 'Notas',
      empty: 'No tienes notas',
      emptyHint: 'Agrega notas personales mientras lees la Biblia',
      deleteTitle: 'Eliminar Nota',
      deleteMessage: '¿Estás seguro de que quieres eliminar esta nota?',
      add: 'Agregar Nota',
      edit: 'Editar Nota',
      placeholder: 'Escribe tu nota aquí...',
      saved: 'Nota guardada',
    },

    // Settings Screen
    settings: {
      title: 'Configuración',
      appearance: 'Apariencia',
      theme: 'Tema',
      themeDescription: 'Elige el tema de la aplicación',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      themeAuto: 'Auto',

      bibleVersion: 'Versión de la Biblia',
      selectVersion: 'Selecciona tu versión',
      versionDescription: 'Elige la traducción de la Biblia que prefieres',
      comingSoon: 'Próximamente',

      language: 'Idioma',
      selectLanguage: 'Selecciona tu idioma',
      languageDescription: 'Cambia el idioma de la aplicación',

      data: 'Datos',
      resetData: 'Resetear Datos de la Biblia',
      resetDescription: 'Elimina y recarga todos los versículos',
      resetTitle: 'Resetear Datos',
      resetMessage: '¿Estás seguro de que quieres resetear todos los datos de la Biblia? La app se recargará automáticamente.',
      resetSuccess: 'Datos Reseteados',
      resetSuccessMessage: 'Por favor, cierra y vuelve a abrir la aplicación para recargar los datos.',
      resetting: 'Reseteando...',
      resetError: 'Error al resetear los datos.',

      about: 'Acerca de',
      version: 'Versión',
      description: 'Una aplicación de lectura de la Biblia diseñada para acercarte a la Palabra de Dios.',
      viewGitHub: 'Ver en GitHub',
      footerText: 'Hecho con ❤️ para la gloria de Dios',
      footerVerse: '"Toda la Escritura es inspirada por Dios"\n- 2 Timoteo 3:16',
    },

    // Verse Reading Screen
    verse: {
      addBookmark: 'Agregar a Favoritos',
      removeBookmark: 'Quitar de Favoritos',
      copyVerse: 'Copiar Versículo',
      shareVerse: 'Compartir Versículo',
      addNote: 'Agregar Nota',
      fontSize: 'Tamaño de Letra',
      verseCopied: 'Versículo copiado al portapapeles',
    },

    // Reading Plans
    readingPlans: {
      days: 'días',
      proverbs: {
        name: 'Proverbios - Un Mes',
        description: 'Lee un capítulo de Proverbios cada día durante un mes',
      },
      psalms: {
        name: 'Salmos Selectos',
        description: 'Los salmos más poderosos en 30 días',
      },
      gospels: {
        name: 'Los Evangelios',
        description: 'Conoce la vida de Jesús en 40 días',
      },
      newTestament: {
        name: 'Nuevo Testamento en 30 Días',
        description: 'Una introducción rápida al Nuevo Testamento',
      },
      genesis: {
        name: 'Génesis - Los Comienzos',
        description: 'Descubre cómo comenzó todo en 25 días',
      },
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
      readingStats: 'Has leído {{verses}} versículos en total.\nNivel {{level}} - {{points}} puntos\n\nSigue leyendo para desbloquear más logros!',
      testButton: 'Prueba los Logros',
      testDescription: 'Toca aquí para simular la lectura de 10 versículos y ver cómo funciona el sistema de logros',
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
      achievementsUnlocked: 'Desbloqueados',
      categories: {
        reading: 'Lectura',
        streak: 'Rachas',
        chapters: 'Capítulos',
        books: 'Libros',
        highlights: 'Destacados',
        notes: 'Notas',
        search: 'Búsqueda',
        special: 'Especiales',
      },
    },
  },

  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    copied: 'Copied',
    ok: 'OK',

    // Tabs Navigation
    tabs: {
      home: 'Home',
      bible: 'Bible',
      search: 'Search',
      achievements: 'Achievements',
      bookmarks: 'Bookmarks',
      notes: 'Notes',
      settings: 'Settings',
    },

    // Headers
    headers: {
      home: 'Eternal Bible',
      bible: 'The Bible',
      search: 'Search the Bible',
      achievements: 'My Achievements',
      bookmarks: 'My Bookmarks',
      notes: 'My Notes',
      settings: 'Settings',
    },

    // Home Screen
    home: {
      welcome: 'Welcome to Eternal Bible',
      subtitle: 'May God\'s Word illuminate your day',
      dailyVerse: 'Verse of the Day',
      continueReading: 'Continue Reading',
      readFullChapter: 'Read Full Chapter',
      lastRead: 'Last read',
      readingPlans: 'Reading Plans',
      viewPlan: 'View Plan',
      continue: 'Continue',
      plansDescription: 'Follow a structured plan to read the Bible',
      quickAccess: 'Quick Access',
      days: 'days',
      footerQuote: '"Your word is truth" - John 17:17',
      books: 'books',
    },

    // Bible Screen
    bible: {
      title: 'Bible',
      oldTestament: 'Old Testament',
      newTestament: 'New Testament',
      chapters: 'chapters',
      chapter: 'chapter',
      selectBook: 'Select a book to start',
      bookOf: 'Book of',
      tapToView: 'Tap to view chapters of',
      tapToRead: 'Tap to read chapter',
      of: 'of',
    },

    // Search Screen
    search: {
      title: 'Search',
      placeholder: 'Search the Bible...',
      minChars: 'Type at least 3 characters to search',
      noResults: 'No results found',
      tryDifferent: 'Try different keywords',
      results: 'results found',
      initialTitle: 'Search the entire Bible',
      initialSubtitle: 'Find verses by keywords',
      popularSearches: 'Popular searches:',
      suggestions: ['love', 'faith', 'hope', 'peace', 'salvation'],
      testament: {
        all: 'All',
        old: 'O. Testament',
        new: 'N. Testament',
      },
    },

    // Bookmarks Screen
    bookmarks: {
      title: 'Bookmarks',
      empty: 'No bookmarks yet',
      emptyHint: 'Tap the star icon while reading verses to save them here',
      deleteTitle: 'Delete Bookmark',
      deleteMessage: 'Are you sure you want to delete this bookmark?',
    },

    // Notes Screen
    notes: {
      title: 'Notes',
      empty: 'No notes yet',
      emptyHint: 'Add personal notes while reading the Bible',
      deleteTitle: 'Delete Note',
      deleteMessage: 'Are you sure you want to delete this note?',
      add: 'Add Note',
      edit: 'Edit Note',
      placeholder: 'Write your note here...',
      saved: 'Note saved',
    },

    // Settings Screen
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      theme: 'Theme',
      themeDescription: 'Choose the app theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeAuto: 'Auto',

      bibleVersion: 'Bible Version',
      selectVersion: 'Select your version',
      versionDescription: 'Choose your preferred Bible translation',
      comingSoon: 'Coming Soon',

      language: 'Language',
      selectLanguage: 'Select your language',
      languageDescription: 'Change the app language',

      data: 'Data',
      resetData: 'Reset Bible Data',
      resetDescription: 'Delete and reload all verses',
      resetTitle: 'Reset Data',
      resetMessage: 'Are you sure you want to reset all Bible data? The app will reload automatically.',
      resetSuccess: 'Data Reset',
      resetSuccessMessage: 'Please close and reopen the app to reload the data.',
      resetting: 'Resetting...',
      resetError: 'Error resetting data.',

      about: 'About',
      version: 'Version',
      description: 'A Bible reading app designed to bring you closer to God\'s Word.',
      viewGitHub: 'View on GitHub',
      footerText: 'Made with ❤️ for the glory of God',
      footerVerse: '"All Scripture is God-breathed"\n- 2 Timothy 3:16',
    },

    // Verse Reading Screen
    verse: {
      addBookmark: 'Add Bookmark',
      removeBookmark: 'Remove Bookmark',
      copyVerse: 'Copy Verse',
      shareVerse: 'Share Verse',
      addNote: 'Add Note',
      fontSize: 'Font Size',
      verseCopied: 'Verse copied to clipboard',
    },

    // Reading Plans
    readingPlans: {
      days: 'days',
      proverbs: {
        name: 'Proverbs - One Month',
        description: 'Read one chapter of Proverbs each day for a month',
      },
      psalms: {
        name: 'Selected Psalms',
        description: 'The most powerful psalms in 30 days',
      },
      gospels: {
        name: 'The Gospels',
        description: 'Discover the life of Jesus in 40 days',
      },
      newTestament: {
        name: 'New Testament in 30 Days',
        description: 'A quick introduction to the New Testament',
      },
      genesis: {
        name: 'Genesis - The Beginnings',
        description: 'Discover how it all began in 25 days',
      },
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
      readingStats: 'You have read {{verses}} verses in total.\nLevel {{level}} - {{points}} points\n\nKeep reading to unlock more achievements!',
      testButton: 'Try Achievements',
      testDescription: 'Tap here to simulate reading 10 verses and see how the achievement system works',
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
      achievementsUnlocked: 'Unlocked',
      categories: {
        reading: 'Reading',
        streak: 'Streaks',
        chapters: 'Chapters',
        books: 'Books',
        highlights: 'Highlights',
        notes: 'Notes',
        search: 'Search',
        special: 'Special',
      },
    },
  },
};

export type Language = 'es' | 'en';
export type TranslationKeys = typeof translations.es;
