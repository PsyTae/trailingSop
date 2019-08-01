const express = require('express');
const fn = require('../../functions');

const router = express.Router();

// get posts
router.get('/', (req, res) => {
    // console.log('get /api/posts accessed');
    fn.findAllStopLosses((err, stops) => {
        if (err) {
            // console.error(err);
            return res.status(500).send();
        }
        // console.log(`get /api/posts results: ${JSON.stringify(stops, null, 2)}`);
        res.send(stops);
    });
});

// add posts
router.post('/', (req, res) => {
    // console.log('post /api/posts accessed');
    // console.log('req.body:', req.body);
    // console.dir(req.body.obj, { depth: null, colors: true });
    fn.insertOnDuplicateKeyUpdate(req.body.obj, (err, result) => {
        if (err) {
            // console.error(`post /api/posts Error: ${err}`);
            return res.status(500).send();
        }
        // console.log(`post /api/posts result: ${result}`);

        res.status(201).send();
    });
});

router.post('/updateHit/', (req, res) => {
    // console.log('post /api/posts/updateHit accessed');
    // console.log('req.body:', req.body);
    // console.dir(req.body.obj, { depth: null, colors: true });
    fn.updateHit(req.body.obj, (err, result) => {
        if (err) {
            // console.error(`post /api/posts Error: ${err}`);
            return res.status(500).send();
        }
        // console.log(`post /api/posts result: ${result}`);

        res.status(201).send();
    });
});

router.post('/updateMaxPrice/', (req, res) => {
    // console.log('post /api/posts/updateMaxPrice accessed');
    // console.log('req.body:', req.body);
    // console.dir(req.body.obj, { depth: null, colors: true });
    fn.insertOnDuplicateKeyUpdate(req.body.obj, (err, result) => {
        if (err) {
            // console.error(`post /api/posts Error: ${err}`);
            return res.status(500).send();
        }
        // console.log(`post /api/posts result: ${result}`);

        res.status(201).send();
    });
});

// delete posts
router.delete('/:id', (req, res) => {
    // console.log('delete /api/posts accessed');
    // console.dir(req.params.id, { depth: null, colors: true });
    fn.findAndDelete({ id: req.params.id }, (err, result) => {
        if (err) {
            // console.error(err);
            return res.status(500).send();
        }
        console.log(result);
        console.log('delete completed Successfully');
        res.status(200).send();
    });
});

module.exports = router;
