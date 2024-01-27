
require('dotenv').config();

const ALLOWED_ORIGINS = JSON.parse(process.env.ALLOWED_ORIGINS);

module.exports = {
    ALLOWED_ORIGINS
}