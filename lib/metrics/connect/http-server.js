const _ = require('lodash');

const metrics = require('metrics');

const HttpServer = module.exports = function () {

	this.counters = {

		// socket - each request is a socket
		socket_error:	new metrics.Counter(),
		socket_finish:  new metrics.Counter(),
		socket_timeout: new metrics.Counter(),
		socket_close:	new metrics.Counter(),
		socket_drain:	new metrics.Counter(),
		socket_data:	new metrics.Counter(),

		// server
		server_request:			new metrics.Counter(),
		server_close:			new metrics.Counter(),
		server_checkContinue:	new metrics.Counter(),
		server_connect:			new metrics.Counter(),
		server_upgrade:			new metrics.Counter(),
		server_clientError:		new metrics.Counter(),
		server_error:			new metrics.Counter(),
		server_listening:		new metrics.Counter()

	};
	this.reporter = this.reporter.bind(this);
};

HttpServer.prototype.instrument = function (server) {

	let self = this;

	server.on('connection', function (socket) {

		socket.on('error', function () {
			self.counters.socket_error.inc();
		});

		socket.on('finish', function () {
			self.counters.socket_finish.inc();
		});

		socket.on('timeout', function () {
			self.counters.socket_timeout.inc();
		});

		socket.on('close', function () {
			self.counters.socket_close.inc();
		});

		socket.on('drain', function () {
			self.counters.socket_drain.inc();
		});

		socket.on('data', function () {
			self.counters.socket_data.inc();
		});

	});

	server.on('request', function () {
		self.counters.server_request.inc();
	});

	server.on('close', function () {
		self.counters.server_close.inc();
	});

	server.on('checkContinue', function () {
		self.counters.server_checkContinue.inc();
	});

	server.on('connect', function () {
		self.counters.server_connect.inc();
	});

	server.on('upgrade', function () {
		self.counters.server_upgrade.inc();
	});

	server.on('clientError', function () {
		self.counters.server_clientError.inc();
	});

	server.on('error', function () {
		self.counters.server_error.inc();
	});

	server.on('listening', function () {
		self.counters.server_listening.inc();
	});

};

HttpServer.prototype.reset = function () {
	_.forEach(this.counters, function (counter) {
		counter.clear();
	});
};

HttpServer.prototype.reporter = function () {
	let counts = this.counts();
	this.reset();
	return counts;
};

HttpServer.prototype.counts = function () {
	let c = this.counters;
	return _.zipObject(
		[
			'server.events.socket.error.count',
			'server.events.socket.finish.count',
			'server.events.socket.timeout.count',
			'server.events.socket.close.count',
			'server.events.socket.drain.count',
			'server.events.socket.data.count',
			'server.events.socket.request.count',
			'server.events.socket.close.count',
			'server.events.server.checkContinue.count',
			'server.events.server.connect.count',
			'server.events.server.upgrade.count',
			'server.events.server.clientError.count',
			'server.events.server.error.count',
			'server.events.server.listening.count'
		],
		[
			c.socket_error.count,
			c.socket_finish.count,
			c.socket_timeout.count,
			c.socket_close.count,
			c.socket_drain.count,
			c.socket_data.count,
			c.server_request.count,
			c.server_close.count,
			c.server_checkContinue.count,
			c.server_connect.count,
			c.server_upgrade.count,
			c.server_clientError.count,
			c.server_error.count,
			c.server_listening.count
		]
	);
};
