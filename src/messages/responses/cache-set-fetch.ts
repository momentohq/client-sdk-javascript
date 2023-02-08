import {
  ResponseBase,
  ResponseError,
  ResponseMiss,
  ResponseHit,
} from './response-base';
import {SdkError} from '../../errors/errors';
import {TextDecoder} from 'util';
import {truncateStringArray} from '../../internal/utils/display';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

class _Hit extends Response {
  private readonly elements: Uint8Array[];

  constructor(elements: Uint8Array[]) {
    super();
    this.elements = elements;
  }

  public valueSetString(): Set<string> {
    return new Set(this.elements.map(e => TEXT_DECODER.decode(e)));
  }

  public valueSetUint8Array(): Set<Uint8Array> {
    return new Set(this.elements);
  }

  public override toString(): string {
    const truncatedStringArray = truncateStringArray(
      Array.from(this.valueSetString())
    );
    return `${super.toString()}: [${truncatedStringArray.toString()}]`;
  }
}
export class Hit extends ResponseHit(_Hit) {}

class _Miss extends Response {}
export class Miss extends ResponseMiss(_Miss) {}

class _Error extends Response {
  constructor(public _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
