'use strict';
/*global describe, it, beforeEach, afterEach*/

var Graphite	= require('../../lib/graphite/client');
var expect		= require('chai').expect;
var mitm		= require("mitm");	// 'man in the middle' socket proxy

describe('Session Service', function() {

	beforeEach(function () {
		this.mitm = mitm();
	});

	afterEach(function () {
		this.mitm.disable();
	});

	it('Send metrics to Graphite', function (done) {
		this.mitm.on("connection", function(socket) {
			socket.on('data', function (d) {
				expect(d.toString('utf-8')).to.equal("k.p.a 1\nk.p.b 2\n");
				done();
			});
		});
		var g = new Graphite({ apiKey: 'k.', prefix: 'p.', noLog: false });
		g.log({ a: 1, b: 2, c: null });
	});

});
