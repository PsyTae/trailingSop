const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const morgan = require('morgan');
const port = process.env.PORT || 80;

// Middleware
app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(cors());

// app.get('/', (req, res) => {
//     console.log('Root Accessed');
//     res.send('Hello World!');
// });

const posts = require('./routes/api/posts');
const stocks = require('./routes/api/stockInfo');

app.use('/api/posts', posts);
app.use('/api/stock', stocks);

app.listen(port, () => console.log(`Server started on port ${port}!`));
