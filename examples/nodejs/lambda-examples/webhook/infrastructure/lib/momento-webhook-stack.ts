import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import {CfnOutput} from "aws-cdk-lib";

export class MomentoWebhookStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoApiKeyParam = new cdk.CfnParameter(this, 'MomentoApiKey', {
      type: 'String',
      description: 'The Momento API key that will be used to read from the cache.',
      noEcho: true,
    });

    const momentoSecretStringParam = new cdk.CfnParameter(this, 'MomentoSecretString', {
      type: 'String',
      description: 'The Momento Webhook Secret String that will be used to validate the caller',
      noEcho: true,
    });

    const apiKeySecret = new secrets.Secret(this, 'MomentoWebhookHandlerApiKey', {
      secretName: 'MomentoWebhookHandlerApiKey',
      secretStringValue: new cdk.SecretValue(momentoApiKeyParam.valueAsString),
    });

    const secretStringSecret = new secrets.Secret(this, 'MomentoWebhookHandlerSecretString', {
      secretName: 'MomentoWebhookHandlerSecretString',
      secretStringValue: new cdk.SecretValue(momentoSecretStringParam.valueAsString),
    });

    const webhookHandlerLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoWebhookHandler', {
      functionName: 'MomentoWebhookHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/webhook-handler/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda/webhook-handler'),
      depsLockFilePath: path.join(__dirname, '../../lambda/webhook-handler/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        MOMENTO_API_KEY_SECRET_NAME: apiKeySecret.secretName,
        THE_SIGNING_SECRET: secretStringSecret.secretName,
      },
    });

    const serviceLambda = new lambdaNodejs.NodejsFunction(this, 'ServiceLambda', {
      functionName: 'ServiceLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/service-topics/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda/service-topics'),
      depsLockFilePath: path.join(__dirname, '../../lambda/service-topics/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        MOMENTO_API_KEY_SECRET_NAME: apiKeySecret.secretName
      },
    });

    // 👇 Setup lambda url
    const lambdaUrl = webhookHandlerLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    apiKeySecret.grantRead(webhookHandlerLambda);
    apiKeySecret.grantRead(serviceLambda);
    secretStringSecret.grantRead(webhookHandlerLambda);

    new CfnOutput(this, 'FunctionUrl ', { value: lambdaUrl.url });
  }
}
