# 📋 GUÍA RÁPIDA - Sistema de Diseño Unificado

## 🎯 REGLA DE ORO: Simplicidad y Consistencia

> **"Un solo nivel de elevación por componente"**
> - ❌ NO: Border + Shadow
> - ✅ SÍ: Shadow SOLAMENTE

---

## 📐 VALORES RÁPIDOS (Copy-Paste)

### **Border Radius:**
```typescript
Small cards:      12dp (borderRadius.md)
Large cards:      16dp (borderRadius.lg)
Icon containers:  12dp (borderRadius.md) - NO circular
Buttons:          12dp (borderRadius.md)
Chips/Pills:      8dp (borderRadius.sm) o full
```

### **Padding:**
```typescript
List items:       16dp horizontal, 16dp vertical
Primary cards:    20dp horizontal, 20dp vertical
Important cards:  24-32dp (xl para destacados)
Buttons:          16dp horizontal, 12-16dp vertical
```

### **Margin:**
```typescript
Screen horizontal:  16dp (SIEMPRE)
Between cards:      12dp vertical
Between sections:   24dp vertical
Bottom of lists:    24dp
```

### **Shadows (Light Mode):**
```typescript
Level 0 (Flat):
  // Sin sombra

Level 1 (List items):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 1 }
  shadowOpacity: 0.04
  shadowRadius: 4
  elevation: 1

Level 2 (Primary cards):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.06
  shadowRadius: 8
  elevation: 2

Level 3 (Floating):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 4 }
  shadowOpacity: 0.1
  shadowRadius: 12
  elevation: 4
```

### **Shadows (Dark Mode):**
```typescript
Level 0 (Flat):
  // Sin sombra

Level 1 (List items):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 1 }
  shadowOpacity: 0.2     // 5x más fuerte que light
  shadowRadius: 4
  elevation: 1

Level 2 (Primary cards):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.25    // 4x más fuerte que light
  shadowRadius: 8
  elevation: 2

Level 3 (Floating):
  shadowColor: '#000000'
  shadowOffset: { width: 0, height: 4 }
  shadowOpacity: 0.35    // 3.5x más fuerte que light
  shadowRadius: 12
  elevation: 4
```

---

## 🎴 PLANTILLAS POR TIPO DE CARD

### **1. PRIMARY CARD** (DailyVerse, Destacados)
```typescript
{
  borderRadius: 16,
  paddingHorizontal: 20,
  paddingVertical: 20,
  marginHorizontal: 16,
  marginVertical: 12,
  backgroundColor: colors.card,
  borderWidth: 0,  // ← SIN BORDER
  // + Shadow Level 2
}
```

### **2. SECONDARY CARD** (Lista items)
```typescript
{
  borderRadius: 12,        // ← Solo si es card independiente
  // O borderRadius: 0     // ← Si es item de lista
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: colors.card,
  borderBottomWidth: StyleSheet.hairlineWidth,  // ← Solo en light
  borderBottomColor: colors.border,
  borderWidth: 0,  // ← SIN BORDER lateral
  // Light: sin shadow, solo hairline
  // Dark: Shadow Level 1
}
```

### **3. TERTIARY CARD** (Chips, tags, botones pequeños)
```typescript
{
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  margin: 4,
  backgroundColor: colors.surface,
  borderWidth: 0,  // ← SIN BORDER
  // Sin shadow (flat)
}
```

### **4. ICON CONTAINER** (Todos los iconos)
```typescript
{
  width: 48-56,
  height: 48-56,
  borderRadius: 12,  // ← SIEMPRE 12, NUNCA circular
  backgroundColor: colors.primary + '15',
  justifyContent: 'center',
  alignItems: 'center',
}
```

---

## ✅ CHECKLIST DE CALIDAD

Antes de hacer commit, verifica:

- [ ] ¿Padding mínimo de 16dp en elementos touch?
- [ ] ¿Border radius es 12dp o 16dp (no otros valores)?
- [ ] ¿NO hay border + shadow juntos?
- [ ] ¿Las sombras son diferentes en light/dark mode?
- [ ] ¿Los márgenes horizontales son 16dp?
- [ ] ¿El spacing vertical entre cards es 12dp?
- [ ] ¿Icon containers usan borderRadius 12, NO circular?
- [ ] ¿Todos los valores son múltiplos de 4?

