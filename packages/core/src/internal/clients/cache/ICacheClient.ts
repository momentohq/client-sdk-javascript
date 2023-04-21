import {IControlClient} from './IControlClient';
import {
  CacheDelete,
  CacheGet,
  CacheIncrement,
  CacheSet,
  CacheSetIfNotExists,
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
} from '../../../index';
import {
  ScalarCallOptions,
  ListFetchCallOptions,
  ListRetainCallOptions,
  BackTruncatableCallOptions,
  FrontTruncatableCallOptions,
  CollectionCallOptions,
} from '../../../utils';

// Type aliases to differentiate the different methods' optional arguments.
export type SetOptions = ScalarCallOptions;
export type SetIfNotExistsOptions = ScalarCallOptions;
export type ListConcatenateBackOptions = FrontTruncatableCallOptions;
export type ListConcatenateFrontOptions = BackTruncatableCallOptions;
export type ListPushBackOptions = FrontTruncatableCallOptions;
export type ListPushFrontOptions = BackTruncatableCallOptions;
// export type SetAddElementOptions = CollectionCallOptions;
// export type SetAddElementsOptions = CollectionCallOptions;
export type DictionarySetFieldOptions = CollectionCallOptions;
export type DictionarySetFieldsOptions = CollectionCallOptions;
export type DictionaryIncrementOptions = CollectionCallOptions;
export type IncrementOptions = ScalarCallOptions;
// export type SortedSetPutElementOptions = CollectionCallOptions;
// export type SortedSetPutElementsOptions = CollectionCallOptions;
// export type SortedSetFetchByRankOptions = SortedSetFetchByRankCallOptions;
// export type SortedSetFetchByScoreOptions = SortedSetFetchByScoreCallOptions;
// export type SortedSetIncrementOptions = CollectionCallOptions;

export interface ICacheClient extends IControlClient {
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
  ): Promise<CacheDictionaryGetField.Response>;
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
}
