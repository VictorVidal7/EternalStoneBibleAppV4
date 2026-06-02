/**
 * 🎨 UI Components - Celestial Premium 2.0
 *
 * Exportaciones centralizadas de componentes UI premium
 * Sistema de diseño completo con animaciones de 60fps
 *
 * Para la gloria de Dios - Eternal Bible App
 */

// ==================== CORE COMPONENTS ====================
export {AnimatedCard} from './AnimatedCard';
export {AnimatedButton} from './AnimatedButton';

// ==================== ACCESSIBILITY ====================
export {AppText} from './AppText';
export type {AppTextProps} from './AppText';

// ==================== PREMIUM COMPONENTS ====================
export {GlassmorphicHeader, HEADER_GRADIENTS} from './GlassmorphicHeader';
export type {GradientPreset} from './GlassmorphicHeader';

export {AnimatedTabBar} from './AnimatedTabBar';
export type {TabVariant} from './AnimatedTabBar';

export {SearchSpotlight} from './SearchSpotlight';
export type {SearchSuggestion} from './SearchSpotlight';

export {PremiumBottomSheet} from './PremiumBottomSheet';
export type {PremiumBottomSheetRef} from './PremiumBottomSheet';

export {FloatingActionMenu} from './FloatingActionMenu';
export type {FABAction, MenuLayout, MenuPosition} from './FloatingActionMenu';

// ==================== RE-EXPORT TYPES ====================
export type {default as AnimatedCardProps} from './AnimatedCard';
