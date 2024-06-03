import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";

export class EventbridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoApiKeyParameter = new cdk.CfnParameter(this, 'MomentoApiKey', {
      type: 'String',
      description: 'The API key for Momento.',
    });

    const gameScoreDemoTable = new dynamodb.Table(this, "game-scores-demo-table", {
      tableName: "game-scores-demo",
      partitionKey: { name: "GameId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GamerTag", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logGroup = new logs.LogGroup(this, "AccessLogs", {
      retention: 90,
      logGroupName: cdk.Fn.sub(
        `game-scores-demo-logs-\${AWS::Region}`,
      ),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiKeySecret = new Secret(this, 'MomentoApiKey', {
      secretName: 'momento-eventbridge-api-key',
      secretStringValue: new cdk.SecretValue(momentoApiKeyParameter.valueAsString),
    });
    const connection = new events.Connection(this, 'game-scores-demo-connection', {
      connectionName: 'game-scores-demo-connection',
      authorization: events.Authorization.apiKey('Authorization', cdk.SecretValue.secretsManager(apiKeySecret.secretName)),
      description: 'Connection with API Key Authorization',
    });

    const cachePutApiDestination = new events.ApiDestination(this, "game-scores-demo-cache-put-api-destination", {
      apiDestinationName: "game-scores-demo-cache-put-api-destination",
      connection,
      endpoint: "https://api.cache.cell-alpha-dev.preprod.a.momentohq.com/cache/*",
      description: "Alpha Cache Set API",
      httpMethod: events.HttpMethod.PUT,
    });

    const topicPublishApiDestination = new events.ApiDestination(this, "game-scores-demo-topic-publish-api-destination", {
      apiDestinationName: "game-scores-demo-topic-publish-api-destination",
      connection,
      endpoint: "https://api.cache.cell-alpha-dev.preprod.a.momentohq.com/topics/*/*",
      description: "Alpha Topic Publish API",
      httpMethod: events.HttpMethod.POST,
    });

    const cacheDeleteApiDestination = new events.ApiDestination(this, "game-scores-demo-cache-delete-api-destination", {
      apiDestinationName: "game-scores-demo-cache-delete-api-destination",
      connection,
      endpoint: "https://api.cache.cell-alpha-dev.preprod.a.momentohq.com/cache/*",
      description: "Alpha Cache Delete API",
      httpMethod: events.HttpMethod.DELETE,
    });

    const role = new iam.Role(this, "AmazonEventBridgePipeGameDemoEventToMomentoCache", {
      roleName: "AmazonEventBridgePipeGameDemoEventToMomentoCache",
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
    });

    const deadLetterQueue = new sqs.Queue(this, "DeadLetterQueue", {
      queueName: "game-scores-demo-dlq",
      retentionPeriod: cdk.Duration.days(14),
    });

    const cachePutCfnPipe = new pipes.CfnPipe(this, "game-scores-demo-cache-put-pipe", {
      name: "game-scores-demo-cache-put-pipe",
      desiredState: "RUNNING",
      source: gameScoreDemoTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          batchSize: 1,
          startingPosition: "LATEST",
          maximumRetryAttempts: 0,
          deadLetterConfig: {
            arn: deadLetterQueue.queueArn,
          },
        },
      },
      target: cachePutApiDestination.apiDestinationArn!,
      roleArn: role.roleArn,
      logConfiguration: {
        cloudwatchLogsLogDestination: {
          logGroupArn: logGroup.logGroupArn,
        },
        level: "INFO",
        includeExecutionData: ["ALL"],
      },
    });

    const topicPublishCfnPipe = new pipes.CfnPipe(this, "game-scores-demo-topic-publish-pipe", {
      name: "game-scores-demo-topic-publish-pipe",
      desiredState: "RUNNING",
      source: gameScoreDemoTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          batchSize: 1,
          startingPosition: "LATEST",
          maximumRetryAttempts: 0,
          deadLetterConfig: {
            arn: deadLetterQueue.queueArn,
          },
        },
      },
      target: topicPublishApiDestination.apiDestinationArn!,
      roleArn: role.roleArn,
      logConfiguration: {
        cloudwatchLogsLogDestination: {
          logGroupArn: logGroup.logGroupArn,
        },
        level: "INFO",
        includeExecutionData: ["ALL"],
      },
    });

    const cacheDeleteCfnPipe = new pipes.CfnPipe(this, "game-scores-demo-cache-delete-pipe", {
      name: "game-scores-demo-cache-delete-pipe",
      desiredState: "RUNNING",
      source: gameScoreDemoTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          batchSize: 1,
          startingPosition: "LATEST",
          maximumRetryAttempts: 0,
          deadLetterConfig: {
            arn: deadLetterQueue.queueArn,
          },
        },
        filterCriteria: {
          filters: [{
            pattern: '{"eventName": ["REMOVE"]}',
          }],
        },
      },
      target: cacheDeleteApiDestination.apiDestinationArn!,
      roleArn: role.roleArn,
      logConfiguration: {
        cloudwatchLogsLogDestination: {
          logGroupArn: logGroup.logGroupArn,
        },
        level: "INFO",
        includeExecutionData: ["ALL"],
      },
    });

    const apiDestinationPolicy = new iam.PolicyStatement({
      actions: ["events:InvokeApiDestination"],
      resources: [cachePutCfnPipe.attrArn, cachePutApiDestination.apiDestinationArn, cacheDeleteCfnPipe.attrArn, cacheDeleteApiDestination.apiDestinationArn, topicPublishCfnPipe.attrArn, topicPublishApiDestination.apiDestinationArn],
      effect: iam.Effect.ALLOW,
    });
    role.addToPolicy(apiDestinationPolicy);

    const dynamoDbStreamPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      effect: iam.Effect.ALLOW,
      resources: [gameScoreDemoTable.tableStreamArn!, cachePutCfnPipe.attrArn, cacheDeleteCfnPipe.attrArn, topicPublishCfnPipe.attrArn],
    });
    role.addToPolicy(dynamoDbStreamPolicy);

    const sqsPolicy = new iam.PolicyStatement({
      actions: ["*"],
      effect: iam.Effect.ALLOW,
      resources: ["*"],
    });
    role.addToPolicy(sqsPolicy);

    cachePutCfnPipe.targetParameters = {
      inputTemplate: "{\n  \"level\": <$.dynamodb.NewImage.Level.N>,\n  \"score\": <$.dynamodb.NewImage.Score.N>\n}",
      httpParameters: {
        pathParameterValues: ["$.dynamodb.Keys.GameId.S"],
        queryStringParameters: {
          key: "$.dynamodb.Keys.GamerTag.S",
          ttl_seconds: "60",
        },
      },
    };

    topicPublishCfnPipe.targetParameters = {
      inputTemplate: "{\n  \"level\": <$.dynamodb.NewImage.Level.N>,\n  \"score\": <$.dynamodb.NewImage.Score.N>\n}",
      httpParameters: {
        pathParameterValues: ["$.dynamodb.Keys.GameId.S", "$.dynamodb.Keys.GamerTag.S"],
      },
    };

    cacheDeleteCfnPipe.targetParameters = {
      httpParameters: {
        pathParameterValues: ["$.dynamodb.Keys.GameId.S"],
        queryStringParameters: {
          key: "$.dynamodb.Keys.GamerTag.S"
        },
      },
    };

    cachePutCfnPipe.node.addDependency(gameScoreDemoTable);
    cachePutCfnPipe.node.addDependency(cachePutApiDestination);
    topicPublishCfnPipe.node.addDependency(gameScoreDemoTable);
    topicPublishCfnPipe.node.addDependency(topicPublishApiDestination);
    cacheDeleteCfnPipe.node.addDependency(gameScoreDemoTable);
    cacheDeleteCfnPipe.node.addDependency(cacheDeleteApiDestination);
  }
}
