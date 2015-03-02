var express = require('express');
var app = express();
var session = require('express-session');

app.listen(3000, function() {
    console.log('listening on *:3000');
});

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false
}));

app.get('/', function(req, res) {
    if (req.session.views) {
        req.session.views++;
    }
    else {
        req.session.views = 1;
    }
    res.write('<p>views: ' + req.session.views + '</p>');
    res.end();
});
