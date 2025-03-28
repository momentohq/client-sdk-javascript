import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {AdvancedCompressionCdkStack} from '../lib/advanced-compression-cdk-stack';

const app = new cdk.App();
const momentoApiKey = process.env.MOMENTO_API_KEY;

if (!momentoApiKey) {
  throw new Error('MOMENTO_API_KEY environment variable is required');
}

new AdvancedCompressionCdkStack(app, 'AdvancedCompressionCdkStack', {
  env: {
    momentoApiKey: momentoApiKey,
  },
});
