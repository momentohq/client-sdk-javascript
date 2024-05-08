import {Metadata, StatusObject} from '@grpc/grpc-js';
import {Message} from 'google-protobuf';
import {cache, leaderboard} from '@gomomento/generated-types';

const TEXT_DECODER = new TextDecoder();

export class MiddlewareMetadata {
  readonly _grpcMetadata: Metadata;
  constructor(metadata: Metadata) {
    this._grpcMetadata = metadata;
  }

  toJsonString(): string {
    return JSON.stringify(this._grpcMetadata.toJSON());
  }
}
export class MiddlewareStatus {
  readonly _grpcStatus: StatusObject;
  constructor(status: StatusObject) {
    this._grpcStatus = status;
  }

  code() {
    return this._grpcStatus.code;
  }
}

export class MiddlewareMessage {
  readonly _grpcMessage: Message;
  constructor(message: Message) {
    this._grpcMessage = message;
  }

  messageLength(): number {
    if (this._grpcMessage !== null && this._grpcMessage !== undefined) {
      return this._grpcMessage.serializeBinary().length;
    }
    return 0;
  }

  constructorName(): string {
    return this._grpcMessage.constructor.name;
  }

  // Note: APIs that use streaming interceptors (e.g. GetBatch and SetBatch)
  // will not see these debug messages
  toString(): string {
    switch (this._grpcMessage.constructor) {
      case cache.cache_client._GetRequest: {
        const request = this._grpcMessage as cache.cache_client._GetRequest;
        return `GetRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}"`;
      }
      case cache.cache_client._SetRequest: {
        const request = this._grpcMessage as cache.cache_client._SetRequest;
        return `SetRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}" and value "${TEXT_DECODER.decode(
          request.cache_body
        )}" and ttl (ms) "${request.ttl_milliseconds}"`;
      }
      case cache.cache_client._GetBatchRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._GetBatchRequest;
        return (
          'GetBatchRequest with keys ' +
          request.items.reduce(
            (acc, item) => acc + TEXT_DECODER.decode(item.cache_key) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._DeleteRequest: {
        const request = this._grpcMessage as cache.cache_client._DeleteRequest;
        return `DeleteRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}"`;
      }
      case cache.cache_client._SetBatchRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetBatchRequest;
        return (
          'SetBatchRequest with items ' +
          request.items.reduce(
            (acc, item) =>
              acc +
              `(key "${TEXT_DECODER.decode(
                item.cache_key
              )}" | value "${TEXT_DECODER.decode(
                item.cache_body
              )}" | ttl (ms) ${item.ttl_milliseconds}), `,
            ''
          )
        );
      }
      case cache.cache_client._SetIfRequest: {
        const request = this._grpcMessage as cache.cache_client._SetIfRequest;
        return `SetIfRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}" and value "${TEXT_DECODER.decode(
          request.cache_body
        )}" and condition "${request.condition}"`;
      }
      case cache.cache_client._KeysExistRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._KeysExistRequest;
        return (
          'KeysExistRequest with keys ' +
          request.cache_keys.reduce(
            (acc, key) => acc + TEXT_DECODER.decode(key) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._IncrementRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._IncrementRequest;
        return `IncrementRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}" and amount "${request.amount}" and ttl (ms) "${
          request.ttl_milliseconds
        }"`;
      }
      case cache.cache_client._UpdateTtlRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._UpdateTtlRequest;
        return `UpdateTtlRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}" and amount "${
          String(request.increase_to_milliseconds) + ' (increase)' ||
          String(request.decrease_to_milliseconds) + ' (decrease)' ||
          String(request.overwrite_to_milliseconds) + ' (overwrite)'
        }"`;
      }
      case cache.cache_client._ItemGetTtlRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ItemGetTtlRequest;
        return `ItemGetTtlRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}"`;
      }
      case cache.cache_client._ItemGetTypeRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ItemGetTypeRequest;
        return `ItemGetTypeRequest with key "${TEXT_DECODER.decode(
          request.cache_key
        )}"`;
      }
      case cache.cache_client._DictionaryGetRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._DictionaryGetRequest;
        return (
          `DictionaryGetRequest with dictionary name "${TEXT_DECODER.decode(
            request.dictionary_name
          )}" and fields ` +
          request.fields.reduce(
            (acc, field) => acc + TEXT_DECODER.decode(field) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._DictionaryFetchRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._DictionaryFetchRequest;
        return `DictionaryFetchRequest with dictionary name "${TEXT_DECODER.decode(
          request.dictionary_name
        )}"`;
      }
      case cache.cache_client._DictionarySetRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._DictionarySetRequest;
        return (
          `DictionarySetRequest with dictionary name "${TEXT_DECODER.decode(
            request.dictionary_name
          )}" and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
            request.refresh_ttl ? 'true' : 'false'
          } and fields ` +
          request.items.reduce(
            (acc, item) =>
              acc +
              `(field "${TEXT_DECODER.decode(
                item.field
              )}" | value "${TEXT_DECODER.decode(item.value)}"), `,
            ''
          )
        );
      }
      case cache.cache_client._DictionaryIncrementRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._DictionaryIncrementRequest;
        return `DictionaryIncrementRequest with dictionary name "${TEXT_DECODER.decode(
          request.dictionary_name
        )}" and field ${TEXT_DECODER.decode(request.field)} and amount ${
          request.amount
        } and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
          request.refresh_ttl ? 'true' : 'false'
        }`;
      }
      case cache.cache_client._DictionaryDeleteRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._DictionaryDeleteRequest;
        return (
          `DictionaryDeleteRequest with dictionary name "${TEXT_DECODER.decode(
            request.dictionary_name
          )}" and fields ` +
          request.some.fields.reduce(
            (acc, field) => acc + TEXT_DECODER.decode(field) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._DictionaryLengthRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._DictionaryLengthRequest;
        return `DictionaryLengthRequest with dictionary name "${TEXT_DECODER.decode(
          request.dictionary_name
        )}"`;
      }
      case cache.cache_client._SetFetchRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetFetchRequest;
        return `SetFetchRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}"`;
      }
      case cache.cache_client._SetSampleRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetSampleRequest;
        return `SetSampleRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}" and sample size (limit) ${request.limit}`;
      }
      case cache.cache_client._SetUnionRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetUnionRequest;
        return (
          `SetUnionRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
            request.refresh_ttl ? 'true' : 'false'
          } and elements ` +
          request.elements.reduce(
            (acc, element) => acc + TEXT_DECODER.decode(element) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._SetDifferenceRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetDifferenceRequest;
        return (
          `SetDifferenceRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and elements ` +
          request.subtrahend.set.elements.reduce(
            (acc, element) => acc + TEXT_DECODER.decode(element) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._SetContainsRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetContainsRequest;
        return (
          `SetContainsRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and elements ` +
          request.elements.reduce(
            (acc, element) => acc + TEXT_DECODER.decode(element) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._SetLengthRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SetLengthRequest;
        return `SetLengthRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}"`;
      }
      case cache.cache_client._SetPopRequest: {
        const request = this._grpcMessage as cache.cache_client._SetPopRequest;
        return `SetPopRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}" and count ${request.count}`;
      }
      case cache.cache_client._ListConcatenateFrontRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListConcatenateFrontRequest;
        return (
          `ListConcatenateFrontRequest with list name "${TEXT_DECODER.decode(
            request.list_name
          )}" and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
            request.refresh_ttl ? 'true' : 'false'
          } and truncate back to size ${
            request.truncate_back_to_size
          } and values ` +
          request.values.reduce(
            (acc, value) => acc + TEXT_DECODER.decode(value) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._ListConcatenateBackRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListConcatenateBackRequest;
        return (
          `ListConcatenateBackRequest with list name "${TEXT_DECODER.decode(
            request.list_name
          )}" and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
            request.refresh_ttl ? 'true' : 'false'
          } and truncate front to size ${
            request.truncate_front_to_size
          } and values ` +
          request.values.reduce(
            (acc, value) => acc + TEXT_DECODER.decode(value) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._ListPushFrontRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListPushFrontRequest;
        return `ListPushFrontRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}" and value ${TEXT_DECODER.decode(request.value)} and ttl (ms) ${
          request.ttl_milliseconds
        } and refresh ttl ${
          request.refresh_ttl ? 'true' : 'false'
        } and truncate back to size ${request.truncate_back_to_size}`;
      }
      case cache.cache_client._ListPushBackRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListPushBackRequest;
        return `ListPushBackRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}" and value ${TEXT_DECODER.decode(request.value)} and ttl (ms) ${
          request.ttl_milliseconds
        } and refresh ttl ${
          request.refresh_ttl ? 'true' : 'false'
        } and truncate front to size ${request.truncate_front_to_size}`;
      }
      case cache.cache_client._ListPopFrontRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListPopFrontRequest;
        return `ListPopFrontRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}"`;
      }
      case cache.cache_client._ListPopBackRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListPopBackRequest;
        return `ListPopBackRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}"`;
      }
      case cache.cache_client._ListRemoveRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListRemoveRequest;
        return `ListRemoveRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}" and remove value ${TEXT_DECODER.decode(
          request.all_elements_with_value
        )}`;
      }
      case cache.cache_client._ListFetchRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListFetchRequest;
        return `ListFetchRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}" and inclusive start index ${
          request.unbounded_start ? 'unbounded' : request.inclusive_start
        } and exclusive end index ${
          request.unbounded_end ? 'unbounded' : request.exclusive_end
        }`;
      }
      case cache.cache_client._ListRetainRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListRetainRequest;
        return `ListRetainRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}" and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
          request.refresh_ttl ? 'true' : 'false'
        } and inclusive start index ${
          request.unbounded_start ? 'unbounded' : request.inclusive_start
        } and exclusive end index ${
          request.unbounded_end ? 'unbounded' : request.exclusive_end
        }`;
      }
      case cache.cache_client._ListLengthRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._ListLengthRequest;
        return `ListLengthRequest with list name "${TEXT_DECODER.decode(
          request.list_name
        )}"`;
      }
      case cache.cache_client._SortedSetPutRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetPutRequest;
        return (
          `SortedSetPutRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
            request.refresh_ttl ? 'true' : 'false'
          } and elements ` +
          request.elements.reduce(
            (acc, element) =>
              acc +
              `(value ${TEXT_DECODER.decode(element.value)} | score ${
                element.score
              }), `,
            ''
          )
        );
      }
      case cache.cache_client._SortedSetFetchRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetFetchRequest;
        if (request.has_by_index) {
          return `SortedSetFetchRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and sort order ${
            request.order ? 'DESCENDING' : 'ASCENDING'
          } and inclusive start index ${
            request.by_index.inclusive_start_index ?? 'unbounded'
          } and exclusive end index ${
            request.by_index.exclusive_end_index ?? 'unbounded'
          }`;
        }
        return `SortedSetFetchRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}" and sort order ${
          request.order ? 'DESCENDING' : 'ASCENDING'
        } and inclusive min score ${
          request.by_score.min_score?.score ?? 'unbounded'
        } and inclusive max score ${
          request.by_score.max_score?.score ?? 'unbounded'
        }`;
      }
      case cache.cache_client._SortedSetGetScoreRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetGetScoreRequest;
        return (
          `SortedSetGetScoreRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and values ` +
          request.values.reduce(
            (acc, value) => acc + TEXT_DECODER.decode(value) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._SortedSetRemoveRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetRemoveRequest;
        return (
          `SortedSetRemoveRequest with set name "${TEXT_DECODER.decode(
            request.set_name
          )}" and values ` +
          request.some.values.reduce(
            (acc, value) => acc + TEXT_DECODER.decode(value) + ', ',
            ''
          )
        );
      }
      case cache.cache_client._SortedSetIncrementRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetIncrementRequest;
        return `SortedSetIncrementRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}" and value ${TEXT_DECODER.decode(request.value)} and amount ${
          request.amount
        } and ttl (ms) ${request.ttl_milliseconds} and refresh ttl ${
          request.refresh_ttl ? 'true' : 'false'
        }`;
      }
      case cache.cache_client._SortedSetGetRankRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetGetRankRequest;
        return `SortedSetGetRankRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}" and value ${TEXT_DECODER.decode(request.value)} and sort order ${
          request.order ? 'DESCENDING' : 'ASCENDING'
        }`;
      }
      case cache.cache_client._SortedSetLengthRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetLengthRequest;
        return `SortedSetLengthRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}"`;
      }
      case cache.cache_client._SortedSetLengthByScoreRequest: {
        const request = this
          ._grpcMessage as cache.cache_client._SortedSetLengthByScoreRequest;
        return `SortedSetLengthByScoreRequest with set name "${TEXT_DECODER.decode(
          request.set_name
        )}" and min score ${
          String(request.inclusive_min) + ' (inclusive)' ||
          String(request.exclusive_min) + ' (exclusive)' ||
          'unbounded'
        } and max score ${
          String(request.inclusive_max) + ' (inclusive)' ||
          String(request.exclusive_max) + ' (exclusive)' ||
          'unbounded'
        }`;
      }
      case leaderboard.leaderboard._DeleteLeaderboardRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._DeleteLeaderboardRequest;
        return `DeleteLeaderboardRequest with cache name "${request.cache_name}" and leaderboard name "${request.leaderboard}"`;
      }
      case leaderboard.leaderboard._GetLeaderboardLengthRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._GetLeaderboardLengthRequest;
        return `GetLeaderboardLengthRequest with cache name "${request.cache_name}" and leaderboard name "${request.leaderboard}"`;
      }
      case leaderboard.leaderboard._UpsertElementsRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._UpsertElementsRequest;
        return (
          `UpsertElementsRequest with cache name "${request.cache_name}" and leaderboard name "${request.leaderboard}" and elements ` +
          request.elements.reduce(
            (acc, element) =>
              acc + `(id "${element.id}" | score ${element.score}), `,
            ''
          )
        );
      }
      case leaderboard.leaderboard._GetByRankRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._GetByRankRequest;
        return `GetByRankRequest with cache name "${
          request.cache_name
        }" and leaderboard name "${request.leaderboard}" and order ${
          request.order ? 'DESCENDING' : 'ASCENDING'
        } and inclusive start rank ${
          request.rank_range.start_inclusive
        } and exclusive end rank ${request.rank_range.end_exclusive}`;
      }
      case leaderboard.leaderboard._GetRankRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._GetRankRequest;
        return (
          `GetRankRequest with cache name "${
            request.cache_name
          }" and leaderboard name "${request.leaderboard}" and order ${
            request.order ? 'DESCENDING' : 'ASCENDING'
          } for IDs ` +
          request.ids.reduce((acc, id) => acc + String(id) + ', ', '')
        );
      }
      case leaderboard.leaderboard._RemoveElementsRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._RemoveElementsRequest;
        return (
          `RemoveElementsRequest with cache name "${request.cache_name}" and leaderboard name "${request.leaderboard}" for IDs ` +
          request.ids.reduce((acc, id) => acc + String(id) + ', ', '')
        );
      }
      case leaderboard.leaderboard._GetByScoreRequest: {
        const request = this
          ._grpcMessage as leaderboard.leaderboard._GetByScoreRequest;
        return `GetByScoreRequest with cache name "${
          request.cache_name
        }" and leaderboard name "${request.leaderboard}" and order ${
          request.order ? 'DESCENDING' : 'ASCENDING'
        } and offset ${request.offset} and limit ${
          request.limit_elements
        } and inclusive min score ${
          request.score_range.min_inclusive ?? 'unbounded'
        } and exclusive max score ${
          request.score_range.max_exclusive ?? 'unbounded'
        }`;
      }
      default: {
        return this.constructorName();
      }
    }
  }
}

export interface MiddlewareRequestHandler {
  onRequestMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata>;
  onRequestBody(request: MiddlewareMessage): Promise<MiddlewareMessage>;

  onResponseMetadata(metadata: MiddlewareMetadata): Promise<MiddlewareMetadata>;
  onResponseBody(
    response: MiddlewareMessage | null
  ): Promise<MiddlewareMessage | null>;
  onResponseStatus(status: MiddlewareStatus): Promise<MiddlewareStatus>;
}

export interface MiddlewareRequestHandlerContext {
  [key: symbol]: string;
}

/**
 * The Middleware interface allows the Configuration to provide a higher-order function that wraps all requests.
 * This allows future support for things like client-side metrics or other diagnostics helpers.
 *
 * An optional context can be provided that is essentially a <key, value> map {@link MiddlewareRequestHandlerContext}.
 * The context object is available to each individual invocation of the request handler for the middleware.
 */
export interface Middleware {
  onNewRequest(
    context?: MiddlewareRequestHandlerContext
  ): MiddlewareRequestHandler;
  init?(): void;
  close?(): void;
}
