const { client: redis } = require('../redis');
const { genSampleData } = require('./mock');

const APPLY_REQS = 'apply_reqs';
const APPLY_REQ = 'apply_req';

const saveUserApplyRequests = async (userId, applyRequest) => {
    const key = `user/${userId}/${APPLY_REQS}`;
    await redis.sAdd(key, JSON.stringify(applyRequest));
}

const readUserApplyRequests = async (userId) => {
    const key = `user/${userId}/${APPLY_REQS}`;
    const requests = await redis.sMembers(key);
    const parsedRequests = requests.map(item => JSON.parse(item));
    const requestStatus = await Promise.all(parsedRequests.map(item => item.id).map(id => redis.get(`${APPLY_REQ}/${id}`)));
    return parsedRequests.map((item, idx) => ({
        ...item,
        status: requestStatus?.[idx] ? parseInt(requestStatus[idx]) : null
    })).filter(item => item.status !== null);
}

const updateApplyStatus = async (requestId, status) => {
    const key = `${APPLY_REQ}/${requestId}`;
    await redis.set(key, status);
}

module.exports = {
    saveUserApplyRequests,
    readUserApplyRequests,
    updateApplyStatus,
    genSampleData
}