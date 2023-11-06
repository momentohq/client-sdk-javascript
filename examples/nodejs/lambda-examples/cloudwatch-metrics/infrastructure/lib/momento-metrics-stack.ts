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
    if (!this.validateMomentoApiKey(process.env.MOMENTO_API_KEY)) {
      throw new Error('Missing required environment variable MOMENTO_API_KEY');
    }
    const momentoApiKey = String(process.env.MOMENTO_API_KEY);

    if (!this.validateStackConfig(process.env.EXAMPLE_MOMENTO_APPLICATION)) {
      throw new Error('Missing or invalid entry for required environment variable EXAMPLE_MOMENTO_APPLICATION');
    }
    const stackConfig = String(process.env.EXAMPLE_MOMENTO_APPLICATION);

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
    */
    const configToLogGroupName = new Map([
      ["lambda", '/aws/lambda/MomentoMetricsMiddlewareLambda'],
      ["ecs", '/aws/ecs/MomentoMetricsMiddlewareECS'],
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
          "momento": {
            "numActiveRequestsAtStart": 1,
            "numActiveRequestsAtFinish": 1,
            "requestType": "_GetRequest",
            "status": 0,
            "startTime": 1697663118489,
            "requestBodyTime": 1697663118489,
            "endTime": 1697663118492,
            "duration": 3,
            "requestSize": 32,
            "responseSize": 2,
            "connectionID": "0"
          }
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
    const nodejsLambda = new lambdaNodejs.NodejsFunction(this, 'MomentoMetricsMiddlewareLambda', {
      functionName: 'MomentoMetricsMiddlewareLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/handler.ts'),
      projectRoot: path.join(__dirname, '../../lambda'),
      depsLockFilePath: path.join(__dirname, '../../lambda/package-lock.json'),
      handler: 'handler',
      timeout: cdk.Duration.minutes(12),
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

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MomentoMetricsMiddlewareECS');
    taskDefinition.addContainer('MomentoMetricsECSContainer', {
      image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
      logging: new ecs.AwsLogDriver({
        logGroup: logGroup,
        streamPrefix: "MomentoMetricsMiddlewareECS"
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
    logGroup.addMetricFilter('MetricFilterDuration', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Latency',
      filterPattern: FilterPattern.literal('{$.momento.duration > 0}'),
      metricValue: '$.momento.duration',
      unit: Unit.MILLISECONDS,
    });

    logGroup.addMetricFilter('MetricFilterDurationAndGrpcStatus', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Latency + GRPC Status',
      filterPattern: FilterPattern.literal('{$.momento.duration > 0 && $.momento.status >= 0}'),
      metricValue: '$.momento.duration',
      unit: Unit.MILLISECONDS,
      dimensions: {
        'status': '$.momento.status',
      }
    });

    logGroup.addMetricFilter('MetricFilterDurationAndRequestType', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Latency + Request Type',
      filterPattern: FilterPattern.literal('{$.momento.duration > 0 && $.momento.requestType = "*"}'),
      metricValue: '$.momento.duration',
      unit: Unit.MILLISECONDS,
      dimensions: {
        'requestType': '$.momento.requestType',
      }
    });

    logGroup.addMetricFilter('MetricFilterRequestSize', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Request Size (bytes)',
      filterPattern: FilterPattern.literal('{$.momento.requestSize >= 0}'),
      metricValue: '$.momento.requestSize',
      unit: Unit.BYTES,
    });

    logGroup.addMetricFilter('MetricFilterRequestSizeAndGrpcStatus', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Request Size (bytes) + GRPC Status',
      filterPattern: FilterPattern.literal('{$.momento.requestSize >= 0 && $.momento.status >= 0}'),
      metricValue: '$.momento.requestSize',
      unit: Unit.BYTES,
      dimensions: {
        'status': '$.momento.status',
      }
    });

    logGroup.addMetricFilter('MetricFilterRequestSizeAndRequestType', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Request Size (bytes) + Request Type',
      filterPattern: FilterPattern.literal('{$.momento.requestSize >= 0 && $.momento.requestType = "*"}'),
      metricValue: '$.momento.requestSize',
      unit: Unit.BYTES,
      dimensions: {
        'requestType': '$.momento.requestType',
      }
    });

    logGroup.addMetricFilter('MetricFilterResponseSize', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Response Size (bytes)',
      filterPattern: FilterPattern.literal('{$.momento.responseSize >= 0}'),
      metricValue: '$.momento.responseSize',
      unit: Unit.BYTES,
    });

    logGroup.addMetricFilter('MetricFilterResponseSizeAndGrpcStatus', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Response Size (bytes) + GRPC Status',
      filterPattern: FilterPattern.literal('{$.momento.responseSize >= 0 && $.momento.status >= 0}'),
      metricValue: '$.momento.responseSize',
      unit: Unit.BYTES,
      dimensions: {
        'status': '$.momento.status',
      }
    });

    logGroup.addMetricFilter('MetricFilterResponseSizeAndRequestType', {
      metricNamespace: 'MomentoMetricsCDKExample',
      metricName: 'Response Size (bytes) +  Request Type',
      filterPattern: FilterPattern.literal('{$.momento.responseSize >= 0 && $.momento.requestType = "*"}'),
      metricValue: '$.momento.responseSize',
      unit: Unit.BYTES,
      dimensions: {
        'requestType': '$.momento.requestType',
      }
    });
  }

  addWidgetsToDashboard(dashboard: cdk.aws_cloudwatch.Dashboard) {
    // All graphs currently default to a period of one minute
    const graphPeriod = cdk.Duration.minutes(1);

    const latency = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Latency',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(50),
          label: 'p50'
        }),
        new Metric({
          metricName: 'Latency',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(90),
          label: 'p90'
        }),
        new Metric({
          metricName: 'Latency',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(99),
          label: 'p99'
        }),
      ],
      title: 'Latency',
      leftYAxis: {
        label: 'milliseconds',
        min: 0,
      },
      period: graphPeriod,
    });

    const latencyByGrpcStatus = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Latency + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(50),
          label: 'p50 OK',
          dimensionsMap: {
            'status': '0'
          }
        }),
        new Metric({
          metricName: 'Latency + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(99),
          label: 'p99 OK',
          dimensionsMap: {
            'status': '0'
          }
        }),
        new Metric({
          metricName: 'Latency + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(50),
          label: 'p50 ERROR: INTERNAL',
          dimensionsMap: {
            'status': '13'
          }
        }),
        new Metric({
          metricName: 'Latency + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(99),
          label: 'p99 ERROR: INTERNAL',
          dimensionsMap: {
            'status': '13'
          }
        }),
      ],
      title: 'Latency + Select GRPC Statuses',
      leftYAxis: {
        label: 'milliseconds',
        min: 0,
      },
      period: graphPeriod,
    });

    const latencyByRequestType = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Latency + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(50),
          label: 'p50 GET',
          dimensionsMap: {
            'requestType': '_GetRequest'
          }
        }),
        new Metric({
          metricName: 'Latency + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(99),
          label: 'p99 GET',
          dimensionsMap: {
            'requestType': '_GetRequest'
          }
        }),
        new Metric({
          metricName: 'Latency + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(50),
          label: 'p50 SET',
          dimensionsMap: {
            'requestType': '_SetRequest'
          }
        }),
        new Metric({
          metricName: 'Latency + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          statistic: Stats.percentile(99),
          label: 'p99 SET',
          dimensionsMap: {
            'requestType': '_SetRequest'
          }
        }),
      ],
      title: 'Latency + Select Request Types',
      leftYAxis: {
        label: 'milliseconds',
        min: 0,
      },
      period: graphPeriod,
    });

    // Add the first three widgets to the first row of the dashboard
    dashboard.addWidgets(latency, latencyByGrpcStatus, latencyByRequestType);

    const messageSizes = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Response Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 responses',
          statistic: Stats.percentile(50),
        }),
        new Metric({
          metricName: 'Response Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p99 responses',
          statistic: Stats.percentile(99),
        }),
        new Metric({
          metricName: 'Request Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 requests',
          statistic: Stats.percentile(50),
        }),
        new Metric({
          metricName: 'Request Size (bytes)',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p99 requests',
          statistic: Stats.percentile(99),
        }),
      ],
      title: 'Size in Bytes',
      period: graphPeriod,
      leftYAxis: {
        label: 'bytes',
        min: 0,
      },
    });

    const messageSizesByGrpcStatus = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Response Size (bytes) + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 responses OK',
          statistic: Stats.percentile(50),
          dimensionsMap: {
            'status': '0'
          }
        }),
        new Metric({
          metricName: 'Response Size (bytes) + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 responses ERROR: INTERNAL',
          statistic: Stats.percentile(50),
          dimensionsMap: {
            'status': '13'
          }
        }),
        new Metric({
          metricName: 'Request Size (bytes) + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 requests OK',
          statistic: Stats.percentile(50),
          dimensionsMap: {
            'status': '0'
          }
        }),
        new Metric({
          metricName: 'Request Size (bytes) + GRPC Status',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 requests ERROR: INTERNAL',
          statistic: Stats.percentile(50),
          dimensionsMap: {
            'status': '13'
          }
        }),
      ],
      title: 'Size in Bytes + Select GRPC Statuses',
      period: graphPeriod,
      leftYAxis: {
        label: 'bytes',
        min: 0,
      },
    });

    const messageSizesByRequestType = new GraphWidget({
      left: [
        new Metric({
          metricName: 'Response Size (bytes) + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 responses GET',
          statistic: Stats.percentile(50),
          dimensionsMap: {
            'requestType': '_GetRequest'
          }
        }),
        new Metric({
          metricName: 'Response Size (bytes) + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 responses SET',
          statistic: Stats.percentile(99),
          dimensionsMap: {
            'requestType': '_SetRequest'
          }
        }),
        new Metric({
          metricName: 'Request Size (bytes) + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p50 requests GET',
          statistic: Stats.percentile(50),
          dimensionsMap: {
            'requestType': '_GetRequest'
          }
        }),
        new Metric({
          metricName: 'Request Size (bytes) + Request Type',
          namespace: 'MomentoMetricsCDKExample',
          label: 'p99 requests SET',
          statistic: Stats.percentile(99),
          dimensionsMap: {
            'requestType': '_SetRequest'
          }
        }),
      ],
      title: 'Size in Bytes + Select Request Types',
      period: graphPeriod,
      leftYAxis: {
        label: 'bytes',
        min: 0,
      },
    });

    // Add the next widgets to the second row of the dashboard
    dashboard.addWidgets(messageSizes, messageSizesByGrpcStatus, messageSizesByRequestType);

    const requestsPerSecond = new GraphWidget({
      left: [
        new MathExpression({
          expression: 'countPerMinute / 60', 
          label: 'Average count of requests per second',
          usingMetrics: {
            countPerMinute: new Metric({
              metricName: 'Request Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              statistic: Stats.SAMPLE_COUNT,
            }),
          }
        })
      ],
      title: 'Number of requests per second',
      period: graphPeriod,
      statistic: Stats.SAMPLE_COUNT,
      leftYAxis: {
        label: 'average count per second',
        min: 0,
      },
    });

    const totalBytesSentReceived = new GraphWidget({
      left: [
        new MathExpression({
          expression: 'm1 + m2',
          label: 'p50',
          usingMetrics: {
            m1: new Metric({
              metricName: 'Request Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p50 requests',
              statistic: Stats.percentile(50),
            }),
            m2: new Metric({
              metricName: 'Response Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p50 responses',
              statistic: Stats.percentile(50),
            }),
          },
        }),
        new MathExpression({
          expression: 'm3 + m4',
          label: 'p99',
          usingMetrics: {
            m3: new Metric({
              metricName: 'Request Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p99 requests',
              statistic: Stats.percentile(99),
            }),
            m4: new Metric({
              metricName: 'Response Size (bytes)',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p99 responses',
              statistic: Stats.percentile(99),
            }),
          },
        }),
      ],
      title: 'Total bytes sent and received',
      period: graphPeriod,
      leftYAxis: {
        label: 'bytes',
        min: 0,
      },
    });

    const totalBytesSentReceivedByRequestType = new GraphWidget({
      left: [
        new MathExpression({
          expression: 'm1 + m2',
          label: 'p50 GET',
          usingMetrics: {
            m1: new Metric({
              metricName: 'Request Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p50 GET requests',
              statistic: Stats.percentile(50),
              dimensionsMap: {
                'requestType': '_GetRequest'
              }
            }),
            m2: new Metric({
              metricName: 'Response Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p50 GET responses',
              statistic: Stats.percentile(50),
              dimensionsMap: {
                'requestType': '_GetRequest'
              }
            }),
          },
        }),
        new MathExpression({
          expression: 'm3 + m4',
          label: 'p99 GET',
          usingMetrics: {
            m3: new Metric({
              metricName: 'Request Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p99 GET requests',
              statistic: Stats.percentile(99),
              dimensionsMap: {
                'requestType': '_GetRequest'
              }
            }),
            m4: new Metric({
              metricName: 'Response Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p99 GET responses',
              statistic: Stats.percentile(99),
              dimensionsMap: {
                'requestType': '_GetRequest'
              }
            }),
          },
        }),
        new MathExpression({
          expression: 'm5 + m6',
          label: 'p50 SET',
          usingMetrics: {
            m5: new Metric({
              metricName: 'Request Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p50 SET requests',
              statistic: Stats.percentile(50),
              dimensionsMap: {
                'requestType': '_SetRequest'
              }
            }),
            m6: new Metric({
              metricName: 'Response Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p50 SET responses',
              statistic: Stats.percentile(50),
              dimensionsMap: {
                'requestType': '_SetRequest'
              }
            }),
          },
        }),
        new MathExpression({
          expression: 'm7 + m8',
          label: 'p99 SET',
          usingMetrics: {
            m7: new Metric({
              metricName: 'Request Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p99 SET requests',
              statistic: Stats.percentile(99),
              dimensionsMap: {
                'requestType': '_SetRequest'
              }
            }),
            m8: new Metric({
              metricName: 'Response Size (bytes) + Request Type',
              namespace: 'MomentoMetricsCDKExample',
              label: 'p99 SET responses',
              statistic: Stats.percentile(99),
              dimensionsMap: {
                'requestType': '_SetRequest'
              }
            }),
          },
        }),
      ],
      title: 'Total bytes sent and received',
      period: graphPeriod,
      leftYAxis: {
        label: 'bytes',
        min: 0,
      },
    });

    // Add the next widgets to the third row of the dashboard
    dashboard.addWidgets(requestsPerSecond, totalBytesSentReceived, totalBytesSentReceivedByRequestType);
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
