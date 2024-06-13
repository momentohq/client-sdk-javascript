import {StoreGetResponse} from '../../enums';
import {BaseResponseError, ResponseBase} from '../../response-base';
import {SdkError} from '../../../../errors';

interface IResponse {
  type: StoreGetResponse;
  value(): string | number | Uint8Array | undefined;
}

export class StringResponse extends ResponseBase implements IResponse {
  private readonly _value: string;
  constructor(value: string) {
    super();
    this._value = value;
  }

  value(): string {
    return this._value;
  }

  type: StoreGetResponse.String;
}

export class IntegerResponse extends ResponseBase implements IResponse {
  private readonly _value: number;
  constructor(value: number) {
    super();
    this._value = value;
  }

  value(): number {
    return this._value;
  }

  type: StoreGetResponse.Integer;
}

export class DoubleResponse extends ResponseBase implements IResponse {
  private readonly _value: number;
  constructor(value: number) {
    super();
    this._value = value;
  }

  value(): number {
    return this._value;
  }

  type: StoreGetResponse.Double;
}

export class BytesResponse extends ResponseBase implements IResponse {
  private readonly _value: Uint8Array;
  constructor(value: Uint8Array) {
    super();
    this._value = value;
  }

  value(): Uint8Array {
    return this._value;
  }

  type: StoreGetResponse.Bytes;
}

export class Miss extends ResponseBase implements IResponse {
  constructor() {
    super();
  }

  value(): undefined {
    return undefined;
  }

  type: StoreGetResponse.Miss;
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
  readonly type: StoreGetResponse.Error = StoreGetResponse.Error;
  constructor(_innerException: SdkError) {
    super(_innerException);
  }

  value(): undefined {
    return undefined;
  }
}

export type Hit =
  | InstanceType<typeof StringResponse>
  | InstanceType<typeof IntegerResponse>
  | InstanceType<typeof DoubleResponse>
  | InstanceType<typeof BytesResponse>;

export type Response = Hit | Miss | Error;
