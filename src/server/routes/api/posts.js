const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// get posts
router.get('/', (req, res) => {
    console.log('/api/posts accessed');
    res.send('hello');
});

// add posts

// delete posts

module.exports = router;
