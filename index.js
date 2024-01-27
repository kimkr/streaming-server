const express = require('express');
const cors = require('cors');
const { validationResult, checkSchema } = require('express-validator');
const { ALLOWED_ORIGINS } = require('./config');
const { APPLICATION_STATE } = require('./constants');

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
        res.status(201).json({
            result: true,
            message: "Your Application is requested successfully.",
            code: "201",
            external_data: {
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
            },
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
        })

    }
);

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});