'use strict';
/*global describe, it, beforeEach, afterEach*/

// TODO this should be moved to use the newer test format.
// See files in test/unit

const Graphite = require('../../lib/graphite/client');
const expect = require('chai').expect;
const mitm = require('mitm');	// 'man in the middle' socket proxy
const sinon = require('sinon');

describe('Logging to graphite', function () {
	let clock;

	beforeEach(function () {
		clock = sinon.useFakeTimers(new Date('Mon, 15 Jun 2015 20:12:01 UTC').getTime());
		this.mitm = mitm();
		this.mitm.on('connect', function (socket, opts) {
			if (opts.host !== 'test.host.com') socket.bypass();
		});
	});

	afterEach(function () {
		this.mitm.disable();
		clock.restore();
	});

	it('Send metrics to Graphite', function (done) {
		this.mitm.on('connection', function (socket) {
			socket.on('data', function (d) {
				expect(d.toString('utf-8')).to.equal('k.p.a 1 1434399121\nk.p.b 2 1434399121\n');
				done();
			});
		});
		const g = new Graphite({
			destinations: [{
				port: 2003,
				host: 'test.host.com',
				key: 'k.'
			}],
			prefix: 'p.',
			noLog: false
		});
		g.log({ a: 1, b: 2, c: null });
	});

});


// metrics.init({ app: name, flushEvery: 40000 });
// 	app.use(function(req, res, next) {
// 		metrics.instrument(req, { as: 'express.http.req' });
// 		metrics.instrument(res, { as: 'express.http.res' });
// 		next();
// 	});
