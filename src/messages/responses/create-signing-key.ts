import {control} from '@gomomento/generated-types';
import {SdkError} from '../../errors/errors';
import {ResponseBase, ResponseError, ResponseSuccess} from './response-base';

export abstract class Response extends ResponseBase {}

class _Success extends Response {
  private readonly keyId: string;
  private readonly endpoint: string;
  private readonly key: string;
  private readonly expiresAt: Date;

  constructor(
    endpoint: string,
    result?: control.control_client._CreateSigningKeyResponse
  ) {
    super();
    const key = result?.key ?? '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    this.keyId = JSON.parse(key)['kid'];
    this.endpoint = endpoint;
    this.key = key;
    this.expiresAt = new Date(result?.expires_at ?? 0 * 1000);
  }

  public getKeyId(): string {
    return this.keyId;
  }

  public getEndpoint(): string {
    return this.endpoint;
  }

  public getKey(): string {
    return this.key;
  }

  public getExpiresAt(): Date {
    return this.expiresAt;
  }
}
export class Success extends ResponseSuccess(_Success) {}

class _Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
export class Error extends ResponseError(_Error) {}
