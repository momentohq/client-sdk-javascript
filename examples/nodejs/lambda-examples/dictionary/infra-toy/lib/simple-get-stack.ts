import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';

export class ToyLambda extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const toyLambda = new lambdaNodejs.NodejsFunction(this, 'ToyLambda', {
      functionName: 'ToyLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/toy/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda/toy'),
      depsLockFilePath: path.join(__dirname, '../../lambda/toy/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

  }
}
