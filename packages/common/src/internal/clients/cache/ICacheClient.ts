import {IControlClient} from './IControlClient';
import {CacheGet, CacheSet} from '../../../index';
import {ScalarCallOptions} from '../../../utils';

// Type aliases to differentiate the different methods' optional arguments.
export type SetOptions = ScalarCallOptions;
// export type SetIfNotExistsOptions = ScalarCallOptions;
// export type ListConcatenateBackOptions = FrontTruncatableCallOptions;
// export type ListConcatenateFrontOptions = BackTruncatableCallOptions;
// export type ListPushBackOptions = FrontTruncatableCallOptions;
// export type ListPushFrontOptions = BackTruncatableCallOptions;
// export type SetAddElementOptions = CollectionCallOptions;
// export type SetAddElementsOptions = CollectionCallOptions;
// export type DictionarySetFieldOptions = CollectionCallOptions;
// export type DictionarySetFieldsOptions = CollectionCallOptions;
// export type DictionaryIncrementOptions = CollectionCallOptions;
// export type IncrementOptions = ScalarCallOptions;
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
}
