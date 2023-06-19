import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import {Platform} from 'aws-cdk-lib/aws-ecr-assets';
import {Bucket} from 'aws-cdk-lib/aws-s3';

export class TopicsLoadGenStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'TopicsLoadGenVpc', {
      maxAzs: 1,
    });

    const cluster = new ecs.Cluster(this, 'TopicsLoadGenCluster', {
      clusterName: 'topics-loadgen-test-cluster',
      vpc: vpc,
    });

    const topicsLoadGenTestImage = ecs.ContainerImage.fromAsset(path.join(__dirname, '../../src'), {
      platform: Platform.LINUX_AMD64,
    });

    const topicsLoadGenTestBucket = new Bucket(this, 'topics-loadgen-test-bucket', {
      bucketName: 'topics-loadgen-test-bucket',
    });

    const topicsLoadGenTaskRole = new iam.Role(this, 'topics-loadgen-test-task-role', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    topicsLoadGenTestBucket.grantWrite(topicsLoadGenTaskRole);

    const loadGenTestDefinition = new ecs.FargateTaskDefinition(this, 'topics-loadgen-test-task-def', {
      memoryLimitMiB: 1024,
      taskRole: topicsLoadGenTaskRole,
      cpu: 512,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
      },
      family: 'topics-loadgen-test',
    });

    const topicsLoadGenContainerDefinition = new ecs.ContainerDefinition(
      this,
      'topics-loadgen-test-container-definition',
      {
        taskDefinition: loadGenTestDefinition,
        image: topicsLoadGenTestImage,
        logging: ecs.LogDriver.awsLogs({
          streamPrefix: 'topics-loadgen-test-load-driver',
        }),
      }
    );
  }
}
