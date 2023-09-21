import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetFetch,
  CacheSetAddElements,
  CacheSetAddElement,
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
} from '../utils';
import {IControlClient, IPingClient} from '../internal/clients';
import {IMomentoCache} from './IMomentoCache';

// Type aliases to differentiate the different methods' optional arguments.
export type SetOptions = ScalarCallOptions;
export type SetIfNotExistsOptions = ScalarCallOptions;
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

export interface ICacheClient extends IControlClient, IPingClient {
  cache(cacheName: string): IMomentoCache;

  get(cacheName: string, key: string | Uint8Array): Promise<CacheGet.Response>;
  set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetOptions
  ): Promise<CacheSet.Response>;
  delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheDelete.Response>;
  increment(
    cacheName: string,
    field: string | Uint8Array,
    amount: number,
    options?: IncrementOptions
  ): Promise<CacheIncrement.Response>;
  setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfNotExistsOptions
  ): Promise<CacheSetIfNotExists.Response>;
  setFetch(cacheName: string, setName: string): Promise<CacheSetFetch.Response>;
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
  setRemoveElement(
    cacheName: string,
    setName: string,
    element: string | Uint8Array
  ): Promise<CacheSetRemoveElement.Response>;
  setRemoveElements(
    cacheName: string,
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response>;
  listFetch(
    cacheName: string,
    listName: string,
    options?: ListFetchCallOptions
  ): Promise<CacheListFetch.Response>;
  listLength(
    cacheName: string,
    listName: string
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
    listName: string
  ): Promise<CacheListPopBack.Response>;
  listPopFront(
    cacheName: string,
    listName: string
  ): Promise<CacheListPopFront.Response>;
  listRemoveValue(
    cacheName: string,
    listName: string,
    value: string | Uint8Array
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
      | Record<string, string | Uint8Array>,
    options?: DictionarySetFieldsOptions
  ): Promise<CacheDictionarySetFields.Response>;
  dictionaryGetField(
    cacheName: string,
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryGetField.Response>;
  dictionaryGetFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response>;
  dictionaryFetch(
    cacheName: string,
    dictionaryName: string
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
    field: string | Uint8Array
  ): Promise<CacheDictionaryRemoveField.Response>;
  dictionaryRemoveFields(
    cacheName: string,
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryRemoveFields.Response>;
  dictionaryLength(
    cacheName: string,
    dictionaryName: string
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
    elements: Map<string | Uint8Array, number> | Record<string, number>,
    options?: SortedSetPutElementsOptions
  ): Promise<CacheSortedSetPutElements.Response>;
  sortedSetGetRank(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetRank.Response>;
  sortedSetGetScore(
    cacheName: string,
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetScore.Response>;
  sortedSetGetScores(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[]
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
    value: string | Uint8Array
  ): Promise<CacheSortedSetRemoveElement.Response>;
  sortedSetRemoveElements(
    cacheName: string,
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetRemoveElement.Response>;
  sortedSetLength(
    cacheName: string,
    sortedSetName: string
  ): Promise<CacheSortedSetLength.Response>;
  sortedSetLengthByScore(
    cacheName: string,
    sortedSetName: string,
    options?: SortedSetLengthByScoreOptions
  ): Promise<CacheSortedSetLengthByScore.Response>;
  itemGetType(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheItemGetType.Response>;
  itemGetTtl(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheItemGetTtl.Response>;
  keyExists(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheKeyExists.Response>;
  keysExist(
    cacheName: string,
    keys: string[] | Uint8Array[]
  ): Promise<CacheKeysExist.Response>;
  updateTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheUpdateTtl.Response>;
  increaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheIncreaseTtl.Response>;
  decreaseTtl(
    cacheName: string,
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheDecreaseTtl.Response>;
}
