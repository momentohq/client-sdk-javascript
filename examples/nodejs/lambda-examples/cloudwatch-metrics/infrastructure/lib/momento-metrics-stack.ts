import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import {FilterPattern, LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import {
  Dashboard,
  GraphWidget,
  MathExpression,
  Metric,
  Shading,
  SingleValueWidget,
  Stats,
  Unit,
} from 'aws-cdk-lib/aws-cloudwatch';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import 'dotenv/config';

const validStackConfigs = ["lambda", "ecs", "dashboard-only"];

export class MomentoMetricsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: read in environment variables from your .env file
    console.log(process.env.MOMENTO_API_KEY);
    if (!this.validateMomentoApiKey(process.env.MOMENTO_API_KEY)) {
      throw new Error('Missing required environment variable MOMENTO_API_KEY');
    }
    const momentoApiKey = String(process.env.MOMENTO_API_KEY);

    if (!this.validateStackConfig(process.env.STACK_CONFIG)) {
      throw new Error('Missing or invalid entry for required environment variable STACK_CONFIG');
    }
    const stackConfig = String(process.env.STACK_CONFIG);

    if (!this.validateLogGroupName(stackConfig, process.env.LOG_GROUP_NAME)) {
      throw new Error('Missing required environment variable LOG_GROUP_NAME');
    }
    const dashboardOnlyLogGroupName = String(process.env.LOG_GROUP_NAME);

    // Step 2: insert your Momento API key into AWS Secrets Manager
    const apiKeySecret = new secrets.Secret(this, 'MomentoMetricsApiKey', {
      secretName: 'MomentoMetricsApiKey',
      secretStringValue: new cdk.SecretValue(momentoApiKey),
    });

    /*
    Step 3: determine which log group name to use when creating our log group.
    Note: Lambda functions automatically create a log group titled 'aws/lambda/FunctionName',
    so if you create only the dashboard here and use your own Lambda function, make sure to
    provide your function's log group name for the ___ parameter.
    */
    const configToLogGroupName = new Map([
      ["lambda", '/aws/lambda/MomentoMetricsMiddlewareCDKExample'],
      ["ecs", '/aws/ecs/MomentoMetricsMiddlewareCDKExample'],
      ["dashboard-only", dashboardOnlyLogGroupName]
    ]);
    const logGroupName = configToLogGroupName.get(stackConfig);

    const logGroup = new LogGroup(this, 'Logs', {
      logGroupName: logGroupName,
      retention: RetentionDays.ONE_DAY,
    });

    // Step 4: create the Lambda or ECS example as specified. Otherwise skip this step
    // and create only the dashboard.
    switch (stackConfig) {
      case "lambda": {
        this.setUpLambdaFunction(apiKeySecret);
        break;
      }
      case "ecs": {
        this.setUpEcsCluster(logGroup, apiKeySecret);
        break;
      }
      case "dashboard-only": {
        console.log('Skipping to dashboard creation');
        break;
      }
      default: {
        throw new Error('Unimplemented CDK stack application');
      }
    }

    /* Step 5:
    The Momento experimental metrics middleware produces JSON logs with metrics about each Momento request. An example log entry looks like this:
        (Momento: _ExperimentalMetricsLoggingMiddleware): 
        {
            "numActiveRequestsAtStart": 1,
            "numActiveRequestsAtFinish": 1,
            "requestType": "MiddlewareMessage",
            "status": 0,
            "startTime": 1697663118489,
            "requestBodyTime": 1697663118489,
            "endTime": 1697663118492,
            "duration": 3,
            "requestSize": 32,
            "responseSize": 2,
            "connectionID": "0"
        }
    
    The `createMetricFilters` function creates CloudWatch Metric Filters to extract metrics from these log messages. The metric filters are attached to the log group that we created above.
    */
    this.createMetricFilters(logGroup);
    
    // Step 6: create the CloudWatch dashboard and add all the widgets (graphs)
    const dashboard = new Dashboard(this, 'MomentoMetricsCDKExampleDashboard', {
      dashboardName: 'MomentoMetricsCDKExampleDashboard',
      defaultInterval: cdk.Duration.hours(1),
    });
    this.addWidgetsToDashboard(dashboard);
  }

  setUpLambdaFunction(apiKeySecret: cdk.aws_secretsmanager.Secret) {
    const nodejsLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoMetricsMiddlewareCDKExample', {
      functionName: 'MomentoMetricsMiddlewareCDKExample',
      runtime: lambda.Runtime.NODEJS_LATEST,
      entry: path.join(__dirname, '../../lambda/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda'),
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.minutes(6),
      memorySize: 128,
      environment: {
        MOMENTO_API_KEY_SECRET_NAME: apiKeySecret.secretName,
      },
    });
    apiKeySecret.grantRead(nodejsLambda);
  }

  setUpEcsCluster(logGroup: cdk.aws_logs.LogGroup, apiKeySecret: cdk.aws_secretsmanager.Secret) {
    const cluster = new ecs.Cluster(this, 'MomentoMetricsExampleFargateCluster');

    const imageAsset = new DockerImageAsset(this, "MomentoMetricsECSDockerImage", {
      directory: path.join(__dirname, "../../docker")
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MomentoMetricsMiddlewareCDKExample');
    taskDefinition.addContainer('MomentoMetricsECSContainer', {
      image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
      logging: new ecs.AwsLogDriver({
        logGroup: logGroup,
        streamPrefix: "MomentoMetricsMiddlewareCDKExample"
      })
    });

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "secretsmanager:GetSecretValue",
        "logs:PutLogEvents",
        "logs:CreateLogStream",
        "ecs:*"
      ],
    });
    policy.addResources(
      apiKeySecret.secretArn, 
      logGroup.logGroupArn, 
      cluster.clusterArn, 
      taskDefinition.taskDefinitionArn
    );
    taskDefinition.addToTaskRolePolicy(policy);
    taskDefinition.addToExecutionRolePolicy(policy);

    new ecs.FargateService(this, 'MomentoMetricsECSFargateService', {
      cluster,
      taskDefinition,
    });
  }

  createMetricFilters(logGroup: cdk.aws_logs.LogGroup) {
    logGroup.addMetricFilter('ExampleMetricFilterDuration', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Duration (Latency)',
      filterPattern: FilterPattern.literal('{$.duration > 0}'),
      metricValue: '$.duration',
      unit: Unit.MILLISECONDS,
    });

    logGroup.addMetricFilter('ExampleMetricFilterRequestSize', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Request Size (bytes)',
      filterPattern: FilterPattern.literal('{$.requestSize >= 0}'),
      metricValue: '$.requestSize',
      unit: Unit.BYTES,
    });

    logGroup.addMetricFilter('ExampleMetricFilterResponseSize', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Response Size (bytes)',
      filterPattern: FilterPattern.literal('{$.responseSize >= 0}'),
      metricValue: '$.responseSize',
      unit: Unit.BYTES,
    });

    logGroup.addMetricFilter('ExampleMetricFilterGrpcStatusCode', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'GRPC Status Code',
      filterPattern: FilterPattern.literal('{ $.status >= 0 }'),
      metricValue: '$.status',
    });
  }

  addWidgetsToDashboard(dashboard: cdk.aws_cloudwatch.Dashboard) {
    const latency = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Duration (Latency)',
          namespace: 'MomentoMetricsCDKExample',
        }),
      ],
      title: 'Duration (Latency)',
    });

    const errorCodes = new GraphWidget({
      left: [
        new Metric({
          metricName: 'GRPC Status Code',
          namespace: 'MomentoMetricsCDKExample',
        }),
      ],
      title: 'GRPC Error Codes',
      period: cdk.Duration.minutes(1),
      leftYAxis: {
        label: 'Error Code',
        max: 16,
      },
      leftAnnotations: [
        {
          value: 4,
          fill: Shading.ABOVE,
          label: 'GRPC Error Codes >= 4',
        },
      ],
    });

    const messageSizes = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Response Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'Response Size (bytes)',
        }),
        new Metric({
          metricName: 'Request Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'Request Size (bytes)',
        }),
      ],
      title: 'Request and Response Sizes in Bytes',
      period: cdk.Duration.minutes(1),
      statistic: Stats.AVERAGE,
    });

    // Add the first three widgets in the first row of the dashboard
    dashboard.addWidgets(latency, errorCodes, messageSizes);

    const transactionsPerSecond = new SingleValueWidget({
      metrics: [
        new Metric({
          metricName: 'Response Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'Count of responses per second',
          statistic: Stats.SAMPLE_COUNT,
        }),
      ],
      period: cdk.Duration.seconds(1),
      height: 6,
      sparkline: true,
      title: 'Transactions per second',
    });

    const numberOfRequests = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Request Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'Number of requests per second',
        }),
      ],
      title: 'Number of requests',
      period: cdk.Duration.minutes(1),
      statistic: Stats.SAMPLE_COUNT,
    });

    const totalBytesSentReceived = new GraphWidget({
      left: [
        new MathExpression({
          expression: 'm1 + m2',
          label: 'Total Bytes',
          usingMetrics: {
            m1: new Metric({
              metricName: 'Request Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              label: 'Total Request Bytes',
            }),
            m2: new Metric({
              metricName: 'Response Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              label: 'Total Response Bytes',
            }),
          },
        }),
      ],
      title: 'Total bytes sent and received',
      period: cdk.Duration.minutes(1),
      statistic: Stats.SUM,
    });

    // Add the next 3 widgets to the second row of the dashboard
    dashboard.addWidgets(transactionsPerSecond, numberOfRequests, totalBytesSentReceived);
  }

  validateStackConfig(stackConfig?: string) {
    if (stackConfig && stackConfig.length && validStackConfigs.includes(stackConfig)) {
      return true;
    }
    return false;
  }

  validateMomentoApiKey(key?: string) {
    return (key && key.length > 0);
  }

  validateLogGroupName(stackConfig: string, name?: string) {
    if (stackConfig === "dashboard-only" && name && name.length > 0) {
      return true;
    } else if (validStackConfigs.includes(stackConfig) && stackConfig != "dashboard-only") {
      return true;
    }
    return false;
  }
}
