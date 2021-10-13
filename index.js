const path = require('path');
const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
const qs = require('qs');
const { response } = require('express');
const { request } = require('http');

require('dotenv').config();

app.use(express.static('../twitter-client/build'));

app.get('/search/:searchTerm', (req, res) => {
    const searchterm = req.params.searchTerm;
    const query = `%23${searchterm}`;
    const getAuth = getAccessToken();
    console.log("QUERY = " + query);

    getAuth.then((token) => {
        const getOptions = {
            method: 'GET',
            headers: {
                'User-Agent': 'v2RecentSearchJS',
                'Authorization': 'Bearer ' + token
            },
            url: 'https://api.twitter.com/2/tweets/search/recent?query=' + query,
        }
        // Get results from twitter
        axios(getOptions)
            .then((response) => {
                const tweets = response.data;
                res.send(tweets);
                console.log('Response: ', response.data);
            })
            .catch((err) => {
                if (err.repsonse) {
                    console.log('Error in Search Response');
                } else if (err.request) {
                    console.log('Error in Search Request');

                } else {
                    console.log('Error retrieving search result');
                }
            });
    });
});

async function getAccessToken() {

    const client_id = process.env.API_KEY;
    const client_secret = process.env.API_KEY_SECRET;

    const authOptions = {
        method: 'POST',
        headers: { 'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64') },
        data: qs.stringify({ grant_type: 'client_credentials' }),
        url: 'https://api.twitter.com/oauth2/token'
    }
    return await axios(authOptions)
        .then((response) => {
            return response.data.access_token;
        })
        .catch((err) => {
            if (err.repsonse) {
                console.log('Error in Auth Response');
            } else if (err.request) {
                console.log('Error in Auth Request');
            } else {
                console.log('Error retrieving Access Token');
            }
        });
}

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../twitter-client/build', 'index.html'));
});

app.listen(port, () => {

});