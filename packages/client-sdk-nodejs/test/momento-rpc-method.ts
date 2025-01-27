enum MomentoRPCMethod {
  Get = '_GetRequest',
  Set = '_SetRequest',
  Delete = '_DeleteRequest',
  Increment = '_IncrementRequest',
  SetIf = '_SetIfRequest',
  SetIfNotExists = '_SetIfNotExistsRequest',
  GetBatch = '_GetBatchRequest',
  SetBatch = '_SetBatchRequest',
  KeysExist = '_KeysExistRequest',
  UpdateTtl = '_UpdateTtlRequest',
  ItemGetTtl = '_ItemGetTtlRequest',
  ItemGetType = '_ItemGetTypeRequest',
  DictionaryGet = '_DictionaryGetRequest',
  DictionaryFetch = '_DictionaryFetchRequest',
  DictionarySet = '_DictionarySetRequest',
  DictionaryIncrement = '_DictionaryIncrementRequest',
  DictionaryDelete = '_DictionaryDeleteRequest',
  DictionaryLength = '_DictionaryLengthRequest',
  SetFetch = '_SetFetchRequest',
  SetSample = '_SetSampleRequest',
  SetUnion = '_SetUnionRequest',
  SetDifference = '_SetDifferenceRequest',
  SetContains = '_SetContainsRequest',
  SetLength = '_SetLengthRequest',
  SetPop = '_SetPopRequest',
  ListPushFront = '_ListPushFrontRequest',
  ListPushBack = '_ListPushBackRequest',
  ListPopFront = '_ListPopFrontRequest',
  ListPopBack = '_ListPopBackRequest',
  ListErase = '_ListEraseRequest',
  ListRemove = '_ListRemoveRequest',
  ListFetch = '_ListFetchRequest',
  ListLength = '_ListLengthRequest',
  ListConcatenateFront = '_ListConcatenateFrontRequest',
  ListConcatenateBack = '_ListConcatenateBackRequest',
  ListRetain = '_ListRetainRequest',
  SortedSetPut = '_SortedSetPutRequest',
  SortedSetFetch = '_SortedSetFetchRequest',
  SortedSetGetScore = '_SortedSetGetScoreRequest',
  SortedSetRemove = '_SortedSetRemoveRequest',
  SortedSetIncrement = '_SortedSetIncrementRequest',
  SortedSetGetRank = '_SortedSetGetRankRequest',
  SortedSetLength = '_SortedSetLengthRequest',
  SortedSetLengthByScore = '_SortedSetLengthByScoreRequest',
}

class MomentoRPCMethodConverter {
  private static readonly rpcMethodToMetadataMap: Record<string, string> =
    Object.fromEntries(
      Object.values(MomentoRPCMethod).map(method => [
        method,
        method
          .replace(/^_/, '')
          .replace(/Request$/, '')
          .toLowerCase(),
      ])
    );

  /**
   * Converts a MomentoRPCMethod enum value to its corresponding metadata type.
   * @param rpcMethod - The MomentoRPCMethod enum value.
   * @returns The corresponding metadata type.
   */
  public static convert(rpcMethod: MomentoRPCMethod): string {
    const metadataType = this.rpcMethodToMetadataMap[rpcMethod];
    if (!metadataType) {
      throw new Error(`Unsupported MomentoRPCMethod: ${rpcMethod}`);
    }
    return metadataType;
  }
}

export {MomentoRPCMethod, MomentoRPCMethodConverter};
