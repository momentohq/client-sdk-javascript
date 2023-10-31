import {truncateString} from '../../internal/utils';

export interface TopicItemOptions {
  tokenId?: string;
}

/**
 * Represents the data received from a topic subscription.
 *
 * @remarks A subscription is created by calling {@link TopicClient.subscribe}.
 * The value is guaranteed to be either a {@link string} or a {@link Uint8Array}.
 * Call the appropriate accessor if you know the type of the value.
 */
export class TopicItem {
  private readonly _value: string | Uint8Array;
  private readonly _tokenId?: string;

  constructor(_value: string | Uint8Array, options?: TopicItemOptions) {
    this._value = _value;
    this._tokenId = options?.tokenId;
  }

  /**
   * Returns the data read from the stream.
   * @returns string | Uint8Array
   */
  public value(): string | Uint8Array {
    return this._value;
  }

  /**
   * Returns the data read from the stream as a {@link string}.
   * @returns string
   */
  public valueString(): string {
    return this.value().toString();
  }

  /**
   * Returns the data read from the stream as a {@link Uint8Array}.
   * @returns Uint8Array
   */
  public valueUint8Array(): Uint8Array {
    return this.value() as Uint8Array;
  }

  /**
   * Optionally returns the publisher ID from the steam if it exists.
   * @returns string | undefined
   */
  public tokenId(): string | undefined {
    return this._tokenId;
  }

  public toString(): string {
    const displayValue = truncateString(this.value().toString());
    let displayString = `${this.constructor.name}: ${displayValue}`;

    if (this._tokenId !== undefined) {
      displayString += `; Token Id: ${this._tokenId}`;
    }

    return displayString;
  }
}
