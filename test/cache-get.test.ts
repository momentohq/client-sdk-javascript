import * as CacheGet from '../src/messages/responses/cache-get';
import {TextEncoder} from 'util';

const TEXT_ENCODER = new TextEncoder();

describe('CacheGet', () => {
  describe('#toString()', () => {
    it('shows a short value', () => {
      const value = 'Napoleon';
      const hit = new CacheGet.Hit(TEXT_ENCODER.encode(value));

      expect(hit.toString()).toEqual(`Hit: ${value}`);
    });

    it('shows truncates long value', () => {
      const value = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
      const truncatedValue = 'Pneumonoultramicroscopicsilicovo...';
      const hit = new CacheGet.Hit(TEXT_ENCODER.encode(value));

      expect(hit.toString()).toEqual(`Hit: ${truncatedValue}`);
    });
  });
});
