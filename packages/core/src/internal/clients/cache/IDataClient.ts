import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetFetch,
  CacheSetAddElements,
  CacheSetContainsElement,
  CacheSetContainsElements,
  CacheSetRemoveElements,
  CacheListFetch,
  CacheListLength,
  CacheListPushFront,
  CacheListPushBack,
  CacheListConcatenateBack,
  CacheListConcatenateFront,
  CacheListPopBack,
  CacheListPopFront,
  CacheListRemoveValue,
  CacheListRetain,
  CacheDictionarySetField,
  CacheDictionarySetFields,
  CacheDictionaryGetField,
  CacheDictionaryFetch,
  CacheDictionaryIncrement,
  CacheDictionaryRemoveField,
  CacheDictionaryRemoveFields,
  CacheSortedSetFetch,
  CacheSortedSetPutElement,
  CacheSortedSetPutElements,
  CacheSortedSetGetRank,
  CacheSortedSetGetScore,
  CacheSortedSetGetScores,
  CacheSortedSetIncrementScore,
  CacheSortedSetRemoveElement,
  CacheSortedSetLength,
  CacheSortedSetLengthByScore,
  CollectionTtl,
  SortedSetOrder,
  CacheItemGetType,
  CacheItemGetTtl,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  CacheDictionaryLength,
  CacheDictionaryGetFields,
  CacheSetBatch,
  CacheGetBatch,
  CacheSetIfAbsent,
  CacheSetIfPresent,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfPresentAndNotEqual,
  CacheSetIfAbsentOrEqual,
  CacheSetSample,
  CacheSortedSetRemoveElements,
  CacheSetPop,
  CacheSetLength,
  CacheSortedSetUnionStore,
  CacheGetWithHash,
  CacheSetWithHash,
  CacheSetIfPresentAndHashEqual,
  CacheSetIfPresentAndHashNotEqual,
  CacheSetIfAbsentOrHashEqual,
  CacheSetIfAbsentOrHashNotEqual,
} from '../../../index';
import {
  GetBatchCallOptions,
  GetCallOptions,
  SetBatchCallOptions,
  SetBatchItem,
  SetCallOptions,
  SetIfAbsentCallOptions,
  SortedSetAggregate,
  SortedSetSource,
} from '../../../utils';

