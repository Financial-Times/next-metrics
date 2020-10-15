'use strict';
/*global describe, it, beforeEach, afterEach*/

// TODO this should be moved to use the newer test format.
// See files in test/unit

const Metrics	= require('../../lib/metrics');
const expect		= require('chai').expect;
const sinon		= require('sinon');
const request = require('supertest');
const express = require('express');

describe('Http metrics', function () {
	let app;
	let clock;
	let metrics;

	beforeEach(function () {
		clock = sinon.useFakeTimers();
		metrics = new Metrics();
		metrics.init({ flushEvery: 100 });
		app = express();

		app.use(function (req, res, next) {
			metrics.instrument(req, { as: 'express.http.req' });
			metrics.instrument(res, { as: 'express.http.res' });
			next();
		});

		app.get('/200', (req, res) => {
			if (req.query.name) {
				res.nextMetricsName = req.query.name;
			}
			res.sendStatus(200);
		});

		app.put('/404', (req, res) => {
			res.sendStatus(404);
		});

		app.post('/503', (req, res) => {
			res.sendStatus(503);
		});

		app.get('/__health', (req, res) => {
			res.sendStatus(200);
		});

		sinon.spy(metrics.graphites[0], 'log');
	});

	afterEach(function () {
		metrics.graphites[0].log.restore();
		clock.restore();
	});

	it('Collect request metrics', function (done) {
		request(app)
			.get('/200')
			.end(() => {
				request(app)
					.get('/200')
					.end(() => {
						clock.tick(100);
						expect(metrics.graphites[0].log.args[0][0]['express.http.req.count']).to.equal(2);
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
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_GET.res.status.200.count']).to.equal(2);
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_PUT.res.status.404.count']).to.equal(1);
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_POST.res.status.503.count']).to.equal(1);
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_GET.res.status.200.time.mean']).to.equal(0);
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_PUT.res.status.404.time.mean']).to.equal(0);
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_POST.res.status.503.time.mean']).to.equal(0);
										expect(metrics.graphites[0].log.args[0][0]['express.default_route_POST.res.status.503.time.95th']).to.equal(0);
										done();
									});
							});
					});
			});
	});

	it('Silo dev url metrics', function (done) {
		request(app)
			.get('/__health')
			.end(() => {
				clock.tick(100);
				expect(metrics.graphites[0].log.args[0][0]['express.http.req.count']).to.equal(0);
				expect(metrics.graphites[0].log.args[0][0]['express.http.req.dev.count']).to.equal(1);
				expect(metrics.graphites[0].log.args[0][0]['express.default_route_GET.res.status.200.count']).not.to.exist;
				expect(metrics.graphites[0].log.args[0][0]['express.default_route_GET.res.status.200.time.mean']).not.to.exist;
				expect(metrics.graphites[0].log.args[0][0]['express.dev.res.status.200.count']).to.equal(1);
				expect(metrics.graphites[0].log.args[0][0]['express.dev.res.status.200.time.mean']).to.equal(0);
				done();
			});
	});

	it('Allow naming metric for a response', function (done) {
		request(app)
			.get('/200?name=highway_61')
			.end(() => {
				clock.tick(100);
				expect(metrics.graphites[0].log.args[0][0]['express.highway_61_GET.res.status.200.count']).to.equal(1);
				expect(metrics.graphites[0].log.args[0][0]['express.highway_61_GET.res.status.200.time.mean']).to.exist;
				expect(metrics.graphites[0].log.args[0][0]['express.default_route_GET.res.status.200.count']).to.not.exist;
				expect(metrics.graphites[0].log.args[0][0]['express.default_route_GET.res.status.200.time.mean']).not.to.exist;
				done();
			});
	});

});
