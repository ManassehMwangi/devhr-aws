import { CfnOutput, Construct, Stage, StageProps } from "@aws-cdk/core";
import { DevhrAwsStack } from "./devhr-aws-stack";

/**
 * Deployable unit of awsdevhour-backend app
 * */
export class AwsdevhourBackendPipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    
    new DevhrAwsStack(this, 'AwsdevhourBackendStack-dev');
    
  }
}
