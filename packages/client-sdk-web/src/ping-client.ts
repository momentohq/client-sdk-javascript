import {
  IPingClient,
  AbstractPingClient,
} from '@gomomento/common/dist/src/internal/clients';
import {
  InternalGrpcWebPingClient,
  PingClientProps,
} from './internal/ping-client';

/**
 * Momento Ping Client.
 *
 */
export class PingClient extends AbstractPingClient {
  /**
   * Creates an instance of PingClient.
   */
  constructor(props: PingClientProps) {
    const createPingClient = (): IPingClient => {
      return new InternalGrpcWebPingClient(props);
    };
    super({...props, createPingClient});
  }
}
