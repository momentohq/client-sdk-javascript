import {App, aws_secretsmanager, Duration, RemovalPolicy, Stack} from 'aws-cdk-lib';
//import { Construct } from 'constructs';
//import { AuthorizationType, IdentitySource, LambdaIntegration, RequestAuthorizer, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

export class TopicsMicroserviceStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id);

/*    const handler = new lambda.Function(this, "TopicsHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "topics.handler",
      environment: {
        //BUCKET: bucket.bucketName
      }
    });*/
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
      memorySize: 256, // Increase memory to help with response times
      timeout: Duration.seconds(30) // Make timeout longer for bootstrap api
    }

    // Create a Lambda function for handling service requests
    const serviceLambda = new NodejsFunction(this, 'ServiceLambda', {
      entry: join(__dirname, '../resources', 'topics.ts'),
      ...nodeJsFunctionProps,
    });

    let secret = aws_secretsmanager.Secret.fromSecretNameV2(this, "Momento_Auth_Token", "Momento_Auth_Token");

    secret.grantRead(serviceLambda);

/*    const api = new apigateway.RestApi(this, "topics-api", {
      restApiName: "Topics Service",
      description: "This service takes in data to write to Momento Topics."
    });

    const getTopicsIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("POST", getTopicsIntegration); // GET /*/
  }
}


/*
- Create Lambda function
- Create API gateway POST method


 */
