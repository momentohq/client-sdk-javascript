import {App, aws_secretsmanager, Duration, Stack} from 'aws-cdk-lib';
//import { Construct } from 'constructs';
import {RestApi, LambdaIntegration, Method, MethodOptions} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

export class TopicsMicroserviceStack extends Stack {
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
      memorySize: 128, // Increase memory to help with response times
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

    const api = new RestApi(this, "topics-api", {
      restApiName: "Topics Service",
      description: "This service takes in data to write to Momento Topics."
    });

    const svcLambdaIntegration = new LambdaIntegration(serviceLambda);

    const options: MethodOptions = {
      requestParameters: {
        'method.request.querystring.topicName': true,
        'method.request.querystring.topicValue': true,
      }
    }

    api.root.addMethod("POST", svcLambdaIntegration, options); // POST /
  }
}


/*
- Create Lambda function
- Create API gateway POST method


 */
