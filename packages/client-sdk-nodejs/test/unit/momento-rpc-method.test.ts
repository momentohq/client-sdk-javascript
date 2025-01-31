import {
  MomentoRPCMethod,
  MomentoRPCMethodMetadataConverter,
} from '../../src/config/retry/momento-rpc-method';

describe('MomentoRPCMethodConverter', () => {
  it('should convert basic methods correctly', () => {
    expect(
      MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.Get)
    ).toBe('get');
    expect(
      MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.Set)
    ).toBe('set');
    expect(
      MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.Delete)
    ).toBe('delete');
  });

  it('should convert PascalCase methods to kebab-case', () => {
    expect(
      MomentoRPCMethodMetadataConverter.convert(
        MomentoRPCMethod.SortedSetLength
      )
    ).toBe('sorted-set-length');
    expect(
      MomentoRPCMethodMetadataConverter.convert(
        MomentoRPCMethod.DictionaryFetch
      )
    ).toBe('dictionary-fetch');
    expect(
      MomentoRPCMethodMetadataConverter.convert(
        MomentoRPCMethod.ListConcatenateFront
      )
    ).toBe('list-concatenate-front');
  });

  it('should handle special cases correctly', () => {
    expect(
      MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.DictionarySet)
    ).toBe('dictionary-set'); // NOT dictionary-set-fields
    expect(
      MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.ListErase)
    ).toBe('list-remove'); // listErase -> list-remove
    expect(
      MomentoRPCMethodMetadataConverter.convert(MomentoRPCMethod.SetIfNotExists)
    ).toBe('set-if'); // setIfNotExists -> set-if
  });

  it('should throw an error for unsupported methods', () => {
    expect(() =>
      MomentoRPCMethodMetadataConverter.convert(
        '_UnsupportedRequest' as MomentoRPCMethod
      )
    ).toThrow('Unsupported MomentoRPCMethod: _UnsupportedRequest');

    expect(() =>
      MomentoRPCMethodMetadataConverter.convert(
        'UnknownMethod' as MomentoRPCMethod
      )
    ).toThrow('Unsupported MomentoRPCMethod: UnknownMethod');
  });
});
