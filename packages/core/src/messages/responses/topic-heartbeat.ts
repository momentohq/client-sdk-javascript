/**
 * Represents a heartbeat received from a topic subscription indicating the connection is alive.
 *
 * @remarks A subscription is created by calling {@link TopicClient.subscribe}.
 */
export class TopicHeartbeat {
  public toString(): string {
    return `${this.constructor.name}`;
  }
}
