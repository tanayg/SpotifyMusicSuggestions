// Module Dependencies
var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var logger = require('morgan');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request');
var Buffer = require('Buffer');
var SpotifyWebApi = require('spotify-web-api-node');


// Setup
var app = express();

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());


// Home Page
app.get('/', function (req, res, next) { 
  res.render('home');
})


// Spotify variables
var client_id = '8121c945a73d47149feb3d7368cf6241';
var client_secret = 'bbbc6f25ed394a60a774fed961cb9fc1';
var redirect_uri = 'http://localhost:3000/callback';
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
var stateKey = 'spotify_auth_state';

var spotifyApi = new SpotifyWebApi({
  client_id: '8121c945a73d47149feb3d7368cf6241',
  client_secret: 'bbbc6f25ed394a60a774fed961cb9fc1',
  redirect_uri: 'http://localhost:3000/callback'
})


// Log in page
app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // application requests authorization
  var scope = 'user-top-read user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


// Spotify login redirects here
app.get('/callback', function(req, res) { //requests refresh and access tokens after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        spotifyApi.setAccessToken(access_token);

        // Long Term
        spotifyApi.getMyTopTracks({
          limit : 50,
          offset : 0,
          time_range : 'long_term'
        }).then(
          function(data) {
            console.log('Artist albums', data.body);
          },
          function(err) {
            console.error(err);
          }
        );

        // Medium Term
        spotifyApi.getMyTopTracks({
          limit : 50,
          offset : 0,
          time_range : 'medium_term'
        }).then(
          function(data) {
            console.log('Artist albums', data.body);
          },
          function(err) {
            console.error(err);
          }
        );

        // Short Term
        spotifyApi.getMyTopTracks({
          limit : 50,
          offset : 0,
          time_range : 'short_term'
        }).then(
          function(data) {
            console.log('Artist albums', data.body);
          },
          function(err) {
            console.error(err);
          }
        );

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
  res.render('top');
});

app.get('/refresh_token', function(req, res) {// requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.listen(3000);