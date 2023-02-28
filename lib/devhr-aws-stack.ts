// import * as cdk from 'aws-cdk-lib';

import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');
import cognito = require('@aws-cdk/aws-cognito');
import { AuthorizationType, PassthroughBehavior } from '@aws-cdk/aws-apigateway';
import { CfnOutput } from "@aws-cdk/core";
import { Duration } from '@aws-cdk/core';
import apigw = require('@aws-cdk/aws-apigateway');
//import s3deploy = require('@aws-cdk/aws-s3-deployment');
import { HttpMethods } from '@aws-cdk/aws-s3';
import sqs = require('@aws-cdk/aws-sqs');
import s3n = require('@aws-cdk/aws-s3-notifications');

import { Construct } from 'constructs';
import { ContextProvider } from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const imageBucketName = "cdk-rekn-imgagebucket"
const resizedBucketName = imageBucketName + "-resized"
export class DevhrAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =====================================================================================
    // Image Bucket
    // =====================================================================================
    
    const imageBucket = new s3.Bucket(this, imageBucketName);
    new cdk.CfnOutput(this, 'imageBucket', { value: imageBucket.bucketName });
    

    // =====================================================================================
    // Thumbnail Bucket
    // =====================================================================================
    const resizedBucket = new s3.Bucket(this, resizedBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    new cdk.CfnOutput(this, 'resizedBucket', {value: resizedBucket.bucketName});
   
    // =====================================================================================
    // Amazon DynamoDB table for storing image labels
    // =====================================================================================
    const table = new dynamodb.Table(this, 'ImageLabels', {
      partitionKey: { name: 'image', type: dynamodb.AttributeType.STRING }
    });
    new cdk.CfnOutput(this, 'ddbTable', { value: table.tableName });

    
    // =====================================================================================
    // Building our AWS Lambda Function; compute for our serverless microservice
    // =====================================================================================
    const layer = new lambda.LayerVersion(this, 'pil', {
      code: lambda.Code.fromAsset('reklayer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_7],
      license: 'Apache-2.0',
      description: 'A layer to enable the PIL library in our Rekognition Lambda',
    });

    // =====================================================================================
    // Building our AWS Lambda Function; compute for our serverless microservice
    // =====================================================================================
    const rekFn = new lambda.Function(this, 'rekognitionFunction', {
      code: lambda.Code.fromAsset('rekognitionlambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      layers: [layer],
      environment: {
          "TABLE": table.tableName,
          "BUCKET": imageBucket.bucketName,
          "RESIZEDBUCKET": resizedBucket.bucketName
      },
    });
    rekFn.addEventSource(new event_sources.S3EventSource(imageBucket, {events: [s3.EventType.OBJECT_CREATED]}))
    imageBucket.grantRead(rekFn);
    resizedBucket.grantPut(rekFn);
    table.grantWriteData(rekFn);

    rekFn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rekognition:DetectLabels'],
      resources: ['*']
    }));
    
    const serviceFn = new lambda.Function(this, 'serviceFunction', {
      code: lambda.Code.fromAsset('servicelambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      environment: {
        "TABLE": table.tableName,
        "BUCKET": imageBucket.bucketName,
        "RESIZEDBUCKET": resizedBucket.bucketName
      },
    });
    imageBucket.grantWrite(serviceFn);
    resizedBucket.grantWrite(serviceFn);
    table.grantReadWriteData(serviceFn);
    
    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'DevhrAwsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
