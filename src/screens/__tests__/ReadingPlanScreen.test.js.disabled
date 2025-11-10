import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReadingPlanScreen from '../ReadingPlanScreen';
import * as ReadingPlanContext from '../../context/ReadingPlanContext';
import * as UserPreferencesContext from '../../context/UserPreferencesContext';
import { readingPlans } from '../../data/readingPlans';

jest.mock('../../context/ReadingPlanContext', () => ({
  useReadingPlan: jest.fn(),
}));

jest.mock('../../context/UserPreferencesContext', () => ({
  useUserPreferences: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../hooks/useStyles', () => ({
  useStyles: jest.fn(() => ({
    container: { backgroundColor: '#f5f5f5' },
    header: {},
    currentPlanContainer: {},
    currentPlanTitle: {},
    currentPlanName: {},
    planItem: {},
    planName: {},
    planDescription: {},
    planDuration: {},
  })),
}));

describe('ReadingPlanScreen', () => {
  const mockSavePlan = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    ReadingPlanContext.useReadingPlan.mockReturnValue({
      currentPlan: null,
      savePlan: mockSavePlan,
    });

    UserPreferencesContext.useUserPreferences.mockReturnValue({
      nightMode: false,
      fontSize: 'medium',
      fontFamily: 'default',
    });
  });

  it('renders reading plans correctly', () => {
    const { getByText, getAllByText } = render(<ReadingPlanScreen />);

    expect(getByText('Selecciona un Plan de Lectura')).toBeTruthy();
    
    readingPlans.forEach(plan => {
      expect(getByText(plan.name)).toBeTruthy();
      expect(getByText(plan.description)).toBeTruthy();
      expect(getAllByText(`Duración: ${plan.duration} días`).length).toBeGreaterThan(0);
    });
  });

  it('displays current plan when one is selected', () => {
    const currentPlan = readingPlans[0];
    ReadingPlanContext.useReadingPlan.mockReturnValue({
      currentPlan,
      savePlan: mockSavePlan,
    });

    const { getByText, getByTestId } = render(<ReadingPlanScreen />);

    const currentPlanContainer = getByTestId('current-plan-container');
    expect(currentPlanContainer).toBeTruthy();
    expect(getByText('Plan Actual:')).toBeTruthy();
    expect(getByTestId('current-plan-name')).toHaveTextContent(currentPlan.name);
  });

  it('calls savePlan and navigates to Home when a plan is selected', () => {
    const { getByTestId } = render(<ReadingPlanScreen />);

    const planItem = getByTestId(`plan-item-${readingPlans[0].id}`);
    fireEvent.press(planItem);

    expect(mockSavePlan).toHaveBeenCalledWith(readingPlans[0]);
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('applies night mode styles when enabled', () => {
    UserPreferencesContext.useUserPreferences.mockReturnValue({
      nightMode: true,
      fontSize: 'medium',
      fontFamily: 'default',
    });

    const useStylesMock = jest.requireMock('../../hooks/useStyles');
    useStylesMock.useStyles.mockReturnValue({
      container: { backgroundColor: '#121212' },
      // ... otros estilos
    });

    const { getByTestId } = render(<ReadingPlanScreen />);

    const container = getByTestId('reading-plan-screen');
    expect(container.props.style).toHaveProperty('backgroundColor', '#121212');
  });
});