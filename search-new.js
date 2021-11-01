const path = require('path');
const express = require('express');
const axios = require('axios');
const qs = require('qs');


function searchForQuery(searchTerm) {
    const searchterm = searchTerm;
    console.log('SEARCH TERM ', searchterm);
    const query = `%23${searchterm} -is:retweet -is:reply lang:en&max_results=10`;
    // authenticate with twitter before making get request
    const getAuth = getAccessToken();

    getAuth.then((token) => {
        const getOptions = {
            method: 'GET',
            headers: {
                'User-Agent': 'v2RecentSearchJS',
                'Authorization': 'Bearer ' + token
            },
            url: 'https://api.twitter.com/2/tweets/search/recent?query=' + query,
        }

        return axios(getOptions)
            .then((response) => {
                const tweets = response.data;
                console.log("Made it into tweet search", tweets);
                // storeInS3(s3Key, tweets);
                // storeInRedis(redisKey, tweets);
                return tweets;
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