import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetIfPresent,
  CacheSetIfAbsent,
  CacheSetIfEqual,
  CacheSetIfNotEqual,
  CacheSetIfPresentAndNotEqual,
  CacheSetIfAbsentOrEqual,
  CacheSetFetch,
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetContainsElement,
  CacheSetContainsElements,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
  CacheSetSample,
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
  CacheSortedSetUnionStore,
  CacheItemGetType,
  CacheItemGetTtl,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  CacheDictionaryGetFields,
  CacheDictionaryLength,
  CacheGetBatch,
  CacheSetBatch,
  CacheSortedSetRemoveElements,
  CacheSetPop,
  CacheSetLength,
  CacheGetWithHash,
  CacheSetWithHash,
  CacheSetIfAbsentOrHashEqual,
  CacheSetIfAbsentOrHashNotEqual,
  CacheSetIfPresentAndHashEqual,
  CacheSetIfPresentAndHashNotEqual,
} from '../index';
import {
  ScalarCallOptions,
  ListFetchCallOptions,
  ListRetainCallOptions,
  BackTruncatableCallOptions,
  FrontTruncatableCallOptions,
  CollectionCallOptions,
  SortedSetFetchByRankCallOptions,
  SortedSetFetchByScoreCallOptions,
  SortedSetLengthByScoreCallOptions,
  SetBatchItem,
  SortedSetUnionStoreCallOptions,
  SortedSetSource,
} from '../utils';

// Type aliases to differentiate the different methods' optional arguments.
export type SetOptions = ScalarCallOptions;
export type SetWithHashOptions = ScalarCallOptions;
export type SetIfNotExistsOptions = ScalarCallOptions;
export type SetIfAbsentOptions = ScalarCallOptions;
export type SetIfPresentOptions = ScalarCallOptions;
export type SetIfEqualOptions = ScalarCallOptions;
export type SetIfNotEqualOptions = ScalarCallOptions;
export type SetIfPresentAndNotEqualOptions = ScalarCallOptions;
export type SetIfAbsentOrEqualOptions = ScalarCallOptions;
export type SetIfPresentAndHashEqualOptions = ScalarCallOptions;
export type SetIfPresentAndHashNotEqualOptions = ScalarCallOptions;
export type SetIfAbsentOrHashEqualOptions = ScalarCallOptions;
export type SetIfAbsentOrHashNotEqualOptions = ScalarCallOptions;
export type SetBatchOptions = ScalarCallOptions;
export type ListConcatenateBackOptions = FrontTruncatableCallOptions;
export type ListConcatenateFrontOptions = BackTruncatableCallOptions;
export type ListPushBackOptions = FrontTruncatableCallOptions;
export type ListPushFrontOptions = BackTruncatableCallOptions;
export type SetAddElementOptions = CollectionCallOptions;
export type SetAddElementsOptions = CollectionCallOptions;
export type DictionarySetFieldOptions = CollectionCallOptions;
export type DictionarySetFieldsOptions = CollectionCallOptions;
export type DictionaryIncrementOptions = CollectionCallOptions;
export type IncrementOptions = ScalarCallOptions;
export type SortedSetPutElementOptions = CollectionCallOptions;
export type SortedSetPutElementsOptions = CollectionCallOptions;
export type SortedSetFetchByRankOptions = SortedSetFetchByRankCallOptions;
export type SortedSetFetchByScoreOptions = SortedSetFetchByScoreCallOptions;
export type SortedSetIncrementOptions = CollectionCallOptions;
export type SortedSetLengthByScoreOptions = SortedSetLengthByScoreCallOptions;
export type SortedSetUnionStoreOptions = SortedSetUnionStoreCallOptions;

