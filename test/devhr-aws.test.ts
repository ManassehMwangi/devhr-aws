// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as DevhrAws from '../lib/devhr-aws-stack';
import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Awsdevhour from '../lib/devhr-aws-stack';


test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Awsdevhour.DevhrAwsStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

// example test. To run these tests, uncomment this file along with the
// example resource in lib/devhr-aws-stack.ts
// test('SQS Queue Created', () => {
// //   const app = new cdk.App();
// //     // WHEN
// //   const stack = new DevhrAws.DevhrAwsStack(app, 'MyTestStack');
// //     // THEN
// //   const template = Template.fromStack(stack);

// //   template.hasResourceProperties('AWS::SQS::Queue', {
// //     VisibilityTimeout: 300
// //   });
// });
