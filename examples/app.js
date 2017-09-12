'use strict';

const express = require('express');
const app = express();
const Metrics = require('../lib/metrics');
const ft = require('ft-api-client')(process.env.apikey, {});
const logger = require('@financial-times/n-logger').default;

// Only do this once per application

// have made this bigger as render metrics requires me to physically refresh the page a bunch of times
Metrics.init({ app: 'example', flushEvery: 10000 });

// Test that we can set metrics inside other routes
app.get('/route', require('./route'));

Metrics.instrument(ft, { as: 'ft-api-client' });

app.get('/ft-api-route', function (req, res) {
	ft
		.search('Climate change')
		.then(function (article) {
			res.send(article);
		}, function (err) {
			res.send(err);
		});
});

// setup swig
const swig = require('swig');
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Instrument the req, res objects
app.get('/', function (req, res) {
	Metrics.instrument(req, { as: 'express.http.req' });
	Metrics.instrument(res, { as: 'express.http.res' });

	let statii = [200, 200, 200, 201, 202, 302, 301, 402, 404, 500, 503];
	let status = statii[Math.floor(Math.random()*statii.length)];

	let responseTime = (Math.random()*2)*1000;

	setTimeout(function () {
		res.status(status).send('hello');
	}, responseTime);
});



app.get('/render/:count?', function (req, res){
	Metrics.instrument(res, { as: 'express.http.res' });

	let data = [];
	let count = req.params.count ? parseInt(req.params.count,10) : 0;
	for(let i= 0; i<count; i++){
		data.push(i);
	}

	res.render('folder/test', {data:data});
});


const port = Number(process.env.PORT || 5005);

app.listen(port, function () {
	Metrics.count('express.start');
	logger.info('listening on port', port);
});
