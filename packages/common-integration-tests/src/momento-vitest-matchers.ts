import {
  CacheGet,
  CacheSet,
  MomentoErrorCode,
  TopicPublish,
  TopicSubscribe,
} from '@gomomento/sdk-core';
import {expect} from 'vitest';
import * as matchers from 'jest-extended';

function toBePermissionDeniedForCacheGet(received: unknown) {
  if (!(received instanceof CacheGet.Response)) {
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
}

function toBePermissionDeniedForCacheSet(received: unknown) {
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
}

function toBePermissionDeniedForTopicSubscribe(received: unknown) {
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
}

function toBePermissionDeniedForTopicPublish(received: unknown) {
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
}

expect.extend({
  ...matchers,
  toBePermissionDeniedForCacheGet,
  toBePermissionDeniedForCacheSet,
  toBePermissionDeniedForTopicSubscribe,
  toBePermissionDeniedForTopicPublish,
  toBeHit(received: unknown, expected: string) {
    if (!(received instanceof CacheGet.Response)) {
      throw new Error('Expected CacheGet.Response');
    }
    const pass =
      received instanceof CacheGet.Hit && received.value() === expected;
    if (pass) {
      // when pass is true, return error message for when expect(x).not.thisFunction() fails
      return {
        message: () =>
          `expected ${this.utils.printReceived(
            received
          )} not to be ${expected}`,
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
  },
});
