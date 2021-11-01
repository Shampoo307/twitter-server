const path = require('path');
const express = require('express');
const axios = require('axios');
const qs = require('qs');
const { response } = require('express');
const { request } = require('http');
// const redis = require('redis');
// const AWS = require('aws-sdk');
//const { response } = require('express');
// const { CodeBuild } = require('aws-sdk');

const router = express.Router();
require('dotenv').config();

const bucketName = 'tomjoel-tweetstore';

// Retrieve tweets based off search term param
router.get('/:searchTerm', (req, res) => {
    const searchterm = req.params.searchTerm;
    console.log('SEARCH TERM ', searchterm);
    const query = `%23${searchterm} -is:retweet -is:reply lang:en&max_results=10`;
    // authenticate with twitter before making get request
    const getAuth = getAccessToken();
    // const redisKey = `tweet:${searchterm}`;
    // const s3Key = `tweet-${searchterm}`;

    getAuth.then((token) => {
        const getOptions = {
            method: 'GET',
            headers: {
                'User-Agent': 'v2RecentSearchJS',
                'Authorization': 'Bearer ' + token
            },
            url: 'https://api.twitter.com/2/tweets/search/recent?query=' + query,
        }
        // Check redis cache
        // return redisClient.get(redisKey, (err, result) => {
        //     if (result) {
        //         const resultJSON = JSON.parse(result);
        //         console.log("found in cache");
        //         return res.status(200).json(resultJSON);
        //     } else {
        //         // check S3
                
        //         const params = { Bucket: bucketName, Key: s3Key };
        //         return new AWS.S3({ apiVersion: '2006-03-01' }).getObject(params, (err, result) => {
        //             if (result) {
        //                 const resultJSONS3 = JSON.parse(result.data);
        //                 const resultJSONRedis = JSON.parse(result.data);
        //                 console.log("found in cache");
        //                 storeInRedis(redisKey, resultJSONRedis);
        //                 return res.status(200).json({ source: "S3 Bucket", ...resultJSONS3 });
        //             } else {
                        // Get results from twitter
                        return axios(getOptions)
                            .then((response) => {
                                const tweets = response.data;
                                console.log("Made it into tweet search", tweets);
                                // storeInS3(s3Key, tweets);
                                // storeInRedis(redisKey, tweets);
                                res.send(tweets);
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
            //         }
            //     });
            // }
        // });

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
                console.log('Error retrieving Analysis Access Token');
            }
        });
}

// const bucketPromise = new AWS.S3({ apiVersion: '2006-03-01' })
//     .createBucket({ Bucket: bucketName })
//     .promise();

// bucketPromise.then((data) => {
//     console.log('Successfully created ', bucketName);
// })
//     .catch(err => {
//         console.error(err);
//     });

// const app = express();

// const redisClient = redis.createClient();

// redisClient.on('error', (err) => {
//     console.log('Error ', err);
// });

// app.use(responseTime());

function storeInS3(s3Key, jsonData) {
    const data = jsonData;
    const body = JSON.stringify({ source: 'S3 Bucket', ...data });
    const objectParams = { Bucket: bucketName, Key: s3Key, Body: body };
    const uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
}

function storeInRedis(redisKey, jsonData) {
    var newJson = jsonData;
    if (newJson.source) { // If source property exists in json (e.g. from S3) then replace
        newJson.source = 'Redis Cache';
        redisClient.setex(redisKey, 3600, JSON.stringify({ newJson }));
    } else {
        redisClient.setex(redisKey, 3600, JSON.stringify({ source: 'Redis Cache', ...jsonData, }));
    }
}

module.exports = router;
