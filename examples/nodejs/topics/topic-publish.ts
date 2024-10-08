import {TopicClient, TopicPublishResponse} from '@gomomento/sdk';

import {ensureCacheExists} from './utils/cache';

async function main() {
  const clargs = process.argv.slice(2);
  if (clargs.length !== 3) {
    console.error('Usage: topic-publish.ts <cacheName> <topicName> <value>');
    return;
  }
  const [cacheName, topicName, value] = clargs;
  const momento = new TopicClient();

  await ensureCacheExists(cacheName);

  console.log(`Publishing cacheName=${cacheName}, topicName=${topicName}, value=${value}`);
  const publishResponse = await momento.publish(cacheName, topicName, value);
  switch (publishResponse.type) {
    case TopicPublishResponse.Success:
      console.log('Value published successfully!');
      break;
    case TopicPublishResponse.Error:
      console.log(`Error publishing value: ${publishResponse.toString()}`);
      break;
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
