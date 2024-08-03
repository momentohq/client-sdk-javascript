/**
 * Encapsulates a topic subscription stream state.
 */
export class SubscriptionState {
  private _unsubscribeFn: () => void;
  public lastTopicSequenceNumber?: number;
  private _isSubscribed: boolean;
  constructor() {
    this._unsubscribeFn = () => {
      return;
    };
    this._isSubscribed = false;
  }

  public get resumeAtTopicSequenceNumber(): number {
    return (this.lastTopicSequenceNumber ?? -1) + 1;
  }

  public setSubscribed(): void {
    this._isSubscribed = true;
  }

  public setUnsubscribed(): void {
    this._isSubscribed = false;
  }

  public get isSubscribed(): boolean {
    return this._isSubscribed;
  }

  public set unsubscribeFn(unsubscribeFn: () => void) {
    this._unsubscribeFn = unsubscribeFn;
  }

  public unsubscribe(): void {
    if (this.isSubscribed) {
      this._unsubscribeFn();
      this.setUnsubscribed();
    }
  }

  public toString(): string {
    return JSON.stringify(
      {
        lastTopicSequenceNumber: this.lastTopicSequenceNumber,
        isSubscribed: this._isSubscribed,
      },
      null,
      2
    );
  }
}
