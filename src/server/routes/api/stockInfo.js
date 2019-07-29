const express = require('express');
const fn = require('../../functions');
const https = require('https');

const router = express.Router();

router.get('/getStockName/:keyword', (req, res) => {
    console.log(`get /api/stock/getStockInfo/${req.params.keyword}`);
    fn.getStockListByKeyword(req.params.keyword, (err, result) => {
        if (err) {
            res.status(500).send();
            return console.error(err);
        }

        res.send(result.bestMatches);
    });
});

router.get('/getIntraday/:symbol', (req, res) => {
    console.log(`get /api/stock/getIntraday/${req.params.symbol}`);
    fn.getStockIntraDay(req.params.symbol, (err, result) => {
        if (err) {
            res.status(500).send();
            return console.error(err);
        }

        res.send(result);
    });
});

router.get('/getLastIntraday/:symbol', (req, res) => {
    console.log(`get /api/stock/getLastIntraday/${req.params.symbol}`);
    fn.getStockIntraDay(req.params.symbol, (err, result) => {
        if (err) {
            res.status(500).send();
            return console.error(err);
        }

        res.send({
            ...result['Time Series (1min)'][Object.keys(result['Time Series (1min)'])[0]],
            ...{ '6. dt': Object.keys(result['Time Series (1min)'])[0] }
        });
    });
});

module.exports = router;
