/**
 * 🖼️ useShareImage — shared capture→share pipeline for the "share as image"
 * card modals (Tanda M1, deep-audit batch4 item 6).
 *
 * Every one of the 12 duplicated modals (Achievement, Challenge, Testimony,
 * Constancy, Highlights, Mood, Timeline, WeeklyRecap, PeriodRecap, Note,
 * Collection) plus the flagship `ImageShareModal` shares the exact same
 * template-index state, `captureRef` → `Sharing.shareAsync` pipeline, and
 * toast/error handling — only a logger tag and (on some screens) an extra
 * share-guard predicate vary. This hook is that shared behavior, extracted
 * so new screens (and the flagship, eventually) stop re-implementing it.
 *
 * `templates` defaults to `FREE_TEMPLATES` for the 12 free-tier modals; the
 * flagship can later pass `SHARE_TEMPLATES` (10 free + 9 premium) without
 * this hook changing shape — that's deliberate, not speculative: the
 * flagship's `handleShare`/`previewRef`/`templateIndex` state is otherwise
 * identical to what this hook already does.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import {useRef, useState} from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {FREE_TEMPLATES, type ShareTemplate} from './imageTemplates';
import type {ShareTexture} from './textures';

export interface UseShareImageOptions {
  /** Catalog to pick from — defaults to the 10 free templates. */
  templates?: readonly ShareTemplate[];
  /** Logged as the `component` field and folded into the error message. */
  componentName: string;
  /**
   * Extra guard evaluated before capturing, alongside the built-in
   * `isSharing`/`previewRef.current` checks (e.g. "no data yet"). Sharing is
   * skipped silently when this returns false, same as the existing checks.
   */
  canShare?: () => boolean;
  /** Called after a successful share — typically the modal's `onClose`. */
  onShared?: () => void;
}

export interface UseShareImageResult {
  templateIndex: number;
  setTemplateIndex: (index: number) => void;
  template: ShareTemplate;
  templates: readonly ShareTemplate[];
  /**
   * T8.2-style texture overlay state (Tanda M3 foundation) — additive so the
   * 11 already-migrated free-tier screens (which never read this field)
   * see no behavior change. Defaults to `'none'` same as the flagship.
   */
  texture: ShareTexture;
  setTexture: (texture: ShareTexture) => void;
  isSharing: boolean;
  previewRef: React.RefObject<LinearGradient | null>;
  handleShare: () => Promise<void>;
}

export function useShareImage({
  templates = FREE_TEMPLATES,
  componentName,
  canShare,
  onShared,
}: UseShareImageOptions): UseShareImageResult {
  const {t} = useLanguage();
  const toast = useToast();

  const [templateIndex, setTemplateIndex] = useState(0);
  const [texture, setTexture] = useState<ShareTexture>('none');
  const [isSharing, setIsSharing] = useState(false);
  const previewRef = useRef<LinearGradient>(null);
  const template = templates[templateIndex];

  async function handleShare() {
    if (isSharing || !previewRef.current) return;
    if (canShare && !canShare()) return;

    try {
      setIsSharing(true);
      haptics.press();

      const uri = await captureRef(previewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!(await Sharing.isAvailableAsync())) {
        toast.error(t.verse.imageShareError);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t.share,
        UTI: 'public.png',
      });

      toast.success(t.verse.imageReady);
      onShared?.();
    } catch (error) {
      logger.error(`Error sharing ${componentName} image`, error as Error, {
        component: componentName,
        action: 'handleShare',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setIsSharing(false);
    }
  }

  return {
    templateIndex,
    setTemplateIndex,
    template,
    templates,
    texture,
    setTexture,
    isSharing,
    previewRef,
    handleShare,
  };
}
