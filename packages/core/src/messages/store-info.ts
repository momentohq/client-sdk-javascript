/**
 * StoreInfo is a class that holds the name of the store.
 */
export class StoreInfo {
  private readonly name: string;

  /**
   * Creates an instance of the StoreInfo class.
   * @param {string} name - The name of the store.
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Retrieves the name of the store.
   * @returns {string} - The name of the store.
   */
  public getName(): string {
    return this.name;
  }
}
