import {CacheDeleteResponse} from './cache-delete-response';

export class Success extends CacheDeleteResponse {}

export class Error extends CacheDeleteResponse {
  private readonly errorMessage: string;
  // TODO MOAR FIELDS
  constructor(message: string) {
    super();
    this.errorMessage = message;
  }

  public message(): string {
    return this.errorMessage;
  }
}
