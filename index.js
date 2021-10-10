const path = require('path');
const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
const qs = require('qs');
const { response } = require('express');

require('dotenv').config();

app.use(express.static('../client/build'));





app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(port, () => {

});