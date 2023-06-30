import {
  TopicClient,
  TopicItem,
  TopicSubscribe,
  Configurations,
  CredentialProvider,
  TopicConfigurations,
  MomentoLogger,
  MomentoLoggerFactory,
} from '@gomomento/sdk';
import {ensureCacheExists} from './utils/cache';

class Logger implements MomentoLogger {
  debug(msg: string, ...args: unknown[]): void {
    console.log(msg, ...args);
  }

  error(msg: string, ...args: unknown[]): void {
    console.log(msg, ...args);
  }

  info(msg: string, ...args: unknown[]): void {
    console.log(msg, ...args);
  }

  trace(msg: string, ...args: unknown[]): void {
    console.log(msg, ...args);
  }

  warn(msg: string, ...args: unknown[]): void {
    console.log(msg, ...args);
  }
}

class LoggerFactory implements MomentoLoggerFactory {
  getLogger(loggerName: any): MomentoLogger {
    return new Logger();
  }
}

async function main() {
  const clargs = process.argv.slice(2);
  if (clargs.length !== 2) {
    console.error('Usage: topic-subscribe.ts <cacheName> <topicName>');
    return;
  }
  const [cacheName, topicName] = clargs;
  const momento = new TopicClient({
    configuration: TopicConfigurations.Default.latest(new LoggerFactory()),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
  });

  await ensureCacheExists(cacheName);

  console.log(`Subscribing to cacheName=${cacheName}, topicName=${topicName}`);
  const response = await momento.subscribe(cacheName, topicName, {
    onItem: handleItem,
    onError: handleError,
  });

  if (response instanceof TopicSubscribe.Subscription) {
    console.log('Subscribed to topic');
  } else if (response instanceof TopicSubscribe.Error) {
    console.log(`Error subscribing to topic: ${response.toString()}`);
    return;
  } else {
    console.log(`Unexpected response from topic subscription: ${response.toString()}`);
    return;
  }

  const sleep = (seconds: number) => new Promise(r => setTimeout(r, seconds * 1000));

  // Wait a couple minutes to receive some items, then unsubscribe to finish the example.
  await sleep(12000);

  if (response instanceof TopicSubscribe.Subscription) {
    console.log('Unsubscribing from topic subscription. Restart the example to subscribe again.');
    response.unsubscribe();
  }
}

function handleItem(item: TopicItem) {
  console.log('Item received from topic subscription; %s', item);
}

function handleError(error: TopicSubscribe.Error) {
  console.log(`Error received from topic subscription; ${error.toString()}`);

  // optionally: unsubscribe from the topic subscription
  //subscription.unsubscribe();
}

main()
  .then(() => {
    console.log('success!!');
  })
  .catch((e: Error) => {
    console.error(`Uncaught exception while running example: ${e.message}`);
    throw e;
  });
