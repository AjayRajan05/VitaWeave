import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  acceptConsent,
  hasAcceptedConsent,
  clearConsent,
} from '../lib/consent';

describe('Consent management', () => {
  beforeEach(async () => {
    await clearConsent();
  });

  test('starts without consent', async () => {
    expect(await hasAcceptedConsent()).toBe(false);
  });

  test('accepts and persists consent', async () => {
    await acceptConsent();
    expect(await hasAcceptedConsent()).toBe(true);
  });

  test('clears consent', async () => {
    await acceptConsent();
    await clearConsent();
    expect(await hasAcceptedConsent()).toBe(false);
  });
});
