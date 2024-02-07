export interface ChannelConfiguration {
  maxSessionMemoryMB: number;
  useLocalSubchannelPool: number;
  useKeepAlive: boolean; // Boolean flag to enable/disable keepalive settings
  keepAlivePermitWithoutCalls?: number;
  keepAliveTimeoutMs?: number;
  keepAliveTimeMs?: number;
}
