import * as ResponseBase from './response-base';

export {Response, Error} from './response-base';

export class Success extends ResponseBase.Success {
  private readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }

  public valueNumber(): number {
    return this.value;
  }

  public override toString(): string {
    return `${super.toString()}: value: ${this.valueNumber()}`;
  }
}
