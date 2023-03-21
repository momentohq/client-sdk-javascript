// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError} from './response-base';
import {truncateString} from '../../internal/utils/display';
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

export class Item extends Response {
  private readonly _value: string | Uint8Array;
  constructor(_value: string | Uint8Array) {
    super();
    this._value = _value;
  }
  /**
   * Returns the data read from the stream.
   * @returns string | Uint8Array
   */
  public value(): string | Uint8Array {
    return this._value;
  }

  /**
   * Returns the data read from the stream as a string.
   * @returns string
   */
  public valueString(): string {
    return this.value().toString();
  }

  /**
   * Returns the data read from the stream as a Uint8Array.
   * @returns Uint8Array
   */
  public valueUint8Array(): Uint8Array {
    return this.value() as Uint8Array;
  }

  public override toString(): string {
    const display = truncateString(this.value().toString());
    return `${super.toString()}: ${display}`;
  }
}

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
