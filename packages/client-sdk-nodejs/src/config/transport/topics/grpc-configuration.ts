export interface TopicGrpcConfigurationProps {
  /**
   * @deprecated Use `numStreamClients` and `numUnaryClients` instead.
   * The number of internal clients a topic client will create to communicate with Momento.
   * More of them allows more concurrent requests, at the cost of more open connections and the latency of setting up each client.
   */
  numClients?: number;

  /**
   * The number of internal clients a topic client will create to communicate with Momento for streaming requests (e.g. subscribe).
   * More of them allows more concurrent requests, at the cost of more open connections and the latency of setting up each client.
   */
  numStreamClients?: number;

  /**
   * The number of internal clients a topic client will create to communicate with Momento for unary requests (e.g. publish).
   * More of them allows more concurrent requests, at the cost of more open connections and the latency of setting up each client.
   */
  numUnaryClients?: number;

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
   * number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   * with a DeadlineExceeded error.
   */
  deadlineMillis: number;
}

/**
 * Encapsulates gRPC configuration tunables.
 * @export
 * @interface TopicGrpcConfiguration
 */
export interface TopicGrpcConfiguration {
  /**
   * @deprecated Use `getNumStreamClients()` and `getNumUnaryClients()` instead.
   * @returns {number} the number of internal clients a topic client will create to communicate with Momento. More of
   * them will allow for more concurrent requests.
   */
  getNumClients(): number;

  /**
   * @deprecated Use `withNumStreamClients()` and `withNumUnaryClients()` instead.
   * Copy constructor for overriding the number of clients to create.
   *
   * @param {number} numClients - @deprecated Use `withNumStreamClients()` and `withNumUnaryClients()` instead.
   * The number of internal clients to create.
   *
   * @returns {GrpcConfiguration} A new GrpcConfiguration with the specified number of clients.
   */
  withNumClients(numClients: number): TopicGrpcConfiguration;

  /**
   * @returns {number} the number of internal clients a topic client will create to communicate with Momento for streaming requests (e.g. subscribe). More of
   * them will allow for more concurrent requests.
   */
  getNumStreamClients(): number;

  /**
   * Copy constructor for overriding the number of stream clients to create.
   *
   * @param {number} numStreamClients - The number of internal clients to create for streaming requests.
   *
   * @returns {TopicGrpcConfiguration} A new GrpcConfiguration with the specified number of stream clients.
   */
  withNumStreamClients(numStreamClients: number): TopicGrpcConfiguration;

  /**
   * @returns {number} the number of internal clients a topic client will create to communicate with Momento for unary requests (e.g. publish). More of
   * them will allow for more concurrent requests.
   */
  getNumUnaryClients(): number;

  /**
   * Copy constructor for overriding the number of unary clients to create.
   *
   * @param {number} numUnaryClients - The number of internal clients to create for unary requests.
   *
   * @returns {TopicGrpcConfiguration} A new GrpcConfiguration with the specified number of unary clients.
   */
  withNumUnaryClients(numUnaryClients: number): TopicGrpcConfiguration;

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
   * @returns {number} number of milliseconds the client is willing to wait for an RPC to complete before it is terminated
   *    with a DeadlineExceeded error.
   */
  getDeadlineMillis(): number;

  /**
   * Copy constructor for overriding the client-side deadline
   * @param {number} deadlineMillis
   * @returns {TopicGrpcConfiguration} a new GrpcConfiguration with the specified client-side deadline
   */
  withDeadlineMillis(deadlineMillis: number): TopicGrpcConfiguration;
}
