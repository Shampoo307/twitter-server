const WebSocket = require('ws');

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });
    console.log('new websocket???');
    broadcastPipeline(wss.clients);

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

    wss.on('connection', (ctx) => {

        const interval = individualPipeline(ctx);
        console.log('new onnecteion???');

        console.log("Connected", wss.clients.size);

        ctx.on("message", (message) => {
            console.log("received message: ", message);
            ctx.send('You said: ', message);
        });

        ctx.on("close", () => {
            console.log("Closed ", wss.clients.size);
            clearInterval(interval);
        });

        ctx.send("Connection established");
    });
}



function individualPipeline(ctx) {
    let idx = 0;
    const interval = setInterval(() => {
      ctx.send(`ping pong ${idx}`);
      idx++;
    }, 5000);
    return interval;
  }
  
  // braodcast messages
  // one instance for all clients
  function broadcastPipeline(clients) {
    let idx = 0;
    const interval = setInterval(() => {
      for (let c of clients.values()) {
        c.send(`broadcast message ${idx}`);
      }
      idx++;
    }, 3000);
    return interval;
  }




module.exports = { setupWebSocket };