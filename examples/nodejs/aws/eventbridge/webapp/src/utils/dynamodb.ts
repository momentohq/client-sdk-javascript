import AWS from "aws-sdk";

const awsAccesskeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const awsSessionToken = import.meta.env.VITE_AWS_SESSION_TOKEN;
const awsRegion = import.meta.env.VITE_AWS_REGION;
export const tableName = "weather-stats-demo"

AWS.config.update({
  region: awsRegion,
  credentials: {
    accessKeyId: awsAccesskeyId,
    secretAccessKey: awsSecretAccessKey,
    sessionToken: awsSessionToken || undefined,
  },
});
const dynamoDB = new AWS.DynamoDB();

export function createRecord(location: string, maxTemp: string, minTemp: string, precipitation: string, ttl: string) {
  const item = {
    Location: { S: location },
    MaxTemp: { N: maxTemp },
    MinTemp: { N: minTemp },
    ChancesOfPrecipitation: { N: precipitation },
    TTL: { N: ttl },
  };
  const params = {
    TableName: tableName,
    Item: item,
  };

  return dynamoDB.putItem(params).promise();
}

export function getRecord(location: string) {
  const params = {
    TableName: tableName,
    Key: {
      Location: { S: location },
    },
  };

  return dynamoDB.getItem(params).promise();
}

export function deleteRecord(location: string) {
  const params = {
    TableName: tableName,
    Key: {
      Location: { S: location },
    },
  };

  return dynamoDB.deleteItem(params).promise();
}
