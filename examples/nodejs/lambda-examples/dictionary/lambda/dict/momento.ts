import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";
import {
  CacheClient,
  CacheConfiguration,
  CacheDictionaryIncrement,
  Configuration,
  Configurations,
  CredentialProvider,
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
  ExperimentalMetricsLoggingMiddleware,
  MomentoLoggerFactory
} from "@gomomento/sdk";
import {
  ExperimentalMetricsMiddleware
} from "@gomomento/sdk/dist/src/config/middleware/impl/experimental-metrics-middleware";

let cli: MomentoClient | null = null;
const CACHENAME='cache';

const _secretsClient = new SecretsManagerClient({});
const _cachedSecrets = new Map<string, string>();

export class MomentoClient {
  ccli: CacheClient;

  constructor(ccli: CacheClient) {
    this.ccli = ccli;
  }

  async inc(ctx:string, key:string, value:number=1) {
    const r = await this.ccli.dictionaryIncrement(CACHENAME, ctx, key, value);
    if (r instanceof CacheDictionaryIncrement.Error) {
      console.error(`Error while calling dictionaryIncrement: ${r.errorCode()}: ${r.toString()}`);
      return false;
    }

    return true;
  }

  static async getClient() {
    if (cli === null) {
      const apiKeySecretName = process.env.MOMENTO_API_KEY_SECRET_NAME;
      if (apiKeySecretName === undefined) {
        throw new Error("Missing required env var 'MOMENTO_API_KEY_SECRET_NAME");
      }

      let momentoConfiguration: Configuration = Configurations.Lambda.latest();
      const grpcConfig = momentoConfiguration.getTransportStrategy().getGrpcConfig().withNumClients(1);
      momentoConfiguration = momentoConfiguration.withTransportStrategy(momentoConfiguration.getTransportStrategy().withGrpcConfig(grpcConfig));

      const middlewaresExampleloggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory(
        DefaultMomentoLoggerLevel.DEBUG
      );

      cli = new MomentoClient(await CacheClient.create({
          configuration: Configurations.Lambda.latest().withMiddlewares([
            new ExperimentalMetricsLoggingMiddleware(middlewaresExampleloggerFactory),
          ]),
          credentialProvider: CredentialProvider.fromString({authToken: await MomentoClient.getSecret(apiKeySecretName)}),
          defaultTtlSeconds: 86400*30, // set to 30 days - Requires contacting Momento and requesting an increase
        }));
    }
    return cli;
  }

  static async getSecret(secretName: string): Promise<string> {
    if (!_cachedSecrets.has(secretName)) {
      const secretResponse = await _secretsClient.send(new GetSecretValueCommand({SecretId: secretName}));
      if (secretResponse) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        _cachedSecrets.set(secretName, secretResponse.SecretString!);
      } else {
        throw new Error(`Unable to retrieve secret: ${secretName}`);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return _cachedSecrets.get(secretName)!;
  }
}
