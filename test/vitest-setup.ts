// Set fallback env vars before any module is loaded.
// This prevents tests from depending on a real .env file.
const setIfAbsent = (key: string, value: string) => {
  if (!process.env[key]) process.env[key] = value;
};

setIfAbsent('NODE_ENV', 'test');
setIfAbsent('NETWORK', 'testnet');
setIfAbsent('PORT', '3000');
setIfAbsent('POSTGRES_URL', 'postgres://test:test@localhost:5432/test');
setIfAbsent('REDIS_URL', 'redis://localhost:6379');
setIfAbsent('TELEGRAM_BOT_TOKEN', 'test_bot_token');
setIfAbsent('VNPAY_TMN_CODE', 'test_tmn_code');
setIfAbsent('VNPAY_HASH_SECRET_KEY', 'test_hash_secret');
setIfAbsent('PAYX_MERCHANT_CODE', 'test_merchant_code');
setIfAbsent('PAYX_SECRET_KEY', 'test_payx_secret');
setIfAbsent('PAYX_API_URL', 'https://test.payx.com');
setIfAbsent('AWS_ACCESS_KEY', 'test_access_key');
setIfAbsent('AWS_SECRET_KEY', 'test_secret_key');
setIfAbsent('AWS_REGION', 'us-east-1');
setIfAbsent('S3_BUCKET_NAME', 'test-bucket');
