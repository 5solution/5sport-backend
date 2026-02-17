import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config';

const credentials = {
  accessKeyId: env.aws.accessKey,
  secretAccessKey: env.aws.secretKey,
};

const region = env.aws.region;
export const s3ClientProvider = {
  provide: S3Client,
  useValue: new S3Client({ region, credentials }),
};
