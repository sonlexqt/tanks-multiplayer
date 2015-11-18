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
        'spawnNewTank',
        'updateMovement',
        'updateFire',
        'updateTankHitBullets',
        'spawnNewCPUTank',
        'updateCPUMovement',
        'spawnItems',
        'updateHitItem'
    ]
});
// Set of clients
var clients = {};
// Set of CPU tanks
var cpuTanks = {};
// List of items
var INITIAL_ITEMS_LIST = [
    {
        id: 1,
        type: 'hp',
        position: {
            x: 197,
            y: 196
        }
    },
    {
        id: 2,
        type: 'hp',
        position: {
            x: 1633,
            y: 1630
        }
    },
    {
        id: 3,
        type: 'weapon',
        position: {
            x: 1625,
            y: 196
        }
    },
    {
        id: 4,
        type: 'weapon',
        position: {
            x: 170,
            y: 1676
        }
    }
];
var items = INITIAL_ITEMS_LIST.slice();

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
        teamNumber: 1,
        isDied: false
    };
    remote.setPlayerTankId(connection.id);
    updateInformation();
});

// Detect client disconnection
eurecaServer.onDisconnect(function (conn) {
    console.log('/!\\ Client disconnected ', conn.id);
    if (!!clients[conn.id]){
        var disconnectedTeamNumber = clients[conn.id].teamNumber;
        //delete clients[conn.id];
        clients[conn.id].isDied = true;
        var respectivelyCPUTanks = [];
        for (var key in cpuTanks){
            if (cpuTanks[key].teamNumber == disconnectedTeamNumber){
                respectivelyCPUTanks.push(cpuTanks[key]);
            }
        }
        for (var c in clients){
            var remote = clients[c].remote;
            // Here we call kill() method defined in the client side
            remote.kill(conn.id);
            for (var i = 0; i < respectivelyCPUTanks.length; i++){
                remote.kill(respectivelyCPUTanks[i].id);
            }
        }
        for (var i = 0; i < respectivelyCPUTanks.length; i++){
            delete cpuTanks[respectivelyCPUTanks[i].id];
        }
    }
    updateInformation();
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
    for (var c in clients){
        // Spawn this new client tank to all clients
        clients[c].remote.spawnNewTank(id, name, teamNumber, clientInitialPos.x, clientInitialPos.y);
        // Spawn all clients tank to this new client
        if (clients[c].id !== id){
            if (clients[c].isDied == false && clients[c].lastState && clients[c].lastState.destination){
                newClientRemote.spawnNewTank(clients[c].id, clients[c].name, clients[c].teamNumber, clients[c].lastState.destination.x, clients[c].lastState.destination.y);
            }
        }
        for (var i in cpuTanks){
            clients[c].remote.spawnNewCPUTank(cpuTanks[i].id, cpuTanks[i].name, cpuTanks[i].teamNumber, cpuTanks[i].lastState.destination.x, cpuTanks[i].lastState.destination.y);
        }
        newClientRemote.spawnItems(items);
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

eurecaServer.exports.handleCPUMovement = function(newState){
    var cpuTankId = newState.cpuId;

    for (var c in clients){
        var remote = clients[c].remote;
        remote.updateCPUMovement(newState);
        if (cpuTanks[cpuTankId]){
            cpuTanks[cpuTankId].lastState = newState;
        }
    }
};

eurecaServer.exports.handleTankHitBullets = function(bulletInfo){
    for (var c in clients){
        clients[c].remote.updateTankHitBullets(bulletInfo);
    }
};

eurecaServer.exports.handleFire = function(fireInfo){
    for (var c in clients){
        clients[c].remote.updateFire(fireInfo);
    }
};

eurecaServer.exports.handleSpawnCPUTank = function(cpuTankId, cpuTankName, playerTankSelectedTeam, cpuTankInitialPos){
    console.log('*** new CPU Tank: ' + cpuTankId);
    cpuTanks[cpuTankId] = {
        id: cpuTankId,
        name: cpuTankName,
        teamNumber: playerTankSelectedTeam,
        lastState: {
            destination: {
                x: cpuTankInitialPos.x,
                y: cpuTankInitialPos.y
            }
        }
    };
    for (var c in clients){
        clients[c].remote.spawnNewCPUTank(cpuTankId, cpuTankName, playerTankSelectedTeam, cpuTankInitialPos.x, cpuTankInitialPos.y);
    }
    updateInformation();
};

eurecaServer.exports.handleTankDeath = function(tankId, isCPUTank){
    if (isCPUTank){
        for (var key in cpuTanks){
            if (cpuTanks[key] && cpuTanks[key].id == tankId){
                console.log('* DELETE CPU Tank with id = ' + tankId);
                delete cpuTanks[key];
            }
        }
    } else {
        for (var key in clients){
            if (clients[key] && clients[key].id == tankId){
                console.log('* DELETE Player Tank with id = ' + tankId);
                //delete clients[key];
                clients[key].isDied = true;
            }
        }
    }
    updateInformation();
};

eurecaServer.exports.handleHitItem = function(itemId, tankId){
    console.log('> HandleHitItem ' + Date.now());
    console.log('* itemId: ' + itemId);
    console.log('* before: ');
    console.log(items);
    for (var key in clients){
        if (!clients[key].isDied){
            clients[key].isHandledHitItem = false;
        }
    }
    for (var i = 0; i < items.length; i++){
        if (items[i].id == itemId){
            var itemType = items[i].type;
            items.splice(i, 1);
            for (var key in clients){
                if (clients[key].isDied != true && clients[key].isHandledHitItem == false){
                    clients[key].remote.updateHitItem(itemId, itemType, items, tankId);
                    clients[key].isHandledHitItem = true;
                }
            }
        }
    }
    console.log('* after: ');
    console.log(items);
};

function updateInformation(){
    console.log('> Total clients: ' + Object.keys(clients).length);
    console.log('> Number of CPU Tanks left: ' + Object.keys(cpuTanks).length);
    var numOfAliveClients = 0;
    for (var key in clients){
        if (!clients[key].isDied){
            numOfAliveClients += 1;
        }
    }
    console.log('> Number of Active Clients left: ' + numOfAliveClients);
    if (numOfAliveClients == 0){
        console.log('> Refreshing items list');
        items = INITIAL_ITEMS_LIST.slice();
    }
}

server.listen(3000);