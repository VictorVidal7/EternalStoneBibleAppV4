# 📖 EternalStone Bible App V4

<div align="center">

![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-~54.0-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Una aplicación bíblica moderna y completa con gamificación, analíticas avanzadas y rendimiento optimizado**

[Características](#-características-principales) • [Instalación](#-instalación) • [Arquitectura](#-arquitectura) • [Desarrollo](#-desarrollo) • [Contribuir](#-contribuir)

</div>

---

## ✨ Características Principales

### 📚 Contenido Bíblico Completo

- ✅ **31,102 versículos** de la Biblia RVR1960 (100% completa y verificada)
- ✅ **66 libros** (39 Antiguo Testamento + 27 Nuevo Testamento)
- ✅ **1,189 capítulos** totalmente indexados
- ✅ Búsqueda FTS5 ultra-rápida con SQLite
- ✅ Navegación fluida entre libros, capítulos y versículos

### 🎮 Sistema de Gamificación

- 🏆 **47+ logros únicos** en 8 categorías
- 📊 Sistema de **10 niveles** (Aprendiz → Leyenda)
- 🔥 **Rachas de lectura** diaria con seguimiento
- 📈 Puntos y progreso en tiempo real
- 🎉 Animaciones celebratorias al desbloquear logros

### 🎨 Experiencia de Usuario Mejorada (V4)

- 🌓 **3 modos de tema**: Claro, Oscuro, Automático
- 📱 Diseño **responsive** para móviles y tablets
- ⚡ Rendimiento optimizado con **FlashList** (60% más rápido)
- 💀 **Skeleton screens** para estados de carga profesionales
- ♿ Soporte completo de **accesibilidad** (VoiceOver/TalkBack)
- 🛡️ **ErrorBoundary** para manejo robusto de errores
- 🔥 **Sentry** integrado para crash reporting

### 🖍️ Sistema de Resaltado Inteligente

- 🎨 **8 colores** predefinidos (Amarillo, Verde, Azul, Morado, Rosa, Naranja, Rojo, Gris)
- 🏷️ **8 categorías temáticas** (Promesa, Oración, Mandamiento, Sabiduría, Profecía, Favorito, Memorizar, Estudio)
- 📝 Notas personalizadas por resaltado
- 📊 Estadísticas por color y categoría
- 💾 Exportar/Importar en JSON

### 📊 Analíticas Avanzadas

- 📅 **Heatmap de lectura** (365 días)
- 🕐 Análisis de **horarios pico** de lectura
- 📖 **Libros favoritos** con estadísticas
- 📈 Progreso por testamento (AT/NT)
- ⏱️ Seguimiento de **sesiones de lectura**
- 📊 Exportación completa de datos

### 🔧 Tecnología de Vanguardia (V4)

- ⚛️ **React Native 0.81.5** con React 19.1.0
- 🧭 **Expo Router v6** (file-based routing)
- 🔷 **TypeScript 5.9.2** con strict mode
- 🗄️ **SQLite 16** con FTS5 para búsqueda
- 📦 **Zustand 5.0.8** para estado global ligero
- ✅ **Zod** para validación type-safe
- 🔥 **Sentry** para crash reporting y monitoreo
- 🚀 **FlashList** de Shopify para listas ultra-rápidas

---

## 🚀 Instalación

### Prerrequisitos

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/VictorVidal7/EternalStoneBibleAppV4.git
cd EternalStoneBibleAppV4

# 2. Instalar dependencias
npm install

# 3. Iniciar en desarrollo
npm start

# 4. Ejecutar en plataforma específica
npm run android  # Android
npm run ios      # iOS (requiere macOS)
npm run web      # Web
```

---

## 🏗️ Arquitectura

### Estructura del Proyecto (Actualizada V4)

```
EternalStoneBibleAppV4/
│
├── app/                          # Expo Router (navegación file-based)
│   ├── _layout.tsx              # Layout raíz con providers
│   ├── (tabs)/                  # Navegación por pestañas
│   │   ├── index.tsx            # 🏠 Inicio
│   │   ├── bible.tsx            # 📖 Lista de libros
│   │   ├── search.tsx           # 🔍 Búsqueda
│   │   ├── achievements.tsx     # 🏆 Logros
│   │   ├── bookmarks.tsx        # ⭐ Favoritos
│   │   ├── notes.tsx            # 📝 Notas
│   │   └── settings.tsx         # ⚙️ Configuración
│   └── verse/[book]/            # Rutas dinámicas
│
├── src/
│   ├── components/              # Componentes reutilizables
│   │   ├── CustomButton.tsx     # ✅ NUEVO: Botón mejorado (TS)
│   │   ├── SkeletonLoader.tsx   # ✅ NUEVO: Loading states (TS)
│   │   ├── ErrorBoundary.tsx    # ✅ NUEVO: Manejo de errores (TS)
│   │   ├── CustomIcon.js
│   │   ├── CustomIconButton.js
│   │   ├── NoteModal.js
│   │   ├── DistractionFreeMode.js
│   │   ├── DailyVerse.js
│   │   └── AchievementNotifications.tsx
│   │
│   ├── screens/                 # Pantallas principales
│   │   ├── BibleListScreen.tsx  # ✅ MIGRADO: TS + FlashList
│   │   ├── ChapterScreen.tsx    # ✅ MIGRADO: TS + FlashList
│   │   ├── HomeScreen.js
│   │   ├── SearchScreen.js
│   │   ├── VerseScreen.js
│   │   ├── BookmarksScreen.js
│   │   ├── NotesScreen.js
│   │   ├── SettingsScreen.js
│   │   ├── ReadingPlanScreen.js
│   │   └── AchievementsScreen.tsx
│   │
│   ├── lib/                     # Lógica de negocio
│   │   ├── database/            # 🗄️ SQLite + FTS5
│   │   │   ├── index.ts         # BibleDatabase class (544 líneas)
│   │   │   ├── schema.ts        # Esquema de DB
│   │   │   └── data-loader.ts   # Carga de 31,096 versículos
│   │   │
│   │   ├── validation/          # ✅ NUEVO: Validación con Zod
│   │   │   └── schemas.ts       # Schemas type-safe para toda la app
│   │   │
│   │   ├── monitoring/          # ✅ NUEVO: Crash reporting
│   │   │   └── sentry.ts        # Configuración completa de Sentry
│   │   │
│   │   ├── highlights/          # Sistema de resaltado
│   │   │   ├── index.ts
│   │   │   └── HighlightService.ts
│   │   │
│   │   ├── achievements/        # Sistema de logros (47+ logros)
│   │   │   ├── types.ts
│   │   │   ├── definitions.ts
│   │   │   └── AchievementService.ts
│   │   │
│   │   ├── analytics/           # Analíticas avanzadas
│   │   │   └── AdvancedAnalytics.ts
│   │   │
│   │   └── performance/         # Optimización
│   │       ├── CacheManager.ts
│   │       └── PerformanceOptimizer.ts
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useTheme.tsx         # ✅ TypeScript
│   │   ├── useLanguage.tsx      # ✅ TypeScript
│   │   ├── useBibleVersion.tsx  # ✅ TypeScript
│   │   ├── useHighlights.tsx    # ✅ TypeScript
│   │   ├── useAchievements.tsx  # ✅ TypeScript
│   │   ├── useStyles.js
│   │   └── useScreenReaderListener.js
│   │
│   ├── context/                 # React Context (7 contextos)
│   │   ├── ServicesContext.tsx
│   │   ├── ThemeContext.js
│   │   ├── UserPreferencesContext.js
│   │   ├── BookmarksContext.js
│   │   ├── NotesContext.js
│   │   ├── ReadingPlanContext.js
│   │   └── ReadingProgressContext.js
│   │
│   ├── data/                    # Datos estáticos
│   │   ├── bible_books/         # 66 archivos JSON (RVR1960)
│   │   ├── bibleBooks.json      # ✅ Índice completo de libros
│   │   ├── bibleChapters.json   # ✅ 66 libros con capítulos
│   │   └── readingPlans.js
│   │
│   └── types/                   # Definiciones TypeScript
│       ├── bible.ts
│       └── common.js
│
├── scripts/                     # Scripts de utilidad
│   ├── analyze-bible-integrity.js  # ✅ Validador de integridad
│   └── reset-bible-data.sh
│
└── __tests__/                   # Tests (Jest)
```

### Stack Tecnológico (V4)

| Tecnología               | Versión | Propósito                           |
| ------------------------ | ------- | ----------------------------------- |
| **React Native**         | 0.81.5  | Framework móvil                     |
| **React**                | 19.1.0  | Biblioteca UI                       |
| **Expo**                 | ~54.0   | Toolchain y SDK                     |
| **TypeScript**           | 5.9.2   | Type safety                         |
| **Expo Router**          | 6.0.14  | Navegación file-based               |
| **SQLite**               | 16.0.9  | Base de datos local con FTS5        |
| **Zustand**              | 5.0.8   | Estado global ligero                |
| **Zod**                  | latest  | Validación de datos type-safe       |
| **@shopify/flash-list**  | latest  | Listas optimizadas (60% más rápido) |
| **@sentry/react-native** | latest  | Error tracking y monitoring         |
| **AsyncStorage**         | 2.2.0   | Persistencia local                  |
| **Expo Haptics**         | 15.0.7  | Feedback háptico                    |
| **use-debounce**         | 10.0.0  | Debouncing optimizado               |

---

## 🎯 Mejoras Implementadas en V4

### ✅ Migración a TypeScript

- ✅ Componentes críticos migrados (CustomButton, SkeletonLoader, ErrorBoundary)
- ✅ Pantallas principales (BibleListScreen, ChapterScreen)
- ✅ Schemas de validación comprehensivos con Zod
- ✅ Interfaces y tipos exhaustivos
- ✅ Strict mode habilitado

### ⚡ Optimizaciones de Performance

- ✅ **FlashList** implementado en pantallas principales (60% más rápido que FlatList)
- ✅ **Skeleton screens** en todas las pantallas de lista
- ✅ Memoización agresiva con React.memo
- ✅ Virtualización optimizada de listas
- ✅ Estimación de tamaños de items para mejor rendimiento

### 🛡️ Mejoras de Calidad y Robustez

- ✅ **ErrorBoundary** para captura de errores en React
- ✅ **Sentry** configurado y listo para producción
- ✅ **Zod** para validación type-safe de datos críticos
- ✅ Logging mejorado con breadcrumbs para debugging
- ✅ Manejo unificado de errores

### 🎨 Mejoras de UX

- ✅ Skeleton loaders profesionales en todas las pantallas
- ✅ Feedback háptico consistente con Expo Haptics
- ✅ Animaciones suaves y fluidas
- ✅ Accesibilidad mejorada (accessibilityLabel, accessibilityHint)
- ✅ Estados de loading y error bien definidos

### 📚 Documentación

- ✅ README completo y actualizado con V4
- ✅ JSDoc/TSDoc en funciones clave
- ✅ Comentarios descriptivos en código
- ✅ Guía de contribución actualizada

---

## 🧪 Testing

### Ejecutar tests

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm test -- --coverage

# Tests en watch mode
npm test -- --watch
```

### Validar integridad de datos bíblicos

```bash
node scripts/analyze-bible-integrity.js
```

**Resultado esperado (V4):**

```
✅ ¡EXCELENTE! La Biblia RVR1960 está 100% correcta.
✅ No se encontraron errores ni advertencias.
📊 Total de libros analizados: 66/66
📊 Total de capítulos: 1,189
📊 Total de versículos: 31,102
📊 Libros perfectos: 66
```

---

## 📊 Estadísticas del Proyecto (V4)

| Métrica                  | Valor                     |
| ------------------------ | ------------------------- |
| **Versículos**           | 31,102 ✅ (100% completa) |
| **Libros**               | 66 ✅                     |
| **Capítulos**            | 1,189 ✅                  |
| **Logros**               | 47+ 🏆                    |
| **Líneas de código**     | ~18,000+                  |
| **Componentes**          | 25+                       |
| **Pantallas**            | 10+                       |
| **Hooks personalizados** | 7+                        |
| **Servicios**            | 10+                       |
| **Cobertura TypeScript** | ~40% (en crecimiento)     |

---

## 🔧 Configuración

### Configurar Sentry (Opcional)

Para habilitar crash reporting en producción:

1. Crea una cuenta en [sentry.io](https://sentry.io)
2. Obtén tu DSN del proyecto
3. Configura en `app.config.js`:

```javascript
export default {
  expo: {
    extra: {
      sentryDsn: 'tu-sentry-dsn-aqui',
    },
  },
};
```

4. Reinicia la aplicación

El sistema detectará automáticamente el DSN y habilitará Sentry en producción.

---

## 📱 Funcionalidades Detalladas

### Sistema de Logros

**10 Niveles de Usuario:**

| Nivel | Nombre     | Puntos Requeridos | Emoji |
| ----- | ---------- | ----------------- | ----- |
| 1     | Aprendiz   | 0-100             | 🌱    |
| 2     | Lector     | 100-250           | 📖    |
| 3     | Estudiante | 250-500           | 📚    |
| 4     | Discípulo  | 500-1,000         | ✝️    |
| 5     | Maestro    | 1,000-2,000       | 👨‍🏫    |
| 6     | Erudito    | 2,000-4,000       | 🎓    |
| 7     | Sabio      | 4,000-8,000       | 🧙    |
| 8     | Profeta    | 8,000-15,000      | 🔮    |
| 9     | Apóstol    | 15,000-30,000     | ⚡    |
| 10    | Leyenda    | 30,000+           | 👑    |

**Categorías de Logros:**

- 📖 **Lectura**: Basados en versículos leídos
- 🔥 **Rachas**: Días consecutivos de lectura
- 📚 **Capítulos**: Capítulos completados
- 🎯 **Libros**: Libros completados
- 🖍️ **Destacados**: Resaltados creados
- 📝 **Notas**: Notas escritas
- 🔍 **Búsquedas**: Búsquedas realizadas
- ⭐ **Especiales**: Madrugador, Búho Nocturno, etc.

### Sistema de Resaltado

**Colores Disponibles:**

```
🟡 Amarillo  🟢 Verde  🔵 Azul  🟣 Morado
🌸 Rosa  🟠 Naranja  🔴 Rojo  ⚪ Gris
```

**Categorías:**

```
🤝 Promesa      🙏 Oración      📜 Mandamiento  💡 Sabiduría
🔮 Profecía     ⭐ Favorito     🧠 Memorizar    📖 Estudio
```

---

## 🤝 Contribuir

### Guía de Contribución

1. **Fork** el proyecto
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Estándares de Código (V4)

- ✅ Usar **TypeScript** para todos los nuevos archivos
- ✅ Seguir **ESLint** y **Prettier** configurados
- ✅ Añadir **JSDoc/TSDoc** a funciones públicas
- ✅ Escribir **tests** para nuevas funcionalidades
- ✅ Usar **Zod** para validación de datos
- ✅ Implementar **skeleton screens** en pantallas con loading
- ✅ Agregar **breadcrumbs** de Sentry para tracking

---

## 📝 Roadmap

### ✅ Completado (V4.0)

- ✅ Migración parcial a TypeScript
- ✅ FlashList para performance
- ✅ Skeleton screens profesionales
- ✅ Sentry integration completa
- ✅ Zod validation
- ✅ Error boundaries
- ✅ README actualizado
- ✅ Datos bíblicos 100% completos y verificados

### 🚧 En Progreso (V4.1)

- 🚧 Completar migración a TypeScript (100%)
- 🚧 Tests unitarios comprehensivos
- 🚧 Tests E2E con Detox
- 🚧 CI/CD con GitHub Actions

### 📋 Planificado (V4.2+)

- ☁️ Sincronización en la nube (Firebase/Supabase)
- 🌍 Múltiples versiones de la Biblia (NVI, NTV, KJV, etc.)
- 🔊 Audio de la Biblia
- 🎨 Temas personalizables por usuario
- 📱 Widgets para home screen
- 🌐 Modo offline completo mejorado
- 🔐 Autenticación de usuarios
- 👥 Compartir planes de lectura con amigos
- 📊 Comparación de progreso con comunidad

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👨‍💻 Autor

**Victor Vidal**

- GitHub: [@VictorVidal7](https://github.com/VictorVidal7)
- Proyecto: [EternalStoneBibleAppV4](https://github.com/VictorVidal7/EternalStoneBibleAppV4)

---

## 🙏 Agradecimientos

- 📖 Biblia Reina-Valera 1960 (RVR1960)
- ⚛️ Equipo de React Native y Expo
- 🛠️ Shopify por FlashList
- 🔥 Sentry por herramientas de monitoreo
- ✅ Colin McDonnell por Zod
- 🎨 Comunidad open source

---

## 📞 Soporte

¿Tienes preguntas o problemas?

- 🐛 Issues: [GitHub Issues](https://github.com/VictorVidal7/EternalStoneBibleAppV4/issues)
- 💬 Discusiones: [GitHub Discussions](https://github.com/VictorVidal7/EternalStoneBibleAppV4/discussions)

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub ⭐**

**Versión 4.0** - Mejorando la experiencia bíblica con tecnología moderna

Hecho con ❤️ y ☕

</div>
