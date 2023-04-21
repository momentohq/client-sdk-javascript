import {truncateString} from '../../internal/utils/display';

/**
 * Represents the data received from a topic subscription.
 *
 * @remarks A subscription is created by calling {@link TopicClient.subscribe}.
 * The value is guaranteed to be either a {@link string} or a {@link Uint8Array}.
 * Call the appropriate accessor if you know the type of the value.
 */
export class TopicItem {
  private readonly _value: string | Uint8Array;
  constructor(_value: string | Uint8Array) {
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

  public toString(): string {
    const display = truncateString(this.value().toString());
    return `${this.constructor.name}: ${display}`;
  }
}
