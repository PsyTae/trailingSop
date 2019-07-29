const dotenv = require('dotenv');
const envResult = dotenv.config();
if (envResult.error) throw envResult.error;

const https = require('https');
const mongoose = require('mongoose');

const stopLossModel = require('../models/stopLoss');

const mongoDb = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;

mongoose.connect(mongoDb, { useNewUrlParser: true });

const getStockListByKeyword = (keyword, callback) => {
    const options = {
        hostname: `www.alphavantage.co`,
        port: 443,
        path: `/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${process.env.ALPHA_KEY}`
    };

    console.dir(options, { depth: null, colors: true });

    https
        .get(options, alphaRes => {
            const { statusCode } = alphaRes;
            const contentType = alphaRes.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
            }
            if (error) {
                // Consume response data to free up memory
                alphaRes.resume();
                return callback(error);
            }

            alphaRes.setEncoding('utf8');
            let rawData = '';
            alphaRes.on('data', chunk => {
                rawData += chunk;
            });
            alphaRes.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    return callback(null, parsedData);
                } catch (e) {
                    return callback(e);
                }
            });
        })
        .on('error', e => {
            callback(e);
        });
};

const getStockIntraDay = (symbol, callback) => {
    const options = {
        hostname: `www.alphavantage.co`,
        port: 443,
        path: `/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&outputsize=compact&apikey=${process.env.ALPHA_KEY}`
    };

    console.dir(options, { depth: null, colors: true });

    https
        .get(options, alphaRes => {
            const { statusCode } = alphaRes;
            const contentType = alphaRes.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
            }
            if (error) {
                // Consume response data to free up memory
                alphaRes.resume();
                return callback(error);
            }

            alphaRes.setEncoding('utf8');
            let rawData = '';
            alphaRes.on('data', chunk => {
                rawData += chunk;
            });
            alphaRes.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    return callback(null, parsedData);
                } catch (e) {
                    return callback(e);
                }
            });
        })
        .on('error', e => {
            callback(e);
        });
};

const findAllStopLosses = callback => {
    stopLossModel.find({}).exec(callback);
};

const insertOnDuplicateKeyUpdate = (obj, callback) => {
    stopLossModel
        .findOneAndUpdate(
            {
                symbol: obj.symbol,
                notify: obj.notify
            },
            {
                symbol: obj.symbol,
                stopLossPercent: obj.stopLossPercent,
                notify: obj.notify,
                maxPrice: obj.buyPrice || 0.0
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        )
        .exec(callback);
};

/**
 *
 * @param {Object} obj
 * @param {callback} callback
 */
const findAndDelete = (obj, callback) => {
    stopLossModel
        .findOneAndDelete({
            symbol: obj.symbol,
            notify: obj.notify
        })
        .exec(callback);
};

module.exports = {
    getStockListByKeyword,
    getStockIntraDay,
    findAllStopLosses,
    insertOnDuplicateKeyUpdate,
    findAndDelete
};
