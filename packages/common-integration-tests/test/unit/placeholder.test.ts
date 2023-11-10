import {describe, it, expect} from 'vitest';
import '../../src/momento-vitest-matchers';
describe('placeholder', () => {
  it('should pass', () => {
    expect(10).toBeWithin(0, 11);
    console.log('yay');
  });
});
