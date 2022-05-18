# Next Metrics

A library for sending metrics to Graphite, that also provides drop in instrumentation for standard parts of Next applications e.g. [Express](https://expressjs.com/).

> ℹ️ this repo is one of the oldest in FT.com, and so it doesn't follow our current [naming conventions](https://github.com/financial-times/next/wiki/Naming-Conventions#bower-and-npm-modules); because it's a library, not an app, it _should_ be called `n-metrics`. unfortunately, it's used in [way too many places](https://github.com/search?q=org%3AFinancial-Times+%22next-metrics%22&type=Code) to easily rename.

## Usage

### Getting started

Create an instance of the Metrics object:

```javascript
const metrics = require("next-metrics");
```

Initialise it:

```javascript
metrics.init({
  app: "example",
  flushEvery: 5000,
});
```

Instrument the response object:

```javascript
app.get("/", function (req, res) {
  metrics.instrument(res, { as: "express.http.res" });
  res.send("hello");
});
```

To allocate the response's metrics to a separate bucket to all other responses set `res.nextMetricsName = 'name_of_bucket'`

Add a counter for an arbitrary event in the application,

```javascript
var server = app.listen(port, function () {
  metrics.count("express.start", 1);
});
```

### Configuration

To use this libary you need to set an environment variable named
`FT_GRAPHITE_APP_UUID`. This library will automatically pick up that
environment variable and use it to authenticate with FT's internal
Graphite server when sending metrics.

This library will only send metrics when it is running in production
(`NODE_ENV=production`).

If you don't want to send metrics from an app in production, you must explicitly
set the value of `FT_GRAPHITE_APP_UUID` to `false`.

_Note: Don't use the production FT Graphite API key on your `localhost` as you will fill up FT's internal Graphite server with your local data!_

The `Metrics.init` method takes the following options:

- `flushEvery` (required) - `integer|boolean` - Specify how frequently you want metrics pushed to Graphite, or `false` if you want to do it manually with `.flush()`
- `forceGraphiteLogging` (optional) - `boolean` - Set to `true` if you want to log metrics to Graphite from code running in a non-production environment (when `NODE_ENV != production`)
- `instance` (optional, default: dynamically generated string) - `string|boolean` - Specify a custom instance name in the [Graphite key](#metrics), or set to `false` to omit it
- `useDefaultAggregators` (optional, default: true) - `boolean` - Set to `false` if you want to disable default aggregators
- [DEPRECATED] `app` (required) - `string` - Application name e.g. router
- [DEPRECATED] `platform` (optional, default: heroku) - `string` - Specify a custom platform name in the [Graphite key](#metrics)

### Checking configuration

Configuration errors are logged using [`n-logger`](https://github.com/Financial-Times/n-logger).
It depends on your app configuration, but in most cases, for an app running
in production the logs will be sent to Splunk.

The `Metrics` class exposes a `hasValidConfiguration` boolean property which
you can use to determine if an instance of `Metrics` is correctly configured
to talk to FT Graphite. You might find it useful to check this property
after calling the `Metrics.init` method. See '[Custom use cases](#custom-use-cases)'
for more information on the `Metrics` class.

### Custom use cases

Typically you'll only want a single instance of the [`Metrics`](https://github.com/Financial-Times/next-metrics/blob/HEAD/lib/metrics.js)
class to be used by your application. Because of this, when you
require `next-metrics`, the default export from the module is an
instance of [`Metrics`](https://github.com/Financial-Times/next-metrics/blob/HEAD/lib/metrics.js),
which effectively acts as a singleton.

If you have a custom use case, this module exposes a couple of internal
classes that might help you out:

```javascript
// Create your own instance of Metrics
const { Metrics } = require("next-metrics");
const fetch = require('node-fetch');
const metrics = new Metrics();

metrics.init({
  platform: "custom-platform",
  app: "some-app",
  instance: false,
  useDefaultAggregators: false,
  flushEvery: false,
  forceGraphiteLogging: true,
  fetchInstance : fetch, // fetch instance to make request, if we do not pass an instance isomorphic-fetch would be the default fetch instance and will be assigned to global.fetch
  overrideGlobalFetch: true, //  use to indicate if our fetchInstance should override global.fetch, true by default .
});

metrics.count("some_filename.size", 2454589);
metrics.count("some_filename.gzip_size", 45345);

metrics.flush();

// Send raw metrics directly to a Graphite server
const { GraphiteClient } = require("next-metrics");

const graphite = new GraphiteClient({
  destination: {
    port: 2003,
    host: "some.host.com",
  },
  prefix: "some_prefix.",
  noLog: false,
});

graphite.log({
  "build.time": 536,
  "build.count": 1,
});
```

## Instrumentation

The libary _understands_ certain types of objects within our set of
applications. This saves everyone implementing boilerplate metrics code and
avoids different applications inventing their own core measurements.

For example, to instrument an Express response object, put this inside one of
your route handlers:

```javascript
metrics.instrument(res, { as: "express.http.res" });
```

The first argument is the object you want to instrument, and the second
argument specifies what type of object it is.

## Services

`next-metrics` logs details of `fetch` requests your app makes, by instrumenting [`isomorphic-fetch`](https://github.com/matthew-andrews/isomorphic-fetch). or the instance that you pass on the option fetchInstance in method init. If we set the option overrideGlobalFetch to false and a fetchInstance , global.fetch wont be override or assigned with our instrumented instance.

So that these metrics are properly grouped and labelled in Graphite, you need to register any HTTP endpoint you call in [`services.js`](https://github.com/Financial-Times/next-metrics/blob/HEAD/lib/metrics/services.js). Any endpoint you call that _isn't_ registered will cause [a default `n-express` healthcheck](https://github.com/Financial-Times/n-express/blob/HEAD/src/lib/unregistered-services-healthCheck.js) to fail.

If the `Metrics: All services for ${appName} registered in next-metrics` healthcheck starts failing, check the healthcheck output to see which URLs aren't registered, add them to `services.js`, and tag a new release of `next-metrics`. You'll also need to update `n-express` to use your new `next-metrics` version, then update `n-express` in your app.

The keys in the object are labels that requests are grouped under, and the values are regexes to group by, for example:

```js
module.exports = {
  //...
  access: /^https:\/\/access\.ft\.com/,
};
```

This groups all URLs starting with `https://access.ft.com` as `access` in Graphite.

## Metrics

Data is logged in the form of Graphite keys (dots denote hierarchy):

```
<team>.<platform>.<application>.<instance>.<metric>   <value>
```

e.g.

```
next.heroku.ads-api.web_1_process_cluster_worker_1_EU.express.concept_GET.res.status.200.time.sum 325.6
next.heroku.ads-api.web_1_process_cluster_worker_1_EU.system.process.mem_process_heapUsed 16213144
```

You can view data in [Graphite](http://graphitev2-api.ft.com/), or in a more user-friendly UI through [Grafana](http://grafana.ft.com).
