const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const Ffmpeg = require("fluent-ffmpeg");
const fs = require("node:fs/promises");
const fsold = require("node:fs");
const path = require("node:path");

const RESOLUTIONS = [
  { name: "360", width: 480, height: 360 },
  { name: "480", width: 858, height: 480 },
  { name: "720", width: 1280, height: 720 },
];

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY",
    secretAccessKey: "YOUR_SECRET",
  },
});
async function init() {
  //download original video
  const BUCKET = process.env.BUCKET_NAME;
  const KEY = process.env.KEY;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: KEY });

  const result = await s3Client.send(command);
  const originalFile = `original-video.mp4`;
  await fs.writeFile(originalFile, result.Body);

  const originalvideopath = path.resolve(originalFile);

  //start the transcoder

  const promises = RESOLUTIONS.map((resolution) => {
    const output = `${resolution.name}.mp4`;
    return new Promise((resolve) => {
      Ffmpeg(originalvideopath)
        .output(output)
        .withVideoCodec("libx264")
        .withAudioCodec("aac")
        .withSize(`${resolution.width}x${resolution.height}`)
        .on("end", async () => {
          const putCommand = new PutObjectCommand({
            Bucket: "production-encoded-videos",
            Key: output,
            Body: fsold.createReadStream(path.resolve(output)),
          });

          await s3Client.send(putCommand);
          console.log(`uploaded ${output}`);
          resolve();
        })
        .format("mp4")
        .run();
    });
  });

  await Promise.all(promises);
}
init().finally(() => {
  process.exit(0);
});
//upload the video
