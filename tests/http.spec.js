'use strict';
/*global describe, it, before, after, beforeEach, afterEach*/

const metrics	= require('../lib/metrics');
const expect		= require('chai').expect;
const sinon		= require("sinon");
const request = require('supertest');
const express = require('express');

describe('Http metrics', function() {
	let app;
	let clock;

	before(() => {
		clock = sinon.useFakeTimers();

		metrics.init({ app: 'test', flushEvery: 100 });
		app = express();

		app.use(function(req, res, next) {

			metrics.instrument(req, { as: 'express.http.req' });
			metrics.instrument(res, { as: 'express.http.res' });
			next();
		});

		app.get('/200', (req, res) => {
			res.sendStatus(200);
		});

		app.put('/404', (req, res) => {
			res.sendStatus(404);
		});

		app.post('/503', (req, res) => {
			res.sendStatus(503);
		});
	});

	after(() => clock.restore());

	beforeEach(function () {
		sinon.stub(metrics.graphite, 'log');
	});

	afterEach(function () {
		metrics.graphite.log.restore();
	});

	it('Collect request metrics', function (done) {
		request(app)
			.get('/200')
			.end(() => {
				request(app)
					.get('/200')
					.end(() => {
						clock.tick(100);
						expect(metrics.graphite.log.args[0][0]['express.http.req.count']).to.equal(2);
						done();
					});
			});
	});

	it('Collect response metrics', function (done) {
		request(app)
			.get('/200')
			.end(() => {
				request(app)
					.get('/200')
					.end(() => {
						request(app)
							.put('/404')
							.end(() => {
								request(app)
									.post('/503')
									.end(() => {
										clock.tick(100);
										expect(metrics.graphite.log.args[0][0]['express.default_route_GET.res.status.200.count']).to.equal(2);
										expect(metrics.graphite.log.args[0][0]['express.default_route_PUT.res.status.404.count']).to.equal(1);
										expect(metrics.graphite.log.args[0][0]['express.default_route_POST.res.status.503.count']).to.equal(1);
										expect(metrics.graphite.log.args[0][0]['express.default_route_GET.res.status.200.time.mean']).to.equal(0);
										expect(metrics.graphite.log.args[0][0]['express.default_route_PUT.res.status.404.time.mean']).to.equal(0);
										expect(metrics.graphite.log.args[0][0]['express.default_route_POST.res.status.503.time.mean']).to.equal(0);
										done();
									});
							});
					});
			});
	});

});
