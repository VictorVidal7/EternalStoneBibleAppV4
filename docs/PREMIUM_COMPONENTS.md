# 💎 Componentes Premium

## Eternal Bible App - Premium Components Library

**Versión:** 2.0
**Última actualización:** 2025
**Categoría:** Componentes de Lujo con Micro-interacciones

---

## 📋 Índice de Componentes

1. [PremiumInput](#premiuminput---input-de-lujo)
2. [PremiumSkeleton](#premiumskeleton---skeleton-loaders)
3. [PremiumBadge](#premiumbadge---badges-y-pills)
4. [PremiumProgressBar](#premiumprogressbar---barras-de-progreso)
5. [Sistema de Animaciones](#sistema-de-animaciones)

---

## 🎬 PremiumInput - Input de Lujo

### Descripción

Campo de texto con diseño premium, animaciones fluidas y micro-interacciones.

### Características

- ✨ Floating labels animados
- 🌟 Glow effects al enfocar
- ✅ Validación visual (success/error)
- 🎨 Múltiples variantes
- 📏 Tres tamaños
- 🔔 Shake animation en errores
- 🎯 Feedback háptico

### Uso Básico

```tsx
import { PremiumInput } from '@/components/PremiumInput';

// Input simple
<PremiumInput
  label="Buscar versículo"
  placeholder="Escribe aquí..."
  value={searchQuery}
  onChangeText={setSearchQuery}
/>

// Input con icono
<PremiumInput
  label="Email"
  icon="mail"
  variant="outlined"
  size="medium"
  value={email}
  onChangeText={setEmail}
/>

// Input con validación
<PremiumInput
  label="Contraseña"
  icon="lock-closed"
  rightIcon="eye"
  onRightIconPress={togglePassword}
  variant="filled"
  secureTextEntry
  error={passwordError}
  value={password}
  onChangeText={setPassword}
/>

// Input exitoso
<PremiumInput
  label="Nombre"
  icon="person"
  variant="outlined"
  success
  value={name}
  onChangeText={setName}
  helperText="Nombre guardado correctamente"
/>
```

### Props

| Prop               | Tipo                                     | Default      | Descripción                               |
| ------------------ | ---------------------------------------- | ------------ | ----------------------------------------- |
| `label`            | `string`                                 | -            | Label flotante del input                  |
| `error`            | `string`                                 | -            | Mensaje de error (activa animación shake) |
| `helperText`       | `string`                                 | -            | Texto de ayuda debajo del input           |
| `icon`             | `IconName`                               | -            | Icono izquierdo                           |
| `rightIcon`        | `IconName`                               | -            | Icono derecho (clickeable)                |
| `onRightIconPress` | `function`                               | -            | Callback al presionar icono derecho       |
| `variant`          | `'outlined' \| 'filled' \| 'underlined'` | `'outlined'` | Estilo visual                             |
| `size`             | `'small' \| 'medium' \| 'large'`         | `'medium'`   | Tamaño del input                          |
| `success`          | `boolean`                                | `false`      | Muestra estado exitoso                    |

### Variantes

**outlined**: Borde completo con efecto glow
**filled**: Fondo sutil con borde inferior
**underlined**: Solo borde inferior minimalista

---

## ✨ PremiumSkeleton - Skeleton Loaders

### Descripción

Skeleton loaders con animación shimmer profesional para estados de carga.

### Características

- 🌊 Animación wave o pulse
- 🎨 Múltiples variantes
- 🔧 Completamente personalizable
- 🎯 Componentes presets listos para usar
- 🌓 Adaptativo a modo claro/oscuro

### Uso Básico

```tsx
import {
  PremiumSkeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonVerseList,
  SkeletonBookGrid,
} from '@/components/PremiumSkeleton';

// Skeleton básico
<PremiumSkeleton width={200} height={20} />

// Skeleton de texto
<SkeletonText width="80%" />

// Skeleton de título
<SkeletonTitle width="60%" />

// Skeleton de avatar circular
<SkeletonAvatar size={48} />

// Skeleton de botón
<SkeletonButton width={120} />

// Skeleton de card completo
<SkeletonCard />

// Skeleton de lista de versículos
<SkeletonVerseList count={5} />

// Skeleton de grid de libros
<SkeletonBookGrid count={8} />
```

### Props

| Prop           | Tipo                                                 | Default  | Descripción                 |
| -------------- | ---------------------------------------------------- | -------- | --------------------------- |
| `width`        | `number \| string`                                   | `'100%'` | Ancho del skeleton          |
| `height`       | `number`                                             | `20`     | Alto del skeleton           |
| `borderRadius` | `number`                                             | -        | Border radius personalizado |
| `variant`      | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` | Tipo de skeleton            |
| `animation`    | `'pulse' \| 'wave' \| 'none'`                        | `'wave'` | Tipo de animación           |

### Animaciones

**wave**: Efecto shimmer que se mueve horizontalmente (más elegante)
**pulse**: Fade in/out suave (más discreto)
**none**: Sin animación (estático)

---

## 🏷️ PremiumBadge - Badges y Pills

### Descripción

Badges modernos con efectos visuales y animaciones.

### Características

- 🎨 Múltiples variantes de color
- 📏 Tres tamaños
- 🌈 Soporte para gradientes
- ✨ Animación de entrada
- 💫 Pulse animation opcional
- 🔵 Dot indicator
- 🌟 Glow effects

### Uso Básico

```tsx
import {
  PremiumBadge,
  LevelBadge,
  NewBadge,
  VersionBadge,
  StatusBadge,
} from '@/components/PremiumBadge';

// Badge simple
<PremiumBadge label="NUEVO" variant="primary" size="medium" />

// Badge con icono
<PremiumBadge
  label="Completado"
  variant="success"
  icon="checkmark-circle"
  size="medium"
/>

// Badge pill
<PremiumBadge
  label="Premium"
  variant="gradient"
  gradient={['#6366f1', '#9333ea']}
  pill
  glow
/>

// Badge con dot
<PremiumBadge
  label="En Progreso"
  variant="warning"
  dot
  size="small"
/>

// Presets
<LevelBadge level={5} />
<NewBadge />
<VersionBadge version="RVR 1960" />
<StatusBadge status="active" />
```

### Props

| Prop           | Tipo                                                                                    | Default      | Descripción                           |
| -------------- | --------------------------------------------------------------------------------------- | ------------ | ------------------------------------- |
| `label`        | `string`                                                                                | **required** | Texto del badge                       |
| `variant`      | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info' \| 'gradient'` | `'primary'`  | Variante de color                     |
| `size`         | `'small' \| 'medium' \| 'large'`                                                        | `'medium'`   | Tamaño                                |
| `icon`         | `IconName`                                                                              | -            | Icono opcional                        |
| `iconPosition` | `'left' \| 'right'`                                                                     | `'left'`     | Posición del icono                    |
| `pill`         | `boolean`                                                                               | `false`      | Forma de píldora (bordes redondeados) |
| `outlined`     | `boolean`                                                                               | `false`      | Solo borde, sin relleno               |
| `glow`         | `boolean`                                                                               | `false`      | Efecto de brillo                      |
| `gradient`     | `[string, string]`                                                                      | -            | Colores del gradiente                 |
| `animated`     | `boolean`                                                                               | `false`      | Animación de entrada                  |
| `dot`          | `boolean`                                                                               | `false`      | Punto indicador                       |

---

## 📊 PremiumProgressBar - Barras de Progreso

### Descripción

Barras de progreso animadas con efectos visuales premium.

### Características

- 🎬 Animación suave del progreso
- 🌈 Soporte para gradientes
- ✨ Glow effects opcionales
- 📊 Muestra porcentaje
- 🏷️ Label personalizable
- 📏 Tres tamaños
- 💫 Pulse en progreso alto

### Uso Básico

```tsx
import {
  PremiumProgressBar,
  ReadingProgress,
  LevelProgress,
  LoadingProgress,
} from '@/components/PremiumProgressBar';

// Progress bar simple
<PremiumProgressBar
  progress={75}
  variant="primary"
  size="medium"
/>

// Progress bar con label y porcentaje
<PremiumProgressBar
  progress={85}
  variant="success"
  size="medium"
  showLabel
  label="Progreso de Lectura"
  showPercentage
/>

// Progress bar con gradiente y glow
<PremiumProgressBar
  progress={60}
  variant="gradient"
  gradient={['#6366f1', '#9333ea']}
  size="large"
  showLabel
  label="Nivel 5"
  showPercentage
  glow
  animated
/>

// Presets
<ReadingProgress
  versesRead={15000}
  totalVerses={31102}
/>

<LevelProgress
  currentXP={750}
  requiredXP={1000}
  level={5}
/>

<LoadingProgress
  progress={45}
  label="Cargando biblias..."
/>
```

### Props

| Prop             | Tipo                                                                          | Default      | Descripción            |
| ---------------- | ----------------------------------------------------------------------------- | ------------ | ---------------------- |
| `progress`       | `number`                                                                      | **required** | Progreso (0-100)       |
| `variant`        | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'gradient'` | `'primary'`  | Variante de color      |
| `size`           | `'small' \| 'medium' \| 'large'`                                              | `'medium'`   | Tamaño                 |
| `showLabel`      | `boolean`                                                                     | `false`      | Muestra label superior |
| `label`          | `string`                                                                      | -            | Texto del label        |
| `showPercentage` | `boolean`                                                                     | `false`      | Muestra porcentaje     |
| `gradient`       | `[string, string]`                                                            | -            | Colores del gradiente  |
| `glow`           | `boolean`                                                                     | `false`      | Efecto de brillo       |
| `animated`       | `boolean`                                                                     | `true`       | Animación del progreso |

---

## 🎬 Sistema de Animaciones

### Descripción

Sistema completo de animaciones fluidas y profesionales.

### Durations

```typescript
import {DURATIONS} from '@/styles/animations';

DURATIONS.instant; // 100ms
DURATIONS.fast; // 200ms
DURATIONS.normal; // 300ms
DURATIONS.smooth; // 400ms
DURATIONS.slow; // 500ms
DURATIONS.slower; // 600ms
DURATIONS.slowest; // 800ms
```

### Easing Curves

```typescript
import {EASING} from '@/styles/animations';

EASING.standard; // Material Design standard
EASING.decelerate; // Material Design decelerate
EASING.accelerate; // Material Design accelerate
EASING.premium; // Custom premium curve
EASING.smooth; // Suave y elegante
EASING.bounce; // Con rebote
```

### Spring Configurations

```typescript
import {SPRING_CONFIGS} from '@/styles/animations';

SPRING_CONFIGS.gentle; // Para elementos delicados
SPRING_CONFIGS.default; // Uso general
SPRING_CONFIGS.snappy; // Feedback inmediato
SPRING_CONFIGS.bouncy; // Efectos juguetones
SPRING_CONFIGS.stiff; // Movimientos rápidos
```

### Funciones de Animación

```typescript
import {
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInFromBottom,
  bounceIn,
  pulse,
  shake,
  buttonPress,
} from '@/styles/animations';

// Fade in
fadeIn(animatedValue).start();

// Scale in con spring
scaleIn(animatedValue).start();

// Shake (para errores)
shake(animatedValue).start();

// Button press animation
const { onPressIn, onPressOut } = buttonPress(scaleValue);
<TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut}>
  ...
</TouchableOpacity>
```

### Interpolations Helpers

```typescript
import { interpolations } from '@/styles/animations';

// Rotate
const rotate = interpolations.rotate(animatedValue);

// Translate Y
const translateY = interpolations.translateY(animatedValue, 100);

// Opacity
const opacity = interpolations.opacity(animatedValue);

// Scale
const scale = interpolations.scale(animatedValue, 0, 1);

// Uso en componente
<Animated.View
  style={{
    transform: [{ rotate }, { translateY }, { scale }],
    opacity,
  }}
>
  ...
</Animated.View>
```

---

## 🎯 Ejemplos de Uso Completo

### Pantalla de Login Premium

```tsx
import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {PremiumInput} from '@/components/PremiumInput';
import CustomButton from '@/components/CustomButton';
import {SkeletonCard} from '@/components/PremiumSkeleton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleLogin = async () => {
    // Validación
    if (!email.includes('@')) {
      setEmailError('Email inválido');
      return;
    }

    setLoading(true);
    // ... lógica de login
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <View style={styles.container}>
      <PremiumInput
        label="Email"
        icon="mail"
        variant="outlined"
        size="large"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <PremiumInput
        label="Contraseña"
        icon="lock-closed"
        rightIcon={showPassword ? 'eye-off' : 'eye'}
        onRightIconPress={() => setShowPassword(!showPassword)}
        variant="outlined"
        size="large"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
      />

      <CustomButton
        title="Iniciar Sesión"
        onPress={handleLogin}
        variant="primary"
        size="large"
      />
    </View>
  );
}
```

### Card de Progreso de Lectura

```tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ModernCard} from '@/components/ModernCard';
import {ReadingProgress} from '@/components/PremiumProgressBar';
import {LevelBadge} from '@/components/PremiumBadge';

export function ReadingProgressCard({versesRead, totalVerses, level}) {
  return (
    <ModernCard variant="elevated" padding="large">
      <View style={styles.header}>
        <Text style={styles.title}>Tu Progreso</Text>
        <LevelBadge level={level} />
      </View>

      <ReadingProgress
        versesRead={versesRead}
        totalVerses={totalVerses}
        style={styles.progress}
      />

      <Text style={styles.stats}>
        {versesRead.toLocaleString()} de {totalVerses.toLocaleString()}{' '}
        versículos leídos
      </Text>
    </ModernCard>
  );
}
```

---

## 📚 Recursos

- **Código fuente**: `src/components/`
- **Animaciones**: `src/styles/animations.ts`
- **Tokens**: `src/styles/designTokens.ts`
- **Tema**: `src/styles/celestialTheme.ts`

---

**Creado con ❤️ para la gloria de Dios Todopoderoso**

_"Hagan todo para la gloria de Dios" - 1 Corintios 10:31_
