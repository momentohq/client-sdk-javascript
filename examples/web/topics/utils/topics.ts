import {CredentialProvider, TopicClient, TopicConfigurations} from '@gomomento/sdk-web';

export function getTopicClient(): TopicClient {
  return new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
