import {cache} from '@gomomento/generated-types';
import {SetBatchItem} from '@gomomento/sdk-core';

const TEXT_DECODER = new TextDecoder();

// TODO: bytes will not always be convertible to string
function convertBytesToString(bytes: Uint8Array) {
  return TEXT_DECODER.decode(bytes);
}

export function convertSingleKeyRequest(
  requestType: string,
  key: Uint8Array
): RequestSingleKeyLog {
  return {
    requestType: requestType,
    key: convertBytesToString(key),
  };
}

export interface RequestLog {
  requestType: string;
}

interface WriteRequestLog extends RequestLog {
  ttlMillis: number;
}

interface CollectionWriteRequestLog extends WriteRequestLog {
  refreshTtl: boolean;
}

// Current used for GetBatch and KeysExist requests
interface RequestMultipleKeysLog extends RequestLog {
  keys: string[];
}

// Currently used for Get, Delete, ItemGetTtl, and ItemGetType requests
interface RequestSingleKeyLog extends RequestLog {
  key: string;
}

interface RequestToLogInterfaceConverterFn<TRequest, TLog extends RequestLog> {
  (request: TRequest): TLog;
}

const convertGetRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._GetRequest,
  RequestSingleKeyLog
> = (request: cache.cache_client._GetRequest) => {
  return convertSingleKeyRequest('get', request.cache_key);
};

const convertGetBatchRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._GetBatchRequest,
  RequestMultipleKeysLog
> = (request: cache.cache_client._GetBatchRequest) => {
  return {
    requestType: 'getBatch',
    keys: request.items.map(item => convertBytesToString(item.cache_key)),
  };
};

const convertGetWithHashRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._GetWithHashRequest,
  RequestSingleKeyLog
> = (request: cache.cache_client._GetWithHashRequest) => {
  return convertSingleKeyRequest('getWithHash', request.cache_key);
};

const convertDeleteRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DeleteRequest,
  RequestSingleKeyLog
> = (request: cache.cache_client._DeleteRequest) => {
  return convertSingleKeyRequest('delete', request.cache_key);
};

interface SetRequestLog extends WriteRequestLog {
  key: string;
  value: string;
}

const convertSetRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetRequest,
  SetRequestLog
> = (request: cache.cache_client._SetRequest) => {
  return {
    requestType: 'set',
    key: convertBytesToString(request.cache_key),
    value: convertBytesToString(request.cache_body),
    ttlMillis: request.ttl_milliseconds,
  };
};

interface SetBatchRequestLog extends RequestLog {
  items: SetBatchItem[];
}

const convertSetBatchRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetBatchRequest,
  SetBatchRequestLog
> = (request: cache.cache_client._SetBatchRequest) => {
  return {
    requestType: 'setBatch',
    items: request.items.map(item => {
      return {
        key: convertBytesToString(item.cache_key),
        value: convertBytesToString(item.cache_body),
        ttlMillis: item.ttl_milliseconds,
      };
    }),
  };
};

interface SetIfRequestLog extends WriteRequestLog {
  key: string;
  value: string;
  condition: string;
  present: boolean;
  presentAndNotEqual: string | undefined;
  absent: boolean;
  equal: string | undefined;
  absentOrEqual: string | undefined;
  notEqual: string | undefined;
}

const convertSetIfRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetIfRequest,
  SetIfRequestLog
> = (request: cache.cache_client._SetIfRequest) => {
  return {
    requestType: 'setIf',
    key: convertBytesToString(request.cache_key),
    value: convertBytesToString(request.cache_body),
    ttlMillis: request.ttl_milliseconds,
    condition: request.condition,
    present: request.present !== undefined,
    presentAndNotEqual: request.present_and_not_equal
      ? convertBytesToString(request.present_and_not_equal.value_to_check)
      : undefined,
    absent: request.absent !== undefined,
    equal: request.equal
      ? convertBytesToString(request.equal.value_to_check)
      : undefined,
    absentOrEqual: request.absent_or_equal
      ? convertBytesToString(request.absent_or_equal.value_to_check)
      : undefined,
    notEqual: request.not_equal
      ? convertBytesToString(request.not_equal.value_to_check)
      : undefined,
  };
};

const convertSetIfNotExistsRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetIfNotExistsRequest,
  SetRequestLog
> = (request: cache.cache_client._SetIfNotExistsRequest) => {
  return {
    requestType: 'setIfNotExists',
    key: convertBytesToString(request.cache_key),
    value: convertBytesToString(request.cache_body),
    ttlMillis: request.ttl_milliseconds,
  };
};

const convertSetIfHashRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetIfHashRequest,
  SetRequestLog
> = (request: cache.cache_client._SetIfHashRequest) => {
  return {
    requestType: 'setIfHash',
    key: convertBytesToString(request.cache_key),
    value: convertBytesToString(request.cache_body),
    ttlMillis: request.ttl_milliseconds,
    presentAndNotHashEqual: request.present_and_not_hash_equal
      ? convertBytesToString(request.present_and_not_hash_equal.hash_to_check)
      : undefined,
    presentAndHashEqual: request.present_and_hash_equal
      ? convertBytesToString(request.present_and_hash_equal.hash_to_check)
      : undefined,
    absentOrHashEqual: request.absent_or_hash_equal
      ? convertBytesToString(request.absent_or_hash_equal.hash_to_check)
      : undefined,
    absentOrNotHashEqual: request.absent_or_not_hash_equal
      ? convertBytesToString(request.absent_or_not_hash_equal.hash_to_check)
      : undefined,
    unconditional: request.unconditional ? true : undefined,
  };
};

const convertKeysExistRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._KeysExistRequest,
  RequestMultipleKeysLog
> = (request: cache.cache_client._KeysExistRequest) => {
  return {
    requestType: 'keysExist',
    keys: request.cache_keys.map(key => convertBytesToString(key)),
  };
};

interface IncrementRequestLog extends WriteRequestLog {
  key: string;
  amount: number;
}

const convertIncrementRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._IncrementRequest,
  IncrementRequestLog
> = (request: cache.cache_client._IncrementRequest) => {
  return {
    requestType: 'increment',
    key: convertBytesToString(request.cache_key),
    amount: request.amount,
    ttlMillis: request.ttl_milliseconds,
  };
};

interface UpdateTtlRequestLog extends RequestLog {
  key: string;
  increaseToMillis: number;
  decreaseToMillis: number;
  overwriteToMillis: number;
}

const convertUpdateTtlRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._UpdateTtlRequest,
  UpdateTtlRequestLog
> = (request: cache.cache_client._UpdateTtlRequest) => {
  return {
    requestType: 'updateTtl',
    key: convertBytesToString(request.cache_key),
    increaseToMillis: request.increase_to_milliseconds,
    decreaseToMillis: request.decrease_to_milliseconds,
    overwriteToMillis: request.overwrite_to_milliseconds,
  };
};

const convertItemGetTtlRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ItemGetTtlRequest,
  RequestSingleKeyLog
> = (request: cache.cache_client._ItemGetTtlRequest) => {
  return convertSingleKeyRequest('itemGetTtl', request.cache_key);
};

const convertItemGetTypeRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ItemGetTypeRequest,
  RequestSingleKeyLog
> = (request: cache.cache_client._ItemGetTypeRequest) => {
  return convertSingleKeyRequest('itemGetType', request.cache_key);
};

interface DictionaryRequestLog extends RequestLog {
  dictionaryName: string;
}

interface DictionaryGetRequestLog extends DictionaryRequestLog {
  fields: string[];
}

const convertDictionaryGetRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DictionaryGetRequest,
  DictionaryGetRequestLog
> = (request: cache.cache_client._DictionaryGetRequest) => {
  return {
    requestType: 'dictionaryGet',
    dictionaryName: convertBytesToString(request.dictionary_name),
    fields: request.fields.map(field => convertBytesToString(field)),
  };
};

const convertDictionaryFetchRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DictionaryFetchRequest,
  DictionaryRequestLog
> = (request: cache.cache_client._DictionaryFetchRequest) => {
  return {
    requestType: 'dictionaryFetch',
    dictionaryName: convertBytesToString(request.dictionary_name),
  };
};

interface DictionarySetRequestLog
  extends DictionaryRequestLog,
    CollectionWriteRequestLog {
  items: {field: string; value: string}[];
}

const convertDictionarySetRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DictionarySetRequest,
  DictionarySetRequestLog
> = (request: cache.cache_client._DictionarySetRequest) => {
  return {
    requestType: 'dictionarySet',
    dictionaryName: convertBytesToString(request.dictionary_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    items: request.items.map(item => {
      return {
        field: convertBytesToString(item.field),
        value: convertBytesToString(item.value),
      };
    }),
  };
};

interface DictionaryIncrementRequestLog
  extends DictionaryRequestLog,
    CollectionWriteRequestLog {
  field: string;
  amount: number;
}

const convertDictionaryIncrementRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DictionaryIncrementRequest,
  DictionaryIncrementRequestLog
> = (request: cache.cache_client._DictionaryIncrementRequest) => {
  return {
    requestType: 'dictionaryIncrement',
    dictionaryName: convertBytesToString(request.dictionary_name),
    field: convertBytesToString(request.field),
    amount: request.amount,
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
  };
};

interface DictionaryDeleteRequestLog extends DictionaryRequestLog {
  fields: string[];
}

const convertDictionaryDeleteRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DictionaryDeleteRequest,
  DictionaryDeleteRequestLog
> = (request: cache.cache_client._DictionaryDeleteRequest) => {
  return {
    requestType: 'dictionaryDelete',
    dictionaryName: convertBytesToString(request.dictionary_name),
    fields: request.some.fields.map(field => convertBytesToString(field)),
  };
};

const convertDictionaryLengthRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._DictionaryLengthRequest,
  DictionaryRequestLog
> = (request: cache.cache_client._DictionaryLengthRequest) => {
  return {
    requestType: 'dictionaryLength',
    dictionaryName: convertBytesToString(request.dictionary_name),
  };
};

interface SetCollectionRequestLog extends RequestLog {
  setName: string;
}

const convertSetFetchRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetFetchRequest,
  SetCollectionRequestLog
> = (request: cache.cache_client._SetFetchRequest) => {
  return {
    requestType: 'setFetch',
    setName: convertBytesToString(request.set_name),
  };
};

interface SetSampleRequestLog extends SetCollectionRequestLog {
  limit: number;
}

const convertSetSampleRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetSampleRequest,
  SetSampleRequestLog
> = (request: cache.cache_client._SetSampleRequest) => {
  return {
    requestType: 'setSample',
    setName: convertBytesToString(request.set_name),
    limit: request.limit,
  };
};

interface SetUnionRequestLog
  extends SetCollectionRequestLog,
    CollectionWriteRequestLog {
  elements: string[];
}

const convertSetUnionRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetUnionRequest,
  SetUnionRequestLog
> = (request: cache.cache_client._SetUnionRequest) => {
  return {
    requestType: 'setUnion',
    setName: convertBytesToString(request.set_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    elements: request.elements.map(element => convertBytesToString(element)),
  };
};

interface SetDifferenceRequestLog extends SetCollectionRequestLog {
  action: 'minuend' | 'subtrahend_set' | 'subtrahend_identity';
  elements?: string[];
}

const convertSetDifferenceRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetDifferenceRequest,
  SetDifferenceRequestLog
> = (request: cache.cache_client._SetDifferenceRequest) => {
  return {
    requestType: 'setDifference',
    setName: convertBytesToString(request.set_name),
    action: request.minuend
      ? 'minuend'
      : request.subtrahend.set
      ? 'subtrahend_set'
      : 'subtrahend_identity',
    elements: request.minuend
      ? request.minuend.elements.map(element => convertBytesToString(element))
      : request.subtrahend.set
      ? request.subtrahend.set.elements.map(element =>
          convertBytesToString(element)
        )
      : undefined,
  };
};

interface SetContainsRequestLog extends SetCollectionRequestLog {
  elements: string[];
}

const convertSetContainsRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetContainsRequest,
  SetContainsRequestLog
> = (request: cache.cache_client._SetContainsRequest) => {
  return {
    requestType: 'setContains',
    setName: convertBytesToString(request.set_name),
    elements: request.elements.map(element => convertBytesToString(element)),
  };
};

const convertSetLengthRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetLengthRequest,
  SetCollectionRequestLog
> = (request: cache.cache_client._SetLengthRequest) => {
  return {
    requestType: 'setLength',
    setName: convertBytesToString(request.set_name),
  };
};

interface SetPopRequestLog extends SetCollectionRequestLog {
  count: number;
}

const convertSetPopRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SetPopRequest,
  SetPopRequestLog
> = (request: cache.cache_client._SetPopRequest) => {
  return {
    requestType: 'setPop',
    setName: convertBytesToString(request.set_name),
    count: request.count,
  };
};

interface ListRequestLog extends RequestLog {
  listName: string;
}

interface ListConcatenateFrontRequestLog
  extends ListRequestLog,
    CollectionWriteRequestLog {
  truncateBackToSize: number;
  values: string[];
}

const convertListConcatenateFrontRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListConcatenateFrontRequest,
  ListConcatenateFrontRequestLog
> = (request: cache.cache_client._ListConcatenateFrontRequest) => {
  return {
    requestType: 'listConcatenateFront',
    listName: convertBytesToString(request.list_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    truncateBackToSize: request.truncate_back_to_size,
    values: request.values.map(value => convertBytesToString(value)),
  };
};

interface ListConcatenateBackRequestLog
  extends ListRequestLog,
    CollectionWriteRequestLog {
  truncateFrontToSize: number;
  values: string[];
}

const convertListConcatenateBackRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListConcatenateBackRequest,
  ListConcatenateBackRequestLog
> = (request: cache.cache_client._ListConcatenateBackRequest) => {
  return {
    requestType: 'listConcatenateBack',
    listName: convertBytesToString(request.list_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    truncateFrontToSize: request.truncate_front_to_size,
    values: request.values.map(value => convertBytesToString(value)),
  };
};

interface ListPushFrontRequestLog
  extends ListRequestLog,
    CollectionWriteRequestLog {
  truncateBackToSize: number;
  value: string;
}

const convertListPushFrontRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListPushFrontRequest,
  ListPushFrontRequestLog
> = (request: cache.cache_client._ListPushFrontRequest) => {
  return {
    requestType: 'listPushFront',
    listName: convertBytesToString(request.list_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    truncateBackToSize: request.truncate_back_to_size,
    value: convertBytesToString(request.value),
  };
};

interface ListPushBackRequestLog
  extends ListRequestLog,
    CollectionWriteRequestLog {
  truncateFrontToSize: number;
  value: string;
}

const convertListPushBackRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListPushBackRequest,
  ListPushBackRequestLog
> = (request: cache.cache_client._ListPushBackRequest) => {
  return {
    requestType: 'listPushBack',
    listName: convertBytesToString(request.list_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    truncateFrontToSize: request.truncate_front_to_size,
    value: convertBytesToString(request.value),
  };
};

const convertListPopFrontRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListPopFrontRequest,
  ListRequestLog
> = (request: cache.cache_client._ListPopFrontRequest) => {
  return {
    requestType: 'listPopFront',
    listName: convertBytesToString(request.list_name),
  };
};

const convertListPopBackRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListPopBackRequest,
  ListRequestLog
> = (request: cache.cache_client._ListPopBackRequest) => {
  return {
    requestType: 'listPopBack',
    listName: convertBytesToString(request.list_name),
  };
};

interface ListRemoveValueRequestLog extends ListRequestLog {
  value: string;
}

const convertListRemoveRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListRemoveRequest,
  ListRemoveValueRequestLog
> = (request: cache.cache_client._ListRemoveRequest) => {
  return {
    requestType: 'listRemove',
    listName: convertBytesToString(request.list_name),
    value: convertBytesToString(request.all_elements_with_value),
  };
};

interface ListFetchRequestLog extends ListRequestLog {
  inclusiveStart: number;
  exclusiveEnd: number;
}

const convertListFetchRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListFetchRequest,
  ListFetchRequestLog
> = (request: cache.cache_client._ListFetchRequest) => {
  return {
    requestType: 'listFetch',
    listName: convertBytesToString(request.list_name),
    inclusiveStart: request.inclusive_start,
    exclusiveEnd: request.exclusive_end,
  };
};

interface ListEraseRequestLog extends ListRequestLog {
  all: boolean;
  some: {beginIndex: number; count: number}[];
}

const convertListEraseRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListEraseRequest,
  ListEraseRequestLog
> = (request: cache.cache_client._ListEraseRequest) => {
  return {
    requestType: 'listErase',
    listName: convertBytesToString(request.list_name),
    all: request.all !== undefined,
    some: request.some.ranges.map(range => {
      return {
        beginIndex: range.begin_index,
        count: range.count,
      };
    }),
  };
};

interface ListRetainRequestLog
  extends ListRequestLog,
    CollectionWriteRequestLog {
  inclusiveStart: number;
  exclusiveEnd: number;
}

const convertListRetainRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListRetainRequest,
  ListRetainRequestLog
> = (request: cache.cache_client._ListRetainRequest) => {
  return {
    requestType: 'listRetain',
    listName: convertBytesToString(request.list_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    inclusiveStart: request.inclusive_start,
    exclusiveEnd: request.exclusive_end,
  };
};

const convertListLengthRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._ListLengthRequest,
  ListRequestLog
> = (request: cache.cache_client._ListLengthRequest) => {
  return {
    requestType: 'listLength',
    listName: convertBytesToString(request.list_name),
  };
};

interface SortedSetRequestLog extends RequestLog {
  sortedSetName: string;
}

interface SortedSetPutRequestLog
  extends SortedSetRequestLog,
    CollectionWriteRequestLog {
  elements: {value: string; score: number}[];
}

const convertSortedSetPutRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetPutRequest,
  SortedSetPutRequestLog
> = (request: cache.cache_client._SortedSetPutRequest) => {
  return {
    requestType: 'sortedSetPut',
    sortedSetName: convertBytesToString(request.set_name),
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
    elements: request.elements.map(item => {
      return {
        value: convertBytesToString(item.value),
        score: item.score,
      };
    }),
  };
};

interface SortedSetFetchRequestLog extends SortedSetRequestLog {
  order: 'ascending' | 'descending'; // enum with 0 = ascending, 1 = descending
  byScore?: {
    minScore: number | string;
    minScoreExclusive?: boolean;
    maxScore: number | string;
    maxScoreExclusive?: boolean;
    offset: number;
    count: number;
  };
  byIndex?: {
    inclusiveStartIndex: number | string;
    exclusiveEndIndex: number | string;
  };
}

const convertSortedSetFetchRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetFetchRequest,
  SortedSetFetchRequestLog
> = (request: cache.cache_client._SortedSetFetchRequest) => {
  const byScore = request.by_score
    ? {
        minScore: request.by_score.unbounded_min
          ? 'unbounded'
          : request.by_score.min_score.score,
        minScoreExclusive: request.by_score.min_score?.exclusive,
        maxScore: request.by_score.unbounded_max
          ? 'unbounded'
          : request.by_score.max_score.score,
        maxScoreExclusive: request.by_score.max_score?.exclusive,
        offset: request.by_score.offset,
        count: request.by_score.count,
      }
    : undefined;

  const byIndex = request.by_index
    ? {
        inclusiveStartIndex: request.by_index.unbounded_start
          ? 'unbounded'
          : request.by_index.inclusive_start_index,
        exclusiveEndIndex: request.by_index.unbounded_end
          ? 'unbounded'
          : request.by_index.exclusive_end_index,
      }
    : undefined;

  return {
    requestType: 'sortedSetFetch',
    sortedSetName: convertBytesToString(request.set_name),
    order:
      request.order ===
      cache.cache_client._SortedSetFetchRequest.Order.DESCENDING
        ? 'descending'
        : 'ascending',
    byScore,
    byIndex,
  };
};

interface SortedSetValuesRequestLog extends SortedSetRequestLog {
  values: string[];
}

const convertSortedSetGetScoreRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetGetScoreRequest,
  SortedSetValuesRequestLog
> = (request: cache.cache_client._SortedSetGetScoreRequest) => {
  return {
    requestType: 'sortedSetGetScore',
    sortedSetName: convertBytesToString(request.set_name),
    values: request.values.map(value => convertBytesToString(value)),
  };
};

interface SortedSetRemoveRequestLog extends SortedSetRequestLog {
  values: string[] | 'all';
}

const convertSortedSetRemoveRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetRemoveRequest,
  SortedSetRemoveRequestLog
> = (request: cache.cache_client._SortedSetRemoveRequest) => {
  return {
    requestType: 'sortedSetRemove',
    sortedSetName: convertBytesToString(request.set_name),
    values: request.all
      ? 'all'
      : request.some.values.map(value => convertBytesToString(value)),
  };
};

interface SortedSetIncrementRequestLog
  extends SortedSetRequestLog,
    CollectionWriteRequestLog {
  value: string;
  amount: number;
}

const convertSortedSetIncrementRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetIncrementRequest,
  SortedSetIncrementRequestLog
> = (request: cache.cache_client._SortedSetIncrementRequest) => {
  return {
    requestType: 'sortedSetIncrement',
    sortedSetName: convertBytesToString(request.set_name),
    value: convertBytesToString(request.value),
    amount: request.amount,
    ttlMillis: request.ttl_milliseconds,
    refreshTtl: request.refresh_ttl,
  };
};

interface SortedSetGetRankRequestLog extends SortedSetRequestLog {
  value: string;
  order: 'ascending' | 'descending'; // enum with 0 = ascending, 1 = descending
}

const convertSortedSetGetRankRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetGetRankRequest,
  SortedSetGetRankRequestLog
> = (request: cache.cache_client._SortedSetGetRankRequest) => {
  return {
    requestType: 'sortedSetGetRank',
    sortedSetName: convertBytesToString(request.set_name),
    value: convertBytesToString(request.value),
    order:
      request.order ===
      cache.cache_client._SortedSetGetRankRequest.Order.DESCENDING
        ? 'descending'
        : 'ascending',
  };
};

const convertSortedSetLengthRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetLengthRequest,
  SortedSetRequestLog
> = (request: cache.cache_client._SortedSetLengthRequest) => {
  return {
    requestType: 'sortedSetLength',
    sortedSetName: convertBytesToString(request.set_name),
  };
};

interface SortedSetLengthByScoreRequestLog extends SortedSetRequestLog {
  minScore: number | string;
  minScoreExclusive?: boolean;
  maxScore: number | string;
  maxScoreExclusive?: boolean;
}

const convertSortedSetLengthByScoreRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetLengthByScoreRequest,
  SortedSetLengthByScoreRequestLog
> = (request: cache.cache_client._SortedSetLengthByScoreRequest) => {
  return {
    requestType: 'sortedSetLengthByScore',
    sortedSetName: convertBytesToString(request.set_name),
    minScore: request.unbounded_min
      ? 'unbounded'
      : request.inclusive_min ?? request.exclusive_min,
    minScoreExclusive: request.unbounded_min
      ? undefined
      : request.has_exclusive_min,
    maxScore: request.unbounded_max
      ? 'unbounded'
      : request.inclusive_max ?? request.exclusive_max,
    maxScoreExclusive: request.unbounded_max
      ? undefined
      : request.has_exclusive_max,
  };
};

// TODO elaborate on all the fields here. This is a stub.
const convertSortedSetUnionStoreRequest: RequestToLogInterfaceConverterFn<
  cache.cache_client._SortedSetUnionStoreRequest,
  SortedSetRequestLog
> = (request: cache.cache_client._SortedSetUnionStoreRequest) => {
  return {
    requestType: 'sortedSetUnionStore',
    sortedSetName: convertBytesToString(request.set_name),
  };
};

export const CacheRequestToLogInterfaceConverter = new Map<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RequestToLogInterfaceConverterFn<any, RequestLog>
>([
  ['_GetRequest', convertGetRequest],
  ['_GetWithHashRequest', convertGetWithHashRequest],
  ['_GetBatchRequest', convertGetBatchRequest],
  ['_DeleteRequest', convertDeleteRequest],
  ['_SetRequest', convertSetRequest],
  ['_SetBatchRequest', convertSetBatchRequest],
  ['_SetIfHashRequest', convertSetIfHashRequest],
  ['_SetIfRequest', convertSetIfRequest],
  ['_SetIfNotExistsRequest', convertSetIfNotExistsRequest],
  ['_KeysExistRequest', convertKeysExistRequest],
  ['_IncrementRequest', convertIncrementRequest],
  ['_UpdateTtlRequest', convertUpdateTtlRequest],
  ['_ItemGetTtlRequest', convertItemGetTtlRequest],
  ['_ItemGetTypeRequest', convertItemGetTypeRequest],
  ['_DictionaryGetRequest', convertDictionaryGetRequest],
  ['_DictionaryFetchRequest', convertDictionaryFetchRequest],
  ['_DictionarySetRequest', convertDictionarySetRequest],
  ['_DictionaryIncrementRequest', convertDictionaryIncrementRequest],
  ['_DictionaryDeleteRequest', convertDictionaryDeleteRequest],
  ['_DictionaryLengthRequest', convertDictionaryLengthRequest],
  ['_SetFetchRequest', convertSetFetchRequest],
  ['_SetSampleRequest', convertSetSampleRequest],
  ['_SetUnionRequest', convertSetUnionRequest],
  ['_SetDifferenceRequest', convertSetDifferenceRequest],
  ['_SetContainsRequest', convertSetContainsRequest],
  ['_SetLengthRequest', convertSetLengthRequest],
  ['_SetPopRequest', convertSetPopRequest],
  ['_ListConcatenateFrontRequest', convertListConcatenateFrontRequest],
  ['_ListConcatenateBackRequest', convertListConcatenateBackRequest],
  ['_ListPushFrontRequest', convertListPushFrontRequest],
  ['_ListPushBackRequest', convertListPushBackRequest],
  ['_ListPopFrontRequest', convertListPopFrontRequest],
  ['_ListPopBackRequest', convertListPopBackRequest],
  ['_ListRemoveRequest', convertListRemoveRequest],
  ['_ListFetchRequest', convertListFetchRequest],
  ['_ListEraseRequest', convertListEraseRequest],
  ['_ListRetainRequest', convertListRetainRequest],
  ['_ListLengthRequest', convertListLengthRequest],
  ['_SortedSetPutRequest', convertSortedSetPutRequest],
  ['_SortedSetFetchRequest', convertSortedSetFetchRequest],
  ['_SortedSetGetScoreRequest', convertSortedSetGetScoreRequest],
  ['_SortedSetRemoveRequest', convertSortedSetRemoveRequest],
  ['_SortedSetIncrementRequest', convertSortedSetIncrementRequest],
  ['_SortedSetGetRankRequest', convertSortedSetGetRankRequest],
  ['_SortedSetLengthRequest', convertSortedSetLengthRequest],
  ['_SortedSetLengthByScoreRequest', convertSortedSetLengthByScoreRequest],
  ['_SortedSetUnionStoreRequest', convertSortedSetUnionStoreRequest],
]);
