import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import * as config from '../../lambda/token-vending-machine/config';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from 'aws-cdk-lib/custom-resources';

export class TokenVendingMachineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoApiKeyParam = new cdk.CfnParameter(this, 'MomentoApiKey', {
      type: 'String',
      description:
        'The Momento API key that will be used to vend browser tokens. Generated tokens will be stored in Secrets Manager for ongoing access later.',
      noEcho: true,
    });

    const apiKeySecret = new secrets.Secret(this, 'MomentoTokenVendingMachineApiKey', {
      secretName: 'MomentoTokenVendingMachineApiKey',
      secretStringValue: new cdk.SecretValue(momentoApiKeyParam.valueAsString),
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
        MOMENTO_API_KEY_SECRET_NAME: apiKeySecret.secretName,
      },
    });

    apiKeySecret.grantRead(tvmLambda);

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
        });

        api.root.addCorsPreflight({
          allowOrigins: ['*'],
          allowHeaders: ['username', 'password'],
        });

        break;
      }
      case config.AuthenticationMethod.AmazonCognito: {
        const userPool = new cognito.UserPool(this, 'MomentoTokenVendingMachineUserPool', {
          userPoolName: 'MomentoTokenVendingMachineUserPool',
          signInAliases: {
            username: true,
          },
          passwordPolicy: {
            minLength: 8,
            requireSymbols: true,
          },
        });
        new cdk.CfnOutput(this, 'UserPoolId', {
          value: userPool.userPoolId,
        });

        const userPoolClient = new cognito.UserPoolClient(this, 'MomentoTokenVendingMachineUserPoolClient', {
          userPool,
          generateSecret: false,
          authFlows: {
            userPassword: true,
          },
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
          value: userPoolClient.userPoolClientId,
        });

        const userPoolReadOnlyGroup = new cognito.CfnUserPoolGroup(this, 'ReadOnlyUserGroup', {
          userPoolId: userPool.userPoolId,
          groupName: 'ReadOnlyUserGroup',
          description: 'Group for users who can only subscribe to Momento Topics, not publish',
        });

        const userPoolReadWriteGroup = new cognito.CfnUserPoolGroup(this, 'ReadWriteUserGroup', {
          userPoolId: userPool.userPoolId,
          groupName: 'ReadWriteUserGroup',
          description: 'Group for users who can only subscribe and publish messages to Momento Topics',
        });

        const authorizer = new apig.CognitoUserPoolsAuthorizer(this, 'MomentoTokenVendingMachineTokenAuthorizer', {
          cognitoUserPools: [userPool],
        });

        api.root.addMethod('GET', tvmIntegration, {
          authorizationType: apig.AuthorizationType.COGNITO,
          authorizer: authorizer,
        });

        api.root.addCorsPreflight({
          allowOrigins: ['*'],
          allowHeaders: ['usergroup', 'cachename', 'authorization'],
        });

        this.createCognitoUser(this, userPool, 'momento', '$erverless', userPoolReadWriteGroup.groupName);
        this.createCognitoUser(this, userPool, 'serverless', 'momento!', userPoolReadOnlyGroup.groupName);

        break;
      }
      case config.AuthenticationMethod.Open: {
        console.log(
          'Warning: no authentication method provided, the Token Vending Machine URL will be publicly accessible'
        );
        api.root.addMethod('GET', tvmIntegration);
        api.root.addCorsPreflight({
          allowOrigins: ['*'],
        });
        break;
      }
      default: {
        throw new Error('Unrecognized authentication method');
      }
    }
  }

  // reference: https://github.com/awesome-cdk/cdk-userpool-user/blob/master/lib/UserPoolUser.ts
  private createCognitoUser(
    scope: Construct,
    userPool: cognito.IUserPool,
    username: string,
    password: string,
    group?: string
  ) {
    // Basically use the AWS SDK to fill in this gap in the CDK for creating a user with a password
    const newUser = new AwsCustomResource(scope, `AwsCustomResource-CreateCognitoUser-${username}`, {
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminCreateUser',
        parameters: {
          UserPoolId: userPool.userPoolId,
          Username: username,
          MessageAction: 'SUPPRESS',
          TemporaryPassword: password,
        },
        physicalResourceId: PhysicalResourceId.of(`AwsCustomResource-CreateCognitoUser-${username}`),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE}),
      installLatestAwsSdk: true,
    });

    const setUserPassword = new AwsCustomResource(scope, `AwsCustomResource-SetCognitoUserPassword-${username}`, {
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminSetUserPassword',
        parameters: {
          UserPoolId: userPool.userPoolId,
          Username: username,
          Password: password,
          Permanent: true,
        },
        physicalResourceId: PhysicalResourceId.of(`AwsCustomResource-SetCognitoUserPassword-${username}`),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE}),
      installLatestAwsSdk: true,
    });

    setUserPassword.node.addDependency(newUser);

    if (group) {
      const addUserToGroup = new cognito.CfnUserPoolUserToGroupAttachment(scope, `AttachUserToGroup-${username}`, {
        userPoolId: userPool.userPoolId,
        groupName: group,
        username: username,
      });
      addUserToGroup.node.addDependency(newUser);
      addUserToGroup.node.addDependency(setUserPassword);
      addUserToGroup.node.addDependency(userPool);
    }
  }
}
