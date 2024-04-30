import {
  CacheGet,
  CacheSet,
  MomentoErrorCode,
  TopicPublish,
  TopicSubscribe,
} from '@gomomento/sdk-core';
import {expect} from '@jest/globals';
// eslint-disable-next-line node/no-extraneous-import
import type {MatcherFunction} from 'expect';
import {toBeWithin} from 'jest-extended';

const toBePermissionDeniedForCacheGet: MatcherFunction = function (
  received: unknown
) {
  const isCacheGetResponse =
    received instanceof CacheGet.Hit ||
    received instanceof CacheGet.Miss ||
    received instanceof CacheGet.Error;
  if (!isCacheGetResponse) {
    throw new Error('Expected CacheGet.Response');
  }
  const pass =
    received instanceof CacheGet.Error &&
    received.errorCode() === MomentoErrorCode.PERMISSION_ERROR &&
    received.message().includes('Insufficient permissions');
  if (pass) {
    // when pass is true, return error message for when expect(x).not.thisFunction() fails
    return {
      message: () =>
        'did not expect a PERMISSION_ERROR due to insufficient permissions',
      pass: true,
    };
  } else {
    // when pass is false, return error message for when expect(x).thisFunction() fails
    return {
      message: () =>
        'expected a PERMISSION_ERROR due to insufficient permissions',
      pass: false,
    };
  }
};

const toBePermissionDeniedForCacheSet: MatcherFunction = function (
  received: unknown
) {
  if (!(received instanceof CacheSet.Response)) {
    throw new Error('Expected CacheSet.Response');
  }
  const pass =
    received instanceof CacheSet.Error &&
    received.errorCode() === MomentoErrorCode.PERMISSION_ERROR &&
    received.message().includes('Insufficient permissions');
  if (pass) {
    // when pass is true, return error message for when expect(x).not.thisFunction() fails
    return {
      message: () =>
        'did not expect a PERMISSION_ERROR due to insufficient permissions',
      pass: true,
    };
  } else {
    // when pass is false, return error message for when expect(x).thisFunction() fails
    return {
      message: () =>
        'expected a PERMISSION_ERROR due to insufficient permissions',
      pass: false,
    };
  }
};

const toBePermissionDeniedForTopicSubscribe: MatcherFunction = function (
  received: unknown
) {
  if (!(received instanceof TopicSubscribe.Response)) {
    throw new Error('Expected TopicSubscribe.Response');
  }
  const pass =
    received instanceof TopicSubscribe.Error &&
    received.errorCode() === MomentoErrorCode.PERMISSION_ERROR &&
    received.message().includes('Insufficient permissions');
  if (pass) {
    // when pass is true, return error message for when expect(x).not.thisFunction() fails
    return {
      message: () =>
        'did not expect a PERMISSION_ERROR due to insufficient permissions',
      pass: true,
    };
  } else {
    // when pass is false, return error message for when expect(x).thisFunction() fails
    return {
      message: () =>
        'expected a PERMISSION_ERROR due to insufficient permissions',
      pass: false,
    };
  }
};

const toBePermissionDeniedForTopicPublish: MatcherFunction = function (
  received: unknown
) {
  if (!(received instanceof TopicPublish.Response)) {
    throw new Error('Expected TopicPublish.Response');
  }
  const pass =
    received instanceof TopicPublish.Error &&
    received.errorCode() === MomentoErrorCode.PERMISSION_ERROR &&
    received.message().includes('Insufficient permissions');
  if (pass) {
    // when pass is true, return error message for when expect(x).not.thisFunction() fails
    return {
      message: () =>
        'did not expect a PERMISSION_ERROR due to insufficient permissions',
      pass: true,
    };
  } else {
    // when pass is false, return error message for when expect(x).thisFunction() fails
    return {
      message: () =>
        'expected a PERMISSION_ERROR due to insufficient permissions',
      pass: false,
    };
  }
};

const toBeHit: MatcherFunction<[expected: string]> = function (
  received: unknown,
  expected: string
) {
  const isCacheGetResponse =
    received instanceof CacheGet.Hit ||
    received instanceof CacheGet.Miss ||
    received instanceof CacheGet.Error;
  if (!isCacheGetResponse) {
    throw new Error('Expected CacheGet.Response');
  }
  const pass =
    received instanceof CacheGet.Hit && received.value() === expected;
  if (pass) {
    // when pass is true, return error message for when expect(x).not.thisFunction() fails
    return {
      message: () =>
        `expected ${this.utils.printReceived(received)} not to be ${expected}`,
      pass: true,
    };
  } else {
    // when pass is false, return error message for when expect(x).thisFunction() fails
    return {
      message: () =>
        `expected ${this.utils.printReceived(received)} to be ${expected}`,
      pass: false,
    };
  }
};

expect.extend({
  toBeWithin,
  toBePermissionDeniedForCacheGet,
  toBePermissionDeniedForCacheSet,
  toBePermissionDeniedForTopicSubscribe,
  toBePermissionDeniedForTopicPublish,
  toBeHit,
});

declare module 'expect' {
  interface Matchers<R> {
    toBePermissionDeniedForCacheGet(): R;
    toBePermissionDeniedForCacheSet(): R;
    toBePermissionDeniedForTopicSubscribe(): R;
    toBePermissionDeniedForTopicPublish(): R;
    toBeHit(expected: string): R;
    toBeWithin(start: number, end: number): R;
  }
}
