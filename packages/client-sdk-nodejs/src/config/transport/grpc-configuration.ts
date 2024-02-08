export interface GrpcConfigurationProps {
  /**
   * number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   * with a DeadlineExceeded error.
   */
  deadlineMillis: number;
  /**
   * the maximum amount of memory, in megabytes, that a session is allowed to consume.  Sessions that consume
   * more than this amount will return a ResourceExhausted error.
   */
  maxSessionMemoryMb: number;

  /**
   * The number of internal clients a cache client will create to communicate with Momento. More of them allows
   * more concurrent requests, at the cost of more open connections and the latency of setting up each client.
   */
  numClients?: number;

  /**
   * Indicates if it permissible to send keepalive pings from the client without any outstanding streams.
   */
  keepAlivePermitWithoutCalls?: number;

  /**
   * After waiting for a duration of this time, if the keepalive ping sender does not receive the ping ack,
   * it will close the transport.
   */
  keepAliveTimeoutMs?: number;

  /**
   * After a duration of this time the client/server pings its peer to see if the transport is still alive.
   */
  keepAliveTimeMs?: number;
}

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
  getDeadlineMillis(): number;

  /**
   * @returns {number} 0 or 1, if it is permissible to send a keepalive/ping without any outstanding calls.
   */
  getKeepAlivePermitWithoutCalls(): number | undefined;

  /**
   * @returns {number} the time to wait for a response from a keepalive or ping.
   */
  getKeepAliveTimeoutMS(): number | undefined;

  /**
   * @returns {number} the interval at which to send the keepalive or ping.
   */
  getKeepAliveTimeMS(): number | undefined;

  /**
   * Copy constructor for overriding the client-side deadline
   * @param {number} deadlineMillis
   * @returns {GrpcConfiguration} a new GrpcConfiguration with the specified client-side deadline
   */
  withDeadlineMillis(deadlineMillis: number): GrpcConfiguration;

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

  /**
   * @returns {number} the number of internal clients a cache client will create to communicate with Momento. More of
   * them will allow for more concurrent requests.
   */
  getNumClients(): number;

  /**
   * Copy constructor for overriding the number of clients to create
   * @param {number} numClients the number of internal clients to create
   * @returns {GrpcConfiguration} a new GrpcConfiguration with the specified number of clients
   */
  withNumClients(numClients: number): GrpcConfiguration;
}
