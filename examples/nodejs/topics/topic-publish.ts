import {TopicClient, TopicPublish, CredentialProvider, TopicConfigurations} from '@gomomento/sdk';

import {ensureCacheExists} from './utils/cache';

async function main() {
  const clargs = process.argv.slice(2);
  if (clargs.length !== 3) {
    console.error('Usage: topic-publish.ts <cacheName> <topicName> <value>');
    return;
  }
  const [cacheName, topicName, value] = clargs;
  const momento = new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
  });

  await ensureCacheExists(cacheName);

  console.log(`Publishing cacheName=${cacheName}, topicName=${topicName}, value=${value}`);
  const publishResponse = await momento.publish(cacheName, topicName, value);
  if (publishResponse instanceof TopicPublish.Success) {
    console.log('Value published successfully!');
  } else {
    console.log(`Error publishing value: ${publishResponse.toString()}`);
  }
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
