const { PubSub } = require('@google-cloud/pubsub');
const { PROJECT_ID } = require('../config');

const PROCESS_APPLY_TOPIC = "process-apply";

const pubSubClient = new PubSub({ projectId: PROJECT_ID });

const publishMessage = async (topic, data) => {
    const dataBuffer = Buffer.from(JSON.stringify(data));
    try {
        const messageId = await pubSubClient
            .topic(topic)
            .publishMessage({ data: dataBuffer });
        console.log(`Message ${messageId} published.`);
    } catch (error) {
        console.error(`Received error while publishing: ${error.message}`);
    }
}

const enqueueProcessingJob = async (data) => publishMessage(PROCESS_APPLY_TOPIC, data);


module.exports = {
    publishMessage,
    enqueueProcessingJob
}