const WebSocket = require('ws');
const axios = require('axios').default;
const http = require('http');

const { searchForQuery, getAccessToken } = require('./search-new');

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', function upgrade(request, socket, head) {
        try {
            wss.handleUpgrade(request, socket, head, function done(ws) {
                wss.emit('connection', ws, request);
            });
        } catch (err) {
            console.log("upgrade exception ", err);
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }
    });


    // Stream query results
    wss.on('connection', (ctx) => {
        console.log('new onnecteion???');

        console.log("Connected", wss.clients.size);

        // On receiving query
        ctx.on("message", async (message) => {
            console.log("received message: ", message.toString());
            // on timer send result
            const userQuery = message.toString().replace(`\"`, '').replace(`\"`, '');
            const queryString = `%23${userQuery} -is:retweet -is:reply lang:en&max_results=10`;
            
            const getAuth = getAccessToken();
            getAuth.then(async (token) => {
                const getOptions = {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'v2RecentSearchJS',
                        'Authorization': 'Bearer ' + token
                    },
                    url: 'https://api.twitter.com/2/tweets/search/recent?query=' + queryString,
                }
        
                try {
                    const response = await axios(getOptions);
                    const tweets = response.data.data;
                    ctx.send(JSON.stringify(tweets));
                } catch (err) {
                    if (err.repsonse) {
                        console.log('Error in Search Response');
                    } else if (err.request) {
                        console.log('Error in Search Request');

                    } else {
                        console.log('Error retrieving search result');
                    }
                }
            });
        });

        ctx.on("close", () => {
            console.log("Closed ", wss.clients.size);
        });

        ctx.send("Connection established");
    });
}


module.exports = { setupWebSocket };