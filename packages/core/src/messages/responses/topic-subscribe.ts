import {SdkError} from '../../errors';
import {ResponseBase, ResponseError} from './response-base';
import {SubscriptionState} from '../../internal/subscription-state';

/**
 * Parent response type for a cache get request.  The
 * response object is resolved to a type-safe object of one of
 * the following subtypes:
 *
 * - {Subscription}
 * - {Item}
 * - {Error}
 *
 * `instanceof` type guards can be used to operate on the appropriate subtype.
 * @example
 * For example:
 * ```
 * if (response instanceof TopicSubscribe.Error) {
 *   // Handle error as appropriate.  The compiler will smart-cast `response` to type
 *   // `CacheGet.Error` in this block, so you will have access to the properties
 *   // of the Error class; e.g. `response.errorCode()`.
 * }
 * ```
 */
export abstract class Response extends ResponseBase {}

/**
 * Encapsulates a topic subscription.
 *
 * @remarks Currently allows unsubscribing from the topic.
 * In the future, this may be extended to include additional
 * statistics about the subscription.
 */
export class Subscription extends Response {
  private subscriptionState: SubscriptionState;

  constructor(subscriptionState: SubscriptionState) {
    super();
    this.subscriptionState = subscriptionState;
  }

  /**
   * Unsubscribes from the topic.
   *
   * @returns void
   */
  public unsubscribe(): void {
    this.subscriptionState.unsubscribe();
  }

  public get isSubscribed(): boolean {
    return this.subscriptionState.isSubscribed;
  }
}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

/**
 * Indicates that an error occurred during the topic subscribe request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends ResponseError(_Error) {}
