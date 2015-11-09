var express = require('express');
var app = express(app);
var server = require('http').createServer(app);
var eureca = require('eureca.io');
var path = require('path');
var favicon = require('serve-favicon');

// serve static files from the current directory
app.use(express.static(__dirname));
// serve favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//create an instance of EurecaServer
var eurecaServer = new eureca.Server();

//attach eureca.io to our http server
eurecaServer.attach(server);

//detect client connection
eurecaServer.onConnect(function (conn) {
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);
});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {
    console.log('Client disconnected ', conn.id);
});

server.listen(3000);