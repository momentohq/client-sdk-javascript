import {
  MomentoRPCMethod,
  MomentoRPCMethodConverter,
} from '../momento-rpc-method';

describe('MomentoRPCMethodConverter', () => {
  it('should convert basic methods correctly', () => {
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get)).toBe('get');
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.Set)).toBe('set');
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.Delete)).toBe(
      'delete'
    );
  });

  it('should convert methods with long names to kebab-case', () => {
    expect(
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.SortedSetLength)
    ).toBe('sorted-set-length');
    expect(
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.DictionaryFetch)
    ).toBe('dictionary-fetch');
    expect(
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.ListConcatenateFront)
    ).toBe('list-concatenate-front');
  });

  it('should throw an error for unsupported methods', () => {
    expect(() =>
      MomentoRPCMethodConverter.convert(
        '_UnsupportedRequest' as MomentoRPCMethod
      )
    ).toThrow('Unsupported MomentoRPCMethod: _UnsupportedRequest');
  });
});
