export interface StorageGrpcConfigurationProps {
  /**
   * number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   * with a DeadlineExceeded error.
   */
  deadlineMillis: number;
  /**
   * number of milliseconds the client is willing to wait for response data to be received before retrying (defaults to 1000ms). After the deadlineMillis has been reached, the client will terminate the RPC with a Cancelled error.
   */
  responseDataReceivedTimeoutMillis: number;
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

  /**
   * @returns {number} number of milliseconds the client is willing to wait for response data to be received before retrying (defaults to 1000ms). After the deadlineMillis has been reached, the client will terminate the RPC with a Cancelled error.
   */
  getResponseDataReceivedTimeoutMillis(): number;

  /**
   * Copy constructor for overriding the client-side deadline for receiving response data before retrying the request
   * @param {number} responseDataReceivedTimeoutMillis
   * @returns {StorageGrpcConfiguration} a new StorageGrpcConfiguration with the specified timeout
   */
  withResponseDataReceivedTimeoutMillis(
    responseDataReceivedTimeoutMillis: number
  ): StorageGrpcConfiguration;
}
