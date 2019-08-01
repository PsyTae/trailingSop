const dotenv = require('dotenv');
const envResult = dotenv.config();
if (envResult.error) throw envResult.error;

const https = require('https');
const moment = require('moment');
const mongoose = require('mongoose');
const queryString = require('querystring');
const sched = require('node-schedule');

const stopLossModel = require('../models/stopLoss');

const mongoDb = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;

const stopLosses = {};

mongoose.connect(mongoDb, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true });

function StopLossClass(obj) {
    let id = obj._id;
    let symbol = obj.symbol;
    let notify = obj.notify;
    let hit = obj.hit;
    let requested = moment(obj.requested);
    let stopLossPercent = parseFloat(obj.stopLossPercent);
    let maxPrice = parseFloat(obj.maxPrice);
    let uniqueJob;
    let withinFive = false;
    let withinOne = false;

    // console.log('New', moment());
    // console.log('id:', id);
    // console.log('symbol:', symbol);
    // console.log('notify:', notify);
    // console.log('hit:', hit);
    // console.log('requested:', requested);
    // console.log('stopLossPercent:', stopLossPercent);
    // console.log('maxPrice:', maxPrice);

    this.updateStopLoss = obj => {
        // console.log('In Update Stop Loss');
        id = obj._id;
        symbol = obj.symbol;
        notify = obj.notify;
        hit = obj.hit;
        requested = moment(obj.requested);
        stopLossPercent = parseFloat(obj.stopLossPercent);
        if (parseFloat(obj.maxPrice) > maxPrice) {
            maxPrice = parseFloat(obj.maxPrice);
        }
    };

    const checkForMaxPriceRaiseOrStopLoss = () => {
        // console.log(moment());
        // console.log('id:', id);
        // console.log('symbol:', symbol);
        // console.log('notify:', notify);
        // console.log('hit:', hit);
        // console.log('requested:', requested);
        // console.log('stopLossPercent:', stopLossPercent);
        // console.log('maxPrice:', maxPrice);

        this.destroyInstance = () => {
            if (uniqueJob) {
                uniqueJob.cancel();
            }

            delete stopLosses[`${symbol}${notify}`];
        };

        getStockIntraDay(symbol, (err, result) => {
            if (err) return console.error(err);
            let lastIntraDay;

            // console.log(symbol);
            // console.log(result['Time Series (1min)']);
            if (!result['Time Series (1min)'] || !result['Time Series (1min)'][Object.keys(result['Time Series (1min)'])[0]]) {
                console.dir(result);
            } else {
                lastIntraDay = {
                    ...result['Time Series (1min)'][Object.keys(result['Time Series (1min)'])[0]],
                    '6. dt': Object.keys(result['Time Series (1min)'])[0]
                };
            }

            // if (parseFloat(stockData['Time Series (Daily)'][key]['2. high']) > maxPrice) {
            //     maxPrice = parseFloat(stockData['Time Series (Daily)'][key]['2. high']);
            // }
            // console.log(lastIntraDay['2. high'], '>', maxPrice, '=', lastIntraDay['2. high'] > maxPrice);
            // console.log(
            //     lastIntraDay['4. close'],
            //     '<',
            //     ((100 - stopLossPercent + 5) / 100) * maxPrice,
            //     '=',
            //     lastIntraDay['4. close'] < ((100 - stopLossPercent + 5) / 100) * maxPrice
            // );
            // console.log(
            //     lastIntraDay['4. close'],
            //     '<',
            //     ((100 - stopLossPercent + 1) / 100) * maxPrice,
            //     '=',
            //     lastIntraDay['4. close'] < ((100 - stopLossPercent + 1) / 100) * maxPrice
            // );
            // console.log(
            //     lastIntraDay['4. close'],
            //     '<',
            //     ((100 - stopLossPercent) / 100) * maxPrice,
            //     '=',
            //     lastIntraDay['4. close'] < ((100 - stopLossPercent) / 100) * maxPrice
            // );

            if (hit) {
                // destroy this class.
                this.destroyInstance();
            } else if (lastIntraDay['2. high'] > maxPrice) {
                maxPrice = lastIntraDay['2. high'];

                updateMaxPrice({ symbol, notify, maxPrice }, (err, result) => {
                    if (err) return console.error(err);

                    io.emit('maxUp', { symbol, notify, maxPrice });
                    console.log(`maxPrice in DB for ${symbol} updated to $${maxPrice}`);
                });
            } else if (lastIntraDay['4. close'] < ((100 - stopLossPercent) / 100) * maxPrice) {
                if (!hit) {
                    // send pushbullet message to Sell Stock
                    pushObjectViaPushBullet({
                        body: `${symbol} has fallen below its Trailing Stop Loss Limit of $${((100 - stopLossPercent) / 100) * maxPrice}. Time to Sell!`,
                        title: `Sell ${symbol}`,
                        type: 'note'
                    });
                }
                hit = moment().format();
                updateHit({ symbol, notify, hit }, (err, result) => {
                    if (err) return console.error(err);

                    console.log('Sell Price Hit');
                    // destroy this class;
                    this.destroyInstance();
                });
            } else if (lastIntraDay['4. close'] < ((100 - stopLossPercent + 1) / 100) * maxPrice) {
                if (!withinOne) {
                    // send pushbullet message within 1% of target Sell
                    pushObjectViaPushBullet({
                        body: `${symbol} has fallen to within 1% of its Trailing Stop Loss Limit of $${((100 - stopLossPercent) / 100) *
                            maxPrice}. Be Ready to Sell!`,
                        title: `1% of Selling price for ${symbol}`,
                        type: 'note'
                    });
                }

                const withinOne12HourReset = () => {
                    withinOne = false;
                };

                setTimeout(withinOne12HourReset, 12 * 60 * 60 * 1000);
                withinOne = true;
            } else if (lastIntraDay['4. close'] < ((100 - stopLossPercent + 5) / 100) * maxPrice) {
                if (!withinFive) {
                    // send pushbullet message within 5% of target Sell
                    pushObjectViaPushBullet({
                        body: `${symbol} has fallen to within 5% of its Trailing Stop Loss Limit of $${((100 - stopLossPercent) / 100) *
                            maxPrice}. Be Ready to Sell!`,
                        title: `5% of Selling price for ${symbol}`,
                        type: 'note'
                    });
                }

                const withinFive12HourReset = () => {
                    withinFive = false;
                };

                setTimeout(withinFive12HourReset, 12 * 60 * 60 * 1000);
                withinFive = true;
            }

            // console.log(lastIntraDay);
        });
    };

    this.startScheduleJob = () => {
        // console.log('In Start Schedule Job');
        uniqueJob = sched.scheduleJob('5 */1 8-16 * * *', checkForMaxPriceRaiseOrStopLoss);
        // uniqueJob = sched.scheduleJob('5 */1 * * * *', checkForMaxPriceRaiseOrStopLoss);
    };
}

