const express = require('express');
const cors = require('cors');
const { validationResult, checkSchema } = require('express-validator');
const { ALLOWED_ORIGINS } = require('./config');
const { APPLICATION_STATE } = require('./constants');
const { genSampleData, saveUserApplyRequests, readUserApplyRequests } = require('./store');

const app = express();
app.use(cors({
    credentials: true,
    origin: ALLOWED_ORIGINS
}));
const port = 3000;

app.use(express.json());

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
        const applyRequest = genSampleData({ userId });
        await saveUserApplyRequests(userId, applyRequest);

        res.status(201).json({
            result: true,
            message: "Your Application is requested successfully.",
            code: "201",
            external_data: applyRequest,
            status: APPLICATION_STATE.IN_REVIEW
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

app.use(async (req, res, next) => {
    const userId = req.headers?.authorization?.split(' ')?.[1];
    req.userId = userId;
    next();
});

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});