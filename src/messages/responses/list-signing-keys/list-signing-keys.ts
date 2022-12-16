import {ListSigningKeysResponse} from './list-signing-keys-response';
import {SigningKey} from '../../signing-key';
import {control} from '@gomomento/generated-types';
import {MomentoErrorCode, SdkError} from '../../../errors/errors';

export class Success extends ListSigningKeysResponse {
  private readonly nextToken: string | null;
  private readonly signingKeys: SigningKey[];

  constructor(
    endpoint: string,
    result?: control.control_client._ListSigningKeysResponse
  ) {
    super();
    this.nextToken = result?.next_token || null;
    this.signingKeys =
      result?.signing_key.map(
        signingKey =>
          new SigningKey(
            signingKey.key_id,
            new Date(signingKey.expires_at * 1000),
            endpoint
          )
      ) ?? [];
  }

  public getNextToken() {
    return this.nextToken;
  }

  public getSigningKeys() {
    return this.signingKeys;
  }
}

export class Error extends ListSigningKeysResponse {
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
