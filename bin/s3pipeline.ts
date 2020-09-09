#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { S3PipelineStack } from '../lib/s3pipeline-stack';

const app = new cdk.App();
new S3PipelineStack(app, 'S3PipelineStack');
