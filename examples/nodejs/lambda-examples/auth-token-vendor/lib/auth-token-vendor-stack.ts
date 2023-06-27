import {App, aws_secretsmanager, Duration, Stack} from 'aws-cdk-lib';
import {RestApi, LambdaIntegration, Model, JsonSchemaType, RequestValidator} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

export class AuthTokenVendorStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id);

    const nodeJsFunctionProps: NodejsFunctionProps = {
      environment: {
        "RUNTIME": "AWS",
      },
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, '..', 'package-lock.json'),
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024, // Increase memory to help with response times
      timeout: Duration.seconds(10) // Make timeout longer for bootstrap api
    }

    // Create a Lambda function for handling service requests
    const serviceLambda = new NodejsFunction(this, 'ServiceLambda', {
      entry: join(__dirname, '../resources', 'token-vendor.ts'),
      ...nodeJsFunctionProps,
    });

    // Get the ARN for the existing secret the Lambda function will be using.
    let secret = aws_secretsmanager.Secret.fromSecretNameV2(
      this,
      "Momento_Auth_Token",
      "Momento_Auth_Token"
    );

    // Grant read access for that secret to the Lambda function.
    secret.grantRead(serviceLambda);

    // Define the API Gateway integration
    const api = new RestApi(this, "topics-api", {
      restApiName: "Auth Token Service",
      description: "This service fetches a temporary Momento auth token."
    });

    // Define the API Gateway request validator
    const requestValidator = new RequestValidator(this,
      'RequestValidator', {
      restApi: api,
      validateRequestBody: false,
      validateRequestParameters: false,
    });

    const svcLambdaIntegration = new LambdaIntegration(serviceLambda);

    const topicsResource = api.root.addResource('auth-token');

    topicsResource.addMethod("POST", svcLambdaIntegration);
  }
}
