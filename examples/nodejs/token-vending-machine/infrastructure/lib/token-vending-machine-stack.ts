import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as config from '../../lambda/token-vending-machine/config';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class TokenVendingMachineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoAuthTokenParam = new cdk.CfnParameter(this, 'MomentoAuthToken', {
      type: 'String',
      description:
        'The Momento Auth Token that will be used to vend browser tokens. Generated tokens will be stored in Secrets Manager for ongoing access later.',
      noEcho: true,
    });

    const authTokenSecret = new secrets.Secret(this, 'MomentoTokenVendingMachineAuthToken', {
      secretName: 'MomentoTokenVendingMachineAuthToken',
      secretStringValue: new cdk.SecretValue(momentoAuthTokenParam.valueAsString),
    });

    const tvmLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoTokenVendingMachine', {
      functionName: 'MomentoTokenVendingMachine',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/token-vending-machine/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda/token-vending-machine'),
      depsLockFilePath: path.join(__dirname, '../../lambda/token-vending-machine/package-lock.json'),
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

    switch (config.authenticationMethod) {
      case config.AuthenticationMethod.LambdaAuthorizer: {
        const authLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoTokenVendingMachineAuthorizer', {
          functionName: 'MomentoTokenVendingMachineAuthorizer',
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: path.join(__dirname, '../../lambda/authorizer/authorizer.ts'),
          projectRoot: path.join(__dirname, '../../lambda/authorizer'),
          depsLockFilePath: path.join(__dirname, '../../lambda/authorizer/package-lock.json'),
          handler: 'handler',
          timeout: cdk.Duration.seconds(30),
          memorySize: 128,
        });
  
        const authorizer = new apig.RequestAuthorizer(this, 'MomentoTokenVendingMachineTokenAuthorizer', {
          handler: authLambda,
          identitySources: [apig.IdentitySource.header('username'), apig.IdentitySource.header('password')],
          resultsCacheTtl: cdk.Duration.seconds(5),
        });
  
        api.root.addMethod('GET', tvmIntegration, {
          authorizer: authorizer,
          methodResponses: [
            { 
              statusCode: '200',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true
              }
            }
          ],
          requestParameters: {
            'method.request.header.username': true,
            'method.request.header.password': true,
          }
        });

        break;
      }
      case config.AuthenticationMethod.AmazonCognito: {
        const userPool = new cognito.UserPool(this, 'MomentoTokenVendingMachineUserPool', {
          userPoolName: 'MomentoTokenVendingMachineUserPool',
          signInAliases: {
            username: true
          },
          passwordPolicy: {
            minLength: 8,
            requireSymbols: true,
          }
        });
  
        const authorizer = new apig.CognitoUserPoolsAuthorizer(this, 'MomentoTokenVendingMachineTokenAuthorizer', {
          cognitoUserPools: [userPool],
        });
  
        api.root.addMethod('GET', tvmIntegration, {
          authorizationType: apig.AuthorizationType.COGNITO,
          authorizer: authorizer,
          methodResponses: [
            { 
              statusCode: '200',
              responseParameters: {
                'method.response.header.Access-Control-Allow-Origin': true
              }
            }
          ],
        });

        break;
      }
      case config.AuthenticationMethod.Open: {
        console.log("Warning: no authentication method provided, the Token Vending Machine URL will be publicly accessible");
        break;
      }
      default: {
        throw new Error("Unrecognized authentication method");
      }
    }
  }
}
