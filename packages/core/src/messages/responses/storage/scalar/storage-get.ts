import {StorageItemType, StorageGetResponse} from '../../enums';
import {BaseResponseError, ResponseBase} from '../../response-base';
import {SdkError} from '../../../../errors';

interface IResponse {
  readonly type: StorageGetResponse;
  value(): string | number | Uint8Array | undefined;
}

export abstract class Success extends ResponseBase implements IResponse {
  readonly type: StorageGetResponse.Success;
  readonly itemType: StorageItemType;

  abstract value(): string | number | Uint8Array;

  abstract intValue(): number | undefined;

  abstract doubleValue(): number | undefined;

  abstract stringValue(): string | undefined;

  abstract bytesValue(): Uint8Array | undefined;
}

export class StringResponse extends Success {
  override readonly itemType: StorageItemType.String = StorageItemType.String;
  private readonly _value: string;
  constructor(value: string) {
    super();
    this._value = value;
  }

  value(): string {
    return this._value;
  }

  bytesValue(): undefined {
    return undefined;
  }

  doubleValue(): undefined {
    return undefined;
  }

  intValue(): undefined {
    return undefined;
  }

  stringValue(): string {
    return this.value();
  }
}

export class IntegerResponse extends Success {
  override readonly itemType: StorageItemType.Integer = StorageItemType.Integer;
  private readonly _value: number;
  constructor(value: number) {
    super();
    this._value = value;
  }

  value(): number {
    return this._value;
  }

  bytesValue(): undefined {
    return undefined;
  }

  doubleValue(): undefined {
    return undefined;
  }

  intValue(): number | undefined {
    return this.value();
  }

  stringValue(): undefined {
    return undefined;
  }
}

export class DoubleResponse extends Success {
  override readonly itemType: StorageItemType.Double = StorageItemType.Double;
  private readonly _value: number;
  constructor(value: number) {
    super();
    this._value = value;
  }

  value(): number {
    return this._value;
  }

  bytesValue(): undefined {
    return undefined;
  }

  doubleValue(): number {
    return this.value();
  }

  intValue(): undefined {
    return undefined;
  }

  stringValue(): undefined {
    return undefined;
  }
}

export class BytesResponse extends Success {
  override readonly itemType: StorageItemType.Bytes = StorageItemType.Bytes;
  private readonly _value: Uint8Array;
  constructor(value: Uint8Array) {
    super();
    this._value = value;
  }

  value(): Uint8Array {
    return this._value;
  }

  bytesValue(): Uint8Array {
    return this.value();
  }

  doubleValue(): undefined {
    return undefined;
  }

  intValue(): undefined {
    return undefined;
  }

  stringValue(): undefined {
    return undefined;
  }
}

/**
 * Indicates that an error occurred during the cache get request.
 *
 * This response object includes the following fields that you can use to determine
 * how you would like to handle the error:
 *
 * - `errorCode()` - a unique Momento error code indicating the type of error that occurred.
 * - `message()` - a human-readable description of the error
 * - `innerException()` - the original error that caused the failure; can be re-thrown.
 */
export class Error extends BaseResponseError implements IResponse {
  readonly type: StorageGetResponse.Error = StorageGetResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Response =
  | DoubleResponse
  | BytesResponse
  | StringResponse
  | IntegerResponse
  | Error;
