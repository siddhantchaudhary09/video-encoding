import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { S3Event } from "aws-lambda";
const client = new SQSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "your-access-key",
    secretAccessKey: "your-secret-access-key",
  },
});

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "your-access-key",
    secretAccessKey: "your-secret-access-key",
  },
});

async function init() {
  const command = new ReceiveMessageCommand({
    QueueUrl:
      "https://sqs.ap-south-1.amazonaws.com/010526240339/temprawvideoqueue-sid",
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  });
  while (true) {
    const { Messages } = await client.send(command);
    if (!Messages) {
      console.log("No messages found");
      continue;
    }
    try {
      for (const message of Messages) {
        const { MessageId, Body } = message;
        console.log(`Message Recieved`, { MessageId, Body });
        if (!Body) {
          console.log("No Body found");
          continue;
        }

        //validata event
        const event = JSON.parse(Body) as S3Event;

        if ("Service" in event && "Event" in event) {
          if (event.Event === "s3:TestEvent") {
            await client.send(
              new DeleteMessageCommand({
                QueueUrl:
                  "https://sqs.ap-south-1.amazonaws.com/010526240339/temprawvideoqueue-sid",
                ReceiptHandle: message.ReceiptHandle,
              })
            );
            continue;
          }
        }

        for (const record of event.Records) {
          const { s3 } = record;
          const {
            bucket,
            object: { key },
          } = s3;
          //spin docker
          const runTaskCommand = new RunTaskCommand({
            taskDefinition:
              "arn:aws:ecs:ap-south-1:010526240339:task-definition/video-transcoder:1",
            cluster:
              "arn:aws:ecs:ap-south-1:010526240339:cluster/sid-docker-cluster2",
            launchType: "FARGATE",
            networkConfiguration: {
              awsvpcConfiguration: {
                subnets: [
                  "subnet-063142973c86e8ff1",
                  "subnet-00b617491811af3ff",
                ],
                securityGroups: ["sg-047a20a8b1576eabb"],
                assignPublicIp: "ENABLED",
              },
            },
            overrides: {
              containerOverrides: [
                {
                  name: "sid-transcoder",
                  environment: [
                    {
                      name: "BUCKET_NAME",
                      value: bucket.name,
                    },
                    {
                      name: "KEY",
                      value: key,
                    },
                  ],
                },
              ],
            },
          });
          await ecsClient.send(runTaskCommand);

          await client.send(
            new DeleteMessageCommand({
              QueueUrl:
                "https://sqs.ap-south-1.amazonaws.com/010526240339/temprawvideoqueue-sid",
              ReceiptHandle: message.ReceiptHandle,
            })
          );
        }

        // delete message
      }
    } catch (error) {
      console.error("Error processing message", error);
    }
  }
}
init();
