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
   * The maximum number of concurrent requests that can be made to the server.
   * This limit is independent of the number of internal clients, meaning this limit is the maximum
   * number of requests that will be made concurrently across all of the internal clients.
   * If this is not set, it will default to the defaultRequestConcurrencyLimit.
   */
  maxConcurrentRequests?: number;

  /**
   * Indicates if it permissible to send keepalive pings from the client without any outstanding streams.
   *
   * NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
   * when the connection is idle. However, they are very problematic for lambda environments where the lambda
   * runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
   * from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
   * Therefore, keep-alives should be disabled in lambda and similar environments.
   */
  keepAlivePermitWithoutCalls?: number;

  /**
   * After waiting for a duration of this time, if the keepalive ping sender does not receive the ping ack,
   * it will close the transport.
   *
   * NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
   * when the connection is idle. However, they are very problematic for lambda environments where the lambda
   * runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
   * from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
   * Therefore, keep-alives should be disabled in lambda and similar environments.
   */
  keepAliveTimeoutMs?: number;

  /**
   * After a duration of this time the client/server pings its peer to see if the transport is still alive.
   *
   * NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
   * when the connection is idle. However, they are very problematic for lambda environments where the lambda
   * runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
   * from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
   * Therefore, keep-alives should be disabled in lambda and similar environments.
   */
  keepAliveTimeMs?: number;

  /**
   * The maximum message length the client can send to the server.  If the client attempts to send a message larger than
   * this size, it will result in a RESOURCE_EXHAUSTED error.
   */
  maxSendMessageLength?: number;

  /**
   * The maximum message length the client can receive from the server.  If the server attempts to send a message larger than
   * this size, it will result in a RESOURCE_EXHAUSTED error.
   */
  maxReceiveMessageLength?: number;
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
   * NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
   * when the connection is idle. However, they are very problematic for lambda environments where the lambda
   * runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
   * from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
   * Therefore, keep-alives should be disabled in lambda and similar environments.
   *
   * @returns {number} 0 or 1, if it is permissible to send a keepalive/ping without any outstanding calls.
   */
  getKeepAlivePermitWithoutCalls(): number | undefined;

  /**
   * NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
   * when the connection is idle. However, they are very problematic for lambda environments where the lambda
   * runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
   * from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
   * Therefore, keep-alives should be disabled in lambda and similar environments.
   *
   * @returns {number} the time to wait for a response from a keepalive or ping.
   */
  getKeepAliveTimeoutMS(): number | undefined;

  /**
   * NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
   * when the connection is idle. However, they are very problematic for lambda environments where the lambda
   * runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
   * from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
   * Therefore, keep-alives should be disabled in lambda and similar environments.
   *
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
   * The maximum message length the client can send to the server.  If the client attempts to send a message larger than
   * this size, it will result in a RESOURCE_EXHAUSTED error.
   */
  getMaxSendMessageLength(): number | undefined;

  /**
   * The maximum message length the client can receive from the server.  If the server attempts to send a message larger than
   * this size, it will result in a RESOURCE_EXHAUSTED error.
   */
  getMaxReceiveMessageLength(): number | undefined;

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

  /**
   * returns the maximum number of concurrent requests that can be made to the server.
   */
  getMaxConcurrentRequests(): number | undefined;

  /**
   * Copy constructor for overriding the maximum number of concurrent requests
   * @param {number} maxConcurrentRequests the maximum number of concurrent requests that can be made to the server
   * @returns {GrpcConfiguration} a new GrpcConfiguration with the specified maximum number of concurrent requests
   */
  withMaxConcurrentRequests(maxConcurrentRequests: number): GrpcConfiguration;
}
