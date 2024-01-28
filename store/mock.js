const { APPLICATION_STATE } = require('../constants');

const genSampleData = ({
    userId,
    requestId,
    beforeLevel,
    afterLevel,
    status
}) => {
    userId = userId ?? new Date().getTime();
    requestId = requestId ?? new Date().getTime();
    beforeLevel = beforeLevel ?? APPLICATION_STATE.PENDING;
    afterLevel = afterLevel ?? APPLICATION_STATE.IN_REVIEW;
    status = status ?? APPLICATION_STATE.IN_REVIEW;
    return {
        id: requestId,
        before_level: beforeLevel,
        after_level: afterLevel,
        member: {
            id: userId,
            level: 0,
            profile_image: {
                id: 2345,
                filename: "myprofile.png",
                thumb_url: "https://storeage.makestar.com/myprofile.thumb.png",
                mime: 'PNG'
            },
            nickname: "닉네임",
            user: {
                id: userId,
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
        status
    }
}

module.exports = {
    genSampleData
}