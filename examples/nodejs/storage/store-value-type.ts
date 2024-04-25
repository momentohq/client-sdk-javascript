export enum StoreValueType {
  STRING = 'string',
  INTEGER = 'integer',
  FLOAT = 'float',
  BOOLEAN = 'boolean',
}

export class StoreValueTypeError extends Error {
  constructor(message: string) {
    super(message);
  }
}
