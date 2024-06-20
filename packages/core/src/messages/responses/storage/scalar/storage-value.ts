export class StorageValue {
  private readonly _valueInt: number | undefined = undefined;
  private readonly _valueDouble: number | undefined = undefined;
  private readonly _valueString: string | undefined = undefined;
  private readonly _valueBytes: Uint8Array | undefined = undefined;

  constructor(
    valueInt: number | undefined,
    valueDouble: number | undefined,
    valueString: string | undefined,
    valueBytes: Uint8Array | undefined
  ) {
    this._valueInt = valueInt;
    this._valueDouble = valueDouble;
    this._valueString = valueString;
    this._valueBytes = valueBytes;
  }

  static ofInt(value: number): StorageValue {
    return new StorageValue(value, undefined, undefined, undefined);
  }

  static ofDouble(value: number): StorageValue {
    return new StorageValue(undefined, value, undefined, undefined);
  }

  static ofString(value: string): StorageValue {
    return new StorageValue(undefined, undefined, value, undefined);
  }

  static ofBytes(value: Uint8Array): StorageValue {
    return new StorageValue(undefined, undefined, undefined, value);
  }

  int(): number | undefined {
    return this._valueInt;
  }
  double(): number | undefined {
    return this._valueDouble;
  }
  string(): string | undefined {
    return this._valueString;
  }
  bytes(): Uint8Array | undefined {
    return this._valueBytes;
  }
}
