const express = require('express');
const app = express();
const all = require('./api/all');

process.env.TZ = 'Asia/bangkok';

app.use(express.json({extended: false}));

app.use('/', all);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));