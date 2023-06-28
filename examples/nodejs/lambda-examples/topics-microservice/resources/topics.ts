import { APIGatewayEvent } from "aws-lambda";
import {CreateTopicClient} from './libMomentoClient';
import {PublishingWrapper} from "./libMomento";
// Import configurations for region and secrets name info.
// @ts-ignore
//import config from './config.json';
import {TopicClient} from "@gomomento/sdk";

let client: TopicClient | undefined;

const buildResponseBody = (status: number, body: string, headers = {}) => {
  return {
    statusCode: status,
    headers,
    body,
  };
};

export const handler = async (event: APIGatewayEvent): Promise<any> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // Only go get the Momento Topics client if it doesn't exist yet. If it does, just reuse the existing one to speed up execution.
    client = client || await CreateTopicClient(getEnvVar("secretName"), getEnvVar("region"));

    // Init the publishing wrapper class.
    const wrapper = new PublishingWrapper({
      client: client,
      cacheName: getEnvVar("cacheName"), // Cache name from env vars
      topicName: body.topicName // The topic name from the body of the call to APIG.
    });

    // Call the publishItem function
    const ret = await wrapper.publishItem(body.topicValue);

    return buildResponseBody( 200, ret);

  } catch (err) {
    console.error(err);
    const errorMsg = err instanceof PublishingWrapper ? 'Failed to set topic value. ' : 'Unknown server error from topics.ts, ';
    return buildResponseBody(500, errorMsg + err);
  }
};

function getEnvVar(envVarName: string): string {
  const val = process.env[envVarName];
  if (val === undefined) {
    throw new Error(`Missing required env var: ${envVarName}`);
  }
  // if we get here the compiler knows it's not undefined
  return val;
}
