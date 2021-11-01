const path = require('path');
const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
const qs = require('qs');
const http = require('http');

const { setupWebSocket } = require('./websocket');



const searchRouter = require('./search');
// const nlpRouter = require('./nlp');
const { so } = require('stopword');

app.use(express.json());
app.use(express.urlencoded());


app.use('/search', searchRouter);
// app.use('/nlp', nlpRouter);

require('dotenv').config();

app.use(express.static('../twitter-client/build'));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../twitter-client/build', 'index.html'));
});


const server = http.createServer(app);

setupWebSocket(server);

server.listen(3000);