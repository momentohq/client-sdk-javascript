import {control} from '@gomomento/generated-types';

export class CreateSigningKeyResponse {
  private readonly keyId: string;
  private readonly endpoint: string;
  private readonly key: string;
  private readonly expiresAt: Date;

  constructor(
    endpoint: string,
    result?: control.control_client._CreateSigningKeyResponse
  ) {
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
