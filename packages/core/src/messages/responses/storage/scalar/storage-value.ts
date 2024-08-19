export interface StorageValueProps {
  valueInt?: number;
  valueDouble?: number;
  valueString?: string;
  valueBytes?: Uint8Array;
}

/**
 * Represents a value stored in the cache, which can be an integer, double, string, or byte array.
 */
export class StorageValue {
  private readonly _valueInt: number | undefined;
  private readonly _valueDouble: number | undefined;
  private readonly _valueString: string | undefined;
  private readonly _valueBytes: Uint8Array | undefined;

  /**
   * Creates an instance of the StorageValue class.
   * @param {number | undefined} valueInt - The integer value to be stored.
   * @param {number | undefined} valueDouble - The double value to be stored.
   * @param {string | undefined} valueString - The string value to be stored.
   * @param {Uint8Array | undefined} valueBytes - The byte array value to be stored.
   */
  constructor(props: StorageValueProps) {
    this._valueInt = props.valueInt;
    this._valueDouble = props.valueDouble;
    this._valueString = props.valueString;
    this._valueBytes = props.valueBytes;
  }

  /**
   * Creates a StorageValue instance with an integer value.
   * @param {number} value - The integer value to be stored.
   * @returns {StorageValue} - A StorageValue instance containing the integer value.
   */
  static ofInt(value: number): StorageValue {
    return new StorageValue({valueInt: value});
  }

  /**
   * Creates a StorageValue instance with a double value.
   * @param {number} value - The double value to be stored.
   * @returns {StorageValue} - A StorageValue instance containing the double value.
   */
  static ofDouble(value: number): StorageValue {
    return new StorageValue({valueDouble: value});
  }

  /**
   * Creates a StorageValue instance with a string value.
   * @param {string} value - The string value to be stored.
   * @returns {StorageValue} - A StorageValue instance containing the string value.
   */
  static ofString(value: string): StorageValue {
    return new StorageValue({valueString: value});
  }

  /**
   * Creates a StorageValue instance with a byte array value.
   * @param {Uint8Array} value - The byte array value to be stored.
   * @returns {StorageValue} - A StorageValue instance containing the byte array value.
   */
  static ofBytes(value: Uint8Array): StorageValue {
    return new StorageValue({valueBytes: value});
  }

  /**
   * Retrieves the integer value stored in this instance.
   * @returns {number | undefined} - The integer value, or undefined if no integer value is present.
   */
  int(): number | undefined {
    return this._valueInt;
  }
  /**
   * Retrieves the double value stored in this instance.
   * @returns {number | undefined} - The double value, or undefined if no double value is present.
   */
  double(): number | undefined {
    return this._valueDouble;
  }
  /**
   * Retrieves the string value stored in this instance.
   * @returns {string | undefined} - The string value, or undefined if no string value is present.
   */
  string(): string | undefined {
    return this._valueString;
  }
  /**
   * Retrieves the byte array value stored in this instance.
   * @returns {Uint8Array | undefined} - The byte array value, or undefined if no byte array value is present.
   */
  bytes(): Uint8Array | undefined {
    return this._valueBytes;
  }
}
