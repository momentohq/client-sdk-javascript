import {
  AuthorizationType,
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {App, Duration, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs';
