const functions = require('@google-cloud/functions-framework');
const redis = require('redis');
const { API_URL, REDIS_HOST, REDIS_PORT } = require('./config');
const { APPLICATION_STATE } = require('./constants');

const client = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    }
});
const publisher = client.duplicate();
client.connect().catch(console.error);
publisher.connect().catch(console.error);

const updateApplyStatus = async (userId, requestId, status) => {
    console.log("updateApplyStatus", userId, requestId, status);
    try {
        await client.set(`apply_req/${requestId}`, status);
        await publisher.publish("sendNotification", JSON.stringify({ userId, requestId, status }));
    } catch (e) {
        console.error(e);
    }
}

const checkCanceledThenCommit = async (userId, requestId) => {
    const nowStatus = await client.get(`apply_req/${requestId}`);
    if (nowStatus == APPLICATION_STATE.CANCELED) {
        // ROLL_BACK
    } else {
        const newStatus = (Math.random() * 10) > 5 ? APPLICATION_STATE.APPROVAL :
            APPLICATION_STATE.REJECTED;
        await updateApplyStatus(userId, requestId, newStatus);
    }
}

functions.cloudEvent('processApply', async (cloudEvent) => {
    const dataBuffer = cloudEvent.data.message.data;
    const data = Buffer.from(dataBuffer, 'base64').toString();
    const { requestId, userId } = JSON.parse(data);
    await updateApplyStatus(userId, requestId, APPLICATION_STATE.IN_REVIEW);
    // LONG RUNNING
    setTimeout(() => {
        checkCanceledThenCommit(userId, requestId).catch(console.error);
    }, 5000);
});