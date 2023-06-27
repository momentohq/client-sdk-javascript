import { APIGatewayEvent} from "aws-lambda";
import {CreateAuthClient} from './libMomentoClient';
import { AuthClient, GenerateAuthToken, AllDataReadWrite, ExpiresIn } from '@gomomento/sdk';
// Import configurations info.
// @ts-ignore
import config from './config.json';

export const handler = async (event: APIGatewayEvent): Promise<any> => {
  try {

    // Get the Momento AuthClient.
    let client = await CreateAuthClient();

    try {
      const ret = await genToken(client)
      console.log(ret);
      if (ret == "fail") {
        return buildResponseBody(500, "Unknown server error from topics.ts");
      } else {
        return buildResponseBody(200, ret);
      }
    } catch (err){
      console.error(err);
      return buildResponseBody( 500,"Failed to set topic value.");
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
    const retVal: object = {
      "authToken": generateTokenResponse.authToken,
      "expires": generateTokenResponse.expiresAt.epoch(),
      "refreshToken": generateTokenResponse.refreshToken,
    };
    return JSON.stringify(retVal);
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
