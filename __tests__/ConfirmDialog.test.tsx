/**
 * ConfirmDialog — regression guard for a real device bug reported by Victor:
 * with a long `confirmLabel` ("Importar y reemplazar" / "Import and replace"),
 * the confirm button wrapped to two lines while the adjacent "Cancelar"
 * stayed on one, and the wrapped text left-aligned per line, reading as a
 * broken, mismatched button pair.
 *
 * The fix is presentational (centered wrapped text + matched button height +
 * a within-2-lines font-shrink safety net), so this test pins the concrete
 * style/props that make it work rather than trying to measure real layout
 * (RNTL has no layout engine). If someone strips `textAlign: 'center'` off
 * `buttonText`, or drops the `numberOfLines`/`adjustsFontSizeToFit` guard
 * that stops a long label from truncating, this test catches it.
 */
import {render, fireEvent} from '@testing-library/react-native';
import {ConfirmDialog} from '../src/components/ui/ConfirmDialog';

const mockColors = {
  text: '#0f172a',
  textSecondary: '#475569',
  border: '#cbd5e1',
  surface: '#ffffff',
  cardSolid: '#ffffff',
  primary: '#2563eb',
  onPrimary: '#ffffff',
  error: '#dc2626',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

const LONG_CONFIRM_LABEL = 'Importar y reemplazar';

function flattenStyle(style: unknown): Record<string, unknown> {
  const arr = Array.isArray(style) ? style : [style];
  return Object.assign({}, ...arr.filter(Boolean));
}

// Climb from a descendant node to the nearest ancestor whose flattened style
// paints the given backgroundColor — same pattern as
// achievementModalTheme.test.tsx's bgOfNearestAncestor, generalized to
// return the whole flattened style so borderColor can be inspected too.
function nearestAncestorStyleWithBackground(
  node: {props?: {style?: unknown}; parent?: unknown} | null,
  backgroundColor: string,
): Record<string, unknown> | undefined {
  let cur = node;
  while (cur) {
    const flat = flattenStyle(cur.props?.style);
    if (flat.backgroundColor === backgroundColor) return flat;
    cur = cur.parent as typeof cur;
  }
  return undefined;
}

describe('ConfirmDialog', () => {
  it('renders title, message and both labels', () => {
    const {getByText} = render(
      <ConfirmDialog
        visible
        title="Reemplazar copia de seguridad"
        message="Esto sobrescribirá tus datos actuales."
        confirmLabel={LONG_CONFIRM_LABEL}
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(getByText('Reemplazar copia de seguridad')).toBeTruthy();
    expect(getByText(LONG_CONFIRM_LABEL)).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('fires onConfirm and onCancel when tapped', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const {getByLabelText} = render(
      <ConfirmDialog
        visible
        title="t"
        message="m"
        confirmLabel={LONG_CONFIRM_LABEL}
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByLabelText(LONG_CONFIRM_LABEL));
    fireEvent.press(getByLabelText('Cancelar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('centers wrapped button text and caps it with a shrink-to-fit safety net, for BOTH long and short labels', () => {
    const {getByText} = render(
      <ConfirmDialog
        visible
        title="t"
        message="m"
        confirmLabel={LONG_CONFIRM_LABEL}
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    const confirmText = getByText(LONG_CONFIRM_LABEL);
    const cancelText = getByText('Cancelar');

    for (const node of [confirmText, cancelText]) {
      const flat = flattenStyle(node.props.style);
      // The actual fix: wrapped lines must be centered, not left-aligned,
      // or a 2-line label reads lopsided next to a 1-line sibling.
      expect(flat.textAlign).toBe('center');
      // Safety net so a long/future label shrinks within 2 lines instead
      // of silently truncating the primary CTA's meaning.
      expect(node.props.numberOfLines).toBe(2);
      expect(node.props.adjustsFontSizeToFit).toBe(true);
      expect(node.props.minimumFontScale).toBe(0.8);
    }
  });

  it('gives the confirm and cancel buttons the same minHeight so a short label never renders squat next to a wrapped one', () => {
    const {getAllByRole} = render(
      <ConfirmDialog
        visible
        title="t"
        message="m"
        confirmLabel={LONG_CONFIRM_LABEL}
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    const buttons = getAllByRole('button');
    expect(buttons.length).toBe(2);
    for (const button of buttons) {
      const flat = flattenStyle(button.props.style);
      expect(flat.minHeight).toBe(48);
    }
  });

  it('gives the card a themed border and the backdrop the themed overlay color (Tanda K — high-contrast anti-pattern fix)', () => {
    const {getByText} = render(
      <ConfirmDialog
        visible
        title="Reemplazar copia de seguridad"
        message="Esto sobrescribirá tus datos actuales."
        confirmLabel={LONG_CONFIRM_LABEL}
        cancelLabel="Cancelar"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    const titleNode = getByText('Reemplazar copia de seguridad');

    // Before the fix, the card relied solely on a shadow for separation from
    // the backdrop — invisible when both resolve to near-black under high
    // contrast. The card must now carry an explicit colors.border ring.
    const cardStyle = nearestAncestorStyleWithBackground(
      titleNode,
      mockColors.cardSolid,
    );
    expect(cardStyle?.borderColor).toBe(mockColors.border);
    expect(cardStyle?.borderWidth).toBeGreaterThan(0);

    // The overlay must come from the theme's colors.overlay token (which
    // resolves correctly in high contrast), not a hardcoded staticColors
    // constant that ignores the active theme.
    const overlayStyle = nearestAncestorStyleWithBackground(
      titleNode,
      mockColors.overlay,
    );
    expect(overlayStyle).toBeTruthy();
  });
});
