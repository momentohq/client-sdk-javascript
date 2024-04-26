export enum StoreValueType {
  STRING = 'string',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
}

export class StoreValueTypeError extends Error {
  constructor(message: string) {
    super(message);
  }
}
