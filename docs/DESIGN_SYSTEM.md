# 🎨 Sistema de Diseño Celestial Sereno

## Eternal Bible App - Design System Documentation

**Versión:** 2.0
**Última actualización:** 2025
**Filosofía:** Minimalismo profesional con elegancia espiritual

---

## 📋 Tabla de Contenidos

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Paleta de Colores](#paleta-de-colores)
3. [Tipografía](#tipografía)
4. [Espaciado](#espaciado)
5. [Border Radius](#border-radius)
6. [Sombras y Elevación](#sombras-y-elevación)
7. [Componentes](#componentes)
8. [Modo Claro vs Oscuro](#modo-claro-vs-oscuro)

---

## 🎯 Filosofía de Diseño

### Principios Fundamentales

1. **Minimalismo Profesional**: Menos es más. Cada elemento tiene un propósito.
2. **Legibilidad Primero**: La Palabra de Dios debe ser fácil de leer.
3. **Consistencia Visual**: Mismo lenguaje de diseño en toda la app.
4. **Accesibilidad**: Diseño inclusivo para todos los usuarios.
5. **Elegancia Espiritual**: Belleza que refleja lo celestial.

### Características Clave

- ✨ **Glassmorphism** sutil para profundidad visual
- 🎨 **Gradientes celestiales** (Indigo/Purple/Emerald)
- 📱 **Responsive** para todos los tamaños de pantalla
- 🌓 **Dark/Light mode** optimizados
- ♿ **WCAG AA** compliance para contraste

---

## 🎨 Paleta de Colores

### Modo Claro

#### Backgrounds

```typescript
background: '#ffffff'; // Blanco puro - máxima claridad
backgroundGradient: [
  '#ffffff', // Blanco
  '#fafbff', // Casi blanco con tinte indigo
  '#f8f9ff', // Blanco con tinte indigo muy sutil
];
backgroundSecondary: '#f8f9fc'; // Gris muy claro
backgroundTertiary: '#f1f3f9'; // Gris claro
```

#### Surfaces

```typescript
surface: 'rgba(255, 255, 255, 0.95)'; // bg-white/95
surfaceElevated: 'rgba(255, 255, 255, 0.98)';
surfaceGlass: 'rgba(255, 255, 255, 0.85)'; // Glassmorphism
card: 'rgba(255, 255, 255, 0.95)';
```

#### Colors Primarios

```typescript
primary: '#4f46e5'; // Indigo-600 - Color principal
primaryLight: '#6366f1'; // Indigo-500
primaryDark: '#4338ca'; // Indigo-700
```

#### Colors Accent

```typescript
accent: '#059669'; // Emerald-600 - Para CTAs
accentLight: '#10b981'; // Emerald-500
accentDark: '#047857'; // Emerald-700
```

#### Text Colors

```typescript
text: '#0f172a'; // Slate-900 - Negro azulado
textSecondary: '#475569'; // Slate-600 - Gris medio
textTertiary: '#64748b'; // Slate-500 - Gris claro
textDisabled: '#94a3b8'; // Slate-400
```

#### Semantic Colors

```typescript
success: '#059669'; // Emerald-600
error: '#dc2626'; // Red-600 - Profesional
warning: '#ea580c'; // Orange-600 - Visible
info: '#4f46e5'; // Indigo-600
```

### Modo Oscuro

#### Backgrounds

```typescript
background: '#0a0d1a'; // Casi negro con tinte azul
backgroundGradient: [
  '#0a0d1a', // Oscuro profundo
  '#0f1419', // Gris muy oscuro
  '#12151f', // Gris oscuro medio
];
backgroundSecondary: '#111422'; // Gris oscuro
backgroundTertiary: '#1a1d2e'; // Gris oscuro medio
```

#### Surfaces

```typescript
surface: 'rgba(26, 29, 46, 0.70)'; // Opaco para contraste
surfaceElevated: 'rgba(26, 29, 46, 0.85)';
surfaceGlass: 'rgba(26, 29, 46, 0.60)'; // Glassmorphism oscuro
card: 'rgba(26, 29, 46, 0.70)';
```

#### Colors Primarios

```typescript
primary: '#6366f1'; // Indigo-500 - Más brillante en dark
primaryLight: '#818cf8'; // Indigo-400
primaryDark: '#4f46e5'; // Indigo-600
```

#### Text Colors

```typescript
text: '#f8f9fc'; // Casi blanco - alto contraste
textSecondary: '#cbd5e1'; // Slate-300
textTertiary: '#94a3b8'; // Slate-400
textDisabled: '#475569'; // Slate-600
```

---

## 📝 Tipografía

### Font Families

```typescript
sans: 'System'(iOS) | 'Roboto'(Android); // UI y controles
serif: 'Georgia'(iOS) | 'serif'(Android); // Contenido bíblico
mono: 'Courier'(iOS) | 'monospace'; // Código/referencias
```

### Type Scale (1.2 ratio - Minor Third)

```typescript
'2xs': 10px   // Textos muy pequeños
xs:    12px   // Etiquetas, metadata
sm:    14px   // Labels, captions
base:  16px   // ✨ Texto principal (ÓPTIMO)
md:    18px   // Texto destacado
lg:    20px   // Subtítulos pequeños
xl:    24px   // Subtítulos
'2xl': 28px   // Títulos secundarios
'3xl': 32px   // Títulos principales
'4xl': 40px   // Títulos hero
'5xl': 48px   // Display text
```

### Font Weights

```typescript
normal: 400; // Texto regular
medium: 500; // Texto medio
semibold: 600; // ✨ Botones, énfasis
bold: 700; // Títulos, headers
```

### Line Heights

```typescript
tight: 1.25; // Títulos (h1, h2, h3)
normal: 1.5; // UI text, labels
relaxed: 1.7; // Body text, párrafos
loose: 2.0; // ✨ Texto bíblico (máxima legibilidad)
```

### Uso Recomendado

```typescript
// Headers
H1: fontSize.3xl, fontWeight.bold, lineHeight.tight
H2: fontSize.2xl, fontWeight.bold, lineHeight.tight
H3: fontSize.xl, fontWeight.semibold, lineHeight.tight

// Body
Body: fontSize.base, fontWeight.normal, lineHeight.relaxed
Body Large: fontSize.md, fontWeight.normal, lineHeight.relaxed
Caption: fontSize.sm, fontWeight.medium, lineHeight.normal

// Versículos Bíblicos
Verse: fontSize.md, fontFamily.serif, lineHeight.loose
```

---

## 📏 Espaciado

### Sistema 8pt Grid

```typescript
'0':    0px
'0.5':  2px
'1':    4px
'1.5':  6px
'2':    8px    // xs
'3':    12px   // sm
'4':    16px   // md
'5':    20px   // base
'6':    24px   // lg ✨ Padding de pantallas y cards
'8':    32px   // xl
'10':   40px   // 2xl
'12':   48px   // 3xl
'16':   64px   // 4xl
'20':   80px   // 5xl
'24':   96px   // 6xl
```

### Usos Recomendados

```typescript
// Padding de Contenedores
screenPadding: 24px      // lg - Padding de pantallas
cardPadding: 24px        // lg - Padding interno de cards
cardPaddingSmall: 16px   // md - Padding de cards pequeños

// Gaps entre Elementos
sectionGap: 32px         // xl - Gap entre secciones principales
cardGap: 24px            // lg - Gap entre cards
elementGap: 16px         // md - Gap entre elementos relacionados
smallGap: 12px           // sm - Gap pequeño
tinyGap: 8px             // xs - Gap mínimo

// Margins
componentMargin: 24px    // lg - Margin de componentes
listItemMargin: 16px     // md - Margin entre items de lista
```

---

## 🔲 Border Radius

### Sistema Minimalista

```typescript
none: 0px
xs:   6px      // Elementos muy pequeños (badges)
sm:   10px     // Botones pequeños
md:   14px     // ✨ Botones estándar
lg:   18px     // Cards pequeños
xl:   22px     // ✨ Cards medianos (más común)
'2xl': 28px    // Cards grandes, modales
'3xl': 36px    // Elementos destacados
full: 9999px   // Círculos completos (avatares, pills)
```

### Uso Recomendado

```typescript
// Botones
Small Button: borderRadius.sm   (10px)
Medium Button: borderRadius.md  (14px)
Large Button: borderRadius.lg   (18px)

// Cards
Small Card: borderRadius.lg     (18px)
Medium Card: borderRadius.xl    (22px) ✨ MÁS COMÚN
Large Card: borderRadius.2xl    (28px)

// Otros
Input Fields: borderRadius.md   (14px)
Modal: borderRadius.2xl         (28px)
Avatar: borderRadius.full       (9999px)
Badge: borderRadius.full        (9999px)
```

---

## ☁️ Sombras y Elevación

### Modo Claro

```typescript
xs: {
  shadowOffset: { width: 0, height: 1 }
  shadowOpacity: 0.05
  shadowRadius: 2
  elevation: 1
  // Uso: Elementos sutiles, bordes elevados
}

sm: {
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.08
  shadowRadius: 4
  elevation: 2
  // Uso: Cards pequeños, dropdowns
}

md: {
  shadowOffset: { width: 0, height: 4 }
  shadowOpacity: 0.10
  shadowRadius: 8
  elevation: 3
  // Uso: ✨ Cards principales (más común)
}

lg: {
  shadowOffset: { width: 0, height: 6 }
  shadowOpacity: 0.12
  shadowRadius: 12
  elevation: 4
  // Uso: Cards elevados, floating elements
}

xl: {
  shadowOffset: { width: 0, height: 8 }
  shadowOpacity: 0.15
  shadowRadius: 16
  elevation: 6
  // Uso: Modales, popovers
}

2xl: {
  shadowOffset: { width: 0, height: 12 }
  shadowOpacity: 0.20
  shadowRadius: 24
  elevation: 8
  // Uso: Elementos flotantes principales
}
```

### Modo Oscuro

```typescript
// En modo oscuro, las sombras son más fuertes (negro puro)
shadowColor: '#000000'
shadowOpacity: +0.2 a +0.4 más que en modo claro
```

---

## 🧩 Componentes

### CustomButton

#### Variantes

- **primary**: Color principal (Indigo) - Para acciones principales
- **secondary**: Color accent (Emerald) - Para acciones secundarias
- **danger**: Color error (Red) - Para acciones destructivas
- **ghost**: Transparente con borde - Para acciones terciarias

#### Tamaños

- **small**: padding 16x12, fontSize 14px, borderRadius 10px
- **medium**: padding 24x16, fontSize 16px, borderRadius 14px ✨
- **large**: padding 32x20, fontSize 18px, borderRadius 18px

#### Uso

```tsx
<CustomButton
  variant="primary"
  size="medium"
  title="Continuar Leyendo"
  onPress={() => {}}
/>
```

### ModernCard

#### Variantes

- **elevated**: Card sólido con sombra - Para contenido principal
- **outlined**: Card con borde sutil - Para contenido secundario
- **filled**: Card relleno - Para backgrounds alternativos
- **glass**: Glassmorphism con blur - Para overlays
- **gradient**: Card con gradiente - Para destacar contenido

#### Padding

- **none**: Sin padding interno
- **small**: 16px
- **medium**: 20px ✨ Más común
- **large**: 24px

#### Uso

```tsx
<ModernCard variant="elevated" padding="medium" elevation="md">
  <CardHeader title="Título" subtitle="Subtítulo" />
  <CardSection>Contenido</CardSection>
  <CardFooter>Acciones</CardFooter>
</ModernCard>
```

---

## 🌓 Modo Claro vs Oscuro

### Principios

1. **Contraste Optimizado**: WCAG AA compliance en ambos modos
2. **Colores Vibrantes en Dark**: Primary colors más brillantes en dark
3. **Sombras Adaptativas**: Más fuertes en dark para separación visual
4. **Backgrounds Profundos**: Dark mode usa casi-negro (#0a0d1a) no negro puro
5. **Glassmorphism Adaptativo**: Opacidad ajustada según el modo

### Diferencias Clave

| Elemento           | Modo Claro               | Modo Oscuro               |
| ------------------ | ------------------------ | ------------------------- |
| **Background**     | `#ffffff`                | `#0a0d1a`                 |
| **Primary**        | `#4f46e5` (Indigo-600)   | `#6366f1` (Indigo-500) ✨ |
| **Text**           | `#0f172a` (Slate-900)    | `#f8f9fc` (Casi blanco)   |
| **Card**           | `rgba(255,255,255,0.95)` | `rgba(26,29,46,0.70)`     |
| **Border**         | `rgba(226,232,240,0.60)` | `rgba(71,85,105,0.30)`    |
| **Shadow Opacity** | `0.08 - 0.20`            | `0.30 - 0.60`             |

---

## ✅ Checklist de Implementación

Al crear nuevos componentes, asegúrate de:

- [ ] Usar tokens del `designTokens.ts`
- [ ] Implementar soporte para modo claro y oscuro
- [ ] Aplicar espaciado del sistema (8pt grid)
- [ ] Usar border radius del sistema
- [ ] Incluir sombras apropiadas según elevación
- [ ] Tipografía del sistema (tamaños y pesos)
- [ ] Accesibilidad (labels, roles, estados)
- [ ] Feedback háptico en interacciones
- [ ] Animaciones suaves (200-500ms)
- [ ] Responsive design (breakpoints)

---

## 🚀 Mejores Prácticas

### DO ✅

- Usar colores del tema (`colors.primary`, `colors.text`, etc.)
- Aplicar espaciado con tokens (`spacing.lg`, `spacing.md`)
- Mantener consistencia en border radius
- Usar sombras semánticas según elevación
- Implementar estados hover/pressed/disabled
- Agregar feedback háptico en acciones
- Testear en ambos modos (claro y oscuro)

### DON'T ❌

- Hardcodear colores directamente (`#FF0000`)
- Usar espaciado arbitrario (`padding: 17px`)
- Mezclar sistemas de border radius
- Ignorar el modo oscuro
- Olvidar accesibilidad
- Usar animaciones largas (>700ms)
- Crear componentes sin soporte de tema

---

## 📚 Recursos

- **Tokens**: `src/styles/designTokens.ts`
- **Tema**: `src/styles/celestialTheme.ts`
- **Componentes**: `src/components/`
- **Hooks**: `src/hooks/useTheme.tsx`

---

**Creado con ❤️ para la gloria de Dios Todopoderoso**

_"Que todo lo que respira alabe al SEÑOR" - Salmos 150:6_
