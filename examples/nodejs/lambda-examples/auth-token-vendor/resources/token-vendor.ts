import { APIGatewayEvent} from "aws-lambda";
import {CreateAuthClient} from './libMomentoClient';
import { AuthClient, GenerateAuthToken, AllDataReadWrite, ExpiresIn } from '@gomomento/sdk';
// Import configurations for region and secrets name info.
// @ts-ignore
import config from './config.json';

export const handler = async (event: APIGatewayEvent): Promise<any> => {
  try {

/*    const body = event.body ? JSON.parse(event.body) : {};

    console.log('This is the body topic name: ', body.topicName);
    console.log('This is the body topic value: ', body.topicValue);*/

    // Get the Momento AuthClient.
    let client = await CreateAuthClient();

    try {
      // Call the publishItem function
      //let ret = "test";

      const ret = await genToken(client)
      console.log(ret);
      if (ret == "fail") {
        return buildResponseBody(500, "Unknown server error from topics.ts");
      } else {
        return buildResponseBody(200, ret);
      }
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
    return buildResponseBody(500, "Unknown server error getting temporary auth token");
  }
};

async function genToken(client: AuthClient):Promise<string>{
  const generateTokenResponse = await client.generateAuthToken(
    AllDataReadWrite,
    ExpiresIn.minutes(30)
  );
  if (generateTokenResponse instanceof GenerateAuthToken.Success) {
    console.log('Generated an auth token with AllDataReadWrite scope!');
    // logging only a substring of the tokens, because logging security credentials is not advisable :)
    console.log(`Auth token starts with: ${generateTokenResponse.authToken.substring(0, 10)}`);
    console.log(`Refresh token starts with: ${generateTokenResponse.refreshToken.substring(0, 10)}`);
    console.log(`Expires At: ${generateTokenResponse.expiresAt.epoch()}`);
    return generateTokenResponse.authToken;
  }
  return "fail";

}



const buildResponseBody = (status: number, body: string, headers = {}) => {
  return {
    statusCode: status,
    headers,
    body,
  };
};
