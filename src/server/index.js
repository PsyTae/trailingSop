const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const morgan = require('morgan');

const app = express();

// Middleware
app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(cors);

app.get('/', (req, res) => {
    console.log('root accessed');
    res.send('ok');
});

const posts = require('./routes/api/posts');

app.use('/api/posts', posts);

const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Server started on port ${port}`));
