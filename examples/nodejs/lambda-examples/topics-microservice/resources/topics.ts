import { APIGatewayEvent, Handler } from "aws-lambda";
import {CreateTopicClient} from './libMomentoClient';
import {PublishingWrapper} from "./libMomento";
// Import configurations for region and secrets name info.
// @ts-ignore
import config from './config.json';

const buildResponseBody = (status: any, body: any, headers = {}) => {
  return {
    statusCode: status,
    headers,
    body,
  };
};

export const handler = async (event: APIGatewayEvent): Promise<any> => {
  try {
    let client = await CreateTopicClient();
    //console.log(config.topicName);

    const queryStringParameters = event.queryStringParameters;
    console.log('Query string parameters:', queryStringParameters);

    const myParam: string = queryStringParameters ? queryStringParameters['topicName'] : null;
    console.log('myParam:', myParam);

    // init the publishing wrapper class.
    const wrapper = new PublishingWrapper({
      client: client,
      cacheName: config.cacheName, //get the cache and topic name from the config.json.
      topicName: config.topicName
    });
    try {
      // Call the publishItem function
      const ret = await wrapper.publishItem("how dare you!");
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
