// The source bucket
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import {GitHubSourceAction} from "@aws-cdk/aws-codepipeline-actions";
import {SimpleSynthAction} from "@aws-cdk/pipelines";
import * as actions from "@aws-cdk/aws-codepipeline-actions";

export class SharedResourcesStack extends cdk.Stack {
  // Versions bucket needs to be referenced by pipelines in separate stacks, so make it available
  public readonly versionsBucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.versionsBucket = new s3.Bucket(this, 'VersionsBucket', {
      bucketName: 's3pipeline-app-versions',
      versioned: true,
    });

    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket')
    const sourceArtifact = new codepipeline.Artifact()
    const cloudAssemblyArtifact = new codepipeline.Artifact()
    const ciPipeline = new codepipeline.Pipeline(this, "CodePipeline", {
      pipelineName: "S3Pipeline-CI",
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new GitHubSourceAction({
              actionName: 'GitHubInfraSource',
              oauthToken: cdk.SecretValue.secretsManager('github-token'),
              repo: 'cdkpipelines-s3',
              owner: 'tomas-mazak',
              output: sourceArtifact,
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [SimpleSynthAction.standardNpmSynth({
            sourceArtifact: sourceArtifact,
            cloudAssemblyArtifact: cloudAssemblyArtifact,
            buildCommand: 'npm run build'
          })]
        },
        {
          stageName: 'Promote',
          actions: [new actions.S3DeployAction({
            actionName: 'promote',
            input: cloudAssemblyArtifact,
            bucket: this.versionsBucket,
            objectKey: `staging.zip`,
            extract: false,
          })]
        }
      ]
    })
  }
}
