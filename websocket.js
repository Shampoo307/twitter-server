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
            searchForQuery(userQuery, ctx);
        });

        ctx.on("close", () => {
            console.log("Closed ", wss.clients.size);
        });

    });
}


module.exports = { setupWebSocket };