const hostURL = url.parse(process.env.TS_HOST_URL || 'http://localhost:3000/');
import express from 'express';
import http from 'http';
import url from 'url';
import socketio from 'socket.io';
var app = express();
var server = http.Server(app);
var io = socketio(server);

const redisURL = url.parse(process.env.REDISCLOUD_URL || 'redis://localhost:6379');
const session_secret = process.env.TS_SESSION_SECRET;
import session from 'express-session';
import redis from 'connect-redis';
var RedisStore = redis(session);
var sessionStore = new RedisStore({
  host: redisURL.hostname,
  port: redisURL.port,
  pass: redisURL.auth? redisURL.auth.split(":")[1]: ''
});

const tumblr_consumer_key = process.env.TS_CONSUMER_KEY;
const tumblr_consumer_secret = process.env.TS_CONSUMER_SECRET;
import tumblr from 'tumblr.js';

import {OAuth} from 'oauth';
const oa = new OAuth(
  'http://www.tumblr.com/oauth/request_token',
  'http://www.tumblr.com/oauth/access_token',
  tumblr_consumer_key,
  tumblr_consumer_secret,
  '1.0',
  hostURL.href+'callback',
  'HMAC-SHA1'
);

io.use((socket, next) => {
  var hashedCookies = require('cookie').parse(socket.request.headers.cookie);
  var cookies = require('cookie-parser/lib/parse').signedCookies(hashedCookies, session_secret);
  var sid = cookies['connect.sid'];

  sessionStore.get(sid, (err, session) => {
    if (err) {
      console.log(err);
      return;
    }

    socket.session = session;
    next();
  });
});

io.on('connection', (socket) => {
  console.log('socket.io connected: ' + socket.id);

  socket.on('start_loading', (latest_post_id) => {
    if (socket.session === undefined || socket.session.oauth_status !== 'authenticated') {
      return;
    }
    var client = tumblr.createClient({
      consumer_key: tumblr_consumer_key,
      consumer_secret: tumblr_consumer_secret,
      token: socket.session.oauth_access_token,
      token_secret: socket.session.oauth_access_token_secret
    });

    var interval = setInterval(() => {
      if (latest_post_id) {
        client.dashboard({
            since_id: latest_post_id
        }, (err, data) => {
          if (err) {
            console.log(err);
            return;
          }

          if (data.posts !== undefined && data.posts.length > 0) {
            socket.emit('new_post', data);
            latest_post_id = data.posts[0].id;
          }
        });
      }
    }, 5000);

    socket.on('disconnect', () => {
      console.log('socket.io disconnected: ' + socket.id);
      clearInterval(interval);
    });
  });

});

app.use((req, res, next) => {
  if (hostURL.protocol == 'https:' && req.headers["x-forwarded-proto"] != 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(session({
  secret: session_secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'jade');

app.get('/', (req, res) => {
  if (req.session.oauth_status !== 'authenticated') {
    res.redirect('/auth');
    return;
  }
  res.render('index');
});

app.get('/posts', (req, res) => {
  if (req.session.oauth_status !== 'authenticated') {
    res.end();
    return;
  }
  else if (!'offset' in req.query) {
    res.end();
    return;
  }

  var client = tumblr.createClient({
    consumer_key: tumblr_consumer_key,
    consumer_secret: tumblr_consumer_secret,
    token: req.session.oauth_access_token,
    token_secret: req.session.oauth_access_token_secret
  });

  client.dashboard({
    offset: req.query.offset
  }, (err, data) => {
    if (err) {
      console.log(err);
      res.end();
      return;
    }

    res.contentType('application/json');
    res.send(JSON.stringify(data));
  });
});

app.get('/auth', (req, res) => {
  if (req.session.oauth_status === 'authenticated') {
    res.redirect('/');
  }
  else {
    oa.getOAuthRequestToken((err, oauth_token, oauth_token_secret, results) => {
      if (err) {
        console.log(err);
        res.end();
        return;
      }

      req.session.oauth_token = oauth_token;
      req.session.oauth_token_secret = oauth_token_secret;
      req.session.oauth_status = 'initialized';
      res.redirect(`http://www.tumblr.com/oauth/authorize?oauth_token=${oauth_token}`);
    });
  }
});

app.get('/callback', (req, res) => {
  if (req.session.oauth_status === 'initialized') {
    oa.getOAuthAccessToken(
      req.session.oauth_token,
      req.session.oauth_token_secret,
      req.query.oauth_verifier,
      (err, oauth_access_token, oauth_access_token_secret, results) => {
        if (err) {
          console.log(err);
          res.end();
          return;
        }

        req.session.oauth_access_token = oauth_access_token;
        req.session.oauth_access_token_secret = oauth_access_token_secret;
        req.session.oauth_status = 'authenticated';
        res.redirect('/');
      }
    );
  }
  else {
    res.redirect('/');
  }
});

server.listen(hostURL.port || process.env.PORT, () => {
  console.log(`listening on ${hostURL.host}`);
});
