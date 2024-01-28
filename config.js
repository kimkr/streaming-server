
require('dotenv').config();

const ALLOWED_ORIGINS = JSON.parse(process.env.ALLOWED_ORIGINS);
const REDIS_HOST = process.env.REDISHOST || 'localhost';
const REDIS_PORT = process.env.REDISPORT || 6379;

module.exports = {
    ALLOWED_ORIGINS,
    REDIS_HOST,
    REDIS_PORT
}