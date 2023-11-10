import 'jest-extended';
import 'vitest';

interface MyCustomMatchers<T = any> {
  toBePermissionDeniedForCacheGet(): T;
  toBePermissionDeniedForCacheSet(): T;
  toBePermissionDeniedForTopicSubscribe(): T;
  toBePermissionDeniedForTopicPublish(): T;
  toBeHit(expected: string): T;
}
declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T>, MyCustomMatchers<T> {}
  interface ExpectStatic<T = any> extends CustomMatchers<T>, MyCustomMatchers<T> {}
}
