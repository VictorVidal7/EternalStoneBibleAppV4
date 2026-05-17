# 📱 Cómo Probar la App - Eternal Bible

## ✅ SERVIDOR CORRIENDO

El Metro Bundler está activo en **http://localhost:8081**

---

## 🚀 OPCIONES PARA PROBAR LA APP

### Opción 1: Usar el Script Helper (RECOMENDADO)

```bash
# Iniciar el servidor
./start-dev.sh

# O con limpieza de caché
./start-dev.sh --clear
```

### Opción 2: Comando Manual

```bash
EXPO_OFFLINE=1 npm start -- --offline
```

---

## 📱 ABRIR LA APP

Una vez que el servidor esté corriendo, tienes 3 opciones:

### A) **Android** (si tienes emulador o dispositivo)

Presiona **`a`** en la terminal donde corre Expo

### B) **iOS** (si tienes simulador o dispositivo)

Presiona **`i`** en la terminal donde corre Expo

### C) **Web** (navegador)

Presiona **`w`** en la terminal donde corre Expo

### D) **Expo Go** (app en tu teléfono)

1. Instala "Expo Go" desde Play Store o App Store
2. Abre Expo Go
3. Escanea el QR que aparece en tu terminal
   - O ingresa manualmente la URL que aparece

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Si el servidor no inicia:

```bash
# 1. Matar procesos previos
pkill -9 -f "expo|metro"

# 2. Limpiar caché
rm -rf node_modules/.cache .expo metro-cache

# 3. Reiniciar
./start-dev.sh
```

### Si ves "Access denied":

Esto ya está solucionado con el modo offline (`--offline`). El script `start-dev.sh` ya lo incluye.

### Si ves errores de módulos faltantes:

```bash
npm install
./start-dev.sh
```

---

## 🎨 CAMBIOS VISUALES IMPLEMENTADOS

Al abrir la app verás:

✅ **HomeScreen**

- Gradiente azul moderno (#4A90E2 → #6EADFF)
- Botón "Continue Reading" verde (#34C759)
- Cards sin bordes duros con sombras profesionales
- Background mejorado

✅ **ChapterSelection**

- Gradiente azul consistente
- Textos con sombras para mejor legibilidad
- Títulos más grandes y visibles

✅ **Daily Verse Card**

- Estilo profesional sin dobles marcos
- Sombras mejoradas

✅ **Modo Oscuro**

- Gradientes azul oscuro (#1E3A5F → #3A5C87)
- Cards con background #2A2A3E
- Sombras adaptativas

---

## 📊 ESTADO ACTUAL

```
✅ Servidor: Metro Bundler corriendo en localhost:8081
✅ Modo: Offline (sin validación de dependencias)
✅ Código: Commiteado y pusheado a la rama
✅ Archivos modificados:
   - src/screens/HomeScreen.tsx
   - src/components/DailyVerse.js
   - app/chapter/[book].tsx
```

---

## 💡 ATAJOS DE TECLADO EN EXPO

Cuando el servidor esté corriendo, presiona:

- **`a`** - Abrir en Android
- **`i`** - Abrir en iOS
- **`w`** - Abrir en Web
- **`r`** - Recargar app
- **`m`** - Alternar menú
- **`d`** - Abrir DevTools
- **`j`** - Abrir debugger
- **`c`** - Limpiar consola
- **`?`** - Mostrar todos los comandos

---

¡Listo para probar! 🎉
