/**
 * 📦 COMPONENTS INDEX
 *
 * Exportación centralizada de todos los componentes premium
 */

// ==================== PREMIUM COMPONENTS V5 ====================
export {AnimatedSplashScreen} from './AnimatedSplashScreen';
export {
  ParticleSystem,
  Confetti,
  AchievementCelebration,
  FloatingParticles,
} from './ParticleSystem';
export {IllustratedEmptyState} from './IllustratedEmptyState';
export {
  SVGCircularProgress,
  ReadingCircularProgress,
  LevelCircularProgress,
  StreakCircularProgress,
  MiniCircularProgress,
  AchievementCircularProgress,
} from './SVGCircularProgress';

// ==================== PREMIUM COMPONENTS V4 ====================
export {default as Card3D} from './Card3D';
export {default as AnimatedGradient} from './AnimatedGradient';
export {default as PremiumButton} from './PremiumButton';
export {default as SplashScreen} from './SplashScreen';
export {default as ParallaxScrollView} from './ParallaxScrollView';
export {default as FloatingMenu} from './FloatingMenu';
export {default as SegmentedControl} from './SegmentedControl';
export {default as PremiumBadge} from './PremiumBadge';
export {default as EmptyState} from './EmptyState';
export {default as PremiumRating} from './PremiumRating';

// Existing Components
export {default as ModernCard} from './ModernCard';
export {CardHeader, CardFooter, CardSection} from './ModernCard';
export {default as BottomSheet} from './BottomSheet';
export {default as Toast} from './Toast';
export {toastManager} from './Toast';
export {default as FloatingActionButton} from './FloatingActionButton';
export {default as SkeletonLoader} from './SkeletonLoader';
export {default as ErrorBoundary} from './ErrorBoundary';
export {AchievementNotifications} from './AchievementNotifications';

// Achievement Components
export {AchievementCard} from './achievements/AchievementCard';
export {AchievementUnlockedModal} from './achievements/AchievementUnlockedModal';
export {UserStatsPanel} from './achievements/UserStatsPanel';

// Highlight Components
export {HighlightColorPicker} from './highlights/HighlightColorPicker';

// Types
export type {MenuAction} from './FloatingMenu';
export type {SegmentOption} from './SegmentedControl';
