'use strict';
/*global describe, it, beforeEach, afterEach*/

// TODO this should be moved to use the newer test format.
// See files in test/unit

const Graphite = require('../../lib/graphite/client');
const expect = require('chai').expect;
const mitm = require('mitm');	// 'man in the middle' socket proxy

describe('Logging to graphite', function () {

	beforeEach(function () {
		this.mitm = mitm();
	});

	afterEach(function () {
		this.mitm.disable();
	});

	it('Send metrics to Graphite', function (done) {
		this.mitm.on('connection', function (socket) {
			socket.on('data', function (d) {
				expect(d).to.be.instanceof(Buffer);
				done();
			});
		});
		const g = new Graphite({
			destination: {
				port: 2003,
				host: 'test.host.com'
			},
			prefix: 'p.',
			noLog: false
		});
		g.log({ a: 1, b: 2, c: null });
	});

});
