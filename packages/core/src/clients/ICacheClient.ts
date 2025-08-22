import {
  CacheDelete,
  CacheGet,
  CacheGetWithHash,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetFetch,
  CacheSetAddElements,
  CacheSetAddElement,
  CacheSetContainsElement,
  CacheSetContainsElements,
  CacheSetRemoveElements,
  CacheSetRemoveElement,
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
  CacheDictionaryLength,
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
  CacheItemGetType,
  CacheItemGetTtl,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  CacheDictionaryGetFields,
  CacheGetBatch,
  CacheSetBatch,
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
  CacheSetWithHash,
  CacheSetIfPresentAndHashEqual,
  CacheSetIfPresentAndHashNotEqual,
  CacheSetIfAbsentOrHashEqual,
  CacheSetIfAbsentOrHashNotEqual,
} from '../index';
import {
  ListFetchCallOptions,
  ListRetainCallOptions,
  BackTruncatableCallOptions,
  FrontTruncatableCallOptions,
  CollectionCallOptions,
  SortedSetFetchByRankCallOptions,
  SortedSetFetchByScoreCallOptions,
  SortedSetLengthByScoreCallOptions,
  SortedSetGetRankCallOptions,
  SetCallOptions,
  GetCallOptions,
  SetIfAbsentCallOptions,
  SetBatchItem,
  SortedSetSource,
  SortedSetUnionStoreCallOptions,
  GetWithHashCallOptions,
  SetWithHashCallOptions,
  CancellationCallOptions,
  CancellationScalarCallOptions,
} from '../utils';
import {IControlClient, IPingClient} from '../internal/clients';
import {IMomentoCache} from './IMomentoCache';
import {_SortedSetGetScoreResponsePart} from '../messages/responses/grpc-response-types';

// Type aliases to differentiate the different methods' optional arguments.
export type SetOptions = SetCallOptions;
export type GetOptions = GetCallOptions;
export type SetIfNotExistsOptions = CancellationScalarCallOptions;
export type SetIfAbsentOptions = SetIfAbsentCallOptions;
export type SetIfPresentOptions = CancellationScalarCallOptions;
export type SetIfEqualOptions = CancellationScalarCallOptions;
export type SetIfNotEqualOptions = CancellationScalarCallOptions;
export type SetIfPresentAndNotEqualOptions = CancellationScalarCallOptions;
export type SetIfAbsentOrEqualOptions = CancellationScalarCallOptions;
export type SetBatchOptions = SetCallOptions;
export type GetBatchOptions = GetCallOptions;
export type ListConcatenateBackOptions = FrontTruncatableCallOptions;
export type ListConcatenateFrontOptions = BackTruncatableCallOptions;
export type ListPushBackOptions = FrontTruncatableCallOptions;
export type ListPushFrontOptions = BackTruncatableCallOptions;
export type SetAddElementOptions = CollectionCallOptions;
export type SetAddElementsOptions = CollectionCallOptions;
export type DictionarySetFieldOptions = CollectionCallOptions;
export type DictionarySetFieldsOptions = CollectionCallOptions;
export type DictionaryIncrementOptions = CollectionCallOptions;
export type IncrementOptions = CancellationScalarCallOptions;
export type SortedSetPutElementOptions = CollectionCallOptions;
export type SortedSetPutElementsOptions = CollectionCallOptions;
export type SortedSetFetchByRankOptions = SortedSetFetchByRankCallOptions;
export type SortedSetFetchByScoreOptions = SortedSetFetchByScoreCallOptions;
export type SortedSetGetRankOptions = SortedSetGetRankCallOptions;
export type SortedSetIncrementOptions = CollectionCallOptions;
export type SortedSetLengthByScoreOptions = SortedSetLengthByScoreCallOptions;
export type SortedSetUnionStoreOptions = SortedSetUnionStoreCallOptions;
export type GetWithHashOptions = GetWithHashCallOptions;
export type SetWithHashOptions = SetWithHashCallOptions;
export type SetIfPresentAndHashEqualOptions = CancellationScalarCallOptions;
export type SetIfPresentAndHashNotEqualOptions = CancellationScalarCallOptions;
export type SetIfAbsentOrHashEqualOptions = CancellationScalarCallOptions;
export type SetIfAbsentOrHashNotEqualOptions = CancellationScalarCallOptions;
export type SetFetchOptions = CancellationCallOptions;
export type DeleteOptions = CancellationCallOptions;
export type SetContainsElementsOptions = CancellationCallOptions;
export type SetRemoveElementsOptions = CancellationCallOptions;
export type SetSampleOptions = CancellationCallOptions;
export type SetPopOptions = CancellationCallOptions;
export type SetLengthOptions = CancellationCallOptions;
export type ListLengthOptions = CancellationCallOptions;
export type ListPopBackOptions = CancellationCallOptions;
export type ListPopFrontOptions = CancellationCallOptions;
export type ListRemoveValueOptions = CancellationCallOptions;
export type DictionaryGetFieldOptions = CancellationCallOptions;
export type DictionaryFetchOptions = CancellationCallOptions;
export type DictionaryRemoveFieldOptions = CancellationCallOptions;
export type DictionaryLengthOptions = CancellationCallOptions;
export type SortedSetGetScoreOptions = CancellationCallOptions;
export type SortedSetRemoveElementOptions = CancellationCallOptions;
export type SortedSetLengthOptions = CancellationCallOptions;
export type ItemGetTypeOptions = CancellationCallOptions;
export type ItemGetTtlOptions = CancellationCallOptions;
export type KeyExistsOptions = CancellationCallOptions;
export type UpdateTtlOptions = CancellationCallOptions;
export type IncreaseTtlOptions = CancellationCallOptions;
export type DecreaseTtlOptions = CancellationCallOptions;

