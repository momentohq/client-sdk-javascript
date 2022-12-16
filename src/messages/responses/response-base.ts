export abstract class ResponseBase {
  public toString(): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const parentName = Object.getPrototypeOf(this.constructor).name as string;
    const myName = this.constructor.name;
    return `${parentName}.${myName}`;
  }
}
