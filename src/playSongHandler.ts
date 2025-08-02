import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { EventBridgeEvent } from "aws-lambda";

const snsClient = new SNSClient({});
const ddb = new DynamoDBClient();

export const handler = async (event: EventBridgeEvent<string, string>) => {
    console.log(JSON.stringify(event));
    const tableName = process.env.TABLE_NAME!;
    const topicArn = process.env.TOPIC_ARN!;

    const { artist, song, songUuid } = event;


    await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: 'Play song',
        Message: `It's time to play ${song} by ${artist}`,
    }));

    await ddb.send(new UpdateItemCommand({
        TableName: tableName,
        Key: {
            PK: {
                S: `SONG#${songUuid}`
            },
            SK: {
                S: `METADATA#${songUuid}`
            }
        },
        UpdateExpression: 'SET #s = :played',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { 
            ':played': {
                S: 'played'
            }
        }
    }))

    return {

    }
}