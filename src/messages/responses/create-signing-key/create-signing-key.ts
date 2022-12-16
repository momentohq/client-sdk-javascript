import {CreateSigningKeyResponse} from './create-signing-key-response';
import {control} from '@gomomento/generated-types';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends CreateSigningKeyResponse {
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

export class Error extends CreateSigningKeyResponse {
  private readonly _innerException: SdkError;
  constructor(err: SdkError) {
    super();
    this._innerException = err;
  }

  public message(): string {
    return this._innerException.wrappedErrorMessage();
  }

  public innerException(): object {
    return this._innerException;
  }

  public errorCode(): MomentoErrorCode {
    return this._innerException.errorCode;
  }

  public override toString(): string {
    return super.toString() + ': ' + this.message();
  }
}
