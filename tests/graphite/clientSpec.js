'use strict';
/*global describe, it, beforeEach, afterEach*/

var Graphite	= require('../../lib/graphite/client');
var expect		= require('chai').expect;
var mitm		= require("mitm");	// 'man in the middle' socket proxy
var sinon		= require("sinon");

describe('Session Service', function() {

	beforeEach(function () {
		this.mitm = mitm();
		this.mitm.on("connect", function(socket, opts) {
			if (opts.host !== "carbon.hostedgraphite.com") socket.bypass();
		});
	});

	afterEach(function () {
		this.mitm.disable();
	});

	it('Send metrics to Graphite', function (done) {
		sinon.useFakeTimers(new Date('Mon, 15 Jun 2015 20:12:01 UTC').getTime());
		this.mitm.on("connection", function(socket) {
			socket.on('data', function (d) {
				expect(d.toString('utf-8')).to.equal("k.p.a 1 1434399121\nk.p.b 2 1434399121\n");
				done();
			});
		});
		var g = new Graphite({ apiKey: 'k.', prefix: 'p.', noLog: false });
		g.log({ a: 1, b: 2, c: null });
	});

});
