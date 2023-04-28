import {
  AbstractPingClient,
  IPingClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {
  InternalGrpcWebPingClient,
  PingClientProps,
} from './internal/ping-client';

// TODO
// TODO
// TODO - before we do a 1.0 release this needs to be removed; we will just have a ping method on the CacheClient.
// TODO
// TODO

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
