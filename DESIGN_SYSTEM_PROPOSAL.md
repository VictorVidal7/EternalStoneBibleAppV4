# 🎨 Sistema de Diseño Unificado - EternalStone Bible App

## 📊 ANÁLISIS DE PROBLEMAS ACTUALES

### ❌ Problemas Identificados

#### 1. **Inconsistencia en Border Radius**
- **Problema:** Valores mezclados sin patrón claro
  - `borderRadius: 12, 16, 20, 30, roundness variable`
  - Iconos circulares (`borderRadius: 30`) vs contenedores redondeados
  - No hay jerarquía clara entre componentes

#### 2. **Padding Caótico**
- **Problema:** Valores arbitrarios sin sistema
  - Cards: `16px, 20px, 24px` (inconsistente)
  - Buttons: `10px, 12px, 15px, 18px`
  - List items: `16px` mezclado con valores custom
- **Resultado:** Sensación de compresión o espacios excesivos

#### 3. **Sombras Sin Jerarquía**
- **Problema:** No hay sistema de elevación coherente
  - `shadowOpacity: 0.05, 0.1, 0.3` (valores random)
  - Algunas cards con `elevation: 2`, otras `elevation: 4, 8`
  - En modo claro: sombras demasiado sutiles → cards se funden con el fondo
  - En modo oscuro: sombras demasiado fuertes

#### 4. **Doble Marco Visual**
- **Problema:** Superposición de bordes y sombras
  - Border gris `borderWidth: 1-2` + sombra = efecto de "doble caja"
  - Achievement cards: borde colorido + sombra → visual pesado
  - DailyVerse: borde + sombra + background diferente

#### 5. **Márgenes Inconsistentes**
- **Problema:** Spacing vertical irregular
  - Entre cards: `8px, 12px, 16px, 20px`
  - Márgenes horizontales: `16px, 20px` mezclados
  - No hay ritmo visual consistente

#### 6. **Jerarquía Visual Confusa**
- **Problema:** Todo tiene el mismo peso visual
  - Cards principales vs secundarias: mismo estilo
  - No se distingue contenido primario de secundario
  - Falta de contraste en importancia

---

## ✅ SISTEMA DE DISEÑO PROPUESTO

### 📐 Fundamentos: Material Design 3 + iOS HIG

#### **Principios Base:**
1. **Simplicidad:** Un solo nivel de elevación por card (sin doble marco)
2. **Consistencia:** Valores fijos del sistema de 8pt grid
3. **Jerarquía:** 3 niveles de cards (Primary, Secondary, Tertiary)
4. **Legibilidad:** Spacing generoso, contraste optimizado
5. **Modernidad:** Bordes suaves, sombras sutiles

---

## 🎴 SISTEMA DE TARJETAS (Cards)

### **Nivel 1: Primary Card** (Contenido Principal)
**Uso:** DailyVerse, AchievementCard destacada, contenido hero

```
Background:     colors.card (#FFFFFF light / #1a1a1a dark)
Border Radius:  16dp (borderRadius.lg)
Border:         NONE (sin borde visible)
Elevation:      Nivel 2 (sombra sutil)
  Light Mode:   shadowOpacity: 0.06, offset: (0, 2), radius: 8
  Dark Mode:    shadowOpacity: 0.25, offset: (0, 2), radius: 8
Padding:        20dp horizontal, 20dp vertical
Margin:         16dp horizontal, 12dp vertical

Shadow (Light):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.06
  shadowRadius: 8
  elevation: 2

Shadow (Dark):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.25
  shadowRadius: 8
  elevation: 2
```

### **Nivel 2: Secondary Card** (Contenido de Soporte)
**Uso:** Lista de libros, capítulos, bookmarks, notes

```
Background:     colors.card
Border Radius:  12dp (borderRadius.md)
Border:         NONE o 1px rgba(0,0,0,0.04) solo en light mode
Elevation:      Nivel 1 (sombra mínima)
  Light Mode:   shadowOpacity: 0.04, offset: (0, 1), radius: 4
  Dark Mode:    shadowOpacity: 0.2, offset: (0, 1), radius: 4
Padding:        16dp horizontal, 16dp vertical
Margin:         0dp horizontal, 1px vertical (hairline separador)

Shadow (Light):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 1 }
  shadowOpacity: 0.04
  shadowRadius: 4
  elevation: 1

Shadow (Dark):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 1 }
  shadowOpacity: 0.2
  shadowRadius: 4
  elevation: 1
```

### **Nivel 3: Tertiary Card** (Elementos Pequeños)
**Uso:** Chips, tags, pequeños contenedores

```
Background:     colors.surface
Border Radius:  8dp (borderRadius.sm)
Border:         NONE
Elevation:      NONE (flat)
Padding:        12dp horizontal, 8dp vertical
Margin:         4dp

NO Shadow (totalmente plano)
```

---

## 📏 SPACING SYSTEM (8pt Grid)

### **Padding Estándar:**
```
Extra Small:  8dp   (spacing.xs)   → Chips, tags internos
Small:        12dp  (spacing.sm)   → Elementos compactos
Medium:       16dp  (spacing.md)   → Lista items, cards secundarias
Base:         20dp  (spacing.base) → Cards principales, botones
Large:        24dp  (spacing.lg)   → Headers, secciones importantes
Extra Large:  32dp  (spacing.xl)   → Summary cards, destacados
```

