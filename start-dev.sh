#!/bin/bash

# Script para iniciar Expo en modo offline (evita errores de "Access denied")

echo "🚀 Iniciando Eternal Bible App en modo desarrollo offline..."
echo ""

# Limpiar caché si es necesario
if [ "$1" == "--clear" ]; then
  echo "🧹 Limpiando caché..."
  rm -rf node_modules/.cache .expo metro-cache
  echo "✅ Caché limpiada"
  echo ""
fi

# Variables de entorno para modo offline
export EXPO_OFFLINE=1
export EXPO_NO_DOTENV=1

# Iniciar Expo en modo offline
echo "📦 Iniciando Metro Bundler en modo offline..."
echo ""
npx expo start --offline

