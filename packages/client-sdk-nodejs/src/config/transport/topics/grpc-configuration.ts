export interface TopicGrpcConfigurationProps {
  /**
   * The number of internal clients a cache client will create to communicate with Momento. More of them allows
   * more concurrent requests, at the cost of more open connections and the latency of setting up each client.
   */
  numClients?: number;
}

/**
 * Encapsulates gRPC configuration tunables.
 * @export
 * @interface TopicGrpcConfiguration
 */
export interface TopicGrpcConfiguration {
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
  withNumClients(numClients: number): TopicGrpcConfiguration;
}
