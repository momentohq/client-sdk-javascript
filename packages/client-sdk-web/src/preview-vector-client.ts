import {ControlClient} from './internal/control-client';
import {
  AbstractVectorClient,
  IVectorClient,
  IVectorControlClient,
} from '@gomomento/sdk-core/dist/src/internal/clients';
import {VectorClientProps} from './vector-client-props';

export class PreviewVectorClient
  extends AbstractVectorClient
  implements IVectorClient
{
  constructor(props: VectorClientProps) {
    const controlClient: IVectorControlClient = createControlClient(props);
    super(controlClient);
  }
}

function createControlClient(props: VectorClientProps): IVectorControlClient {
  return new ControlClient({
    configuration: props.configuration,
    credentialProvider: props.credentialProvider,
  });
}
