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
  CollectionTtl,
} from '../../../index';

export interface IDataClient {
  get(cacheName: string, key: string | Uint8Array): Promise<CacheGet.Response>;
  set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSet.Response>;
  delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheDelete.Response>;
  increment(
    cacheName: string,
    field: string | Uint8Array,
    amount: number,
    ttl?: number
  ): Promise<CacheIncrement.Response>;
  setIfNotExists(
    cacheName: string,
    key: string | Uint8Array,
    field: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSetIfNotExists.Response>;
  listFetch(
    cacheName: string,
    listName: string,
    startIndex?: number,
    endIndex?: number
  ): Promise<CacheListFetch.Response>;
  listLength(
    cacheName: string,
    listName: string
  ): Promise<CacheListLength.Response>;
  listPushFront(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    truncateBackToSize?: number,
    ttl?: CollectionTtl
  ): Promise<CacheListPushFront.Response>;
  listPushBack(
    cacheName: string,
    listName: string,
    value: string | Uint8Array,
    truncateFrontToSize?: number,
    ttl?: CollectionTtl
  ): Promise<CacheListPushBack.Response>;
  listConcatenateBack(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    truncateFrontToSize?: number,
    ttl?: CollectionTtl
  ): Promise<CacheListConcatenateBack.Response>;
  listConcatenateFront(
    cacheName: string,
    listName: string,
    values: string[] | Uint8Array[],
    truncateBackToSize?: number,
    ttl?: CollectionTtl
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
    startIndex?: number,
    endIndex?: number,
    ttl?: CollectionTtl
  ): Promise<CacheListRetain.Response>;
}
