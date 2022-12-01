import {getLogger, Logger} from '../utils/logging';
import {CloseableGrpcClient, GrpcClientWrapper} from './grpc-client-wrapper';

// TODO: This should not be defined here, it should be part of the Configuration object when we
// introduce that.
const MAX_IDLE_MILLIS = 4 * 60 * 1_000; // 4 minutes.  We want to remain comfortably underneath the idle timeout for AWS NLB, which is 350s.

export interface IdleGrpcClientWrapperProps<T extends CloseableGrpcClient> {
  clientFactoryFn: () => T;
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
  private readonly logger: Logger;

  private client: T;
  private readonly clientFactoryFn: () => T;

  private readonly maxIdleMillis: number;
  private lastAccessTime: number;

  constructor(props: IdleGrpcClientWrapperProps<T>) {
    this.logger = getLogger(this);
    this.clientFactoryFn = props.clientFactoryFn;
    this.client = this.clientFactoryFn();
    this.maxIdleMillis = MAX_IDLE_MILLIS;
    this.lastAccessTime = Date.now();
  }

  getClient(): T {
    this.logger.trace(
      `Checking to see if client has been idle for more than ${this.maxIdleMillis} ms`
    );
    if (Date.now() - this.lastAccessTime > this.maxIdleMillis) {
      this.logger.info(
        `Client has been idle for more than ${this.maxIdleMillis} ms; reconnecting.`
      );
      this.client.close();
      this.client = this.clientFactoryFn();
    }
    this.lastAccessTime = Date.now();
    return this.client;
  }
}
