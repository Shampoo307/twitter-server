const express = require('express');
const aposToLexForm = require('apos-to-lex-form');
const SpellCorrector = require('spelling-corrector');
const SW = require('stopword');
const natural = require('natural');

const router = express.Router();

const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();

// Get array of tweets ({ id, text }) and get sentiment analysis for each tweet

router.post('/s-analysis', (req, res) => {
    const tweets = req.body;
    // analyse each tweet & return tweet + sentiment
    const analysedTweets = tweets.map((tweet, index) => {
        const sentiment = getSentiment(tweet.text);
        return {
            id: tweet.id,
            text: tweet.text,
            sentiment: sentiment
        }
        // const result = {
        //     id: tweet.id,
        //     text: tweet.text,
        //     sentiment: sentiment
        // }
    });

    res.status(200).json(analysedTweets);
});

// adapted from https://blog.logrocket.com/sentiment-analysis-node-js/
// takes in text from a tweet, returns sentiment analysis
function getSentiment(tweet) {
    // converts contractions - e.g. I'm -> I am
    const lexedTweet = aposToLexForm(tweet);
    // standard case for consistency
    const casedTweet = lexedTweet.toLowerCase();
    // remove non-alphabetical & special characters (doesn't affect sentiment
    // and helps consistency)
    const alphaOnlyTweet = casedTweet.replace(/[^a-zA-Z\s]+/g, '');

    // Splits text into individual meaningful units
    const { WordTokenizer } = natural;
    const tokeniser = new WordTokenizer();
    const tokenisedTweet = tokeniser.tokenize(alphaOnlyTweet);
    
    // correct misspelled words (helps consistency)
    tokenisedTweet.forEach((word, index) => {
        tokenisedTweet[index] = spellCorrector.correct(word);
    });
    // remove stop words, e.g. what, a, but (doesn't affect sentiment)
    const filteredTweet = SW.removeStopwords(tokenisedTweet);
    // normalise words e.g. giving, gave, giver -> give
    const { SentimentAnalyzer, PorterStemmer } = natural;
    // set language, and analyse
    const analyser = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
    const analysis = analyser.getSentiment(filteredTweet);
    return analysis;
}


module.exports = router;