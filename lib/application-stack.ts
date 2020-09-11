import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import {ApplicationLoadBalancedFargateService, getVpc} from "./application-load-balanced-fargate-service";


export interface ApplicationStackProps extends  cdk.StackProps {
  count?: number
}

export class ApplicationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: ApplicationStackProps) {
    super(scope, id, props);

    const vpc = getVpc(this);
    const cluster = ecs.Cluster.fromClusterAttributes(this, "EcsCluster", {
      clusterName: 's3pipeline',
      vpc: vpc,
      securityGroups:[]
    });

    // Instantiate Fargate Service with just cluster and image
    new ApplicationLoadBalancedFargateService(this, "FargateService", {
      tla: 's3pipeline',
      vpc: vpc,
      ecsCluster: cluster,
      count: props?.count
    });
  }
}