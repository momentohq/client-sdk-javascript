import {
  TopicClient,
  TopicItem,
  TopicSubscribe,
  TopicSubscribeResponse,
  TopicDiscontinuity,
  TopicHeartbeat,
} from '@gomomento/sdk';
import {ensureCacheExists} from './utils/cache';

async function main() {
  const clargs = process.argv.slice(2);
  if (clargs.length !== 2) {
    console.error('Usage: topic-subscribe.ts <cacheName> <topicName>');
    return;
  }
  const [cacheName, topicName] = clargs;
  const momento = new TopicClient({});

  await ensureCacheExists(cacheName);

  console.log(`Subscribing to cacheName=${cacheName}, topicName=${topicName}`);
  const response = await momento.subscribe(cacheName, topicName, {
    onItem: handleItem,
    onError: handleError,
    onDiscontinuity: handleDiscontinuity,
    onHeartbeat: handleHeartbeat,
  });

  switch (response.type) {
    case TopicSubscribeResponse.Error:
      console.log(`Error subscribing to topic: ${response.toString()}`);
      return;
    case TopicSubscribeResponse.Subscription:
      console.log('Subscribed to topic');
      break;
  }

  const sleep = (seconds: number) => new Promise(r => setTimeout(r, seconds * 1000));

  // Wait a couple minutes to receive some items, then unsubscribe to finish the example.
  await sleep(120);

  console.log('Unsubscribing from topic subscription. Restart the example to subscribe again.');
  response.unsubscribe();
}

function handleItem(item: TopicItem) {
  console.log('Item received from topic subscription; %s', item);
}

function handleError(error: TopicSubscribe.Error) {
  console.log(`Error received from topic subscription; ${error.toString()}`);

  // optionally: unsubscribe from the topic subscription
  //subscription.unsubscribe();
}

function handleDiscontinuity(discontinuity: TopicDiscontinuity) {
  console.log('Discontinuity received from topic subscription');
}

function handleHeartbeat(heartbeat: TopicHeartbeat) {
  console.log('Heartbeat received from topic subscription');
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
