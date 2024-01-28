const API_URL =process.env.API_URL;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

module.exports = {
    API_URL,
    REDIS_HOST,
    REDIS_PORT
}