export interface ICacheClient extends IControlClient, IPingClient {
  cache(cacheName: string): IMomentoCache;

  get(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetOptions
  ): Promise<CacheGet.Response>;
  set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetOptions
  ): Promise<CacheSet.Response>;
  delete(
    cacheName: string,
    key: string | Uint8Array,
    options?: DeleteOptions
  ): Promise<CacheDelete.Response>;
  increment(
    cacheName: string,
    field: string | Uint8Array,
    amount: number,
    options?: IncrementOptions
  ): Promise<CacheIncrement.Response>;
  /**
   * @deprecated use setIfAbsent instead.
   */
  setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfNotExistsOptions
  ): Promise<CacheSetIfNotExists.Response>;
  setIfAbsent(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfAbsentOptions
  ): Promise<CacheSetIfAbsent.Response>;
  setIfPresent(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfPresentOptions
  ): Promise<CacheSetIfPresent.Response>;
  setIfEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfEqualOptions
  ): Promise<CacheSetIfEqual.Response>;
  setIfNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfNotEqualOptions
  ): Promise<CacheSetIfNotEqual.Response>;
  setIfPresentAndNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfPresentAndNotEqualOptions
  ): Promise<CacheSetIfPresentAndNotEqual.Response>;
  setIfAbsentOrEqual(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfAbsentOrEqualOptions
  ): Promise<CacheSetIfAbsentOrEqual.Response>;
  setIfPresentAndHashEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    options?: SetIfPresentAndHashEqualOptions
  ): Promise<CacheSetIfPresentAndHashEqual.Response>;
  setIfPresentAndHashNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    options?: SetIfPresentAndHashNotEqualOptions
  ): Promise<CacheSetIfPresentAndHashNotEqual.Response>;
  setIfAbsentOrHashEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashEqual: Uint8Array,
    options?: SetIfAbsentOrHashEqualOptions
  ): Promise<CacheSetIfAbsentOrHashEqual.Response>;
  setIfAbsentOrHashNotEqual(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    hashNotEqual: Uint8Array,
    options?: SetIfAbsentOrHashNotEqualOptions
  ): Promise<CacheSetIfAbsentOrHashNotEqual.Response>;
  getBatch(
    cacheName: string,
    keys: Array<string | Uint8Array>,
    options?: GetBatchOptions
  ): Promise<CacheGetBatch.Response>;
  setBatch(
    cacheName: string,
    items:
      | Record<string, string | Uint8Array>
      | Map<string | Uint8Array, string | Uint8Array>
      | Array<SetBatchItem>,
    options?: SetBatchOptions
  ): Promise<CacheSetBatch.Response>;
  getWithHash(
    cacheName: string,
    key: string | Uint8Array,
    options?: GetWithHashOptions
  ): Promise<CacheGetWithHash.Response>;
  setWithHash(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetWithHashOptions
  ): Promise<CacheSetWithHash.Response>;
  setFetch(
    cacheName: string,
    setName: string,
    options?: SetFetchOptions
  ): Promise<CacheSetFetch.Response>;
  setAddElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    options?: SetAddElementsOptions
  ): Promise<CacheSetAddElement.Response>;
  setAddElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetAddElementsOptions
  ): Promise<CacheSetAddElements.Response>;
  setContainsElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    options?: SetContainsElementsOptions
  ): Promise<CacheSetContainsElement.Response>;
  setContainsElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetContainsElementsOptions
  ): Promise<CacheSetContainsElements.Response>;
  setRemoveElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array,
    options?: SetRemoveElementsOptions
  ): Promise<CacheSetRemoveElement.Response>;
  setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetRemoveElementsOptions
  ): Promise<CacheSetRemoveElements.Response>;
  setSample(
    cacheName: string,
    setName: string,
    limit: number,
    options?: SetSampleOptions
  ): Promise<CacheSetSample.Response>;
  setPop(
    cacheName: string,
    setName: string,
    count: number,
    options?: SetPopOptions
  ): Promise<CacheSetPop.Response>;
  setLength(
    cacheName: string,
    setName: string,
    options?: SetLengthOptions
  ): Promise<CacheSetLength.Response>;
  listFetch(
    cacheName: string,
    listName: string,
    options?: ListFetchCallOptions
  ): Promise<CacheListFetch.Response>;
  listLength(
    cacheName: string,
    listName: string,
    options?: ListLengthOptions
  ): Promise<CacheListLength.Response>;
  listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    options?: ListPushFrontOptions
  ): Promise<CacheListPushFront.Response>;
  listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    options?: ListPushBackOptions
  ): Promise<CacheListPushBack.Response>;
  listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateBackOptions
  ): Promise<CacheListConcatenateBack.Response>;
  listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateFrontOptions
  ): Promise<CacheListConcatenateFront.Response>;
  listPopBack(
    cacheName: string,
    listName: string,
    options?: ListPopBackOptions
  ): Promise<CacheListPopBack.Response>;
  listPopFront(
    cacheName: string,
    listName: string,
    options?: ListPopFrontOptions
  ): Promise<CacheListPopFront.Response>;
  listRemoveValue(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    options?: ListRemoveValueOptions
  ): Promise<CacheListRemoveValue.Response>;
  listRetain(
    cacheName: string,
    listName: string,
    options?: ListRetainCallOptions
  ): Promise<CacheListRetain.Response>;
  dictionarySetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    options?: DictionarySetFieldOptions
  ): Promise<CacheDictionarySetField.Response>;
  dictionarySetFields(
    cacheName: string,
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>
      | Array<[string, string | Uint8Array]>,
    options?: DictionarySetFieldsOptions
  ): Promise<CacheDictionarySetFields.Response>;
  dictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    options?: DictionaryGetFieldOptions
  ): Promise<CacheDictionaryGetField.Response>;
  dictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[],
    options?: DictionaryGetFieldOptions
  ): Promise<CacheDictionaryGetFields.Response>;
  dictionaryFetch(
    cacheName: string,
    dictionaryName: string,
    options?: DictionaryFetchOptions
  ): Promise<CacheDictionaryFetch.Response>;
  dictionaryIncrement(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    amount?: number,
    options?: DictionaryIncrementOptions
  ): Promise<CacheDictionaryIncrement.Response>;
  dictionaryRemoveField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array,
    options?: DictionaryRemoveFieldOptions
  ): Promise<CacheDictionaryRemoveField.Response>;
  dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[],
    options?: DictionaryRemoveFieldOptions
  ): Promise<CacheDictionaryRemoveFields.Response>;
  dictionaryLength(
    cacheName: string,
    dictionaryName: string,
    options?: DictionaryLengthOptions
  ): Promise<CacheDictionaryLength.Response>;
  sortedSetFetchByRank(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetFetchByRankOptions
  ): Promise<CacheSortedSetFetch.Response>;
  sortedSetFetchByScore(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetFetchByScoreOptions
  ): Promise<CacheSortedSetFetch.Response>;
  sortedSetPutElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    score: number,
    options?: SortedSetPutElementOptions
  ): Promise<CacheSortedSetPutElement.Response>;
  sortedSetPutElements(
    cacheName: string,
    sortedSetName: string,
    elements:
      | Map<string | Uint8Array, number>
      | Record<string, number>
      | Array<[string, number]>,
    options?: SortedSetPutElementsOptions
  ): Promise<CacheSortedSetPutElements.Response>;
  sortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    options?: SortedSetGetRankOptions
  ): Promise<CacheSortedSetGetRank.Response>;
  sortedSetGetScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    options?: SortedSetGetScoreOptions
  ): Promise<CacheSortedSetGetScore.Response>;
  sortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[],
    options?: SortedSetGetScoreOptions
  ): Promise<CacheSortedSetGetScores.Response>;
  sortedSetIncrementScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    amount?: number,
    options?: SortedSetIncrementOptions
  ): Promise<CacheSortedSetIncrementScore.Response>;
  sortedSetRemoveElement(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array,
    options?: SortedSetRemoveElementOptions
  ): Promise<CacheSortedSetRemoveElement.Response>;
  sortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[],
    options?: SortedSetRemoveElementOptions
  ): Promise<CacheSortedSetRemoveElements.Response>;
  sortedSetLength(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetLengthOptions
  ): Promise<CacheSortedSetLength.Response>;
  sortedSetLengthByScore(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetLengthByScoreOptions
  ): Promise<CacheSortedSetLengthByScore.Response>;
  sortedSetUnionStore(
    cacheName: string,
    sortedSetName: string,
    sources: SortedSetSource[],
    options?: SortedSetUnionStoreOptions
  ): Promise<CacheSortedSetUnionStore.Response>;
  itemGetType(
    cacheName: string,
    key: string | Uint8Array,
    options?: ItemGetTypeOptions
  ): Promise<CacheItemGetType.Response>;
  itemGetTtl(
    cacheName: string,
    key: string | Uint8Array,
    options?: ItemGetTtlOptions
  ): Promise<CacheItemGetTtl.Response>;
  keyExists(
    cacheName: string,
    key: string | Uint8Array,
    options?: KeyExistsOptions
  ): Promise<CacheKeyExists.Response>;
  keysExist(
    cacheName: string,
    keys: string[] | Uint8Array[],
    options?: KeyExistsOptions
  ): Promise<CacheKeysExist.Response>;
  updateTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    options?: UpdateTtlOptions
  ): Promise<CacheUpdateTtl.Response>;
  increaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    options?: IncreaseTtlOptions
  ): Promise<CacheIncreaseTtl.Response>;
  decreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number,
    options?: DecreaseTtlOptions
  ): Promise<CacheDecreaseTtl.Response>;
  close(): void;
}
