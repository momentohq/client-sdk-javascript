import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import {Construct} from 'constructs';

interface AdvancedCompressionCdkStackProps {
  env: {
    momentoApiKey: string;
  };
}

export class AdvancedCompressionCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AdvancedCompressionCdkStackProps, cdkStackProps?: cdk.StackProps) {
    super(scope, id, cdkStackProps);

    // Define the lambda layer from the ZIP file
    const zstdLayer = new lambda.LayerVersion(this, 'ZstdLayer', {
      code: lambda.Code.fromAsset('../src/zstd-layer/zstd_arm64_layer.zip'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X, lambda.Runtime.NODEJS_20_X],
      description: 'Zstd compression library for Momento',
    });

    // Create Lambda function
    new lambda.Function(this, 'AdvancedCompressionLambda', {
      functionName: 'AdvancedCompressionLambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../src/lambda/dist'),
      layers: [zstdLayer],
      environment: {
        MOMENTO_API_KEY: props.env.momentoApiKey,
      },
    });
  }
}
