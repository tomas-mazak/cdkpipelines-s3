#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {PipelineStack} from '../lib/pipeline-stack';
import {SharedResourcesStack} from "../lib/shared-resources-stack";
import {ApplicationStack} from "../lib/application-stack";

const app = new cdk.App();

/*
 * This will be provided by app onboarding automation later:
 * - CI pipeline
 * - Versions bucket
 */
new SharedResourcesStack(app, 'S3PipelineSharedResourcesStack');


/*
 * Application in various environments
 */
class QaStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ApplicationStack(this, 'S3PipelineApplicationStack-QA', {
      // environment specific settings
      count: 1
    })
  }
}

class NxtStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ApplicationStack(this, 'S3PipelineApplicationStack-NXT', {
      // environment specific settings
      count: 2
    })
  }
}

class PrdStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ApplicationStack(this, 'S3PipelineApplicationStack-PRD', {
      // environment specific settings
      count: 3
    })
  }
}


/*
 * The actual pipelines defined within the application
 */
const versionsBucket = 's3pipeline-app-versions';

// Staging
new PipelineStack(app, 'S3PipelineStagingStack', {
  versionsBucket: versionsBucket,
  environment: 'staging',
  promoteTo: 'production',
  stages: [
    QaStage,
    NxtStage
  ]
});

// Production
new PipelineStack(app, 'S3PipelineProductionStack', {
  versionsBucket: versionsBucket,
  environment: 'production',
  stages: [
    PrdStage
  ]
});