import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';


// Input type:
// export interface APIGatewayRequestAuthorizerEvent {
//   type: 'REQUEST';
//   methodArn: string;
//   resource: string;
//   path: string;
//   httpMethod: string;
//   headers: APIGatewayRequestAuthorizerEventHeaders | null;
//   multiValueHeaders: APIGatewayRequestAuthorizerEventMultiValueHeaders | null;
//   pathParameters: APIGatewayRequestAuthorizerEventPathParameters | null;
//   queryStringParameters: APIGatewayRequestAuthorizerEventQueryStringParameters | null;
//   multiValueQueryStringParameters: APIGatewayRequestAuthorizerEventMultiValueQueryStringParameters | null;
//   stageVariables: APIGatewayRequestAuthorizerEventStageVariables | null;
//   requestContext: APIGatewayEventRequestContextWithAuthorizer<undefined>;
// }
// matches https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-input.html 


// Output type:
// export interface APIGatewayAuthorizerResult {
//   principalId: string;
//   policyDocument: PolicyDocument;
//   context?: APIGatewayAuthorizerResultContext | null | undefined;
//   usageIdentifierKey?: string | null | undefined;
// }
// matches https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html 


const mockUsername = "momento";
const mockPassword = "$erverless";
const principalId = "momento-user";

// Lambda function for verifying identity and generating a corresponding IAM policy
// for accessing the token vending machine API Gateway endpoint
export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {

  // In this basic example, we are just checking if the request headers contain a
  // hardcoded username and password and providing the "Allow" IAM policy if it does

  const headers = event.headers;
  if (headers && headers['username'] === mockUsername && headers['password'] === mockPassword) {
    return generatePolicy(principalId, "Allow", event.methodArn);
  }
  return generatePolicy(principalId, "Deny", event.methodArn);
};


// Helper function to generate a response from Authorizer to API Gateway.
function generatePolicy(principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    }
  };
}

