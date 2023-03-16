import {
  TopicClient,
  TopicSubscribe,
  Configurations,
  CredentialProvider,
} from '@gomomento/sdk';

async function main() {
  const clargs = process.argv.slice(2);
  if (clargs.length !== 2) {
    console.error('Usage: topic-subscribe.ts <cacheName> <topicName>');
    return;
  }
  const cacheName = clargs[0];
  const topicName = clargs[1];
  const momento = new TopicClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    }),
  });

  console.log(`Subscribing to cacheName=${cacheName}, topicName=${topicName}`);
  await momento.subscribe(cacheName, topicName, {
    dataListener: handleData,
    errorListener: handleError,
  });
}

function handleData(data: TopicSubscribe.Item) {
  console.log('Data received from subscription stream; %s', data);
}

function handleError(error: TopicSubscribe.Error) {
  console.log(`Error received from subscription stream; ${error.toString()}`);
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`An error occurred! ${e.message}`);
    throw e;
  });
