import Redis, { RedisOptions } from 'ioredis';

let redisClient: Redis | null = null;

export const initRedis = (options?: RedisOptions): Redis => {
  if (!redisClient) {
    const defaultOptions: RedisOptions = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    };
    redisClient = new Redis(options || defaultOptions);
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Connected to Redis successfully');
    });
  }
  
  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

export const clearCache = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
};

export default Redis;
