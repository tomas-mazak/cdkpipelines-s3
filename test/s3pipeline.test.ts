import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as S3Pipeline from '../lib/pipeline-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const versionsBucket = new s3.Bucket(app, 'MyTestBucket');
    const stack = new S3Pipeline.PipelineStack(app, 'MyTestStack', {
        versionsBucket,
        environment: 'test'
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
