#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventbridgeStack } from '../lib/eventbridge-stack';

const app = new cdk.App();
new EventbridgeStack(app, 'momento-ddb-eventbridge-stack', {});
