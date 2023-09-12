/* eslint-disable @typescript-eslint/no-unused-vars */
import {TopicClient, TopicConfigurations, CredentialProvider} from '@gomomento/sdk';

function main() {
  const cacheClient = new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });
}

try {
  main();
} catch (e) {
  console.error(`Uncaught exception while running example: ${JSON.stringify(e)}`);
  throw e;
}
