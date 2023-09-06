import {ControlClient} from './internal/control-client';
import {
  AbstractVectorIndexClient,
  IVectorIndexClient,
  IVectorIndexControlClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {VectorIndexClientProps} from './vector-index-client-props';
import {VectorDataClient} from './internal/vector-data-client';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {CacheConfiguration} from './config/configuration';
import {defaultRetryStrategy} from './config/configurations';

/**
 * PREVIEW Vector Index Client
 * WARNING: the API for this client is not yet stable and may change without notice.
 *
 * Vector and control methods return a response object unique to each request.
 * The response object is resolved to a type-safe object of one of several
 * sub-types. See the documentation for each response type for details.
 */
export class PreviewVectorIndexClient
  extends AbstractVectorIndexClient
  implements IVectorIndexClient
{
  constructor(props: VectorIndexClientProps) {
    const controlClient: IVectorIndexControlClient = createControlClient(props);
    const dataClient = createDataClient(props);
    super(controlClient, dataClient);
  }
}

function createControlClient(
  props: VectorIndexClientProps
): IVectorIndexControlClient {
  return new ControlClient({
    configuration: new CacheConfiguration({
      loggerFactory: props.configuration.getLoggerFactory(),
      transportStrategy: props.configuration.getTransportStrategy(),
      retryStrategy: defaultRetryStrategy(
        props.configuration.getLoggerFactory()
      ),
      middlewares: [],
    }),
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(
  props: VectorIndexClientProps
): IVectorIndexDataClient {
  return new VectorDataClient(props);
}
