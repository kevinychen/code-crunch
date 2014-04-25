/*
 * socket.io API
 */

thisio = '';

exports.setServer = function(server) {
  thisio = require('socket.io').listen(server);
};

exports.send = function(req, res) {
  var clients = thisio.sockets.clients();
  for (var i = 0; i < clients.length; i++) {
    clients[i].emit('news', {hello: 'world'});
  }
};
