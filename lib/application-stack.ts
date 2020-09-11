import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import {Construct, Fn} from "@aws-cdk/core";
import {Vpc} from "@aws-cdk/aws-ec2";

function getVpc(scope: Construct, vpcName?: string) {
  const vpc = vpcName ?? 'Default';
  return Vpc.fromVpcAttributes(scope, 'DefaultVpc', {
    vpcId: Fn.importValue(`Platform:Vpc:${vpc}:VpcId`),
    // TODO: this will only work if there is a subnet in each AZ within the region
    availabilityZones: Fn.getAzs(),
    privateSubnetIds: Fn.split(',', Fn.importValue(`Platform:Vpc:${vpc}:PrivateSubnetIds`)),
    privateSubnetRouteTableIds: Fn.split(',', Fn.importValue(`Platform:Vpc:${vpc}:PrivateSubnetRouteTableIds`)),
    publicSubnetIds: Fn.split(',', Fn.importValue(`Platform:Vpc:${vpc}:PublicSubnetIds`)),
    publicSubnetRouteTableIds: Fn.split(',', Fn.importValue(`Platform:Vpc:${vpc}:PublicSubnetRouteTableIds`)),
  });
}

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
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
      cluster,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      },
      desiredCount: props?.count,
      assignPublicIp: false
    });
  }
}