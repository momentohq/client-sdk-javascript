import {CacheGet, MomentoErrorCode} from '@gomomento/sdk-core';
import {expect} from '@jest/globals';
// eslint-disable-next-line node/no-extraneous-import
import type {MatcherFunction} from 'expect';
import {toBeWithin} from 'jest-extended';

const toBePermissionDeniedForCacheGet: MatcherFunction = function (
  received: unknown
) {
  if (!(received instanceof CacheGet.Error)) {
    throw new Error(
      `Expected CacheGet.Error, received ${this.utils.printReceived(received)}`
    );
  }
  const receivedAsError = received;
  const pass =
    receivedAsError.errorCode() === MomentoErrorCode.PERMISSION_ERROR &&
    receivedAsError.message().includes('Insufficient permissions');
  if (pass) {
    // when pass is true, return error message for when expect(x).not.thisFunction() fails
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          received
        )} not to be a PERMISSION_ERROR due to insufficient permissions`,
      pass: true,
    };
  } else {
    // when pass is false, return error message for when expect(x).thisFunction() fails
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          received
        )} to be a PERMISSION_ERROR due to insufficient permissions`,
      pass: false,
    };
  }
};

expect.extend({
  toBeWithin,
  toBePermissionDeniedForCacheGet,
});

declare module 'expect' {
  interface Matchers<R> {
    toBePermissionDeniedForCacheGet(): R;
    toBeWithin(start: number, end: number): R;
  }
}
