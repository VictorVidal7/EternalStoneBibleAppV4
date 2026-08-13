/**
 * Sprint 94 — the Home "Explorar" grid tile. Pins that it renders its title +
 * subtitle and fires the injected onPress (Home wraps it with haptics +
 * router.push), so the four discover surfaces share one tidy, testable tile.
 *
 * The `accentColor` + `variant="dense"` cases below (T-hero-redesign) pin
 * Explorar-todo's additions: the dense row still renders/fires exactly like
 * the card, and the high-contrast fallback — mirroring
 * `app/features/themes/[theme].tsx`'s own `highContrast ? ... : [accent,
 * ...]` guard — means an arbitrary category hex NEVER reaches the rendered
 * icon while high contrast is on; `colors.primary` wins instead.
 */
import {render, fireEvent} from '@testing-library/react-native';
import {Ionicons} from '@expo/vector-icons';
import {DiscoverTile} from '../src/components/home/DiscoverTile';

const mockColors = {
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  primaryLight: '#7dd3fc',
  primaryDark: '#0284c7',
  secondary: '#a78bfa',
  accent: '#34d399',
  info: '#60a5fa',
};

// Mutable per-test, same pattern as hcHeaderGradients.test.tsx.
let mockHighContrast = false;

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: true,
    colors: mockColors,
    get highContrast() {
      return mockHighContrast;
    },
  }),
}));

/**
 * Finds the Ionicons element rendering the tile's OWN accent icon (not the
 * trailing chevron-forward, which is always colors.textTertiary).
 */
function findAccentIcon(
  getAllByType: ReturnType<typeof render>['UNSAFE_getAllByType'],
) {
  const matches = getAllByType(Ionicons).filter(
    v => v.props.name !== 'chevron-forward',
  );
  return matches[0];
}

describe('DiscoverTile', () => {
  beforeEach(() => {
    mockHighContrast = false;
  });

  it('renders the title and subtitle', () => {
    const {getByText} = render(
      <DiscoverTile
        icon="footsteps"
        title="Tu camino"
        subtitle="Tu año en la Palabra"
        onPress={() => {}}
      />,
    );
    expect(getByText('Tu camino')).toBeTruthy();
    expect(getByText('Tu año en la Palabra')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const {getByLabelText} = render(
      <DiscoverTile
        icon="stats-chart"
        title="Mi lectura"
        subtitle="Tus estadísticas"
        onPress={onPress}
      />,
    );
    fireEvent.press(getByLabelText('Mi lectura'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('without accentColor, the icon stays colors.primary (Home never passes it)', () => {
    const {UNSAFE_getAllByType} = render(
      <DiscoverTile
        icon="book"
        title="Diccionario"
        subtitle="Busca términos"
        onPress={() => {}}
      />,
    );
    const icon = findAccentIcon(UNSAFE_getAllByType);
    expect(icon.props.color).toBe(mockColors.primary);
  });

  it('with accentColor, the icon takes the category accent in normal contrast', () => {
    const {UNSAFE_getAllByType} = render(
      <DiscoverTile
        icon="book"
        title="Diccionario"
        subtitle="Busca términos"
        accentColor="#3B82F6"
        onPress={() => {}}
      />,
    );
    const icon = findAccentIcon(UNSAFE_getAllByType);
    expect(icon.props.color).toBe('#3B82F6');
  });

  it('under high contrast, accentColor is dropped in favor of colors.primary', () => {
    mockHighContrast = true;
    const {UNSAFE_getAllByType} = render(
      <DiscoverTile
        icon="book"
        title="Diccionario"
        subtitle="Busca términos"
        accentColor="#3B82F6"
        onPress={() => {}}
      />,
    );
    const icon = findAccentIcon(UNSAFE_getAllByType);
    expect(icon.props.color).toBe(mockColors.primary);
    expect(icon.props.color).not.toBe('#3B82F6');
  });

  describe('variant="dense" (Explorar-todo\'s single-column list)', () => {
    it('renders the title and subtitle, same as the card variant', () => {
      const {getByText} = render(
        <DiscoverTile
          variant="dense"
          icon="map"
          title="Rutas bíblicas"
          subtitle="Las grandes rutas de la Escritura"
          accentColor="#10B981"
          onPress={() => {}}
        />,
      );
      expect(getByText('Rutas bíblicas')).toBeTruthy();
      expect(getByText('Las grandes rutas de la Escritura')).toBeTruthy();
    });

    it('fires onPress when tapped', () => {
      const onPress = jest.fn();
      const {getByLabelText} = render(
        <DiscoverTile
          variant="dense"
          icon="map"
          title="Rutas bíblicas"
          subtitle="Las grandes rutas de la Escritura"
          accentColor="#10B981"
          onPress={onPress}
        />,
      );
      fireEvent.press(getByLabelText('Rutas bíblicas'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
