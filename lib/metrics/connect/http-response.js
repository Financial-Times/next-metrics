const _ = require('lodash');

const metrics = require('metrics');

const HttpResponse = module.exports = function () {
	const CreateUniformHistogram = metrics.Histogram.createUniformHistogram;
	this.counters = {
		status_2xx:  new metrics.Counter(),
		status_3xx:  new metrics.Counter(),
		status_301:  new metrics.Counter(),
		status_302:  new metrics.Counter(),
		status_4xx:  new metrics.Counter(),
		status_5xx:  new metrics.Counter(),
		status_2xx_response_time: new CreateUniformHistogram()
	};
	this.reporter = this.reporter.bind(this);
};

HttpResponse.prototype.instrument = function (res) {

	res.writeHead = this._writeHead(res.writeHead);

	let self = this;
	let dt = new Date();

	// event emitted
	res.on('prefinish', function () {
		self.counters.status_2xx_response_time.update(Date.now() - dt);
	});

};

HttpResponse.prototype.reset = function () {
	_.forEach(this.counters, function (counter) {
		counter.clear();
	});
};

HttpResponse.prototype.counts = function () {
	let c = this.counters;
	return _.zipObject(
		[
			'http.res.status_2xx_response_time.mean',
			'http.res.status_2xx_response_time.stdDev',
			'http.res.status_2xx_response_time.min',
			'http.res.status_2xx_response_time.max',
			'http.res.status_2xx_response_time.sum',
			'http.res.status_2xx.count',
			'http.res.status_3xx.count',
			'http.res.status_301.count',
			'http.res.status_302.count',
			'http.res.status_4xx.count',
			'http.res.status_5xx.count',
		],
		[
			c.status_2xx_response_time.mean(),
			c.status_2xx_response_time.stdDev(),
			c.status_2xx_response_time.min,
			c.status_2xx_response_time.max,
			c.status_2xx_response_time.sum,
			c.status_2xx.count,
			c.status_3xx.count,
			c.status_301.count,
			c.status_302.count,
			c.status_4xx.count,
			c.status_5xx.count
		]
	);
};

HttpResponse.prototype.reporter = function () {
	let counts = this.counts();
	this.reset();
	return counts;
};

// proxy for res.writeHead - http://nodejs.org/api/http.html#http_response_writehead_statuscode_reasonphrase_headers
HttpResponse.prototype._writeHead = function (fn) {
	let self = this;
	return function () {
		const statusCode = parseInt('' + arguments[0], 10);
		const statusKind = parseInt(statusCode.toString().charAt(0), 10);
		switch (statusKind) {
			case 2:
				self.counters.status_2xx.inc(1);
				break;
			case 3:
				self.counters.status_3xx.inc(1);
				switch (statusCode) {
					case 301:
						self.counters.status_301.inc(1);
						break;
					case 302:
						self.counters.status_302.inc(1);
						break;
					default:
				}
				break;
			case 4:
				self.counters.status_4xx.inc(1);
				break;
			case 5:
				self.counters.status_5xx.inc(1);
				break;
			default:
		}
		fn.apply(this, arguments);
	};

};
