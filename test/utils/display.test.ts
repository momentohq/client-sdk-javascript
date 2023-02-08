import {truncateStringArray} from '../../src/internal/utils/display';

describe('string array trunctation logic', () => {
  it('should not truncate when array is not that big', () => {
    const result = truncateStringArray(['foo', 'bar']);
    expect(result).toEqual(['foo', 'bar']);
  });
  it('should truncate a single element that is too long', () => {
    const result = truncateStringArray([
      'foooooooooooooooooooooooooooooooooooo',
      'bar',
    ]);
    expect(result).toEqual(['fooooooooooooooooooooooooooooooo...', 'bar']);
  });
  it('should truncate both on elements and on the whole list', () => {
    const result = truncateStringArray([
      'foooooooooooooooooooooooooooooooooooo',
      'bar',
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(result).toEqual([
      'fooooooooooooooooooooooooooooooo...',
      'bar',
      '1',
      '2',
      '3',
      '...',
    ]);
  });
});
