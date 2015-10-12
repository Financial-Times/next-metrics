'use strict';
var metrics = require('metrics');
var serviceMatchers = {
	'amo': /^https?:\/\/barrier-app.memb\.ft\.com\/memb\/amo\/v1\/amo-data/,
	'blogs': /^https?:\/\/blogs\.ft\.com/,
	'capi-v1-article': /^https?:\/\/api\.ft\.com\/content\/items\/v1\/[\w\-]+/,
	'capi-v1-page': /^https?:\/\/api\.ft\.com\/site\/v1\/pages\/[\w\-]+/,
	'capi-v1-pages-list': /^https?:\/\/api\.ft\.com\/site\/v1\/pages/,
	'capi-v1-navigations': /^https?:\/\/api\.ft\.com\/site\/v1\/navigations/,
	'sapi': /^https?:\/\/api\.ft\.com\/content\/search\/v1/,
	'aws-elastic-v1-article': /^https?:\/\/[\w\-]+\.[\w\-]+\.es\.amazonaws\.com\/v1_api_v2\/item/,
	'aws-elastic-v2-article': /^https?:\/\/[\w\-]+\.[\w\-]+\.es\.amazonaws\.com\/v2_api_v[12]\/item/,
	'aws-elastic-v1-item-search': /^https?:\/\/[\w\-]+\.[\w\-]+\.es\.amazonaws\.com\/v1_api_v2\/item\/_search/,
	'aws-elastic-v2-item-search': /^https?:\/\/[\w\-]+\.[\w\-]+\.es\.amazonaws\.com\/v2_api_v2\/item\/_search/,
	'aws-elastic-v1-search': /^https?:\/\/[\w\-]+\.[\w\-]+\.es\.amazonaws\.com\/v1_api_v2\/_search/,
	'aws-elastic-v2-search': /^https?:\/\/[\w\-]+\.[\w\-]+\.es\.amazonaws\.com\/v2_api_v2\/_search/,
	'elastic-v1-article': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v1_api_v2\/item/,
	'elastic-v2-article': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v2_api_v[12]\/item/,
	'elastic-v1-item-search': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v1_api_v2\/item\/_search/,
	'elastic-v2-item-search': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v2_api_v2\/item\/_search/,
	'elastic-v1-search': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v1_api_v2\/_search/,
	'elastic-v2-search': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v2_api_v2\/_search/,
	'ft-next-api-user-prefs-v002': /^https?:\/\/ft-next-api-user-prefs-v002\.herokuapp\.com/,
	'api-feature-flags': /^https?:\/\/(?:ft-next-feature-flags-prod\..*\.amazonaws\.com|next-flags\.ft\.com)/,
	'capi-v2-article': /^https?:\/\/api\.ft\.com\/content\/[\w\-]+/,
	'capi-v2-concordances': /^https?:\/\/api\.ft\.com\/concordances\?/,
	'capi-v2-enriched-article': /^https?:\/\/api\.ft\.com\/enrichedcontent\/[\w\-]+/,
	'capi-v2-lists': /^https?:\/\/api\.ft\.com\/lists\/[\w\-]+/,
	'capi-v2-thing': /^https?:\/\/api\.ft\.com\/things\/[\w\-]+/,
	'capi-v2-people': /^https?:\/\/api\.ft\.com\/people\/[\w\-]+/,
	'capi-v2-organisation': /^https?:\/\/api\.ft\.com\/organisations\/[\w\-]+/,
	'capi-v2-content-by-concept': /^https?:\/\/api\.ft\.com\/content\?isAnnotatedBy=http:\/\/api\.ft\.com\/things\/[\w\-]+/,
	// fastft
	'fastft': /https?:\/\/clamo\.ftdata\.co\.uk\/api/,
	// ft.com (temporary for article comment hack)
	'ft-com': /^https?:\/\/www\.ft\.com\/cms\/s\/[\w\-]+\.html$/,
	'ft-next-beacon': /^https?:\/\/next-beacon\.ft\.com\/px\.gif/,
	'ft-next-session-service': /^https?:\/\/session-next\.ft\.com/,
	'ft-next-ab': /^https?:\/\/ft-next-ab\.herokuapp\.com/,
	'ft-next-concepts-api': /^https?:\/\/ft-next-concepts-api\.herokuapp\.com/,
	'ft-next-markets-proxy-api': /^https?:\/\/next-markets-proxy\.ft\.com/,
	'barriers-api': /^https?:\/\/subscribe.ft.com\/memb\/barrier/,
	'barriers-api-direct': /^https?:\/\/barrier-app\.memb\.ft\.com\/memb\/barrier/,
	'brightcove': /^https?:\/\/api\.brightcove\.com\/services\/library/,
	'bertha': /^https?:\/\/bertha\.ig\.ft\.com/,
	'markets': /^https?:\/\/markets\.ft\.com/,
	'fastly': /^https?:\/\/next\.ft\.com/,
	'fastly-api': /^https?:\/\/api\.fastly\.com/,
	'ft-next-harrier-eu': /^https?:\/\/ft-next-harrier-eu\.herokuapp\.com\//,
	'ft-next-personalised-feed-api': /^https?:\/\/(personalised-feed\.ft\.com|ft-next-personalised-feed-api\.herokuapp\.com)\/v1\/feed/,
	'portfolio': /https?\:\/\/(?:209\.234\.235\.243|portfolio\.ft\.com)/,
	'graphite': /^https?:\/\/www\.hostedgraphite\.com\//,
	'ft-next-sharedcount-api': /^https?:\/\/ft-next-sharedcount-api\.herokuapp\.com/,
	'next-sapi-capi-slurp': /https?\:\/\/next-slurp\.ft\.com/,
	'spoor-uuid-counter': /https?\:\/\/spoor-uuid-counter\.herokuapp\.com/,
	'spoor-ingest': /https?:\/\/spoor-api\.ft\.com\/ingest/,
	'livefyre': /https?\:\/\/ft.bootstrap.fyre.co/,
	'ft-next-myft-api': /https?\:\/\/ft-next-myft-api\.herokuapp\.com/,
	'myft-api': /https?:\/\/myft-api\.ft\.com/,
	'ft-next-service-registry': /http\:\/\/next-registry\.ft\.com/,
	'pingdom': /https\:\/\/api\.pingdom\.com/,
	'popular': /https?:\/\/mostpopular\.sp\.ft-static.com/,
	'popular-topics': /https?:\/\/ft-next-popular-api\.herokuapp\.com/,
	'konstructor': /https?:\/\/konstructor\.ft\.com/,
	'video': /https?:\/\/next-video\.ft\.com/,
	's3o': /https?:\/\/s3o.ft.com/,
	'graphql-api': /^https?:\/\/next-graphql-api\.ft\.com/,
	//Used for next-article healthcheck
	'session-user-data': /^https?:\/\/session-user-data.webservices.ft.com/
};


