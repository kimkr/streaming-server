const functions = require('@google-cloud/functions-framework');
const redis = require('redis');
const { API_URL, REDIS_HOST, REDIS_PORT } = require('./config');
const { APPLICATION_STATE } = require('./constants');
const { io } = require("socket.io-client");

const socket = io(API_URL);
socket.connect();

const client = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    }
});
client.connect().catch(console.error);

const updateApplyStatus = async (userId, requestId, status) => {
    await client.set(`apply_req/${requestId}`, status);
    socket.emit("sendNotification", { userId, requestId, status }, (val) => {
        console.log(`sendNotification ${val}`);
    });
}

functions.cloudEvent('processApply', async (cloudEvent) => {
    const dataBuffer = cloudEvent.data.message.data;
    const data = Buffer.from(dataBuffer, 'base64').toString();
    const { requestId, userId } = JSON.parse(data);
    console.log(`requestId:${requestId}, userId:${userId}`);
    await updateApplyStatus(userId, requestId, APPLICATION_STATE.IN_REVIEW);
    // LONG RUNNING
    setTimeout(() => {
        // CHECK WHETHER IT WAS CANCLED
        updateApplyStatus(userId, requestId, APPLICATION_STATE.APPROVAL)
            .catch(console.error)
            .finally(() => socket.disconnect());
    }, 5000);
});