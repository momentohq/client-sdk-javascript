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
  const [cacheName, topicName] = clargs;
  const momento = new TopicClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    }),
  });

  console.log(`Subscribing to cacheName=${cacheName}, topicName=${topicName}`);
  const response = await momento.subscribe(cacheName, topicName, {
    onItem: handleData,
    onError: handleError,
  });

  if (response instanceof TopicSubscribe.Error) {
    console.log('Error subscribing to topic subscription');
    return;
  } else if (response instanceof TopicSubscribe.Subscription) {
    console.log('Successfully subscribed to topic subscription');

    // Quit after 60s
    const sleep = (seconds: number) =>
      new Promise(r => setTimeout(r, seconds * 1000));
    await sleep(60);
    // test if response is instance of TopicSubscribe.Subscription
    if (response instanceof TopicSubscribe.Subscription) {
      console.log('Unsubscribing from topic subscription');
      response.unsubscribe();
    }
  }
}

function handleData(data: TopicSubscribe.Item) {
  console.log('Data received from topic subscription; %s', data);
}

function handleError(
  error: TopicSubscribe.Error,
  subscription: TopicSubscribe.Subscription
) {
  console.log(`Error received from topic subscription; ${error.toString()}`);

  // optionally: unsubscribe from the topic subscription
  //subscription.unsubscribe();
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`An error occurred! ${e.message}`);
    throw e;
  });
