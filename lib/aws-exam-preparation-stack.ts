import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'node:path';

export class AwsExamPreparationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const songTable = new Table(this, 'SongTable', {
            partitionKey: {
                name: 'PK',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'SK',
                type: AttributeType.STRING
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
        });

        songTable.addGlobalSecondaryIndex({
            indexName: 'Arist-Index',
            partitionKey: {
                name: 'artist',
                type: AttributeType.STRING,
            }
        });

        const coverPhotoBucket = new Bucket(this, 'CoverPhotoBucket');

        const topic = new Topic(this, 'BoykoTopic');

        const subscription = new Subscription(this, 'BoykoSubscription', {
            protocol: SubscriptionProtocol.EMAIL,
            endpoint: 'yavorpetrakiev@gmail.com',
            topic
        })

        const addSongLambdaFunction = new NodejsFunction(this, 'AddSongLambdaFunction', {
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            entry: path.join(__dirname, '/../src/addSongHandler.ts'),
            environment: {
                TABLE_NAME: songTable.tableName
            }
        });

        songTable.grantWriteData(addSongLambdaFunction);

        const playSongLambdaFunction = new NodejsFunction(this, 'PlaySongLambdaFunction', {
            handler: 'handler',
            runtime: Runtime.NODEJS_22_X,
            entry: path.join(__dirname, '/../src/playSongHandler.ts'),
            environment: {

            }
        });

        playSongLambdaFunction.addPermission('AllowEventBridgeRuleInvoke', {
            principal: new ServicePrincipal('events.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:events:${this.region}:${this.account}:rule/*`
        })

        const api = new RestApi(this, 'AddSongApi');
        const resource = api.root.addResource('song');
        resource.addMethod('POST', new LambdaIntegration(addSongLambdaFunction, {
            proxy: true,
        }));
    }
}
