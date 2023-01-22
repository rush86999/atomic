import {
  Handler,
  S3Event,
} from 'aws-lambda'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

import sharp from 'sharp'
import { Readable } from 'stream'

const COMPRESSEDBUCKET = process.env.COMPRESSED_BUCKET
const COMPRESSEDBUCKETPROFILE = process.env.COMPRESSED_BUCKET_PROFILE
const UNCOMPRESSEDBUCKET = process.env.UNCOMPRESSED_BUCKET
const UNCOMPRESSEDBUCKETPROFILE = process.env.UNCOMPRESSED_BUCKET_PROFILE





const streamToBuffer = (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  })


export const compressImage: Handler = async (event: S3Event) => {
  try {

    const client = new S3Client({ region: 'us-east-1' })

    const { key } = event.Records[0].s3.object



    const originalImage = await client.send(new GetObjectCommand({
      Key: decodeURIComponent(key),
      Bucket: UNCOMPRESSEDBUCKET,
    }))

    const bodyContents = await streamToBuffer(originalImage.Body as Readable)

    const type = key.split('.')[key.split('.').length - 1]

    const compressedImageBuffer = await sharp(bodyContents)
      .resize({
        width: 1200,
        height: 675,
        fit: 'cover',
      })
      .webp()
      .toBuffer()


    ' input values for PutObjectCommand')

    await client.send(new PutObjectCommand({
      Key: decodeURIComponent(`${key.split('.')[0]}.webp`),
      Bucket: COMPRESSEDBUCKET,
      Body: compressedImageBuffer,
      ContentType: `image/webp`
    }))



    return client.send(new DeleteObjectCommand({
      Key: decodeURIComponent(key),
      Bucket: UNCOMPRESSEDBUCKET,
    }))

  } catch (e) {

  }
}

export const compressImageProfile: Handler = async (event: S3Event) => {
  try {

    const client = new S3Client({ region: 'us-east-1' })

    const { key } = event.Records[0].s3.object



    const originalImage = await client.send(new GetObjectCommand({
      Key: decodeURIComponent(key),
      Bucket: UNCOMPRESSEDBUCKETPROFILE,
    }))

    const bodyContents = await streamToBuffer(originalImage.Body as Readable)

    const type = key.split('.')[key.split('.').length - 1]

    const sharpObject = sharp(bodyContents)

    sharpObject.on('error', (e) => {

    })

    const compressedImageBuffer = await sharpObject
      .resize({
        width: 1200,
        height: 675,
        fit: 'cover',
      })
      .webp()
      .toBuffer()


    ' input values for PutObjectCommand')

    await client.send(new PutObjectCommand({
      Key: decodeURIComponent(`${key.split('.')[0]}.webp`),
      Bucket: COMPRESSEDBUCKETPROFILE,
      Body: compressedImageBuffer,
      ContentType: `image/webp`
    }))



    return client.send(new DeleteObjectCommand({
      Key: decodeURIComponent(key),
      Bucket: UNCOMPRESSEDBUCKETPROFILE,
    }))

  } catch (e) {

  }
}
