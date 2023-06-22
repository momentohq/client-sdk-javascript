#!/usr/bin/env node
import 'source-map-support/register';
//import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { TopicsMicroserviceStack } from '../lib/topics-microservice-stack';

const app = new App();
new TopicsMicroserviceStack(app, 'TopicsMicroserviceStack');
