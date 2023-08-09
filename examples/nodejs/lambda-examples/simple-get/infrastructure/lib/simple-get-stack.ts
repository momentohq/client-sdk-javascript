import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';

export class SimpleGetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoAuthTokenParam = new cdk.CfnParameter(this, 'MomentoAuthToken', {
      type: 'String',
      description: 'The Momento Auth Token that will be used to read from the cache.',
      noEcho: true,
    });

    const authTokenSecret = new secrets.Secret(this, 'MomentoSimpleGetAuthToken', {
      secretName: 'MomentoSimpleGetAuthToken',
      secretStringValue: new cdk.SecretValue(momentoAuthTokenParam.valueAsString),
    });

    const tvmLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoSimpleGet', {
      functionName: 'MomentoSimpleGet',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/simple-get/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda/simple-get'),
      depsLockFilePath: path.join(__dirname, '../../lambda/simple-get/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        MOMENTO_AUTH_TOKEN_SECRET_NAME: authTokenSecret.secretName,
      },
    });

    authTokenSecret.grantRead(tvmLambda);
  }
}
