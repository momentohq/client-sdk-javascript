import * as CacheListFetch from '../src/messages/responses/cache-list-fetch';
import {Buffer} from 'node:buffer';

describe('CacheListFetch', () => {
  describe('#toString()', () => {
    it('limits the size of the list and elements', () => {
      const longValue = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
      const truncatedValue = 'Pneumonoultramicroscopicsilicovo...';
      const values = [
        'short',
        '345',
        longValue,
        'that',
        'up',
        'down',
        'left',
        'right',
      ];
      const hit = new CacheListFetch.Hit(values.map(v => Buffer.from(v)));

      expect(hit.toString()).toEqual(
        `Hit: [short,345,${truncatedValue},that,up,...]`
      );
    });

    it('shows a short list', () => {
      const values = ['short', 'list'];
      const hit = new CacheListFetch.Hit(values.map(v => Buffer.from(v)));

      expect(hit.toString()).toEqual('Hit: [short,list]');
    });
  });
});
