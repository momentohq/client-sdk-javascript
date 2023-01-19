import * as ResponseBase from './response-base';
import {TextDecoder} from 'util';
import {truncateStringArray} from '../../utils/display';

const TEXT_DECODER = new TextDecoder();

export {Response, Miss, Error} from './response-base';

export class Hit extends ResponseBase.Hit {
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

  public override toString(): string {
    const truncatedStringArray = truncateStringArray(this.valueListString());
    return `${super.toString()}: [${truncatedStringArray.toString()}]`;
  }
}
