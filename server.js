var express = require('express');
var app = express();
var session = require('express-session');
var session_secret = process.env.EXPRESS_SESSION_SECRET;
var server = require('http').Server(app);
var io = require('socket.io')(server);

var tumblr = require('tumblr.js');
var tumblr_consumer_key = process.env.TUMBLR_CONSUMER_KEY;
var tumblr_consumer_secret = process.env.TUMBLR_CONSUMER_SECRET;

var OAuth = require('oauth').OAuth;
var oa = new OAuth(
        'http://www.tumblr.com/oauth/request_token',
        'http://www.tumblr.com/oauth/access_token',
        tumblr_consumer_key,
        tumblr_consumer_secret,
        '1.0',
        'http://localhost:3000/callback',
        'HMAC-SHA1'
    );

io.on('connection', function(socket) {
    console.log('socket.io connected');
});

app.use(session({
    secret: session_secret,
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'jade');

app.get('/', function(req, res) {
    if (req.session.oauth_status !== 'authenticated') {
        res.redirect('/auth');
    }
    else {
        var client = tumblr.createClient({
            consumer_key: tumblr_consumer_key,
            consumer_secret: tumblr_consumer_secret,
            token: req.session.oauth_access_token,
            token_secret: req.session.oauth_access_token_secret
        });

        client.dashboard(function(err, data) {
            if (err) {
                console.log(err);
                res.end();
            }
            else {
                res.render('index', {title: '', posts: data.posts});
            }
        });
    }
});

app.get('/auth', function(req, res) {
    if (req.session.oauth_status === 'authenticated') {
        res.redirect('/');
    }
    else {
        oa.getOAuthRequestToken(function(err, oauth_token, oauth_token_secret, results) {
            if (err) {
                console.log(err);
                res.end();
            }

            req.session.oauth_token = oauth_token;
            req.session.oauth_token_secret = oauth_token_secret;
            req.session.oauth_status = 'initialized';
            res.redirect('http://www.tumblr.com/oauth/authorize?oauth_token='+oauth_token);
        });
    }
});

app.get('/callback', function(req, res) {
    if (req.session.oauth_status === 'initialized') {
        oa.getOAuthAccessToken(
            req.session.oauth_token,
            req.session.oauth_token_secret,
            req.query.oauth_verifier,
            function(err, oauth_access_token, oauth_access_token_secret, results) {
                if (err) {
                    console.log(err);
                    res.end();
                }
                else {
                    req.session.oauth_access_token = oauth_access_token;
                    req.session.oauth_access_token_secret = oauth_access_token_secret;
                    req.session.oauth_status = 'authenticated';
                    res.redirect('/');
                }
            }
        );
    }
    else {
        res.redirect('/');
    }
});

server.listen(3000, function() {
    console.log('listening on *:3000');
});
