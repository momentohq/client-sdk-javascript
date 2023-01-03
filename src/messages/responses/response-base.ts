export abstract class ResponseBase {
  public toString(): string {
    return this.constructor.name;
  }
}
