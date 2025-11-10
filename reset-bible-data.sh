#!/bin/bash

# Script para resetear los datos de la Biblia en Eternal Bible App
# Esto eliminará el cache de AsyncStorage y la base de datos

echo "🔄 Reseteando datos de Eternal Bible..."

# Para Android
if command -v adb &> /dev/null; then
    echo "📱 Limpiando datos en Android..."
    adb shell pm clear com.victoryourname.eternalstonebibleappv3
    echo "✅ Datos de Android limpiados"
fi

# Para iOS (usando Expo)
echo "🍎 Para iOS: Desinstala la app y vuelve a instalarla"
echo "   O usa: expo start --clear"

echo ""
echo "✨ Ahora vuelve a abrir la app y deberías ver la carga de datos"
