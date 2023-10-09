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

enum exampleApp {
  NodejsLambda,
  NodejsEcs,
  Custom
}

const stackConfig: exampleApp = exampleApp.Custom;

export class MomentoMetricsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const momentoApiKeyParam = new cdk.CfnParameter(this, 'MomentoApiKey', {
      type: 'String',
      description: 'The Momento API key that will be used to read from the cache.',
      noEcho: true,
    });

    const apiKeySecret = new secrets.Secret(this, 'MomentoMetricsApiKey', {
      secretName: 'MomentoMetricsApiKey',
      secretStringValue: new cdk.SecretValue(momentoApiKeyParam.valueAsString),
    });

    const configToLogGroupName = new Map([
      [exampleApp.NodejsLambda, '/aws/lambda/MomentoMetricsMiddlewareCDKExample'],
      [exampleApp.NodejsEcs, '/aws/ecs/MomentoMetricsMiddlewareCDKExample'],
      [exampleApp.Custom, '/custom/MomentoMetricsMiddlewareCDKExample']
    ])
    const logGroupName = configToLogGroupName.get(stackConfig);

    const logGroup = new LogGroup(this, 'Logs', {
      logGroupName: logGroupName,
      retention: RetentionDays.ONE_DAY,
    });

    switch (stackConfig) {
      case exampleApp.NodejsLambda: {
        const nodejsLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoMetricsMiddlewareCDKExample', {
          functionName: 'MomentoMetricsMiddlewareCDKExample',
          runtime: lambda.Runtime.NODEJS_16_X,
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
        break;
      }
      case exampleApp.NodejsEcs: {
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
        taskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "secretsmanager:ListSecrets",
            "secretsmanager:GetSecretValue",
            "logs:PutLogEvents",
            "logs:CreateLogStream",
            "ecs:*"
          ],
          resources: ["*"],
        }));
        taskDefinition.addToExecutionRolePolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "secretsmanager:ListSecrets",
            "secretsmanager:GetSecretValue",
            "logs:PutLogEvents",
            "logs:CreateLogStream",
            "ecs:*"
          ],
          resources: ["*"],
        }));

        new ecs.FargateService(this, 'MomentoMetricsECSFargateService', {
          cluster,
          taskDefinition,
        });
        break;
      }
      case exampleApp.Custom: {
        console.log('Skipping to dashboard creation');
        break;
      }
      default: {
        throw new Error('Unimplemented CDK stack application');
      }
    }

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

    const dashboard = new Dashboard(this, 'MomentoMetricsCDKExampleDashboard', {
      dashboardName: 'MomentoMetricsCDKExampleDashboard',
      defaultInterval: cdk.Duration.hours(1),
    });

    const latency = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Duration (Latency)',
          namespace: 'MomentoMetricsCDKExample',
          region: 'us-west-2',
        }),
      ],
      stacked: false,
      height: 6,
      width: 6,
      region: 'us-west-2',
      title: 'Duration (Latency)',
    });
    latency.position(0, 0);

    const errorCodes = new GraphWidget({
      left: [
        new Metric({
          metricName: 'GRPC Status Code',
          namespace: 'MomentoMetricsCDKExample',
          region: 'us-west-2',
        }),
      ],
      stacked: false,
      height: 6,
      width: 6,
      region: 'us-west-2',
      title: 'GRPC Error Codes',
      period: cdk.Duration.minutes(1),
      leftYAxis: {
        label: 'Error Code',
        min: 0,
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
    errorCodes.position(6, 0);

    const messageSizes = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Response Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          region: 'us-west-2',
          label: 'Response Size (bytes)',
        }),
        new Metric({
          metricName: 'Request Size (bytes)',
          namespace: '.',
          region: 'us-west-2',
          label: 'Request Size (bytes)',
        }),
      ],
      stacked: false,
      height: 6,
      width: 6,
      region: 'us-west-2',
      title: 'Request and Response Sizes in Bytes',
      period: cdk.Duration.minutes(1),
      statistic: Stats.AVERAGE,
    });
    messageSizes.position(12, 0);

    // Add the first three widgets in the first row of the dashboard
    dashboard.addWidgets(latency, errorCodes, messageSizes);

    const transactionsPerSecond = new SingleValueWidget({
      metrics: [
        new Metric({
          metricName: 'Response Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          region: 'us-west-2',
          label: 'Count of responses per second',
          statistic: Stats.SAMPLE_COUNT,
        }),
      ],
      period: cdk.Duration.seconds(1),
      height: 6,
      width: 6,
      sparkline: true,
      title: 'Transactions per second',
      region: 'us-west-2',
    });
    transactionsPerSecond.position(0, 6);

    const numberOfRequests = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Request Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          region: 'us-west-2',
          label: 'Number of requests per second',
        }),
      ],
      stacked: false,
      height: 6,
      width: 6,
      region: 'us-west-2',
      title: 'Number of requests',
      period: cdk.Duration.minutes(1),
      statistic: Stats.SAMPLE_COUNT,
    });
    numberOfRequests.position(6, 6);

    const totalBytesSentReceived = new GraphWidget({
      left: [
        new MathExpression({
          expression: 'm1 + m2',
          label: 'Total Bytes',
          usingMetrics: {
            m1: new Metric({
              metricName: 'Request Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              region: 'us-west-2',
              label: 'Total Request Bytes',
            }),
            m2: new Metric({
              metricName: 'Response Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              region: 'us-west-2',
              label: 'Total Response Bytes',
            }),
          },
        }),
      ],
      stacked: false,
      height: 6,
      width: 6,
      region: 'us-west-2',
      title: 'Total bytes sent and received',
      period: cdk.Duration.minutes(1),
      statistic: Stats.SUM,
    });
    totalBytesSentReceived.position(12, 6);

    // Add the next 3 widgets to the second row of the dashboard
    dashboard.addWidgets(transactionsPerSecond, numberOfRequests, totalBytesSentReceived);
  }
}
