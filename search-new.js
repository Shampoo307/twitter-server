const path = require('path');
const express = require('express');
const axios = require('axios');
const qs = require('qs');

const { getSentiment } = require('./nlp');

// Take tweet, websocket.
// Analyse tweet & send result to websocket (to client)
async function analyseTweet(tweet, webSocket) {
    const sentiment = getSentiment(tweet.text);
    const tweetDate = new Date(tweet.created_at).toLocaleDateString();
    const newTweet = {
        id: tweet.id,
        text: tweet.text,
        created_at: tweetDate,
        sentiment: sentiment
    }
    webSocket.send(JSON.stringify(newTweet));
}

async function retrieveTweets(query, webSocket, sinceId, setSinceId) {
    let querystring = query;
    if (sinceId) {
        querystring += `&since_id=${sinceId}`;
    }
    const getAuth = getAccessToken();

    getAuth.then(async (token) => {
        const getOptions = {
            method: 'GET',
            headers: {
                'User-Agent': 'v2RecentSearchJS',
                'Authorization': 'Bearer ' + token
            },
            url: 'https://api.twitter.com/2/tweets/search/recent?query=' + querystring,
        }
        try {


            const response = await axios(getOptions);
            console.log('just made request to ', getOptions.url);
            const tweets = response.data.data ?? [];

            if (tweets.length <= 0) {
                return;
            }

            const foo = tweets.reverse()[0];
            console.log('current since_id ', sinceId);
            console.log('fooo ID', foo.id)
            // foo.forEach(async (tweet, i) => {
                // Send tweets every ~2secs 
                // setTimeout(() => analyseTweet(tweet, webSocket), 50);
            await analyseTweet(foo, webSocket)
            // });
            // Set 'since_id' as id of first element (most recent tweet)
            setSinceId(foo.id);


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

// Start streaming (through websocket) results for search query back to client
async function searchForQuery(searchTerm, webSocket) {
    const query = `%23${searchTerm} -is:retweet -is:reply lang:en&max_results=15&tweet.fields=created_at`;
    // authenticate with twitter before making get request

    let sinceId = "";

    const setSinceId = (id) => { sinceId = id };
    // await retrieveTweets(query, webSocket, sinceId, setSinceId);
    // while (true) {
    //     setTimeout(() retrieveTweets(query, webSocket, sinceId, setSinceId), 10000)
    // }
    console.log('since id', sinceId);
    await retrieveTweets(query, webSocket, sinceId, setSinceId);
    console.log('since id 2', sinceId);
    setInterval(async () => await retrieveTweets(query, webSocket, sinceId, setSinceId), 1500);


    

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