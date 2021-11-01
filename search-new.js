const path = require('path');
const express = require('express');
const axios = require('axios');
const qs = require('qs');

const { getSentiment } = require('./nlp');


async function searchForQuery(searchTerm, webSocket) {
    const query = `%23${searchTerm} -is:retweet -is:reply lang:en&max_results=10`;
    // authenticate with twitter before making get request
    const getAuth = getAccessToken();

    getAuth.then(async (token) => {
        const getOptions = {
            method: 'GET',
            headers: {
                'User-Agent': 'v2RecentSearchJS',
                'Authorization': 'Bearer ' + token
            },
            url: 'https://api.twitter.com/2/tweets/search/recent?query=' + query,
        }
        try {
            const response = await axios(getOptions);
            const tweets = response.data.data;
            tweets.forEach(tweet => {
                const sentiment = getSentiment(tweet.text);
                const newTweet = {
                    id: tweet.id,
                    text: tweet.text,
                    sentiment: sentiment
                }
                webSocket.send(JSON.stringify(newTweet));
            })
        } catch (err) {
            if (err.repsonse) {
                console.log('Error in Search Response');
            } else if (err.request) {
                console.log('Error in Search Request');
            } else {
                console.log('Error retrieving search result');
            }
        }
    })

}

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
                console.log('Error retrieving Analysis Access Token');
            }
        });
}



module.exports = { searchForQuery, getAccessToken };