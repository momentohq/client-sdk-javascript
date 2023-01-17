import {CacheListPushFront} from '../src';

describe('CacheListPushFront', () => {
  describe('#toString', () => {
    it('shows the list length', () => {
      const length = 23;
      const push = new CacheListPushFront.Success(length);

      expect(push.toString()).toEqual(`Success: listLength: ${length}`);
    });
  });
});
