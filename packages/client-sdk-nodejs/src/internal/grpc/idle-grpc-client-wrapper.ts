import {
  CloseableGrpcClient,
  GrpcClientWithChannel,
  GrpcClientWrapper,
} from './grpc-client-wrapper';
import {MomentoLogger, MomentoLoggerFactory} from '@gomomento/sdk-core';
import {ConnectivityState} from '@grpc/grpc-js/build/src/connectivity-state';

export interface IdleGrpcClientWrapperProps<T extends CloseableGrpcClient> {
  clientFactoryFn: () => T;
  loggerFactory: MomentoLoggerFactory;
  maxIdleMillis: number;
  maxClientAgeMillis?: number;
}

/**
 * This wrapper allows us to ensure that a grpc client is not re-used if it has been idle
 * for longer than a specified period of time.  This is important in some environments,
 * such as AWS Lambda, where the runtime may be paused indefinitely between invocations.
 * In such cases we have observed that while the runtime is suspended, the connection
 * may have been closed by the server. (e.g., AWS NLB has an idle timeout of 350s:
 * https://docs.aws.amazon.com/elasticloadbalancing/latest/network/network-load-balancers.html#connection-idle-timeout )
 * When the runtime resumes, it does not recognize that the connection has been closed,
 * and it may continue to attempt to send bytes to it, resulting in client-side timeouts
 * (DEADLINE_EXCEEDED).  Forcefully refreshing the client if it has been idle for too
 * long will prevent this.
 *
 * NOTE: We can't rely on keepalive pings in this scenario, because the lambda runtime
 * may be suspended in such a way that background tasks such as the keepalive pings
 * will not be able to execute.
 */
export class IdleGrpcClientWrapper<T extends CloseableGrpcClient>
  implements GrpcClientWrapper<T>
{
  private readonly logger: MomentoLogger;

  private client: T;
  private readonly clientFactoryFn: () => T;

  private readonly maxIdleMillis: number;
  private lastAccessTime: number;
  private clientCreatedTime: number;
  private readonly maxClientAgeMillis?: number;

  constructor(props: IdleGrpcClientWrapperProps<T>) {
    this.logger = props.loggerFactory.getLogger(this);
    this.clientFactoryFn = props.clientFactoryFn;
    this.client = this.clientFactoryFn();
    this.maxIdleMillis = props.maxIdleMillis;
    this.lastAccessTime = Date.now();
    this.maxClientAgeMillis = props.maxClientAgeMillis;
    this.clientCreatedTime = Date.now();
  }

  getClient(): T {
    let shouldRecreate = false;
    let reason: string | undefined;

    // Reconnect if channel is in a bad state.
    // Although the generic type `T` only extends `CloseableGrpcClient` (which doesn't define `getChannel()`),
    // we know that in practice, the client returned by `clientFactoryFn()` is a gRPC client that inherits from
    // `grpc.Client`: https://grpc.github.io/grpc/node/grpc.Client.html
    //
    // Since `grpc.Client` defines a public `getChannel()` method, we can safely assume it's present on the client.
    // To make TypeScript accept this, we cast the client to `unknown` first and then to `GrpcClientWithChannel`.
    // This double-cast is necessary to override structural type checking and is safe in our controlled use case.
    const clientWithChannel = this.client as unknown as GrpcClientWithChannel;
    const channel = clientWithChannel.getChannel?.();
    if (channel) {
      const state = channel.getConnectivityState(true);
      if (
        state === ConnectivityState.TRANSIENT_FAILURE ||
        state === ConnectivityState.SHUTDOWN
      ) {
        reason = `gRPC channel is in bad state: ${
          state === ConnectivityState.TRANSIENT_FAILURE
            ? 'TRANSIENT_FAILURE'
            : 'SHUTDOWN'
        }`;
        shouldRecreate = true;
      }
    }

    // Idle timeout check
    if (Date.now() - this.lastAccessTime > this.maxIdleMillis) {
      reason = `Client has been idle for more than ${this.maxIdleMillis} ms`;
      shouldRecreate = true;
    }

    // Max client age check
    if (this.maxClientAgeMillis !== undefined) {
      if (Date.now() - this.clientCreatedTime > this.maxClientAgeMillis) {
        reason = `Client has been alive for more than ${this.maxClientAgeMillis} ms`;
        shouldRecreate = true;
      }
    }

    // Recreate the client if needed
    if (shouldRecreate) {
      this.logger.info(`${reason as string}; reconnecting client.`);
      this.client.close();
      this.client = this.clientFactoryFn();
      this.clientCreatedTime = Date.now();
    }

    this.lastAccessTime = Date.now();
    return this.client;
  }
}