export interface IDataClient {
  get(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetCallOptions
  ): Promise<CacheGet.Response>;
  getWithHash(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetCallOptions
  ): Promise<CacheGetWithHash.Response>;
  set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetCallOptions
  ): Promise<CacheSet.Response>;
  setWithHash(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetCallOptions
  ): Promise<CacheSetWithHash.Response>;
  delete(
    cacheName: string,
    key: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheDelete.Response>;
  increment(
    cacheName: string,
    field: string | Uint8Array,
    amount: number,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheIncrement.Response>;
  setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfNotExists.Response>;
  setIfAbsent(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfAbsentCallOptions
  ): Promise<CacheSetIfAbsent.Response>;
  setIfPresent(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfPresent.Response>;
  setIfEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    equal: string | Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfEqual.Response>;
  setIfNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    notEqual: string | Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfNotEqual.Response>;
  setIfPresentAndNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    notEqual: string | Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfPresentAndNotEqual.Response>;
  setIfAbsentOrEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    equal: string | Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfAbsentOrEqual.Response>;
  setIfPresentAndHashEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfPresentAndHashEqual.Response>;
  setIfPresentAndHashNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfPresentAndHashNotEqual.Response>;
  setIfAbsentOrHashEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfAbsentOrHashEqual.Response>;
  setIfAbsentOrHashNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    ttl?: number,
    signal?: AbortSignal
  ): Promise<CacheSetIfAbsentOrHashNotEqual.Response>;
  getBatch(
    cacheName: string,
    keys: Array<string | Uint8Array>,
    options?: GetBatchCallOptions
  ): Promise<CacheGetBatch.Response>;
  setBatch(
    cacheName: string,
    items:
      | Record<string, string | Uint8Array>
      | Map<string | Uint8Array, string | Uint8Array>
      | Array<SetBatchItem>,
    options?: SetBatchCallOptions
  ): Promise<CacheSetBatch.Response>;
  setFetch(
    cacheName: string,
    setName: string,
    signal?: AbortSignal
  ): Promise<CacheSetFetch.Response>;
  setAddElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheSetAddElements.Response>;
  setContainsElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheSetContainsElement.Response>;
  setContainsElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheSetContainsElements.Response>;
  setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheSetRemoveElements.Response>;
  setSample(
    cacheName: string,
    setName: string,
    limit: number,
    signal?: AbortSignal
  ): Promise<CacheSetSample.Response>;
  setPop(
    cacheName: string,
    setName: string,
    count: number,
    signal?: AbortSignal
  ): Promise<CacheSetPop.Response>;
  setLength(
    cacheName: string,
    setName: string,
    signal?: AbortSignal
  ): Promise<CacheSetLength.Response>;
  listFetch(
    cacheName: string,
    listName: string,
    startIndex?: number,
    endIndex?: number,
    signal?: AbortSignal
  ): Promise<CacheListFetch.Response>;
  listLength(
    cacheName: string,
    listName: string,
    signal?: AbortSignal
  ): Promise<CacheListLength.Response>;
  listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    truncateBackToSize?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheListPushFront.Response>;
  listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    truncateFrontToSize?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheListPushBack.Response>;
  listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    truncateFrontToSize?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheListConcatenateBack.Response>;
  listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    truncateBackToSize?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheListConcatenateFront.Response>;
  listPopBack(
    cacheName: string,
    listName: string,
    signal?: AbortSignal
  ): Promise<CacheListPopBack.Response>;
  listPopFront(
    cacheName: string,
    listName: string,
    signal?: AbortSignal
  ): Promise<CacheListPopFront.Response>;
  listRemoveValue(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheListRemoveValue.Response>;
  listRetain(
    cacheName: string,
    listName: string,
    startIndex?: number,
    endIndex?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheListRetain.Response>;
  dictionarySetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheDictionarySetField.Response>;
  dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
      | Array<[string, string | Uint8Array]>,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheDictionarySetFields.Response>;
  dictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheDictionaryGetField.Response>;
  dictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheDictionaryGetFields.Response>;
  dictionaryFetch(
    cacheName: string,
    dictionaryName: string,
    signal?: AbortSignal
  ): Promise<CacheDictionaryFetch.Response>;
  dictionaryIncrement(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    amount?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheDictionaryIncrement.Response>;
  dictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheDictionaryRemoveField.Response>;
  dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheDictionaryRemoveFields.Response>;
  dictionaryLength(
    cacheName: string,
    dictionaryName: string,
    signal?: AbortSignal
  ): Promise<CacheDictionaryLength.Response>;
  sortedSetFetchByRank(
    cacheName: string,
    sortedSetName: string,
    order?: SortedSetOrder,
    startRank?: number,
    endRank?: number,
    signal?: AbortSignal
  ): Promise<CacheSortedSetFetch.Response>;
  sortedSetFetchByScore(
    cacheName: string,
    sortedSetName: string,
    order?: SortedSetOrder,
    minScore?: number,
    maxScore?: number,
    offset?: number,
    count?: number,
    signal?: AbortSignal
  ): Promise<CacheSortedSetFetch.Response>;
  sortedSetPutElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    score: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheSortedSetPutElement.Response>;
  sortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements:
      | Map<string | Uint8Array, number>
      | Record<string, number>
      | Array<[string, number]>,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheSortedSetPutElements.Response>;
  sortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    order?: SortedSetOrder,
    signal?: AbortSignal
  ): Promise<CacheSortedSetGetRank.Response>;
  sortedSetGetScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheSortedSetGetScore.Response>;
  sortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheSortedSetGetScores.Response>;
  sortedSetIncrementScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    amount?: number,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheSortedSetIncrementScore.Response>;
  sortedSetRemoveElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheSortedSetRemoveElement.Response>;
  sortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheSortedSetRemoveElements.Response>;
  sortedSetLength(
    cacheName: string,
    sortedSetName: string,
    signal?: AbortSignal
  ): Promise<CacheSortedSetLength.Response>;
  sortedSetLengthByScore(
    cacheName: string,
    sortedSetName: string,
    minScore?: number,
    maxScore?: number,
    signal?: AbortSignal
  ): Promise<CacheSortedSetLengthByScore.Response>;
  sortedSetUnionStore(
    cacheName: string,
    sortedSetName: string,
    sources: SortedSetSource[],
    aggregate?: SortedSetAggregate,
    ttl?: CollectionTtl,
    signal?: AbortSignal
  ): Promise<CacheSortedSetUnionStore.Response>;
  itemGetType(
    cacheName: string,
    key: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheItemGetType.Response>;
  itemGetTtl(
    cacheName: string,
    key: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheItemGetTtl.Response>;
  keyExists(
    cacheName: string,
    key: string | Uint8Array,
    signal?: AbortSignal
  ): Promise<CacheKeyExists.Response>;
  keysExist(
    cacheName: string,
    keys: string[] | Uint8Array[],
    signal?: AbortSignal
  ): Promise<CacheKeysExist.Response>;
  updateTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    signal?: AbortSignal
  ): Promise<CacheUpdateTtl.Response>;
  increaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    signal?: AbortSignal
  ): Promise<CacheIncreaseTtl.Response>;
  decreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    signal?: AbortSignal
  ): Promise<CacheDecreaseTtl.Response>;
  close(): void;
}
