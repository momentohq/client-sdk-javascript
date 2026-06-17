import {
  DeleteFunction,
  getDefaultCredentialProvider,
  ListFunctions,
  ListFunctionVersions,
  MomentoLogger,
  PutFunction,
} from '@gomomento/sdk-core';
import {
  IFunctionClient,
  PutFunctionOptions,
} from '@gomomento/sdk-core/dist/src/internal/clients/function/IFunctionClient';
import {FunctionClient} from './internal/function-client';
import {FunctionClientProps} from './function-client-props';
import {FunctionConfiguration, FunctionConfigurations} from './index';
import {FunctionClientAllProps} from './internal/function-client-all-props';

/**
 * PREVIEW Momento Function Client
 * WARNING: the API for this client is not yet stable and may change without notice.
 * Please contact Momento if you would like to try this preview.
 *
 * Deploys and removes Momento Functions (wasm) in a cache. Methods return a response object unique to each
 * request, resolved to a type-safe success/error sub-type — see each response type for details.
 */
export class PreviewFunctionClient implements IFunctionClient {
  protected readonly logger: MomentoLogger;
  private readonly dataClient: IFunctionClient;
  private readonly configuration: FunctionConfiguration;

  constructor(props?: FunctionClientProps) {
    const configuration =
      props?.configuration ?? getDefaultFunctionConfiguration();
    const allProps: FunctionClientAllProps = {
      configuration: configuration,
      credentialProvider:
        props?.credentialProvider ?? getDefaultCredentialProvider(),
    };
    this.configuration = configuration;

    this.logger = configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento FunctionClient');
    this.dataClient = new FunctionClient(allProps, '0');

    this.configuration.getMiddlewares().forEach(m => {
      if (m.init) {
        m.init();
      }
    });
  }

  public close() {
    this.dataClient.close();
    this.configuration.getMiddlewares().forEach(m => {
      if (m.close) {
        m.close();
      }
    });
  }

  /**
   * Deploys a Momento Function in the given cache: creates it, or updates it if one already exists with the
   * same name (each update creates a new version).
   */
  public putFunction(
    cacheName: string,
    functionName: string,
    wasmBytes: Uint8Array,
    options?: PutFunctionOptions
  ): Promise<PutFunction.Response> {
    return this.dataClient.putFunction(
      cacheName,
      functionName,
      wasmBytes,
      options
    );
  }

  /**
   * Deletes a Momento Function from the given cache.
   */
  public deleteFunction(
    cacheName: string,
    functionName: string
  ): Promise<DeleteFunction.Response> {
    return this.dataClient.deleteFunction(cacheName, functionName);
  }

  /**
   * Lists the Momento Functions in the given cache.
   */
  public listFunctions(cacheName: string): Promise<ListFunctions.Response> {
    return this.dataClient.listFunctions(cacheName);
  }

  /**
   * Lists the versions of a Momento Function, by function id.
   */
  public listFunctionVersions(
    functionId: string
  ): Promise<ListFunctionVersions.Response> {
    return this.dataClient.listFunctionVersions(functionId);
  }
}

function getDefaultFunctionConfiguration(): FunctionConfiguration {
  const config = FunctionConfigurations.Laptop.latest();
  const logger = config.getLoggerFactory().getLogger('FunctionClient');
  logger.info(
    'No configuration provided to FunctionClient. Using default "Laptop" configuration, suitable for development. For production use, consider specifying an explicit configuration.'
  );
  return config;
}
