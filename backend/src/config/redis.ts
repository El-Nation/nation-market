import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Redis Architecture Configuration
 * Responsible for caching, live rider geolocations, and socket sessions.
 */
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('Redis connected successfully.');
        }
    } catch(err) {
        console.error('Failed to connect to Redis', err);
    }
};