### **Margin Estándar:**
```
Vertical entre cards:     12dp
Horizontal (pantalla):    16dp
Entre secciones:          24dp
Bottom de listas:         24dp
```

### **Spacing Interno (dentro de cards):**
```
Título → Contenido:       12dp
Contenido → Contenido:    8dp
Contenido → Footer:       16dp
Icon → Texto:             12dp
```

---

## 🎨 BORDER RADIUS SYSTEM

### **Jerarquía de Radios:**
```
Extra Small:  4dp   (borderRadius.xs)   → Badges, progress bars
Small:        8dp   (borderRadius.sm)   → Chips, small buttons
Medium:       12dp  (borderRadius.md)   → Secondary cards, inputs
Large:        16dp  (borderRadius.lg)   → Primary cards, modals
Extra Large:  20dp  (borderRadius.xl)   → Headers destacados
Full:         9999  (borderRadius.full) → Círculos, pills
```

### **Reglas de Uso:**
1. **Cards principales:** 16dp (lg)
2. **Cards en lista:** 12dp (md)
3. **Botones principales:** 12dp (md)
4. **Chips/Tags:** 8dp (sm) o full para pills
5. **Icon containers:** 12dp (md) - NO circular a menos que sea avatar

---

## 🌓 ELEVATION SYSTEM (Sombras)

### **Nivel 0: Flat** (Sin elevación)
```typescript
// Uso: Chips, tags, elementos integrados al fondo
{
  // Sin sombra
}
```

### **Nivel 1: Raised** (Elevación mínima)
```typescript
// Uso: Lista items, secondary cards
Light: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
}

Dark: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 1,
}
```

### **Nivel 2: Elevated** (Elevación estándar)
```typescript
// Uso: Primary cards, modals, important content
Light: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}

Dark: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 2,
}
```

### **Nivel 3: Floating** (Elevación alta)
```typescript
// Uso: FAB, dropdowns, popovers
Light: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 4,
}

Dark: {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 4,
}
```

---

## 🎯 JERARQUÍA VISUAL

### **Contenido Primario:**
- Cards grandes con padding generoso (20-24dp)
- Border radius: 16dp
- Elevación: Nivel 2
- Márgenes: 16dp horizontales

### **Contenido Secundario:**
- Cards medianas con padding standard (16dp)
- Border radius: 12dp
- Elevación: Nivel 1
- Separadores hairline entre items

### **Contenido Terciario:**
- Elementos compactos (12dp padding)
- Border radius: 8dp
- Sin elevación (flat)
- Integrados visualmente

---

## 📱 ALINEACIÓN Y SEPARACIÓN

### **Regla de Oro: 8pt Grid**
Todos los valores deben ser múltiplos de 8:
- ✅ 8, 16, 24, 32, 40, 48...
- ❌ 10, 14, 18, 22, 26...

### **Márgenes de Pantalla:**
```
Horizontal:        16dp (consistente en toda la app)
Top (debajo nav):  8dp
Bottom:            24dp (espacio para scroll)
```

### **Separación entre Secciones:**
```
Título → Contenido:  16dp
Sección → Sección:   24dp
Card → Card:         12dp
```

---

## 🔤 TIPOGRAFÍA (Ya establecida - mantener)

### **Sistema Actual (Correcto):**
```typescript
fontSize: {
  xs: 12,     // Labels pequeños
  sm: 14,     // Texto secundario
  base: 16,   // Texto principal
  md: 18,     // Subtítulos
  lg: 20,     // Títulos medianos
  xl: 24,     // Títulos grandes
  '2xl': 30,  // Headers
  '3xl': 36,  // Títulos hero
}

fontWeight: {
  '500': regular text
  '600': medium emphasis
  '700': bold emphasis
  '800': extra bold (headers)
}
```

---

## 🎨 COLORES (Ya establecidos - mantener)

### **Light Mode:**
```typescript
background: '#fafbfc'     // Fondo principal
card: '#ffffff'           // Cards
border: 'rgba(0,0,0,0.06)'// Bordes sutiles
```

### **Dark Mode:**
```typescript
background: '#000000'     // True black OLED
card: '#1a1a1a'          // Cards
border: 'rgba(255,255,255,0.1)' // Bordes sutiles
```

---

## 📋 REGLAS DE ORO

### ✅ **DO (Hacer):**
1. Usar UN SOLO nivel de elevación por card (NO border + shadow juntos)
2. Mantener border radius en 12dp o 16dp para cards
3. Padding mínimo de 16dp en cards
4. Margins de 16dp horizontal en toda la app
5. Spacing vertical de 12dp entre cards
6. Sombras más fuertes en dark mode (0.2-0.35 opacity)
7. Sombras más sutiles en light mode (0.04-0.06 opacity)

### ❌ **DON'T (No hacer):**
1. NO mezclar border + shadow en la misma card
2. NO usar border radius > 20dp (excepto full/pill)
3. NO usar padding < 12dp en elementos touch
4. NO valores de spacing que no sean múltiplos de 4
5. NO iconos circulares en containers rectangulares
6. NO sombras con opacity > 0.15 en light mode

---

Este es el sistema base. ¿Quieres que ahora cree los ejemplos de código con estos cambios aplicados?
