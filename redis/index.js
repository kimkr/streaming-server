const redis = require('redis');
const { REDIS_HOST, REDIS_PORT } = require('../config');

const client = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    }
});

const pubsub = client.duplicate(); 
const pubClient = client.duplicate();
const subClient = client.duplicate();

client.connect().catch(console.error);
pubsub.connect().catch(console.error);

module.exports = {
    client,
    pubsub,
    pubClient,
    subClient
};