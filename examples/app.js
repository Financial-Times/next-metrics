'use strict';

var express     = require('express');
var app         = express();
var Metrics     = require('../lib/metrics');
var ft          = require('ft-api-client')(process.env.apikey, {});

// Only do this once per application
Metrics.init({ app: 'example', flushEvery: 5000 });

// Test that we can set metrics inside other routes 
app.get('/route', require('./route'));

Metrics.instrument(ft, { as: 'ft-api-client' });

app.get('/ft-api-route', function (req, res) {
    ft 
        .search('Climate change')
        .then(function (article) {
            res.send(article)
        }, function (err) {
            res.send(err)
        });
});

// Instrument the req, res objects
app.get('/', function (req, res) {

    Metrics.instrument(req, { as: 'express.http.req' });
    Metrics.instrument(res, { as: 'express.http.res' });
    
    var statii = [200, 200, 200, 201, 202, 302, 301, 402, 404, 500, 503]
    var status = statii[Math.floor(Math.random()*statii.length)];

    var responseTime = (Math.random()*2)*1000;
    
    setTimeout(function () {
        res.status(status).send('hello');
    }, responseTime);
})


var port = Number(process.env.PORT || 5005);

var server = app.listen(port, function () {
    Metrics.count('express.start');
    console.log('listening on port', port);
})