var Fetch = function() {
	this.counters = {};
};

Fetch.prototype.instrument = function(opts) {
	opts = opts || {};

	if (!GLOBAL.fetch) {
		throw 'You need to require(\'isomorphic-fetch\'); before instrumenting it';
	}
	if (GLOBAL.fetch._instrumented) {
		return console.warn('You can only instrument fetch once. Remember, if you\'re using next-express metrics for most fetch calls are setup automatically');
	}

	this.serviceMatchers = serviceMatchers;
	this.onUninstrumented = opts.onUninstrumented || function() {};
	this.serviceNames = Object.keys(serviceMatchers);

	this.serviceNames.forEach(function(service) {
		this.counters['fetch_' + service + '_requests'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_2xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_2xx_response_time'] = new metrics.Histogram.createUniformHistogram();
		this.counters['fetch_' + service + '_status_3xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_3xx_response_time'] = new metrics.Histogram.createUniformHistogram();
		this.counters['fetch_' + service + '_status_4xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_5xx'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_failed'] = new metrics.Counter();
		this.counters['fetch_' + service + '_status_timeout'] = new metrics.Counter();
	}.bind(this));

	require('../metrics').registerAggregator(this.reporter.bind(this));

	var _fetch = GLOBAL.fetch;

	var that = this; // not using bind as don't want to muck around with fetch's scope

	GLOBAL.fetch = function(url, opts) {
		var service;
		that.serviceNames.some(function(name) {
			if (that.serviceMatchers[name].test(url)) {
				service = name;
				return true;
			}
		});
		if (service) {
			var prefix = 'fetch_' + service;
			that.counters[prefix + '_requests'].inc(1);

			var start = new Date();

			return _fetch.apply(this, arguments)
							.then(function(res) {
								var statusType = res.status ? ('' + res.status).charAt(0) + 'xx' : '2xx';
								var timer = that.counters[prefix + '_status_' + statusType + '_response_time'];
								if (timer) {
									timer.update(new Date() - start);
								}
								that.counters[prefix + '_status_' + statusType].inc(1);
								return res;
							})
							.catch(function(err) {
								if (err.message.indexOf('timeout')) {
									that.counters[prefix + '_status_timeout'].inc(1);
								} else {
									that.counters[prefix + '_status_failed'].inc(1);
								}
								throw err;
							});

		} else {
			that.onUninstrumented.apply(this, arguments);
			return _fetch.apply(this, arguments);
		}
	};

	GLOBAL.fetch._instrumented = true;
	GLOBAL.fetch.restore = function() {
		GLOBAL.fetch = _fetch;
	};
};

Fetch.prototype.reporter = function() {

	var obj = {};

	this.serviceNames.forEach(function(service) {
		var inputPrefix = 'fetch_' + service;
		var outputPrefix = 'fetch.' + service;

		obj[outputPrefix + '.count'] = this.counters[inputPrefix + '_requests'].count;
		this.counters[inputPrefix + '_requests'].clear();

		obj[outputPrefix + '.response.status_2xx.response_time.mean'] = this.counters[inputPrefix + '_status_2xx_response_time'].mean();
		obj[outputPrefix + '.response.status_2xx.response_time.min'] = this.counters[inputPrefix + '_status_2xx_response_time'].min;
		obj[outputPrefix + '.response.status_2xx.response_time.max'] = this.counters[inputPrefix + '_status_2xx_response_time'].max;
		this.counters[inputPrefix + '_status_2xx_response_time'].clear();

		obj[outputPrefix + '.response.status_2xx.count'] = this.counters[inputPrefix + '_status_2xx'].count;
		this.counters[inputPrefix + '_status_2xx'].clear();


		obj[outputPrefix + '.response.status_3xx.response_time.mean'] = this.counters[inputPrefix + '_status_3xx_response_time'].mean();
		obj[outputPrefix + '.response.status_3xx.response_time.min'] = this.counters[inputPrefix + '_status_3xx_response_time'].min;
		obj[outputPrefix + '.response.status_3xx.response_time.max'] = this.counters[inputPrefix + '_status_3xx_response_time'].max;
		this.counters[inputPrefix + '_status_3xx_response_time'].clear();

		obj[outputPrefix + '.response.status_3xx.count'] = this.counters[inputPrefix + '_status_3xx'].count;
		this.counters[inputPrefix + '_status_3xx'].clear();

		obj[outputPrefix + '.response.status_4xx.count'] = this.counters[inputPrefix + '_status_4xx'].count;
		this.counters[inputPrefix + '_status_4xx'].clear();

		obj[outputPrefix + '.response.status_5xx.count'] = this.counters[inputPrefix + '_status_5xx'].count;
		this.counters[inputPrefix + '_status_5xx'].clear();

		obj[outputPrefix + '.response.status_failed.count'] = this.counters[inputPrefix + '_status_failed'].count;
		this.counters[inputPrefix + '_status_failed'].clear();

	}.bind(this));

	return obj;
};

module.exports = Fetch;
