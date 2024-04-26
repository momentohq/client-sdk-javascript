import {StoreValueType} from './store-value-type';

export enum ResponseType {
  Success = 'success',
  Error = 'error',
}

interface ISuccess<T> {
  value: T;
  type: StoreValueType;
  response: ResponseType.Success;
}

export class Error {
  constructor(protected _message: string) {}

  get message(): string {
    return this._message;
  }

  response: ResponseType.Error;
}

export class StringValue implements ISuccess<string> {
  private readonly _value: string = '';
  constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  type: StoreValueType.STRING;
  response: ResponseType.Success;
}

export class IntegerValue implements ISuccess<number> {
  private readonly _value: number;
  constructor(value: number) {
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  type: StoreValueType.INTEGER;
  response: ResponseType.Success;
}

export class BooleanValue implements ISuccess<boolean> {
  private readonly _value: boolean;
  constructor(value: boolean) {
    this._value = value;
  }

  get value(): boolean {
    return this._value;
  }

  type: StoreValueType.BOOLEAN;
  response: ResponseType.Success;
}

type Success = InstanceType<typeof StringValue> | InstanceType<typeof IntegerValue> | InstanceType<typeof BooleanValue>;

export type Response = Success | Error;
