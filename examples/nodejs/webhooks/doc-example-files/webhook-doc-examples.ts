/**
 *
 * This file contains examples of consuming the JavaScript APIs, for use as examples
 * in the public dev docs.  Each function name that begins with `example_` is available
 * to the dev docs to inject into the code snippets widget for the specified API.
 *
 * These examples should all be JavaScript; we can add TypeScript-specific examples in
 * a second file in the future if desired.
 *
 */
import {CredentialProvider, TopicClient, TopicConfigurations, TopicItem, TopicPublishResponse} from '@gomomento/sdk';

async function example_API_WebhookTopicSubscribe(topicClient: TopicClient, cacheName: string) {
  const result = await topicClient.subscribe(cacheName, 'topic 2', {
    onError: () => {
      console.error('Received an error from the topic');
      return;
    },
    onItem: (item: TopicItem) => {
      console.log(`Received uppercase text on topic 'topic-b': ${item.value().toString()}`);
      return;
    },
  });
}

async function example_API_WebhookTopicPublish(topicClient: TopicClient, cacheName: string) {
  const publishResponse = await topicClient.publish(cacheName, 'topic 1', 'a value');
  switch (publishResponse.type) {
    case TopicPublishResponse.Success:
      console.log('Value published successfully!');
      break;
    case TopicPublishResponse.Error:
      console.log(`Error publishing value: ${publishResponse.toString()}`);
      break;
  }
}

async function main() {
  const topicClient = new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
  });
  await example_API_WebhookTopicSubscribe(topicClient, 'cache');
  await example_API_WebhookTopicPublish(topicClient, 'cache');
  // The subscription does not get unsubscribed due to the way the example code needs to look in the docs, so here
  // we just forcefully exit the process so it doesn't hang.
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

main().catch(e => {
  throw e;
});
