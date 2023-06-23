import { APIGatewayEvent, Handler } from "aws-lambda";
import {CreateTopicClient} from './libMomentoClient';
import {PublishingWrapper} from "./libMomento";
// Import configurations for region and secrets name info.
// @ts-ignore
import config from './config.json';

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

    console.log('This is the body topic name: ', body.topicName);
    console.log('This is the body topic value: ', body.topicValue);

    // Get the Momento Topics client.
    let client = await CreateTopicClient();

    // Init the publishing wrapper class.
    const wrapper = new PublishingWrapper({
      client: client,
      cacheName: config.cacheName, //get the cache from the config.json.
      topicName: body.topicName // The topic name from the query string.
    });
    try {
      // Call the publishItem function
      const ret = await wrapper.publishItem(body.topicValue);
      console.log(ret);
      return {
        statusCode: 200,
        headers: {},
        body: ret,
      };
    } catch (err){
      console.error(err);
      return {
        statusCode: 500,
        headers: {},
        body: "Failed to set topic value.",
      };
    }
  } catch (err) {
    console.error(err);

    return buildResponseBody(500, "Unknown server error from topics.ts");
  }
};
