import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { env } from 'src/config';

const BUCKET_NAME = env.aws.bucketName;
const REGION = env.aws.region;

@Injectable()
export class UploadService {
  constructor(private readonly s3Client: S3Client) {}

  async uploadFile(file: Express.Multer.File): Promise<string | false> {
    try {
      const key = `${Date.now()}-${file.originalname}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
      return url;
    } catch (err) {
      console.error('S3 upload error:', err);
      return false;
    }
  }
}
