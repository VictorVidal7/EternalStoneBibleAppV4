# Eternal Stone Bible App

## Descripción del Proyecto

Eternal Stone Bible App es una aplicación móvil desarrollada con React Native que ofrece una experiencia interactiva y enriquecedora para la lectura y estudio de la Biblia. La aplicación incorpora una amplia gama de características diseñadas para facilitar la lectura diaria, el estudio en profundidad y la interacción personal con las Escrituras.

## Características Principales

1. **Lectura de la Biblia**

   - Múltiples versiones y traducciones disponibles
   - Navegación fluida entre libros, capítulos y versículos

2. **Planes de Lectura**

   - Planes personalizados con seguimiento de progreso
   - Notificaciones diarias para mantener la consistencia

3. **Sistema de Marcadores**

   - Guardado de versículos favoritos
   - Exportación e importación de marcadores

4. **Búsqueda Avanzada**

   - Búsqueda por palabras clave en toda la Biblia
   - Filtros por Antiguo y Nuevo Testamento

5. **Personalización de la Interfaz**

   - Modo oscuro para lectura nocturna
   - Ajustes de tamaño de fuente y tipo de letra

6. **Versículo del Día**

   - Muestra un versículo aleatorio diariamente

7. **Sistema de Notificaciones**
   - Recordatorios de lectura personalizables

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
