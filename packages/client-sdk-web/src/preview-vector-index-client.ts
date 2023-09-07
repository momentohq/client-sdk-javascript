import {
  AbstractVectorIndexClient,
  IVectorIndexClient,
  IVectorIndexControlClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {VectorIndexClientProps} from './vector-index-client-props';
import {IVectorIndexDataClient} from '@gomomento/sdk-core/dist/src/internal/clients/vector/IVectorIndexDataClient';
import {VectorIndexDataClient} from './internal/vector-index-data-client';
import {VectorIndexControlClient} from './internal/vector-index-control-client';

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
  return new VectorIndexControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}

function createDataClient(
  props: VectorIndexClientProps
): IVectorIndexDataClient {
  return new VectorIndexDataClient(props);
}
