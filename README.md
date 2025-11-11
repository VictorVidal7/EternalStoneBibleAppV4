# 📖 Eternal Stone Bible App V4

<div align="center">

**Una experiencia bíblica moderna, interactiva y gamificada** 🚀

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-FTS5-green.svg)](https://www.sqlite.org/)

</div>

---

## 🌟 Descripción del Proyecto

**Eternal Stone Bible App** es una aplicación móvil de última generación desarrollada con **React Native + Expo** que ofrece una experiencia **interactiva, gamificada y profundamente enriquecedora** para la lectura y estudio de la Biblia.

Con **31,102 versículos completos** (RVR1960), **sistema de logros**, **resaltados inteligentes**, **analíticas avanzadas** y una **interfaz moderna**, esta aplicación transforma la lectura bíblica en una experiencia memorable.

---

## ✨ Características Principales

### 📚 Lectura y Navegación

- ✅ **Biblia completa** (Reina Valera 1960 - 31,102 versículos)
- ✅ **Navegación fluida** entre 66 libros, 1,189 capítulos
- ✅ **Búsqueda full-text** con FTS5 (ultra rápida)
- ✅ **Modo lectura sin distracciones**
- ✅ **Continuar donde lo dejaste**

### 🎨 Sistema de Resaltado Inteligente ⭐ **NUEVO**

- 🎨 **8 colores predefinidos** para destacar versículos
- 📑 **8 categorías temáticas**: Promesa, Oración, Mandamiento, Sabiduría, Profecía, Favorito, Memorizar, Estudio
- 📝 **Notas personalizadas** en cada resaltado
- 📊 **Estadísticas** por color y categoría
- 💾 **Exportar/Importar** en formato JSON

### 🏆 Sistema de Logros y Gamificación ⭐ **NUEVO**

- 🎖️ **47+ logros únicos** en 8 categorías
- 🥇 **5 niveles de dificultad**: Bronze, Silver, Gold, Platinum, Diamond
- 📈 **10 niveles de usuario**: Desde Aprendiz (🌱) hasta Leyenda (👑)
- 🔥 **Sistema de rachas** de lectura diaria
- 🎉 **Animaciones celebratorias** al desbloquear logros
- 📊 **Estadísticas completas** de progreso

### 📊 Analíticas Avanzadas ⭐ **NUEVO**

- 📈 **Heatmap de lectura** (365 días de historial)
- ⏰ **Horarios pico** de lectura
- 📚 **Libros favoritos** con estadísticas
- 📉 **Insights detallados** por período (diario, semanal, mensual)
- 🎯 **Progreso por testamento** (AT/NT)
- 💾 **Exportación completa** de datos

### ⚡ Optimización de Rendimiento ⭐ **NUEVO**

- 🚀 **Sistema de caché dual** (memoria + disco)
- 🔧 **Utilidades de performance** (debounce, throttle, memoize, etc.)
- 📊 **Monitoreo de rendimiento** integrado
- 💪 **Cola de ejecución** con control de concurrencia

### 🔖 Funcionalidades Clásicas Mejoradas

- 📍 **Marcadores** con sincronización
- 📝 **Notas personales** por versículo
- 📅 **5 planes de lectura** estructurados
- 🌙 **Modo oscuro** + Modo claro + Auto
- 🌐 **Soporte multiidioma** (preparado)
- 📱 **Responsive** y adaptable

---

## 🎯 Lo Que Hace Única Esta App

1. **Gamificación Completa** 🎮
   - Sistema de puntos, niveles y logros
   - Motivación constante para leer más
   - Feedback visual inmediato

2. **Resaltados Inteligentes** 🎨
   - Organiza por colores y categorías
   - Agrega notas contextuales
   - Exporta para backup

3. **Analíticas Profundas** 📊
   - Entiende tus hábitos de lectura
   - Visualiza tu progreso
   - Descubre patrones temporales

4. **Rendimiento Superior** ⚡
   - Caché inteligente
   - Búsquedas instantáneas
   - Carga ultra rápida

5. **UI/UX Moderna** 🎨
   - Animaciones fluidas
   - Diseño Material 3
   - Componentes personalizados

## Requisitos del Sistema

- Node.js (versión 14 o superior)
- Yarn (versión 1.22 o superior)
- React Native CLI
- Xcode (para desarrollo en iOS)
- Android Studio (para desarrollo en Android)

## Instalación

1. Clone el repositorio:

   ```
   git clone https://github.com/tu-usuario/eternal-stone-bible-app.git
   ```

2. Navegue al directorio del proyecto:

   ```
   cd eternal-stone-bible-app
   ```

3. Instale las dependencias:

   ```
   yarn install
   ```

4. Para iOS, instale los pods:
   ```
   cd ios && pod install && cd ..
   ```

## Ejecución

1. Para iniciar el servidor de Metro:

   ```
   yarn start
   ```

2. Para ejecutar en iOS:

   ```
   yarn ios
   ```

3. Para ejecutar en Android:
   ```
   yarn android
   ```

## Pruebas

El proyecto utiliza Jest para las pruebas unitarias y de integración. Para ejecutar las pruebas:

```
yarn test
```

Para ver la cobertura de las pruebas:

```
yarn test --coverage
```

## Estructura del Proyecto

```
EternalStoneBibleApp/
├── android/                    # Configuración para Android
├── ios/                        # Configuración para iOS
├── node_modules/               # Dependencias del proyecto
├── src/
│   ├── components/             # Componentes reutilizables
│   ├── context/                # Contextos de React
│   ├── data/                   # Datos estáticos y configuraciones
│   ├── hooks/                  # Hooks personalizados
│   ├── navigation/             # Configuración de navegación
│   ├── screens/                # Componentes de pantalla
│   ├── services/               # Servicios y APIs
│   ├── styles/                 # Estilos globales
│   └── utils/                  # Utilidades y helpers
├── __tests__/                  # Pruebas
├── .gitignore
├── App.js                      # Componente raíz
├── app.json
├── babel.config.js
├── index.js
├── metro.config.js
├── package.json
└── README.md
```

## Dependencias Principales

- React Native: ^0.74.3
- @react-navigation/native: ^6.1.17
- @react-navigation/stack: ^6.4.0
- react-native-gesture-handler: ^2.17.1
- react-native-reanimated: ^3.7.2
- react-native-safe-area-context: ^4.10.7
- react-native-screens: ^3.32.0
- react-native-vector-icons: ^10.1.0
- @react-native-async-storage/async-storage: ^1.23.1
- react-native-push-notification: ^8.1.1

## Contribución

Si deseas contribuir al proyecto, por favor:

1. Haz un fork del repositorio
2. Crea una nueva rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## Contacto

Tu Nombre - tu.email@ejemplo.com

Link del Proyecto: [https://github.com/tu-usuario/eternal-stone-bible-app](https://github.com/tu-usuario/eternal-stone-bible-app)
