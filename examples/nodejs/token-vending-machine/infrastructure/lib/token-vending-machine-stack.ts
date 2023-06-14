import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';

export class TokenVendingMachineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoAuthTokenParam = new cdk.CfnParameter(this, 'MomentoAuthTokenParam', {
      type: 'String',
      description:
        'The Momento Auth Token that will be used to vend browser tokens. Will be stored in Secrets Manager.',
      noEcho: true,
    });

    const authTokenSecret = new secrets.Secret(this, 'MomentoTokenVendingMachineAuthToken', {
      secretName: 'MomentoTokenVendingMachineAuthToken',
      secretStringValue: new cdk.SecretValue(momentoAuthTokenParam.valueAsString),
    });

    const tvmLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoTokenVendingMachine', {
      functionName: 'MomentoTokenVendingMachine',
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, '../../lambda/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda'),
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        MOMENTO_AUTH_TOKEN_SECRET_NAME: authTokenSecret.secretName,
      },
    });

    authTokenSecret.grantRead(tvmLambda);

    const api = new apig.RestApi(this, 'MomentoTokenVendingMachineApi', {
      restApiName: 'Momento Token Vending Machine',
    });

    const tvmIntegration = new apig.LambdaIntegration(tvmLambda, {
      requestTemplates: {'application/json': '{ "statusCode": "200" }'},
    });

    api.root.addMethod('GET', tvmIntegration);
  }
}
