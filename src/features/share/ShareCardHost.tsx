/**
 * 🖼️ ShareCardHost — the capturable `LinearGradient` card shared by every
 * "share as image" modal (Tanda M1, deep-audit batch4 item 6).
 *
 * This is the exact host markup that was byte-identical across all 12
 * duplicated modals (padding/borderRadius/shadow, `collapsable={false}`,
 * a diagonal gradient) — `react-native-view-shot`'s `captureRef` needs a
 * ref to this instance directly, so it's a `forwardRef` rather than owning
 * its own internal ref.
 *
 * `texture` defaults to `'none'` (renders nothing extra — zero behavior
 * change for the 3 M1 pilots) so premium textures (Tanda M3) can be turned
 * on later for any screen using this host without touching its markup
 * again.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import React, {forwardRef} from 'react';
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import type {ShareTemplate} from './imageTemplates';
import {type ShareTexture} from './textures';
import {ShareTextureOverlay} from '../../components/reading/ShareTextureOverlay';
import {spacing, borderRadius, shadows} from '@/styles/designTokens';

export interface ShareCardHostProps {
  template: ShareTemplate;
  /** Non-'none' textures are premium (Tanda M3) — omit for free-only screens. */
  texture?: ShareTexture;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const ShareCardHost = forwardRef<LinearGradient, ShareCardHostProps>(
  ({template, texture = 'none', style, children}, ref) => (
    <LinearGradient
      colors={template.colors}
      style={[styles.card, style]}
      ref={ref}
      collapsable={false}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <ShareTextureOverlay texture={texture} color={template.textColor} />
      {children}
    </LinearGradient>
  ),
);

ShareCardHost.displayName = 'ShareCardHost';

export default ShareCardHost;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    ...shadows.xl,
  },
});
