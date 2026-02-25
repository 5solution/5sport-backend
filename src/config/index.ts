import { S3 } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('production', 'development', 'test', 'local', 'staging')
      .required(),
    NETWORK: Joi.string().valid('mainnet', 'testnet').required(),
    PORT: Joi.number().default(3000),
    POSTGRES_URL: Joi.string().required(),
    REDIS_URL: Joi.string().required(),
    TELEGRAM_BOT_TOKEN: Joi.string().required(),

    VNPAY_TMN_CODE: Joi.string().required(),
    VNPAY_HASH_SECRET_KEY: Joi.string().required(),

    PAYX_MERCHANT_CODE: Joi.string().required(),
    PAYX_SECRET_KEY: Joi.string().required(),
    PAYX_API_URL: Joi.string().required(),

    AWS_ACCESS_KEY: Joi.string().required(),
    AWS_SECRET_KEY: Joi.string().required(),
    AWS_REGION: Joi.string().required(),

    S3_BUCKET_NAME: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error != null) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  postgres: {
    url: envVars.POSTGRES_URL,
    testUrl: envVars.POSTGRES_URL + '_test',
    testDbName: 'test',
  },
  redisUrl: envVars.REDIS_URL,
  telegramBotToken: envVars.TELEGRAM_BOT_TOKEN,
  vnpay: {
    tmnCode: envVars.VNPAY_TMN_CODE,
    hashSecretKey: envVars.VNPAY_HASH_SECRET_KEY,
  },
  payx: {
    merchantCode: envVars.PAYX_MERCHANT_CODE,
    secretKey: envVars.PAYX_SECRET_KEY,
    apiUrl: envVars.PAYX_API_URL,
  },
  aws: {
    accessKey: envVars.AWS_ACCESS_KEY,
    secretKey: envVars.AWS_SECRET_KEY,
    region: envVars.AWS_REGION,
    bucketName: envVars.S3_BUCKET_NAME,
  },
};

console.log('Configuration loaded successfully:', {
  env: env.env,
  telegramBotToken: env.telegramBotToken ? '***' : null,
});
