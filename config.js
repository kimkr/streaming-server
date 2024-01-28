
require('dotenv').config();

const PROJECT_ID = process.env.PROJECT_ID;
const ALLOWED_ORIGINS = JSON.parse(process.env.ALLOWED_ORIGINS);
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

module.exports = {
    PROJECT_ID,
    ALLOWED_ORIGINS,
    REDIS_HOST,
    REDIS_PORT
}