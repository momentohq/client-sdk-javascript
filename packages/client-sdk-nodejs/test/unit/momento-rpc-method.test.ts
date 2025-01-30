import {
  MomentoRPCMethod,
  MomentoRPCMethodConverter,
} from '../../src/config/retry/momento-rpc-method';

describe('MomentoRPCMethodConverter', () => {
  it('should convert basic methods correctly', () => {
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.Get)).toBe('get');
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.Set)).toBe('set');
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.Delete)).toBe(
      'delete'
    );
  });

  it('should convert PascalCase methods to kebab-case', () => {
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

  it('should handle special cases correctly', () => {
    expect(
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.DictionarySet)
    ).toBe('dictionary-set'); // NOT dictionary-set-fields
    expect(MomentoRPCMethodConverter.convert(MomentoRPCMethod.ListErase)).toBe(
      'list-remove'
    ); // listErase -> list-remove
    expect(
      MomentoRPCMethodConverter.convert(MomentoRPCMethod.SetIfNotExists)
    ).toBe('set-if'); // setIfNotExists -> set-if
  });

  it('should throw an error for unsupported methods', () => {
    expect(() =>
      MomentoRPCMethodConverter.convert(
        '_UnsupportedRequest' as MomentoRPCMethod
      )
    ).toThrow('Unsupported MomentoRPCMethod: _UnsupportedRequest');

    expect(() =>
      MomentoRPCMethodConverter.convert('UnknownMethod' as MomentoRPCMethod)
    ).toThrow('Unsupported MomentoRPCMethod: UnknownMethod');
  });
});
