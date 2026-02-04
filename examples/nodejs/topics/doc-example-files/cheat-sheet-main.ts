/* eslint-disable @typescript-eslint/no-unused-vars */
import {TopicClient, TopicConfigurations} from '@gomomento/sdk';

function main() {
  const topicClient = new TopicClient({
    configuration: TopicConfigurations.Default.latest(),
  });
}

try {
  main();
} catch (e) {
  console.error(`Uncaught exception while running example: ${JSON.stringify(e)}`);
  throw e;
}
