import {cache} from '@gomomento/generated-types-webtext';
import {
  CredentialProvider,
  MomentoLogger,
  CacheGet,
  UnknownError,
  CacheSet,
  InvalidArgumentError,
} from '..';
import {version} from '../../package.json';
import {Configuration} from '../config/configuration';
import {
  validateCacheName,
  normalizeSdkError,
  IDataClient,
} from '@gomomento/common';
import {Request, UnaryInterceptor, UnaryResponse} from 'grpc-web';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  _GetRequest,
  _SetRequest,
  ECacheResult,
} from '@gomomento/generated-types-webtext/dist/cacheclient_pb';

export interface DataClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
  /**
   * the default time to live of object inside of cache, in seconds
   */
  defaultTtlSeconds: number;
}

export class DataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IDataClient
{
  private readonly clientWrapper: cache.ScsClient;
  private readonly interceptors: UnaryInterceptor<REQ, RESP>[];
  // private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;
  private readonly authHeaders: {authorization: string};
  private readonly defaultTtlSeconds: number;
  // private readonly textEncoder: TextEncoder;

  /**
   * @param {DataClientProps} props
   */
  constructor(props: DataClientProps) {
    // this.textEncoder = new TextEncoder();
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [new Header('Agent', `nodejs:${version}`)];
    this.interceptors = [
      new HeaderInterceptorProvider<REQ, RESP>(
        headers
      ).createHeadersInterceptor(),
      // ClientTimeoutInterceptor(ControlClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating data client using endpoint: '${props.credentialProvider.getCacheEndpoint()}`
    );
    // this.clientWrapper = new IdleGrpcClientWrapper({
    //   clientFactoryFn: () =>
    //     new grpcControl.ScsControlClient(
    //       props.credentialProvider.getControlEndpoint(),
    //       ChannelCredentials.createSsl()
    //     ),
    //   configuration: props.configuration,
    // });
    console.log(
      `\n\n\nCreating data client with endpoint: ${props.credentialProvider.getCacheEndpoint()}\n\n\n`
    );

    this.defaultTtlSeconds = props.defaultTtlSeconds;
    console.log('ttl', this.defaultTtlSeconds);
    this.authHeaders = {authorization: props.credentialProvider.getAuthToken()};
    this.clientWrapper = new cache.ScsClient(
      `https://${props.credentialProvider.getCacheEndpoint()}`,
      null,
      {
        unaryInterceptors: this.interceptors,
      }
    );
  }

  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheGet.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheGet.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Issuing 'get' request; key: ${key.toString()}`);
    const result = await this.sendGet(cacheName, this.convert(key));
    this.logger.trace(`'get' request result: ${result.toString()}`);
    return result;
  }

  private async sendGet(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<CacheGet.Response> {
    const request = new _GetRequest();
    request.setCacheKey(key);
    const metadata = this.createMetadata(cacheName);

    return await new Promise(resolve => {
      this.clientWrapper.get(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            switch (resp.getResult()) {
              case ECacheResult.MISS:
                resolve(new CacheGet.Miss());
                break;
              case ECacheResult.HIT:
                resolve(new CacheGet.Hit(resp.getCacheBody_asU8()));
                break;
              case ECacheResult.INVALID:
              case ECacheResult.OK:
                resolve(
                  new CacheGet.Error(new UnknownError(resp.getMessage()))
                );
                break;
              default:
                resolve(
                  new CacheGet.Error(
                    new UnknownError(
                      'An unknown error occurred: ' + resp.getMessage()
                    )
                  )
                );
                break;
            }
          } else {
            resolve(new CacheGet.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<CacheSet.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheSet.Error(normalizeSdkError(err as Error));
    }
    if (ttl && ttl < 0) {
      return new CacheSet.Error(
        new InvalidArgumentError('ttl must be a positive integer')
      );
    }
    const ttlToUse = ttl || this.defaultTtlSeconds;
    this.logger.trace(
      `Issuing 'set' request; key: ${key.toString()}, value length: ${
        value.length
      }, ttl: ${ttlToUse.toString()}`
    );

    return await this.sendSet(
      cacheName,
      this.convert(key),
      this.convert(value),
      ttlToUse
    );
  }

  private async sendSet(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttlSeconds: number
  ): Promise<CacheSet.Response> {
    const request = new _SetRequest();
    request.setCacheKey(key);
    request.setCacheBody(value);
    request.setTtlMilliseconds(this.convertSecondsToMilliseconds(ttlSeconds));
    const metadata = this.createMetadata(cacheName);
    return await new Promise(resolve => {
      this.clientWrapper.set(
        request,
        {
          ...this.authHeaders,
          ...metadata,
        },
        (err, resp) => {
          if (resp) {
            resolve(new CacheSet.Success());
          } else {
            resolve(new CacheSet.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  private createMetadata(cacheName: string): {cache: string} {
    return {cache: cacheName};
  }

  private convertSecondsToMilliseconds(ttlSeconds: number): number {
    return ttlSeconds * 1000;
  }

  private convert(v: string | Uint8Array): string | Uint8Array {
    return v;
    // if (typeof v === 'string') {
    //   return this.textEncoder.encode(v);
    // }
    // return v;
  }
}
