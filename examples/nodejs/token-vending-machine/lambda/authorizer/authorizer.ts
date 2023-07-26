import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

// Lambda function for API Gateway Lambda Authorizer
// Input format: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-input.html 
// Output format: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html 
export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {

  // In this basic example, we are just checking if the request headers contain a
  // hardcoded username and password and generating the "Allow" IAM policy if it does
  const mockUsername = "momento";
  const mockPassword = "$erverless";
  const principalId = "momento-user";

  const headers = event.headers;
  if (!headers) {
    console.log("No headers provided!");
    throw new Error("Unauthorized");
  }

  if (headers && (!('username' in headers) || !('password' in headers))) {
    console.log("Expecting both 'username' and 'password' headers, at least one missing");
    throw new Error("Unauthorized");
  }

  if (headers && headers['username'] === mockUsername && headers['password'] === mockPassword) {
    console.log("Headers 'username' and 'password' had expected values, allowing access!")
    return generatePolicy(principalId, "Allow", event.methodArn);
  }
  else {
    console.log("Headers 'username' and 'password' did not have expected values, denying access");
    return generatePolicy(principalId, "Deny", event.methodArn);
  }
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

