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
  private readonly elements: Uint8Array[];

  constructor(elements: Uint8Array[]) {
    super();
    this.elements = elements;
  }

  /**
   * Convenience alias for {valueSetString}; call this if you want to get the elements back as a Set of strings
   * @returns {Set<string>}
   */
  public valueSet(): Set<string> {
    return this.valueSetString();
  }

  /**
   * Call this if you want to get the elements back as a Set of strings
   * @returns {Set<string>}
   */
  public valueSetString(): Set<string> {
    return new Set(this.elements.map(e => TEXT_DECODER.decode(e)));
  }

  /**
   * Call this if you want to get the elements back as a Set of byte arrays
   * @returns {Set<Uint8Array>}
   */
  public valueSetUint8Array(): Set<Uint8Array> {
    return new Set(this.elements);
  }

  /**
   * Convenience alias for {valueArrayString}; call this if you want to get the elements back as an Array of strings, since
   * sometimes Array objects are easier to work with than Sets
   * @returns {string[]}
   */
  public valueArray(): string[] {
    return this.valueArrayString();
  }

  /**
   * Call this if you want to get the elements back as an Array of strings, since
   * sometimes Array objects are easier to work with than Sets
   * @returns {string[]}
   */
  public valueArrayString(): string[] {
    return this.elements.map(e => TEXT_DECODER.decode(e));
  }

  /**
   * Call this if you want to get the elements back as an Array of byte arrays, since
   * sometimes Array objects are easier to work with than Sets
   * @returns {Uint8Array[]}
   */
  public valueArrayUint8Array(): Uint8Array[] {
    return this.elements;
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
