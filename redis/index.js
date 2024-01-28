const redis = require('redis');
const { REDIS_HOST, REDIS_PORT } = require('../config');

const client = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    }
});
client.connect().catch(console.error);

const pubsub = client.duplicate(); 
pubsub.connect().catch(console.error);

module.exports = {
    client,
    pubsub
};