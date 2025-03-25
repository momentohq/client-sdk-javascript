enum MomentoRPCMethod {
  Get = '_GetRequest',
  GetWithHash = '_GetWithHashRequest',
  Set = '_SetRequest',
  Delete = '_DeleteRequest',
  Increment = '_IncrementRequest',
  SetIf = '_SetIfRequest',
  SetIfHash = '_SetIfHashRequest',
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
  TopicPublish = '_PublishRequest',
  TopicSubscribe = '_SubscriptionRequest',
}

class MomentoRPCMethodMetadataConverter {
  private static readonly rpcMethodToMetadataMap: Record<string, string> = {
    [MomentoRPCMethod.Get]: 'get',
    [MomentoRPCMethod.GetWithHash]: 'get-with-hash',
    [MomentoRPCMethod.Set]: 'set',
    [MomentoRPCMethod.SetIfHash]: 'set-if-hash',
    [MomentoRPCMethod.Delete]: 'delete',
    [MomentoRPCMethod.Increment]: 'increment',
    [MomentoRPCMethod.SetIf]: 'set-if',
    [MomentoRPCMethod.SetIfNotExists]: 'set-if',
    [MomentoRPCMethod.GetBatch]: 'get-batch',
    [MomentoRPCMethod.SetBatch]: 'set-batch',
    [MomentoRPCMethod.KeysExist]: 'keys-exist',
    [MomentoRPCMethod.UpdateTtl]: 'update-ttl',
    [MomentoRPCMethod.ItemGetTtl]: 'item-get-ttl',
    [MomentoRPCMethod.ItemGetType]: 'item-get-type',

    // Special cases as accepted by momento-local: https://github.com/momentohq/momento-local/blob/main/src/cache/service/middlewares/rpc.rs#L51
    [MomentoRPCMethod.DictionarySet]: 'dictionary-set',
    [MomentoRPCMethod.DictionaryGet]: 'dictionary-get',
    [MomentoRPCMethod.DictionaryFetch]: 'dictionary-fetch',
    [MomentoRPCMethod.DictionaryIncrement]: 'dictionary-increment',
    [MomentoRPCMethod.DictionaryDelete]: 'dictionary-delete',
    [MomentoRPCMethod.DictionaryLength]: 'dictionary-length',

    [MomentoRPCMethod.SetFetch]: 'set-fetch',
    [MomentoRPCMethod.SetSample]: 'set-sample',
    [MomentoRPCMethod.SetUnion]: 'set-union',
    [MomentoRPCMethod.SetDifference]: 'set-difference',
    [MomentoRPCMethod.SetContains]: 'set-contains',
    [MomentoRPCMethod.SetLength]: 'set-length',
    [MomentoRPCMethod.SetPop]: 'set-pop',

    [MomentoRPCMethod.ListPushFront]: 'list-push-front',
    [MomentoRPCMethod.ListPushBack]: 'list-push-back',
    [MomentoRPCMethod.ListPopFront]: 'list-pop-front',
    [MomentoRPCMethod.ListPopBack]: 'list-pop-back',
    [MomentoRPCMethod.ListErase]: 'list-remove', // Alias for list-remove
    [MomentoRPCMethod.ListRemove]: 'list-remove',
    [MomentoRPCMethod.ListFetch]: 'list-fetch',
    [MomentoRPCMethod.ListLength]: 'list-length',
    [MomentoRPCMethod.ListConcatenateFront]: 'list-concatenate-front',
    [MomentoRPCMethod.ListConcatenateBack]: 'list-concatenate-back',
    [MomentoRPCMethod.ListRetain]: 'list-retain',

    [MomentoRPCMethod.SortedSetPut]: 'sorted-set-put',
    [MomentoRPCMethod.SortedSetFetch]: 'sorted-set-fetch',
    [MomentoRPCMethod.SortedSetGetScore]: 'sorted-set-get-score',
    [MomentoRPCMethod.SortedSetRemove]: 'sorted-set-remove',
    [MomentoRPCMethod.SortedSetIncrement]: 'sorted-set-increment',
    [MomentoRPCMethod.SortedSetGetRank]: 'sorted-set-get-rank',
    [MomentoRPCMethod.SortedSetLength]: 'sorted-set-length',
    [MomentoRPCMethod.SortedSetLengthByScore]: 'sorted-set-length-by-score',

    [MomentoRPCMethod.TopicPublish]: 'topic-publish',
    [MomentoRPCMethod.TopicSubscribe]: 'topic-subscribe',
  };

  /**
   * Converts a MomentoRPCMethod enum value to its corresponding metadata type.
   * @param rpcMethod - The rpc method to convert.
   * @returns The corresponding metadata type.
   */
  public static convert(rpcMethod: string): string {
    const metadataType = this.rpcMethodToMetadataMap[rpcMethod];
    if (!metadataType) {
      throw new Error(`Unsupported MomentoRPCMethod: ${rpcMethod}`);
    }
    return metadataType;
  }
}

export {MomentoRPCMethod, MomentoRPCMethodMetadataConverter};
