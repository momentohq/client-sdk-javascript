import {App, aws_secretsmanager, Duration, Stack} from 'aws-cdk-lib';
import {RestApi, LambdaIntegration, Model, JsonSchemaType, RequestValidator} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

export class TopicsMicroserviceStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id);

    const nodeJsFunctionProps: NodejsFunctionProps = {
      environment: {
        "RUNTIME": "AWS",
        "REGION": "us-west-2",
        "SECRETNAME": "Momento_Auth_Token",
        "CACHENAME": "default-cache"
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
      entry: join(__dirname, '../resources', 'topics.ts'),
      ...nodeJsFunctionProps,
    });

    // Get the ARN for the existing secret the Lambda function will be using.
    let secret = aws_secretsmanager.Secret.fromSecretNameV2(this, "Momento_Auth_Token", "Momento_Auth_Token");

    // Grant read access for that secret to the Lambda function.
    secret.grantRead(serviceLambda);



    // Define the API Gateaway integration
    const api = new RestApi(this, "topics-api", {
      restApiName: "Topics Service",
      description: "This service takes in data to write to Momento Topics."
    });

    // Define the API Gateway request validator
    const requestValidator = new RequestValidator(this, 'RequestValidator', {
      restApi: api,
      validateRequestBody: true,
      validateRequestParameters: false,
    });

    const svcLambdaIntegration = new LambdaIntegration(serviceLambda);

    const topicsModel: Model = api.addModel('TopicsModel', {
      schema: {
        type: JsonSchemaType.OBJECT,
        properties: {
          topicValue: {
            type: JsonSchemaType.STRING
          },
          topicName: {
            type: JsonSchemaType.STRING
          }
        },
        required: ['topicName', 'topicValue']
      },
      contentType: 'application/json'
    });

/*    const options: MethodOptions = {
      requestParameters: {
        'method.request.querystring.topicName': true,
        'method.request.querystring.topicValue': true
      }
    }*/

    const topicsResource = api.root.addResource('topics');

    topicsResource.addMethod("POST", svcLambdaIntegration, {
      requestModels: { 'application/json': topicsModel },
      requestValidator: requestValidator,
    });
  }
}


/*
- Create Lambda function
- Create API gateway POST method


 */
