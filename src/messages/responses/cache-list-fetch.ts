import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';
import {TextDecoder} from 'util';
import {truncateString} from '../../utils/display';

const TEXT_DECODER = new TextDecoder();

export abstract class Response extends ResponseBase {}

export class Hit extends Response {
  private readonly _displayListSizeLimit = 5;
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

  private truncateValueStrings(): string[] {
    const values = this.valueListString();
    if (values.length <= this._displayListSizeLimit) {
      return values;
    } else {
      return values.slice(0, this._displayListSizeLimit).concat(['...']);
    }
  }

  public override toString(): string {
    const displayList = this.truncateValueStrings();
    const asStrings = displayList.map(v => {
      return truncateString(v);
    });
    return `${super.toString()}: [${asStrings.toString()}]`;
  }
}

export class Miss extends Response {}

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
