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
    const getAnalysis = getSentiment();
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
                //console.log('Response: ', response.data);
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

    //Sentiment call
    getAnalysis.then((token) => {

        var options = {
            method: 'GET',
            url: 'https://twinword-sentiment-analysis.p.rapidapi.com/analyze/',
            params: {text: "This is a bad hardcoded string that is being analysed"},
            headers: {
              'x-rapidapi-host': 'twinword-sentiment-analysis.p.rapidapi.com',
              'x-rapidapi-key': '6a6207d250mshd240de65ef5af7fp1cc03bjsnd422221fa355'
            }
          };
          
          axios.request(options).then(function (response) {
            console.log('ANALYSIS Response: ', response.data);
          }).catch(function (error) {
                if (error.repsonse) {
                        console.log('Error in Analysis Search Response');
                    } else if (error.request) {
                        console.log('Error in Analysis Search Request');
                        //console.log(error.request);
                    } else {
                        console.log('Error retrieving Analysis search result');
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
                console.log('Error retrieving Analysis Access Token');
            }
        });
}

//Pls don't spam as after 500 calls I will get billed 0.003 per call lmao. Going to upgrade just waiting to confirm
async function getSentiment() {
    //const API_KEY = process.env.SENTIMENT_KEY;
    var options = {
        method: 'POST',
        url: 'https://twinword-sentiment-analysis.p.rapidapi.com/analyze/',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'x-rapidapi-host': 'twinword-sentiment-analysis.p.rapidapi.com',
            'x-rapidapi-key': '6a6207d250mshd240de65ef5af7fp1cc03bjsnd422221fa355'
        },
        data: { text: 'great value in its price range!' }
    };

    return await axios.request(options).then(function (response) {
        console.log("SENTIMENT WORKS-----------")
        console.log(response.data);
    }).catch(function (error) {
        if (error.repsonse) {
            console.log('Error in Analysis Auth Response');
        } else if (error.request) {
            console.log('Error in Analysis Auth Request');
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