const isJson = item => {
    item = typeof item !== 'string' ? JSON.stringify(item) : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    return typeof item === 'object' && item !== null;
};

const pushObjectViaPushBullet = (pushBody, callback) => {
    if (isJson(pushBody)) {
        const postData = queryString.stringify(pushBody);

        var options = {
            hostname: `api.pushbullet.com`,
            path: `/v2/pushes`,
            method: 'POST',
            headers: {
                'Access-Token': process.env.PUSH_BULLET_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https
            .request(options, pushRes => {
                const { statusCode } = pushRes;
                const contentType = pushRes.headers['content-type'];

                let error;
                if (statusCode !== 200) {
                    error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error('Invalid content-type.\n' + `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    // Consume response data to free up memory
                    pushRes.resume();
                    return callback(error);
                }

                pushRes.setEncoding('utf8');
                let rawData = '';
                pushRes.on('data', chunk => {
                    rawData += chunk;
                });
                pushRes.on('end', () => {
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

        req.write(postData);
        req.end();
    } else {
        callback(new Error('Invalid Body Object sent to function'));
    }
};

const getStockListByKeyword = (keyword, callback) => {
    const options = {
        hostname: `www.alphavantage.co`,
        port: 443,
        path: `/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${process.env.ALPHA_KEY}`
    };

    // console.dir(options, { depth: null, colors: true });

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

    // console.dir(options, { depth: null, colors: true });

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

const updateMaxPrice = (obj, callback) => {
    stopLossModel
        .findOneAndUpdate(
            {
                symbol: obj.symbol,
                notify: obj.notify
            },
            {
                maxPrice: obj.maxPrice
            },
            {
                new: true,
                runValidators: true
            }
        )
        .exec(callback);
};

const updateHit = (obj, callback) => {
    stopLossModel
        .findOneAndUpdate(
            {
                symbol: obj.symbol,
                notify: obj.notify
            },
            {
                hit: obj.hasOwnProperty('hit') ? new Date(obj.hit) : undefined
            },
            {
                new: true,
                runValidators: true
            }
        )
        .exec(callback);
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
                maxPrice: obj.buyPrice || 0.0,
                hit: obj.hasOwnProperty('hit') ? obj.hit : undefined
            },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        )
        .exec((err, result) => {
            callback(err, result);
            let sl;
            // console.log(`insertOnDuplicateKeyUpdate result: ${JSON.stringify(result, null, 2)}`);
            if (!stopLosses[`${obj.symbol}${obj.notify}`]) {
                stopLosses[`${obj.symbol}${obj.notify}`] = new StopLossClass(result);

                sl = stopLosses[`${obj.symbol}${obj.notify}`];
                sl.startScheduleJob();
            } else {
                sl = stopLosses[`${obj.symbol}${obj.notify}`];
                sl.updateStopLoss(result);
            }
        });
};

/**
 * Find and delete
 * @param {Object} obj
 * @param {callback} callback
 */
const findAndDelete = (obj, callback) => {
    console.log(obj);

    stopLossModel.findByIdAndDelete(obj.id).exec((err, result) => {
        callback(err, result);
        sl = stopLosses[`${result.symbol}${result.notify}`];
        sl.destroyInstance();
    });
};

// get all in DB on startup and start creating instances and minute checks for max price rises
findAllStopLosses((err, results) => {
    if (err) return console.error(err);

    // console.log(results);
    for (const stock of results) {
        stopLosses[`${stock.symbol}${stock.notify}`] = new StopLossClass(stock);

        sl = stopLosses[`${stock.symbol}${stock.notify}`];
        sl.startScheduleJob();
    }

    // console.dir(results, { depth: null, colors: true });
    console.log('findAllStopLosses completed successfully');
});

module.exports = {
    getStockListByKeyword,
    getStockIntraDay,
    updateMaxPrice,
    updateHit,
    findAllStopLosses,
    insertOnDuplicateKeyUpdate,
    findAndDelete
};
