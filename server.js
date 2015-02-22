var express = require('express'),
    app = express(),
    http = require('http').Server(app);

http.listen(3000, function() {
    console.log('listening on *:3000');
});

app.get('/', function(req, res) {
    res.send('initialized');
});
