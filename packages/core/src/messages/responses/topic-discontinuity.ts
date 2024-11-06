/**
 * Represents a discontinuity in a topic subscription.
 *
 * @remarks A subscription is created by calling {@link TopicClient.subscribe}.
 */
export class TopicDiscontinuity {
  private readonly _lastSequenceNumber: number;
  private readonly _newSequenceNumber: number;
  private readonly _newSequencePage: number;

  constructor(
    _lastSequenceNumber: number,
    _newSequenceNumber: number,
    _newSequencePage: number
  ) {
    this._lastSequenceNumber = _lastSequenceNumber;
    this._newSequenceNumber = _newSequenceNumber;
    this._newSequencePage = _newSequencePage;
  }

  /**
   * Returns the last sequence number before the discontinuity.
   * @returns number
   */
  public lastSequenceNumber(): number {
    return this._lastSequenceNumber;
  }

  /**
   * Returns the new sequence number after the discontinuity.
   * @returns number
   */
  public newSequenceNumber(): number {
    return this._newSequenceNumber;
  }

  /**
   * Returns the new sequence page after the discontinuity.
   * @returns number
   */
  public newSequencePage(): number {
    return this._newSequencePage;
  }

  public toString(): string {
    const displayValue = `Last Sequence Number: ${this._lastSequenceNumber}; New Sequence Number: ${this._newSequenceNumber}`;
    return `${this.constructor.name}: ${displayValue}`;
  }
}
