import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';

import {TopicClient, CredentialProvider} from '@gomomento/sdk';

interface MomentoWebhookEvent {
  cache: string;
  topic: string;
  event_timestamp: number;
  publish_timestamp: number;
  topic_sequence_number: number;
  token_id: string;
  text: string;
}

const momento = new TopicClient({
  credentialProvider: CredentialProvider.fromString('<the api key>'),
});

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const webhookEvent: MomentoWebhookEvent = JSON.parse(event.body!) as MomentoWebhookEvent;
  // simply take the current message, uppercase it, and publish to a new topic
  await momento.publish(webhookEvent.cache, 'topic 2', webhookEvent.text.toUpperCase());
  return {
    statusCode: 200,
    body: JSON.stringify({status: 'success'}),
  };
};
