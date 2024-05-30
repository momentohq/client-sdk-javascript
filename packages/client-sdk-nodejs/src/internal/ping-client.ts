import {ping} from '@gomomento/generated-types';
import grpcPing = ping.cache_client;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {CredentialProvider, MomentoLogger} from '../';

export interface PingClientProps {
  configuration: Configuration;
  endpoint: string;
  credentialProvider: CredentialProvider;
}

export class InternalNodeGrpcPingClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcPing.PingClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;

  /**
   * @param {PingClientProps} props
   */
  constructor(props: PingClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(InternalNodeGrpcPingClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating ping client using endpoint: '${props.endpoint}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcPing.PingClient(
          props.endpoint,
          props.credentialProvider.isCacheEndpointSecure()
            ? ChannelCredentials.createSsl()
            : ChannelCredentials.createInsecure()
        ),
      loggerFactory: props.configuration.getLoggerFactory(),
      maxIdleMillis: props.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });
  }

  public async ping(): Promise<void> {
    this.logger.info('pinging...');
    const request = new grpcPing._PingRequest();
    return await new Promise((resolve, reject) => {
      this.clientWrapper
        .getClient()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .Ping(request, {interceptors: this.interceptors}, (err, resp) => {
          if (err) {
            this.logger.error('failed to ping');
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }
}
