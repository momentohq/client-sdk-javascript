import {
  TopicClient,
  TopicPublish,
  Configurations,
  CredentialProvider,
} from '@gomomento/sdk';

async function main() {
  const clargs = process.argv.slice(2);
  if (clargs.length !== 3) {
    console.error('Usage: topics.ts <cacheName> <topicName> <value>');
    return;
  }
  const cacheName = clargs[0];
  const topicName = clargs[1];
  const value = clargs[2];
  const momento = new TopicClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'TEST_AUTH_TOKEN',
    }),
  });

  console.log(
    `Publishing cacheName=${cacheName}, topicName=${topicName}, value=${value}`
  );
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
    console.error(`An error occurred! ${e.message}`);
    throw e;
  });
