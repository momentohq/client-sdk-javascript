import {StoreValueType, StoreValueTypeError} from './store-value-type';

export abstract class Response {}

export class Success extends Response {
  protected _type: StoreValueType;
  constructor(protected _value: string | number | boolean) {
    super();
    if (typeof _value === 'string') {
      this._type = StoreValueType.STRING;
    } else if (typeof _value === 'number') {
      this._type = Number.isInteger(_value) ? StoreValueType.INTEGER : StoreValueType.FLOAT;
    } else if (typeof _value === 'boolean') {
      this._type = StoreValueType.BOOLEAN;
    }
  }

  /**
   * The value of the store key.
   *
   * @readonly
   * @type {(string | number | boolean)}
   * @memberof Success
   */
  get value(): string | number | boolean {
    return this._value;
  }

  /**
   * The type of the value.
   *
   * @readonly
   * @type {StoreValueType}
   * @memberof Success
   */
  get type(): StoreValueType {
    return this._type;
  }

  public tryGetValueString(): string {
    if (this._type !== StoreValueType.STRING) {
      throw new StoreValueTypeError('Value is not a string');
    }
    return this._value as string;
  }

  /**
   * Try to get the value as a number.
   * @returns {number} The value as a number
   * @throws {StoreValueTypeError} If the value is not a number
   */
  public tryGetValueNumber(): number {
    if (!(this._type === StoreValueType.INTEGER || this._type === StoreValueType.FLOAT)) {
      throw new StoreValueTypeError('Value is not a number');
    }
    return this._value as number;
  }

  /**
   * Try to get the value as an integer.
   * @returns {number} The value as an integer
   * @throws {StoreValueTypeError} If the value is not an integer
   */
  public tryGetValueInteger(): number {
    if (this._type !== StoreValueType.INTEGER) {
      throw new StoreValueTypeError('Value is not an integer');
    }
    return this._value as number;
  }

  /**
   * Try to get the value as a float.
   * @returns {number} The value as a float
   * @throws {StoreValueTypeError} If the value is not a float
   */
  public tryGetValueFloat(): number {
    if (this._type !== StoreValueType.FLOAT) {
      throw new StoreValueTypeError('Value is not a float');
    }
    return this._value as number;
  }

  /**
   * Try to get the value as a boolean.
   * @returns {boolean} The value as a boolean
   * @throws {StoreValueTypeError} If the value is not a boolean
   */
  public tryGetValueBoolean(): boolean {
    if (this._type !== StoreValueType.BOOLEAN) {
      throw new StoreValueTypeError('Value is not a boolean');
    }
    return this._value as boolean;
  }
}

export class Error extends Response {
  constructor(protected _message: string) {
    super();
  }

  get message(): string {
    return this._message;
  }
}
