/**
 * Tanda M3 foundation — PremiumShareExtras, the composite premium-aware
 * template/texture/"Mis estilos" row destined for the 12 non-verse share
 * screens. Fully controlled from outside (isPremium/onLockedAction are
 * props), so this renders directly with no PremiumContext/
 * OfferingSheetContext wiring needed — mirrors how AchievementImageModal's
 * own test mocks just useTheme/useLanguage/ToastContext/haptics.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PremiumShareExtras,
  type PremiumShareExtrasProps,
} from '../src/features/share/PremiumShareExtras';
import {SHARE_TEMPLATES} from '../src/features/share/imageTemplates';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  primaryDark: '#0ea5e9',
  primaryLight: '#1e293b',
  border: '#374151',
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
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));
jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));

const freeTemplate = SHARE_TEMPLATES.find(tpl => tpl.tier === 'free')!;
const premiumTemplate = SHARE_TEMPLATES.find(tpl => tpl.tier === 'premium')!;
const templates = [freeTemplate, premiumTemplate];

function renderExtras(overrides: Partial<PremiumShareExtrasProps> = {}) {
  const onSelectTemplate = jest.fn();
  const onSelectTexture = jest.fn();
  const onLockedAction = jest.fn();
  const utils = render(
    <PremiumShareExtras
      templates={templates}
      templateIndex={0}
      onSelectTemplate={onSelectTemplate}
      texture="none"
      onSelectTexture={onSelectTexture}
      isPremium={false}
      onLockedAction={onLockedAction}
      {...overrides}
    />,
  );
  return {...utils, onSelectTemplate, onSelectTexture, onLockedAction};
}

describe('PremiumShareExtras — template row', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('marks the premium template as locked for a free user', async () => {
    const {findByLabelText} = renderExtras();
    expect(await findByLabelText(/Estilo 2 · /)).toBeTruthy();
  });

  it('routes a locked template tap to onLockedAction, not onSelectTemplate', async () => {
    const {findByLabelText, onSelectTemplate, onLockedAction} = renderExtras();
    fireEvent.press(await findByLabelText(/Estilo 2 · /));
    expect(onLockedAction).toHaveBeenCalledTimes(1);
    expect(onSelectTemplate).not.toHaveBeenCalled();
  });

  it('selects a free/unlocked template directly (no offering suffix)', async () => {
    const {findByLabelText, onSelectTemplate, onLockedAction} = renderExtras();
    fireEvent.press(await findByLabelText('Estilo 1'));
    expect(onSelectTemplate).toHaveBeenCalledWith(0);
    expect(onLockedAction).not.toHaveBeenCalled();
  });

  it('never locks any template once the user is premium', async () => {
    const {findByLabelText} = renderExtras({isPremium: true});
    expect(await findByLabelText('Estilo 2')).toBeTruthy();
  });
});

describe('PremiumShareExtras — texture row', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('marks dots/lines/grain as locked for a free user, "None" stays free', async () => {
    const {findByLabelText} = renderExtras();
    expect(await findByLabelText('Ninguna')).toBeTruthy();
    expect(await findByLabelText(/Puntos · /)).toBeTruthy();
    expect(await findByLabelText(/Líneas · /)).toBeTruthy();
    expect(await findByLabelText(/Grano · /)).toBeTruthy();
  });

  it('routes a locked texture tap to onLockedAction, not onSelectTexture', async () => {
    const {findByLabelText, onSelectTexture, onLockedAction} = renderExtras();
    fireEvent.press(await findByLabelText(/Puntos · /));
    expect(onLockedAction).toHaveBeenCalledTimes(1);
    expect(onSelectTexture).not.toHaveBeenCalled();
  });

  it('applies an unlocked texture directly once premium', async () => {
    const {findByLabelText, onSelectTexture, onLockedAction} = renderExtras({
      isPremium: true,
    });
    fireEvent.press(await findByLabelText('Puntos'));
    expect(onSelectTexture).toHaveBeenCalledWith('dots');
    expect(onLockedAction).not.toHaveBeenCalled();
  });

  it('reverts a non-none texture back to none if premium is lost', () => {
    const onSelectTexture = jest.fn();
    renderExtras({isPremium: false, texture: 'dots', onSelectTexture});
    expect(onSelectTexture).toHaveBeenCalledWith('none');
  });

  it('does not revert a non-none texture while premium is active', () => {
    const onSelectTexture = jest.fn();
    renderExtras({isPremium: true, texture: 'dots', onSelectTexture});
    expect(onSelectTexture).not.toHaveBeenCalled();
  });
});

describe('PremiumShareExtras — "Mis estilos" (compact presets)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('routes a free user\'s "Guardar estilo" tap to onLockedAction', async () => {
    const {findByLabelText, onLockedAction} = renderExtras();
    fireEvent.press(await findByLabelText(/Guardar estilo · /));
    expect(onLockedAction).toHaveBeenCalledTimes(1);
  });

  it('saves and lists a preset once premium, then can delete it', async () => {
    const {findByLabelText, findByText, queryByText} = renderExtras({
      isPremium: true,
    });

    fireEvent.press(await findByLabelText('Guardar estilo'));
    expect(await findByText('Estilo 1')).toBeTruthy();

    fireEvent.press(await findByLabelText('Eliminar estilo'));
    await waitFor(() => expect(queryByText('Estilo 1')).toBeNull());
  });

  it('applying a saved preset restores its template + texture', async () => {
    const onSelectTemplate = jest.fn();
    const onSelectTexture = jest.fn();
    const {findByLabelText, findByText} = renderExtras({
      isPremium: true,
      templateIndex: 1,
      texture: 'dots',
      onSelectTemplate,
      onSelectTexture,
    });

    fireEvent.press(await findByLabelText('Guardar estilo'));
    const chip = await findByText('Estilo 1');

    // Re-render as if the user had since switched to the free template with
    // no texture, then taps the saved preset chip to restore the look.
    fireEvent.press(chip);
    expect(onSelectTemplate).toHaveBeenCalledWith(1);
    expect(onSelectTexture).toHaveBeenCalledWith('dots');
  });
});
