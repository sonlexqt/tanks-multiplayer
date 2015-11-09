var express = require('express');
var app = express(app);
var server = require('http').createServer(app);
var eureca = require('eureca.io');
var path = require('path');
var favicon = require('serve-favicon');

// Serve static files from the current directory
app.use(express.static(__dirname));
// Serve favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Create an instance of EurecaServer
var eurecaServer = new eureca.Server({
    allow: ['setPlayerTankId', 'kill', 'spawnEnemy', 'updateState']
});
// Set of clients
var clients = {};

// Attach eureca.io to our http server
eurecaServer.attach(server);

// Detect client connection
eurecaServer.onConnect(function (connection) {
    console.log('> New Client id=%s ', connection.id, connection.remoteAddress);
    var remote = eurecaServer.getClient(connection.id);
    clients[connection.id] = {
        id: connection.id,
        remote: remote
    };
    remote.setPlayerTankId(connection.id);
});

// Detect client disconnection
eurecaServer.onDisconnect(function (conn) {
    console.log('> Client disconnected ', conn.id);
    delete clients[conn.id];
    for (var c in clients)
    {
        var remote = clients[c].remote;
        // Here we call kill() method defined in the client side
        remote.kill(conn.id);
    }
});

eurecaServer.exports.handshake = function(){
    for (var c in clients)
    {
        var remote = clients[c].remote;
        for (var cc in clients){
            //send latest known position
            var x = clients[cc].lastState ? clients[cc].lastState.x : 0;
            var y = clients[cc].lastState ? clients[cc].lastState.y : 0;
            remote.spawnEnemy(clients[cc].id, x, y);
        }
    }
};

eurecaServer.exports.handleMovement = function (newState) {
    var conn = this.connection;
    var updatedClient = clients[conn.id];

    for (var c in clients)
    {
        var remote = clients[c].remote;
        remote.updateState(updatedClient.id, newState);

        //keep last known state so we can send it to new connected clients
        clients[c].lastState = newState;
    }
};

server.listen(3000);