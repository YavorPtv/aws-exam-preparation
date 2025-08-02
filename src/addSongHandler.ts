import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { CreateScheduleCommand, SchedulerClient } from "@aws-sdk/client-scheduler";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import * as uuid from 'uuid';

const ddb = new DynamoDBClient();

const schedulerClient = new SchedulerClient();

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(JSON.stringify(event));

    const tableName = process.env.TABLE_NAME!;
    const { title, artist, playAt, coverImage, status } = JSON.parse(event.body!);

    const songUuid = uuid.v4();
    
    await ddb.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            PK: {
                S: `SONG#${songUuid}`
            },
            SK: {
                S: `METADATA#${songUuid}`
            },
            title: {
                S: title
            },
            artist: {
                S: artist
            },
            coverImage: {
                S: coverImage
            },
            status: {
                S: status
            },
            playAt: {
                S: playAt
            }
        }
    }));

    const isoTime = new Date(playAt).toISOString();

    const result = await schedulerClient.send(new CreateScheduleCommand({
        Name: `Play-${title}`,
        ScheduleExpression: `at(${isoTime})`,
        Target: {
            Arn: '',
            Input: JSON.stringify({ songUuid, artist, title }),
            RoleArn: ''
        },
        FlexibleTimeWindow: {
            Mode: "OFF"
        }
    }));

    console.log(result);
    
    return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: {},
    }
}