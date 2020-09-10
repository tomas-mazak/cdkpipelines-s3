import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as actions from '@aws-cdk/aws-codepipeline-actions';
import * as s3 from '@aws-cdk/aws-s3';
import * as pipelines from '@aws-cdk/pipelines';

export interface PipelineStackProps extends cdk.StackProps {
  readonly versionsBucket: s3.IBucket,
  readonly environment: string,
  readonly promoteTo?: string,
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // The CodePipeline
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket')
    const cloudAssemblyArtifact = new codepipeline.Artifact()
    const codePipeline = new codepipeline.Pipeline(this, 'CodePipeline', {
      pipelineName: `S3Pipeline-${props.environment}`,
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new actions.S3SourceAction({
              actionName: 'S3',
              bucket: props.versionsBucket,
              bucketKey: `${props.environment}.zip`,
              output: cloudAssemblyArtifact
            })
          ]
        },
        // TODO: Build stage is mandatory in CDK pipeline atm, try to send a PR to upstream to make it optional
        {
          stageName: 'Build',
          actions: [
            new actions.ManualApprovalAction({
              actionName: 'Approve'
            })
          ]
        }
      ]
    })

    // CDK Pipeline
    const cdkPipeline = new pipelines.CdkPipeline(this, 'CdkPipeline', {
      codePipeline,
      cloudAssemblyArtifact,
    });

    if(props.promoteTo) {
      codePipeline.addStage({
        stageName: 'Promote',
        actions: [
          new actions.S3DeployAction({
            actionName: 'promote',
            input: cloudAssemblyArtifact,
            bucket: props.versionsBucket,
            objectKey: `${props.promoteTo}.zip`,
            extract: false,
          })
        ]
      });
    }
  }
}