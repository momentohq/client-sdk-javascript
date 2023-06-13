import {
  AuthorizationType,
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {App, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

export class DemoServerlessTopicsCollector extends Stack {
  constructor(app: App, id: string, props?: StackProps){
    super(app, id, props);

    const NodeJsFunctionProps: NodejsFunctionProps = {
      environment: {
        "RUNTIME": "AWS",
      },
      bundling: {
        externalModules: ['aws-sdk',],
      },
      depsLockFilePath: join(__dirname, '..', '..', 'src', 'package-lock.json'),
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.seconds(10)
    }
  }
}