---

## 🚨 ERRORES COMUNES A EVITAR

### ❌ **ERROR 1: Doble marco**
```typescript
// MAL
{
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.md,  // ← Border + Shadow = visual pesado
}

// BIEN
{
  borderWidth: 0,  // ← Solo uno
  ...shadows.md,
}
```

### ❌ **ERROR 2: Iconos circulares en contenedores rectangulares**
```typescript
// MAL
{
  width: 48,
  height: 48,
  borderRadius: 24,  // ← Circular no combina con cards de 12-16dp
}

// BIEN
{
  width: 48,
  height: 48,
  borderRadius: 12,  // ← Coherente con el sistema
}
```

### ❌ **ERROR 3: Mismas sombras en light y dark**
```typescript
// MAL
const shadow = {
  shadowOpacity: 0.1,  // ← Igual para ambos
}

// BIEN
const shadow = isDark ? {
  shadowOpacity: 0.25,  // ← Más fuerte en dark
} : {
  shadowOpacity: 0.06,  // ← Más sutil en light
}
```

### ❌ **ERROR 4: Valores que no son múltiplos de 4**
```typescript
// MAL
padding: 15,      // ← No es múltiplo de 4
margin: 18,       // ← No es múltiplo de 4
borderRadius: 14, // ← No es múltiplo de 4

// BIEN
padding: 16,      // ← 8pt grid
margin: 20,       // ← 8pt grid
borderRadius: 12, // ← 8pt grid
```

### ❌ **ERROR 5: Padding insuficiente**
```typescript
// MAL
{
  padding: 8,  // ← Muy comprimido
}

// BIEN
{
  paddingHorizontal: 16,  // ← Mínimo para cards
  paddingVertical: 16,
}
```

---

## 🎨 COMBINACIONES RECOMENDADAS

### **Card de Contenido Importante:**
```typescript
- Border Radius: 16dp
- Padding: 20-24dp
- Margin H: 16dp, V: 12dp
- Shadow: Level 2
- NO border
```

### **Item de Lista:**
```typescript
- Border Radius: 0 (o 12dp si es independiente)
- Padding: 16dp
- Margin: 0
- Separator: hairline en light, shadow level 1 en dark
- NO border
```

### **Botón Destacado:**
```typescript
- Border Radius: 12dp
- Padding H: 20dp, V: 12-16dp
- Shadow: Level 2 (con color del botón)
- NO border
```

### **Chip/Tag:**
```typescript
- Border Radius: 8dp o full
- Padding H: 12dp, V: 8dp
- NO shadow (flat)
- NO border
```

---

## 📱 SPACING VERTICAL ESPECÍFICO

```
┌─────────────────────┐
│   Screen Top        │ 8dp
├─────────────────────┤
│   Section Title     │
│                     │ 16dp
├─────────────────────┤
│   Primary Card      │
│                     │ 12dp
├─────────────────────┤
│   Primary Card      │
│                     │ 12dp
├─────────────────────┤
│   Section Title     │
│                     │ 16dp
├─────────────────────┤
│   Secondary Card    │
│   Secondary Card    │ hairline
│   Secondary Card    │ hairline
│   Secondary Card    │
│                     │ 24dp
└─────────────────────┘
   Screen Bottom
```

---

## 💡 TIPS PRO

1. **Sombras en Dark Mode:** Siempre 4-5x más fuertes que en Light
2. **Spacing:** Usa 12dp entre cards del mismo tipo, 24dp entre secciones
3. **Icon Size:** 48-56px para touch targets, nunca menos de 44px
4. **Border Radius:** Mantén 12 o 16, evita valores intermedios
5. **Padding:** Mínimo 16dp en elementos touch, 20dp en cards importantes

---

## 🔗 RECURSOS

- **Design Tokens:** `src/styles/designTokens.ts`
- **Ejemplos:** `DESIGN_EXAMPLES.tsx`
- **Sistema Completo:** `DESIGN_SYSTEM_PROPOSAL.md`

---

**Última actualización:** Sistema de diseño v1.0
**Autor:** Claude + Victor
