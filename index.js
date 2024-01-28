const express = require('express');
const cors = require('cors');
const http = require('http');
const { validationResult, checkSchema } = require('express-validator');
const { Server } = require('socket.io');
const { ALLOWED_ORIGINS } = require('./config');
const { APPLICATION_STATE } = require('./constants');
const { pubsub } = require('./redis');
const { genSampleData, saveUserApplyRequests, readUserApplyRequests,
    updateApplyStatus } = require('./store');
const { enqueueProcessingJob } = require('./queue');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    credentials: true,
    origin: ALLOWED_ORIGINS
}));

app.use(express.json());

app.use('*', async (req, res, next) => {
    const userId = req.headers?.authorization?.split(' ')?.[1];
    req.userId = userId;
    next();
});

const snsTypeValidator = (type) => {
    if (!type) {
        throw Error('sns type error');
    }
    return type === 'TWITTER' || type === 'INSTAGRAM';
}

app.post('/anonymous/sign_in/', async (req, res) => {
    let userId = req.body.userId;
    if (!userId) {
        userId = new Date().getTime();
    }
    res.status(201).json({ userId });
});

app.post('/streaming/apply_host/',
    checkSchema({
        artist_id: { isNumeric: true },
        sns: { isArray: true, notEmpty: true },
        "sns.*.type": {
            isString: true,
            custom: {
                options: snsTypeValidator
            }
        },
        "sns.*.content": { isString: true },
        introduction: { isString: true },
        email: { isEmail: true }
    }, ['body']),
    async (req, res) => {
        const result = validationResult(req);
        if (result?.errors?.length) {
            return res.status(400).end();
        }
        const userId = req.userId;
        console.log(`/streaming/apply_host/ userId:${userId}`);

        const applyRequest = genSampleData({ userId, status: APPLICATION_STATE.QUEUED });
        await saveUserApplyRequests(userId, applyRequest);
        await enqueueProcessingJob({ requestId: applyRequest.id, userId });
        await updateApplyStatus(applyRequest.id, APPLICATION_STATE.QUEUED);

        res.status(201).json({
            result: true,
            message: "Your Application is requested successfully.",
            code: "201",
            external_data: { ...applyRequest, status: APPLICATION_STATE.QUEUED },
            status: APPLICATION_STATE.QUEUED
        });
    });

app.get('/streaming/list_host_apply_status/:page/:size',
    checkSchema({
        page: { isNumeric: true },
        size: { isNumeric: true }
    }, ['params']),
    async (req, res) => {
        const result = validationResult(req);
        if (result?.errors?.length) {
            return res.status(503).json({
                result: false,
                message: "A problem is occurred. Please try again later",
                code: "503"
            });
        }
        const userId = req.userId;
        const applyRequests = await readUserApplyRequests(userId);
        res.status(200).json({
            result: true,
            message: "OK",
            code: "200",
            external_data: {
                request_list: applyRequests
            }
        });
    }
);

app.patch('/streaming/cancel_host_apply/',
    checkSchema({
        request_id: { isNumeric: true }
    }, ['body']),
    async (req, res) => {
        try {
            /**
             *  -> Before (application)job handler commits the application, finally check inmemory db status
             *  -> if it is canceled, then rollback
             *  -> else commit
             *  -> send (optimistic) success response
             */
            await updateApplyStatus(req.body.request_id, APPLICATION_STATE.CANCELED);
            return res.status(200).json({
                result: true,
                message: "Your Application is cancelled.",
                code: ""
            })
        } catch (e) {
            return res.status(503).json({
                result: false,
                message: "A problem is occurred. Please try again later",
                code: "503"
            });
        }
    });

server.listen(PORT, () => {
    const { address, port } = server.address();
    console.log(`App listening at ${address}:${port}`);
});

io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
        return next(new Error("invalid userId"));
    }
    socket.userId = userId;
    next();
});

io.on("connection", (socket) => {
    console.log(`[${socket.userId}] connected`);
    socket.join(socket.userId);

    socket.on("sendNotification", ({ userId, requestId, status }) => {
        io.to(userId).emit("getNotification", { requestId, status });
    });

    socket.on("disconnect", () => {
        console.log("disconnected");
    });
});

// CloudFunction -> REDIS Pubsub -> API(WebSocket) Server
pubsub.subscribe("sendNotification", (message) => {
    const { userId, requestId, status } = JSON.parse(message);
    io.to(userId).emit("getNotification", { requestId, status });
})