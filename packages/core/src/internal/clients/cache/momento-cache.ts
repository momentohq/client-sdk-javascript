import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
  CacheSetIfAbsent,
  CacheSetIfPresent,
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
  CacheItemGetType,
  CacheItemGetTtl,
  CacheKeyExists,
  CacheKeysExist,
  CacheUpdateTtl,
  CacheIncreaseTtl,
  CacheDecreaseTtl,
  ICacheClient,
  CacheSortedSetRemoveElements,
  CacheDictionaryGetFields,
  CacheDictionaryLength,
  CacheGetBatch,
  CacheSetBatch,
  CacheSetSample,
  CacheSetPop,
  CacheSetLength,
  CacheSortedSetUnionStore,
  CacheGetWithHash,
  CacheSetWithHash,
} from '../../../index';
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
  SortedSetSource,
  SortedSetUnionStoreCallOptions,
} from '../../../utils';
import {IMomentoCache} from '../../../clients/IMomentoCache';

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

export class MomentoCache implements IMomentoCache {
  private readonly cacheClient: ICacheClient;
  private readonly cacheName: string;
  constructor(cacheClient: ICacheClient, cacheName: string) {
    this.cacheClient = cacheClient;
    this.cacheName = cacheName;
  }

  get(key: string | Uint8Array): Promise<CacheGet.Response> {
    return this.cacheClient.get(this.cacheName, key);
  }
  getWithHash(key: string | Uint8Array): Promise<CacheGetWithHash.Response> {
    return this.cacheClient.getWithHash(this.cacheName, key);
  }
  set(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetOptions
  ): Promise<CacheSet.Response> {
    return this.cacheClient.set(this.cacheName, key, value, options);
  }
  setWithHash(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetWithHashOptions
  ): Promise<CacheSetWithHash.Response> {
    return this.cacheClient.setWithHash(this.cacheName, key, value, options);
  }
  delete(key: string | Uint8Array): Promise<CacheDelete.Response> {
    return this.cacheClient.delete(this.cacheName, key);
  }
  increment(
    field: string | Uint8Array,
    amount: number,
    options?: IncrementOptions
  ): Promise<CacheIncrement.Response> {
    return this.cacheClient.increment(this.cacheName, field, amount, options);
  }
  setIfNotExists(
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfNotExistsOptions
  ): Promise<CacheSetIfNotExists.Response> {
    return this.cacheClient.setIfNotExists(this.cacheName, key, field, options);
  }
  setIfAbsent(
    key: string | Uint8Array,
    field: string | Uint8Array,
    options?: SetIfAbsentOptions
  ): Promise<CacheSetIfAbsent.Response> {
    return this.cacheClient.setIfAbsent(this.cacheName, key, field, options);
  }
  setIfPresent(
    key: string | Uint8Array,
    value: string | Uint8Array,
    options?: SetIfPresentOptions
  ): Promise<CacheSetIfPresent.Response> {
    return this.cacheClient.setIfPresent(this.cacheName, key, value, options);
  }
  setIfEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfEqualOptions
  ): Promise<CacheSetIfEqual.Response> {
    return this.cacheClient.setIfEqual(
      this.cacheName,
      key,
      value,
      equal,
      options
    );
  }
  setIfNotEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfNotEqualOptions
  ): Promise<CacheSetIfNotEqual.Response> {
    return this.cacheClient.setIfNotEqual(
      this.cacheName,
      key,
      value,
      notEqual,
      options
    );
  }
  setIfPresentAndNotEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    notEqual: string | Uint8Array,
    options?: SetIfPresentAndNotEqualOptions
  ): Promise<CacheSetIfPresentAndNotEqual.Response> {
    return this.cacheClient.setIfPresentAndNotEqual(
      this.cacheName,
      key,
      value,
      notEqual,
      options
    );
  }
  setIfAbsentOrEqual(
    key: string | Uint8Array,
    value: string | Uint8Array,
    equal: string | Uint8Array,
    options?: SetIfAbsentOrEqualOptions
  ): Promise<CacheSetIfAbsentOrEqual.Response> {
    return this.cacheClient.setIfAbsentOrEqual(
      this.cacheName,
      key,
      value,
      equal,
      options
    );
  }
  getBatch(keys: string[] | Uint8Array[]): Promise<CacheGetBatch.Response> {
    return this.cacheClient.getBatch(this.cacheName, keys);
  }
  setBatch(
    items:
      | Record<string, string | Uint8Array>
      | Map<string | Uint8Array, string | Uint8Array>
      | Array<SetBatchItem>,
    options?: SetBatchOptions
  ): Promise<CacheSetBatch.Response> {
    return this.cacheClient.setBatch(this.cacheName, items, options);
  }
  setFetch(setName: string): Promise<CacheSetFetch.Response> {
    return this.cacheClient.setFetch(this.cacheName, setName);
  }
  setAddElement(
    setName: string,
    element: string | Uint8Array,
    options?: SetAddElementOptions
  ): Promise<CacheSetAddElement.Response> {
    return this.cacheClient.setAddElement(
      this.cacheName,
      setName,
      element,
      options
    );
  }
  setAddElements(
    setName: string,
    elements: string[] | Uint8Array[],
    options?: SetAddElementsOptions
  ): Promise<CacheSetAddElements.Response> {
    return this.cacheClient.setAddElements(
      this.cacheName,
      setName,
      elements,
      options
    );
  }
  setContainsElement(
    setName: string,
    element: string | Uint8Array
  ): Promise<CacheSetContainsElement.Response> {
    return this.cacheClient.setContainsElement(
      this.cacheName,
      setName,
      element
    );
  }
  setContainsElements(
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetContainsElements.Response> {
    return this.cacheClient.setContainsElements(
      this.cacheName,
      setName,
      elements
    );
  }
  setRemoveElement(
    setName: string,
    element: string | Uint8Array
  ): Promise<CacheSetRemoveElement.Response> {
    return this.cacheClient.setRemoveElement(this.cacheName, setName, element);
  }
  setRemoveElements(
    setName: string,
    elements: string[] | Uint8Array[]
  ): Promise<CacheSetRemoveElements.Response> {
    return this.cacheClient.setRemoveElements(
      this.cacheName,
      setName,
      elements
    );
  }
  setSample(setName: string, limit: number): Promise<CacheSetSample.Response> {
    return this.cacheClient.setSample(this.cacheName, setName, limit);
  }
  setPop(setName: string, count: number): Promise<CacheSetPop.Response> {
    return this.cacheClient.setPop(this.cacheName, setName, count);
  }
  setLength(setName: string): Promise<CacheSetLength.Response> {
    return this.cacheClient.setLength(this.cacheName, setName);
  }
  listFetch(
    listName: string,
    options?: ListFetchCallOptions
  ): Promise<CacheListFetch.Response> {
    return this.cacheClient.listFetch(this.cacheName, listName, options);
  }
  listLength(listName: string): Promise<CacheListLength.Response> {
    return this.cacheClient.listLength(this.cacheName, listName);
  }
  listPushFront(
    listName: string,
    value: string | Uint8Array,
    options?: ListPushFrontOptions
  ): Promise<CacheListPushFront.Response> {
    return this.cacheClient.listPushFront(
      this.cacheName,
      listName,
      value,
      options
    );
  }
  listPushBack(
    listName: string,
    value: string | Uint8Array,
    options?: ListPushBackOptions
  ): Promise<CacheListPushBack.Response> {
    return this.cacheClient.listPushBack(
      this.cacheName,
      listName,
      value,
      options
    );
  }
  listConcatenateBack(
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateBackOptions
  ): Promise<CacheListConcatenateBack.Response> {
    return this.cacheClient.listConcatenateBack(
      this.cacheName,
      listName,
      values,
      options
    );
  }
  listConcatenateFront(
    listName: string,
    values: string[] | Uint8Array[],
    options?: ListConcatenateFrontOptions
  ): Promise<CacheListConcatenateFront.Response> {
    return this.cacheClient.listConcatenateFront(
      this.cacheName,
      listName,
      values,
      options
    );
  }
  listPopBack(listName: string): Promise<CacheListPopBack.Response> {
    return this.cacheClient.listPopBack(this.cacheName, listName);
  }
  listPopFront(listName: string): Promise<CacheListPopFront.Response> {
    return this.cacheClient.listPopFront(this.cacheName, listName);
  }
  listRemoveValue(
    listName: string,
    value: string | Uint8Array
  ): Promise<CacheListRemoveValue.Response> {
    return this.cacheClient.listRemoveValue(this.cacheName, listName, value);
  }
  listRetain(
    listName: string,
    options?: ListRetainCallOptions
  ): Promise<CacheListRetain.Response> {
    return this.cacheClient.listRetain(this.cacheName, listName, options);
  }
  dictionarySetField(
    dictionaryName: string,
    field: string | Uint8Array,
    value: string | Uint8Array,
    options?: DictionarySetFieldOptions
  ): Promise<CacheDictionarySetField.Response> {
    return this.cacheClient.dictionarySetField(
      this.cacheName,
      dictionaryName,
      field,
      value,
      options
    );
  }
  dictionarySetFields(
    dictionaryName: string,
    elements:
      | Map<string | Uint8Array, string | Uint8Array>
      | Record<string, string | Uint8Array>,
    options?: DictionarySetFieldsOptions
  ): Promise<CacheDictionarySetFields.Response> {
    return this.cacheClient.dictionarySetFields(
      this.cacheName,
      dictionaryName,
      elements,
      options
    );
  }
  dictionaryGetField(
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryGetField.Response> {
    return this.cacheClient.dictionaryGetField(
      this.cacheName,
      dictionaryName,
      field
    );
  }
  dictionaryGetFields(
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryGetFields.Response> {
    return this.cacheClient.dictionaryGetFields(
      this.cacheName,
      dictionaryName,
      fields
    );
  }
  dictionaryFetch(
    dictionaryName: string
  ): Promise<CacheDictionaryFetch.Response> {
    return this.cacheClient.dictionaryFetch(this.cacheName, dictionaryName);
  }
  dictionaryIncrement(
    dictionaryName: string,
    field: string | Uint8Array,
    amount?: number,
    options?: DictionaryIncrementOptions
  ): Promise<CacheDictionaryIncrement.Response> {
    return this.cacheClient.dictionaryIncrement(
      this.cacheName,
      dictionaryName,
      field,
      amount,
      options
    );
  }
  dictionaryRemoveField(
    dictionaryName: string,
    field: string | Uint8Array
  ): Promise<CacheDictionaryRemoveField.Response> {
    return this.cacheClient.dictionaryRemoveField(
      this.cacheName,
      dictionaryName,
      field
    );
  }
  dictionaryRemoveFields(
    dictionaryName: string,
    fields: string[] | Uint8Array[]
  ): Promise<CacheDictionaryRemoveFields.Response> {
    return this.cacheClient.dictionaryRemoveFields(
      this.cacheName,
      dictionaryName,
      fields
    );
  }

  dictionaryLength(
    dictionaryName: string
  ): Promise<CacheDictionaryLength.Response> {
    return this.cacheClient.dictionaryLength(this.cacheName, dictionaryName);
  }

  sortedSetFetchByRank(
    sortedSetName: string,
    options?: SortedSetFetchByRankOptions
  ): Promise<CacheSortedSetFetch.Response> {
    return this.cacheClient.sortedSetFetchByRank(
      this.cacheName,
      sortedSetName,
      options
    );
  }
  sortedSetFetchByScore(
    sortedSetName: string,
    options?: SortedSetFetchByScoreOptions
  ): Promise<CacheSortedSetFetch.Response> {
    return this.cacheClient.sortedSetFetchByScore(
      this.cacheName,
      sortedSetName,
      options
    );
  }
  sortedSetPutElement(
    sortedSetName: string,
    value: string | Uint8Array,
    score: number,
    options?: SortedSetPutElementOptions
  ): Promise<CacheSortedSetPutElement.Response> {
    return this.cacheClient.sortedSetPutElement(
      this.cacheName,
      sortedSetName,
      value,
      score,
      options
    );
  }
  sortedSetPutElements(
    sortedSetName: string,
    elements: Map<string | Uint8Array, number> | Record<string, number>,
    options?: SortedSetPutElementsOptions
  ): Promise<CacheSortedSetPutElements.Response> {
    return this.cacheClient.sortedSetPutElements(
      this.cacheName,
      sortedSetName,
      elements,
      options
    );
  }
  sortedSetGetRank(
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetRank.Response> {
    return this.cacheClient.sortedSetGetRank(
      this.cacheName,
      sortedSetName,
      value
    );
  }
  sortedSetGetScore(
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetGetScore.Response> {
    return this.cacheClient.sortedSetGetScore(
      this.cacheName,
      sortedSetName,
      value
    );
  }
  sortedSetGetScores(
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetGetScores.Response> {
    return this.cacheClient.sortedSetGetScores(
      this.cacheName,
      sortedSetName,
      values
    );
  }
  sortedSetIncrementScore(
    sortedSetName: string,
    value: string | Uint8Array,
    amount?: number,
    options?: SortedSetIncrementOptions
  ): Promise<CacheSortedSetIncrementScore.Response> {
    return this.cacheClient.sortedSetIncrementScore(
      this.cacheName,
      sortedSetName,
      value,
      amount,
      options
    );
  }
  sortedSetRemoveElement(
    sortedSetName: string,
    value: string | Uint8Array
  ): Promise<CacheSortedSetRemoveElement.Response> {
    return this.cacheClient.sortedSetRemoveElement(
      this.cacheName,
      sortedSetName,
      value
    );
  }
  sortedSetRemoveElements(
    sortedSetName: string,
    values: string[] | Uint8Array[]
  ): Promise<CacheSortedSetRemoveElements.Response> {
    return this.cacheClient.sortedSetRemoveElements(
      this.cacheName,
      sortedSetName,
      values
    );
  }
  sortedSetLength(
    sortedSetName: string
  ): Promise<CacheSortedSetLength.Response> {
    return this.cacheClient.sortedSetLength(this.cacheName, sortedSetName);
  }
  sortedSetLengthByScore(
    sortedSetName: string,
    options?: SortedSetLengthByScoreOptions
  ): Promise<CacheSortedSetLengthByScore.Response> {
    return this.cacheClient.sortedSetLengthByScore(
      this.cacheName,
      sortedSetName,
      options
    );
  }
  sortedSetUnionStore(
    sortedSetName: string,
    sources: SortedSetSource[],
    options?: SortedSetUnionStoreOptions
  ): Promise<CacheSortedSetUnionStore.Response> {
    return this.cacheClient.sortedSetUnionStore(
      this.cacheName,
      sortedSetName,
      sources,
      options
    );
  }
  itemGetType(key: string | Uint8Array): Promise<CacheItemGetType.Response> {
    return this.cacheClient.itemGetType(this.cacheName, key);
  }
  itemGetTtl(key: string | Uint8Array): Promise<CacheItemGetTtl.Response> {
    return this.cacheClient.itemGetTtl(this.cacheName, key);
  }
  keyExists(key: string | Uint8Array): Promise<CacheKeyExists.Response> {
    return this.cacheClient.keyExists(this.cacheName, key);
  }
  keysExist(keys: string[] | Uint8Array[]): Promise<CacheKeysExist.Response> {
    return this.cacheClient.keysExist(this.cacheName, keys);
  }
  updateTtl(
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheUpdateTtl.Response> {
    return this.cacheClient.updateTtl(this.cacheName, key, ttlMilliseconds);
  }
  increaseTtl(
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheIncreaseTtl.Response> {
    return this.cacheClient.increaseTtl(this.cacheName, key, ttlMilliseconds);
  }
  decreaseTtl(
    key: string | Uint8Array,
    ttlMilliseconds: number
  ): Promise<CacheDecreaseTtl.Response> {
    return this.cacheClient.decreaseTtl(this.cacheName, key, ttlMilliseconds);
  }
  close() {
    this.cacheClient.close();
  }
}
