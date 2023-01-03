import {SigningKey} from '../signing-key';
import {control} from '@gomomento/generated-types';
import {SdkError} from '../../errors/errors';
import {ResponseBase} from './response-base';
import {applyMixins, ErrorBody} from '../../errors/error-utils';

export abstract class Response extends ResponseBase {}

export class Success extends Response {
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

export class Error extends Response {
  constructor(protected _innerException: SdkError) {
    super();
  }
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Error extends ErrorBody {}
applyMixins(Error, [ErrorBody]);
