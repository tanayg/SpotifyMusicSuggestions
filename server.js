// Module Dependencies
var express = require('express')
var stylus = require('stylus')
var nib = require('nib')
var logger = require('morgan')
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// Spotify variables
var client_id = '8121c945a73d47149feb3d7368cf6241'
var client_secret = 'bbbc6f25ed394a60a774fed961cb9fc1'
var redirect_uri = 'http://localhost:3000/home'

var app = express()
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(logger('dev'))
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))


app.get('/', function (req, res) { //Redirects to home page
  //res.end('Hello World!')
  res.redirect('/home')
})


app.get('/home', function(req, res, next){  //Landing page
  res.render('home')
})


app.get('/login', function(req, res, next){  //Login page
  res.end('Login Page')
})

app.listen(3000)