export interface IMomentoCache {
  get(key: string | Uint8Array): Promise<CacheGet.Response>;
  getWithHash(key: string | Uint8Array): Promise<CacheGetWithHash.Response>;
  set(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetOptions
  ): Promise<CacheSet.Response>;
  setWithHash(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetWithHashOptions
  ): Promise<CacheSetWithHash.Response>;
  delete(key: string | Uint8Array): Promise<CacheDelete.Response>;
  increment(
    field: string | Uint8Array,
    amount: number,
    options?: IncrementOptions
  ): Promise<CacheIncrement.Response>;
  setIfNotExists(
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfNotExistsOptions
  ): Promise<CacheSetIfNotExists.Response>;
  setIfAbsent(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetIfAbsentOptions
  ): Promise<CacheSetIfAbsent.Response>;
  setIfPresent(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetIfPresentOptions
  ): Promise<CacheSetIfPresent.Response>;
  setIfEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfEqualOptions
  ): Promise<CacheSetIfEqual.Response>;
  setIfNotEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfNotEqualOptions
  ): Promise<CacheSetIfNotEqual.Response>;
  setIfPresentAndNotEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfPresentAndNotEqualOptions
  ): Promise<CacheSetIfPresentAndNotEqual.Response>;
  setIfAbsentOrEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfAbsentOrEqualOptions
  ): Promise<CacheSetIfAbsentOrEqual.Response>;
  setIfPresentAndHashEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    options?: SetIfPresentAndHashEqualOptions
  ): Promise<CacheSetIfPresentAndHashEqual.Response>;
  setIfPresentAndHashNotEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    options?: SetIfPresentAndHashNotEqualOptions
  ): Promise<CacheSetIfPresentAndHashNotEqual.Response>;
  setIfAbsentOrHashEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    options?: SetIfAbsentOrHashEqualOptions
  ): Promise<CacheSetIfAbsentOrHashEqual.Response>;
  setIfAbsentOrHashNotEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    options?: SetIfAbsentOrHashNotEqualOptions
  ): Promise<CacheSetIfAbsentOrHashNotEqual.Response>;
  getBatch(keys: string[] | Uint8Array[]): Promise<CacheGetBatch.Response>;
  setBatch(
    items:
      | Record<string, string | Uint8Array>
      | Map<string | Uint8Array, string | Uint8Array>
      | Array<SetBatchItem>,
    options?: SetBatchOptions
  ): Promise<CacheSetBatch.Response>;
  setFetch(setName: string): Promise<CacheSetFetch.Response>;
  setAddElement(
    setName: string,
    element: string | Uint8Array,
    options?: SetAddElementsOptions
  ): Promise<CacheSetAddElement.Response>;
  setAddElements(
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetAddElementsOptions
  ): Promise<CacheSetAddElements.Response>;
  setContainsElement(
    setName: string,
    element: string | Uint8Array
  ): Promise<CacheSetContainsElement.Response>;
  setContainsElements(
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetContainsElements.Response>;
  setRemoveElement(
    setName: string,
    element: string | Uint8Array
  ): Promise<CacheSetRemoveElement.Response>;
  setRemoveElements(
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response>;
  setSample(setName: string, limit: number): Promise<CacheSetSample.Response>;
  setPop(setName: string, count: number): Promise<CacheSetPop.Response>;
  setLength(setName: string): Promise<CacheSetLength.Response>;
  listFetch(
    listName: string,
    options?: ListFetchCallOptions
  ): Promise<CacheListFetch.Response>;
  listLength(listName: string): Promise<CacheListLength.Response>;
  listPushFront(
    listName: string,
    value: string | Uint8Array,
    options?: ListPushFrontOptions
  ): Promise<CacheListPushFront.Response>;
  listPushBack(
    listName: string,
    value: string | Uint8Array,
    options?: ListPushBackOptions
  ): Promise<CacheListPushBack.Response>;
  listConcatenateBack(
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateBackOptions
  ): Promise<CacheListConcatenateBack.Response>;
  listConcatenateFront(
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateFrontOptions
  ): Promise<CacheListConcatenateFront.Response>;
  listPopBack(listName: string): Promise<CacheListPopBack.Response>;
  listPopFront(listName: string): Promise<CacheListPopFront.Response>;
  listRemoveValue(
    listName: string,
    value: string | Uint8Array
  ): Promise<CacheListRemoveValue.Response>;
  listRetain(
    listName: string,
    options?: ListRetainCallOptions
  ): Promise<CacheListRetain.Response>;
  dictionarySetField(
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    options?: DictionarySetFieldOptions
  ): Promise<CacheDictionarySetField.Response>;
  dictionarySetFields(
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>,
    options?: DictionarySetFieldsOptions
  ): Promise<CacheDictionarySetFields.Response>;
  dictionaryGetField(
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryGetField.Response>;
  dictionaryGetFields(
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response>;
  dictionaryFetch(
    dictionaryName: string
  ): Promise<CacheDictionaryFetch.Response>;
  dictionaryIncrement(
    dictionaryName: string,
    field: string | Uint8Array,
    amount?: number,
    options?: DictionaryIncrementOptions
  ): Promise<CacheDictionaryIncrement.Response>;
  dictionaryRemoveField(
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryRemoveField.Response>;
  dictionaryRemoveFields(
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryRemoveFields.Response>;
  dictionaryLength(
    dictionaryName: string
  ): Promise<CacheDictionaryLength.Response>;
  sortedSetFetchByRank(
    sortedSetName: string,
    options?: SortedSetFetchByRankOptions
  ): Promise<CacheSortedSetFetch.Response>;
  sortedSetFetchByScore(
    sortedSetName: string,
    options?: SortedSetFetchByScoreOptions
  ): Promise<CacheSortedSetFetch.Response>;
  sortedSetPutElement(
    sortedSetName: string,
    value: string | Uint8Array,
    score: number,
    options?: SortedSetPutElementOptions
  ): Promise<CacheSortedSetPutElement.Response>;
  sortedSetPutElements(
    sortedSetName: string,
    elements: Map<string | Uint8Array, number> | Record<string, number>,
    options?: SortedSetPutElementsOptions
  ): Promise<CacheSortedSetPutElements.Response>;
  sortedSetGetRank(
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetRank.Response>;
  sortedSetGetScore(
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetScore.Response>;
  sortedSetGetScores(
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetGetScores.Response>;
  sortedSetIncrementScore(
    sortedSetName: string,
    value: string | Uint8Array,
    amount?: number,
    options?: SortedSetIncrementOptions
  ): Promise<CacheSortedSetIncrementScore.Response>;
  sortedSetRemoveElement(
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetRemoveElement.Response>;
  sortedSetRemoveElements(
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetRemoveElements.Response>;
  sortedSetLength(
    sortedSetName: string
  ): Promise<CacheSortedSetLength.Response>;
  sortedSetLengthByScore(
    sortedSetName: string,
    options?: SortedSetLengthByScoreOptions
  ): Promise<CacheSortedSetLengthByScore.Response>;
  sortedSetUnionStore(
    sortedSetName: string,
    sources: SortedSetSource[],
    options?: SortedSetUnionStoreOptions
  ): Promise<CacheSortedSetUnionStore.Response>;
  itemGetType(key: string | Uint8Array): Promise<CacheItemGetType.Response>;
  itemGetTtl(key: string | Uint8Array): Promise<CacheItemGetTtl.Response>;
  keyExists(key: string | Uint8Array): Promise<CacheKeyExists.Response>;
  keysExist(keys: string[] | Uint8Array[]): Promise<CacheKeysExist.Response>;
  updateTtl(
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheUpdateTtl.Response>;
  increaseTtl(
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheIncreaseTtl.Response>;
  decreaseTtl(
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheDecreaseTtl.Response>;
  close(): void;
}
