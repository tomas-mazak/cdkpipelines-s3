// The source bucket
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

export class SharedResourcesStack extends cdk.Stack {
  public readonly versionsBucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.versionsBucket = new s3.Bucket(this, 'VersionsBucket', {
      bucketName: 's3pipeline-app-versions',
      versioned: true,
    });
  }
}
