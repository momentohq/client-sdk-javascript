/**
 * Encapsulates gRPC configuration tunables.
 * @export
 * @interface GrpcConfiguration
 */
export interface GrpcConfiguration {
  /**
   * @returns {number} number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   *    with a DeadlineExceeded error.
   */
  getDeadlineMilliseconds(): number;

  /**
   * Copy constructor for overriding the client-side deadline
   * @param {number} deadlineMilliseconds
   * @returns {GrpcConfiguration} a new GrpcConfiguration with the specified client-side deadline
   */
  withDeadlineMilliseconds(deadlineMilliseconds: number): GrpcConfiguration;

  /**
   * @returns {number} the maximum amount of memory, in megabytes, that a session is allowed to consume.  Sessions that consume
   *    more than this amount will return a ResourceExhausted error.
   */
  getMaxSessionMemoryMb(): number;

  /**
   * Copy constructor for overriding the max session memory
   * @param {number} maxSessionMemoryMb the desired maximum amount of memory, in megabytes, to allow a client session to consume
   * @returns {GrpcConfiguration} a new GrpcConfiguration with the specified maximum memory
   */
  withMaxSessionMemoryMb(maxSessionMemoryMb: number): GrpcConfiguration;
}
