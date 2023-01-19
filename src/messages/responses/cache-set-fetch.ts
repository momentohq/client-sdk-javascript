import * as ResponseBase from './response-base';
import {TextDecoder} from 'util';
import {truncateStringArray} from '../../utils/display';

const TEXT_DECODER = new TextDecoder();

export {Response, Miss, Error} from './response-base';

export class Hit extends ResponseBase.Hit {
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
