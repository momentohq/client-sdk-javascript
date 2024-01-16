import {
  AbstractVectorIndexClient,
  IVectorIndexClient,
  IVectorIndexControlClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {VectorIndexClientProps} from './vector-index-client-props';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {VectorIndexDataClient} from './internal/vector-index-data-client';
import {VectorIndexControlClient} from './internal/vector-index-control-client';
import {VectorIndexClientPropsWithConfig} from './internal/vector-index-client-props-with-config';
import {VectorIndexConfiguration} from './config/vector-index-configuration';
import {VectorIndexConfigurations} from './index';

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
    const config =
      props.configuration ?? getDefaultVectorIndexClientConfiguration();

    const propsWithConfiguration: VectorIndexClientPropsWithConfig = {
      ...props,
      configuration: config,
    };

    const controlClient: IVectorIndexControlClient = createControlClient(
      propsWithConfiguration
    );
    const dataClient = createDataClient(propsWithConfiguration);
    super(controlClient, dataClient);
  }
}

function createControlClient(
  props: VectorIndexClientPropsWithConfig
): IVectorIndexControlClient {
  return new VectorIndexControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(
  props: VectorIndexClientPropsWithConfig
): IVectorIndexDataClient {
  return new VectorIndexDataClient(props);
}

function getDefaultVectorIndexClientConfiguration(): VectorIndexConfiguration {
  return VectorIndexConfigurations.Browser.latest();
}
