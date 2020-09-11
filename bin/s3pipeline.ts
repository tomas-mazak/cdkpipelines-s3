#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {PipelineStack} from '../lib/pipeline-stack';
import {SharedResourcesStack} from "../lib/shared-resources-stack";

const app = new cdk.App();

/*
 * This will be provided by app onboarding automation later:
 * - CI pipeline
 * - Versions bucket
 */
new SharedResourcesStack(app, 'S3PipelineSharedResourcesStack');


/*
 * The actual pipelines defined within the application
 */
const versionsBucket = 's3pipeline-app-versions';

// Staging
new PipelineStack(app, 'S3PipelineStagingStack', {
  versionsBucket: versionsBucket,
  environment: 'staging',
  promoteTo: 'production'
});

// Production
new PipelineStack(app, 'S3PipelineProductionStack', {
  versionsBucket: versionsBucket,
  environment: 'production'
});