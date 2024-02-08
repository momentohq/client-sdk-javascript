import {ChannelConfiguration} from './channel-configuration';

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

  channelConfiguration?: ChannelConfiguration;
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

  getChannelConfiguration(): ChannelConfiguration | undefined;

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
