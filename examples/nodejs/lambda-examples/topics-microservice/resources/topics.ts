import { APIGatewayEvent } from "aws-lambda";
import {CreateTopicClient} from './libMomentoClient';
import {PublishingWrapper} from "./libMomento";
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
    client = client || await CreateTopicClient(getEnvVar("SECRETNAME"), getEnvVar("REGION"));

    // Init the publishing wrapper class.
    const wrapper = new PublishingWrapper({
      client: client,
      cacheName: getEnvVar("CACHENAME"), // Cache name from env vars
      topicName: body.topicName // The topic name from the body of the call to APIG.
    });

    // Call the publishItem function
    const ret = await wrapper.publishItem(body.topicValue);
    if (ret == "success") {
      return buildResponseBody(200, "Item published to topic.");
    } else {
      return buildResponseBody(500, "Failed to publish item to topic.");
    }
  } catch (err) {
    console.error(err);
    const errorMsg = err instanceof PublishingWrapper ? 'Failed to set topic value. ' : 'Unknown server error from topics.ts, ';
    return buildResponseBody(500, errorMsg + err);
  }
};

// this function is for getting and validating environment variables in the Lambda function configurations.
function getEnvVar(envVarName: string): string {
  const val = process.env[envVarName];
  console.log(`Looking for env var ${val}`);
  if (val === undefined) {
    throw new Error(`Missing required env var: ${envVarName}`);
  }
  // if we get here the compiler knows it's not undefined
  return val;
}
