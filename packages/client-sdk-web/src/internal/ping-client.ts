import {ping} from '@gomomento/generated-types-webtext';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {version} from '../../package.json';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {_PingRequest} from '@gomomento/generated-types-webtext/dist/cacheping_pb';
import {BasePingConfiguration} from '../common/internal/clients';
import {MomentoLogger} from '../common/config/logging';

export interface PingClientProps {
  endpoint: string;
  configuration: BasePingConfiguration;
}

export class InternalGrpcWebPingClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> {
  private readonly clientWrapper: ping.PingClient;
  private readonly unaryInterceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly logger: MomentoLogger;

  /**
   * @param {PingClientProps} props
   */
  constructor(props: PingClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.unaryInterceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
    ];
    this.clientWrapper = new ping.PingClient(
      `https://cache.${props.endpoint}:443`,
      null,
      {
        unaryInterceptors: this.unaryInterceptors,
      }
    );
  }

  public async ping(): Promise<void> {
    this.logger.debug('pinging...');
    const request = new _PingRequest();
    await this.clientWrapper.ping(request, null);
    return;
  }
}
