'use strict';

var express     = require('express');
var app         = express();
  
var Metrics = require('../lib/metrics')({ app: 'example', flushEvery: 5000 });

app.get('/', function (req, res) {

    Metrics.instrument(req, { as: 'http.req' });
    Metrics.instrument(req, { as: 'http.res' });
    
    res.status(200).send('hello');

})

Metrics.instrument(server, { 'as': 'http.server' });

var port = Number(process.env.PORT || 5005);

var server = app.listen(port, function () {
    console.log('listening on port', port);
})
