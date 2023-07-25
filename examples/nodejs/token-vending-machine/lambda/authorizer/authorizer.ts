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

