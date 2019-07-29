const express = require('express');
const fn = require('../../functions');

const router = express.Router();

// get posts
router.get('/', (req, res) => {
    console.log('get /api/posts accessed');
    fn.findAllStopLosses((err, stops) => {
        if (err) {
            console.error(err);
            return res.status(500).send();
        }

        console.dir(stops, { depth: null, colors: true });
        res.send(stops);
    });
});

// add posts
router.post('/', (req, res) => {
    console.log('post /api/posts accessed');
    console.dir(req.body, { depth: null, colors: true });
    fn.insertOnDuplicateKeyUpdate(req.body, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send();
        }

        res.status(201).send();
    });
});

// delete posts
router.delete('/', (req, res) => {
    console.log('delete /api/posts accessed');
    console.dir(req.body, { depth: null, colors: true });
    fn.findAndDelete(req.body, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send();
        }

        res.status(200).send();
    });
});

module.exports = router;
