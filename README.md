
Drop in metrics for Next Express JS applications, sent to Graphite.

## Goals

- Drop in instrumentation for standard parts of the applications - express, ft-api-client etc.
- Push data to Graphite.
- Allow for [arbitrary metrics](https://github.com/mikejihbe/metrics) to be added.

## Usage

Create an instance of the Metrics object,

	var Metrics = require('next-metrics');

Initialise it,

	Metrics.init({
		app: 'example',
		flushEvery: 5000
	});

Instrument the response object,

	app.get('/', function (req, res) {
		Metrics.instrument(res, { as: 'express.http.res' });
		res.send('hello')
	}

To allocate the response's metrics to a separate bucket to all other responses set `res.nextMetricsName = 'name_of_bucket'`

Add a counter for an arbitrary event in the application,

	var server = app.listen(port, function () {
		Metrics.count('express.start', 1);
	})

See the [example app](./examples/app.js) for more information.

## Configuration

The library requires your key to
[hostedgraphite.com](http://www.hostedgraphite.com) to be set in the
environment, this will send metrics to both hostedgraphite and FT's internal Graphite (using the same API key):

	export HOSTEDGRAPHITE_APIKEY=...

To specify different API keys for hosted vs internal Graphite:

	export HOSTEDGRAPHITE_APIKEY=...
	export FT_GRAPHITE_APIKEY=...

If you _only_ want to send metrics to FT's internal Graphite, you can set `HOSTEDGRAPHITE_APIKEY` to `false` and only set an internal API key:

	export HOSTEDGRAPHITE_APIKEY=false
	export FT_GRAPHITE_APIKEY=...

Do not use the production key on you localhost as you will fill up the Graphite
production environment account with you local data.

To obtain a key you provision the hostedgraphite addon against a personal app.

The Metrics object takes the following options,

* app (required) - A string containing the application name, Eg. router, dobi, engels ...
* flushEvery (required) - A number indicating how frequently you want the metrics pushed to Graphite, or `false` if you want to do it manually (i.e. using `.flush()`)
* hostedApiKey (optional) - The API key for hostedgraphite. This defaults to the environment variable `HOSTEDGRAPHITE_APIKEY`, but this configuration overrides that. Set to `false` to disable hostedgraphite.
* ftApiKey (optional) - The API key for the FT's internal Graphite. This defaults to the environment variable `FT_GRAPHITE_APIKEY`, but this configuration overrides that. Set to `false` to disable internal Graphite.

## Instrumentation

The libary _understands_ certain types of objects within our set of
applications. This saves everyone implementing boilerplate metrics code and
avoids different applications inventing their own core measurements.

For example, to instrument an Express response object put this inside one of
your route handlers,

	Metrics.instrument(res, { as: 'express.http.res' });

The first argument is the object you want instrumenting, and the second
argument specifies what type of object it is.

## Metrics

Data is logged in the form of Graphite keys (dots denote hierarchy),

	<api-key>.<environment>.<application>.<dyno>.<metric> <value>

Eg,

	d3fe0b06-9e43-11e3-b429-00144feab7de.localhost.example._.system.mem_process_heapUsed 16213144
	d3fe0b06-9e43-11e3-b429-00144feab7de.localhost.example._.http.res.status_2xx_response_time.mean 758.5
	d3fe0b06-9e43-11e3-b429-00144feab7de.localhost.example._.http.res.status_2xx_response_time.stdDev 727.61

Access to graphite is available through the 'ft-next-router-v002' Heroku dashboard.
