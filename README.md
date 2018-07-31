# Next Metrics

A library for sending metrics to Graphite, that also provides drop in instrumentation for standard parts of Next applications e.g. [Express](https://expressjs.com/).

## Usage

## Getting started

Create an instance of the Metrics object:

```javascript
const metrics = require('next-metrics');
```

Initialise it:

```javascript
metrics.init({
    app: 'example',
    flushEvery: 5000
});
```

Instrument the response object:

```javascript
app.get('/', function (req, res) {
    metrics.instrument(res, { as: 'express.http.res' });
    res.send('hello')
}
```

To allocate the response's metrics to a separate bucket to all other responses set `res.nextMetricsName = 'name_of_bucket'`

Add a counter for an arbitrary event in the application,

```javascript
var server = app.listen(port, function () {
    metrics.count('express.start', 1);
})
```

See the [example app](./examples/app.js) for more information.

## Configuration

To use this libary you need to set an environment variable `FT_GRAPHITE_APIKEY`.
This library will automatically pick up that environment variable and use it
to authenticate with FT's internal Graphite server when sending metrics.

This library will only send metrics when it is running in production
(`NODE_ENV=production`).

If you don't want to send metrics from an app in production, you must explicitly
set the value of `FT_GRAPHITE_APIKEY` to `false`.

_Note: Don't use the production FT Graphite API key on your `localhost` as you will fill up FT's internal Graphite server with your local data!_

The `Metrics.init` method takes the following options:

* `app` (required) - `string` - Application name e.g. router
* `flushEvery` (required) - `integer|boolean` - Specify how frequently you want metrics pushed to Graphite, or `false` if you want to do it manually with `.flush()`
* `forceGraphiteLogging` (optional) - `boolean` - Set to `true` if you want to log metrics to Graphite from code running in a non-production environment (when `NODE_ENV != production`)
* `platform` (optional, default: heroku) - `string` - Specify a custom platform name in the [Graphite key](#metrics)
* `instance` (optional, default: dynamically generated string) - `string|boolean` - Specify a custom instance name in the [Graphite key](#metrics), or set to `false` to omit it
* `useDefaultAggregators` (optional, default: true) - `boolean` - Set to `false` if you want to disable default aggregators

## Instrumentation

The libary _understands_ certain types of objects within our set of
applications. This saves everyone implementing boilerplate metrics code and
avoids different applications inventing their own core measurements.

For example, to instrument an Express response object, put this inside one of
your route handlers:

```javascript
metrics.instrument(res, { as: 'express.http.res' });
```

The first argument is the object you want to instrument, and the second
argument specifies what type of object it is.

## Metrics

Data is logged in the form of Graphite keys (dots denote hierarchy):

```
<platform>.<application>.<instance>.<metric>   <value>
```

e.g.

```
heroku.ads-api.web_1_process_cluster_worker_1_EU.express.concept_GET.res.status.200.time.sum 325.6
heroku.ads-api.web_1_process_cluster_worker_1_EU.system.process.mem_process_heapUsed 16213144
```

You can view data in [Graphite](http://graphite.ft.com/), or in a more user-friendly UI through [Grafana](http://grafana.ft.com).
