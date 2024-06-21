export interface StorageGrpcConfigurationProps {
  /**
   * number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   * with a DeadlineExceeded error.
   */
  deadlineMillis: number;
}

/**
 * Encapsulates gRPC configuration tunables.
 * @export
 * @interface StorageGrpcConfiguration
 */
export interface StorageGrpcConfiguration {
  /**
   * @returns {number} number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   * with a DeadlineExceeded error.
   */
  getDeadlineMillis(): number;

  /**
   * Copy constructor for overriding the client-side deadline
   * @param {number} deadlineMillis
   * @returns {StorageGrpcConfiguration} a new StorageGrpcConfiguration with the specified client-side deadline
   */
  withDeadlineMillis(deadlineMillis: number): StorageGrpcConfiguration;
}
