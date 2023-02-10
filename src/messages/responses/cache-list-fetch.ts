import {SdkError} from '../../errors/errors';
import {
  ResponseBase,
  ResponseError,
  ResponseHit,
  ResponseMiss,
} from './response-base';
import {TextDecoder} from 'util';
import {truncateStringArray} from '../../internal/utils/display';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {
  public hitOrElse<T>(hitFn: (h: Hit) => T, elseFn: () => T): T {
    if (this instanceof Hit) {
      return hitFn(this);
    } else {
      return elseFn();
    }
  }
}

class _Hit extends Response {
  private readonly _values: Uint8Array[];
  constructor(values: Uint8Array[]) {
    super();
    this._values = values;
  }

  public valueListUint8Array(): Uint8Array[] {
    return this._values;
  }

  public valueListString(): string[] {
    return this._values.map(v => TEXT_DECODER.decode(v));
  }

  public valueList(): string[] {
    return this.valueListString();
  }

  public override toString(): string {
    const truncatedStringArray = truncateStringArray(this.valueListString());
    return `${super.toString()}: [${truncatedStringArray.toString()}]`;
  }
}
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
