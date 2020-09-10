#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {PipelineStack} from '../lib/pipeline-stack';
import {SharedResourcesStack} from "../lib/shared-resources-stack";

const app = new cdk.App();

const shared = new SharedResourcesStack(app, 'S3PipelineSharedResourcesStack');

new PipelineStack(app, 'S3PipelineStagingStack', {
  versionsBucket: shared.versionsBucket,
  environment: 'staging',
  promoteTo: 'production'
});

new PipelineStack(app, 'S3PipelineProductionStack', {
  versionsBucket: shared.versionsBucket,
  environment: 'production'
});