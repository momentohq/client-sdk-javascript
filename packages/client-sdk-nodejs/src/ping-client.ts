import {
  IPingClient,
  AbstractPingClient,
} from './common/internal/clients';
import {
  InternalNodeGrpcPingClient,
  PingClientProps,
} from './internal/ping-client';

/**
 * Momento Ping Client.
 *
 */
export class PingClient extends AbstractPingClient {
  /**
   * Creates an instance of CacheClient.
   */
  constructor(props: PingClientProps) {
    const createPingClient = (): IPingClient => {
      return new InternalNodeGrpcPingClient(props);
    };
    super({createPingClient});
  }
}
