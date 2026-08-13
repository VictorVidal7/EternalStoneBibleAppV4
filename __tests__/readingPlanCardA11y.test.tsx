/**
 * S89 audit — the Home reading-plan card was a bare TouchableOpacity (no role,
 * no label) so a screen reader announced its inner text nodes as plain text
 * with no actionable affordance. Pins the button role, the composed label
 * (name + subtitle + progress), and the action hint (continue/start).
 */
import {render} from '@testing-library/react-native';
import ReadingPlanCard from '../src/components/celestial/ReadingPlanCard';

const mockColors = {
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  primary: '#38bdf8',
  primaryLight: '#7dd3fc',
  primaryDark: '#0284c7',
  info: '#38bdf8',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

jest.mock('../src/components/celestial/ProgressCircle', () => {
  const {View} = require('react-native');
  return {__esModule: true, default: View};
});

describe('ReadingPlanCard a11y (S89)', () => {
  it('exposes a button role with a composed label and action hint', () => {
    const {getByRole} = render(
      <ReadingPlanCard
        name="Salmos en 30 días"
        subtitle="Plan devocional"
        description="Un salmo por día"
        duration={30}
        daysCompleted={12}
        onPress={jest.fn()}
        continueText="Continuar"
      />,
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe(
      'Salmos en 30 días, Plan devocional, 12/30',
    );
    expect(button.props.accessibilityHint).toBe('Continuar');
  });

  it('drops the subtitle from the label when absent', () => {
    const {getByRole} = render(
      <ReadingPlanCard
        name="Proverbios"
        duration={31}
        daysCompleted={0}
        onPress={jest.fn()}
        continueText="Empezar"
      />,
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Proverbios, 0/31');
    expect(button.props.accessibilityHint).toBe('Empezar');
  });
});
