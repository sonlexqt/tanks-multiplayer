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
    allow: [
        'setPlayerTankId',
        'kill',
        'spawnEnemy',
        'updateMovement',
        'updateFire'
    ]
});
// Set of clients
var clients = {};

// Attach eureca.io to our http server
eurecaServer.attach(server);

// Detect client connection
eurecaServer.onConnect(function (connection) {
    console.log('(i) New Client id=%s ', connection.id, connection.remoteAddress);
    var remote = eurecaServer.getClient(connection.id);
    clients[connection.id] = {
        id: connection.id,
        remote: remote,
        name: '',
        teamNumber: 1
    };
    remote.setPlayerTankId(connection.id);
});

// Detect client disconnection
eurecaServer.onDisconnect(function (conn) {
    console.log('/!\\ Client disconnected ', conn.id);
    delete clients[conn.id];
    for (var c in clients)
    {
        var remote = clients[c].remote;
        // Here we call kill() method defined in the client side
        remote.kill(conn.id);
    }
});

eurecaServer.exports.handshake = function(id, name, teamNumber, clientInitialPos){
    clients[id].name = name;
    clients[id].teamNumber = teamNumber;
    var newClientRemote = clients[id].remote;
    clients[id].lastState = {
        destination: {
            x: clientInitialPos.x,
            y: clientInitialPos.y
        }
    };
    console.log(id);
    console.log(clients[id]);
    for (var c in clients){
        // Spawn this new client tank to all clients
        clients[c].remote.spawnEnemy(id, name, teamNumber, clientInitialPos.x, clientInitialPos.y);
        // Spawn all clients tank to this new client
        if (clients[c].id !== id){
            if (clients[c].lastState && clients[c].lastState.destination){
                newClientRemote.spawnEnemy(clients[c].id, clients[c].name, clients[c].teamNumber, clients[c].lastState.destination.x, clients[c].lastState.destination.y);
            }
        }
    }
};

eurecaServer.exports.handleMovement = function (newState) {
    var conn = this.connection;
    var updatedClient = clients[conn.id];

    for (var c in clients){
        var remote = clients[c].remote;
        remote.updateMovement(updatedClient.id, newState);
        //keep last known state so we can send it to new connected clients
        clients[c].lastState = newState;
    }
};

eurecaServer.exports.handleFire = function(fireInfo){
    for (var c in clients){
        clients[c].remote.updateFire(fireInfo);
    }
};

server.listen(3000);