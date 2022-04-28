export class SigningKey {
  private readonly keyId: string;
  private readonly expiresAt: Date;
  private readonly endpoint: string;

  constructor(keyId: string, expiresAt: Date, endpoint: string) {
    this.keyId = keyId;
    this.expiresAt = expiresAt;
    this.endpoint = endpoint;
  }

  public getKeyId() {
    return this.keyId;
  }

  public getExpiresAt() {
    return this.expiresAt;
  }

  public getEndpoint() {
    return this.endpoint;
  }
}
