import {ping} from '@gomomento/generated-types-webtext';
import {Request, UnaryResponse} from 'grpc-web';
import {_PingRequest} from '@gomomento/generated-types-webtext/dist/cacheping_pb';
import {Configuration} from '../config/configuration';
import {MomentoLogger} from '@gomomento/sdk-core';
import {IPingClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {ClientMetadataProvider} from './client-metadata-provider';

export interface PingClientProps {
  endpoint: string;
  configuration: Configuration;
}

export class PingClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IPingClient
{
  private readonly clientWrapper: ping.PingClient;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  private readonly logger: MomentoLogger;

  /**
   * @param {PingClientProps} props
   */
  constructor(props: PingClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.clientMetadataProvider = new ClientMetadataProvider({
      clientType: 'ping',
    });
    this.clientWrapper = new ping.PingClient(props.endpoint, null, {});
  }

  public async ping(): Promise<void> {
    this.logger.debug('pinging...');
    const request = new _PingRequest();
    await this.clientWrapper.ping(
      request,
      this.clientMetadataProvider.createClientMetadata()
    );
    return;
  }
}

