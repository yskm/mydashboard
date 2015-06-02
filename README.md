# tumblideshow

Real-time slideshow app for Tumblr

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## installation

### local

export environment vars

    $ export TS_CONSUMER_KEY=your_tumblr_consumer_key
    $ export TS_CONSUMER_SECRET=your_tumblr_consumer_secret
    $ export TS_SESSION_SECRET=your_session_secret

start server

    $ npm start

### heroku

prepare heroku app

    $ heroku create
    $ heroku addons:create rediscloud

set environment vars

    $ heroku config:set TS_CONSUMER_KEY=your_tumblr_consumer_key
    $ heroku config:set TS_CONSUMER_SECRET=your_tumblr_consumer_secret
    $ heroku config:set TS_SESSION_SECRET=your_session_secret
    $ heroku config:set TS_HOST_URL=https://your_herokuapp_name.herokuapp.com/

deploy

    $ git push heroku master
