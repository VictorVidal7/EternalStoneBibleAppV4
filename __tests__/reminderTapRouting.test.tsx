/**
 * v2 "¿Sabías qué?" daily reminder — PropheticReminderRouter now routes TWO
 * notification types by their `data.type` discriminator instead of just one
 * (see the file's own header comment for why the name is now a bit stale).
 *
 * A physical device is the only way to literally "tap" a scheduled
 * notification, so this pins the ROUTING DECISION the component makes from
 * `useLastNotificationResponse()`'s payload — the same seam a real tap
 * ultimately flows through (expo-notifications reconstructs that exact
 * shape from the OS notification tray, cold-start or warm). If this test
 * passes, a real tap is routed identically; the only untested link is
 * expo-notifications itself correctly reporting the tap, which is Expo's
 * own responsibility, not this app's.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {PropheticReminderRouter} from '../src/components/PropheticReminderRouter';
import {
  PROPHECY_REMINDER_TYPE,
  SABIAS_QUE_REMINDER_TYPE,
} from '../src/lib/notifications/NotificationService';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush}),
}));

const mockUseLastNotificationResponse = jest.fn();
const mockClearLastNotificationResponse = jest.fn();
jest.mock('expo-notifications', () => ({
  useLastNotificationResponse: () => mockUseLastNotificationResponse(),
  clearLastNotificationResponse: () => mockClearLastNotificationResponse(),
}));

// NotificationService pulls in bibleDB at import time (for the daily-verse
// scheduler) — stub it the same way __tests__/_layout.test.tsx does so this
// test can import the REAL module (and so exercise the REAL exported type
// discriminators, not a hand-copied literal that could silently drift).
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {},
}));

type NotificationData = {type?: string; index?: number};

function responseWith(data: NotificationData) {
  return {
    notification: {request: {content: {data}}},
  } as unknown as ReturnType<
    typeof import('expo-notifications').useLastNotificationResponse
  >;
}

describe('PropheticReminderRouter — tap routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes a prophecy-daily tap to the prophetic thread at the saved step (unchanged behavior)', () => {
    mockUseLastNotificationResponse.mockReturnValue(
      responseWith({type: PROPHECY_REMINDER_TYPE, index: 7}),
    );
    render(<PropheticReminderRouter />);
    expect(mockPush).toHaveBeenCalledWith('/features/prophecies?start=7');
    expect(mockClearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it('defaults a prophecy-daily tap with no index to step 0 (unchanged behavior)', () => {
    mockUseLastNotificationResponse.mockReturnValue(
      responseWith({type: PROPHECY_REMINDER_TYPE}),
    );
    render(<PropheticReminderRouter />);
    expect(mockPush).toHaveBeenCalledWith('/features/prophecies?start=0');
  });

  it('routes a "¿Sabías qué?" tap to the facts hub (new v2 behavior)', () => {
    mockUseLastNotificationResponse.mockReturnValue(
      responseWith({type: SABIAS_QUE_REMINDER_TYPE}),
    );
    render(<PropheticReminderRouter />);
    expect(mockPush).toHaveBeenCalledWith('/features/facts');
    expect(mockClearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it('does nothing for an unrelated notification type (e.g. daily-verse)', () => {
    mockUseLastNotificationResponse.mockReturnValue(
      responseWith({type: 'daily-verse'}),
    );
    render(<PropheticReminderRouter />);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockClearLastNotificationResponse).not.toHaveBeenCalled();
  });

  it('does nothing when there is no last notification response', () => {
    mockUseLastNotificationResponse.mockReturnValue(undefined);
    render(<PropheticReminderRouter />);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockClearLastNotificationResponse).not.toHaveBeenCalled();
  });
});
