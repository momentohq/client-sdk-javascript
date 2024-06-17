import {config} from 'dotenv';
config();

import {DynamoDBClient, GetItemCommand, PutItemCommand} from '@aws-sdk/client-dynamodb';
import {validateEnvVariables} from './helper';

const tableName = 'weather-stats-demo';

validateEnvVariables(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']);
const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
  },
  region: process.env.AWS_REGION || 'us-west-2',
});

export async function createRecord(
  location: string,
  maxTemp: string,
  minTemp: string,
  precipitation: string,
  ttl: string
) {
  const params = {
    TableName: tableName,
    Item: {
      Location: {S: location},
      MaxTemp: {N: maxTemp},
      MinTemp: {N: minTemp},
      ChancesOfPrecipitation: {N: precipitation},
      TTL: {N: ttl},
    },
  };
  const command = new PutItemCommand(params);
  return await client.send(command);
}

export async function getRecord(location: string) {
  const params = {
    TableName: tableName,
    Key: {
      Location: {S: location},
    },
  };
  const command = new GetItemCommand(params);
  return await client.send(command);
}
