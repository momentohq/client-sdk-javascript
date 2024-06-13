import {createRecord, getRecord} from './utils/dynamodb';
import {getItemFromCache, subscribeToTopic, unsubscribeFromTopic} from './utils/momento';
import {generateRandomData, parseDynamoRecord, sleep} from './utils/helper';

class CliDemo {
  async run(randomData: {location: string; maxTemp: string; minTemp: string; precipitation: string; ttl: string}) {
    // Subscribing to the topic
    await subscribeToTopic();

    // Creating a record in DynamoDB
    console.log('Creating a record in DynamoDB');
    await createRecord(
      randomData.location,
      randomData.maxTemp,
      randomData.minTemp,
      randomData.precipitation,
      randomData.ttl
    );

    // Getting the record from DynamoDB
    console.log('Getting the record from DynamoDB');
    const getRecordResponse = await getRecord(randomData.location);
    const weatherData = parseDynamoRecord(getRecordResponse);
    console.log(`Record from DynamoDB: ${JSON.stringify(weatherData, null, 2)}`);

    // Get Item from Cache
    await sleep(2000); // Simulate the wait time for the eventbridge to deliver the event
    console.log('Getting the item from cache');
    const getItemFromCacheResponse = await getItemFromCache(randomData.location);
    console.log(`Item from cache: ${getItemFromCacheResponse}`);

    // Unsubscribing from the topic
    unsubscribeFromTopic();
  }
}

async function main() {
  const cliDemo = new CliDemo();
  const randomData = generateRandomData();
  await cliDemo.run(randomData);
}

void main().then(() => {
  console.log('Done!');
});
