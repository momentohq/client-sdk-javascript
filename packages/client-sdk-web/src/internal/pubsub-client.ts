import {pubsub} from '@gomomento/generated-types-webtext';
import {Configuration} from '../config/configuration';
import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
} from '@gomomento/sdk-core';
import {
  Request,
  StreamInterceptor,
  UnaryInterceptor,
  UnaryResponse,
} from 'grpc-web';
import {TopicClientProps} from '../topic-client-props';
import {version} from '../../package.json';
import {Header} from './grpc/headers-interceptor';

export class PubsubClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> {
  private readonly clientWrapper: pubsub.PubsubClient;
  private readonly configuration: Configuration;
  private readonly credentialProvider: CredentialProvider;
  private readonly unaryRequestTimeoutMs: number;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private readonly logger: MomentoLogger;
  private readonly unaryInterceptors: UnaryInterceptor<REQ, RESP>[];
  private readonly streamingInterceptors: StreamInterceptor<REQ, RESP>[];

  private static readonly RST_STREAM_NO_ERROR_MESSAGE =
    'Received RST_STREAM with code 0';

  constructor(props: TopicClientProps) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);

    // TODO:
    // TODO: after Configuration plumbing is in place . . .
    // TODO
    // const grpcConfig = this.configuration
    //   .getTransportStrategy()
    //   .getGrpcConfig();
    //
    // this.validateRequestTimeout(grpcConfig.getDeadlineMillis());
    // this.unaryRequestTimeoutMs =
    //   grpcConfig.getDeadlineMillis() || PubsubClient.DEFAULT_REQUEST_TIMEOUT_MS;
    // this.logger.debug(
    //   `Creating topic client using endpoint: '${this.credentialProvider.getCacheEndpoint()}'`
    // );

    this.clientWrapper = new pubsub.PubsubClient(
      `https://${props.credentialProvider.getCacheEndpoint()}`,
      null,
      null
    );

    const headers: Header[] = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    this.unaryInterceptors = PubsubClient.initializeUnaryInterceptors(
      headers,
      props.configuration,
      this.unaryRequestTimeoutMs
    );
    this.streamingInterceptors =
      PubsubClient.initializeStreamingInterceptors(headers);
  }

  public getEndpoint(): string {
    const endpoint = this.credentialProvider.getCacheEndpoint();
    this.logger.debug(`Using cache endpoint: ${endpoint}`);
    return endpoint;
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }
}
