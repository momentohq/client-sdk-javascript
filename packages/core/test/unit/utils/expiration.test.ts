import {ExpiresAt, ExpiresIn} from '../../../src/utils/expiration';

describe('Expiration', () => {
  describe('ExpiresIn', () => {
    test('expiresIn.never is valid', () => {
      const expiresIn = ExpiresIn.never();

      expect(expiresIn.doesExpire()).toBe(false);
      expect(expiresIn.seconds()).toBe(Infinity);
    });

    test('expiresIn.seconds is valid', () => {
      const expiresIn = ExpiresIn.seconds(10);

      expect(expiresIn.doesExpire()).toBe(true);
      expect(expiresIn.seconds()).toBe(10);
    });

    test('expiresIn.minutes is valid', () => {
      const expiresIn = ExpiresIn.minutes(10);

      expect(expiresIn.doesExpire()).toBe(true);
      expect(expiresIn.seconds()).toBe(600);
    });

    test('expiresIn.hours is valid', () => {
      const expiresIn = ExpiresIn.hours(1);

      expect(expiresIn.doesExpire()).toBe(true);
      expect(expiresIn.seconds()).toBe(3600);
    });

    test('expiresIn.days is valid', () => {
      const expiresIn = ExpiresIn.days(1);

      expect(expiresIn.doesExpire()).toBe(true);
      expect(expiresIn.seconds()).toBe(86400);
    });
  });

  describe('ExpiresAt', () => {
    test('expiresAt.fromEpoch when epoch is null', () => {
      const expiresIn = ExpiresAt.fromEpoch(null);

      expect(expiresIn.doesExpire()).toBe(false);
      expect(expiresIn.epoch()).toBe(Infinity);
    });

    test('expiresAt.fromEpoch', () => {
      const expiresAtEpoch = Date.now() / 1000;
      const expiresIn = ExpiresAt.fromEpoch(expiresAtEpoch);

      expect(expiresIn.doesExpire()).toBe(true);
      expect(expiresIn.epoch()).toBe(expiresAtEpoch);
    });
  });
});
