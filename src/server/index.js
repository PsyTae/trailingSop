const cors = require('cors');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');
const morgan = require('morgan');
const port = process.env.PORT || 80;

app.use(cors());
// Middleware
// app.use(morgan('dev'));

app.use(bodyParser.json());

const posts = require('./routes/api/posts');
const stocks = require('./routes/api/stockInfo');

app.use('/api/posts', posts);
app.use('/api/stock', stocks);

app.listen(port, () => console.log(`Server started on port ${port}!`));
