/**
 * 💡 useContextualHint — the trigger side of the contextual-hints layer.
 *
 * One call site per hint (e.g. Home's "Ver todo" callout, the reader's
 * Focus-mode callout — see src/lib/onboarding/contextualHints.ts for the
 * full design rationale and the judgment calls behind it). Resolves to
 * `visible: true` at most ONCE per install for a given `hintId`: the
 * first time it's called, with the first-run wizard already completed,
 * at least `HINT_ELIGIBLE_AFTER_SESSIONS` app sessions in, and that hint
 * not already dismissed.
 *
 * Reads `useOnboarding().completed` (read-only) to confirm the wizard is
 * done — this is belt-and-suspenders on top of the structural guarantee
 * that the screens rendering a hint don't mount until onboarding is
 * complete (see app/_layout.tsx's onboardingCompleted gate): an explicit
 * check here means this hook stays correct even if a hint component is
 * ever reused somewhere reachable before that gate. Never writes to
 * `@onboarding_completed` — only this module's own keys.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useState} from 'react';
import {useOnboarding} from './useOnboarding';
import {
  type ContextualHintId,
  computeHintsEligible,
  dismissHint,
  getOrIncrementSessionCount,
  isHintDismissed,
} from '@lib/onboarding/contextualHints';

export interface UseContextualHintResult {
  /** Render the hint now. False while hydrating, before onboarding is
   * done, before the eligibility delay has elapsed, or once dismissed. */
  visible: boolean;
  /** Call when the hint finishes hiding (explicit close OR its own
   * auto-dismiss timer) — persists the dismissal so it never shows again.
   * Deliberately NOT called on mount/first render — see
   * `dismissHint`'s doc comment for why. */
  dismiss: () => void;
}

export function useContextualHint(
  hintId: ContextualHintId,
): UseContextualHintResult {
  const {completed: onboardingCompleted} = useOnboarding();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Still hydrating the wizard flag, or the wizard itself is pending —
    // never show (also structurally unreachable, per the module doc).
    if (onboardingCompleted !== true) return;

    let cancelled = false;
    (async () => {
      const [sessionCount, dismissed] = await Promise.all([
        getOrIncrementSessionCount(),
        isHintDismissed(hintId),
      ]);
      if (cancelled) return;
      if (dismissed) return;
      if (!computeHintsEligible(sessionCount, onboardingCompleted)) return;
      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hintId, onboardingCompleted]);

  const dismiss = () => {
    setVisible(false);
    void dismissHint(hintId);
  };

  return {visible, dismiss};
}
