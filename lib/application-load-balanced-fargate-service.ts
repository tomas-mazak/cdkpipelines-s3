import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import {SubnetType, Vpc} from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import {Construct, Fn} from "@aws-cdk/core";

function cap(s: string): string {
  return s[0].toUpperCase() + s.substr(1)
}

export function getVpc(scope: Construct, vpcName?: string) {
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

export interface ApplicationLoadBalancedFargateServiceProps {
  readonly tla: string,
  readonly dependecyManifest?: string,
  readonly vpc?: ec2.IVpc,
  readonly ecsCluster?: ecs.ICluster,
  readonly registryCredentials?: secretsmanager.ISecret,
  readonly memoryLimit?: number,
  readonly cpu?: number,
  readonly count?: number,
  readonly port?: number,
  readonly containerPort?: number,
  readonly healthcheckUri?: string,
}

export class ApplicationLoadBalancedFargateService extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ApplicationLoadBalancedFargateServiceProps) {
    super(scope, id);

    const deployEnvironment = cdk.Stage.of(scope)?.node.id ?? 'dev'

    // Lookup the default VPC
    const vpc = props.vpc ?? getVpc(this);

    // ECS cluster
    const cluster = props.ecsCluster ?? new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `${cap(props.tla)}${cap(deployEnvironment)}Cluster`,
      vpc: vpc,
    });

    // Container registry credentials
    // TODO: "gpr-credentials" is probably not the greatest name for the default credentials
    const registryCredentials = props.registryCredentials ?? secretsmanager.Secret.fromSecretAttributes(this, 'RegistrySecret', {
      secretArn: cdk.Fn.importValue("Ca:GprCredentialsSecretArn")
    })

    // ECS task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');

    const container = taskDefinition.addContainer('main', {
      image: ecs.ContainerImage.fromRegistry('docker.pkg.github.com/flutter-global/kubster/kubster:latest', {
        credentials: registryCredentials
      }),
      memoryLimitMiB: props.memoryLimit ?? 256,
      cpu: props.cpu ?? 256
    });

    container.addPortMappings({
      containerPort: props.containerPort ?? 8080,
      hostPort: props.containerPort ?? 8080,
      protocol: ecs.Protocol.TCP
    });

    // ECS service
    const service = new ecs.FargateService(this, 'FargateService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: props.count ?? 1,
      vpcSubnets: {subnetType: SubnetType.PRIVATE}
    });

    // Application Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: false
    });
    const listener = lb.addListener('PublicListener', { port: 80, open: true });

    listener.addTargets('ECS', {
      port: props.port ?? 80,
      targets: [service.loadBalancerTarget({
        containerName: 'main',
        containerPort: props.containerPort ?? 8080,

      })],
      // include health check (default is none)
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        path: props.healthcheckUri ?? "/live",
        timeout: cdk.Duration.seconds(5),
      },
      deregistrationDelay: cdk.Duration.seconds(20)
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName, });
  }
}