import {
  InternalGrpcWebPingClient,
  PingClientProps,
} from './internal/ping-client';
import {
  AbstractPingClient,
  IPingClient,
} from '@gomomento/core/dist/src/internal/clients';

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
    super({createPingClient});
  }
}
