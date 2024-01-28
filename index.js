const express = require('express');
const cors = require('cors');
const http = require('http');
const { validationResult, checkSchema } = require('express-validator');
const { Server } = require('socket.io');
const { ALLOWED_ORIGINS } = require('./config');
const { APPLICATION_STATE } = require('./constants');
const redis = require('./redis');

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

const snsTypeValidator = (type) => {
    if (!type) {
        throw Error('sns type error');
    }
    return type === 'TWITTER' || type === 'INSTAGRAM';
}
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
        const requestId = new Date().getTime();
        res.status(201).json({
            result: true,
            message: "Your Application is requested successfully.",
            code: "201",
            external_data: {
                id: requestId,
                before_level: APPLICATION_STATE.PENDING,
                after_level: APPLICATION_STATE.IN_REVIEW,
                member: {
                    id: 1234,
                    level: 0,
                    profile_image: {
                        id: 2345,
                        filename: "myprofile.png",
                        thumb_url: "https://storeage.makestar.com/myprofile.thumb.png",
                        mime: 'PNG'
                    },
                    nickname: "닉네임",
                    user: {
                        id: 3456,
                        email: "sample@makestar.com",
                        is_active: true
                    },
                    fandom: {
                        id: 456,
                        title: "ATINY",
                        image: {
                            id: 2345,
                            filename: "ATINY_logo.png",
                            thumb_url: "https://storeage.makestar.com/ATINY_logo.thumb.png",
                            mime: 'PNG'
                        },
                        artist: {
                            id: 123,
                            name: "BTS",
                            image: {
                                id: 123,
                                filename: "/images/123.svg",
                                thumb_url: "https://storeage.makestar.com/ATEEZ_main.thumb.png",
                                mime: 'PNG'
                            }
                        }
                    }
                },
            },
            status: APPLICATION_STATE.IN_REVIEW
        });
        await redis.set("" + requestId, APPLICATION_STATE.IN_REVIEW);

        setTimeout(() => {
            redis.set("" + requestId, APPLICATION_STATE.QUEUED).catch(console.error);
            const socketId = requests?.[requestId];
            if (socketId) {
                io.to(socketId).emit("getNotification", { status: APPLICATION_STATE.QUEUED });
            }
        }, 5000);
        setTimeout(() => {
            redis.set("" + requestId, APPLICATION_STATE.APPROVAL).catch(console.error);
            const socketId = requests?.[requestId];
            if (socketId) {
                io.to(socketId).emit("getNotification", { status: APPLICATION_STATE.APPROVAL });
            }
        }, 10000);
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
        res.status(200).json({
            result: true,
            message: "OK",
            code: "200",
            external_data: {
                request_list: [
                    {
                        id: new Date().getTime(),
                        before_level: APPLICATION_STATE.PENDING,
                        after_level: APPLICATION_STATE.IN_REVIEW,
                        member: {
                            id: 1234,
                            level: 0,
                            profile_image: {
                                id: 2345,
                                filename: "myprofile.png",
                                thumb_url: "https://storeage.makestar.com/myprofile.thumb.png",
                                mime: 'PNG'
                            },
                            nickname: "닉네임",
                            user: {
                                id: 3456,
                                email: "sample@makestar.com",
                                is_active: true
                            },
                            fandom: {
                                id: 456,
                                title: "ATINY",
                                image: {
                                    id: 2345,
                                    filename: "ATINY_logo.png",
                                    thumb_url: "https://storeage.makestar.com/ATINY_logo.thumb.png",
                                    mime: 'PNG'
                                },
                                artist: {
                                    id: 123,
                                    name: "BTS",
                                    image: {
                                        id: 123,
                                        filename: "/images/123.svg",
                                        thumb_url: "https://storeage.makestar.com/ATEEZ_main.thumb.png",
                                        mime: 'PNG'
                                    }
                                }
                            }
                        },
                        status: APPLICATION_STATE.IN_REVIEW
                    }
                ]
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
             * TODO
             * 1. If application job is in landing queue(not handled yet)
             *  -> pop from the queue
             *  -> send success response
             * 
             * 2. Else the job is already in process
             *  -> enqueue cancel job (update inmemory db)
             *     -> Before (application)job handler commits the application, finally check inmemory db status
             *     -> if it is canceled, then rollback
             *     -> else commit
             *  -> send (optimistic) success response
             */
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

let requests = [];

io.use((socket, next) => {
    const requestId = socket.handshake.auth.requestId;
    if (!requestId) {
        return next(new Error("invalid requestId"));
    }
    socket.requestId = requestId;
    next();
});

io.on("connection", (socket) => {
    requests[socket.requestId] = socket.id;
    console.log(`[${socket.requestId}] connected`);

    socket.on("sendNotification", ({ requestId, status }) => {
        const socketId = requests[requestId];
        if (socketId) {
            io.to(socketId).emit("getNotification", { status });
        }
    });

    socket.on("disconnect", () => {
        console.log("disconnected");
    });
});
