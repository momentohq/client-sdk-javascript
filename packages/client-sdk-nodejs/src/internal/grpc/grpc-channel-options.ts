import {GrpcConfiguration} from '../..';
import {ChannelOptions} from '@grpc/grpc-js';

// The default value for max_send_message_length is 4mb.  We need to increase this to 5mb in order to
// support cases where users have requested a limit increase up to our maximum item size of 5mb.
const DEFAULT_MAX_REQUEST_SIZE = 5_243_000;

export function grpcChannelOptionsFromGrpcConfig(
  grpcConfig: GrpcConfiguration
): ChannelOptions {
  return {
    // default value for max session memory is 10mb.  Under high load, it is easy to exceed this,
    // after which point all requests will fail with a client-side RESOURCE_EXHAUSTED exception.
    'grpc-node.max_session_memory': grpcConfig.getMaxSessionMemoryMb(),

    // This flag controls whether channels use a shared global pool of subchannels, or whether
    // each channel gets its own subchannel pool.  The default value is 0, meaning a single global
    // pool.  Setting it to 1 provides significant performance improvements when we instantiate more
    // than one grpc client.
    'grpc.use_local_subchannel_pool': 1,

    // The default value for max_send_message_length is 4mb.  We need to increase this to 5mb in order to
    // support cases where users have requested a limit increase up to our maximum item size of 5mb.
    'grpc.max_send_message_length':
      grpcConfig.getMaxSendMessageLength() ?? DEFAULT_MAX_REQUEST_SIZE,
    'grpc.max_receive_message_length':
      grpcConfig.getMaxReceiveMessageLength() ?? DEFAULT_MAX_REQUEST_SIZE,

    // NOTE: keep-alives are very important for long-lived server environments where there may be periods of time
    // when the connection is idle. However, they are very problematic for lambda environments where the lambda
    // runtime is continuously frozen and unfrozen, because the lambda may be frozen before the "ACK" is received
    // from the server. This can cause the keep-alive to timeout even though the connection is completely healthy.
    // Therefore, keep-alives should be disabled in lambda and similar environments.
    'grpc.keepalive_permit_without_calls':
      grpcConfig.getKeepAlivePermitWithoutCalls(),
    'grpc.keepalive_time_ms': grpcConfig.getKeepAliveTimeMS(),
    'grpc.keepalive_timeout_ms': grpcConfig.getKeepAliveTimeoutMS(),
  };
}
