import {GrpcConfiguration} from '../../config/transport';
import {ChannelOptions} from '@grpc/grpc-js';

export function grpcChannelOptionsFromGrpcConfig(
  grpcConfig: GrpcConfiguration
): ChannelOptions {
  const channelOptions: Record<string, number> = {
    // default value for max session memory is 10mb.  Under high load, it is easy to exceed this,
    // after which point all requests will fail with a client-side RESOURCE_EXHAUSTED exception.
    'grpc-node.max_session_memory': grpcConfig.getMaxSessionMemoryMb(),
    // This flag controls whether channels use a shared global pool of subchannels, or whether
    // each channel gets its own subchannel pool.  The default value is 0, meaning a single global
    // pool.  Setting it to 1 provides significant performance improvements when we instantiate more
    // than one grpc client.
    'grpc.use_local_subchannel_pool': 1,
  };

  if (grpcConfig.getKeepAlivePermitWithoutCalls() !== undefined) {
    channelOptions['grpc.keepalive_permit_without_calls'] = <number>(
      grpcConfig.getKeepAlivePermitWithoutCalls()
    );
  }
  if (grpcConfig.getKeepAliveTimeMS() !== undefined) {
    channelOptions['grpc.keepalive_time_ms'] = <number>(
      grpcConfig.getKeepAliveTimeMS()
    );
  }
  if (grpcConfig.getKeepAliveTimeoutMS() !== undefined) {
    channelOptions['grpc.keepalive_timeout_ms'] = <number>(
      grpcConfig.getKeepAliveTimeoutMS()
    );
  }

  return channelOptions;
}
