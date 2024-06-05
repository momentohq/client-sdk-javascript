import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";

const cacheName: string = "momento-eventbridge-cache";
const topicName: string = "momento-eventbridge-topic";

export class EventbridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { apiKeySecret, momentoApiEndpointParameter, logGroup } = this.createUtilities();

    // Define the DynamoDB table for the weather stats demo
    const weatherStatsDemoTable = new dynamodb.Table(this, "weather-stats-demo-table", {
      tableName: "weather-stats-demo",
      partitionKey: { name: "Location", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Define the connection for the event bridge
    const connection = new events.Connection(this, 'weather-stats-demo-connection', {
      connectionName: 'weather-stats-demo-connection',
      authorization: events.Authorization.apiKey('Authorization', cdk.SecretValue.secretsManager(apiKeySecret.secretName)),
      description: 'Connection with API Key Authorization',
    });

    // Define the API destination for the cache put operation.
    const cachePutApiDestination = new events.ApiDestination(this, "weather-stats-demo-cache-put-api-destination", {
      apiDestinationName: "weather-stats-demo-cache-put-api-destination",
      connection,
      endpoint: `${momentoApiEndpointParameter.valueAsString}/cache/*`,
      description: "Cache Set API",
      httpMethod: events.HttpMethod.PUT,
    });

    // Define the API destination for the topic publish operation
    const topicPublishApiDestination = new events.ApiDestination(this, "weather-stats-demo-topic-publish-api-destination", {
      apiDestinationName: "weather-stats-demo-topic-publish-api-destination",
      connection,
      endpoint: `${momentoApiEndpointParameter.valueAsString}/topics/*/*`,
      description: "Topic Publish API",
      httpMethod: events.HttpMethod.POST,
    });

    // Define the API destination for the cache delete operation
    const cacheDeleteApiDestination = new events.ApiDestination(this, "weather-stats-demo-cache-delete-api-destination", {
      apiDestinationName: "weather-stats-demo-cache-delete-api-destination",
      connection,
      endpoint: `${momentoApiEndpointParameter.valueAsString}/cache/*`,
      description: "Cache Delete API",
      httpMethod: events.HttpMethod.DELETE,
    });
    // Define the dead letter queue for inspecting failed events to event bridge
    const deadLetterQueue = new sqs.Queue(this, "DeadLetterQueue", {
      queueName: "weather-stats-demo-dlq",
      retentionPeriod: cdk.Duration.days(14),
    });

    // Define the role for the event bridge
    const role = new iam.Role(this, "AmazonEventBridgePipeWeatherStatsDemoEventToMomentoCache", {
      roleName: "AmazonEventBridgePipeWeatherStatsDemoEventToMomentoCache",
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
    });
    this.addPolicyForEventBridgeRole(role, cachePutApiDestination, cacheDeleteApiDestination, topicPublishApiDestination, weatherStatsDemoTable, deadLetterQueue);


    // Define the pipe for the cache put operation
    const cachePutCfnPipe = new pipes.CfnPipe(this, "weather-stats-demo-cache-put-pipe", {
      name: "weather-stats-demo-cache-put-pipe",
      desiredState: "RUNNING",
      source: weatherStatsDemoTable.tableStreamArn!,
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
            pattern: '{"eventName": ["INSERT", "MODIFY"]}',
          }],
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

    // Define the pipe for the topic publish operation
    const topicPublishCfnPipe = new pipes.CfnPipe(this, "weather-stats-demo-topic-publish-pipe", {
      name: "weather-stats-demo-topic-publish-pipe",
      desiredState: "RUNNING",
      source: weatherStatsDemoTable.tableStreamArn!,
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

    // Define the pipe for the cache delete operation
    const cacheDeleteCfnPipe = new pipes.CfnPipe(this, "weather-stats-demo-cache-delete-pipe", {
      name: "weather-stats-demo-cache-delete-pipe",
      desiredState: "RUNNING",
      source: weatherStatsDemoTable.tableStreamArn!,
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

    // Add target parameters to the pipes
    cachePutCfnPipe.targetParameters = {
      inputTemplate: "{\n  \"Location\": <$.dynamodb.Keys.Location.S>, \n  \"Max Temp (°F)\": <$.dynamodb.NewImage.MaxTemp.N>,\n  \"Min Temp (°F)\": <$.dynamodb.NewImage.MinTemp.N>, \n  \"Chances of Precipitation (%)\": <$.dynamodb.NewImage.ChancesOfPrecipitation.N>\n}",
      httpParameters: {
        pathParameterValues: [cacheName],
        queryStringParameters: {
          key: "$.dynamodb.Keys.Location.S",
          ttl_seconds: "120",
        },
      },
    };

    topicPublishCfnPipe.targetParameters = {
      inputTemplate: "{\n \"Event Type\": <$.eventName>,  \"Location\": <$.dynamodb.Keys.Location.S>, \n  \"Max Temp (°F)\": <$.dynamodb.NewImage.MaxTemp.N>,\n  \"Min Temp (°F)\": <$.dynamodb.NewImage.MinTemp.N>, \n  \"Chances of Precipitation (%)\": <$.dynamodb.NewImage.ChancesOfPrecipitation.N>\n}",
      httpParameters: {
        pathParameterValues: [cacheName, topicName],
      },
    };

    cacheDeleteCfnPipe.targetParameters = {
      httpParameters: {
        pathParameterValues: [cacheName],
        queryStringParameters: {
          key: "$.dynamodb.Keys.Location.S"
        },
      },
    };

    // Add dependencies to the pipes
    cachePutCfnPipe.node.addDependency(weatherStatsDemoTable);
    cachePutCfnPipe.node.addDependency(cachePutApiDestination);
    topicPublishCfnPipe.node.addDependency(weatherStatsDemoTable);
    topicPublishCfnPipe.node.addDependency(topicPublishApiDestination);
    cacheDeleteCfnPipe.node.addDependency(weatherStatsDemoTable);
    cacheDeleteCfnPipe.node.addDependency(cacheDeleteApiDestination);
  }

  private createUtilities() {
    // Define the Momento API Key parameter
    const momentoApiKeyParameter = new cdk.CfnParameter(this, 'MomentoApiKey', {
      type: 'String',
      description: 'The API key for Momento.',
    });

    // Define the Momento API Endpoint parameter
    const momentoApiEndpointParameter = new cdk.CfnParameter(this, 'MomentoApiEndpoint', {
      type: 'String',
      description: 'The API endpoint for Momento.',
    });

    // Define the API key secret for the connection. The API key is stored in AWS Secrets Manager.
    const apiKeySecret = new Secret(this, 'MomentoEventbridgeApiKey', {
      secretName: 'momento-eventbridge-api-key',
      secretStringValue: new cdk.SecretValue(momentoApiKeyParameter.valueAsString),
    });

    // Define the log group for the access logs
    const logGroup = new logs.LogGroup(this, "AccessLogs", {
      retention: 90,
      logGroupName: cdk.Fn.sub(
        `weather-stats-demo-logs-\${AWS::Region}`,
      ),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    return { apiKeySecret, momentoApiEndpointParameter, logGroup };
  }

  private addPolicyForEventBridgeRole(role: iam.Role, cachePutApiDestination: events.ApiDestination, cacheDeleteApiDestination: events.ApiDestination, topicPublishApiDestination: events.ApiDestination, weatherStatsDemoTable: dynamodb.Table, deadLetterQueue: sqs.Queue) {
    // Define the role policy for restricting access to the API destinations
    const apiDestinationPolicy = new iam.PolicyStatement({
      actions: ["events:InvokeApiDestination"],
      resources: [cachePutApiDestination.apiDestinationArn, cacheDeleteApiDestination.apiDestinationArn, topicPublishApiDestination.apiDestinationArn],
      effect: iam.Effect.ALLOW,
    });
    role.addToPolicy(apiDestinationPolicy);

    // Define the role policy for accessing the DynamoDB stream
    const dynamoDbStreamPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      effect: iam.Effect.ALLOW,
      resources: [weatherStatsDemoTable.tableStreamArn!],
    });
    role.addToPolicy(dynamoDbStreamPolicy);

    const sqsPolicy = new iam.PolicyStatement({
      actions: [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl"
      ],
      effect: iam.Effect.ALLOW,
      resources: [deadLetterQueue.queueArn],
    });
    role.addToPolicy(sqsPolicy);
  }
}
