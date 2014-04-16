'use strict';

var express = require('express'),
	config = require('./config.js');

var app = express();

app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(config.PORT);