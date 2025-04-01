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

  isRecreating = false;
  private reconnectReason?: string;

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
    const now = Date.now();

    // Prevent double recreation if already in progress
    if (this.isRecreating) {
      this.logger.debug(
        'Client recreation in progress; returning existing client.'
      );
      return this.client;
    }

    // Check if client should be reconnected due to bad state, idle timeout, or age
    if (!this.shouldReconnect(now)) {
      this.lastAccessTime = now;
      return this.client;
    }

    try {
      this.isRecreating = true;
      return this.recreateClient(this.reconnectReason ?? 'Unknown reason');
    } finally {
      this.isRecreating = false;
    }
  }

  /**
   * Encapsulates all reconnect triggers.
   */
  private shouldReconnect(now: number): boolean {
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
        this.reconnectReason = `gRPC channel is in bad state: ${ConnectivityState[state]}`;
        return true;
      }
    }

    if (now - this.lastAccessTime > this.maxIdleMillis) {
      this.reconnectReason = `Client has been idle for more than ${this.maxIdleMillis} ms`;
      return true;
    }

    if (
      this.maxClientAgeMillis !== undefined &&
      now - this.clientCreatedTime > this.maxClientAgeMillis
    ) {
      this.reconnectReason = `Client was created more than ${this.maxClientAgeMillis} ms ago`;
      return true;
    }

    return false;
  }

  /**
   * Replaces the current client with a new one.
   * Caller must ensure `isRecreating` is true before calling this.
   */
  private recreateClient(reason: string): T {
    this.logger.info(`${reason}; reconnecting client.`);
    const oldClient = this.client;
    const clientWithChannel = oldClient as unknown as GrpcClientWithChannel;
    const channel = clientWithChannel.getChannel?.();

    // Begin watching for the state to become IDLE before closing the old client
    if (channel) {
      const currentState = channel.getConnectivityState(false);
      const deadline = Date.now() + 5000; // 5 second timeout

      channel.watchConnectivityState(currentState, deadline, err => {
        if (err) {
          this.logger.warn(
            `Timeout or error while watching for channel state transition: ${err.message}`
          );
          oldClient.close();
        } else {
          const newState = channel.getConnectivityState(false);
          if (newState === ConnectivityState.IDLE) {
            this.logger.info(
              'Old client channel transitioned to IDLE; closing.'
            );
            oldClient.close();
          } else {
            this.logger.warn(
              `Old client channel transitioned to ${ConnectivityState[newState]}; closing anyway.`
            );
            oldClient.close();
          }
        }
      });
    } else {
      this.logger.warn(
        'Old client did not have a channel; closing immediately.'
      );
      oldClient.close();
    }

    this.client = this.clientFactoryFn();
    const now = Date.now();
    this.clientCreatedTime = now;
    this.lastAccessTime = now;
    return this.client;
  }
}
