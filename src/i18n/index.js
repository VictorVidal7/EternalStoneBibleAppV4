import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as Localization from 'expo-localization';

// Traducciones
const resources = {
  es: {
    translation: {
      // Navegación
      Inicio: 'Inicio',
      Biblia: 'Biblia',
      Favoritos: 'Favoritos',
      Plan: 'Plan',
      Notas: 'Notas',
      Buscar: 'Buscar',
      Ajustes: 'Ajustes',

      // Iconos de navegación
      'Icono de Inicio': 'Icono de Inicio',
      'Icono de Biblia': 'Icono de Biblia',
      'Icono de Favoritos': 'Icono de Favoritos',
      'Icono de Plan': 'Icono de Plan',
      'Icono de Notas': 'Icono de Notas',
      'Icono de Buscar': 'Icono de Buscar',
      'Icono de Ajustes': 'Icono de Ajustes',

      // Navegación hints
      'Navegar a Inicio': 'Navegar a Inicio',
      'Navegar a Biblia': 'Navegar a Biblia',
      'Navegar a Favoritos': 'Navegar a Favoritos',
      'Navegar a Plan': 'Navegar a Plan',
      'Navegar a Notas': 'Navegar a Notas',
      'Navegar a Buscar': 'Navegar a Buscar',
      'Navegar a Ajustes': 'Navegar a Ajustes',

      // Audio Bible
      Escuchar: 'Escuchar',
      Pausar: 'Pausar',
      Reproduciendo: 'Reproduciendo',
      Versículo: 'Versículo',
      Capítulo: 'Capítulo',
      Velocidad: 'Velocidad',
      Voz: 'Voz',
      'Temporizador de sueño': 'Temporizador de sueño',
      minutos: 'minutos',
      'Fin del capítulo': 'Fin del capítulo',

      // General
      Cargando: 'Cargando',
      Error: 'Error',
      Guardar: 'Guardar',
      Cancelar: 'Cancelar',
      Aceptar: 'Aceptar',
    },
  },
  en: {
    translation: {
      // Navigation
      Inicio: 'Home',
      Biblia: 'Bible',
      Favoritos: 'Favorites',
      Plan: 'Plan',
      Notas: 'Notes',
      Buscar: 'Search',
      Ajustes: 'Settings',

      // Navigation icons
      'Icono de Inicio': 'Home icon',
      'Icono de Biblia': 'Bible icon',
      'Icono de Favoritos': 'Favorites icon',
      'Icono de Plan': 'Plan icon',
      'Icono de Notas': 'Notes icon',
      'Icono de Buscar': 'Search icon',
      'Icono de Ajustes': 'Settings icon',

      // Navigation hints
      'Navegar a Inicio': 'Navigate to Home',
      'Navegar a Biblia': 'Navigate to Bible',
      'Navegar a Favoritos': 'Navigate to Favorites',
      'Navegar a Plan': 'Navigate to Plan',
      'Navegar a Notas': 'Navigate to Notes',
      'Navegar a Buscar': 'Navigate to Search',
      'Navegar a Ajustes': 'Navigate to Settings',

      // Audio Bible
      Escuchar: 'Listen',
      Pausar: 'Pause',
      Reproduciendo: 'Playing',
      Versículo: 'Verse',
      Capítulo: 'Chapter',
      Velocidad: 'Speed',
      Voz: 'Voice',
      'Temporizador de sueño': 'Sleep Timer',
      minutos: 'minutes',
      'Fin del capítulo': 'End of chapter',

      // General
      Cargando: 'Loading',
      Error: 'Error',
      Guardar: 'Save',
      Cancelar: 'Cancel',
      Aceptar: 'Accept',
    },
  },
};

// Detectar idioma del dispositivo
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'es';
const defaultLanguage = deviceLanguage.startsWith('en') ? 'en' : 'es';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'es',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
